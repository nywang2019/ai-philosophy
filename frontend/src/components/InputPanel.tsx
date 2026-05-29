import { useState, useEffect } from "react";
import type { ModuleConfig, ModuleField } from "../modules/moduleConfig";
import WelcomeAnimation from "./WelcomeAnimation";
import VoiceInput from "./VoiceInput";
import { saveImage, getImage, getImageOriginal, getAllImageIds } from "../services/imageStore";
import { getActiveProject } from "../services/projectStore";

interface Props {
  config: ModuleConfig | null;
  onSubmit: (inputs: Record<string, unknown>) => void;
  loading: boolean;
  initialValues?: Record<string, unknown> | null;
}

// 图片预览（从IndexedDB加载）
// 图库选择器
const ImagePicker: React.FC<{ onSelect: (imageId: string) => void }> = ({ onSelect }) => {
  const [images, setImages] = useState<Array<{ id: string; data: string; size: number }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAllImageIds().then(async ids => {
      const items: typeof images = [];
      for (const id of ids) {
        const img = await getImage(id);
        if (img) items.push({ id, data: img.data, size: img.size });
      }
      items.sort((a, b) => b.id.localeCompare(a.id));
      setImages(items);
      setLoading(false);
    });
  }, []);
  return (
    <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 8, padding: 10, maxHeight: 200, overflowY: "auto", background: "var(--surface)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>从图库选择</div>
      {loading ? <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>加载中...</div>
        : images.length === 0 ? <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>暂无图片</div>
        : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {images.slice(0, 12).map(img => (
            <img key={img.id} src={img.data} style={{ width: 60, height: 45, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid var(--border)" }}
              onClick={() => onSelect(img.id)} title="选择此图" />
          ))}
        </div>}
    </div>
  );
};

const ImagePreview: React.FC<{ imageId: string }> = ({ imageId }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // 旧格式：直接Base64数据
    if (imageId.startsWith("data:image/")) {
      setSrc(imageId);
      return () => { cancelled = true; };
    }
    // 新格式：IndexedDB引用
    setError(false); setSrc(null);
    getImage(imageId).then(img => {
      if (cancelled) return;
      if (img) setSrc(img.data); else { console.warn("[ImagePreview] image not found in IndexedDB:", imageId); setError(true); }
    }).catch(e => {
      if (cancelled) return;
      console.error("[ImagePreview] IndexedDB error:", e);
      setError(true);
    });
    return () => { cancelled = true; };
  }, [imageId]);

  const viewFull = async () => {
    let originalSrc = src;
    if (imageId.startsWith("img_")) {
      const orig = await getImageOriginal(imageId);
      if (orig) originalSrc = orig;
    }
    if (!originalSrc) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(`<img src="${originalSrc}" style="max-width:100%;height:auto" />`); w.document.title = "图片预览"; }
  };

  if (error) return <div style={{ width: 200, height: 60, background: "var(--error-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--error-text)", fontSize: 12 }}>图片加载失败</div>;
  if (!src) return <div style={{ width: 200, height: 100, background: "var(--code-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>加载中...</div>;
  return (
    <div style={{ marginTop: 8 }}>
      <img src={src} alt="preview" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, cursor: "pointer" }} onClick={viewFull} title="点击查看原图" />
      <div style={{ fontSize: 10, color: "var(--primary)", cursor: "pointer", marginTop: 4 }} onClick={viewFull}>查看原图</div>
    </div>
  );
};

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

const InputPanel: React.FC<Props> = ({ config, onSubmit, loading, initialValues }) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});

  // 模块切换时清空输入
  useEffect(() => {
    if (!initialValues) {
      setValues({});
      setTagValues({});
    }
  }, [config?.moduleId]);

  // 接收初始值（示例或历史回看）
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
  }, [initialValues]);

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
      case "image":
        return (
          <div className="input-field" key={field.key}>
            <label>{field.label}</label>
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async () => {
                const img = new Image();
                img.onload = async () => {
                  const maxW = 800;
                  let w = img.width, h = img.height;
                  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                  const canvas = document.createElement("canvas");
                  canvas.width = w; canvas.height = h;
                  const ctx = canvas.getContext("2d")!;
                  ctx.drawImage(img, 0, 0, w, h);
                  // 逐级降质量，确保 Base64 不超过 DashScope 129k 字符限制
                  let quality = 0.7;
                  let compressed = canvas.toDataURL("image/jpeg", quality);
                  while (compressed.length > 120000 && quality > 0.2) {
                    quality -= 0.1;
                    compressed = canvas.toDataURL("image/jpeg", Math.round(quality * 10) / 10);
                  }
                  const original = reader.result as string;
                  const imageId = await saveImage(compressed, original, file.size);
                  handleChange(field.key, imageId);
                };
                img.src = reader.result as string;
              };
              reader.readAsDataURL(file);
            }} />
            {(values[field.key] as string) && <ImagePreview imageId={values[field.key] as string} />}
            {!values[field.key] && <ImagePicker onSelect={(id) => handleChange(field.key, id)} />}
          </div>
        );
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
        {config.moduleName}
        {(() => { const ap = getActiveProject(); return ap ? <span className="active-project-badge">{ap.icon} {ap.name}</span> : null; })()}
      </div>
      {/* 对比模式和批量模式暂时隐藏，后续开放 */}
      <form onSubmit={handleSubmit}>
        {config.fields.map(renderField)}
        <button type="submit" className="btn-generate" disabled={!isFormValid() || loading}>
          {loading ? "生成中..." : "开始生成"}
        </button>
      </form>
    </div>
  );
};

export default InputPanel;
