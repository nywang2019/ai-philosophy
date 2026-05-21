import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry } from "../services/historyStore";
import {
  getAllHistory,
  updateTitle,
  togglePin,
  deleteHistory,
} from "../services/historyStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  refreshKey: number; // 外部触发刷新
}

const HistoryPanel: React.FC<Props> = ({ visible, onClose, onSelect, refreshKey }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const load = useCallback(() => {
    setEntries(getAllHistory());
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load, refreshKey]);

  const handleRename = (id: string) => {
    if (editText.trim()) {
      updateTitle(id, editText.trim());
      setEditingId(null);
      load();
    }
  };

  const handlePin = (id: string) => {
    togglePin(id);
    load();
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除这条对话记录吗？")) return;
    deleteHistory(id);
    load();
  };

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    onClose();
  };

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.moduleName.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.timestamp - a.timestamp;
  });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday) {
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>对话历史</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="history-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话..."
          />
        </div>
        <div className="history-list">
          {sorted.length === 0 && (
            <div className="history-empty">
              {search ? "未找到匹配的对话" : "暂无对话历史"}
            </div>
          )}
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className={`history-item ${entry.pinned ? "pinned" : ""}`}
            >
              <div
                className="history-item-main"
                onClick={() => handleSelect(entry)}
              >
                {editingId === entry.id ? (
                  <input
                    className="history-edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleRename(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(entry.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="history-item-title">
                      {entry.pinned && <span className="history-pin-icon">&#128204;</span>}
                      {entry.title}
                    </div>
                    <div className="history-item-meta">
                      <span>{entry.moduleName}</span>
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="history-item-actions">
                <button
                  className="history-action-btn"
                  title="重命名"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(entry.id);
                    setEditText(entry.title);
                  }}
                >
                  &#9998;
                </button>
                <button
                  className={`history-action-btn ${entry.pinned ? "active" : ""}`}
                  title={entry.pinned ? "取消置顶" : "置顶"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePin(entry.id);
                  }}
                >
                  &#128204;
                </button>
                <button
                  className="history-action-btn danger"
                  title="删除"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                >
                  &#128465;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
