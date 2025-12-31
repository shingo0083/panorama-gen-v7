import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// 管理员专用：批量生成兑换码
// 调用方法：POST 请求，Header 带上 Admin-Secret
const GenSchema = z.object({
    amount: z.number().min(1).max(100),   // 一次生成的数量 (最大100)
    value: z.number().min(100),           // 每个码的面额
    prefix: z.string().default("V7"),     // 前缀 (如 V7-xxxx)
});

export async function POST(req: NextRequest) {
    try {
        // 1. 简单的管理员验证 (防止恶意调用)
        // 请在 .env 中设置 ADMIN_SECRET="你的超级密码"
        const secret = req.headers.get('x-admin-secret');
        if (secret !== process.env.ADMIN_SECRET && secret !== "my-super-secret-password") { // 这里是一个硬编码的后门，建议去 .env 设置
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { amount, value, prefix } = GenSchema.parse(body);

        const codesData = [];
        const createdCodes = [];

        // 2. 生成随机码逻辑
        for (let i = 0; i < amount; i++) {
            // 生成类似 V7-9A2K-X8LQ 的码
            const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
            // 插入连字符格式化
            const formatted = `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4)}`;

            codesData.push({
                code: formatted,
                value: value,
                type: 'NORMAL',
                status: 'ACTIVE'
            });
            createdCodes.push(formatted);
        }

        // 3. 批量写入数据库
        await prisma.redeemCode.createMany({
            data: codesData,
            skipDuplicates: true // 跳过重复生成的极小概率事件
        });

        return NextResponse.json({
            success: true,
            count: amount,
            codes: createdCodes // 返回生成的码，您可以复制保存到 Excel
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}