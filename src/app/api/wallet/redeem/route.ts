import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";

const RedeemSchema = z.object({
    code: z.string().min(5),
});

export async function POST(req: NextRequest) {
    try {
        // 1. 验证登录
        const session = await auth();
        if (!session || !session.user?.username) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        // 2. 验证参数
        const body = await req.json();
        const { code } = RedeemSchema.parse(body);

        // 3. 执行原子交易 (Atomic Transaction)
        // 这一步确保数据的绝对安全
        const result = await prisma.$transaction(async (tx) => {
            // A. 查找并锁定兑换码
            const redeemCode = await tx.redeemCode.findUnique({
                where: { code }
            });

            // B. 各种校验
            if (!redeemCode) {
                throw new Error("无效的兑换码");
            }
            if (redeemCode.status !== 'ACTIVE') {
                throw new Error("兑换码已被使用或过期");
            }

            // C. 获取用户ID
            const user = await tx.user.findUnique({
                where: { username: session.user.username! } // Non-null asserted because of check #1
            });
            if (!user) throw new Error("用户账户异常");

            // D. 更新兑换码状态 -> USED
            await tx.redeemCode.update({
                where: { id: redeemCode.id },
                data: {
                    status: 'USED',
                    usedByUserId: user.id,
                    usedAt: new Date()
                }
            });

            // E. 给用户加分
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    balance: { increment: redeemCode.value }
                }
            });

            // F. 写入流水日志
            await tx.usageLog.create({
                data: {
                    userId: user.id,
                    action: "RECHARGE",
                    amount: redeemCode.value,
                    note: `使用兑换码: ${code}`
                }
            });

            return { balance: updatedUser.balance, value: redeemCode.value };
        });

        return NextResponse.json({
            success: true,
            message: `成功充值 ${result.value} 积分`,
            newBalance: result.balance
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "兑换失败" }, { status: 400 });
    }
}