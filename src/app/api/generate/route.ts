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
        const user = await prisma.user.findUnique({
            where: { username: session.user.name },
            include: {
                logs: {
                    where: { action: "GENERATE" },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "用户账户异常" }, { status: 404 });
        }

        if (user.balance < 1000) {
            return NextResponse.json({ error: "余额不足 (Insufficient Balance)" }, { status: 402 });
        }

        // [速率限制逻辑]：每 15 秒 1 次
        const lastLog = user.logs[0];
        if (lastLog) {
            const timeDiff = Date.now() - new Date(lastLog.createdAt).getTime();
            const COOLDOWN = 15000;
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
        // 强制类型转换以匹配 keyof typeof PromptBuilder
        const modeKey = params.mode as keyof typeof PromptBuilder;
        const builder = PromptBuilder[modeKey];
        if (!builder) return NextResponse.json({ error: `Unsupported mode` }, { status: 400 });
        const promptText = builder(params as GenerateParams);

        // 5. [请求 Gemini 3 Pro]
        const modelId = "gemini-3-pro-image-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        // 来源检查 (生产环境安全层)
        if (process.env.NODE_ENV === 'production') {
            const referer = req.headers.get('referer') || '';
            const origin = req.headers.get('origin') || '';
            // 🚨 请确保这里的域名与您实际部署的域名一致
            const allowedDomain = 'panorama-gen-v7.vercel.app';
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

        // 6. [计费核心逻辑] 商业级动态加权 (V7.1 Smart Pricing)
        const usage = data.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;

        // [策略]：模式差异化定价
        const premiumModes = ['arcade', 'comic', 'dark'];
        const isPremium = premiumModes.includes(params.mode);

        // [策略]：输入/输出分离计价 (基于 1USD ≈ 21428 pts)
        const inputRate = 1.0;
        const outputRate = isPremium ? 5.0 : 4.0; // 输出加权 x4.0 / x5.0

        // 计算总消耗
        let calculatedCost = Math.ceil(
            (inputTokens * inputRate) + (outputTokens * outputRate)
        );

        // [保底机制]
        const minCost = isPremium ? 3500 : 2500;
        // 🔴 这里的变量名是 finalCost
        const finalCost = Math.max(calculatedCost, minCost);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: { decrement: finalCost },
                logs: {
                    create: {
                        action: "GENERATE",
                        amount: -finalCost,
                        note: `${params.mode.toUpperCase()} [In:${inputTokens}/Out:${outputTokens}]`
                    }
                }
            }
        });

        // 7. 返回
        return NextResponse.json({
            image_base64: imgBase64,
            generated_prompt: promptText,
            // 🔴 修复点：这里显式指定键值对 cost: finalCost
            billing: { cost: finalCost, balance: updatedUser.balance }
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
    }
}