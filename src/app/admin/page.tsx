"use client";
import { useState } from 'react';
import { Copy, Check, ShieldAlert, Database, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [amount, setAmount] = useState(10);
  const [value, setValue] = useState(30000);
  const [prefix, setPrefix] = useState('V7');
  
  const [result, setResult] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult([]);

    try {
      const res = await fetch('/api/admin/generate-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret // 携带密钥头
        },
        body: JSON.stringify({ amount, value, prefix })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "生成失败，密钥错误？");
      
      setResult(data.codes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = result.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <ShieldAlert size={24} />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-800">V7 核心造币厂</h1>
                <p className="text-sm text-slate-500">仅限管理员使用 • 严禁泄露</p>
            </div>
        </div>

        {/* 控制区 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Admin Secret</label>
                <input 
                    type="password" 
                    value={secret} 
                    onChange={e => setSecret(e.target.value)}
                    placeholder="请输入 .env 中的 ADMIN_SECRET"
                    className="w-full p-3 border border-red-200 rounded-lg bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500 outline-none"
                />
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">单卡积分 (Value)</label>
                <select 
                    value={value} 
                    onChange={e => setValue(Number(e.target.value))}
                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                >
                    <option value="10000">1万分 (测试)</option>
                    <option value="30000">3万分 (10元档)</option>
                    <option value="100000">10万分 (30元档)</option>
                    <option value="180000">18万分 (50元档)</option>
                    <option value="400000">40万分 (100元档)</option>
                </select>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">生成数量 (Amount)</label>
                <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                    min="1" max="100"
                />
            </div>

            <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">前缀 (Prefix)</label>
                <input 
                    type="text" 
                    value={prefix} 
                    onChange={e => setPrefix(e.target.value.toUpperCase())}
                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 outline-none uppercase font-mono"
                    placeholder="例如: V7-GIFT"
                />
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center">
                {error}
            </div>
        )}

        <button 
            onClick={handleGenerate} 
            disabled={loading || !secret}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin"/> : <Database size={20}/>}
            {loading ? '正在铸造区块...' : '立即生成兑换码'}
        </button>

        {/* 结果区 */}
        {result.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700">生成结果 ({result.length}个)</h3>
                    <button 
                        onClick={copyToClipboard}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition flex items-center gap-1"
                    >
                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                        {copied ? '已复制' : '复制全部'}
                    </button>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto shadow-inner">
                    {result.map((code, i) => (
                        <div key={i} className="mb-1">{code}</div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}