import { useState, useEffect } from "react";
import type { CustomModule } from "../services/customModuleStore";
import {
  getAllCustomModules,
  addCustomModule,
  updateCustomModule,
  deleteCustomModule,
} from "../services/customModuleStore";
import type { ModuleField } from "../modules/moduleConfig";

const FIELD_TYPES: { value: ModuleField["type"]; label: string }[] = [
  { value: "text", label: "文本" },
  { value: "textarea", label: "多行文本" },
  { value: "tag-input", label: "标签输入" },
  { value: "image", label: "图片上传" },
];

const emptyField: ModuleField = { key: "", label: "", type: "text", placeholder: "" };

const CustomModulePanel: React.FC = () => {
  const [modules, setModules] = useState<CustomModule[]>([]);
  const [editing, setEditing] = useState<Partial<CustomModule> | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { setModules(getAllCustomModules()); }, []);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 2000);
  };

  const startNew = () => {
    setEditing({
      moduleId: "custom_" + Date.now().toString(36),
      moduleName: "",
      description: "",
      fields: [{ ...emptyField }],
      templateText: "",
    });
  };

  const startEdit = (mod: CustomModule) => {
    setEditing({ ...mod, fields: mod.fields.map((f) => ({ ...f })) });
  };

  const handleSave = () => {
    if (!editing || !editing.moduleName?.trim() || !editing.templateText?.trim()) {
      showMsg("error", "模块名称和提示词不能为空");
      return;
    }
    const exists = modules.find((m) => m.moduleId === editing.moduleId);
    if (exists) {
      updateCustomModule(editing.moduleId!, {
        moduleName: editing.moduleName!.trim(),
        icon: (editing as Record<string, unknown>).icon as string || "📦",
        description: editing.description || "",
        fields: editing.fields || [],
        templateText: editing.templateText!,
      });
      showMsg("success", "已更新");
    } else {
      addCustomModule({
        moduleId: editing.moduleId!,
        moduleName: editing.moduleName!.trim(),
        icon: (editing as Record<string, unknown>).icon as string || "📦",
        description: editing.description || "",
        fields: editing.fields || [],
        templateText: editing.templateText!,
      });
      showMsg("success", "已创建");
    }
    setEditing(null);
    setModules(getAllCustomModules());
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除此自定义模块？")) return;
    deleteCustomModule(id);
    setModules(getAllCustomModules());
    showMsg("success", "已删除");
  };

  return (
    <div className="settings-panel">
      {msg && <div className={`prompt-editor-msg ${msg.type}`}>{msg.text}</div>}

      <div style={{ marginBottom: 16 }}>
        <button className="btn-save-prompt" onClick={startNew}>
          + 新建模块
        </button>
      </div>

      {editing && (
        <div className="custom-module-form">
          <div className="input-field">
            <label>模块ID（不可修改）</label>
            <input type="text" value={editing.moduleId || ""} disabled />
          </div>
          <div className="input-field">
            <label>模块名称 *</label>
            <input
              type="text"
              value={editing.moduleName || ""}
              onChange={(e) => setEditing({ ...editing, moduleName: e.target.value })}
              placeholder="如：古文情感分析器"
            />
          </div>
          <div className="input-field">
            <label>图标</label>
            <div className="icon-picker">
              {["📦","🏛️","💬","🔄","📖","🎭","🚀","🔮","💡","🔍","📝","🧠","⚡","🌟","🔥","❤️","🎯","💎","🛡️","🎪"].map((icon) => (
                <span
                  key={icon}
                  className={`icon-pick ${((editing as Record<string, unknown>).icon as string || "📦") === icon ? "active" : ""}`}
                  onClick={() => setEditing({ ...editing, icon } as typeof editing)}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div className="input-field">
            <label>描述</label>
            <input
              type="text"
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="一句话描述模块功能"
            />
          </div>

          <div className="input-field">
            <label>输入字段</label>
            {(editing.fields || []).map((f, i) => (
              <div key={i} className="custom-field-row">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) => {
                    const fields = [...(editing.fields || [])];
                    fields[i] = { ...fields[i], key: e.target.value };
                    setEditing({ ...editing, fields });
                  }}
                  placeholder="字段key"
                  style={{ width: 100 }}
                />
                <input
                  type="text"
                  value={f.label}
                  onChange={(e) => {
                    const fields = [...(editing.fields || [])];
                    fields[i] = { ...fields[i], label: e.target.value };
                    setEditing({ ...editing, fields });
                  }}
                  placeholder="字段标签"
                  style={{ width: 100 }}
                />
                <select
                  value={f.type}
                  onChange={(e) => {
                    const fields = [...(editing.fields || [])];
                    fields[i] = { ...fields[i], type: e.target.value as ModuleField["type"] };
                    setEditing({ ...editing, fields });
                  }}
                  style={{ width: 100 }}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <button
                  className="btn-reset"
                  onClick={() => {
                    const fields = (editing.fields || []).filter((_, j) => j !== i);
                    setEditing({ ...editing, fields });
                  }}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              className="btn-save-prompt"
              style={{ marginTop: 8 }}
              onClick={() => {
                setEditing({
                  ...editing,
                  fields: [...(editing.fields || []), { ...emptyField }],
                });
              }}
            >
              + 添加字段
            </button>
          </div>

          <div className="input-field">
            <label>提示词模板 *</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                className="btn-settings"
                style={{ fontSize: 11 }}
                onClick={() => setEditing({ ...editing, templateText: '你是一位专业助手。\n\n任务：根据用户输入的概念生成通俗易懂的解释。\n\n用户输入的概念：{concept}\n\n请按以下JSON格式输出：\n{\n  "simple": "用大白话解释（一句话）",\n  "example": "举一个生活中的例子",\n  "insight": "你的独到见解"\n}\n\n提示：上面 {concept} 对应上方"输入字段"中 key 设为 concept 的字段（字段标签可填"输入概念"，type 选"文本"）。key 是占位符名称，标签是用户看到的输入提示。' })}
              >
                📝 纯文本模板
              </button>
              <button
                type="button"
                className="btn-settings"
                style={{ fontSize: 11 }}
                onClick={() => setEditing({ ...editing, templateText: '你是一位多模态分析专家。\n\n任务：根据用户上传的图片和补充说明，生成综合分析。\n\n用户上传的图片：{image}\n补充说明：{description}\n\n请按以下JSON格式输出：\n{\n  "overview": "图片内容概述",\n  "details": "细节分析",\n  "conclusion": "结合补充说明的综合结论"\n}\n\n提示：{image} 对应上方 key 为 image、type 为"图片上传"的字段（标签可填"上传图片"）；{description} 对应 key 为 description 的文本字段（标签可填"补充说明"）。key 是占位符名，标签是用户看到的提示文字。' })}
              >
                🖼️ 多模态模板
              </button>
            </div>
            <textarea
              value={editing.templateText || ""}
              onChange={(e) => setEditing({ ...editing, templateText: e.target.value })}
              rows={10}
              placeholder={`你是一位...\n\n输入：{fieldKey}\n\n请按JSON格式输出...`}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span className="input-hint">
              使用 {"{key}"} 作为占位符，与输入字段的 key 对应。可先选择模板再修改。
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn-save" onClick={handleSave}>保存</button>
            <button className="btn-cancel" onClick={() => setEditing(null)}>取消</button>
          </div>
        </div>
      )}

      {/* 已有模块列表 */}
      {!editing && modules.length > 0 && (
        <div>
          <div className="rr-section-title" style={{ marginTop: 20 }}>
            已有自定义模块
          </div>
          {modules.map((mod) => (
            <div key={mod.moduleId} className="custom-module-item">
              <div>
                <strong>{mod.moduleName}</strong>
                <span className="input-hint">{mod.description}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-save-prompt" onClick={() => startEdit(mod)}>
                  编辑
                </button>
                <button className="btn-reset" onClick={() => handleDelete(mod.moduleId)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && modules.length === 0 && (
        <div className="dash-empty" style={{ marginTop: 20 }}>
          暂无自定义模块，点击上方按钮创建
        </div>
      )}
    </div>
  );
};

export default CustomModulePanel;
