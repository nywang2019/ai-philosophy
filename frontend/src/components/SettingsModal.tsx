import { useState, useEffect } from "react";
import type { LLMConfig } from "../api/client";
import PromptEditor from "./PromptEditor";
import ThemePanel from "./ThemePanel";
import OutputPrefsPanel from "./OutputPrefsPanel";
import CustomModulePanel from "./CustomModulePanel";
import DataPortPanel from "./DataPortPanel";
import ImageManager from "./ImageManager";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (config: LLMConfig) => void;
}

interface SettingsPanel { key: string; label: string; }

const panels: SettingsPanel[] = [
  { key: "api", label: "API配置" },
  { key: "prompts", label: "提示词" },
  { key: "custom", label: "自定义模块" },
  { key: "theme", label: "主题" },
  { key: "output", label: "输出偏好" },
  { key: "data", label: "导入导出" },
  { key: "images", label: "图片管理" },
];

const STORAGE_KEY = "ai-philosophy-llm-config";
const TX_CONFIGS_KEY = "ai-philosophy-llm-configs";
const TX_ACTIVE_KEY = "ai-philosophy-active-llm-id";
const MM_CONFIGS_KEY = "ai-philosophy-mm-configs";
const MM_ACTIVE_KEY = "ai-philosophy-active-mm-id";

interface ModelConfig { id: string; name: string; endpoint: string; apiKey: string; model: string }

