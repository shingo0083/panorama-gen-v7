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

// ==========================================
// 业务数据 (Business Data)
// ==========================================

export const HANFU_DB: Record<string, CostumeData> = {
    "Ming": { label: "明代·立领长袄马面", titles: { poetic: "大明风华", style: "织金马面" }, bg: "大明端庄 - 深宅大院的朱红高墙，雪景或秋景。**【特殊光影指令】**：使用**侧逆光 (Side-Rim Lighting)**，强制使前景人物和物品与白色背景（雪/墙）产生高对比，投下清晰的阴影。", outerTexture: { name: "妆花织金 (Gold Weaving)", prompt: "Metallic thread reflection, high gloss satin, structured folds" }, inners: [{name: "明制主腰 (Ming Zhuyao)", type: "normal", desc: "侧开襟收腰设计"},{name: "云肩肚兜 (Yunjian Dudou)", type: "sexy", desc: "带云肩装饰富贵肚兜"}], items: ["手炉(铜制)", "金书(佛经)", "霞帔坠子", "三多九如玉佩", "宫廷细犬", "折扇", "多宝格"] },
    "HighTang": { label: "盛唐·齐胸衫裙", titles: { poetic: "盛唐气象", style: "齐胸衫裙" }, bg: "盛唐华章 - 金碧辉煌的牡丹园，宫廷夜宴，烛光与金器交相辉映。", outerTexture: { name: "瑞锦团花 (Ausurio Brocade)", prompt: "Opulent floral pattern, gold dust reflection, sheer layering" }, inners: [{name: "唐制复原诃子 (Tang Hezi)", type: "sexy", desc: "无肩带织金诃子"},{name: "鲛纱透视大袖 (Sheer Shark Silk)", type: "sheer", desc: "仅穿诃子外罩透明纱"}], items: ["鹦鹉螺杯", "螺甸紫檀琵琶", "团扇", "步摇", "牡丹花枝", "昆仑奴面具", "金银平脱盒"] },
    "EarlyTang": { label: "初唐·间色裙半臂", titles: { poetic: "初唐英姿", style: "间色半臂" }, bg: "初唐气象 - 开阔的皇家园林或马球场，阳光明媚，充满活力与自信。", outerTexture: { name: "联珠纹锦 (Pearl Roundel)", prompt: "Stiff brocade, Persian patterns, high contrast strips" }, inners: [{name: "圆领中衣与袴 (Inner & Trousers)", type: "normal", desc: "利落中性化内搭"},{name: "红抹额与紧身半臂 (Tight Top)", type: "sexy", desc: "西域胡风紧身装束"}], items: ["马球杖", "帷帽(面纱)", "蹀躞带(腰带)", "胡饼", "唐刀", "琉璃盏"] },
    "Song": { label: "宋代·褙子百迭裙", titles: { poetic: "大宋雅韵", style: "珍珠妆褙" }, bg: "宋式雅韵 - 极简的木质庭院，雨打芭蕉，色调清冷淡雅，文人意趣。", outerTexture: { name: "花罗 (Patterned Luo)", prompt: "Subtle jacquard, matte pearl finish, elegant dark weave" }, inners: [{name: "宋抹 (Song Moxiong)", type: "normal", desc: "一片式极简抹胸"},{name: "绣花裹肚 (Embroidered Bellyband)", type: "sexy", desc: "带生活气息的刺绣裹肚"}], items: ["点茶具(茶筅)", "文房四宝", "藤编香薰球", "珍珠面靥", "猫儿", "汝窑瓷器", "线装书"] },
    "WeiJin": { label: "魏晋·杂裾垂髾", titles: { poetic: "魏晋风骨", style: "杂裾垂髾" }, bg: "魏晋风度 - 烟雾缭绕的竹林或山水，清风拂过，追求飘逸与仙气。", outerTexture: { name: "真红罗 (Crimson Luo)", prompt: "Loose woven silk, semi-transparent layering, volumetric flow" }, inners: [{name: "两当内衣 (Liangdang - Vest)", type: "normal", desc: "背心式内衣"},{name: "半透明罗衫 (Sheer Luo Shirt)", type: "sheer", desc: "极致轻薄的透视罗衫"}], items: ["麈尾(拂尘)", "五明扇", "陶牛车模型", "漆器食盒", "竹林酒具", "铁如意", "古琴"] },
    "QinHan": { label: "秦汉·曲裾深衣", titles: { poetic: "秦汉古韵", style: "曲裾深衣" }, bg: "秦汉古朴 - 庄严的阙楼，黑红配色的宫室，铜灯长明，氛围肃穆典雅。", outerTexture: { name: "经锦 (Warp Brocade)", prompt: "Heavy matte silk, geometric patterns, thick drape" }, inners: [{name: "秦汉心衣 (Xinyi - Backless Top)", type: "sexy", desc: "背部敞开的丝绸心衣"},{name: "素纱中衣 (Plain Gauze Inner)", type: "normal", desc: "交领右衽的纯白素纱"}], items: ["博山炉", "漆奁(妆盒)", "长信宫灯", "组玉佩", "竹简", "漆耳杯", "青铜镜"] }
};

