"use client";
import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageReady: (base64: string | null) => void;
}

export default function UploadZone({ onImageReady }: UploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 核心：图片压缩逻辑 (从旧版移植)
  const processFile = async (file: File) => {
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = bmp.width;
      let h = bmp.height;
      const maxDim = 1536; // 限制最大边长
      
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w *= scale;
        h *= scale;
      }
      
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(bmp, 0, 0, w, h);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85); // 0.85 质量
      
      setPreview(compressedBase64);
      // 传递给父组件 (去掉 data:image/jpeg;base64, 前缀)
      onImageReady(compressedBase64.split(',')[1]);
      
    } catch (e) {
      console.error("Image processing error", e);
      alert("图片解析失败，请尝试其他格式");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageReady(null);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">视觉参考源</div>
      <div 
        className={`relative h-40 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'}
          ${preview ? 'border-solid border-indigo-600' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="text-center text-slate-400 pointer-events-none">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">点击或拖入图片</p>
          </div>
        )}
      </div>
    </div>
  );
}