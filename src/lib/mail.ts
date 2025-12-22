import nodemailer from 'nodemailer';

const port = Number(process.env.EMAIL_SERVER_PORT);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: port,
    // 关键修改：如果是 465 端口，强制开启安全连接；其他端口则根据情况自动处理
    secure: port === 465,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    // 开发环境下，如果未配置密码，仅打印日志
    if (!process.env.EMAIL_SERVER_PASSWORD) {
        console.log("========================================");
        console.log(`[模拟邮件] To: ${to}`);
        console.log(`[Subject]: ${subject}`);
        console.log("========================================");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        console.log("📨 邮件发送成功:", info.messageId);
    } catch (error) {
        console.error("❌ 邮件发送失败:", error);
        // 这里不抛出错误，以免阻断主流程（比如注册流程），但会记录日志
    }
};