export const QIPAO_DB: Record<string, CostumeData> = {
    "Style01": { label: "01. 海派风情·蕾丝滚边", titles: { poetic: "海派风情", style: "蕾丝滚边" }, bg: "1930s Old Shanghai Villa - Vintage wooden floor, dust particles in light, nostalgic tungsten lighting. (Strictly Photorealistic).", outerTexture: { name: "Burnout Velvet (Georgette)", prompt: "Semi-transparent patterned velvet, delicate lace trim edges, floor length" }, inners: ["真丝吊带衬裙 (Silk Slip)", "法式蕾丝胸衣 (French Lace Bra)", "连体塑身衣 (Bodysuit)", "黑色吊带袜套装 (Black Garter Set)", "真空/乳贴 (Pasties Only)"], sets: { A: {n:"名媛午后", i:"羽毛扇、珍珠项链、口金包、细长香烟"}, B: {n:"午夜百乐门", i:"威士忌杯、钻石耳夹、丝绒手套、打火机"} } },
    "Style02": { label: "02. 花样年华·港式立领", titles: { poetic: "花样年华", style: "港式立领" }, bg: "Cinematic Hong Kong 60s Aesthetic - Narrow corridor, peeling paint, flickering neon green/red light, moody shadows.", outerTexture: { name: "Stiff Brocade", prompt: "Extremely high collar, exaggerated hourglass silhouette, glossy satin surface" }, inners: ["聚拢调整型胸衣 (Push-up Bra)", "透明黑丝连裤袜 (Sheer Black Tights)", "极细丁字裤 (Micro Thong)", "全身连体黑丝 (Full Body Stocking)", "蕾丝半杯文胸 (Demi Cup Lace)"], sets: { A: {n:"苏丽珍的房间", i:"云吞面碗、保温壶、复古皮包、麻将牌"}, B: {n:"雨夜幽会", i:"男士西装外套、高跟鞋(脱下)、雨伞、手帕"} } },
    "Style03": { label: "03. 文明新风·倒大袖", titles: { poetic: "文明新风", style: "倒大袖旗袍" }, bg: "1920s Intellectual Atmosphere - University library, soft daylight, grey brick walls. (Photorealistic).", outerTexture: { name: "Indanthrene Cotton", prompt: "Matte cotton texture, loose fit, inverted bell sleeves, low saturation blue/grey" }, inners: ["棉布小马甲 (Cotton Vest)", "素色抹胸 (Plain Bandeau)", "半透蕾丝肚兜 (Sheer Dudou)", "高腰棉质内裤 (High-waist Panties)", "丝绸睡裤 (Silk Bloomers)"], sets: { A: {n:"五四女学生", i:"书本、黑框眼镜、钢笔、油纸伞"}, B: {n:"禁忌文学", i:"线装禁书、怀表、断掉的珍珠、拆信刀"} } },
    "Style04": { label: "04. 乱世佳人·无袖开襟", titles: { poetic: "乱世佳人", style: "无袖开襟" }, bg: "1940s Noir Atmosphere - Misty train station, cinematic low-key lighting, sharp shadows. (Film Noir Aesthetic).", outerTexture: { name: "Structured Rayon", prompt: "Sleeveless cut, geometric plaid pattern, sharp shoulder line, mid-calf length" }, inners: ["美式尖锥胸衣 (Bullet Bra)", "黑色无痕底裤 (Seamless Panties)", "皮革束腰带 (Leather Waist Cincher)", "网眼丝袜 (Fishnet Stockings)", "运动风棉质内衣 (Sporty Cotton Set)"], sets: { A: {n:"特工任务", i:"皮手套、手拎皮箱、宽檐帽、胸针"}, B: {n:"逃亡时刻", i:"手枪(勃朗宁)、破碎的镜子、地图、金条"} } },
    "Style05": { label: "05. 京华烟云·织金大袄", titles: { poetic: "京华烟云", style: "织金大袄" }, bg: "Late Qing Mansion - Rosewood furniture, antique vases, dim lantern light, heavy atmosphere.", outerTexture: { name: "Gold-Thread Embroidery", prompt: "Heavy red silk, elaborate gold dragon/phoenix embroidery, wide sleeves" }, inners: ["织金云肩肚兜 (Gold Yunjian)", "红色丝绸主腰 (Red Silk Zhuyao)", "开档刺绣亵裤 (Embroidered Open Pants)", "珍珠链情趣内衣 (Pearl Chain Lingerie)", "传统红肚兜 (Traditional Red Dudou)"], sets: { A: {n:"大宅门", i:"水烟袋、玉如意、点翠发簪、盖碗茶"}, B: {n:"深闺怨", i:"胭脂盒、鸟笼、剪刀、绣花鞋"} } },
    "Style06": { label: "06. 暗夜玫瑰·高开衩黑裙", titles: { poetic: "暗夜玫瑰", style: "极致开衩" }, bg: "Midnight Jazz Bar - Smoky, dark shadows, single spotlight, red velvet curtains.", outerTexture: { name: "Black Satin", prompt: "Jet black silk, extremely high slit up to hip, backless design" }, inners: ["黑色皮革束身衣 (Leather Corset)", "金属链条文胸 (Chain Bra)", "极细绑带内裤 (Strappy Panties)", "渔网全身袜 (Full Body Fishnet)", "乳胶乳贴 (Latex Pasties)"], sets: { A: {n:"黑寡妇", i:"黑色面纱、长烟斗、红酒杯、左轮手枪"}, B: {n:"致命诱惑", i:"皮鞭、手铐、黑色丝带、红玫瑰"} } },
    "Style07": { label: "07. 薄雾轻纱·透视改良", titles: { poetic: "薄雾轻纱", style: "透视改良" }, bg: "Morning Mist Garden - White sheer curtains, soft morning light, dewdrops, dreamy atmosphere.", outerTexture: { name: "Translucent Tulle", prompt: "White sheer tulle overlay on **form-fitting silk**, **slimming hourglass silhouette**, delicate embroidery, **not loose**" }, inners: ["白色蕾丝成套 (White Lace Set)", "纯白吊带袜 (White Stockings)", "硅胶隐形胸贴 (Silicone Pasties)", "珍珠丁字裤 (Pearl Thong)", "极简透视薄纱 (Sheer Mesh)"], sets: { A: {n:"晨雾", i:"百合花、木梳、白瓷杯、乐谱"}, B: {n:"纯欲", i:"草莓、牛奶杯、丝绸眼罩、长筒袜"} } },
    "Style08": { label: "08. 青花瓷韵·紧身包臀", titles: { poetic: "青花瓷韵", style: "紧身包臀" }, bg: "Antique Shop - Shelf full of porcelain, dust motes, quiet and cultural atmosphere.", outerTexture: { name: "Blue & White Porcelain", prompt: "White silk with blue floral patterns, extremely tight pencil skirt fit" }, inners: ["蓝色丝绸内衣 (Blue Silk Set)", "青花纹样肚兜 (Porcelain Pattern Dudou)", "白色开档丝袜 (White Open Hose)", "绑带式提臀裤 (Lift-up Straps)", "极简一片式"], sets: { A: {n:"古董店", i:"折扇、毛笔、青花瓷瓶、印章"}, B: {n:"私密收藏", i:"放大镜、拍卖槌、玉势、丝绸手帕"} } },
    "Style09": { label: "09. 赛博霓虹·机能旗袍", titles: { poetic: "赛博霓虹", style: "机能旗袍" }, bg: "Cyberpunk City 2077 - Rain, neon lights, holograms, metallic surfaces, futuristic aesthetic.", outerTexture: { name: "Latex & PVC", prompt: "Black latex mixed with red holographic PVC, cutouts, tech-wear buckles" }, inners: ["发光光纤内衣 (Fiber Optic Lingerie)", "透明PVC束腰 (Clear PVC Corset)", "机械义肢风内裤 (Cyber Panties)", "荧光色绑带 (Neon Straps)", "金属外骨架胸衣 (Exoskeleton Bra)"], sets: { A: {n:"夜之城", i:"VR眼镜、数据芯片、能量饮料、全息扇"}, B: {n:"黑客潜入", i:"机械手套、连接线、武士刀、面罩"} } },
    "Style10": { label: "10. 纯真年代·短款旗袍", titles: { poetic: "纯真年代", style: "短款改良" }, bg: "Summer Amusement Park - Bright sunlight, colorful balloons, film grain, playful vibe.", outerTexture: { name: "Polka Dot Cotton", prompt: "Short mini skirt length, colorful polka dots or floral print, cute and lively" }, inners: ["波点复古内衣 (Polka Dot Set)", "纯棉少女套装 (Cotton Girly Set)", "日式绑绳内裤 (Side-tie Panties)", "蕾丝短袜 (Lace Socks)", "条纹比基尼 (Striped Bikini)"], sets: { A: {n:"游乐场", i:"波板糖、拍立得、气球、墨镜"}, B: {n:"洛丽塔", i:"泰迪熊、棒棒糖、颈圈(Choker)、冰淇淋"} } }
};

