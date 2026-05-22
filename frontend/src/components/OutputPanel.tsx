import { useState, useMemo } from "react";
import type { GenerateResult } from "../api/client";
import { getAllHistory, type HistoryEntry } from "../services/historyStore";
import ResultRenderer from "./ResultRenderer";

// ===== SVG 思维导图 =====
const MC = ["#4a6cf7","#e82127","#389e0d","#c75a2c","#7c3aed","#0891b2","#d97706","#db2777"];

const KEY_CN: Record<string, string> = {
  keyword: "关键词", religion: "宗教", scripture: "经典出处", interpretation: "核心阐释",
  practice: "实践意义", comparison: "对比分析", summary: "总结", religions: "宗教分析",
  explicitEmotion: "显性情感", implicitEmotion: "隐性情感", rhetoricEmotion: "修辞情感",
  intensityCurve: "情感强度", overallAssessment: "整体评价", intensity: "强度",
  quality: "情感质地", position: "节点位置", original: "原文", literalTranslation: "逐字直译",
  modernTranslation: "现代白话", videoScript: "短视频口播", socialMedia: "社交媒体",
  campusMeme: "校园热梗", childVersion: "儿童版", dailyVersion: "日常生活版",
  academicVersion: "学术版", poeticVersion: "诗意隐喻版", idiom: "典故", eras: "时期",
  literalMeaning: "字面理解", socialContext: "社会语境", valueInterpretation: "价值观解读",
  modernDifference: "与现代差异", topic: "主题", participants: "参与者", dialogues: "对话",
  speaker: "发言者", content: "内容", type: "类型", originalEvent: "原始事件",
  changedVariable: "变量变化", originalHistory: "真实历史", branches: "分支", name: "名称",
  timeline: "时间线", year: "年份", event: "事件", poem: "诗歌", imagery: "意象",
  emotionCurve: "情绪曲线", emotionTags: "情绪标签", description: "描述",
  school: "学派", companyName: "公司名称", coreConcept: "核心理念", products: "产品",
  organization: "组织结构", managementStyle: "管理风格", swot: "SWOT分析",
  strengths: "优势", weaknesses: "劣势", opportunities: "机会", threats: "威胁",
  characters: "角色", line: "发言", tensionPoints: "张力点", text: "文本",
  conversions: "转换", era: "时代", vocabularyChanges: "词汇变化", toneChange: "语气变化",
  narrativeStance: "叙事立场", biasPoints: "偏见点", ignoredPerspectives: "被忽略视角",
  neutralRewrite: "中立改写", originalText: "分析文本", concept: "概念", work: "作品",
  topWords: "高频词", frequency: "频率", insight: "特征", featureAnalysis: "特征分析",
  word: "词语", count: "次数", percentage: "占比",
};

const tr = (k: string): string => KEY_CN[k] || k;
const shortL = (s: string, max = 16): string => s.length > max ? s.slice(0, max) + "…" : s;

interface TNode { label: string; children: TNode[]; color: string }

const buildTree = (obj: Record<string, unknown>, depth = 0): TNode[] => {
  const nodes: TNode[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const c = MC[depth % MC.length];
    const cnKey = tr(k);
    // 只做一层：子节点直接作为叶子显示值摘要
    if (Array.isArray(v)) {
      const summaries = (v as unknown[]).slice(0, 5).map((item) => {
        if (typeof item === "object" && item !== null) {
          const firstVal = Object.values(item as Record<string, unknown>)[0];
          return shortL(typeof firstVal === "string" ? firstVal : JSON.stringify(item).slice(0, 20), 14);
        }
        return shortL(String(item), 14);
      });
      nodes.push({ label: cnKey, children: summaries.map(s => ({ label: s, children: [], color: MC[(depth + 1) % MC.length] })), color: c });
    } else if (typeof v === "object" && v !== null) {
      // 对象的一层子节点作为该节点的叶子
      const children: TNode[] = Object.entries(v as Record<string, unknown>).slice(0, 8).map(([ck, cv]) => ({
        label: typeof cv === "string" ? `${tr(ck)}: ${shortL(cv, 14)}` : `${tr(ck)}`,
        children: [],
        color: MC[(depth + 1) % MC.length],
      }));
      nodes.push({ label: cnKey, children, color: c });
    } else {
      const val = typeof v === "string" ? shortL(v, 12) : String(v);
      nodes.push({ label: `${cnKey}: ${val}`, children: [], color: c });
    }
  }
  return nodes;
};

