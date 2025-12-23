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
        // 如果是 429 (限流) 或 5xx (服务器错误)，抛出特定错误以便降级
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
        costFactor: 1.0 // 原始倍率
    };
}

// 2. Volcengine 即梦引擎 (备用)
// 文档: https://www.volcengine.com/docs/85621/1817045
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
    const version = "2022-08-31"; // 通用视觉版本
    
    // 即梦不需要很长的英文Prompt，我们截取关键部分，或者简单翻译
    // 这里直接透传 Prompt，即梦对中英文兼容较好
    const body = {
        req_key: "high_aes_general_v21_L", // 通用高美感模型 (即梦 V2.1)
        prompt: prompt.slice(0, 1000), // 截断一下防止过长
        // binary_data_base64: [] // 注：如果未来要做图生图，需要传这里，但比较复杂
    };

    try {
        const res: any = await service.fetchOpenAPI({
            Action: action,
            Version: version,
            Method: 'POST',
            Body: body,
            Header: { 'Content-Type': 'application/json' }
        });

        if (res.code !== 10000) {
            throw new Error(`Jimeng Error: ${res.message || res.code}`);
        }

        // 提取结果 (即梦返回的是二进制还是Url需根据具体req_key，通常 high_aes 返回 binary_data_base64)
        const resultBase64 = res.data?.binary_data_base64?.[0];
        
        if (!resultBase64) throw new Error("Jimeng returned no image data");

        return {
            image: resultBase64,
            provider: "Volcengine Jimeng",
            costFactor: 1.2 // 备用通道可能稍微贵一点，或者保持一致
        };

    } catch (e: any) {
        throw new Error(`Backup generation failed: ${e.message}`);
    }
}