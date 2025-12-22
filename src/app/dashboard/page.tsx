import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft, History, Zap, ExternalLink } from 'lucide-react';
import RedeemCard from "@/components/RedeemCard";
import ChangePasswordCard from "@/components/ChangePasswordCard"; // [New]

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user) { redirect("/login"); }

  const user = await prisma.user.findUnique({
    where: { username: session.user.name || undefined, id: session.user.id },
    include: { logs: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {user.username}
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-mono">UID: {user.id.slice(-4).toUpperCase()}</span>
              </h1>
              <p className="text-sm text-slate-500">全景角色设定生成器 V7.2</p>
            </div>
          </div>
          {/* Dashboard 里的退出按钮也保留，作为冗余入口 */}
          <form action={async () => { "use server"; await signOut(); }}>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
              <LogOut size={16} /> 退出
            </button>
          </form>
        </div>

        {/* 核心资产区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="z-10">
              <div className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Zap size={16} /> 可用算力配额</div>
              <div className="text-6xl font-black tracking-tight flex items-baseline gap-2">
                {user.balance.toLocaleString()} <span className="text-2xl font-medium opacity-60">pts</span>
              </div>
            </div>
            <div className="z-10 mt-8 pt-6 border-t border-white/20">
              <div className="text-xs text-indigo-200 mb-1">当前购买力估算:</div>
              <div className="text-sm font-medium flex gap-4">
                <span>≈ {Math.floor(user.balance / 3000)} 张标准图</span>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
          </div>

          {/* [New] 右侧改为上下布局：上兑换卡，下改密卡 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <RedeemCard />
            <ChangePasswordCard />
          </div>
        </div>

        {/* 定价看板 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">📊 费率透明公示</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-600 text-sm uppercase tracking-wide">官方定价</h4>
                <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">来源：Google AI <ExternalLink size={10} /></a>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex justify-between items-center border-b border-dashed pb-2">
                  <span>文字/图片输出</span>
                  <div className="text-right font-mono text-slate-800">$120.00 / 1M Tokens</div>
                </li>
              </ul>
            </div>
            <div className="p-8 space-y-4 bg-indigo-50/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-wide">平台费率</h4>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">1.25x Ratio</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex justify-between items-center">
                  <span>输入成本</span>
                  <span className="font-mono font-bold text-slate-800">x1.0</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>输出权重 (Premium)</span>
                  <span className="font-mono font-bold text-indigo-600">x5.0</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 流水记录 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2"><History size={18} className="text-slate-400" /><h3 className="font-bold text-slate-700">最近流水</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr><th className="px-6 py-4">时间</th><th className="px-6 py-4">行为</th><th className="px-6 py-4 text-right">变动</th><th className="px-6 py-4">备注</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {user.logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-500">{log.createdAt.toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${log.action.includes('RECHARGE') || log.action.includes('GIFT') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{log.action}</span></td>
                    <td className={`px-6 py-4 font-mono font-bold text-right ${log.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{log.amount > 0 ? '+' : ''}{log.amount}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{log.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}