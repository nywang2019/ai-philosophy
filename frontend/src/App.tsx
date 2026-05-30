import { useState, useCallback, useEffect, useMemo } from "react";
import ModuleList from "./components/ModuleList";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";
import SettingsModal from "./components/SettingsModal";
import HistoryPanel from "./components/HistoryPanel";
import Dashboard from "./components/Dashboard";
import ProjectPanel from "./components/ProjectPanel";
import SearchPanel from "./components/SearchPanel";
import KnowledgeGraphPanel from "./components/KnowledgeGraphPanel";
import ShowcasePanel from "./components/ShowcasePanel";
import type { ModuleConfig } from "./modules/moduleConfig";
import { moduleConfigs } from "./modules/moduleConfig";
import { generate } from "./api/client";
import type { GenerateResult, LLMConfig } from "./api/client";
import { addHistory, getAllHistory, setTokens } from "./services/historyStore";
import type { HistoryEntry } from "./services/historyStore";
import { getStoredTheme, applyTheme } from "./themes/themes";
import { getCustomModule, getAllCustomModules } from "./services/customModuleStore";
import { getImage } from "./services/imageStore";
import "./App.css";

// 即时压缩 Base64 图片，兜底保证不超 DashScope 129k 限制
async function compressBase64Image(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 800;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.6;
      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > 100000 && quality > 0.2) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", Math.round(quality * 10) / 10);
      }
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const STORAGE_KEY = "ai-philosophy-llm-config"; void STORAGE_KEY;

function loadConfig(): LLMConfig | null {
  try {
    const activeId = localStorage.getItem("ai-philosophy-active-llm-id");
    const configs = JSON.parse(localStorage.getItem("ai-philosophy-llm-configs") || "[]");
    const active = activeId ? configs.find((c: { id: string }) => c.id === activeId) : configs[0];
    if (active) return { endpoint: active.endpoint, apiKey: active.apiKey, model: active.model };
  } catch { /* ignore */ }
  // 降级：旧格式
  try {
    const saved = localStorage.getItem("ai-philosophy-llm-config");
    if (saved) return JSON.parse(saved) as LLMConfig;
  } catch { /* ignore */ }
  return null;
}

