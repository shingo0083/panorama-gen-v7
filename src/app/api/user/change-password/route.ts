import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await auth();
        // [修复] 将 .username 改为 .name
        // 因为在 auth.ts 中我们做了映射: session.user.name = token.name (即数据库的 username)
        if (!session || !session.user?.name) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        // 查找用户
        // 使用 session.user.name 作为查找依据
        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
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
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "修改失败，系统异常" }, { status: 500 });
    }
}