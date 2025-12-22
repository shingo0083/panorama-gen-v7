import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.username) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { username: session.user.username }
        });

        if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

        // 验证旧密码
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "旧密码错误" }, { status: 400 });
        }

        // 更新新密码
        const hashedNew = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNew }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "修改失败" }, { status: 500 });
    }
}