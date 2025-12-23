import { Service } from "@volcengine/openapi";

// --- 辅助函数：即梦专用 Prompt 清洗 ---
// 即梦对 "Role:", "Task:", "Nudity" 等词非常敏感，需要“脱敏”处理
function cleanPromptForJimeng(text: string): string {
    let cleaned = text;

    // 1. 移除 Markdown 标题和元数据行 (只保留视觉描述)
    // 去掉以 # 或 - 开头的行中包含 Role/Task/Negative 的内容
    cleaned = cleaned.replace(/^#\s+(Role|Task|Concept|Negative).+$/gm, "");
    cleaned = cleaned.replace(/--no\s+.+$/g, ""); // 去掉末尾的 --no negative prompt
    
    // 2. 敏感词替换/删除 (关键词黑名单)
    const riskyWords = [
        "nudity", "naked", "nipples", "genitals", "sex", "porn", "NSFW", "r18",
        "shameful", "bondage", "fetish", "slave", "abuse", "straining", "bursting",
        "huge breasts", "voluptuous", "unbuttoned", "disheveled"
    ];
    
    riskyWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        cleaned = cleaned.replace(regex, ""); // 直接删掉敏感词
    });

    // 3. 格式清理
    cleaned = cleaned.replace(/\*\*/g, ""); // 去掉加粗
    cleaned = cleaned.replace(/\n+/g, ", "); // 换行变逗号
    
    // 4. 截断 (即梦不支持超长文本)
    return cleaned.slice(0, 800);
}


// 1. Google Gemini 引擎 (主)
export async function generateWithGemini(prompt: string, imageBase64: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelId = "gemini-3-pro-image-preview"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ 
            parts: [
                { text: prompt }, 
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
            ] 
        }],
        generationConfig: { temperature: 0.9, topK: 40, topP: 0.95, responseMimeType: "text/plain" }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`Gemini Error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("Gemini Safety Filter Triggered");
    }

    const imgData = data.candidates?.[0]?.content?.parts?.find((p:any) => p.inlineData)?.inlineData?.data;
    if (!imgData) throw new Error("Gemini returned no image");

    return {
        image: imgData,
        provider: "Google Gemini",
        costFactor: 1.0
    };
}

// 2. Volcengine 即梦引擎 (V4.0 稳定版)
export async function generateWithJimeng(prompt: string) {
    const ak = process.env.VOLC_ACCESS_KEY;
    const sk = process.env.VOLC_SECRET_KEY;

    if (!ak || !sk) {
        throw new Error("即梦API未配置 (Missing VOLC Keys)");
    }

    // [修复 Timeout] 使用 as any 注入超时设置 (100秒)
    const service = new Service({
        host: 'visual.volcengineapi.com',
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId: ak,
        secretKey: sk,
        protocol: 'https:',
        timeout: 100000, // [New] 设置 Axios 超时为 100秒
    } as any);

    const action = "CVProcess";
    const version = "2022-08-31"; 
    
    // [修复风控] 对 Prompt 进行清洗和脱敏
    const safePrompt = cleanPromptForJimeng(prompt);
    const finalPrompt = `(masterpiece, best quality, 8k, highly detailed), ${safePrompt}`;

    const bodyPayload = {
        req_key: "jimeng_t2i_v40",
        prompt: finalPrompt,
        scale: 7.5,
        seed: -1,
        logo_info: {
            add_logo: false,
            position: 0,
            language: 0,
            opacity: 0.3
        }
    };

    try {
        console.log(`[Jimeng V4] Sending Request... Prompt Length: ${finalPrompt.length}`);
        
        const fetchParams: any = {
            Action: action,
            Version: version,
            method: 'POST',
            data: bodyPayload,
            headers: { 'Content-Type': 'application/json' },
            timeout: 100000 // Double check timeout
        };

        const res: any = await service.fetchOpenAPI(fetchParams);

        if (res.code !== 10000) {
            console.error("Jimeng Error:", JSON.stringify(res));
            const reqId = res.ResponseMetadata?.RequestId || res.request_id || "Unknown";
            const msg = res.message || res.ResponseMetadata?.Error?.Message || `Code: ${res.code}`;
            
            // 针对风控的特定提示
            if (res.code === 50412 || msg.includes("Risk")) {
                 throw new Error(`内容风控拦截 (Text Risk)。请尝试减少敏感描述或更换模式。`);
            }
            if (res.code === 403 || res.ResponseMetadata?.Error?.Code === 'AccessDenied') {
                 throw new Error(`权限不足 (CVFullAccess)。ReqID: ${reqId}`);
            }

            throw new Error(`即梦API错误: ${msg} (${reqId})`);
        }

        const resultBase64 = res.data?.binary_data_base64?.[0] || res.data?.image_urls?.[0];
        
        if (!resultBase64) {
             throw new Error("即梦返回空数据");
        }

        return {
            image: resultBase64,
            provider: "Volcengine Jimeng V4",
            costFactor: 1.2 
        };

    } catch (e: any) {
        // 捕获 Axios timeout 错误
        if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
            throw new Error("即梦生成超时 (Timeout)。模型响应过慢，请稍后重试。");
        }
        console.error("Jimeng SDK Error:", e);
        throw new Error(e.message);
    }
}