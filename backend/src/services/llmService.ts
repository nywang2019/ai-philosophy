// LLM抽象层 - 支持OpenAI兼容API
// 用户在页面配置 endpoint / apiKey / model，后端不持久化

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface GenerateRequest {
  moduleId: string;
  inputs: Record<string, unknown>;
  llmConfig: LLMConfig;
  customPrompt?: string;
  multimodalConfig?: LLMConfig;
}

export interface LLMResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callLLM(
  prompt: string,
  config: LLMConfig
): Promise<LLMResult> {
  const url = config.endpoint.endsWith("/v1/chat/completions")
    ? config.endpoint
    : config.endpoint.replace(/\/$/, "") + "/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "你是一个文史哲AI生成系统。你必须严格按照要求的结构化JSON格式输出，不要添加任何其他文字。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const preview = errorBody.slice(0, 300);
    if (preview.startsWith("<!DOCTYPE") || preview.startsWith("<html")) {
      throw new Error(`API返回了HTML页面而非JSON。请检查API Endpoint是否正确（应包含/v1/chat/completions路径）。当前endpoint: ${url}`);
    }
    throw new Error(`LLM API error (${response.status}): ${preview}`);
  }

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
  } catch {
    if (rawText.startsWith("<!DOCTYPE") || rawText.startsWith("<html")) {
      throw new Error(`API返回了HTML页面而非JSON。请检查：1) API Endpoint是否正确 2) API Key是否有效。当前endpoint: ${url}`);
    }
    throw new Error(`API返回了无法解析的内容: ${rawText.slice(0, 200)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return {
    content,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// 检测是否为 DashScope endpoint
function isDashScope(url: string): boolean {
  return url.includes("dashscope.aliyuncs.com");
}

// 多模态视觉模型调用（支持Base64图片）
// 自动适配 OpenAI Vision API 和 DashScope 原生 API
export async function callMultimodalLLM(
  prompt: string,
  images: string[], // Base64 data URIs
  config: LLMConfig
): Promise<LLMResult> {
  // DashScope 原生 API 路径
  if (isDashScope(config.endpoint)) {
    return callDashScopeMultimodal(prompt, images, config);
  }

  // OpenAI Vision API 格式
  const url = config.endpoint.endsWith("/v1/chat/completions")
    ? config.endpoint
    : config.endpoint.replace(/\/$/, "") + "/v1/chat/completions";

  const imageContents = images.map(img => ({
    type: "image_url",
    image_url: { url: img, detail: "auto" },
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个文史哲AI多模态分析系统。必须严格按照要求的JSON格式输出。" },
        { role: "user", content: [{ type: "text", text: prompt }, ...imageContents] },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Multimodal API error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Multimodal LLM returned empty response");

  return {
    content,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// DashScope 原生多模态 API（qwen-vl）
async function callDashScopeMultimodal(
  prompt: string,
  images: string[],
  config: LLMConfig
): Promise<LLMResult> {
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
  const imageList = images.map(img => img.replace(/^data:image\/\w+;base64,/, ""));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: {
        messages: [
          {
            role: "system",
            content: [{ text: "你是一个文史哲AI多模态分析系统。必须严格按照要求的JSON格式输出。" }],
          },
          {
            role: "user",
            content: [
              { text: prompt },
              ...imageList.map(b64 => ({ image: `data:image/jpeg;base64,${b64}` })),
            ],
          },
        ],
      },
      parameters: { max_tokens: 4096 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DashScope API error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json() as {
    output?: { choices?: { message?: { content?: Array<{ text?: string }> | string } }[] };
    usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
  };

  const choice = data.output?.choices?.[0]?.message?.content;
  let text = "";
  if (Array.isArray(choice)) {
    text = choice.map(c => c.text || "").join("");
  } else if (typeof choice === "string") {
    text = choice;
  }

  if (!text) throw new Error("DashScope multimodal returned empty response");

  return {
    content: text,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// 检测输入中是否包含Base64图片
function extractImages(inputs: Record<string, unknown>): string[] {
  const images: string[] = [];
  for (const v of Object.values(inputs)) {
    if (typeof v === "string" && v.startsWith("data:image/")) {
      images.push(v);
    }
  }
  return images;
}

export function hasImages(inputs: Record<string, unknown>): boolean {
  return extractImages(inputs).length > 0;
}

// 尝试从LLM返回的文本中提取JSON
export function extractJSON(raw: string): string {
  // 尝试提取```json ... ```代码块
  const codeBlockMatch = raw.match(
    /```(?:json)?\s*\n?([\s\S]*?)\n?```/
  );
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 尝试找到第一个{和最后一个}
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw;
}
