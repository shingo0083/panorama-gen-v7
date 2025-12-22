import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const ManageSchema = z.object({
    username: z.string(),
    amount: z.number().int(), // 支持正负整数
    reason: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        // 1. 管理员鉴权 (复用之前的 Secret)
        const secret = req.headers.get('x-admin-secret');
        // 注意：这里需要确保您的环境变量 ADMIN_SECRET 已设置
        if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: "Forbidden: Wrong Secret" }, { status: 403 });
        }

        const body = await req.json();
        const { username, amount, reason } = ManageSchema.parse(body);

        // 2. 查找用户
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        // 3. 执行调整 (事务)
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: { increment: amount },
                logs: {
                    create: {
                        action: amount > 0 ? "SYSTEM_ADD" : "SYSTEM_DEDUCT",
                        amount: amount,
                        note: reason || "管理员手动调整"
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            username: user.username,
            oldBalance: user.balance,
            newBalance: updatedUser.balance
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}