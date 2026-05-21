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
}

export async function callLLM(
  prompt: string,
  config: LLMConfig
): Promise<string> {
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
    throw new Error(
      `LLM API error (${response.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return content;
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
