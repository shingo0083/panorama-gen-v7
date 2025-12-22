"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function ResetForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const password = new FormData(e.currentTarget).get("password");

        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, newPassword: password }),
        });

        if (res.ok) {
            alert("密码修改成功！请重新登录");
            router.push("/login");
        } else {
            alert("链接已失效或发生错误");
            setLoading(false);
        }
    };

    if (!token) return <div className="text-red-500">无效的链接</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input name="password" type="password" required minLength={6} placeholder="输入新密码"
                    className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                {loading ? "修改中..." : "确认修改"}
            </button>
        </form>
    );
}

export default function ResetPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow space-y-6">
                <h1 className="text-xl font-bold text-center">设置新密码</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetForm />
                </Suspense>
            </div>
        </div>
    )
}