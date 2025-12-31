"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        await fetch("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        setStatus("success");
    };

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow text-center space-y-4">
                    <div className="text-4xl">📧</div>
                    <h2 className="text-xl font-bold text-slate-800">邮件已发送</h2>
                    <p className="text-slate-600 text-sm">
                        如果有对应账户，重置链接已发送至 <b>{email}</b>。请检查收件箱（包括垃圾邮件）。
                    </p>
                    <Link href="/login" className="inline-block mt-4 text-indigo-600 font-bold text-sm hover:underline">返回登录</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow border border-slate-100">
                <h1 className="text-xl font-bold mb-4 text-slate-900">找回密码</h1>
                <p className="text-xs text-slate-500 mb-6">请输入注册时的邮箱，我们将发送重置链接。</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" required placeholder="name@example.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button disabled={status === "loading"} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition">
                        {status === "loading" ? "发送中..." : "发送重置链接"}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">取消并返回</Link>
                </div>
            </div>
        </div>
    );
}