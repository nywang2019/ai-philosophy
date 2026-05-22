import { useState } from "react";
import type { ModuleConfig, ModuleField } from "../modules/moduleConfig";

interface Props {
  config: ModuleConfig | null;
  secondConfig?: ModuleConfig | null;
  compareMode: boolean;
  onToggleCompare: () => void;
  onSubmit: (inputs: Record<string, unknown>) => void;
  loading: boolean;
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
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={field.placeholder} />
      </div>
    </div>
  );
};

const InputPanel: React.FC<Props> = ({ config, secondConfig, compareMode, onToggleCompare, onSubmit, loading }) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});

  if (!config) {
    return (
      <div className="input-panel">
        <div className="input-placeholder">请从左侧选择一个模块</div>
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
            <textarea value={(values[field.key] as string) || ""} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} rows={4} />
          </div>
        );
      default:
        return (
          <div className="input-field" key={field.key}>
            <label>{field.label}</label>
            <input type="text" value={(values[field.key] as string) || ""} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} />
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
      </div>
      <div className="compare-toggle-row">
        <label className="compare-toggle">
          <input type="checkbox" checked={compareMode} onChange={onToggleCompare} />
          <span>对比模式</span>
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
