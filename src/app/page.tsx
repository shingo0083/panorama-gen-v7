"use client";
import { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Download, AlertCircle } from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import ControlPanel from '@/components/ControlPanel';
import { ModeType } from '@/lib/constants';

// 默认配置生成器
const getDefaultConfig = (mode: ModeType) => {
    const base = { cup: 'C Cup', body_type: '自动推算', face_desc: '', outer_desc: '', desc: '' };
    switch (mode) {
        case 'hanfu': return { ...base, dynasty: 'Ming', inner: '明制主腰', pose: '端庄站立', items: [] };
        case 'qipao': return { ...base, dynasty: 'Style01', inner: '真丝吊带衬裙', accessorySet: 'A', pose: '步步生莲' };
        case 'dark': return { ...base, inner: 'OL', pose: '羞耻特写' };
        case 'arcade': return { ...base, arc_role: 'Kunoichi', arc_color: '1P', arc_vfx: '无 (None)', pose: '💃 胜利: 摇扇弯腰 (Bouncing)' };
        case 'comic': return { ...base, comic_role: 'Navigator', comic_color: 'Anime', comic_vfx: '无 (None)', pose: '😉 招牌: 俏皮眨眼 (Wink)' };
        default: return { ...base, gen_style: '2D Concept Sketch', gen_inner: 'Context-based', pose: 'Standard Standing' };
    }
};

export default function Home() {
  const [mode, setMode] = useState<ModeType>('hanfu');
  const [config, setConfig] = useState<any>(getDefaultConfig('hanfu'));
  const [imageData, setImageData] = useState<string | null>(null);
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 切换模式时重置配置
  useEffect(() => {
    setConfig(getDefaultConfig(mode));
    setPromptText(''); 
  }, [mode]);

  // 重置全部
  const handleClearImage = () => {
     setImageData(null);
     setConfig(getDefaultConfig(mode));
     setPromptText('');
  };

  const handleGenerate = async () => {
    if (!imageData) {
        alert("请先上传参考图片");
        return;
    }
    
    setLoading(true);
    setErrorMsg(null);
    
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_data: imageData,
                params: { mode, ...config }
            })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Generate failed");
        
        setResultImg(`data:image/jpeg;base64,${data.image_base64}`);
        setPromptText(data.generated_prompt || "No prompt returned");
        
    } catch (e: any) {
        setErrorMsg(e.message);
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = () => {
    if(promptText) {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if(!resultImg) return;
    const a = document.createElement('a');
    a.href = resultImg;
    a.download = `${mode}_${Date.now().toString(36).slice(-6).toUpperCase()}.jpg`;
    a.click();
  };

  return (
    <main className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* LEFT PANEL: CONFIGURATION */}
      <div className="w-[420px] flex flex-col border-r bg-white shadow-sm z-10">
        
        {/* Header */}
        <div className="p-5 border-b bg-white/80 backdrop-blur sticky top-0 z-20">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
             <h1 className="text-lg font-black tracking-tight text-slate-900">设定装配 V7</h1>
           </div>
           
           <div className="mt-4">
             <select 
               value={mode}
               onChange={(e) => setMode(e.target.value as ModeType)}
               className="w-full p-3 font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
             >
                <option value="hanfu">🏮 汉服工坊 (Hanfu)</option>
                <option value="qipao">📻 民国旗袍 (Qipao)</option>
                <option value="arcade">👊 格斗全明星 (Arcade)</option>
                <option value="comic">✨ 漫改全明星 (Comic)</option>
                <option value="dark">🖤 深夜放映厅 (Dark)</option>
                <option value="general">🌐 通用·概念拆解 (General)</option>
             </select>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-20 scrollbar-thin">
           <UploadZone 
             onImageReady={(data) => {
                if(data) setImageData(data);
                else handleClearImage(); // Handle clear click from within component
             }} 
           />
           
           <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-slate-200"></div>
             </div>
             <div className="relative flex justify-center">
               <span className="bg-white px-2 text-xs font-medium text-slate-400">参数配置</span>
             </div>
           </div>

           <ControlPanel mode={mode} config={config} onChange={setConfig} />
        </div>
      </div>

      {/* RIGHT PANEL: RESULT & TERMINAL */}
      <div className="flex-1 flex flex-col bg-slate-100 relative">
         
         {/* Main Viewer Area */}
         <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
            
            {loading ? (
                <div className="flex flex-col items-center gap-4 z-10 animate-pulse">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-indigo-600 font-bold tracking-widest text-sm">正在构建世界...</div>
                </div>
            ) : resultImg ? (
                <div className="relative group z-10 h-full">
                    <img src={resultImg} className="h-full object-contain shadow-2xl rounded-lg cursor-zoom-in" onClick={() => window.open(resultImg)} />
                    <button 
                      onClick={handleDownload}
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105"
                      title="下载原图"
                    >
                        <Download size={20} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center text-slate-400 gap-3 z-10">
                    <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                        <Sparkles size={40} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">等待生成指令</p>
                </div>
            )}
            
            {errorMsg && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-bounce">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}
         </div>

         {/* Bottom Terminal & Actions */}
         <div className="h-[280px] bg-white border-t border-slate-200 p-6 flex flex-col gap-4 shadow-xl z-20">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prompt Terminal</span>
                </div>
             </div>
             
             <textarea 
                readOnly 
                value={promptText || '// 系统就绪...'}
                className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg resize-none outline-none leading-5 shadow-inner opacity-90"
             />

             <div className="flex gap-4">
                 <button 
                    onClick={handleGenerate}
                    disabled={loading || !imageData}
                    className="flex-3 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-6 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                 >
                    {loading ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {loading ? '正在渲染...' : '立即渲染'}
                 </button>
                 
                 <button 
                    onClick={handleCopy}
                    disabled={!promptText}
                    className="flex-1 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-600 py-3.5 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 disabled:opacity-50"
                 >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? '已复制' : '复制咒语'}
                 </button>
             </div>
         </div>

      </div>
    </main>
  );
}