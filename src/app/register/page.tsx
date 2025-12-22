"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "注册失败");
      }

      alert("注册成功！\n系统已赠送 10,000 积分，请直接登录。");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px] border border-white/50">
        <h1 className="text-2xl font-black mb-2 text-center text-slate-900 tracking-tight">创建账户</h1>
        <p className="text-center text-xs text-indigo-600 mb-8 bg-indigo-50 py-1.5 rounded-full font-medium">🎁 新用户注册即送 10,000 算力点</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">用户名</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-slate-400" />
              <input name="username" type="text" required minLength={3} className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="your_name" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">电子邮箱</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
              <input name="email" type="email" required className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="name@example.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">设置密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
              <input name="password" type="password" required minLength={6} className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="******" />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium border border-red-100 flex items-center justify-center gap-2">⚠️ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "正在创建..." : "确认注册"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          已有账号? <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">直接登录</Link>
        </div>
      </div>
    </div>
  );
}