// ===== API 配置面板 =====
const ApiConfigPanel: React.FC<{ onSave: (config: LLMConfig) => void; onClose: () => void }> = ({
  onSave, onClose,
}) => {
  const [txConfigs, setTxConfigs] = useState<ModelConfig[]>([]);
  const [activeTxId, setActiveTxId] = useState("");
  const [hasLegacyTx, setHasLegacyTx] = useState(false);
  const [txName, setTxName] = useState("");
  const [txEndpoint, setTxEndpoint] = useState("");
  const [txApiKey, setTxApiKey] = useState("");
  const [txModel, setTxModel] = useState("");

  const [mmConfigs, setMmConfigs] = useState<ModelConfig[]>([]);
  const [activeMmId, setActiveMmId] = useState("");
  const [mmName, setMmName] = useState("");
  const [mmEndpoint, setMmEndpoint] = useState("");
  const [mmApiKey, setMmApiKey] = useState("");
  const [mmModel, setMmModel] = useState("");

  useEffect(() => {
    const txArr = localStorage.getItem(TX_CONFIGS_KEY);
    if (txArr) { try { setTxConfigs(JSON.parse(txArr)); } catch { /* ignore */ } }
    else {
      const old = localStorage.getItem(STORAGE_KEY);
      if (old) {
        try {
          const cfg = JSON.parse(old) as LLMConfig;
          if (cfg.endpoint && cfg.model) {
            const id = Date.now().toString(36);
            const migrated = [{ id, name: "默认模型", endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model }];
            setTxConfigs(migrated); localStorage.setItem(TX_CONFIGS_KEY, JSON.stringify(migrated));
            localStorage.setItem(TX_ACTIVE_KEY, id); setActiveTxId(id); setHasLegacyTx(true);
          }
        } catch { /* ignore */ }
      }
    }
    setActiveTxId(localStorage.getItem(TX_ACTIVE_KEY) || "");
    const mmSaved = localStorage.getItem(MM_CONFIGS_KEY);
    if (mmSaved) { try { setMmConfigs(JSON.parse(mmSaved)); } catch { /* ignore */ } }
    setActiveMmId(localStorage.getItem(MM_ACTIVE_KEY) || "");
  }, []);

  const addConfig = (type: "tx" | "mm") => {
    const name = type === "tx" ? txName : mmName;
    const ep = type === "tx" ? txEndpoint : mmEndpoint;
    const key = type === "tx" ? txApiKey : mmApiKey;
    const mdl = type === "tx" ? txModel : mmModel;
    if (!name || !ep || !mdl) return;
    const cfg: ModelConfig = { id: Date.now().toString(36), name, endpoint: ep, apiKey: key, model: mdl };
    if (type === "tx") {
      const u = [...txConfigs, cfg]; setTxConfigs(u); localStorage.setItem(TX_CONFIGS_KEY, JSON.stringify(u));
      if (!activeTxId) { setActiveTxId(cfg.id); localStorage.setItem(TX_ACTIVE_KEY, cfg.id); }
      onSave({ endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model });
      setTxName(""); setTxEndpoint(""); setTxApiKey(""); setTxModel("");
    } else {
      const u = [...mmConfigs, cfg]; setMmConfigs(u); localStorage.setItem(MM_CONFIGS_KEY, JSON.stringify(u));
      if (!activeMmId) { setActiveMmId(cfg.id); localStorage.setItem(MM_ACTIVE_KEY, cfg.id); }
      setMmName(""); setMmEndpoint(""); setMmApiKey(""); setMmModel("");
    }
  };

  const removeConfig = (type: "tx" | "mm", id: string) => {
    if (type === "tx") {
      const u = txConfigs.filter(c => c.id !== id); setTxConfigs(u); localStorage.setItem(TX_CONFIGS_KEY, JSON.stringify(u));
      if (activeTxId === id) { const n = u[0]?.id || ""; setActiveTxId(n); localStorage.setItem(TX_ACTIVE_KEY, n); }
    } else {
      const u = mmConfigs.filter(c => c.id !== id); setMmConfigs(u); localStorage.setItem(MM_CONFIGS_KEY, JSON.stringify(u));
      if (activeMmId === id) { const n = u[0]?.id || ""; setActiveMmId(n); localStorage.setItem(MM_ACTIVE_KEY, n); }
    }
  };

  const selectConfig = (type: "tx" | "mm", cfg: ModelConfig) => {
    if (type === "tx") { setActiveTxId(cfg.id); localStorage.setItem(TX_ACTIVE_KEY, cfg.id); onSave({ endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model }); }
    else { setActiveMmId(cfg.id); localStorage.setItem(MM_ACTIVE_KEY, cfg.id); }
  };

  const renderConfigList = (cfgs: ModelConfig[], activeId: string, type: "tx" | "mm", label: string) => cfgs.length === 0 ? null : (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      {cfgs.map(c => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, background: activeId === c.id ? "var(--active-bg)" : "var(--code-bg)", borderRadius: 8, border: activeId === c.id ? "1px solid var(--primary)" : "1px solid var(--border)" }}>
          <input type="radio" checked={activeId === c.id} onChange={() => selectConfig(type, c)} style={{ width: "auto", accentColor: "var(--primary)" }} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.model} · {c.endpoint}</div></div>
          <button className="btn-reset" style={{ fontSize: 10, padding: "1px 6px" }} onClick={() => removeConfig(type, c.id)}>删除</button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="settings-panel">
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>📝 文本模型</div>
      {renderConfigList(txConfigs, activeTxId, "tx", "已保存的文本模型")}
      {hasLegacyTx && <span className="input-hint" style={{ marginBottom: 8, display: "block" }}>旧配置已自动迁移为一组模型。选中即生效，无需再次保存。</span>}
      <details style={{ marginBottom: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--primary)" }}>+ 添加文本模型</summary>
        <div style={{ marginTop: 8 }}>
          <div className="input-field"><label>配置名称</label><input type="text" value={txName} onChange={e => setTxName(e.target.value)} placeholder="如：通义千问" /></div>
          <div className="input-field"><label>API Endpoint</label><input type="text" value={txEndpoint} onChange={e => setTxEndpoint(e.target.value)} placeholder="https://api.openai.com" /></div>
          <div className="input-field"><label>API Key</label><input type="password" value={txApiKey} onChange={e => setTxApiKey(e.target.value)} placeholder="sk-..." /></div>
          <div className="input-field"><label>模型名称</label><input type="text" value={txModel} onChange={e => setTxModel(e.target.value)} placeholder="qwen-plus / gpt-4o" /></div>
          <button className="btn-save-prompt" onClick={() => addConfig("tx")} disabled={!txName || !txEndpoint || !txModel}>保存此模型</button>
        </div>
      </details>

      <div className="settings-panel-footer">
        <button className="btn-cancel" onClick={onClose}>关闭</button>
      </div>

      <div style={{ margin: "24px 0 12px", borderTop: "1px solid var(--light-border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>🔮 多模态视觉模型（可选）</div>
        {renderConfigList(mmConfigs, activeMmId, "mm", "已保存的视觉模型")}
        <details style={{ marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--primary)" }}>+ 添加视觉模型</summary>
          <div style={{ marginTop: 8 }}>
            <div className="input-field"><label>配置名称</label><input type="text" value={mmName} onChange={e => setMmName(e.target.value)} placeholder="如：通义千问视觉" /></div>
            <div className="input-field"><label>API Endpoint</label><input type="text" value={mmEndpoint} onChange={e => setMmEndpoint(e.target.value)} placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" /></div>
            <div className="input-field"><label>API Key</label><input type="password" value={mmApiKey} onChange={e => setMmApiKey(e.target.value)} placeholder="留空则使用文本Key" /></div>
            <div className="input-field"><label>模型名称</label><input type="text" value={mmModel} onChange={e => setMmModel(e.target.value)} placeholder="qwen-vl-plus" /></div>
            <button className="btn-save-prompt" onClick={() => addConfig("mm")} disabled={!mmName || !mmEndpoint || !mmModel}>保存此模型</button>
          </div>
        </details>
      </div>
      <div className="settings-panel-footer">
        <button className="btn-cancel" onClick={onClose}>关闭</button>
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
        <div className="modal-header"><h2>设置</h2><button className="modal-close" onClick={onClose}>&times;</button></div>
        <div className="modal-body modal-body-settings">
          <nav className="settings-nav">
            {panels.map((panel) => (
              <div key={panel.key} className={`settings-nav-item ${activePanel === panel.key ? "active" : ""}`} onClick={() => setActivePanel(panel.key)}>{panel.label}</div>
            ))}
          </nav>
          <div className="settings-content">
            {activePanel === "api" && <ApiConfigPanel onSave={onSave} onClose={onClose} />}
            {activePanel === "prompts" && <PromptEditor />}
            {activePanel === "custom" && <CustomModulePanel />}
            {activePanel === "theme" && <ThemePanel />}
            {activePanel === "output" && <OutputPrefsPanel />}
            {activePanel === "data" && <DataPortPanel />}
            {activePanel === "images" && <ImageManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
