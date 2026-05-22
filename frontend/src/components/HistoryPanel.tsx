import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry } from "../services/historyStore";
import {
  getAllHistory,
  updateTitle,
  togglePin,
  toggleFavorite,
  deleteHistory,
  deleteHistories,
  deleteAllHistory,
  updateTags,
  getAllTags,
} from "../services/historyStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onRegenerate: (entry: HistoryEntry) => void;
  refreshKey: number;
}

const HistoryPanel: React.FC<Props> = ({ visible, onClose, onSelect, onRegenerate, refreshKey }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterFav, setFilterFav] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setEntries(getAllHistory());
    setAllTags(getAllTags());
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
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((e) => e.id)));
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`确定删除选中的 ${count} 条对话吗？此操作不可恢复。`)) return;
    deleteHistories([...selectedIds]);
    setSelectedIds(new Set());
    load();
  };

  const handleDeleteAll = () => {
    if (!confirm("确定删除全部历史对话吗？此操作不可恢复！")) return;
    deleteAllHistory();
    setSelectedIds(new Set());
    load();
  };

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    onClose();
  };

  const handleToggleTag = (entry: HistoryEntry, tag: string) => {
    const tags = entry.tags || [];
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    updateTags(entry.id, newTags);
    load();
  };

  const handleAddCustomTag = (entry: HistoryEntry) => {
    const name = prompt("输入新标签名称：");
    if (name && name.trim()) {
      const newTags = [...(entry.tags || []), name.trim()];
      updateTags(entry.id, newTags);
      load();
    }
    setTagMenuId(null);
  };

  const filtered = entries.filter((e) => {
    if (filterFav && !e.favorite) return false;
    if (filterTag && !(e.tags || []).includes(filterTag)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.moduleName.toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
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
    if (isToday) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>对话历史</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="history-search">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索对话或标签..." />
          <button
            className={`history-filter-fav ${filterFav ? "active" : ""}`}
            onClick={() => setFilterFav(!filterFav)}
            title="只看收藏"
          >
            ⭐
          </button>
        </div>
        {/* 批量操作栏 */}
        {sorted.length > 0 && (
          <div className="history-batch-bar">
            <label className="compare-toggle" style={{ margin: 0 }}>
              <input type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} />
              <span>全选</span>
            </label>
            {selectedIds.size > 0 && (
              <button className="history-batch-btn" onClick={handleDeleteSelected}>
                删除所选（{selectedIds.size}）
              </button>
            )}
            <button className="history-batch-btn danger" onClick={handleDeleteAll}>
              全部删除
            </button>
          </div>
        )}
        {/* 标签筛选栏 */}
        {allTags.length > 0 && (
          <div className="history-tag-filter">
            <span
              className={`history-filter-tag ${filterTag === null ? "active" : ""}`}
              onClick={() => setFilterTag(null)}
            >
              全部
            </span>
            {allTags.map((tag) => (
              <span
                key={tag}
                className={`history-filter-tag ${filterTag === tag ? "active" : ""}`}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="history-list">
          {sorted.length === 0 && (
            <div className="history-empty">
              {search || filterTag ? "未找到匹配的对话" : "暂无对话历史"}
            </div>
          )}
          {sorted.map((entry) => (
            <div key={entry.id} className={`history-item ${entry.pinned ? "pinned" : ""}`}>
              <div className="history-item-check">
                <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelect(entry.id)} onClick={(e) => e.stopPropagation()} />
              </div>
              <div className="history-item-main" onClick={() => handleSelect(entry)}>
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
                      <span
                        className={`history-star-icon ${entry.favorite ? "fav-active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(entry.id); load(); }}
                        title={entry.favorite ? "取消收藏" : "收藏"}
                      >{entry.favorite ? "⭐" : "☆"}</span>
                      {entry.pinned && <span className="history-pin-icon">&#128204;</span>}
                      {entry.title}
                    </div>
                    <div className="history-item-meta">
                      <span>{entry.moduleName}</span>
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                    {(entry.tags || []).length > 0 && (
                      <div className="history-item-tags">
                        {entry.tags!.map((t) => (
                          <span key={t} className="history-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="history-item-actions">
                {/* 标签菜单 */}
                <div className="history-tag-menu-wrap">
                  <button
                    className="history-action-btn"
                    title="标签"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagMenuId(tagMenuId === entry.id ? null : entry.id);
                    }}
                  >
                    &#127991;
                  </button>
                  {tagMenuId === entry.id && (
                    <div className="history-tag-dropdown">
                      {allTags.map((tag) => (
                        <div
                          key={tag}
                          className={`history-tag-option ${(entry.tags || []).includes(tag) ? "checked" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTag(entry, tag);
                          }}
                        >
                          {tag}
                        </div>
                      ))}
                      <div className="history-tag-option" onClick={() => handleAddCustomTag(entry)}>
                        + 新建标签
                      </div>
                    </div>
                  )}
                </div>
                <button className="history-action-btn history-regenerate-btn" title="重新生成" onClick={(e) => { e.stopPropagation(); onRegenerate(entry); onClose(); }}>&#8635;</button>
                <button className="history-action-btn" title="重命名" onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); setEditText(entry.title); }}>&#9998;</button>
                <button className={`history-action-btn ${entry.pinned ? "active" : ""}`} title={entry.pinned ? "取消置顶" : "置顶"} onClick={(e) => { e.stopPropagation(); handlePin(entry.id); }}>&#128204;</button>
                <button className="history-action-btn danger" title="删除" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>&#128465;</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