export const DARK_ROLES: Record<string, DarkRoleData> = {
    "OL": { label: "🏢 社内不伦 (Office Lady)", prompt_ctx: "Cinematic Scene: Late night office drama. Costume: White blouse, pencil skirt, slightly disheveled. Mood: Exhausted melancholic beauty." },
    "Housewife": { label: "🏠 人妻午后 (Housewife)", prompt_ctx: "Cinematic Scene: Afternoon sunlight, domestic interior. Costume: Beige knit sweater, apron. Mood: Complex emotional conflict." },
    "Idol": { label: "🌟 新人出道 (Rookie Idol)", prompt_ctx: "Studio Photography: High-key lighting, white background. Costume: Pure white summer dress or swimwear. Mood: Innocent nervous energy." },
    "Nurse": { label: "💉 私人病栋 (Nurse)", prompt_ctx: "Cinematic Scene: Cold blue clinic tone. Costume: Pink uniform. Mood: Professional but intense gaze." },
    "Maid": { label: "☕ 专属女仆 (Maid)", prompt_ctx: "Cinematic Scene: Victorian interior. Costume: Classic maid outfit. Mood: Dedicated service and loyalty." },
    "Student": { label: "📚 放课后补习 (College Girl)", prompt_ctx: "Cinematic Scene: Library setting. Costume: Plaid skirt, shirt. Mood: Secret study session atmosphere." },
    "Onsen": { label: "♨️ 温泉旅情 (Yukata)", prompt_ctx: "Atmospheric Scene: Misty hot spring. Costume: Wet floral robe (Yukata). Mood: Relaxed intimate vacation." },
    "Yoga": { label: "🧘 健身私教 (Gym Trainer)", prompt_ctx: "Fitness Photography: Gym setting. Costume: Spandex leggings, sports top. Skin Texture: Post-workout glow/sheen." },
    "China": { label: "🥟 中华料理娘 (Chinatown)", prompt_ctx: "Neon Noir Scene: Chinatown night. Costume: Silk traditional dress. Mood: Mysterious neo-noir vibes." },
    "Racer": { label: "🏎️ 赛车女皇 (Race Queen)", prompt_ctx: "Sports Photography: Racetrack pit. Costume: High-gloss performance outfit. Mood: High energy confidence." }
};

