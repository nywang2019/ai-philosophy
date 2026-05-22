import { useState, useMemo } from "react";
import type { GenerateResult } from "../api/client";
import { getAllHistory, type HistoryEntry } from "../services/historyStore";
import ResultRenderer from "./ResultRenderer";

type ViewMode = "preview" | "json" | "markdown";

interface Props {
  result: GenerateResult | null;
  error: string | null;
  loading: boolean;
  onHistorySelect?: (entry: HistoryEntry) => void;
  onBackToHome?: () => void;
  onOpenHistory?: () => void;
}

const WelcomeSidebar: React.FC<{ onSelect?: (entry: HistoryEntry) => void }> = ({ onSelect }) => {
  const recent = useMemo(() => getAllHistory().slice(0, 6), []);

  if (recent.length === 0) {
    return (
      <div className="welcome-sidebar">
        <div className="welcome-sidebar-title">欢迎使用</div>
        <p className="welcome-sidebar-desc">
          选择一个模块，输入内容，点击生成。你的每一次思想实验都会记录在案，并在仪表盘中呈现。
        </p>
      </div>
    );
  }

  return (
    <div className="welcome-sidebar">
      <div className="welcome-sidebar-title">最近动态</div>
      <div className="welcome-activity">
        {recent.map((s: HistoryEntry) => (
          <div
            key={s.id}
            className="welcome-activity-item welcome-activity-clickable"
            onClick={() => onSelect?.(s)}
          >
            <div className="welcome-activity-title">
              {s.pinned && "📌 "}{s.title}
            </div>
            <div className="welcome-activity-meta">
              {s.moduleName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OutputPanel: React.FC<Props> = ({ result, error, loading, onHistorySelect, onBackToHome, onOpenHistory }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const jsonToMarkdown = (obj: Record<string, unknown>, depth = 0): string => {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const h = "#".repeat(Math.min(depth + 1, 4));
      if (Array.isArray(value)) {
        lines.push(`${h} ${key}`, "");
        value.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            lines.push(jsonToMarkdown(item as Record<string, unknown>, depth + 1));
          } else {
            lines.push(`- ${String(item)}`);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        lines.push(`${h} ${key}`, "");
        lines.push(jsonToMarkdown(value as Record<string, unknown>, depth + 1));
      } else {
        lines.push(`**${key}**：${String(value)}`, "");
      }
    }
    return lines.join("\n");
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleExportMD = () => {
    if (!result) return;
    const md = `# ${result.moduleName}\n\n${jsonToMarkdown(result.result)}`;
    downloadFile(md, `${result.moduleName}.md`, "text/markdown");
    setShowExport(false);
  };

  const handleExportHTML = () => {
    if (!result) return;
    const md = jsonToMarkdown(result.result);
    const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${result.moduleName}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8;color:#222}h1{font-size:24px;border-bottom:2px solid #4a6cf7;padding-bottom:8px}h2{font-size:18px;margin-top:24px}h3{font-size:15px}ul{padding-left:20px}li{margin:6px 0}strong{color:#4a6cf7}</style></head><body><h1>${result.moduleName}</h1>${md.replace(/\n/g, "<br>")}</body></html>`;
    downloadFile(html, `${result.moduleName}.html`, "text/html");
    setShowExport(false);
  };

  const handleShare = async () => {
    if (!result) return;
    const text = JSON.stringify(result.result, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg("已复制到剪贴板");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setShareMsg("已复制到剪贴板");
    }
    setTimeout(() => setShareMsg(null), 2000);
  };

  if (loading) {
    return (
      <div className="output-panel">
        <div className="output-placeholder">
          <div className="loading-spinner" />
          <p>AI正在生成中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="output-panel">
        <div className="output-error">
          <div className="error-title">生成失败</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output-panel">
        <WelcomeSidebar onSelect={onHistorySelect} />
      </div>
    );
  }

  const renderJSON = () => (
    <pre className="output-json">
      {JSON.stringify(result.result, null, 2)}
    </pre>
  );

  const toMarkdown = (obj: Record<string, unknown>, depth = 0): string => {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const prefix = "#".repeat(Math.min(depth + 1, 4));
      if (Array.isArray(value)) {
        lines.push(`${prefix} ${key}`);
        value.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            const subLines = toMarkdown(item as Record<string, unknown>, depth + 1);
            lines.push(subLines);
          } else {
            lines.push(`- ${String(item)}`);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        lines.push(`${prefix} ${key}`);
        const subLines = toMarkdown(value as Record<string, unknown>, depth + 1);
        lines.push(subLines);
      } else {
        lines.push(`${prefix} ${key}`);
        lines.push("");
        lines.push(String(value));
        lines.push("");
      }
    }
    return lines.join("\n");
  };

  const renderMarkdown = () => {
    const mdToHtml = (md: string): string => {
      const lines = md.split("\n");
      let html = "";
      let inList = false;
      for (const line of lines) {
        // 标题
        const hMatch = line.match(/^(#{1,4})\s+(.+)/);
        if (hMatch) {
          if (inList) { html += "</ul>"; inList = false; }
          const level = hMatch[1].length;
          html += `<h${level} class="md-h">${escapeHtml(hMatch[2])}</h${level}>`;
          continue;
        }
        // 列表
        const liMatch = line.match(/^-\s+(.+)/);
        if (liMatch) {
          if (!inList) { html += "<ul class='md-ul'>"; inList = true; }
          html += `<li class="md-li">${processInline(liMatch[1])}</li>`;
          continue;
        }
        // 空行
        if (line.trim() === "") {
          if (inList) { html += "</ul>"; inList = false; }
          continue;
        }
        // 普通段落
        if (inList) { html += "</ul>"; inList = false; }
        html += `<p class="md-p">${processInline(line)}</p>`;
      }
      if (inList) html += "</ul>";
      return html;
    };

    const processInline = (text: string): string => {
      return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong class='md-strong'>$1</strong>")
        .replace(/`(.+?)`/g, "<code class='md-code'>$1</code>");
    };

    const escapeHtml = (s: string): string =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return (
      <div
        className="output-markdown output-markdown-rendered"
        dangerouslySetInnerHTML={{ __html: mdToHtml(toMarkdown(result.result)) }}
      />
    );
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        {onBackToHome && (
          <button className="btn-back-home" onClick={onBackToHome} title="返回主页">
            &#8962;
          </button>
        )}
        {onOpenHistory && (
          <button className="btn-back-home btn-back-history" onClick={onOpenHistory} title="对话历史">
            &#9776;
          </button>
        )}
        <span className="output-title">{result.moduleName}</span>
        <span className="output-duration">耗时: {result.duration}ms</span>
        <div className="output-toggle">
          <button
            className={viewMode === "preview" ? "active" : ""}
            onClick={() => setViewMode("preview")}
          >
            预览
          </button>
          <button
            className={viewMode === "json" ? "active" : ""}
            onClick={() => setViewMode("json")}
          >
            JSON
          </button>
          <button
            className={viewMode === "markdown" ? "active" : ""}
            onClick={() => setViewMode("markdown")}
          >
            MD
          </button>
        </div>
        <div className="export-wrap">
          <button className="btn-share" onClick={() => setShowExport(!showExport)}>
            导出
          </button>
          {showExport && (
            <div className="export-dropdown">
              <div className="export-option" onClick={handleExportMD}>📝 Markdown</div>
              <div className="export-option" onClick={handleExportHTML}>🌐 HTML</div>
            </div>
          )}
        </div>
        <button className="btn-share" onClick={handleShare}>
          分享
        </button>
        {shareMsg && <span className="share-msg">{shareMsg}</span>}
      </div>
      <div className="output-content">
        {viewMode === "preview" && <ResultRenderer result={result} />}
        {viewMode === "json" && renderJSON()}
        {viewMode === "markdown" && renderMarkdown()}
      </div>
    </div>
  );
};

export default OutputPanel;
