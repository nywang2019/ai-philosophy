import { useState, useEffect } from "react";

const STORAGE_KEY = "ai-philosophy-output-prefs";

export interface OutputPrefs {
  defaultViewMode: "preview" | "json" | "markdown";
  verbosity: "concise" | "standard" | "detailed";
}

const defaults: OutputPrefs = {
  defaultViewMode: "preview",
  verbosity: "standard",
};

export function getStoredPrefs(): OutputPrefs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return { ...defaults };
}

export function setStoredPrefs(prefs: OutputPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const verbosityLabels: { value: OutputPrefs["verbosity"]; label: string; desc: string }[] = [
  { value: "concise", label: "简洁", desc: "精简输出，只保留核心要点" },
  { value: "standard", label: "标准", desc: "平衡输出，既有要点也有必要展开" },
  { value: "detailed", label: "详细", desc: "充分展开，适合学术研究场景" },
];

const OutputPrefsPanel: React.FC = () => {
  const [prefs, setPrefs] = useState<OutputPrefs>(getStoredPrefs());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getStoredPrefs());
  }, []);

  const handleChange = <K extends keyof OutputPrefs>(key: K, value: OutputPrefs[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setStoredPrefs(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="settings-panel">
      {saved && <div className="prompt-editor-msg success">已保存</div>}

      <div className="input-field">
        <label>默认显示格式</label>
        <p className="settings-panel-desc">
          结果展示区默认以哪种格式显示
        </p>
        <div className="radio-group">
          <label className="radio-item">
            <input
              type="radio"
              name="viewMode"
              value="preview"
              checked={prefs.defaultViewMode === "preview"}
              onChange={() => handleChange("defaultViewMode", "preview")}
            />
            <span className="radio-label">
              <strong>预览</strong>
              <small>根据模块类型自动选择最佳展示方式</small>
            </span>
          </label>
          <label className="radio-item">
            <input
              type="radio"
              name="viewMode"
              value="json"
              checked={prefs.defaultViewMode === "json"}
              onChange={() => handleChange("defaultViewMode", "json")}
            />
            <span className="radio-label">
              <strong>JSON</strong>
              <small>结构化原始数据</small>
            </span>
          </label>
          <label className="radio-item">
            <input
              type="radio"
              name="viewMode"
              value="markdown"
              checked={prefs.defaultViewMode === "markdown"}
              onChange={() => handleChange("defaultViewMode", "markdown")}
            />
            <span className="radio-label">
              <strong>Markdown</strong>
              <small>渲染后的可读文本</small>
            </span>
          </label>
        </div>
      </div>

      <div className="input-field">
        <label>生成详细度</label>
        <p className="settings-panel-desc">
          控制AI生成内容的信息密度
        </p>
        <div className="radio-group">
          {verbosityLabels.map((v) => (
            <label key={v.value} className="radio-item">
              <input
                type="radio"
                name="verbosity"
                value={v.value}
                checked={prefs.verbosity === v.value}
                onChange={() => handleChange("verbosity", v.value)}
              />
              <span className="radio-label">
                <strong>{v.label}</strong>
                <small>{v.desc}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutputPrefsPanel;
