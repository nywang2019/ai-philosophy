import { useState } from "react";
import type { GenerateResult } from "../api/client";
import ResultRenderer from "./ResultRenderer";

type ViewMode = "preview" | "json" | "markdown";

interface Props {
  result: GenerateResult | null;
  error: string | null;
  loading: boolean;
}

const OutputPanel: React.FC<Props> = ({ result, error, loading }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

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
        <div className="output-placeholder">
          选择模块并输入参数后，点击"开始生成"
        </div>
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

  const renderMarkdown = () => (
    <div className="output-markdown">{toMarkdown(result.result)}</div>
  );

  return (
    <div className="output-panel">
      <div className="output-header">
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
