import { useState, useEffect, useCallback } from "react";
import {
  fetchPrompts,
  updatePrompt,
  resetPrompt,
  type PromptTemplateData,
} from "../api/client";
import {
  getAllCustomModules,
  updateCustomModule,
} from "../services/customModuleStore";

const PromptEditor: React.FC = () => {
  const [builtIn, setBuiltIn] = useState<PromptTemplateData[]>([]);
  const [allPrompts, setAllPrompts] = useState<(PromptTemplateData & { _isCustom?: boolean })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const data = await fetchPrompts();
      setBuiltIn(data);
      const customs = getAllCustomModules().map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        templateText: m.templateText,
        _isCustom: true as const,
      }));
      const merged = [...data, ...customs];
      setAllPrompts(merged);
      if (merged.length > 0 && !selectedId) {
        const first = merged[0];
        setSelectedId(first.moduleId);
        setEditText(first.templateText);
        setIsCustom(!!(first as { _isCustom?: boolean })._isCustom);
      }
    } catch {
      setMessage({ type: "error", text: "加载提示词失败" });
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const p = allPrompts.find((p) => p.moduleId === id);
    if (p) {
      setEditText(p.templateText);
      setIsCustom(!!(p as { _isCustom?: boolean })._isCustom);
    }
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      if (isCustom) {
        updateCustomModule(selectedId, { templateText: editText });
        setMessage({ type: "success", text: "保存成功" });
      } else {
        await updatePrompt(selectedId, editText);
        setMessage({ type: "success", text: "保存成功" });
      }
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedId) return;
    if (isCustom) return; // 自定义模块无默认值
    if (!confirm("确定要重置为默认提示词吗？当前修改将丢失。")) return;
    setSaving(true);
    setMessage(null);
    try {
      await resetPrompt(selectedId);
      await loadAll();
      setMessage({ type: "success", text: "已重置为默认值" });
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
        <div className="prompt-editor-sidebar-header">内置模块</div>
        {builtIn.map((p) => (
          <div
            key={p.moduleId}
            className={`prompt-editor-item ${selectedId === p.moduleId ? "active" : ""}`}
            onClick={() => handleSelect(p.moduleId)}
          >
            {p.moduleName}
          </div>
        ))}
        {allPrompts.filter((p) => (p as { _isCustom?: boolean })._isCustom).length > 0 && (
          <>
            <div className="prompt-editor-sidebar-header" style={{ marginTop: 12 }}>
              自定义模块
            </div>
            {allPrompts.filter((p) => (p as { _isCustom?: boolean })._isCustom).map((p) => (
              <div
                key={p.moduleId}
                className={`prompt-editor-item ${selectedId === p.moduleId ? "active" : ""}`}
                onClick={() => handleSelect(p.moduleId)}
              >
                ✦ {p.moduleName}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="prompt-editor-main">
        {selectedId && (
          <>
            <div className="prompt-editor-toolbar">
              <span className="prompt-editor-title">
                {isCustom && "✦ "}{allPrompts.find((p) => p.moduleId === selectedId)?.moduleName || ""}
              </span>
              <div className="prompt-editor-actions">
                {!isCustom && (
                  <button
                    className="btn-reset"
                    onClick={handleReset}
                    disabled={saving}
                  >
                    重置默认
                  </button>
                )}
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
