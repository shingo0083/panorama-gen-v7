import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await prisma.user.findUnique({ where: { username } });

                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }
                return null;
            },
        }),
    ],
    // [修复] 显式定义 Session 传递逻辑
    session: { strategy: "jwt" },
    callbacks: {
        // 1. 登录成功时，把 user.username 塞进 JWT token
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                // 注意：user.username 是我们在 Prisma schema 里定义的
                // 将其映射到标准字段 token.name，或者自定义字段
                token.name = (user as any).username;
            }
            return token;
        },
        // 2. 前端/服务端读取 Session 时，从 Token 把数据拿出来
        async session({ session, token }) {
            if (token.sub && session.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // 关键修复：确保 session.user.name 有值，Dashboard 依赖这个查数据库
                if (token.name) {
                    session.user.name = token.name;
                }
            }
            return session;
        }
    },
});