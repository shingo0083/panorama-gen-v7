import { 
    HANFU_DB, 
    QIPAO_DB, 
    DARK_ROLES, 
    ARCADE_ROLES, 
    COMIC_ROLES 
} from './constants';

export type GenerateParams = {
    mode: string;
    dynasty?: string;       
    inner?: string;         
    items?: string;         
    pose?: string;
    cup?: string;
    body_type?: string;
    face_desc?: string;
    outer_desc?: string;    
    desc?: string;          
    style?: string;         
    gen_inner?: string;     
    accessorySet?: 'A' | 'B';
    
    // Arcade / Comic
    arc_role?: string;
    arc_vfx?: string;
    arc_color?: string;
    comic_role?: string;
    comic_vfx?: string;
    comic_color?: string;

    // [New] Custom
    custom_prompt?: string;
};

// 辅助函数
const sanitize = (str: string | undefined): string => {
    return (str || "").replace(/[^\w\s\u4e00-\u9fa5,.:()-]/g, "").substring(0, 300);
};

const getStandardCupDescription = (cup: string = "C Cup") => {
    const descriptions: Record<string, string> = {
        "A Cup": "She has a slender and petite chest, embodying an intellectual flat aesthetic. The qipao fabric drapes loosely over her chest with straight, elegant lines.",
        "B Cup": "She has a slim and natural figure. The qipao fits gently without stretching, maintaining a graceful and understated silhouette.",
        "C Cup": "She has natural full curves and a classic hourglass shape. The bodice is fitted, perfectly tracing the feminine form.",
        "D Cup": "She has a curvaceous and ample figure. The qipao fits snugly, highlighting a defined and womanly silhouette.",
        "E Cup": "She has a voluptuous and heavy bust. The fabric is stretched across her chest, creating a deep curve and emphasizing a lush, mature figure.",
        "F Cup": "She has an extremely voluptuous, heavy bust. The qipao fabric is tightly stretched across her chest, creating high tension on the buttons and distinct shadows under the bust, highlighting a powerful, curvy silhouette."
    };
    return descriptions[cup] || descriptions["C Cup"];
};

