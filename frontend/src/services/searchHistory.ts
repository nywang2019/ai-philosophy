// 全文搜索服务
import { getAllHistory, type HistoryEntry } from "./historyStore";

export interface SearchResult {
  entry: HistoryEntry;
  matchField: "title" | "input" | "result" | "note";
  snippet: string;
  highlightedSnippet: string;
  score: number;
}

export function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const terms = query.trim().toLowerCase().split(/\s+/);
  const all = getAllHistory();
  const results: SearchResult[] = [];

  for (const entry of all) {
    const fields: { field: SearchResult["matchField"]; text: string; weight: number }[] = [
      { field: "title", text: entry.title, weight: 4 },
      { field: "note", text: entry.note || "", weight: 3 },
      { field: "input", text: JSON.stringify(entry.inputs), weight: 2 },
      { field: "result", text: JSON.stringify(entry.result), weight: 1 },
    ];

    for (const { field, text, weight } of fields) {
      if (!text) continue;
      const lower = text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        let pos = 0;
        while ((pos = lower.indexOf(term, pos)) !== -1) {
          score++;
          pos += term.length;
        }
      }
      if (score > 0) {
        // 提取上下文摘要
        const firstMatch = lower.indexOf(terms[0]);
        const start = Math.max(0, firstMatch - 30);
        const end = Math.min(lower.length, firstMatch + terms[0].length + 40);
        const rawSnippet = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
        // 生成高亮版摘要
        let highlighted = rawSnippet.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for (const term of terms) {
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          highlighted = highlighted.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
        }

        results.push({
          entry,
          matchField: field,
          snippet: rawSnippet,
          highlightedSnippet: highlighted,
          score: score * weight,
        });
      }
    }
  }

  // 去重（同一条目多次匹配时保留最高分）
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of results) {
    const key = r.entry.id;
    if (seen.has(key)) {
      const existing = deduped.find(d => d.entry.id === key);
      if (existing && r.score > existing.score) {
        deduped[deduped.indexOf(existing)] = r;
      }
    } else {
      seen.add(key);
      deduped.push(r);
    }
  }

  return deduped.sort((a, b) => b.score - a.score).slice(0, 20);
}
