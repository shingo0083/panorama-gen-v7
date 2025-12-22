"use client";
import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RedeemCard() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRedeem = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const res = await fetch("/api/wallet/redeem", {
                method: "POST",
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ 兑换成功！\n获得: ${data.message}\n最新余额: ${data.newBalance}`);
                setCode("");
                router.refresh(); // 刷新页面数据
            } else {
                alert(`❌ 兑换失败: ${data.error}`);
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
                <Gift className="text-pink-500" size={20} />
                <h3 className="font-bold">礼品卡兑换</h3>
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="输入兑换码 (如 V7-XXXX)"
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm uppercase font-mono tracking-wider focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <button
                    onClick={handleRedeem}
                    disabled={loading || !code}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin" size={14} />} 兑换
                </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">如需购买兑换码，请联系管理员。</p>
        </div>
    )
}