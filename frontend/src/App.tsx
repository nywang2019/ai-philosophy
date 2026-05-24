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
import type { ModuleConfig } from "./modules/moduleConfig";
import { moduleConfigs } from "./modules/moduleConfig";
import { generate } from "./api/client";
import type { GenerateResult, LLMConfig } from "./api/client";
import { addHistory, getAllHistory, setTokens } from "./services/historyStore";
import type { HistoryEntry } from "./services/historyStore";
import { getStoredTheme, applyTheme } from "./themes/themes";
import { getCustomModule, getAllCustomModules } from "./services/customModuleStore";
import "./App.css";

const STORAGE_KEY = "ai-philosophy-llm-config";

function loadConfig(): LLMConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as LLMConfig;
  } catch {
    // ignore
  }
  return null;
}

const App: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null);
  const [secondModule, setSecondModule] = useState<ModuleConfig | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(loadConfig());
  const [settingsVisible, setSettingsVisible] = useState(!loadConfig());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [projectVisible, setProjectVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [graphVisible, setGraphVisible] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [secondResult, setSecondResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<{ item: string; res: GenerateResult | null; err: string | null }[] | null>(null);
  const [batchProgress, setBatchProgress] = useState(0);
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
      if (compareMode) {
        if (!selectedModule) {
          setSelectedModule(config);
        } else if (config.moduleId !== selectedModule.moduleId) {
          setSecondModule(config);
        }
        setResult(null);
        setSecondResult(null);
        setError(null);
      } else {
        setSelectedModule(config);
        setSecondModule(null);
        setResult(null);
        setError(null);
      }
    },
    [compareMode, selectedModule]
  );

  const handleTryExample = useCallback((config: ModuleConfig) => {
    setSelectedModule(config);
    setSecondModule(null);
    setResult(null);
    setSecondResult(null);
    setError(null);
    setExampleValues(config.example || null);
  }, []);

  // AI自动标签
  const autoTag = useCallback(async (_historyId: string, _inputs: Record<string, unknown>, _resultData: Record<string, unknown>) => {
    // 暂时禁用自动标签
  }, [llmConfig]);

  const toggleBatch = useCallback(() => {
    setBatchMode(prev => !prev);
    setBatchResults(null);
  }, []);

  const toggleCompare = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        setSecondModule(null);
        setSecondResult(null);
      }
      return !prev;
    });
  }, []);

  // 单个模块生成
  const doGenerate = async (mod: ModuleConfig, inputs: Record<string, unknown>) => {
    const isCustom = !!mod._isCustom;
    const customMod = isCustom ? getCustomModule(mod.moduleId) : null;
    return generate({
      moduleId: mod.moduleId,
      inputs: isCustom ? { ...inputs, _customModuleName: mod.moduleName } : inputs,
      llmConfig: llmConfig!,
      customPrompt: customMod?.templateText,
    });
  };

  const handleSubmit = useCallback(
    async (inputs: Record<string, unknown>) => {
      if (!selectedModule || !llmConfig) return;

      // 批量模式
      if (batchMode) {
        const firstVal = Object.values(inputs).find(v => typeof v === "string") as string || "";
        const items = firstVal.split("\n").map(s => s.trim()).filter(Boolean);
        if (items.length === 0) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setSecondResult(null);
        setBatchResults(items.map(item => ({ item, res: null, err: null })));
        setBatchProgress(0);

        const isCustom = !!selectedModule._isCustom;
        const customMod = isCustom ? getCustomModule(selectedModule.moduleId) : null;

        for (let i = 0; i < items.length; i++) {
          const itemInputs = { ...inputs };
          // 替换第一个文本字段的值
          const firstKey = Object.keys(itemInputs).find(k => typeof itemInputs[k] === "string");
          if (firstKey) itemInputs[firstKey] = items[i];

          try {
            const res = await generate({
              moduleId: selectedModule.moduleId,
              inputs: isCustom ? { ...itemInputs, _customModuleName: selectedModule.moduleName } : itemInputs,
              llmConfig,
              customPrompt: customMod?.templateText,
            });
            setBatchResults(prev => prev ? prev.map((r, j) => j === i ? { ...r, res } : r) : null);
            const h = addHistory(selectedModule.moduleId, selectedModule.moduleName, itemInputs, res.result, llmConfig);
            setLastHistoryId(h.id);
            autoTag(h.id, itemInputs, res.result);
          } catch (err) {
            setBatchResults(prev => prev ? prev.map((r, j) => j === i ? { ...r, err: (err instanceof Error ? err.message : "") } : r) : null);
          }
          setBatchProgress(i + 1);
        }

        setHistoryRefreshKey(k => k + 1);
        setLoading(false);

      } else if (compareMode && secondModule) {
        setLoading(true);
        setError(null);
        setResult(null);
        setSecondResult(null);
        try {
          const [resA, resB] = await Promise.all([
            doGenerate(selectedModule, inputs),
            doGenerate(secondModule, inputs),
          ]);
          setResult(resA);
          setSecondResult(resB);
          const hA = addHistory(selectedModule.moduleId, selectedModule.moduleName, inputs, resA.result, llmConfig);
          const hB = addHistory(secondModule.moduleId, secondModule.moduleName, inputs, resB.result, llmConfig);
          setLastHistoryId(hA.id);
          autoTag(hA.id, inputs, resA.result);
          autoTag(hB.id, inputs, resB.result);
          setHistoryRefreshKey((k) => k + 1);
        } catch (err) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } else {
        setLoading(true);
        setError(null);
        setResult(null);
        setSecondResult(null);
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
      }

      setLoading(false);
    },
    [selectedModule, secondModule, compareMode, llmConfig]
  );

  const handleBackToHome = useCallback(() => {
    setSelectedModule(null);
    setSecondModule(null);
    setCompareMode(false);
    setResult(null);
    setSecondResult(null);
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
      setResult({
        moduleId: entry.moduleId,
        moduleName: entry.moduleName,
        result: entry.result,
        duration: 0,
        usage: entry.totalTokens ? { totalTokens: entry.totalTokens, promptTokens: 0, completionTokens: 0 } : null,
      });
      setSecondResult(null);
      setError(null);
    },
    []
  );

  const handleRegenerate = useCallback(
    async (entry: HistoryEntry) => {
      const mod = findModule(entry.moduleId);
      if (!mod || !entry.llmConfig) return;

      setSelectedModule(mod);
      setCompareMode(false);
      setSecondModule(null);
      setSecondResult(null);
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const isCustom = !!mod._isCustom;
        const customMod = isCustom ? getCustomModule(mod.moduleId) : null;
        const res = await generate({
          moduleId: mod.moduleId,
          inputs: isCustom ? { ...entry.inputs, _customModuleName: mod.moduleName } : entry.inputs,
          llmConfig: entry.llmConfig,
          customPrompt: customMod?.templateText,
        });
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
    []
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
              secondSelectedId={compareMode ? secondModule?.moduleId || null : null}
              onSelect={handleSelectModule}
              onTryExample={handleTryExample}
            />
          </aside>
          <main className="main-content">
            <InputPanel
              config={selectedModule}
              secondConfig={secondModule}
              compareMode={compareMode}
              onToggleCompare={toggleCompare}
              onSubmit={handleSubmit}
              loading={loading}
              initialValues={exampleValues}
              batchMode={batchMode}
              onToggleBatch={toggleBatch}
            />
          </main>
          {/* 输出区：对比模式分上下，普通模式单栏 */}
          {compareMode && secondResult ? (
            <aside className="output-sidebar output-compare">
              <div className="output-compare-half">
                <div className="output-compare-label">{selectedModule?.moduleName}</div>
                <OutputPanel result={result} error={null} loading={false} onBackToHome={handleBackToHome} onOpenHistory={() => setHistoryVisible(true)} />
              </div>
              <div className="output-compare-divider" />
              <div className="output-compare-half">
                <div className="output-compare-label">{secondModule?.moduleName}</div>
                <OutputPanel result={secondResult} error={null} loading={false} onBackToHome={handleBackToHome} onOpenHistory={() => setHistoryVisible(true)} />
              </div>
            </aside>
          ) : (
            <aside className="output-sidebar">
              <OutputPanel result={result} error={error} loading={loading} onHistorySelect={handleHistorySelect} onBackToHome={handleBackToHome} onOpenHistory={() => setHistoryVisible(true)} batchResults={batchResults} batchProgress={batchProgress} lastHistoryId={lastHistoryId} />
            </aside>
          )}
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
        onSelect={(entry) => { handleHistorySelect(entry); }}
      />
      <KnowledgeGraphPanel
        visible={graphVisible}
        onClose={() => setGraphVisible(false)}
        onSelectEntry={(entry) => { handleHistorySelect(entry); setGraphVisible(false); }}
      />
    </div>
  );
};

export default App;