export const ARCADE_ROLES: Record<string, CharacterData> = {
    "Kunoichi": { label: "KOF: 不知火流 (Mai Style)", moves: ["🌸 必杀: 花蝶扇 (Fan Throw)", "💃 胜利: 摇扇弯腰 (Bouncing)", "👺 挑衅: 换装 (Costume Fix)"], game_logo: "K.O.F EDITION", outer: "Red sleeveless Kunoichi garb, giant decorative rope knot.", outer_2p: "Blue or Black Kunoichi garb, silver rope knot.", inner_top: "Sarashi Binding (Bandages)", inner_bottom: "Red High-cut Fundoshi" },
    "KungFu": { label: "SF: 中华武术 (Chun-Li Style)", moves: ["✌️ 胜利: Yatta跳跃 (Jump V)", "🦵 必杀: 百裂脚 (Lighting Kick)", "🙏 挑衅: 抱拳 (Kung Fu Bow)"], game_logo: "SF EDITION", outer: "Blue Modified Qipao with high embroidery, ox-horn buns.", outer_2p: "Pink Modified Qipao, black tights.", inner_top: "White Sports Silk Bra", inner_bottom: "Dark Blue Athletic Bloomers" },
    "SpecOps": { label: "SF: 嘉米三角洲 (Cammy Style)", moves: ["🍑 胜利: 背身回眸 (Backside)", "🫡 胜利: 敬礼 (Salute)", "⚔️ 战败: 倒地 (Defeat)"], game_logo: "SF EDITION", outer: "Green high-cut thong leotard, red beret, gauntlets.", outer_2p: "White/Blue Delta Red tactical leotard.", inner_top: "Tactical Mesh Liner", inner_bottom: "Invisible C-String Protection" },
    "Ninja": { label: "DOA: 雾幻天神流 (Kasumi Style)", moves: ["⚔️ 胜利: 收刀 (Blade Sheath)", "🌸 胜利: 樱花散落 (Sakura)", "🤕 战败: 战损跪地 (Kneeling)"], game_logo: "DOA EDITION", outer: "Blue Ninja Dress, arm guards, white thigh highs.", outer_2p: "White/Gold Ninja Dress.", inner_top: "Mesh Fishnet Top", inner_bottom: "White Cotton Ribbon Panties" },
    "Gothic": { label: "Tekken: 哥特千金 (Lili Style)", moves: ["☕ 胜利: 优雅品茶 (Tea Time)", "👠 挑衅: 高傲俯视 (Step on)", "👋 胜利: 挥手 (Bye Bye)"], game_logo: "TEKKEN EDITION", outer: "White Frilly Gothic Lolita Dress, long boots.", outer_2p: "Red/Black Gothic Dress.", inner_top: "Victorian Lace Corset", inner_bottom: "Frilly White Bloomers" },
    "Assassin": { label: "Tekken: 极度冷血 (Nina Style)", moves: ["🔫 胜利: 填弹 (Reload)", "👠 胜利: 踩踏 (Stomp)", "👀 挑衅: 蔑视 (Glare)"], game_logo: "IRON FIST EDITION", outer: "Tight Purple Latex Catsuit.", outer_2p: "Silver/Grey Tactical Suit.", inner_top: "Tactical Holster Harness", inner_bottom: "Seamless Black Tanga Briefs" },
    "MaidFighter": { label: "DOA: 战斗女仆 (Marie Rose)", moves: ["👐 胜利: 转圈圈 (Twirl)", "👉 挑衅: 指人 (Point)", "💪 胜利: 秀肌肉 (Flexing)"], game_logo: "DOA EDITION", outer: "Gothic Maid Minidress, black apron.", outer_2p: "Red/White Maid Uniform.", inner_top: "Chequered Bra", inner_bottom: "Ruffled Mini Panties" },
    "Spider": { label: "SF: 邪魅蜘蛛 (Juri Style)", moves: ["👅 胜利: 舔唇 (Lick)", "🕷️ 挑衅: 抬腿 (Leg Lift)", "😈 必杀: 风水引擎 (Feng Shui Engine)"], game_logo: "SF EDITION", outer: "Purple Dude-bang top, baggy white pants, spiked anklets.", outer_2p: "Black leather biker suit.", inner_top: "Spider-web pattern adhesive bra", inner_bottom: "Purple Thong" },
    "Fashion": { label: "KOF: 潮流摔角 (Shermie Style)", moves: ["😘 胜利: 飞吻 (Blow Kiss)", "📱 挑衅:看手机 (Check Phone)", "💃 胜利: 模特步 (Catwalk)"], game_logo: "K.O.F EDITION", outer: "Pink long-sleeve tight top, miniskirt, eyes hidden by hair.", outer_2p: "Black/Gold fashion outfit.", inner_top: "No-wire Comfort Bra", inner_bottom: "Pink Seamless Panties" },
    "Wrestler": { label: "SF: 爆热摔角 (R.Mika Style)", moves: ["🍑 必杀: 臀部攻击 (Peach Bomber)", "🎤 胜利: 麦克风演说 (Mic Skill)", "💪 挑衅: 拍大腿 (Thigh Slap)"], game_logo: "SF EDITION", outer: "Flashy blue/white wrestling bikini with ruffles and mask.", outer_2p: "Red/Yellow wrestling gear.", inner_top: "Reinforced Sports Support", inner_bottom: "Pro-Wrestling Trunks" }
};

