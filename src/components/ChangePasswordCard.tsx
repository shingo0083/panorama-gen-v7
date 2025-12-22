"use client";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function ChangePasswordCard() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (newPassword.length < 6) return alert("新密码至少6位");
        setLoading(true);
        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                alert("修改成功！");
                setOldPassword("");
                setNewPassword("");
            } else {
                alert("失败: " + data.error);
            }
        } catch (e) {
            alert("系统错误");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Lock className="text-slate-500" size={20} />
                <h3 className="font-bold">安全设置</h3>
            </div>
            <div className="space-y-3">
                <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="当前密码"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码 (至少6位)"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                    onClick={handleUpdate}
                    disabled={loading || !oldPassword || !newPassword}
                    className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin" size={14} />} 更新密码
                </button>
            </div>
        </div>
    )
}