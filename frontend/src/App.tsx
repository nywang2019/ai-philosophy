import { useState, useCallback, useEffect } from "react";
import ModuleList from "./components/ModuleList";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";
import SettingsModal from "./components/SettingsModal";
import HistoryPanel from "./components/HistoryPanel";
import Dashboard from "./components/Dashboard";
import type { ModuleConfig } from "./modules/moduleConfig";
import { moduleConfigs } from "./modules/moduleConfig";
import { generate } from "./api/client";
import type { GenerateResult, LLMConfig } from "./api/client";
import { addHistory } from "./services/historyStore";
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
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [secondResult, setSecondResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const themeId = getStoredTheme();
    applyTheme(themeId);
  }, []);

  const handleSelectModule = useCallback(
    (config: ModuleConfig) => {
      if (compareMode) {
        // 对比模式：第一次点击设为主模块，再点击其他模块设为第二模块
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

      setLoading(true);
      setError(null);

      if (compareMode && secondModule) {
        setResult(null);
        setSecondResult(null);
        try {
          const [resA, resB] = await Promise.all([
            doGenerate(selectedModule, inputs),
            doGenerate(secondModule, inputs),
          ]);
          setResult(resA);
          setSecondResult(resB);
          addHistory(selectedModule.moduleId, selectedModule.moduleName, inputs, resA.result, llmConfig);
          addHistory(secondModule.moduleId, secondModule.moduleName, inputs, resB.result, llmConfig);
          setHistoryRefreshKey((k) => k + 1);
        } catch (err) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } else {
        setResult(null);
        setSecondResult(null);
        try {
          const res = await doGenerate(selectedModule, inputs);
          setResult(res);
          addHistory(selectedModule.moduleId, selectedModule.moduleName, inputs, res.result, llmConfig);
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
    return undefined;
  }, []);

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      const mod = findModule(entry.moduleId);
      if (mod) setSelectedModule(mod);
      setResult({
        moduleId: entry.moduleId,
        moduleName: entry.moduleName,
        result: entry.result,
        duration: 0,
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
        addHistory(mod.moduleId, mod.moduleName, entry.inputs, res.result, entry.llmConfig);
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
          <button className="btn-settings" onClick={() => setDashboardVisible(true)}>仪表盘</button>
          <button className="btn-settings" onClick={() => setHistoryVisible(true)}>历史</button>
          <button className="btn-settings" onClick={() => setSettingsVisible(true)}>设置</button>
        </div>
      </header>
      {dashboardVisible ? (
        <div className="dashboard-wrapper">
          <button className="dash-back-btn" onClick={() => setDashboardVisible(false)}>&larr; 返回主界面</button>
          <Dashboard />
        </div>
      ) : (
        <div className="app-body">
          <aside className="sidebar">
            <ModuleList
              selectedId={selectedModule?.moduleId || null}
              secondSelectedId={compareMode ? secondModule?.moduleId || null : null}
              onSelect={handleSelectModule}
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
            />
          </main>
          {/* 输出区：对比模式分上下，普通模式单栏 */}
          {compareMode && secondResult ? (
            <aside className="output-sidebar output-compare">
              <div className="output-compare-half">
                <div className="output-compare-label">{selectedModule?.moduleName}</div>
                <OutputPanel result={result} error={null} loading={false} onBackToHome={handleBackToHome} />
              </div>
              <div className="output-compare-divider" />
              <div className="output-compare-half">
                <div className="output-compare-label">{secondModule?.moduleName}</div>
                <OutputPanel result={secondResult} error={null} loading={false} onBackToHome={handleBackToHome} />
              </div>
            </aside>
          ) : (
            <aside className="output-sidebar">
              <OutputPanel result={result} error={error} loading={loading} onHistorySelect={handleHistorySelect} onBackToHome={handleBackToHome} />
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
        onSelect={handleHistorySelect}
        onRegenerate={handleRegenerate}
        refreshKey={historyRefreshKey}
      />
    </div>
  );
};

export default App;
