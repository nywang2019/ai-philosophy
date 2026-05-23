import { useState, useEffect, useCallback } from "react";
import {
  getAllProjects,
  createProject,
  deleteProject,
  getActiveProjectId,
  setActiveProject,
  clearActiveProject,
  type ResearchProject,
} from "../services/projectStore";
import { getAllHistory, setSessionProject, getSessionsByProject, type HistoryEntry } from "../services/historyStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onProjectChange: () => void;
}

const ProjectPanel: React.FC<Props> = ({ visible, onClose, onProjectChange }) => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<ResearchProject> | null>(null);
  const [viewSessions, setViewSessions] = useState<ResearchProject | null>(null);
  const [sessions, setSessions] = useState<HistoryEntry[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setProjects(getAllProjects());
    setActiveId(getActiveProjectId());
  }, []);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 2000); };

  const handleCreate = () => {
    if (!editing?.name?.trim()) return;
    createProject(editing.name.trim(), editing.description || "");
    setEditing(null);
    load();
    showMsg("项目已创建");
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    load();
    onProjectChange();
    showMsg("项目已删除");
  };

  const handleSetActive = (id: string | null) => {
    if (id) setActiveProject(id); else clearActiveProject();
    setActiveId(id);
    onProjectChange();
  };

  const handleViewSessions = (proj: ResearchProject) => {
    setViewSessions(proj);
    setSessions(getSessionsByProject(proj.id));
  };

  const handleAssignToProject = (sessionId: string, projId: string | null) => {
    setSessionProject(sessionId, projId);
    if (viewSessions) setSessions(getSessionsByProject(viewSessions.id));
    showMsg(projId ? "已关联" : "已取消关联");
  };

  if (!visible) return null;

  // 查看项目会话
  if (viewSessions) {
    const unrelated = getAllHistory().filter(e => !e.projectId || e.projectId !== viewSessions.id).slice(0, 30);
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal history-panel" onClick={e => e.stopPropagation()}>
          <div className="history-header">
            <h2>{viewSessions.icon} {viewSessions.name}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--light-border)", display: "flex", gap: 8 }}>
            <button className="btn-save-prompt" onClick={() => setViewSessions(null)}>返回项目列表</button>
            <button className="btn-save-prompt" style={{ background: "linear-gradient(135deg, #389e0d, #4caf50)" }} onClick={() => {
              const md = generateProjectDoc(viewSessions, sessions);
              const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${viewSessions.name}-研究文档.md`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }}>📄 导出文档</button>
          </div>
          <div style={{ padding: "8px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
            已关联 {sessions.length} 条会话
          </div>
          <div className="history-list" style={{ maxHeight: 300, overflow: "auto" }}>
            {sessions.map(s => (
              <div key={s.id} className="history-item" style={{ padding: "6px 16px", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                <button className="btn-reset" onClick={() => handleAssignToProject(s.id, null)}>移除</button>
              </div>
            ))}
          </div>
          {unrelated.length > 0 && (
            <>
              <div style={{ padding: "8px 16px", fontSize: 13, color: "var(--muted)" }}>可关联的会话</div>
              <div className="history-list" style={{ maxHeight: 200, overflow: "auto" }}>
                {unrelated.map(s => (
                  <div key={s.id} className="history-item" style={{ padding: "6px 16px", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                    <button className="btn-save-prompt" onClick={() => handleAssignToProject(s.id, viewSessions.id)}>关联</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2>研究项目</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        {msg && <div className="prompt-editor-msg success" style={{ margin: "8px 16px 0" }}>{msg}</div>}

        {/* 新建 */}
        {editing && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--light-border)" }}>
            <div className="input-field">
              <label>项目名称</label>
              <input type="text" value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：道家思想研究" autoFocus />
            </div>
            <div className="input-field">
              <label>描述</label>
              <input type="text" value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="一句话描述研究目标" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-save" onClick={handleCreate}>创建</button>
              <button className="btn-cancel" onClick={() => setEditing(null)}>取消</button>
            </div>
          </div>
        )}

        <div style={{ padding: "12px 16px", borderBottom: editing ? "none" : "1px solid var(--light-border)" }}>
          <button className="btn-save-prompt" onClick={() => setEditing({ name: "", description: "" })}>+ 新建项目</button>
          {activeId && (
            <button className="btn-reset" style={{ marginLeft: 8 }} onClick={() => handleSetActive(null)}>取消活跃</button>
          )}
        </div>

        <div className="history-list">
          {projects.length === 0 && <div className="history-empty">暂无研究项目</div>}
          {projects.map(p => (
            <div key={p.id} className="history-item" style={{ display: "flex", flexDirection: "column", padding: "10px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {p.icon} {p.name}
                    {activeId === p.id && <span style={{ fontSize: 10, background: "var(--primary)", color: "#fff", padding: "1px 6px", borderRadius: 8, marginLeft: 6 }}>活跃</span>}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 6 }}>
                      ({getSessionsByProject(p.id).length} 条会话)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{p.description}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-save-prompt" onClick={() => handleViewSessions(p)}>会话</button>
                  {activeId !== p.id ? (
                    <button className="btn-save-prompt" onClick={() => handleSetActive(p.id)}>活跃</button>
                  ) : null}
                  <button className="btn-reset" onClick={() => handleDelete(p.id)}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function generateProjectDoc(project: ResearchProject, sessions: HistoryEntry[]): string {
  const lines: string[] = [];
  lines.push(`# ${project.icon} ${project.name}`);
  lines.push("");
  lines.push(`> ${project.description || "研究项目"}`);
  lines.push("");
  lines.push(`**导出时间**：${new Date().toLocaleString("zh-CN")}`);
  lines.push(`**会话数量**：${sessions.length} 条`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 目录");
  lines.push("");

  // 按模块分组
  const groups = new Map<string, HistoryEntry[]>();
  for (const s of sessions) {
    const name = s.moduleName;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(s);
  }

  let idx = 1;
  for (const [modName, modSessions] of groups) {
    lines.push(`### ${modName}（${modSessions.length}条）`);
    for (const s of modSessions) {
      lines.push(`${idx}. [${s.title}](#session-${s.id})`);
      idx++;
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // 逐条输出
  for (const [modName, modSessions] of groups) {
    lines.push(`## ${modName}`);
    lines.push("");
    for (const s of modSessions) {
      lines.push(`### <a id="session-${s.id}"></a> ${s.title}`);
      lines.push("");
      lines.push(`- **时间**：${new Date(s.timestamp).toLocaleString("zh-CN")}`);
      lines.push(`- **模块**：${s.moduleName}`);
      if (s.tags && s.tags.length > 0) lines.push(`- **标签**：${s.tags.join("、")}`);
      if (s.note) lines.push(`- **笔记**：${s.note}`);
      lines.push("");
      const resultStr = JSON.stringify(s.result, null, 2);
      lines.push("```json");
      lines.push(resultStr.length > 2000 ? resultStr.slice(0, 2000) + "\n// ...(truncated)" : resultStr);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

export default ProjectPanel;
