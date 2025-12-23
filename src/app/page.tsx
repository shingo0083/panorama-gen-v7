"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Copy, Check, Download, AlertCircle, X, User, LogOut, LogIn, Paintbrush, Cpu } from 'lucide-react';
import { signOut, getSession } from "next-auth/react";
import UploadZone from '@/components/UploadZone';
import ControlPanel from '@/components/ControlPanel';
import { ModeType } from '@/lib/constants';

const getDefaultConfig = (mode: ModeType) => {
  const base = { cup: 'C Cup', body_type: '自动推算', face_desc: '', outer_desc: '', desc: '' };
  switch (mode) {
    case 'hanfu': return { ...base, dynasty: 'Ming', inner: '明制主腰', pose: '端庄站立', items: [] };
    case 'qipao': return { ...base, dynasty: 'Style01', inner: '真丝吊带衬裙', accessorySet: 'A', pose: '步步生莲' };
    case 'dark': return { ...base, inner: 'OL', pose: '羞耻特写' };
    case 'arcade': return { ...base, arc_role: 'Kunoichi', arc_color: '1P', arc_vfx: '无 (None)', pose: '💃 胜利: 摇扇弯腰 (Bouncing)' };
    case 'comic': return { ...base, comic_role: 'Navigator', comic_color: 'Anime', comic_vfx: '无 (None)', pose: '😉 招牌: 俏皮眨眼 (Wink)' };
    case 'custom': return { custom_prompt: "" };
    default: return { ...base, gen_style: '2D Concept Sketch', gen_inner: 'Context-based', pose: 'Standard Standing' };
  }
};

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeType>('hanfu');
  const [config, setConfig] = useState<any>(getDefaultConfig('hanfu'));
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'gemini' | 'jimeng' | null>(null);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [terminalText, setTerminalText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setConfig(getDefaultConfig(mode));
    setTerminalText('');
    getSession().then((session) => { if (session?.user) setUser(session.user); });
  }, [mode]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.refresh();
  };

  const handleClearImage = () => {
    setImageData(null);
    setConfig(getDefaultConfig(mode));
    setTerminalText('');
  };

  const handleGenerate = async (provider: 'gemini' | 'jimeng') => {
    if (!user) {
      if (confirm("您尚未登录。\n注册即送 10,000 积分体验，是否前往注册？")) router.push('/register');
      return;
    }
    if (mode !== 'custom' && !imageData) {
      alert("请先上传参考图片");
      return;
    }
    setLoading(true);
    setLoadingProvider(provider);
    setErrorMsg(null);
    const startMsg = provider === 'gemini'
      ? "// 正在连接 Google Gemini (USA)...\n// 正在解析视觉特征..."
      : "// 正在连接字节跳动即梦 (CN)...\n// 正在进行语义重构...";
    setTerminalText(startMsg);

    try {
      const formattedParams = { ...config };
      if (Array.isArray(formattedParams.items)) {
        formattedParams.items = formattedParams.items.join(',');
      }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: imageData || "",
          provider: provider,
          params: { mode, ...formattedParams }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.details) throw new Error("参数格式错误，请检查输入");
        if (res.status === 402) {
          if (confirm("余额不足！是否前往控制台充值？")) router.push('/dashboard');
          throw new Error(data.error);
        }
        if (res.status === 401) { router.push('/login'); throw new Error("请重新登录"); }
        throw new Error(data.error || "Generate failed");
      }
      setResultImg(`data:image/jpeg;base64,${data.image_base64}`);
      const costInfo = data.billing ? `消耗: ${data.billing.cost} pts | 剩余: ${data.billing.balance} pts` : "";
      const engineName = provider === 'gemini' ? 'Gemini 3 Pro' : 'Jimeng AI';
      setTerminalText(`✅ [${engineName}] 渲染完成!\n------------------\n模式: ${mode.toUpperCase()}\n分辨率: 4K Upscaled\n${costInfo}\n\n*提示: 点击右下角按钮保存配方*`);
    } catch (e: any) {
      setErrorMsg(e.message);
      setTerminalText(`❌ 错误: ${e.message}`);
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleCopy = () => {
    if (!resultImg) return;
    const safeRecipe = { app_version: "v7.3", mode: mode, settings: config, timestamp: new Date().toLocaleString() };
    navigator.clipboard.writeText(JSON.stringify(safeRecipe, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = lightboxSrc || resultImg;
    if (!target) return;
    const a = document.createElement('a');
    a.href = target;
    const shortID = Date.now().toString(36).slice(-6).toUpperCase();
    a.download = `${mode}_${shortID}.jpg`;
    a.click();
  };

  return (
    // [修正] Mobile: 允许滚动 (h-auto), min-h-screen | Desktop: 固定一屏 (h-screen)
    <main className="w-full min-h-screen lg:h-screen flex items-center justify-center bg-[#eef2f6] p-4 lg:p-6 text-slate-800 font-sans overflow-y-auto lg:overflow-hidden">

      {/* Workbench Card */}
      {/* [修正] Mobile: flex-col, h-auto, max-w-full | Desktop: flex-row, h-[90vh], fixed width */}
      <div className="w-full max-w-xl lg:max-w-[1400px] h-auto lg:h-[90vh] min-h-0 lg:min-h-[600px] bg-white rounded-2xl shadow-xl flex flex-col lg:flex-row overflow-hidden border border-white/60">

        {/* ================= LEFT PANEL (Control) ================= */}
        {/* [修正] Mobile: w-full, h-auto, no border-r, border-b | Desktop: w-[40%], scrollable */}
        <div className="w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r bg-slate-50/50 order-2 lg:order-1 h-auto lg:h-full">

          {/* Header */}
          <div className="p-5 lg:p-6 border-b bg-white/80 backdrop-blur sticky top-0 z-20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">设定装配 V7.3</h1>
              </div>
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => router.push('/dashboard')} className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-white border border-slate-200 px-2 lg:px-3 py-1.5 rounded-full hover:border-indigo-300 transition-all shadow-sm">
                    <User size={14} /> <span className="hidden sm:inline">账户</span>
                  </button>
                  <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-full hover:border-red-200 transition-all" title="退出">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => router.push('/register')} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 px-4 py-1.5 rounded-full transition-all shadow-md animate-pulse">
                  <LogIn size={14} /> 登录
                </button>
              )}
            </div>
            <select value={mode} onChange={(e) => setMode(e.target.value as ModeType)} className="w-full p-3 font-bold text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all cursor-pointer hover:border-indigo-300">
              <option value="hanfu">🏮 汉服工坊 (Hanfu)</option>
              <option value="qipao">📻 民国旗袍 (Qipao)</option>
              <option value="arcade">👊 格斗全明星 (Arcade)</option>
              <option value="comic">✨ 漫改全明星 (Comic)</option>
              <option value="dark">🖤 深夜放映厅 (Dark)</option>
              <option value="general">🌐 通用·概念拆解 (General)</option>
              <option value="custom">✨ 自由发挥 (Custom)</option>
            </select>
          </div>

          {/* Config Content */}
          {/* [修正] Mobile: 移除 overflow (由外层滚) | Desktop: internal scroll */}
          <div className="flex-1 p-5 lg:p-6 space-y-8 pb-10 lg:overflow-y-auto lg:custom-scrollbar">
            <UploadZone onImageReady={(data) => { if (data) setImageData(data); else handleClearImage(); }} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-slate-50 px-2 text-xs font-medium text-slate-400">参数配置</span></div>
            </div>

            <ControlPanel mode={mode} config={config} onChange={setConfig} />
          </div>

          {/* [Mobile Only] Bottom Action Button Clone for easier access */}
          <div className="lg:hidden p-4 bg-white border-t sticky bottom-0 z-30 flex gap-2">
            <button onClick={() => handleGenerate('gemini')} disabled={loading || (!imageData && mode !== 'custom')} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              <Cpu size={16} /> 生成 (G)
            </button>
            <button onClick={() => handleGenerate('jimeng')} disabled={loading || (!imageData && mode !== 'custom')} className="flex-1 bg-rose-500 text-white py-3 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              <Paintbrush size={16} /> 生成 (J)
            </button>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Result) ================= */}
        {/* [修正] Mobile: Order 1 (Result on top), Fixed height area | Desktop: Order 2, full height */}
        <div className="w-full lg:w-[60%] flex flex-col bg-slate-100 relative order-1 lg:order-2 h-[500px] lg:h-full border-b lg:border-b-0">

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden bg-[#f1f5f9]">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {loading ? (
              <div className="flex flex-col items-center gap-4 z-10 animate-pulse">
                <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-indigo-600 font-bold tracking-widest text-xs lg:text-sm text-center">
                  {loadingProvider === 'gemini' ? 'Gemini 正在构思...' : '即梦 正在绘制...'}
                </div>
              </div>
            ) : resultImg ? (
              <div className="relative group z-10 h-full w-full flex justify-center items-center">
                <img src={resultImg} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={() => setLightboxSrc(resultImg)} />
                <button onClick={(e) => handleDownload(e)} className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 bg-white hover:bg-slate-50 text-slate-800 p-2 lg:p-3 rounded-full shadow-lg opacity-80 lg:opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105" title="下载"><Download size={20} /></button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-3 z-10">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-200/50 rounded-full flex items-center justify-center mb-2"><Sparkles size={32} className="text-slate-400" /></div>
                <p className="text-xs lg:text-sm font-medium">结果展示区</p>
              </div>
            )}
            {errorMsg && <div className="absolute top-10 left-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce"><AlertCircle size={18} className="shrink-0" /><span className="text-xs font-medium break-all">{errorMsg}</span></div>}
          </div>

          {/* Terminal Area - [修正] Desktop Only visibility for detailed logs, or compacted on mobile */}
          <div className="hidden lg:flex h-[280px] bg-white border-t border-slate-200 p-6 flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Control Terminal</span>
            </div>
            <textarea readOnly value={terminalText || '// 系统就绪...'} className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg resize-none outline-none leading-5 shadow-inner opacity-95" />

            <div className="flex gap-3">
              <button onClick={() => handleGenerate('gemini')} disabled={loading || (!imageData && mode !== 'custom')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Cpu size={18} /> Gemini 渲染
              </button>
              <button onClick={() => handleGenerate('jimeng')} disabled={loading || (!imageData && mode !== 'custom')} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 px-4 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Paintbrush size={18} /> 即梦 渲染
              </button>
              <button onClick={handleCopy} disabled={!resultImg} className="w-[120px] border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-600 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 disabled:opacity-50">
                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? '已保存' : '复制配置'}
              </button>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxSrc && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200" onClick={() => setLightboxSrc(null)}>
            <img src={lightboxSrc} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="flex items-center gap-2 px-4 py-2 lg:px-6 bg-white/10 hover:bg-white text-white hover:text-black rounded-full border border-white/20 transition-all font-medium text-xs lg:text-sm"><Download size={16} /> 下载</button>
              <button onClick={() => setLightboxSrc(null)} className="p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full border border-white/20 transition-all"><X size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}