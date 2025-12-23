import { Service } from "@volcengine/openapi";

// 1. Google Gemini 引擎
export async function generateWithGemini(prompt: string, imageBase64: string) {
    // ... (保持原有的 Gemini 代码不变，为了节省篇幅略去) ...
    // 请保留您原来的 generateWithGemini 代码
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

// 2. Volcengine 即梦引擎 (调试增强版)
export async function generateWithJimeng(prompt: string) {
    const ak = process.env.VOLC_ACCESS_KEY;
    const sk = process.env.VOLC_SECRET_KEY;

    // [Debug] 打印密钥掩码，检查是否读取成功
    console.log("---------------- JIMENG DEBUG ----------------");
    console.log("AK Exists:", !!ak, ak ? `(${ak.substring(0, 4)}***)` : "NULL");
    console.log("SK Exists:", !!sk, sk ? `(Length: ${sk.length})` : "NULL");
    
    if (!ak || !sk) {
        throw new Error("即梦API未配置 (Missing VOLC Keys)");
    }

    // 初始化火山引擎 SDK
    const service = new Service({
        host: 'visual.volcengineapi.com',
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId: ak,
        secretKey: sk,
    });

    const action = "CVProcess";
    const version = "2022-08-31"; 
    
    // 即梦Prompt限制及翻译优化
    // 强制追加风格词，确保不走样
    const optimizedPrompt = `(best quality, 8k, photorealistic:1.2), ${prompt.slice(0, 800)}`;

    const bodyPayload = {
        req_key: "high_aes_general_v21_L", 
        prompt: optimizedPrompt,
    };

    try {
        console.log("Sending request to Volcengine...");
        
        const res: any = await service.fetchOpenAPI({
            Action: action,
            Version: version,
            method: 'POST',
            data: bodyPayload,
            headers: { 'Content-Type': 'application/json' }
        });

        // 检查业务层错误
        if (res.code !== 10000) {
            console.error("Jimeng Business Error:", JSON.stringify(res));
            // 提取更详细的错误信息
            const errMsg = res.message || res.ResponseMetadata?.Error?.Message || `Code: ${res.code}`;
            throw new Error(`即梦API拒绝请求: ${errMsg}`);
        }

        const resultBase64 = res.data?.binary_data_base64?.[0] || res.data?.image_urls?.[0];
        
        if (!resultBase64) {
             throw new Error("即梦返回了空数据 (No image data)");
        }

        console.log("✅ Jimeng generation successful!");

        return {
            image: resultBase64,
            provider: "Volcengine Jimeng",
            costFactor: 1.2 
        };

    } catch (e: any) {
        console.error("❌ Jimeng SDK Error:", e);
        throw new Error(`即梦生成失败: ${e.message}`);
    }
}