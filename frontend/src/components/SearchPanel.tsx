import { useState, useEffect } from "react";
import { searchAll, type SearchResult } from "../services/searchHistory";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (entry: SearchResult["entry"]) => void;
}

const SearchPanel: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!visible) return;
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(() => setResults(searchAll(query)), 200);
    return () => clearTimeout(timer);
  }, [query, visible]);

  if (!visible) return null;

  const fieldLabel: Record<string, string> = { title: "标题", input: "输入", result: "输出", note: "笔记" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2>全文搜索</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="history-search">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索所有对话内容（输入、输出、笔记）..."
            autoFocus
          />
        </div>
        <div className="history-list">
          {query.trim().length < 2 && (
            <div className="history-empty">输入至少 2 个字符开始搜索</div>
          )}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="history-empty">未找到匹配结果</div>
          )}
          {results.map(r => (
            <div
              key={r.entry.id}
              className="search-result-item"
              onClick={() => { onSelect(r.entry); onClose(); }}
            >
              <div className="search-result-header">
                <span className="search-result-title">
                  {r.entry.pinned && "📌 "}{r.entry.favorite && "⭐ "}{r.entry.title}
                </span>
                <span className="search-result-meta">
                  {r.entry.moduleName} · {fieldLabel[r.matchField]}
                </span>
              </div>
              <div className="search-result-snippet">{r.snippet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