const App: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null);
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(loadConfig());
  const [settingsVisible, setSettingsVisible] = useState(!loadConfig());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [projectVisible, setProjectVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [graphVisible, setGraphVisible] = useState(false);
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [showcaseRefreshKey, setShowcaseRefreshKey] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [exampleValues, setExampleValues] = useState<Record<string, unknown> | null>(null);

  const headerStats = useMemo(() => {
    const all = getAllHistory();
    const total = all.length;
    const chars = all.reduce((s, e) => s + JSON.stringify(e.result).length, 0);
    const tokens = all.reduce((s, e) => s + (e.totalTokens || 0), 0);
    return { total, chars, tokens };
  }, [historyRefreshKey]);

  useEffect(() => {
    const themeId = getStoredTheme();
    applyTheme(themeId);

    // 加载分享链接
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      try {
        const encoded = hash.slice(7);
        const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        if (payload.m && payload.d) {
          setResult({ moduleId: "shared", moduleName: payload.m, result: payload.d, duration: 0 });
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleSelectModule = useCallback(
    (config: ModuleConfig) => {
      setExampleValues(null);
      setSelectedModule(config);
      setResult(null);
      setError(null);
    },
    []
  );

  const handleTryExample = useCallback((config: ModuleConfig) => {
    setSelectedModule(config);
    setResult(null);
    setError(null);
    setExampleValues(config.example || null);
  }, []);

  // AI自动标签
  const autoTag = useCallback(async (_historyId: string, _inputs: Record<string, unknown>, _resultData: Record<string, unknown>) => {
    // 暂时禁用自动标签
  }, [llmConfig]);

  // 单个模块生成
  const doGenerate = async (mod: ModuleConfig, inputs: Record<string, unknown>) => {
    const isCustom = !!mod._isCustom;
    const customMod = isCustom ? getCustomModule(mod.moduleId) : null;
    // 解析 IndexedDB 图片引用为 Base64，超限则即时压缩
    const resolvedInputs = { ...inputs };
    for (const [k, v] of Object.entries(resolvedInputs)) {
      if (typeof v === "string" && v.startsWith("img_")) {
        const img = await getImage(v);
        if (img) {
          let data = img.data;
          if (data.length > 100000) {
            data = await compressBase64Image(data);
          }
          resolvedInputs[k] = data;
        }
      }
    }
    const hasImage = Object.values(resolvedInputs).some(v => typeof v === "string" && v.startsWith("data:image/"));
    let mmConfig = undefined;
    if (hasImage) {
      try {
        const activeId = localStorage.getItem("ai-philosophy-active-mm-id");
        const configs = JSON.parse(localStorage.getItem("ai-philosophy-mm-configs") || "[]");
        const active = activeId ? configs.find((c: { id: string }) => c.id === activeId) : configs[0];
        if (active) {
          mmConfig = { endpoint: active.endpoint, apiKey: active.apiKey, model: active.model };
        }
      } catch { /* ignore */ }
    }
    return generate({
      moduleId: mod.moduleId,
      inputs: isCustom ? { ...resolvedInputs, _customModuleName: mod.moduleName } : resolvedInputs,
      llmConfig: llmConfig!,
      customPrompt: customMod?.templateText,
      multimodalConfig: mmConfig,
    });
  };

  const handleSubmit = useCallback(
    async (inputs: Record<string, unknown>) => {
      if (!selectedModule) return;
      if (!llmConfig) { setError("请先在设置中配置API信息"); return; }

      // 批量模式
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await doGenerate(selectedModule, inputs);
        setResult(res);
        const h = addHistory(selectedModule.moduleId, selectedModule.moduleName, inputs, res.result, llmConfig);
        setLastHistoryId(h.id);
        if (res.usage?.totalTokens) setTokens(h.id, res.usage.totalTokens);
        autoTag(h.id, inputs, res.result);
        setHistoryRefreshKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      }
      setLoading(false);
    },
    [selectedModule, llmConfig]
  );

  const handleBackToHome = useCallback(() => {
    setSelectedModule(null);
    setResult(null);
    setError(null);
    setDashboardVisible(false);
  }, []);

  const handleSaveConfig = useCallback((config: LLMConfig) => {
    setLlmConfig(config);
  }, []);

  const findModule = useCallback((moduleId: string): ModuleConfig | undefined => {
    const builtIn = moduleConfigs.find((m) => m.moduleId === moduleId);
    if (builtIn) return builtIn;
    const custom = getAllCustomModules().find((m) => m.moduleId === moduleId);
    if (custom) return {
      moduleId: custom.moduleId,
      moduleName: custom.moduleName,
      icon: custom.icon || "📦",
      description: custom.description,
      fields: custom.fields,
      _isCustom: true,
    };
    // 模块已删除：构造虚拟配置以正常展示
    return {
      moduleId,
      moduleName: moduleId,
      icon: "📦",
      description: "已删除的模块",
      fields: [],
      _isCustom: true,
    };
  }, []);

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      const mod = findModule(entry.moduleId);
      if (mod) setSelectedModule(mod);
      setLastHistoryId(entry.id);
      setExampleValues(entry.inputs || null);
      setResult({
        moduleId: entry.moduleId,
        moduleName: entry.moduleName,
        result: entry.result,
        duration: 0,
        usage: entry.totalTokens ? { totalTokens: entry.totalTokens, promptTokens: 0, completionTokens: 0 } : null,
      });
      setError(null);
    },
    []
  );

  const handleRegenerate = useCallback(
    async (entry: HistoryEntry) => {
      const mod = findModule(entry.moduleId);
      if (!mod || !entry.llmConfig) return;

      setSelectedModule(mod);
      setExampleValues(entry.inputs || null);
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await doGenerate(mod, entry.inputs);
        setResult(res);
        const h = addHistory(mod.moduleId, mod.moduleName, entry.inputs, res.result, entry.llmConfig);
        setLastHistoryId(h.id);
        autoTag(h.id, entry.inputs, res.result);
        setHistoryRefreshKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    },
    [llmConfig]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>文史哲AI多模块生成系统</h1>
        <div className="header-actions">
          {llmConfig && <span className="config-status">{llmConfig.model}</span>}
          <span className="config-status">会话总次数：{headerStats.total}</span>
          <span className="config-status">总生成量：{(headerStats.chars / 1000).toFixed(0)}k</span>
          <span className="config-status">Token总消耗量：{(headerStats.tokens / 1000).toFixed(0)}k</span>
          <button className="btn-settings" onClick={handleBackToHome}>🏠</button>
          <button className="btn-settings" onClick={() => setSearchVisible(true)}>🔍</button>
          <button className="btn-settings" onClick={() => setShowcaseVisible(true)}>🎨 展馆</button>
          <button className="btn-settings" onClick={() => setGraphVisible(true)}>🕸️ 知识图谱</button>
          <button className="btn-settings" onClick={() => setDashboardVisible(true)}>仪表盘</button>
          <button className="btn-settings" onClick={() => setProjectVisible(true)}>研究项目</button>
          <button className="btn-settings" onClick={() => setHistoryVisible(true)}>对话历史</button>
          <button className="btn-settings" onClick={() => setSettingsVisible(true)}>设置</button>
        </div>
      </header>
      {dashboardVisible ? (
        <div className="dashboard-wrapper">
          <button className="dash-back-btn" onClick={() => setDashboardVisible(false)}>&larr; 返回主界面</button>
          <Dashboard
            onHistorySelect={(entry) => { handleHistorySelect(entry); setDashboardVisible(false); }}
            onViewProject={() => { setDashboardVisible(false); setProjectVisible(true); }}
          />
        </div>
      ) : (
        <div className="app-body">
          <aside className="sidebar">
            <ModuleList
              selectedId={selectedModule?.moduleId || null}
              onSelect={handleSelectModule}
              onTryExample={handleTryExample}
            />
          </aside>
          <main className="main-content">
            <InputPanel
              config={selectedModule}
              onSubmit={handleSubmit}
              loading={loading}
              initialValues={exampleValues}
            />
          </main>
          <aside className="output-sidebar">
            <OutputPanel result={result} error={error} loading={loading} onHistorySelect={handleHistorySelect} onBackToHome={handleBackToHome} onOpenHistory={() => setHistoryVisible(true)} lastHistoryId={lastHistoryId} showcaseRefreshKey={showcaseRefreshKey} />
          </aside>
        </div>
      )}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSaveConfig}
      />
      <HistoryPanel
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        onSelect={(entry) => {
          handleHistorySelect(entry);
          setDashboardVisible(false);
        }}
        onRegenerate={handleRegenerate}
        refreshKey={historyRefreshKey}
      />
      <ProjectPanel
        visible={projectVisible}
        onClose={() => setProjectVisible(false)}
        onProjectChange={() => setHistoryRefreshKey(k => k + 1)}
      />
      <SearchPanel
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={(entry) => { handleHistorySelect(entry); setDashboardVisible(false); }}
      />
      <KnowledgeGraphPanel
        visible={graphVisible}
        onClose={() => setGraphVisible(false)}
        onSelectEntry={(entry) => { handleHistorySelect(entry); setGraphVisible(false); setDashboardVisible(false); }}
      />
      <ShowcasePanel
        visible={showcaseVisible}
        onClose={() => { setShowcaseVisible(false); setShowcaseRefreshKey(k => k + 1); }}
        onView={(item) => {
          const mod = findModule(item.moduleId);
          if (mod) setSelectedModule(mod);
          setExampleValues(item.inputs || null);
          setResult({ moduleId: item.moduleId, moduleName: item.moduleName, result: item.result, duration: 0 });
          setLastHistoryId(item.historyId || null);
          setShowcaseVisible(false);
          setDashboardVisible(false);
        }}
      />
    </div>
  );
};

export default App;
