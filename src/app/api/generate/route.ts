import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptBuilder, GenerateParams } from '@/lib/prompt-engine';
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// 定义请求参数校验规则
const RequestSchema = z.object({
    image_data: z.string().min(100),
    params: z.object({
        mode: z.enum(['hanfu', 'qipao', 'dark', 'arcade', 'comic', 'general']),
        dynasty: z.string().optional(),
        inner: z.string().optional(),
        items: z.string().optional(),
        pose: z.string().optional(),
        cup: z.string().optional(),
        body_type: z.string().optional(),
        face_desc: z.string().optional(),
        outer_desc: z.string().optional(),
        desc: z.string().optional(),
        style: z.string().optional(),
        gen_inner: z.string().optional(),
        accessorySet: z.enum(['A', 'B']).optional(),
        arc_role: z.string().optional(),
        arc_vfx: z.string().optional(),
        arc_color: z.string().optional(),
        comic_role: z.string().optional(),
        comic_vfx: z.string().optional(),
        comic_color: z.string().optional(),
    })
});

export async function POST(req: NextRequest) {
    try {
        // 1. [身份验证]
        const session = await auth();
        if (!session || !session.user?.name) {
            return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 });
        }

        // 2. [查询用户 + 余额预检 + 速率限制检查]
        // 关键修复：必须加上 include: { logs: ... }，否则 TS 会报错，逻辑也会失效
        const user = await prisma.user.findUnique({
            where: { username: session.user.name },
            include: {
                logs: {
                    where: { action: "GENERATE" }, // 只查生图记录，不查充值记录
                    orderBy: { createdAt: 'desc' },
                    take: 1 // 只取最近的一条
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "用户账户异常" }, { status: 404 });
        }

        if (user.balance < 1000) {
            return NextResponse.json({ error: "余额不足 (Insufficient Balance)" }, { status: 402 });
        }

        // [速率限制逻辑]：每 15 秒 1 次 (防止 20 人同时点击触发 Gemini 15 RPM 熔断)
        const lastLog = user.logs[0]; // 因为上面加了 include，这里就不会报错了
        if (lastLog) {
            const timeDiff = Date.now() - new Date(lastLog.createdAt).getTime();
            const COOLDOWN = 15000; // 15秒冷却
            if (timeDiff < COOLDOWN) {
                const waitSeconds = Math.ceil((COOLDOWN - timeDiff) / 1000);
                return NextResponse.json({
                    error: `操作太快了，请休息 ${waitSeconds} 秒`
                }, { status: 429 });
            }
        }

        // 3. [参数解析]
        const body = await req.json();
        const validation = RequestSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid Request", details: validation.error.format() }, { status: 400 });
        }
        const { image_data, params } = validation.data;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) return NextResponse.json({ error: "Config Error" }, { status: 500 });

        // 4. [构建Prompt]
        // 强制类型转换以匹配 keyof
        const modeKey = params.mode as keyof typeof PromptBuilder;
        const builder = PromptBuilder[modeKey];
        if (!builder) return NextResponse.json({ error: `Unsupported mode` }, { status: 400 });
        const promptText = builder(params as GenerateParams);

        // 5. [请求 Gemini 3 Pro]
        const modelId = "gemini-3-pro-image-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        // 来源检查 (安全层)
        if (process.env.NODE_ENV === 'production') {
            const referer = req.headers.get('referer') || '';
            const origin = req.headers.get('origin') || '';
            const allowedDomain = 'panorama-gen-v7.vercel.app'; // 替换为你的真实域名
            const isAllowed = referer.includes(allowedDomain) || origin.includes(allowedDomain);
            if (!isAllowed) console.warn(`[Security Warning] Request from ${referer}`);
        }

        const fetchRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: "image/jpeg", data: image_data } }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        if (!fetchRes.ok) {
            const errText = await fetchRes.text();
            // 捕获 Google 的 429 (Resource Exhausted) 并优雅返回
            if (fetchRes.status === 429) {
                throw new Error("服务繁忙 (Google API Busy)，请稍后再试");
            }
            throw new Error(errText);
        }

        const data = await fetchRes.json();
        const candidate = data.candidates?.[0];

        // Safety Check
        if (!candidate || candidate.finishReason === 'SAFETY') {
            throw new Error("生成失败：触发安全审查 (Safety Filter)");
        }

        const imgBase64 = candidate.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!imgBase64) throw new Error("No image returned");

        // 6. [计费核心逻辑]
        const usage = data.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;
        const totalTokens = inputTokens + outputTokens;

        // 计算扣费 (1.45 倍率，若无 metadata 则保底扣 3000)
        const cost = totalTokens > 0 ? Math.ceil(totalTokens * 1.45) : 3000;

        // 执行数据库更新 (扣费 + 记账)
        // 这里不用 transaction 是因为我们已经在第 2 步检查过余额了，并发风险在冷却时间内可忽略
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: { decrement: cost },
                logs: {
                    create: {
                        action: "GENERATE",
                        amount: -cost,
                        note: `${params.mode} mode (${cost} pts)`
                    }
                }
            }
        });

        // 7. 返回
        return NextResponse.json({
            image_base64: imgBase64,
            generated_prompt: promptText,
            billing: { cost, balance: updatedUser.balance }
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
    }
}