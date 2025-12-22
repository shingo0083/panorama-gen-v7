import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptBuilder, GenerateParams } from '@/lib/prompt-engine';
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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
        // [修复]: 使用 session.user.name 代替 username
        if (!session || !session.user?.name) {
            return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 });
        }

        // 2. [余额预检] 
        // [修复]: Prisma 查询时，用 session.user.name (它存的是用户名) 去匹配数据库的 username 字段
        const user = await prisma.user.findUnique({ where: { username: session.user.name } });

        if (!user || user.balance < 1000) {
            return NextResponse.json({ error: "Insufficient Balance. Please recharge." }, { status: 402 });
        }

        // [新增] 速率限制：每 15 秒只能生成一次 (Cooldown)
        const lastLog = user.logs[0];
        if (lastLog) {
            const timeDiff = Date.now() - new Date(lastLog.createdAt).getTime();
            // 15000 毫秒 = 15 秒
            if (timeDiff < 15000) {
                const waitSeconds = Math.ceil((15000 - timeDiff) / 1000);
                return NextResponse.json({
                    error: `生成太快了！请休息 ${waitSeconds} 秒后再试。\n(系统限制：防止拥堵)`
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
        const modeKey = params.mode as keyof typeof PromptBuilder;
        const builder = PromptBuilder[modeKey];
        if (!builder) return NextResponse.json({ error: `Unsupported mode` }, { status: 400 });
        const promptText = builder(params as GenerateParams);

        // 5. [请求 Gemini]
        const modelId = "gemini-3-pro-image-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const fetchRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: "image/jpeg", data: image_data } }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        if (!fetchRes.ok) throw new Error(await fetchRes.text());
        const data = await fetchRes.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No candidates returned from model.");
        }

        const candidate = data.candidates?.[0];

        // Safety Check
        if (!candidate || candidate.finishReason === 'SAFETY') {
            throw new Error("Generate Failed: Safety Filter Triggered");
        }

        const imgBase64 = candidate.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!imgBase64) throw new Error("No image returned");

        // 6. [计费核心逻辑]
        const usage = data.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;
        const totalTokens = inputTokens + outputTokens;

        const cost = totalTokens > 0 ? Math.ceil(totalTokens * 1.45) : 3000;

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