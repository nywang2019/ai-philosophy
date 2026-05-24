import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchPrompts,
  updatePrompt,
  resetPrompt,
  type PromptTemplateData,
} from "../api/client";
import {
  getAllCustomModules,
  updateCustomModule,
  resetCustomPrompt,
  saveAsDefaultPrompt,
} from "../services/customModuleStore";
import { saveVersion, getVersions, deleteVersion, updateVersionNote, type PromptVersion } from "../services/promptVersionStore";

const PromptEditor: React.FC = () => {
  const [builtIn, setBuiltIn] = useState<PromptTemplateData[]>([]);
  const [allPrompts, setAllPrompts] = useState<(PromptTemplateData & { _isCustom?: boolean })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const initializedRef = useRef(false);

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
      if (merged.length > 0 && !initializedRef.current) {
        const first = merged[0];
        setSelectedId(first.moduleId);
        setEditText(first.templateText);
        setIsCustom(!!(first as { _isCustom?: boolean })._isCustom);
        initializedRef.current = true;
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
    // 切换模块时刷新版本列表
    if (showVersions) setVersions(getVersions(id));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      if (isCustom) {
        updateCustomModule(selectedId, { templateText: editText });
      } else {
        await updatePrompt(selectedId, editText);
      }
      saveVersion(selectedId, editText);
      if (showVersions) setVersions(getVersions(selectedId));
      setMessage({ type: "success", text: "保存成功" });
      loadAll();
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
      if (isCustom) {
        resetCustomPrompt(selectedId);
        setMessage({ type: "success", text: "已重置为默认值" });
      } else {
        await resetPrompt(selectedId);
        setMessage({ type: "success", text: "已重置为默认值" });
      }
      loadAll();
      // 刷新编辑区
      const data = await fetchPrompts();
      const customs = getAllCustomModules().map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        templateText: m.templateText,
        _isCustom: true as const,
      }));
      const merged = [...data, ...customs];
      setAllPrompts(merged);
      const found = merged.find((p) => p.moduleId === selectedId);
      if (found) setEditText(found.templateText);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "重置失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDefault = () => {
    if (!selectedId || !isCustom) return;
    saveAsDefaultPrompt(selectedId);
    setMessage({ type: "success", text: "已设为默认提示词" });
    setTimeout(() => setMessage(null), 2000);
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
                {isCustom && (
                  <button
                    className="btn-reset"
                    onClick={handleSaveAsDefault}
                    style={{ borderColor: "#389e0d", color: "#389e0d" }}
                  >
                    设为默认
                  </button>
                )}
                <button
                  className="btn-reset"
                  onClick={handleReset}
                  disabled={saving}
                >
                  重置默认
                </button>
                <button
                  className="btn-reset"
                  onClick={() => {
                    if (selectedId) setVersions(getVersions(selectedId));
                    setShowVersions(!showVersions);
                  }}
                  style={{ borderColor: "#0891b2", color: "#0891b2" }}
                >
                  版本
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
            {showVersions && (
              <div className="prompt-versions">
                <div className="prompt-versions-header">
                  <span>版本历史（{versions.length}）</span>
                  <button className="btn-reset" onClick={() => setShowVersions(false)}>关闭</button>
                </div>
                {versions.length === 0 ? (
                  <div className="prompt-versions-empty">暂无历史版本</div>
                ) : (
                  versions.map((v, i) => (
                    <div key={v.versionId} className="prompt-version-item">
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }} onClick={async () => {
                          if (!selectedId) return;
                          setEditText(v.templateText);
                          setShowVersions(false);
                          setSaving(true);
                          if (isCustom) {
                            updateCustomModule(selectedId, { templateText: v.templateText });
                            // 刷新自定义模块数据
                            const customs = getAllCustomModules().map((m) => ({
                              moduleId: m.moduleId, moduleName: m.moduleName,
                              templateText: m.templateText, _isCustom: true as const,
                            }));
                            const data = await fetchPrompts();
                            setAllPrompts([...data, ...customs]);
                          } else {
                            await updatePrompt(selectedId, v.templateText);
                          }
                          setSaving(false);
                          setMessage({ type: "success", text: `已恢复版本 #${i + 1}` });
                          setTimeout(() => setMessage(null), 2000);
                        }}>
                        <span className="prompt-version-num">#{i + 1}</span>
                        <span className="prompt-version-time">{new Date(v.timestamp).toLocaleString("zh-CN")}</span>
                        {v.note ? (
                          <span className="prompt-version-note" title={v.note}>📝</span>
                        ) : (
                          <span className="prompt-version-note" title="添加备注" onClick={(e) => {
                            e.stopPropagation();
                            const note = prompt("添加备注：", v.note);
                            if (note !== null && selectedId) { updateVersionNote(selectedId, v.versionId, note); setVersions(getVersions(selectedId)); }
                          }} style={{ opacity: 0.3 }}>✏️</span>
                        )}
                      </div>
                      <button
                        className="btn-reset"
                        style={{ fontSize: 10, padding: "1px 4px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedId) return;
                          deleteVersion(selectedId, v.versionId);
                          setVersions(getVersions(selectedId));
                        }}
                      >×</button>
                    </div>
                  ))
                )}
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
