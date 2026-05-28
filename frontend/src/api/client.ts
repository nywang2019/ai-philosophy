// API客户端 - 浏览器直接调用 LLM API
import { callLLM, callMultimodalLLM, extractJSON, hasImages } from "../services/llmService";
import type { LLMConfig as LLMServiceConfig } from "../services/llmService";
import { getAllModules, getAllPromptTemplates, getTemplate, injectParams, updatePromptTemplate, resetPromptTemplate } from "../services/promptTemplates";

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface GenerateParams {
  moduleId: string;
  inputs: Record<string, unknown>;
  llmConfig: LLMConfig;
  customPrompt?: string;
  multimodalConfig?: LLMConfig;
}

export interface GenerateResult {
  moduleId: string;
  moduleName: string;
  result: Record<string, unknown>;
  duration: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
}

export interface ModuleInfo {
  moduleId: string;
  moduleName: string;
}

// 提示词模板数据
export interface PromptTemplateData {
  moduleId: string;
  moduleName: string;
  templateText: string;
}

// 模块列表来自本地配置，不再需要后端 API
export async function fetchModules(): Promise<ModuleInfo[]> {
  return getAllModules();
}

export async function generate(params: GenerateParams): Promise<GenerateResult> {
  const { moduleId, inputs, llmConfig, customPrompt, multimodalConfig } = params;
  const startTime = Date.now();

  let prompt: string;
  let resolvedModuleName = moduleId;

  if (customPrompt) {
    prompt = injectParams(customPrompt, inputs);
    resolvedModuleName = (inputs._customModuleName as string) || moduleId;
  } else {
    const template = getTemplate(moduleId);
    if (!template) throw new Error(`未找到模块：${moduleId}`);
    prompt = template.buildPrompt(inputs);
    resolvedModuleName = template.moduleName;
  }

  const isMultimodal = hasImages(inputs);
  let mmConfig: LLMServiceConfig | undefined;
  if (isMultimodal && multimodalConfig) {
    mmConfig = { ...multimodalConfig };
    if (!mmConfig.apiKey) mmConfig.apiKey = llmConfig.apiKey;
  }

  let rawResult;
  if (isMultimodal && mmConfig) {
    const images = Object.values(inputs).filter(
      v => typeof v === "string" && (v as string).startsWith("data:image/")
    ) as string[];
    rawResult = await callMultimodalLLM(prompt, images, mmConfig);
  } else if (isMultimodal && !mmConfig) {
    throw new Error("检测到图片输入，但未配置多模态视觉模型。请在设置中配置视觉API。");
  } else {
    rawResult = await callLLM(prompt, llmConfig);
  }

  const jsonResult = extractJSON(rawResult.content);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonResult);
  } catch {
    parsed = { raw: rawResult.content };
  }

  return {
    moduleId,
    moduleName: resolvedModuleName,
    result: parsed,
    duration: Date.now() - startTime,
    usage: rawResult.usage
      ? {
          promptTokens: rawResult.usage.promptTokens,
          completionTokens: rawResult.usage.completionTokens,
          totalTokens: rawResult.usage.totalTokens,
        }
      : null,
  };
}

// 提示词管理改为本地 localStorage 操作
const PROMPT_STORAGE_KEY = "ai-philosophy-prompt-overrides";

function getPromptOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export async function fetchPrompts(): Promise<PromptTemplateData[]> {
  const overrides = getPromptOverrides();
  return getAllPromptTemplates().map(t => ({
    ...t,
    templateText: overrides[t.moduleId] || t.templateText,
  }));
}

export async function updatePrompt(moduleId: string, templateText: string): Promise<void> {
  const overrides = getPromptOverrides();
  overrides[moduleId] = templateText;
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(overrides));
  updatePromptTemplate(moduleId, templateText); // 同步运行时模板
}

export async function resetPrompt(moduleId: string): Promise<void> {
  const overrides = getPromptOverrides();
  delete overrides[moduleId];
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(overrides));
  resetPromptTemplate(moduleId); // 同步运行时模板
}
