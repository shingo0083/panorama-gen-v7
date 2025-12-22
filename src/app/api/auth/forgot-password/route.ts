import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // 为了安全，即使用户不存在也返回成功，防止邮箱扫描
            return NextResponse.json({ success: true });
        }

        // 生成 Token (24小时过期)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 存入数据库
        await prisma.verificationToken.create({
            data: { identifier: email, token, expires }
        });

        // 发送邮件
        const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">重置您的密码</h2>
                <p>我们收到了您账号的密码重置请求。如果是您本人操作，请点击下方按钮：</p>
                <a href="${resetLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">重置密码</a>
                <p style="font-size: 12px; color: #666;">如果按钮无法点击，请复制链接到浏览器：<br>${resetLink}</p>
                <p style="font-size: 12px; color: #999;">链接有效期 24 小时。</p>
            </div>
        `;

        await sendEmail(email, "【全景设定生成器】重置密码", html);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Service Error" }, { status: 500 });
    }
}