import { Service } from "@volcengine/openapi";

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
    
    // 安全检查
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

// 2. Volcengine 即梦引擎 (备用)
export async function generateWithJimeng(prompt: string) {
    if (!process.env.VOLC_ACCESS_KEY || !process.env.VOLC_SECRET_KEY) {
        throw new Error("Backup service (Jimeng) not configured");
    }

    // 初始化火山引擎 SDK
    const service = new Service({
        host: 'visual.volcengineapi.com',
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId: process.env.VOLC_ACCESS_KEY,
        secretKey: process.env.VOLC_SECRET_KEY,
    });

    const action = "CVProcess";
    const version = "2022-08-31"; 
    
    const bodyPayload = {
        req_key: "high_aes_general_v21_L", 
        prompt: prompt.slice(0, 1000),
    };

    try {
        // [修复核心] 属性名修正为 TypeScript 定义要求的格式 (小写为主)
        const res: any = await service.fetchOpenAPI({
            Action: action,
            Version: version,
            method: 'POST', // [Fix] Method -> method
            data: bodyPayload,     // [Fix] Body -> data (Axios 风格) 或者 try 'body' if 'data' fails, but TS typings usually inherit AxiosRequestConfig which uses 'data'
            headers: { 'Content-Type': 'application/json' } // [Fix] Header -> headers
        });

        // 注意：火山引擎 SDK 有时将 body 放在 config 的 'data' 字段，或者 'body' 字段取决于具体版本。
        // 如果 'data' 字段报错，请尝试改回 'body' 但保持小写。
        // 根据报错信息 "FetchParams & AxiosRequestConfig"，'method' 必须小写。

        if (res.code !== 10000 && res.ResponseMetadata?.Error) {
             throw new Error(`Jimeng API Error: ${JSON.stringify(res.ResponseMetadata.Error)}`);
        }

        // 尝试解析返回数据，处理可能的结构差异
        const resultBase64 = res.data?.binary_data_base64?.[0] || res.data?.image_urls?.[0]; // 兼容不同模型的返回格式
        
        if (!resultBase64) {
             // 如果 SDK 封装层没有直接返回 data，尝试直接从 res 读取 (raw response situation)
             if(res.binary_data_base64) return { image: res.binary_data_base64[0], provider: "Jimeng", costFactor: 1.2 };
             throw new Error("Jimeng returned no valid image data");
        }

        return {
            image: resultBase64,
            provider: "Volcengine Jimeng",
            costFactor: 1.2 
        };

    } catch (e: any) {
        throw new Error(`Backup generation failed: ${e.message}`);
    }
}