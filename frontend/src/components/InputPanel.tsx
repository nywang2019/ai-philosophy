import { useState, useEffect } from "react";
import type { ModuleConfig, ModuleField } from "../modules/moduleConfig";
import WelcomeAnimation from "./WelcomeAnimation";
import VoiceInput from "./VoiceInput";
import { getActiveProject } from "../services/projectStore";

interface Props {
  config: ModuleConfig | null;
  secondConfig?: ModuleConfig | null;
  compareMode: boolean;
  onToggleCompare: () => void;
  onSubmit: (inputs: Record<string, unknown>) => void;
  loading: boolean;
  initialValues?: Record<string, unknown> | null;
  batchMode: boolean;
  onToggleBatch: () => void;
}

const TagInput: React.FC<{
  field: ModuleField;
  tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ field, tags, onChange }) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onChange([...tags, input.trim()]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="input-field">
      <label>{field.label}</label>
      <div className="tag-container">
        {tags.map((tag, i) => (
          <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag(i)}>&times;</button></span>
        ))}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={field.placeholder} list={`suggest-${field.key}`} />
        {field.suggestions && field.suggestions.length > 0 && (
          <datalist id={`suggest-${field.key}`}>
            {field.suggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    </div>
  );
};

const InputPanel: React.FC<Props> = ({ config, secondConfig, compareMode, onToggleCompare, onSubmit, loading, initialValues, batchMode, onToggleBatch }) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});

  // 接收初始示例值
  useEffect(() => {
    if (initialValues && config) {
      const v: Record<string, unknown> = {};
      const tv: Record<string, string[]> = {};
      for (const field of config.fields) {
        const val = initialValues[field.key];
        if (field.type === "tag-input" && Array.isArray(val)) {
          tv[field.key] = val as string[];
          v[field.key] = val;
        } else if (val !== undefined) {
          v[field.key] = val;
        }
      }
      setValues(v);
      setTagValues(tv);
    }
  }, [initialValues, config]);

  if (!config) {
    return (
      <div className="input-panel">
        <div className="welcome-panel">
          <h2 className="welcome-title">文史哲AI多模块生成系统</h2>
          <WelcomeAnimation />
          <p className="welcome-desc">请从左侧模块列表中选择一个，开始你的思想实验。</p>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleTagChange = (key: string, tags: string[]) => {
    setTagValues((prev) => ({ ...prev, [key]: tags }));
    handleChange(key, tags);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputs: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (field.type === "tag-input") {
        inputs[field.key] = tagValues[field.key] || [];
      } else {
        inputs[field.key] = values[field.key] || "";
      }
    }
    onSubmit(inputs);
  };

  const isFormValid = () => {
    return config.fields.every((field) => {
      if (field.type === "tag-input") return (tagValues[field.key] || []).length > 0;
      return (values[field.key] as string)?.trim();
    });
  };

  const renderField = (field: ModuleField) => {
    switch (field.type) {
      case "tag-input":
        return <TagInput key={field.key} field={field} tags={tagValues[field.key] || []} onChange={(tags) => handleTagChange(field.key, tags)} />;
      case "textarea":
        return (
          <div className="input-field" key={field.key}>
            <label>{field.label}</label>
            <div className="input-with-voice">
              <textarea value={(values[field.key] as string) || ""} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} rows={4} />
              <VoiceInput onResult={(text) => handleChange(field.key, ((values[field.key] as string) || "") + text)} />
            </div>
            {field.suggestions && field.suggestions.length > 0 && (
              <div className="suggest-chips">
                {field.suggestions.slice(0, 15).map((s) => {
                  const short = s.length > 10 ? s.slice(0, 10) + "…" : s;
                  return (
                    <span key={s} className="suggest-chip" onClick={() => handleChange(field.key, s)} title={s}>{short}</span>
                  );
                })}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="input-field" key={field.key}>
            <label>{field.label}</label>
            <div className="input-with-voice">
              <input type="text" value={(values[field.key] as string) || ""} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} list={`suggest-${field.key}`} />
              {field.suggestions && field.suggestions.length > 0 && (
                <datalist id={`suggest-${field.key}`}>
                  {field.suggestions.map((s) => <option key={s} value={s} />)}
                </datalist>
              )}
              <VoiceInput onResult={(text) => handleChange(field.key, ((values[field.key] as string) || "") + text)} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="input-panel">
      <div className="input-panel-header">
        {compareMode && secondConfig
          ? <><span className="compare-badge-a">● {config.moduleName}</span> vs <span className="compare-badge-b">▲ {secondConfig.moduleName}</span></>
          : config.moduleName
        }
        {(() => { const ap = getActiveProject(); return ap ? <span className="active-project-badge">{ap.icon} {ap.name}</span> : null; })()}
      </div>
      <div className="compare-toggle-row">
        <label className="compare-toggle">
          <input type="checkbox" checked={compareMode} onChange={onToggleCompare} />
          <span>对比模式</span>
        </label>
        <label className="compare-toggle">
          <input type="checkbox" checked={batchMode} onChange={onToggleBatch} />
          <span>批量模式</span>
        </label>
        {compareMode && !secondConfig && (
          <span className="compare-hint">请在左侧模块列表选择第二个模块（显示为 ▲）</span>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        {config.fields.map(renderField)}
        <button type="submit" className="btn-generate" disabled={!isFormValid() || loading || (compareMode && !secondConfig)}>
          {loading ? "生成中..." : compareMode && secondConfig ? "双模块生成" : "开始生成"}
        </button>
      </form>
    </div>
  );
};

export default InputPanel;
