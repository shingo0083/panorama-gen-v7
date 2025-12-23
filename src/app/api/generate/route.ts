import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptBuilder, GenerateParams } from '@/lib/prompt-engine';
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWithGemini, generateWithJimeng } from '@/lib/ai-service';
import { MODE_METADATA } from '@/lib/constants';

const RequestSchema = z.object({
  image_data: z.string().min(100),
  provider: z.enum(['gemini', 'jimeng']),
  params: z.object({
    mode: z.enum(['hanfu', 'qipao', 'dark', 'arcade', 'comic', 'general', 'custom']), // Added custom

    // Custom Fields
    custom_prompt: z.string().optional(), // Added

    // Existing fields
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
    const session = await auth();
    if (!session || !session.user?.name) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      include: {
        logs: { where: { action: "GENERATE" }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!user) return NextResponse.json({ error: "账户异常" }, { status: 404 });
    if (user.balance < 1000) return NextResponse.json({ error: "余额不足" }, { status: 402 });

    const lastLog = user.logs[0];
    if (lastLog) {
      const timeDiff = Date.now() - new Date(lastLog.createdAt).getTime();
      const COOLDOWN = 10000; // 缩短为 10秒 提升体验
      if (timeDiff < COOLDOWN) {
        return NextResponse.json({ error: `操作太快，请稍候...` }, { status: 429 });
      }
    }

    const body = await req.json();
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid Params", details: validation.error.format() }, { status: 400 });
    }
    const { image_data, params, provider } = validation.data;

    // Build Prompt
    const modeKey = params.mode as keyof typeof PromptBuilder;
    const builder = PromptBuilder[modeKey];
    const promptText = builder(params as GenerateParams);

    let imgBase64 = "";

    // --- 核心分支逻辑 ---
    if (provider === 'gemini') {
      // A. Google Gemini 引擎
      if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key missing");
      const result = await generateWithGemini(promptText, image_data);
      imgBase64 = result.image;

    } else {
      // B. 字节即梦引擎 (Jimeng)
      // 提示词优化：即梦对英文 Prompt 反应较慢，我们在前面拼接一些强引导词
      // 且即梦主要基于文生图，我们忽略 image_data
      const jimengPrompt = `(Masterpiece, Best Quality, 8k wallpaper), ${promptText}`;
      const result = await generateWithJimeng(jimengPrompt);
      imgBase64 = result.image;
    }

    // --- 统一计费 (一口价模式) ---
    // 为了简化双引擎的 Token 差异，这里统一采用一口价
    // 标准模式: 3000, 高级模式(Arcade/Dark/Comic): 4500
    const modeConfig = MODE_METADATA[params.mode];
    const isStandard = modeConfig?.tier === 'STANDARD';
    const finalCost = isStandard ? 3000 : 4500;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: finalCost },
        logs: {
          create: {
            action: "GENERATE",
            amount: -finalCost,
            note: `${params.mode.toUpperCase()} via ${provider.toUpperCase()}`
          }
        }
      }
    });

    return NextResponse.json({
      image_base64: imgBase64,
      generated_prompt: promptText,
      billing: { cost: finalCost, balance: updatedUser.balance }
    });

  } catch (error: any) {
    console.error("[API Error]", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}