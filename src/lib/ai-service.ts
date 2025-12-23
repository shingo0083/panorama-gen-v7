import { Service } from "@volcengine/openapi";

// 1. Google Gemini 引擎 (保持不变)
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

// 2. Volcengine 即梦引擎 (V4.0 修复版)
export async function generateWithJimeng(prompt: string) {
    const ak = process.env.VOLC_ACCESS_KEY;
    const sk = process.env.VOLC_SECRET_KEY;

    if (!ak || !sk) {
        throw new Error("即梦API未配置 (Missing VOLC Keys)");
    }

    // 初始化 SDK
    const service = new Service({
        host: 'visual.volcengineapi.com', // 不要加 https://
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId: ak,
        secretKey: sk,
        protocol: 'https:', // [关键修正] 显式指定协议
        timeout: 60000,     // 增加超时时间
    });

    const action = "CVProcess";
    const version = "2022-08-31"; 
    
    // V4.0 Prompt 优化
    const finalPrompt = `(masterpiece, best quality, 8k, highly detailed), ${prompt}`;

    // V4.0 参数结构
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
        console.log("[Jimeng V4] Sending Request...");
        
        // [关键修正] 使用 query 字段明确传递 Action 和 Version
        const fetchParams: any = {
            query: {
                Action: action,
                Version: version,
            },
            method: 'POST',
            data: bodyPayload,
            headers: { 'Content-Type': 'application/json' }
        };

        const res: any = await service.fetchOpenAPI(fetchParams);

        if (res.code !== 10000) {
            console.error("Jimeng Error:", JSON.stringify(res));
            const reqId = res.ResponseMetadata?.RequestId || res.request_id || "Unknown";
            const msg = res.message || res.ResponseMetadata?.Error?.Message || `Code: ${res.code}`;
            
            if (res.code === 403 || res.ResponseMetadata?.Error?.Code === 'AccessDenied') {
                 throw new Error(`权限不足。请检查火山引擎控制台 [CVFullAccess] 权限。ReqID: ${reqId}`);
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
        console.error("Jimeng SDK Error:", e);
        throw new Error(e.message);
    }
}