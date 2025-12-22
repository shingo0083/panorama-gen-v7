import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        // 查找 Token
        const verification = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verification) {
            return NextResponse.json({ error: "链接无效或已使用" }, { status: 400 });
        }

        if (new Date() > verification.expires) {
            return NextResponse.json({ error: "链接已过期，请重新申请" }, { status: 400 });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新用户密码
        await prisma.user.update({
            where: { email: verification.identifier },
            data: { password: hashedPassword }
        });

        // 删除已使用的 Token (防止重复使用)
        await prisma.verificationToken.delete({ where: { token } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
    }
}