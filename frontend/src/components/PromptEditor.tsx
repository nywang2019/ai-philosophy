import { useState, useEffect } from "react";
import {
  fetchPrompts,
  updatePrompt,
  resetPrompt,
  type PromptTemplateData,
} from "../api/client";

const PromptEditor: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptTemplateData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await fetchPrompts();
      setPrompts(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].moduleId);
        setEditText(data[0].templateText);
      }
    } catch {
      setMessage({ type: "error", text: "加载提示词失败" });
    }
  };

  const selected = prompts.find((p) => p.moduleId === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const p = prompts.find((p) => p.moduleId === id);
    if (p) setEditText(p.templateText);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      await updatePrompt(selectedId, editText);
      setPrompts((prev) =>
        prev.map((p) =>
          p.moduleId === selectedId ? { ...p, templateText: editText } : p
        )
      );
      setMessage({ type: "success", text: "保存成功" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedId) return;
    if (!confirm("确定要重置为默认提示词吗？当前修改将丢失。")) return;
    setSaving(true);
    setMessage(null);
    try {
      await resetPrompt(selectedId);
      await loadPrompts();
      setMessage({ type: "success", text: "已重置为默认值" });
      // 刷新编辑区
      const refreshed = await fetchPrompts();
      const found = refreshed.find((p) => p.moduleId === selectedId);
      if (found) setEditText(found.templateText);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "重置失败" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prompt-editor">
      <div className="prompt-editor-sidebar">
        <div className="prompt-editor-sidebar-header">模块列表</div>
        {prompts.map((p) => (
          <div
            key={p.moduleId}
            className={`prompt-editor-item ${selectedId === p.moduleId ? "active" : ""}`}
            onClick={() => handleSelect(p.moduleId)}
          >
            {p.moduleName}
          </div>
        ))}
      </div>
      <div className="prompt-editor-main">
        {selected && (
          <>
            <div className="prompt-editor-toolbar">
              <span className="prompt-editor-title">{selected.moduleName}</span>
              <div className="prompt-editor-actions">
                <button
                  className="btn-reset"
                  onClick={handleReset}
                  disabled={saving}
                >
                  重置默认
                </button>
                <button
                  className="btn-save-prompt"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
            {message && (
              <div className={`prompt-editor-msg ${message.type}`}>
                {message.text}
              </div>
            )}
            <textarea
              className="prompt-editor-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="提示词模板..."
            />
            <div className="prompt-editor-hint">
              占位符说明：<code>{"{key}"}</code> 替换为输入值（数组用"、"连接），
              <code>{"{key:json}"}</code> 替换为 JSON 序列化值
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;