export const COMIC_ROLES: Record<string, CharacterData> = {
    "Navigator": { label: "OP: 小贼猫 (Nami Style)", moves: ["😉 招牌: 俏皮眨眼 (Wink)", "⛅ 招牌: 天候棒挥舞 (Clima-Tact)"], logo: "PIRATE EDITION", outer: "Teal Bikini Top, Low-rise Jeans, Orange Hair.", inner_top: "Adhesive Silicone Cups", inner_bottom: "Seamless Low-rise Thong" },
    "Empress": { label: "OP: 海贼女帝 (Boa Style)", moves: ["😒 招牌: 极度蔑视 (Looking Down)", "❤️ 招牌: 甜甜甘风 (Mero Mero)"], logo: "EMPRESS EDITION", outer: "Crimson Qipao with snake patterns, flowing cape.", inner_top: "Adhesive Nu-Bra", inner_bottom: "C-String Protector" },
    "Sannin": { label: "Naruto: 纲手姬 (Tsunade Style)", moves: ["👊 招牌: 怪力架势 (Power Stance)", "☝️ 招牌: 指点江山 (Pointing)"], logo: "NINJA EDITION", outer: "Green Haori Coat, Grey Kimono Top (Deep V), Capris.", inner_top: "Heavy Support Mesh Armor", inner_bottom: "Black Ninja Shorts" },
    "Byakugan": { label: "Naruto: 白眼公主 (Hinata Style)", moves: ["👉 招牌: 害羞对指 (Fingertips)", "🧘 招牌: 柔拳架势 (Gentle Fist)"], logo: "NINJA EDITION", outer: "Purple/White Hoodie Jacket, Navy Pants.", inner_top: "Traditional Sarashi Binding", inner_bottom: "Warm Spandex Leggings" },
    "Lieutenant": { label: "Bleach: 乱菊 (Rangiku Style)", moves: ["🗡️ 招牌: 抚摸头发 (Hair Touch)", "🍶 招牌: 宿醉卧倒 (Drunk Lie)"], logo: "SOUL EDITION", outer: "Black Shinigami Robes (Wide open neck), Pink Scarf.", inner_top: "Lace Demi-Cup Bra", inner_bottom: "White Cotton Fundoshi" },
    "Flash": { label: "Bleach: 瞬神夜一 (Yoruichi Style)", moves: ["😼 招牌: 蹲姿瞬步 (Crouching Cat)", "⚡ 招牌: 瞬开 (Flash Armor)"], logo: "SOUL EDITION", outer: "Orange Jacket, Black Backless Bodysuit.", inner_top: "Athletic Tape Binding", inner_bottom: "Integrated Bodysuit Gusset" },
    "EsperB": { label: "OPM: 地狱吹雪 (Fubuki Style)", moves: ["🌬️ 招牌: 念力浮空 (Levitating)", "👗 招牌: 整理大衣 (Coat Adjust)"], logo: "HERO EDITION", outer: "Dark Green Dress, Fur Coat, Pearls.", inner_top: "Black Silk Slip", inner_bottom: "Matching Black Silk Panties" },
    "EsperT": { label: "OPM: 战栗龙卷 (Tatsumaki Style)", moves: ["💢 招牌: 双手抱胸 (Arms Crossed)", "👋 招牌: 念力手势 (Hand Control)"], logo: "HERO EDITION", outer: "Black High-Slit Dress (Floating hair).", inner_top: "Invisible Sticker Bra", inner_bottom: "Minimalist Adhesive Patch" },
    "StrawDoll": { label: "JJK: 钉崎野蔷薇 (Nobara Style)", moves: ["🔨 招牌: 举锤敲击 (Hammer Time)", "😎 招牌: 自信叉腰 (Smug Hand)"], logo: "CURSE EDITION", outer: "Jujutsu High Uniform (Navy Jacket/Skirt), Belt Bag.", inner_top: "Sports Bra", inner_bottom: "Black Safety Spats" },
    "Weapon": { label: "JJK: 禅院真希 (Maki Style)", moves: ["👓 招牌: 推眼镜 (Adjust Glasses)", "🗡️ 招牌: 扛刀站立 (Weapon Shoulder)"], logo: "CURSE EDITION", outer: "Modified High Uniform, Glasses, Polearm.", inner_top: "High-Compression Binder", inner_bottom: "Athletic Boxer Briefs" }
};

