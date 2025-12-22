import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const RegisterSchema = z.object({
    username: z.string().min(3, "用户名至少3位"),
    password: z.string().min(6, "密码至少6位"),
    email: z.string().email("邮箱格式不正确"), // [New]
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // 校验输入
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { username, password, email } = validation.data;

        // 检查用户名或邮箱是否已存在
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: "用户名或邮箱已被注册" }, { status: 400 });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // [核心修改] 初始赠送 10,000 积分
        const INITIAL_BALANCE = 10000;

        // 创建用户
        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                balance: INITIAL_BALANCE,
                logs: {
                    create: {
                        action: "WELCOME_GIFT",
                        amount: INITIAL_BALANCE,
                        note: "新用户注册赠送"
                    }
                }
            },
        });

        // TODO: 这里可以调用 sendEmail 发送欢迎邮件

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("注册错误:", error);
        return NextResponse.json({ error: "注册服务异常，请稍后重试" }, { status: 500 });
    }
}