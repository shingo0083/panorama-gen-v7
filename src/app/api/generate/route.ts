import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptBuilder, GenerateParams } from '@/lib/prompt-engine';

// 1. 定义极其严格的入参校验规则 (Schema)
const RequestSchema = z.object({
    image_data: z.string().min(100, "图片数据不能为空"), // Base64
    params: z.object({
        // 必填项
        mode: z.enum(['hanfu', 'qipao', 'dark', 'arcade', 'comic', 'general']),

        // 通用选填项
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

        // 街机/漫改特有项
        arc_role: z.string().optional(),
        arc_vfx: z.string().optional(),
        arc_color: z.string().optional(),
        comic_role: z.string().optional(),
        comic_vfx: z.string().optional(),
        comic_color: z.string().optional(),
    })
});

// 2. POST 处理函数
export async function POST(req: NextRequest) {
    try {
        // 解析请求体
        const body = await req.json();

        // 使用 Zod 进行校验
        const validation = RequestSchema.safeParse(body);

        if (!validation.success) {
            // 校验失败，直接返回 400 错误详情
            return NextResponse.json(
                { error: "Invalid Request Parameters", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { image_data, params } = validation.data;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
        }

        // 3. 调用 Prompt 引擎生成提示词
        // TypeScript 可能会提示索引签名问题，这里使用 as keyof typeof 确保类型安全
        const modeKey = params.mode as keyof typeof PromptBuilder;
        const builder = PromptBuilder[modeKey];

        if (!builder) {
            return NextResponse.json({ error: `Unsupported mode: ${params.mode}` }, { status: 400 });
        }

        // 生成提示词
        const promptText = builder(params as GenerateParams);

        // 4. 请求 Google Gemini API
        const modelId = "gemini-3-pro-image-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const geminiPayload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: image_data } }
                ]
            }],
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                responseMimeType: "text/plain"
            }
        };

        const fetchRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!fetchRes.ok) {
            const errorText = await fetchRes.text();
            throw new Error(`Gemini API Error (${fetchRes.status}): ${errorText}`);
        }

        const data = await fetchRes.json();

        // 5. 结果处理与安全检查
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No candidates returned from model.");
        }

        const candidate = data.candidates[0];

        // 安全拦截检查
        if (candidate.finishReason === 'SAFETY') {
            throw new Error("生成失败：触发了安全审查 (Safety Filter)。请尝试调整提示词或人设。");
        }

        const imgBase64 = candidate.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

        if (!imgBase64) {
            throw new Error("Model returned no image data.");
        }

        // 6. 返回成功结果 (图片 + 完整Prompt)
        return NextResponse.json({
            image_base64: imgBase64,
            generated_prompt: promptText
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}