const MindMap: React.FC<{ data: Record<string, unknown>; title: string }> = ({ data, title }) => {
  const children = buildTree(data); // 一层子节点，每个子节点有自己的children（二层）
  const root: TNode = { label: shortL(title, 14), children, color: MC[0] };

  const nodeW = 140; const nodeH = 28;
  const startX = 24; const startY = 24;
  const colGap = 80;            // 列间距
  const l1X = startX + nodeW + colGap;   // 一级子节点列
  const l2X = l1X + nodeW + colGap;      // 二级子节点列
  const rowGap = nodeH + 14;             // 行间距

  interface Pos { node: TNode; x: number; y: number }
  const l1Nodes: Pos[] = [];  // 一级子节点
  const l2Nodes: Pos[] = [];  // 二级子节点（含其隶属的一级父节点引用）
  const edges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

  // 布局：逐行排列
  let curY = startY;
  for (const l1 of children) {
    const l1Pos: Pos = { node: l1, x: l1X, y: curY };
    l1Nodes.push(l1Pos);

    if (l1.children.length > 0) {
      let l2CurY = curY;
      for (const l2 of l1.children) {
        l2Nodes.push({ node: l2, x: l2X, y: l2CurY });
        edges.push({ x1: l1X + nodeW, y1: l1Pos.y + nodeH / 2, x2: l2X, y2: l2CurY + nodeH / 2, color: l2.color });
        l2CurY += rowGap;
      }
      // 一级节点垂直居中于其二级子节点
      const childrenHeight = (l1.children.length - 1) * rowGap;
      l1Pos.y = curY + childrenHeight / 2;
      curY += Math.max(l1.children.length * rowGap, rowGap);
    } else {
      curY += rowGap;
    }
    // 根→一级连线
    edges.push({ x1: startX + nodeW, y1: 0, x2: l1Pos.x, y2: l1Pos.y + nodeH / 2, color: l1.color });
  }

  // 根节点垂直居中于所有一级节点
  const rootY = l1Nodes.length > 0
    ? (l1Nodes[0].y + l1Nodes[l1Nodes.length - 1].y) / 2
    : startY;
  const rootPos = { x: startX, y: rootY };

  // 更新根→一级连线（之前y1用了0占位）
  edges.length = 0;
  for (const l1 of l1Nodes) {
    edges.push({ x1: rootPos.x + nodeW, y1: rootPos.y + nodeH / 2, x2: l1.x, y2: l1.y + nodeH / 2, color: l1.node.color });
  }
  // 一级→二级连线
  for (const l1 of l1Nodes) {
    const l2OfThis = l2Nodes.filter(l2 => l1.node.children.includes(l2.node));
    for (const l2 of l2OfThis) {
      edges.push({ x1: l1.x + nodeW, y1: l1.y + nodeH / 2, x2: l2.x, y2: l2.y + nodeH / 2, color: l2.node.color });
    }
  }

  const svgH = Math.max(200, startY * 2 + curY);
  const svgW = l2Nodes.length > 0 ? l2X + nodeW + 100 : l1X + nodeW + 100;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={Math.max(300, svgH / 2.5)} className="dash-chart-svg" style={{ background: "var(--code-bg)", borderRadius: 8 }}>
      {/* 连线 */}
      {edges.map((e, i) => (
        <path
          key={i}
          d={`M ${e.x1} ${e.y1} C ${e.x1 + 40} ${e.y1}, ${e.x2 - 40} ${e.y2}, ${e.x2} ${e.y2}`}
          fill="none"
          stroke={e.color}
          strokeWidth="1.5"
          opacity="0.4"
        />
      ))}

      {/* 根节点 */}
      <g>
        <rect x={rootPos.x} y={rootPos.y} width={nodeW} height={nodeH} rx="8" fill={root.color} opacity="0.9" />
        <text x={rootPos.x + nodeW / 2} y={rootPos.y + nodeH / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{root.label}</text>
      </g>

      {/* 一级子节点 */}
      {l1Nodes.map((ln, i) => {
        const hasKids = ln.node.children.length > 0;
        const w = Math.max(nodeW, ln.node.label.length * 9 + 24);
        return (
          <g key={`l1-${i}`}>
            <rect x={ln.x} y={ln.y} width={w} height={nodeH} rx="8" fill={ln.node.color} opacity={hasKids ? 0.85 : 0.4} />
            <text x={ln.x + w / 2} y={ln.y + nodeH / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="600" fill={hasKids ? "#fff" : "var(--text-secondary)"}>{ln.node.label}</text>
          </g>
        );
      })}

      {/* 二级子节点 */}
      {l2Nodes.map((ln, i) => {
        const w = Math.max(nodeW, ln.node.label.length * 9 + 24);
        return (
          <g key={`l2-${i}`}>
            <rect x={ln.x} y={ln.y} width={w} height={nodeH} rx="6" fill={ln.node.color} opacity="0.35" />
            <text x={ln.x + w / 2} y={ln.y + nodeH / 2 + 5} textAnchor="middle" fontSize="10" fontWeight="500" fill="var(--text-secondary)">{ln.node.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

type ViewMode = "preview" | "json" | "markdown" | "mindmap";

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

  const handleExportPNG = () => {
    if (!result) return;
    setShowExport(false);

    // 捕获预览区DOM并生成新窗口
    const previewEl = document.querySelector(".output-content") as HTMLElement;
    const titleEl = document.querySelector(".output-title") as HTMLElement;
    const modName = titleEl?.textContent || result.moduleName;
    const contentHTML = previewEl?.innerHTML || "";

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${modName}</title>
<style>body{font-family:system-ui,sans-serif;max-width:780px;margin:0 auto;padding:32px 24px;color:#1d1d1f;line-height:1.8}h1{font-size:22px;border-bottom:2px solid #4a6cf7;padding-bottom:8px}svg{max-width:100%;height:auto}.rr-chat-msg{padding:10px 0;border-bottom:1px solid #eee;display:flex;gap:10px}.rr-chat-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px}.rr-chat-speaker{font-weight:600;font-size:13px}.rr-version-card{border:1px solid #e8e8e8;border-radius:10px;padding:14px;margin:8px 0}.rr-original{background:#f7f7f7;border-radius:8px;padding:14px 18px;margin:12px 0;border-left:4px solid #4a6cf7}.rr-section-title{font-size:12px;font-weight:700;color:#888;text-transform:uppercase;margin:16px 0 8px}.rr-chip{display:inline-block;padding:3px 10px;background:#eef2ff;color:#4a6cf7;border-radius:12px;font-size:11px;margin:2px}.rr-emotion-bar{height:8px;border-radius:4px;min-width:4px}.rr-swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rr-swot-cell{border-radius:8px;padding:12px}.rr-conversion-card{border:1px solid #e8e8e8;border-radius:10px;padding:14px;margin:8px 0}.rr-conversion-era{display:inline-block;padding:2px 10px;background:#4a6cf7;color:#fff;border-radius:10px;font-size:11px}.rr-generic-card{border:1px solid #e8e8e8;border-top:3px solid #4a6cf7;border-radius:10px;padding:14px;margin:8px 0}@media print{body{max-width:100%}}</style></head>
<body><h1>${modName}</h1>${contentHTML}<hr style="margin:28px 0 12px;border:none;border-top:1px solid #eee"><p style="font-size:11px;color:#999;text-align:center">由文史哲AI生成系统导出 · 可用浏览器截图或打印保存</p></body></html>`);
    win.document.close();
  };

  const handleExportHTML = () => {
    if (!result) return;
    const md = jsonToMarkdown(result.result);
    const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${result.moduleName}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8;color:#222}h1{font-size:24px;border-bottom:2px solid #4a6cf7;padding-bottom:8px}h2{font-size:18px;margin-top:24px}h3{font-size:15px}ul{padding-left:20px}li{margin:6px 0}strong{color:#4a6cf7}</style></head><body><h1>${result.moduleName}</h1>${md.replace(/\n/g, "<br>")}</body></html>`;
    downloadFile(html, `${result.moduleName}.html`, "text/html");
    setShowExport(false);
  };

  const handleCopyLink = () => {
    if (!result) return;
    try {
      const payload = JSON.stringify({ m: result.moduleName, d: result.result });
      const hash = btoa(unescape(encodeURIComponent(payload)));
      const url = `${window.location.origin}${window.location.pathname}#share=${hash}`;
      navigator.clipboard.writeText(url).then(() => {
        setShareMsg("链接已复制，可分享给他人查看");
        setShowExport(false);
        setTimeout(() => setShareMsg(null), 2500);
      }).catch(() => {
        setShareMsg("复制失败，请手动复制地址栏");
      });
    } catch {
      setShareMsg("生成链接失败");
      setTimeout(() => setShareMsg(null), 2000);
    }
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
          <button
            className={viewMode === "mindmap" ? "active" : ""}
            onClick={() => setViewMode("mindmap")}
          >
            导图
          </button>
        </div>
        <div className="export-wrap">
          <button className="btn-share" onClick={() => setShowExport(!showExport)}>
            导出
          </button>
          {showExport && (
            <div className="export-dropdown">
              <div className="export-option" onClick={handleCopyLink}>🔗 复制链接</div>
              <div className="export-option" onClick={handleExportMD}>📝 Markdown</div>
              <div className="export-option" onClick={handleExportHTML}>🌐 HTML</div>
              <div className="export-option" onClick={handleExportPNG}>🖼️ 图片</div>
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
        {viewMode === "mindmap" && <MindMap data={result.result} title={result.moduleName} />}
      </div>
    </div>
  );
};

export default OutputPanel;
