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
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(loadConfig());
  const [settingsVisible, setSettingsVisible] = useState(!loadConfig());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 启动时加载主题
  useEffect(() => {
    const themeId = getStoredTheme();
    applyTheme(themeId);
  }, []);

  const handleSelectModule = useCallback((config: ModuleConfig) => {
    setSelectedModule(config);
    setResult(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (inputs: Record<string, unknown>) => {
      if (!selectedModule || !llmConfig) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await generate({
          moduleId: selectedModule.moduleId,
          inputs,
          llmConfig,
        });
        setResult(res);
        // 自动保存到历史
        addHistory(
          selectedModule.moduleId,
          selectedModule.moduleName,
          inputs,
          res.result,
          llmConfig
        );
        setHistoryRefreshKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    },
    [selectedModule, llmConfig]
  );

  const handleSaveConfig = useCallback((config: LLMConfig) => {
    setLlmConfig(config);
  }, []);

  // 从历史加载对话
  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      const mod = moduleConfigs.find((m) => m.moduleId === entry.moduleId);
      if (mod) setSelectedModule(mod);
      setResult({
        moduleId: entry.moduleId,
        moduleName: entry.moduleName,
        result: entry.result,
        duration: 0,
      });
      setError(null);
    },
    []
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>文史哲AI多模块生成系统</h1>
        <div className="header-actions">
          {llmConfig && (
            <span className="config-status">
              {llmConfig.model}
            </span>
          )}
          <button
            className="btn-settings"
            onClick={() => setDashboardVisible(true)}
          >
            仪表盘
          </button>
          <button
            className="btn-settings"
            onClick={() => setHistoryVisible(true)}
          >
            历史
          </button>
          <button
            className="btn-settings"
            onClick={() => setSettingsVisible(true)}
          >
            设置
          </button>
        </div>
      </header>
      {dashboardVisible ? (
        <div className="dashboard-wrapper">
          <button
            className="dash-back-btn"
            onClick={() => setDashboardVisible(false)}
          >
            &larr; 返回主界面
          </button>
          <Dashboard />
        </div>
      ) : (
        <div className="app-body">
        <aside className="sidebar">
          <ModuleList
            selectedId={selectedModule?.moduleId || null}
            onSelect={handleSelectModule}
          />
        </aside>
        <main className="main-content">
          <InputPanel
            config={selectedModule}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </main>
        <aside className="output-sidebar">
          <OutputPanel result={result} error={error} loading={loading} />
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
        onSelect={handleHistorySelect}
        refreshKey={historyRefreshKey}
      />
    </div>
  );
};

export default App;
