import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // 1. 查找用户
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // 安全策略：即使邮箱不存在，也返回成功，防止恶意扫描邮箱库
            return NextResponse.json({ success: true });
        }

        // 2. 生成 Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

        // 3. 写入数据库
        // 使用 upsert: 如果该邮箱已有 token 则更新，没有则创建
        await prisma.verificationToken.upsert({
            where: { identifier: email }, // 修正：基于 schema 定义，我们需要确保 logic 正确
            // Prisma schema 中的 VerificationToken 主键通常比较复杂
            // 如果你的 schema 是 @@unique([identifier, token])，我们需要先 delete 再 create 比较稳妥
            update: { token, expires },
            create: { identifier: email, token, expires }
        }).catch(async () => {
            // 备用方案：如果 upsert 失败（主键冲突），先删旧再加新
            await prisma.verificationToken.deleteMany({ where: { identifier: email } });
            await prisma.verificationToken.create({ data: { identifier: email, token, expires } });
        });

        // 4. [核心修复] 获取当前网站的域名 (Base URL)
        // 优先级：手动配置的 APP_URL > NextAuth URL > Vercel 自动域名 > 本地
        const getBaseUrl = () => {
            if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
            if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
            if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
            return 'http://localhost:3000';
        };

        const baseUrl = getBaseUrl();
        // 确保 URL 末尾没有斜杠，防止拼接出 //reset
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        
        const resetLink = `${cleanBaseUrl}/reset-password?token=${token}`;

        console.log(`[Password Reset] Link generated: ${resetLink}`);

        // 5. 构建邮件内容 (优化按钮点击区域)
        const html = `
            <div style="background-color: #f9f9f9; padding: 20px; font-family: sans-serif;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">重置您的密码</h2>
                    <p style="color: #333; line-height: 1.6;">您好，我们收到了您账号的密码重置请求。</p>
                    <p style="color: #333; line-height: 1.6;">请点击下方按钮设置新密码（链接 24 小时内有效）：</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" target="_blank" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">立即重置密码</a>
                    </div>

                    <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">
                        如果按钮无法点击，请将下方链接复制到浏览器地址栏：<br>
                        <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
                    </p>
                </div>
            </div>
        `;
        
        await sendEmail(email, "【重要】密码重置验证", html);
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: error.message || "服务繁忙" }, { status: 500 });
    }
}