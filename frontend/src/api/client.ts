// API客户端 - 后端接口调用

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface GenerateParams {
  moduleId: string;
  inputs: Record<string, unknown>;
  llmConfig: LLMConfig;
}

export interface GenerateResult {
  moduleId: string;
  moduleName: string;
  result: Record<string, unknown>;
  duration: number;
}

export interface ModuleInfo {
  moduleId: string;
  moduleName: string;
}

export async function fetchModules(): Promise<ModuleInfo[]> {
  const res = await fetch("/api/modules");
  if (!res.ok) throw new Error("获取模块列表失败");
  const data = await res.json();
  return data.modules;
}

export async function generate(
  params: GenerateParams
): Promise<GenerateResult> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "生成失败");
  }
  return data;
}

// ===== 提示词模板管理 =====

export interface PromptTemplateData {
  moduleId: string;
  moduleName: string;
  templateText: string;
}

export async function fetchPrompts(): Promise<PromptTemplateData[]> {
  const res = await fetch("/api/prompts");
  if (!res.ok) throw new Error("获取提示词失败");
  const data = await res.json();
  return data.prompts;
}

export async function updatePrompt(
  moduleId: string,
  templateText: string
): Promise<void> {
  const res = await fetch(`/api/prompts/${moduleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateText }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "更新提示词失败");
  }
}

export async function resetPrompt(moduleId: string): Promise<void> {
  const res = await fetch(`/api/prompts/${moduleId}/reset`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "重置提示词失败");
  }
}
