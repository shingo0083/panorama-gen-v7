// src/lib/constants.ts

export interface CostumeData {
    label: string;
    titles?: { poetic: string; style: string };
    bg?: string;
    outerTexture?: { name: string; prompt: string };
    inners: string[] | { name: string; type?: string; desc?: string }[];
    items?: string[];
    sets?: Record<string, { n: string; i: string }>;
}

export interface DarkRoleData {
    label: string;
    prompt_ctx: string;
}

export interface CharacterData {
    label: string;
    game_logo?: string;
    logo?: string;     
    outer: string;
    outer_2p?: string;
    inner_top: string;
    inner_bottom: string;
    accessories?: string;
    moves?: string[];
}

// [修改] 增加 'custom'
export type ModeType = 'hanfu' | 'qipao' | 'dark' | 'arcade' | 'comic' | 'general' | 'custom';

// ... (HANFU_DB, QIPAO_DB, DARK_ROLES, ARCADE_ROLES, COMIC_ROLES, COMMON 保持不变，请保留原有的长数据) ...
// 为了节省篇幅，这里略过中间的巨型数据字典，请您保留之前的 ARCADE_ROLES 等所有数据不变 //

export const HANFU_DB = { ... }; // (请保留原内容)
export const QIPAO_DB = { ... }; // (请保留原内容)
export const DARK_ROLES = { ... }; // (请保留原内容)
export const ARCADE_ROLES = { ... }; // (请保留原内容)
export const COMIC_ROLES = { ... }; // (请保留原内容)
export const COMMON = { ... }; // (请保留原内容)

// [修改] 注册 custom 模式的元数据
export const MODE_METADATA: Record<string, { label: string, tier: 'STANDARD' | 'PREMIUM' }> = {
    hanfu:   { label: '汉服工坊', tier: 'STANDARD' },
    qipao:   { label: '民国旗袍', tier: 'STANDARD' },
    general: { label: '通用概念', tier: 'STANDARD' },
    custom:  { label: '自由发挥', tier: 'STANDARD' }, // [New]
    
    dark:    { label: '深夜放映厅', tier: 'PREMIUM' },
    arcade:  { label: '格斗全明星', tier: 'PREMIUM' },
    comic:   { label: '漫改全明星', tier: 'PREMIUM' },
};