export const COMMON = {
    HANFU_POSES: ["端庄站立", "羞涩掩面", "万福礼", "执扇半遮面", "提灯回眸", "抚琴姿态", "步步生莲", "侧卧醉酒", "对镜梳妆", "反弹琵琶 (敦煌)", "卧鱼闻花 (身韵)", "长袖善舞 (水袖)", "剑舞英姿 (武侠)", "探海 (身法)", "飞天凌空 (动态)"],
    QIPAO_POSES: ["步步生莲 (Walking Away)", "对镜梳妆 (Mirror Reflection)", "慵懒卧榻 (Reclining Chaise)", "临窗远眺 (Window Silhouette)", "低头系鞋 (Adjusting Shoe)", "整理袜带 (Fixing Garter)", "回眸一瞥 (The Glance)", "坐姿吸烟 (Smoking Elegance)", "含羞遮面 (Fan Covering)", "跪姿祈祷 (Kneeling Grace)", "倚墙而立 (Leaning Wall)", "微醺时刻 (Tipsy)", "指尖轻触 (Lip Touch)", "高傲俯视 (Dominant Gaze)", "极致伸展 (Cat Stretch)"],
    DARK_MOODS: ["羞耻特写 (Shameful)", "大汗淋漓 (Sweaty)", "微醺迷离 (Tipsy)", "绝对蔑视 (Disdain)", "强光致盲 (Pure Light)", "捆绑艺术 (Soft Bondage)", "眼泪汪汪 (Crying)", "偷窥视角 (Peeping)", "事后凌乱 (Messy)", "黑帮极道 (Yakuza)"],
    ARCADE_VFX: ["无 (None)", "写实热浪 (Heat Haze)", "静电火花 (Static Sparks)", "飘落樱瓣 (Falling Petals)", "动态残影 (Motion Blur)", "水雾缭绕 (Steam Mist)"],
    COMIC_VFX: ["无 (None)", "集中线 (Speed Lines)", "拟声词 (Sound FX)", "霸气雷电 (Haki/Chakra)", "樱花 (Sakura)", "念力光辉 (Psychic Aura)"],
    CUPS: ["C Cup", "A Cup", "B Cup", "D Cup", "E Cup", "F Cup"],
    BODIES: ["自动推算", "丰腴圆润", "纤细修长", "健美紧致"],
    STYLES: ["High-fidelity Photography", "Anime Style", "Cyberpunk", "Oil Painting"],
    INNERS: ["Lingerie Set", "Sportswear", "Latex Suit"],
    COLORS_ARCADE: [
        {val: "1P", txt: "🔴 1P: 经典原色 (Classic)"},
        {val: "2P", txt: "🔵 2P: 异色版本 (Alternate)"}
    ],
    COLORS_COMIC: [
        {val: "Anime", txt: "📺 动画配色 (TV Color)"},
        {val: "Manga", txt: "📖 漫画原作 (Black/White/Red)"}
    ]
};

// [新增] 注册 custom 模式的元数据
export const MODE_METADATA: Record<string, { label: string, tier: 'STANDARD' | 'PREMIUM' }> = {
    hanfu:   { label: '汉服工坊', tier: 'STANDARD' },
    qipao:   { label: '民国旗袍', tier: 'STANDARD' },
    general: { label: '通用概念', tier: 'STANDARD' },
    
    custom:  { label: '自由发挥', tier: 'STANDARD' }, // [New]
    
    dark:    { label: '深夜放映厅', tier: 'PREMIUM' },
    arcade:  { label: '格斗全明星', tier: 'PREMIUM' },
    comic:   { label: '漫改全明星', tier: 'PREMIUM' },
};