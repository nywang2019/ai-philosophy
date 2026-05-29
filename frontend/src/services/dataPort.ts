// 历史会话导入导出服务
import { getAllHistory, type HistoryEntry } from "./historyStore";

export interface ExportData {
  version: string;
  exportedAt: string;
  history: HistoryEntry[];
}

export function exportHistory(): ExportData {
  const raw = getAllHistory();
  // 安全：导出时剥离 apiKey
  const safe = raw.map(e => ({
    ...e,
    llmConfig: e.llmConfig ? { ...e.llmConfig, apiKey: "" } : e.llmConfig,
  }));
  return {
    version: "5.0",
    exportedAt: new Date().toISOString(),
    history: safe,
  };
}

export function downloadExport(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-philosophy-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importHistory(jsonStr: string): { success: boolean; error?: string; count: number } {
  let data: ExportData;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: "JSON 格式解析失败", count: 0 };
  }

  if (!Array.isArray(data.history)) {
    return { success: false, error: "文件中没有找到历史会话数据", count: 0 };
  }

  // 安全：导入后恢复当前 apiKey（从localStorage读取，兼容新旧格式）
  let currentApiKey = "";
  try {
    const activeId = localStorage.getItem("ai-philosophy-active-llm-id");
    const configs = JSON.parse(localStorage.getItem("ai-philosophy-llm-configs") || "[]");
    const active = activeId ? configs.find((c: { id: string }) => c.id === activeId) : configs[0];
    if (active) currentApiKey = active.apiKey || "";
  } catch { /* ignore */ }
  if (!currentApiKey) {
    try {
      const saved = localStorage.getItem("ai-philosophy-llm-config");
      if (saved) currentApiKey = JSON.parse(saved).apiKey || "";
    } catch { /* ignore */ }
  }
  if (currentApiKey) {
    for (const e of data.history) {
      if (e.llmConfig && !e.llmConfig.apiKey) {
        e.llmConfig.apiKey = currentApiKey;
      }
    }
  }

  localStorage.setItem("ai-philosophy-history", JSON.stringify(data.history));
  return { success: true, count: data.history.length };
}