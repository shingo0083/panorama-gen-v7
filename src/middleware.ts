import NextAuth from "next-auth";
// 强制指向 @/auth.config 以利用 TS 的路径别名，更稳健
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // 匹配所有非静态资源和非API路径
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};