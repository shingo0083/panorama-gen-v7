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

// 2. Volcengine 即梦引擎 (适配 V4.0)
export async function generateWithJimeng(prompt: string) {
    const ak = process.env.VOLC_ACCESS_KEY;
    const sk = process.env.VOLC_SECRET_KEY;

    if (!ak || !sk) {
        throw new Error("即梦API未配置 (Missing VOLC Keys)");
    }

    // 初始化 SDK
    const service = new Service({
        host: 'visual.volcengineapi.com',
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId: ak,
        secretKey: sk,
    });

    const action = "CVProcess";
    const version = "2022-08-31"; 
    
    // V4.0 Prompt 优化
    // 自动追加高质量前缀
    const finalPrompt = `(masterpiece, best quality, 8k, highly detailed), ${prompt}`;

    // [核心修改] V4.0 参数结构
    const bodyPayload = {
        req_key: "jimeng_t2i_v40", // [Fix] 更新为 V4.0
        prompt: finalPrompt,
        // 以下参数适配 V4.0 推荐值
        scale: 7.5,
        seed: -1,
        // binary_data_base64: [], // 纯文生图无需此项
        // 如果需要控制分辨率，V4.0 接受 extra 字段或特定 key，视具体签约而定
        // 暂保持默认，模型会自动根据 Prompt 生成合适的比例
    };

    try {
        console.log("[Jimeng V4] Sending Request...");
        
        // 使用修正后的大写字段签名逻辑
        const fetchParams: any = {
            Action: action,
            Version: version,
            Method: 'POST',
            Body: bodyPayload,
            Header: { 'Content-Type': 'application/json' }
        };

        const res: any = await service.fetchOpenAPI(fetchParams);

        if (res.code !== 10000) {
            console.error("Jimeng Error:", JSON.stringify(res));
            const reqId = res.ResponseMetadata?.RequestId || "Unknown";
            const msg = res.message || res.ResponseMetadata?.Error?.Message || `Code: ${res.code}`;
            
            // 权限拦截提示
            if (res.code === 403 || res.ResponseMetadata?.Error?.Code === 'AccessDenied') {
                 throw new Error(`权限不足。请检查火山引擎控制台 [CVFullAccess] 权限。ReqID: ${reqId}`);
            }

            throw new Error(`即梦API错误: ${msg}`);
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