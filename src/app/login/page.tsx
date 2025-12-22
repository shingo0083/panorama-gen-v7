"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("账号或密码错误");
      } else {
        router.push("/"); // 登录成功跳转首页
        router.refresh();
      }
    } catch (err) {
      setError("登录系统异常");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">用户登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
            <input name="username" type="text" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input name="password" type="password" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "登录中..." : "立即登录"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500">
          还没有账号? <Link href="/register" className="text-indigo-600 hover:underline">去注册</Link>
        </div>
      </div>
    </div>
  );
}