"use client";
import { useEffect } from 'react';
import { 
  HANFU_DB, QIPAO_DB, DARK_ROLES, ARCADE_ROLES, COMIC_ROLES, COMMON, 
  ModeType 
} from '@/lib/constants';

type ConfigType = Record<string, any>;

interface ControlPanelProps {
  mode: ModeType;
  config: ConfigType;
  onChange: (newConfig: ConfigType) => void;
}

export default function ControlPanel({ mode, config, onChange }: ControlPanelProps) {
  
  // 辅助组件：通用下拉菜单
  const Select = ({ label, options, value, field }: any) => (
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange({ ...config, [field]: e.target.value })}
        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      >
        {options.map((o: any) => (
          <option key={o.val} value={o.val}>{o.txt}</option>
        ))}
      </select>
    </div>
  );

  // 辅助组件：标签选择器
  const TagSelector = ({ label, tags, value, field }: any) => (
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => (
          <button
            key={tag}
            onClick={() => onChange({ ...config, [field]: tag })}
            className={`px-3 py-1.5 text-xs rounded-md border transition-all
              ${value === tag 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  // 辅助组件：多选标签 (Hanfu Items)
  const MultiTagSelector = ({ label, tags, value = [], field }: any) => (
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => {
          const isActive = value.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => {
                const newValue = isActive 
                  ? value.filter((i: string) => i !== tag)
                  : [...value, tag];
                onChange({ ...config, [field]: newValue });
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-all
                ${isActive 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  );

  // 辅助组件：文本输入
  const TextInput = ({ label, placeholder, value, field }: any) => (
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange({ ...config, [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
      />
    </div>
  );

  // 辅助组件：配饰套餐选择 (Qipao)
  const AccessorySelector = ({ sets, value, field }: any) => (
    <div>
       <label className="text-xs font-bold text-slate-500 mb-1 block">👜 配饰套餐</label>
       <div className="flex gap-2">
         {['A', 'B'].map((key) => {
             const set = sets[key];
             const isActive = value === key;
             return (
               <div 
                 key={key}
                 onClick={() => onChange({...config, [field]: key})}
                 className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${isActive ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-400'}`}
               >
                 <div className={`text-xs font-bold mb-1 ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>{set.n}</div>
                 <div className="text-[10px] text-slate-500 leading-tight">{set.i}</div>
               </div>
             )
         })}
       </div>
    </div>
  );

  // -------- RENDERERS --------

  if (mode === 'hanfu') {
      const dynasty = config.dynasty || "Ming";
      const currentData = HANFU_DB[dynasty] || HANFU_DB["Ming"];
      const inners = currentData.inners as any[];
      const innerOpts = inners.map(i => ({ val: i.name, txt: i.name }));

      return (
          <div className="space-y-6">
              <Select label="👘 核心形制" options={Object.keys(HANFU_DB).map(k => ({ val: k, txt: HANFU_DB[k].label }))} value={dynasty} field="dynasty" />
              <Select label="🩱 适配内着" options={innerOpts} value={config.inner} field="inner" />
              <TagSelector label="🧍 古典姿态" tags={COMMON.HANFU_POSES} value={config.pose} field="pose" />
              <MultiTagSelector label="👜 专属雅物" tags={currentData.items || []} value={config.items || []} field="items" />
              <TextInput label="📝 面部特征 (Face ID)" placeholder="描述原图面部..." value={config.face_desc} field="face_desc" />
              <TextInput label="👗 外装微调" placeholder="颜色、花纹..." value={config.outer_desc} field="outer_desc" />
              <Select label="📏 身材体型" options={COMMON.BODIES.map(x => ({ val: x, txt: x }))} value={config.body_type} field="body_type" />
          </div>
      );
  }

  if (mode === 'qipao') {
      const dynasty = config.dynasty || "Style01";
      const currentData = QIPAO_DB[dynasty] || QIPAO_DB["Style01"];
      const innerOpts = (currentData.inners as string[]).map(i => ({ val: i, txt: i }));

      return (
        <div className="space-y-6">
            <Select label="📻 年代风情" options={Object.keys(QIPAO_DB).map(k => ({ val: k, txt: QIPAO_DB[k].label }))} value={dynasty} field="dynasty" />
            <Select label="👙 复古内着" options={innerOpts} value={config.inner} field="inner" />
            <AccessorySelector sets={currentData.sets} value={config.accessorySet || 'A'} field="accessorySet" />
            <TagSelector label="💃 电影姿态" tags={COMMON.QIPAO_POSES} value={config.pose} field="pose" />
            <TextInput label="📝 面部特征" placeholder="描述原图面部..." value={config.face_desc} field="face_desc" />
            <Select label="📏 罩杯数据" options={COMMON.CUPS.map(x => ({ val: x, txt: x }))} value={config.cup} field="cup" />
        </div>
      );
  }

  if (mode === 'dark') {
      const roles = Object.keys(DARK_ROLES).map(k => ({ val: k, txt: DARK_ROLES[k].label }));
      return (
        <div className="space-y-6">
            <Select label="🎬 核心剧本" options={roles} value={config.inner} field="inner" />
            <TagSelector label="🫦 氛围状态" tags={COMMON.DARK_MOODS} value={config.pose} field="pose" />
            <TextInput label="🏷️ 封面宣传语" placeholder="例：解禁！/ No.1 / 独占配信..." value={config.desc} field="desc" />
            <Select label="📏 罩杯物理" options={COMMON.CUPS.map(x => ({ val: x, txt: x }))} value={config.cup} field="cup" />
        </div>
      )
  }

  if (mode === 'arcade') {
      const roles = Object.keys(ARCADE_ROLES).map(k => ({ val: k, txt: ARCADE_ROLES[k].label }));
      const currentRole = ARCADE_ROLES[config.arc_role || 'Kunoichi'];
      const moves = currentRole?.moves || [];

      return (
        <div className="space-y-6">
            <Select label="🕹️ 角色原型" options={roles} value={config.arc_role} field="arc_role" />
            <Select label="🎨 配色方案" options={COMMON.COLORS_ARCADE} value={config.arc_color} field="arc_color" />
            <TagSelector label="🤜 招牌动作" tags={moves} value={config.pose} field="pose" />
            <TagSelector label="✨ 现场特效" tags={COMMON.ARCADE_VFX} value={config.arc_vfx} field="arc_vfx" />
            <TextInput label="🎮 细节微调" placeholder="例：战损版..." value={config.desc} field="desc" />
            <Select label="📏 身材数据" options={COMMON.CUPS.map(x => ({ val: x, txt: x }))} value={config.cup} field="cup" />
        </div>
      )
  }
  
  if (mode === 'comic') {
      const roles = Object.keys(COMIC_ROLES).map(k => ({ val: k, txt: COMIC_ROLES[k].label }));
      const currentRole = COMIC_ROLES[config.comic_role || 'Navigator'];
      const moves = currentRole?.moves || [];

      return (
        <div className="space-y-6">
            <Select label="🦸‍♀️ 漫改原型" options={roles} value={config.comic_role} field="comic_role" />
            <Select label="📺 配色风格" options={COMMON.COLORS_COMIC} value={config.comic_color} field="comic_color" />
            <TagSelector label="💫 经典姿势" tags={moves} value={config.pose} field="pose" />
            <TagSelector label="🗯️ 漫画特效" tags={COMMON.COMIC_VFX} value={config.comic_vfx} field="comic_vfx" />
            <TextInput label="📚 细节微调" placeholder="例：两年后造型..." value={config.desc} field="desc" />
            <Select label="📏 身材数据" options={COMMON.CUPS.map(x => ({ val: x, txt: x }))} value={config.cup} field="cup" />
        </div>
      )
  }

  // General Fallback
  return (
      <div className="space-y-6">
           <TagSelector label="🎨 设计风格" tags={COMMON.STYLES} value={config.gen_style} field="gen_style" />
           <TextInput label="🩱 内着倾向" placeholder="Context-based Lingerie..." value={config.gen_inner} field="gen_inner" />
           <TagSelector label="🧘 基础姿态" tags={["标准站立", "模特叉腰", "行走动态", "战斗准备"]} value={config.pose} field="pose" />
           <TextInput label="📝 性格侧写" placeholder="描述..." value={config.desc} field="desc" />
           <Select label="📏 身材数据" options={COMMON.CUPS.map(x => ({ val: x, txt: x }))} value={config.cup} field="cup" />
      </div>
  );
}