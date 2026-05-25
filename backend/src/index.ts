import express from "express";
import cors from "cors";
import {
  getTemplate,
  getAllModules,
  getAllPromptTemplates,
  updatePromptTemplate,
  resetPromptTemplate,
  injectParams,
} from "./prompts/templates";
import { callLLM, callMultimodalLLM, extractJSON, hasImages, GenerateRequest } from "./services/llmService";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 获取所有模块列表
app.get("/api/modules", (_req, res) => {
  const modules = getAllModules();
  res.json({ modules });
});

// 核心生成接口
app.post("/api/generate", async (req, res) => {
  const startTime = Date.now();
  const { moduleId, inputs, llmConfig } = req.body as GenerateRequest;

  try {
    if (!moduleId || !inputs || !llmConfig) {
      res.status(400).json({
        error: "缺少必要参数：moduleId, inputs, llmConfig",
      });
      return;
    }

    if (!llmConfig.endpoint || !llmConfig.apiKey || !llmConfig.model) {
      res.status(400).json({
        error: "缺少LLM配置：endpoint, apiKey, model",
      });
      return;
    }

    const { customPrompt } = req.body as GenerateRequest;
    let prompt: string;
    let resolvedModuleName = moduleId;

    if (customPrompt) {
      prompt = injectParams(customPrompt, inputs);
      resolvedModuleName = (inputs._customModuleName as string) || moduleId;
    } else {
      const template = getTemplate(moduleId);
      if (!template) {
        res.status(404).json({
          error: `未找到模块：${moduleId}`,
        });
        return;
      }
      prompt = template.buildPrompt(inputs);
      resolvedModuleName = template.moduleName;
    }

    const isMultimodal = hasImages(inputs);
    let mmConfig = (req.body as GenerateRequest).multimodalConfig;
    // 多模态回退：如果没有单独配置，尝试用文本模型的Key
    if (isMultimodal && mmConfig) {
      if (!mmConfig.apiKey) mmConfig = { ...mmConfig, apiKey: llmConfig.apiKey };
    }

    console.log(
      `[${new Date().toISOString()}] 模块: ${moduleId}, model: ${isMultimodal && mmConfig ? mmConfig.model : llmConfig.model}${isMultimodal ? " (多模态)" : ""}`
    );

    let rawResult;
    if (isMultimodal && mmConfig) {
      const images = Object.values(inputs).filter(v => typeof v === "string" && (v as string).startsWith("data:image/")) as string[];
      rawResult = await callMultimodalLLM(prompt, images, mmConfig);
    } else if (isMultimodal && !mmConfig) {
      throw new Error("检测到图片输入，但未配置多模态视觉模型。请在设置中配置视觉API。");
    } else {
      rawResult = await callLLM(prompt, llmConfig);
    }
    const jsonResult = extractJSON(rawResult.content);

    let parsed;
    try {
      parsed = JSON.parse(jsonResult);
    } catch {
      parsed = { raw: rawResult.content };
    }

    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] 完成: ${moduleId}, 耗时: ${duration}ms, tokens: ${rawResult.usage?.totalTokens || "N/A"}`
    );

    res.json({
      moduleId,
      moduleName: resolvedModuleName,
      result: parsed,
      duration,
      usage: rawResult.usage || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "未知错误";
    console.error(
      `[${new Date().toISOString()}] 错误: ${moduleId} - ${message}`
    );
    res.status(500).json({
      error: message,
      moduleId,
    });
  }
});

// ===== 提示词模板管理 API =====

// 获取所有提示词模板（含文本内容）
app.get("/api/prompts", (_req, res) => {
  const prompts = getAllPromptTemplates();
  res.json({ prompts });
});

// 更新单个提示词模板
app.put("/api/prompts/:moduleId", (req, res) => {
  const { moduleId } = req.params;
  const { templateText } = req.body;

  if (!templateText || typeof templateText !== "string") {
    res.status(400).json({ error: "缺少 templateText" });
    return;
  }

  const success = updatePromptTemplate(moduleId, templateText);
  if (!success) {
    res.status(404).json({ error: `未找到模块：${moduleId}` });
    return;
  }

  console.log(
    `[${new Date().toISOString()}] 提示词已更新: ${moduleId}`
  );
  res.json({ success: true, moduleId });
});

// 重置提示词模板为默认值
app.post("/api/prompts/:moduleId/reset", (req, res) => {
  const { moduleId } = req.params;
  const success = resetPromptTemplate(moduleId);
  if (!success) {
    res.status(404).json({ error: `未找到模块：${moduleId}` });
    return;
  }
  console.log(
    `[${new Date().toISOString()}] 提示词已重置: ${moduleId}`
  );
  res.json({ success: true, moduleId });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Backend server running at http://localhost:${PORT}`);
});
