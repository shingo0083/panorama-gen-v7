"use client";
import { useState } from 'react';
import { Copy, Check, ShieldAlert, Database, Loader2, UserCog, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const [secret, setSecret] = useState('');

    // Tab: 1=造币, 2=用户管理
    const [activeTab, setActiveTab] = useState(1);

    // --- 造币状态 ---
    const [amount, setAmount] = useState(10);
    const [value, setValue] = useState(30000);
    const [prefix, setPrefix] = useState('V7');
    const [genResult, setGenResult] = useState<string[]>([]);

    // --- 用户管理状态 ---
    const [targetUser, setTargetUser] = useState('');
    const [adjustAmount, setAdjustAmount] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustResult, setAdjustResult] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // 生成兑换码
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/generate-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                body: JSON.stringify({ amount, value, prefix })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setGenResult(data.codes);
        } catch (e: any) { alert(e.message); }
        finally { setLoading(false); }
    };

    // 调整用户余额
    const handleUserManage = async () => {
        if (!confirm(`确定要给用户 ${targetUser} ${adjustAmount > 0 ? '增加' : '扣除'} ${Math.abs(adjustAmount)} 积分吗？`)) return;

        setLoading(true);
        setAdjustResult('');
        try {
            const res = await fetch('/api/admin/manage-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                body: JSON.stringify({ username: targetUser, amount: Number(adjustAmount), reason: adjustReason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAdjustResult(`✅ 操作成功！\n用户: ${data.username}\n变动前: ${data.oldBalance}\n变动后: ${data.newBalance}`);
        } catch (e: any) {
            setAdjustResult(`❌ 失败: ${e.message}`);
        }
        finally { setLoading(false); }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(genResult.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans flex items-center justify-center">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-slate-200">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800">V7 上帝模式 (Admin God Mode)</h1>
                        <p className="text-sm text-slate-500">仅限管理员使用 • 严禁泄露密钥</p>
                    </div>
                </div>

                {/* Global Secret Input */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">管理员密钥 (Admin Secret)</label>
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder="请输入 .env 中的 ADMIN_SECRET"
                        className="w-full p-3 border border-red-200 rounded-lg bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500 outline-none font-mono"
                    />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab(1)}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 1 ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Database className="inline-block mr-2" size={16} /> 批量造币
                    </button>
                    <button
                        onClick={() => setActiveTab(2)}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 2 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <UserCog className="inline-block mr-2" size={16} /> 用户资金管理
                    </button>
                </div>

                {/* --- Tab 1: 造币厂 --- */}
                {activeTab === 1 && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">单卡面额</label>
                                <select value={value} onChange={e => setValue(Number(e.target.value))} className="w-full p-3 border rounded-lg bg-slate-50 outline-none">
                                    <option value="30000">3万 (¥10)</option>
                                    <option value="100000">10万 (¥30)</option>
                                    <option value="180000">18万 (¥50)</option>
                                    <option value="400000">40万 (¥100)</option>
                                    <option value="10000">测试用 1万</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">数量</label>
                                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-3 border rounded-lg bg-slate-50 outline-none" min="1" max="50" />
                            </div>
                        </div>
                        <input type="text" value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} className="w-full p-3 border rounded-lg bg-slate-50 font-mono uppercase" placeholder="前缀: V7-GIFT" />

                        <button onClick={handleGenerate} disabled={loading || !secret} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 transition">
                            {loading ? <Loader2 className="animate-spin inline" /> : "立即铸造"}
                        </button>

                        {genResult.length > 0 && (
                            <div className="bg-slate-900 rounded-xl p-4 mt-4">
                                <div className="flex justify-between text-slate-400 text-xs mb-2">
                                    <span>生成结果:</span>
                                    <button onClick={copyToClipboard} className="text-white hover:underline">{copied ? "已复制" : "复制全部"}</button>
                                </div>
                                <div className="h-32 overflow-y-auto font-mono text-green-400 text-sm whitespace-pre-line">{genResult.join('\n')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Tab 2: 用户管理 --- */}
                {activeTab === 2 && (
                    <div className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">目标用户名</label>
                            <input type="text" value={targetUser} onChange={e => setTargetUser(e.target.value)} className="w-full p-3 border border-indigo-200 rounded-lg bg-indigo-50/50 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="准确的用户名" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">调整金额 (正数加/负数减)</label>
                                <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} className="w-full p-3 border rounded-lg bg-slate-50 outline-none font-mono font-bold" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">操作理由</label>
                                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full p-3 border rounded-lg bg-slate-50 outline-none" placeholder="例: 客服补偿" />
                            </div>
                        </div>

                        <button onClick={handleUserManage} disabled={loading || !secret || !targetUser || adjustAmount === 0} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                            {adjustAmount > 0 ? "确认充值" : "确认扣除"}
                        </button>

                        {adjustResult && (
                            <div className={`p-4 rounded-xl border whitespace-pre-wrap ${adjustResult.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                {adjustResult}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}