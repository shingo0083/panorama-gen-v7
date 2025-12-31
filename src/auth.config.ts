import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/login', // 登录页指向自定义页面
    },
    providers: [], // 此时先置空，Middleware 不需要知道具体 Provider
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnLogin = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

            // 1. 如果访问 Dashboard，必须登录
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            // 2. 如果已登录却访问 Login，跳回首页
            if (isOnLogin && isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }

            // 3. 默认允许访问首页
            return true;
        },
    },
} satisfies NextAuthConfig;