import { useState, useEffect } from "react";
import type { LLMConfig } from "../api/client";
import PromptEditor from "./PromptEditor";
import ThemePanel from "./ThemePanel";
import OutputPrefsPanel from "./OutputPrefsPanel";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (config: LLMConfig) => void;
}

// 设置面板定义 - 后续新增面板只需在此数组中添加
interface SettingsPanel {
  key: string;
  label: string;
}

const panels: SettingsPanel[] = [
  { key: "api", label: "API配置" },
  { key: "prompts", label: "提示词模板" },
  { key: "theme", label: "系统主题" },
  { key: "output", label: "输出偏好" },
];

const STORAGE_KEY = "ai-philosophy-llm-config";

// ===== API 配置面板 =====
const ApiConfigPanel: React.FC<{ onSave: (config: LLMConfig) => void; onClose: () => void }> = ({
  onSave,
  onClose,
}) => {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved) as LLMConfig;
        setEndpoint(config.endpoint || "");
        setApiKey(config.apiKey || "");
        setModel(config.model || "");
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSave = () => {
    const config: LLMConfig = { endpoint, apiKey, model };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    onSave(config);
  };

  return (
    <div className="settings-panel">
      <div className="input-field">
        <label>API Endpoint</label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://api.openai.com"
        />
        <span className="input-hint">
          支持 OpenAI 兼容接口（如 OpenAI、Claude API 等）
        </span>
      </div>
      <div className="input-field">
        <label>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>
      <div className="input-field">
        <label>Model</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4o / claude-opus-4-7"
        />
      </div>
      <div className="settings-panel-footer">
        <button className="btn-cancel" onClick={onClose}>
          关闭
        </button>
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={!endpoint || !apiKey || !model}
        >
          保存
        </button>
      </div>
    </div>
  );
};

// ===== 主设置弹窗 =====
const SettingsModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [activePanel, setActivePanel] = useState(panels[0].key);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>设置</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body modal-body-settings">
          <nav className="settings-nav">
            {panels.map((panel) => (
              <div
                key={panel.key}
                className={`settings-nav-item ${activePanel === panel.key ? "active" : ""}`}
                onClick={() => setActivePanel(panel.key)}
              >
                {panel.label}
              </div>
            ))}
          </nav>
          <div className="settings-content">
            {activePanel === "api" && (
              <ApiConfigPanel onSave={onSave} onClose={onClose} />
            )}
            {activePanel === "prompts" && <PromptEditor />}
            {activePanel === "theme" && <ThemePanel />}
            {activePanel === "output" && <OutputPrefsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