export const PromptBuilder = {
    hanfu: (params: GenerateParams) => {
        const dynastyKey = params.dynasty || "Ming";
        const d = HANFU_DB[dynastyKey] || HANFU_DB["Ming"];
        const items = sanitize(params.items);
        const innerName = sanitize(params.inner) || (d.inners[0] as any).name;
        let innerDesc = `仅穿着【${innerName}】`;
        let innerLabel = innerName.split(" (")[0];
        if (["诃子","抹胸","主腰","肚兜","心衣"].some(k => innerName.includes(k))) innerDesc += `，并搭配**素色绸缎袴 (Silk Trousers/Ku)**`;
        const itemsPrompt = items.split(',').filter(i => i).map(i => `${i.trim()} (casting distinct shadow on wall)`).join('、') || "无特殊物品";
        const faceInstruction = params.face_desc ? `**Face ID**: ${sanitize(params.face_desc)}. (Strictly maintain this facial identity)` : "完全依照原图 (Strictly lock face features from source image)";
        const outerDetail = params.outer_desc ? `细节微调：${sanitize(params.outer_desc)}` : "";

        return `
【🎭 专家团队设定】
1. **服饰史学家**：严格把控 [${d.label}] 的形制细节。
2. **东方美学导演**：设计含蓄唯美的姿态。
3. **法医级面部专家**：确保面部特征 100% 还原原图。

【🎯 核心任务】
生成一张【竖向 2K 超写实古风角色设定图】。
**风格**：**超写实东方美学摄影**。
**关键**：所有悬浮元素必须有**清晰、深色的真实投影**。

【🛡️ P0：面部锁定】
- **视觉锚点**：死锁原图的面部特征。
- **辅助信息**：${faceInstruction}

【🗡️ P1：重构指令】
- **外装**：⚠️ [外装重构]：忽略原图衣服。角色身穿一套【${d.label}】。${outerDetail}
- **姿态**：构建一个【${sanitize(params.pose)}】姿态。
- **体型**：${sanitize(params.body_type)}

【📝 强制文字渲染协议】
- **字体规范**：必须使用**【中国书法字体】**（如行书或魏碑）。
- **文字颜色**：黑色或烫金色。

【🎨 艺术规格】
- **材质核心**：8k 超写实东方摄影，皮肤细腻如瓷，刺绣立体。
- **背景环境**：${d.bg}

【🔤 题名落款】
- **位置**：画面留白处。
- **内容**：竖排书法大字 **“${d.titles?.poetic}”**，旁注小字 **“${d.titles?.style}”**。

【🖼️ 空间布局 (竖向环绕模式)】
**1. 画面主体 (中部)**：角色全身立绘。
**2. 悬浮图鉴 (左右自然环绕)**：
- **内着设计**：悬浮的**【超写实活体女性躯干特写】**。
  - **核心**：真人躯干，有体温感。
  - **着装**：${innerDesc}。
  - **标签**：${innerLabel}。
- **皇家织造特写**：
  1. 皮肤微距：真实毛孔。
  2. 外装工艺：[${d.outerTexture?.name}] - ${d.outerTexture?.prompt}。
  3. 内着质感：丝绸光泽。
- **东方神韵 (微表情)**：
  - 4个表情：垂眸低眉、浅笑安然、眼波流转、含情脉脉。
- **随身雅物**：${itemsPrompt}。标签：[物品名称]。
- **Connection Lines**: Use **fine, hand-drawn ink lines** to connect items to the character.

**Negative**: --no modern buildings, western clothing, bikini, messy lines, bad anatomy, cartoonish face.`;
    },

    qipao: (params: GenerateParams) => {
        const styleKey = params.dynasty || "Style01";
        const d = QIPAO_DB[styleKey] || QIPAO_DB["Style01"];
        const accSetKey = params.accessorySet || "A";
        const accSets = d.sets ? d.sets[accSetKey] : {n:"Default", i:""}; 
        const accItems = accSets.i.split('、'); 
        const cupDesc = getStandardCupDescription(params.cup);
        const itemsPrompt = accItems.map(i => `"${i}" (Floating Item with shadow & connection line)`).join(', ');
        const faceInstruction = params.face_desc ? `**Face ID**: ${sanitize(params.face_desc)}` : "Strictly lock face from image.";
        const outerDetail = params.outer_desc ? `Details: ${sanitize(params.outer_desc)}` : "";
        const innerName = sanitize(params.inner);

        return `
# Role: Vintage Fashion Illustrator & Cinema Director
**Task**: Create a "Cinematic Character Sheet" for [${d.label}].
**Style**: ${d.bg} (8k Resolution, Photorealistic, High-end Fashion Photography).

# P0: Face Lock
**Strictly maintain the facial features from the source image.** DO NOT change the face to any celebrity. ${faceInstruction}

# P1: Outfit & Pose
- **Main Figure**: Wearing [${d.label}]. 
- **Body & Fit**: **${cupDesc}** (Strictly apply this body shape description).
- **Fabric**: [${d.outerTexture?.name}]. ${d.outerTexture?.prompt}. ${outerDetail}.
- **Pose**: [${sanitize(params.pose)}]. Cinematic, emotional, S-curve silhouette.

# P2: Visual Layout (Single Continuous Cinematic Scene)
**CRITICAL**: The image must be one continuous photograph of a single room.
- The character stands on the left.
- The breakdown elements float against the wall on the right side of the **SAME** room.
- **DO NOT** create a split screen.

## ⚠️ MANDATORY GRAPHIC ELEMENTS (Right Side):
1. **Connection Lines**: Use **fine, hand-drawn ink lines** to connect items to the character.
2. **Text Labels**: Traditional Chinese Calligraphy font (繁体书法).
3. **Shadows**: All elements must cast **deep, realistic contact shadows** on the background wall.

## Right Side Components:
1.  **Innerwear Product Shot (Natural Suspension)**: 
    * **Visual**: A high-end, photorealistic product photograph of the floating [${innerName}].
    * **Physics**: The garment is displayed with **soft cloth physics**, appearing to hang or rest naturally. **Avoid rigid, inflated, or plastic-like ghost shapes.** If it is a bra or corset, show it with **soft, relaxed straps and natural fabric texture**, not like a hard shell.
    * **Detail**: Focus on the exquisite material quality and tailoring. **NO HUMAN BODY, NO SKIN, NO MANNEQUIN.**
    * **Label**: "${innerName}".

2.  **Texture Micro-Shots (Circles)**:
    * Zoom 1: Qipao fabric (${d.outerTexture?.name}). Label: "面料".
    * Zoom 2: Collar/Neck area. Label: "领口".

3.  **Vintage Props (${accSets.n})**:
    * Floating items: ${itemsPrompt}.
    * **Shadows**: Crucial deep shadows grounding them to the wall.
    * **Labels**: Add Chinese name next to each item.

4.  **Cinematic Expressions**: 
    * 4 film-strip style headshots.
    * **LABELS**: "忧郁 (Melancholy)", "迷人 (Charming)", "优雅 (Elegant)", "隐秘 (Secretive)".

**Title**: Vertical Calligraphy **"${d.titles?.poetic}"** (Large) & **"${d.titles?.style}"** (Small).

**Negative**: --no split screen, --no divided background, --no paper background, --no human body for innerwear, --no skin for innerwear, --no mannequin, --no stiff plastic shape, --no flat photo style, --no illustration, --no cartoon, --no low resolution, --no Maggie Cheung face, --no obese character, --no plus size unless specified. --ar 3:4`;
    },

    dark: (params: GenerateParams) => {
        const roleKey = params.inner || "OL"; 
        const mood = params.pose || "Emotional"; 
        const tagline = params.desc || "Debut / No.1 / Exclusive";
        const cup = params.cup || "C Cup";
        const faceDesc = params.face_desc ? `**Face ID**: ${sanitize(params.face_desc)}` : "Strictly lock face from image.";
        const selectedRoleObj = DARK_ROLES[roleKey] || DARK_ROLES["OL"]; 
        const selectedRole = selectedRoleObj.prompt_ctx;

        let cupPhysics = "";
        if (["A Cup", "B Cup"].includes(cup)) {
            cupPhysics = "Slender silhouette. Fabric hangs loosely, emphasizing a delicate frame.";
        } else if (["C Cup", "D Cup"].includes(cup)) {
            cupPhysics = "Natural curves. Fabric fits snugly, creating a balanced and healthy silhouette.";
        } else { 
            cupPhysics = "**High-Tension Fabric Mechanics**. The clothing material is visibly **stretched tight**. Emphasize the **visual weight** and heavy drape. Buttons appear under tension due to the fit.";
        }

        return `
# Role: Avant-Garde Film Poster Designer & Art Photographer
# Task: Design a **"High-Impact Psychological Thriller Movie Poster"**.

# Core Subject
- **Role Script**: ${selectedRole}
- **Atmosphere**: ${sanitize(mood)}. **Visual Noise**: Add film grain, chromatic aberration, lens flares to create a "Raw/Documentary" feel.
- **Face**: ${faceDesc}.
- **Silhouette**: ${cup}. **Physics**: ${cupPhysics}.
- **Background**: **Hyper-Detailed & Cluttered**. No empty space. Fill with environmental storytelling elements.

# Layout & Typography (The "Commercial Look")
You MUST overlay complex text elements to mimic a commercial product package:
- **Headline**: **HUGE, BOLD Japanese/Chinese Text** (Neon Pink/Gold). Content: "${sanitize(tagline)}", "解禁", "衝擊", "完全版", "独占".
- **Sub-text**: Use distinct blocks of small white text in the corners.
  - "收 録: 120min", "高画質", "VR対応", "No.1".
  - **Obi-Strip**: A vertical graphical bar on the side with dense promotional text.

# Cinematography
- **Lighting**: "Paparazzi Flash" style (Hard direct light) mixed with "Neon Noir" background lights.
- **Texture**: High-fidelity skin rendering. Use **"Cinematic Sheen"** (mist/rain/glow) to add texture.
- **Safety**: **NO Nudity.** Focus on "Psychological Tension" and "Fashion Aesthetics".

**Negative**: --no nudity, --no explicit content, --no biological exposure, --no ugly font, --no flat image, --no low resolution.
--ar 3:4`;
    },

    general: (params: GenerateParams) => {
        const style = sanitize(params.style) || "2D Concept Art Style"; 
        const inner = sanitize(params.inner) || "Context-based Lingerie";
        const desc = sanitize(params.desc) || "Original Character";
        const cup = params.cup || "Auto-detected";
        const bodyType = params.body_type || "Standard";
        const pose = sanitize(params.pose) || "Standard Standing";
        
        return `
# Role: Elite Concept Artist & Character Designer
**Expertise**: Pixel-level breakdown, Fashion Layering, Visual Profiling, Anatomy Estimation.

# Task: Generate a "Panoramic Depth Concept Breakdown Sheet" (全景式角色深度概念分解图).
**Source Integration**: 
1. **Face**: Strictly reconstruct the face based on the uploaded image. If occluded, logically reconstruct it based on style.
2. **Missing Limbs**: If the uploaded image is cropped (half-body), you MUST logically regenerate the full legs and feet to form a COMPLETE standing figure.

# Visual Specifications (10:16 Portrait)
- **Composition**: Central main character (Full Body) surrounded by floating disassembled elements.
- **Background**: Parchment texture or Technical Grid (Design Blueprint atmosphere).
- **Connection**: DRAW clear, sketch-style **GUIDE LINES (Arrows)** connecting every floating item back to its original location on the character body.

# Core Breakdown Components (Floating Around):

## 1. Fashion Layering (Independent Display)
- **Outer Layers**: Floating coats/jackets.
- **Inner Layers**: Floating underwear/lingerie [${inner}]. 
  - **Constraint (CRITICAL)**: Display on a **"Hyper-realistic Living Torso" (超写实活体躯干)**. 
  - **Details**: Real human skin texture, body warmth, soft skin depression from straps. **NO HEAD, NO LIMBS**, just the torso to showcase the fit.

## 2. Scientific Body Data Panel (Bottom Right)
- **Visual**: A "Da Vinci Style" outline overlay.
- **Content**: Estimate data based on visual analysis of [${bodyType}, ${cup}].
- **Requirement**: Use dotted lines pointing to the specific body parts.

## 3. Lifestyle Profiling (The "Bag Dump")
- **Open Bag**: A commuting bag relevant to the character's style [${desc}], shown open.
- **Contents**: 5-7 everyday items scattered out (Phone, Keys, Lipstick, etc.).

## 4. Private Profiling (Intimate Items)
- **Logic**: Based on [${desc}], deduce private habits.
- **Item**: 1-2 **High-Design Personal Items**. Display as product sketches.

## 5. Anatomical Detail (Feet Close-ups) - [NEW]
- **Requirement**: Add two specific circular zoom-in windows showing feet details:
  - **A. Instep (脚背)**: Show the arch structure and skin veins.
  - **B. Sole (脚底)**: Show the soft skin texture and sole shape.

# Text & Labeling Rules
1. **MANDATORY CHINESE LABELS**: Every single floating item (Clothes, Bag contents, Private items, Feet) MUST have a **CHINESE Label** (e.g., "真丝衬衫", "口红", "脚背细节").
2. **Bilingual**: You may add small English sub-labels, but CHINESE must be the main display language.
3. **Quality**: Text must be Vector-Level Sharpness.

# Style & Rendering
- **Art Style**: ${style} (Clean lines, Professional Concept Art).

**Negative**: --no cropped legs, --no missing feet, --no blurry text, --no messy lines, --no low resolution, --no plastic mannequin.
--ar 3:4`; 
    },

    arcade: (params: GenerateParams) => {
        const role = params.arc_role || "Kunoichi";
        const winPose = params.pose || "Fan Victory";
        const vfx = params.arc_vfx || "None";
        const colorMode = params.arc_color || "1P";
        const userDetails = sanitize(params.desc);
        const cup = params.cup || "C Cup";
        const faceDesc = params.face_desc ? `**Face ID**: ${sanitize(params.face_desc)}` : "Strictly maintain user's real face structure.";

        const arche = ARCADE_ROLES[role] || ARCADE_ROLES["Kunoichi"];
        let costumeDesc = arche.outer;
        if (colorMode === "2P") { costumeDesc = arche.outer_2p || "Alternate Color Palette"; }
        if (userDetails) costumeDesc += `. Extra Details: ${userDetails}`;

        let cupPhysics = "";
        if (["A Cup", "B Cup"].includes(cup)) {
            cupPhysics = "**High-Agility Fit**. Costume fits smoothly without strain. Fabric drapes naturally, emphasizing a lightweight, aerodynamic silhouette.";
        } else if (["C Cup", "D Cup"].includes(cup)) {
            cupPhysics = "**Athletic Structural Fit**. The costume follows the body curves perfectly with realistic support. Fabric shows natural tension without distortion.";
        } else {
            cupPhysics = `**Maximum Volumetric Tension**. **IMPORTANT**: The subject's bust size [${cup}] forces the costume material to STRETCH tightly. Seams, buttons, and straps are under visible high stress. The outfit appears dangerously tight, struggling to contain the form. Realistic heavy gravity effects.`;
        }

        return `
# Role: Professional Portrait Photographer & Costume Designer
# Task: Create a **"TGS (Tokyo Game Show) Convention Level Cosplay Analysis Sheet"**.
# Concept: "The Reality of Cosplay" - Real person wearing game gear + Gear Breakdown.

# 1. Main Visual (Center Subject)
- **Subject**: A **REAL HUMAN** Asian woman (Professional Cosplayer) wearing [${arche.label}] costume. **NO 3D MODEL FACE.**
- **Costume**: ${costumeDesc}. High quality fabric rendering (Stitching, Wrinkles).
- **Body**: ${cup}, Athletic Physique. **Physics**: ${cupPhysics}.
- **Skin**: Real pores, sweat sheen, muscle tone.
- **Pose**: **${winPose}**. (A signature move from the game).
- **Face**: ${faceDesc}.
- **VFX**: ${vfx} (Photorealistic environmental effect, e.g. Heat Haze, Petals).

# 2. Surround Layout: "Gear Explosion" (Surrounding Items)
Float the disassembled gear components in empty spaces (Left/Right/Top):
- **Top**: Headgear / Masks / Hair accessories.
- **Middle**: Gloves / Gauntlets / Arm guards.
- **Bottom**: Boots / Shoes / Stockings.
- **CONNECTORS (MANDATORY)**: Draw clear, thin **Leader Lines** linking each floating gear back to its position on the main character. The line MUST originate from the floating item and point to the character body.

# 3. Inner Structure (Crucial Logic)
You MUST display the **"Safety Measures"** (Undergarments) as **two separate** floating items on mannequin parts:
1.  **Top Inner**: **${arche.inner_top}**.
2.  **Bottom Inner**: **${arche.inner_bottom}**.
- *Reasoning*: Cosplayers wear these for safety and comfort under costumes.

# 4. Ambience & Branding
- **Background**: **"Blurred Convention Center Crowd"**. Bokeh lights, convention booth structures in soft focus background. Creates depth and realism.
- **Logo**: A **SMALL, Discreet Metallic Logo** in Top Left: "**${arche.game_logo}**".

# 5. Labeling
- Use **Chinese/English Labels** for all floating items.
- Example: "手套 (Gloves)", "戦闘内着 (Innerwear)", "靴子 (Boots)".

**Negative**: --no game hud, --no health bar, --no 3d render face, --no cartoon face, --no nudity, --no missing limbs.
--ar 3:4`;
    },

    comic: (params: GenerateParams) => {
        const role = params.comic_role || "Navigator";
        const pose = params.pose || "Classic";
        const vfx = params.comic_vfx || "None";
        const colorStyle = params.comic_color || "Anime"; 
        const userDetails = sanitize(params.desc);
        const cup = params.cup || "C Cup";
        const faceDesc = params.face_desc ? `**Face ID**: ${sanitize(params.face_desc)}` : "Strictly maintain user's real face structure.";

        const arche = COMIC_ROLES[role] || COMIC_ROLES["Navigator"];

        let styleMod = "";
        let colorMod = "";
        if (colorStyle === "Manga") {
            styleMod = "Noir Art Photography. High contrast Black & White realism with selective distinct textures.";
            colorMod = "Monochrome with realistic lighting shadows.";
        } else {
            styleMod = "Cinematic Live-Action Photography. Vibrant, rich color grading typical of high-budget movie adaptations.";
            colorMod = "True-to-life colors with cinematic lighting.";
        }

        let cupPhysics = "";
        if (["A Cup", "B Cup"].includes(cup)) {
            cupPhysics = "**High-Fashion Slender Silhouette**. Costume fabric drapes naturally with a loose fit. Emphasize collarbones and a delicate, agile frame. No fabric strain.";
        } else if (["C Cup", "D Cup"].includes(cup)) {
            cupPhysics = "**Athletic Fit**. Costume fits snugly, following natural organic curves. Realistic support and structure without excessive stretching.";
        } else { 
            cupPhysics = `**Maximum Volumetric Tension**. **IMPORTANT**: The subject's bust size [${cup}] overrides the costume's original design. The fabric is visibly **STRETCHED TIGHT** across the chest. Buttons, seams, or openings show **realistic stress lines**. If the costume is a dress or kimono, the front is pushed open due to volume.`;
        }

        return `
# Role: Hollywood Costume Designer & Cinema Photographer
# Task: Create a **"Live-Action Movie Character Costume Breakdown"**.
# Concept: **"Real World Adaptation"**. Not a drawing, but a Photograph of a real actor on set.

# 1. Main Visual (Center Subject)
- **Subject**: A **REAL HUMAN** Asian woman (Actress) wearing [${arche.label}] costume. **NO 2D/3D ANIMATION STYLE.**
- **Costume**: ${arche.outer}. ${userDetails}. Fabric: Real world materials (Cotton, Silk, Denim, Leather).
- **Body**: ${cup}. **Physics**: ${cupPhysics}.
- **Pose**: **${pose}**. Dynamic action pose adapted for real life.
- **Face**: ${faceDesc}. Real skin pores, eyelashes, natural makeup.
- **VFX**: ${vfx} (Rendered as **Practical Effects**, e.g. Real smoke, real sparks, stage lighting).

# 2. Surround Layout: "Prop Department Breakdown"
Float the disassembled gear components in empty spaces (Left/Right/Top):
- **Top**: Headgear / Wigs / Unique Accessories.
- **Middle**: Weapons / Tools / Arm guards.
- **Bottom**: Shoes / Boots / Leg warmers.
- **CONNECTORS (MANDATORY)**: Draw distinct **Black Leader Lines** connecting each prop item back to the main body. Lines must be straight and technical.

# 3. Inner Structure (Costume Department Reality)
Display the "Under-structure" required for the actress to wear this costume:
1.  **Top Inner**: **${arche.inner_top}**. (Displayed on a hyper-realistic mannequin torso).
2.  **Bottom Inner**: **${arche.inner_bottom}**. (Displayed on a hyper-realistic mannequin hip).
- Label: "衣装設定 (Costume Set)" or "内構 (Inner)".

# 4. Background & Branding
- **Background**: **"Movie Set Location"**. (e.g. Real Pirate Ship Deck / Real Forest / Tokyo Street). **Photographic Blur (Bokeh)**.
- **Logo**: A **Cinema-Style Title** in Top Left: "**${arche.logo}**".

# 5. Visual Style: **PHOTOREALISM**
- **Style**: ${styleMod}
- **Color Grading**: ${colorMod}
- **Texture**: **8k resolution photography**. Cloth threads, skin texture, metal scratches must be visible.
- **Labeling**: Format **"[Chinese Name] ([English Name])"**. Sharp text.

**Negative**: --no anime style, --no manga drawing, --no cel shading, --no 2d, --no illustration, --no painting, --no plastic skin.
--ar 3:4`;
    },

    // [New] Custom Mode Strategy
    custom: (params: GenerateParams) => {
        const userPrompt = sanitize(params.custom_prompt) || "Best quality, masterpiece.";
        
        return `
# Role: Professional AI Art Director & Concept Artist
# Task: Execute the user's custom creative prompt with high fidelity.

# User Input:
"${userPrompt}"

# Execution Guidelines:
1. **Adherence**: Follow the user's prompt strictly.
2. **Quality Enhancement**: Apply "8k resolution, photorealistic lighting, high detail, masterpiece" styles unless the user specified a conflicting style (like 'sketch' or 'anime').
3. **Face Consistency**: If a reference image is provided, strictly maintain the facial features and structure.

**Negative**: --no low quality, --no blurry, --no watermark, --no bad anatomy.
--ar 3:4`;
    }
};