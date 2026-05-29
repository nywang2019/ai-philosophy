import { useMemo, useState, useEffect } from "react";
import { computeAnalytics, type ModuleStats, type DailyStats, type Analytics } from "../services/analytics";
import type { HistoryEntry } from "../services/historyStore";
import { generate, type LLMConfig } from "../api/client";

// ===== 配色 =====
const CHART_COLORS = [
  "#4a6cf7", "#e82127", "#389e0d", "#c75a2c", "#7c3aed",
  "#0891b2", "#d97706", "#db2777", "#0d9488", "#6d28d9",
];

// ===== 统计卡片 =====
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: number;
}> = ({ label, value, sub, color, trend }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-label">{label}</div>
    <div className="dash-stat-value" style={color ? { color } : {}}>
      {value}
      {trend !== undefined && trend !== 0 && (
        <span className={`dash-trend ${trend > 0 ? "up" : "down"}`}>
          {trend > 0 ? "↑" : "↓"}{Math.abs(trend)}%
        </span>
      )}
    </div>
    {sub && <div className="dash-stat-sub">{sub}</div>}
  </div>
);

// ===== SVG 横向柱状图 =====
const BarChart: React.FC<{ data: ModuleStats[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const H = data.length * 36 + 20;
  const W = 560;
  const barH = 22;
  const gap = 14;
  const labelW = 130;
  const barStart = labelW + 6;
  const barMaxW = W - barStart - 50; // 右侧留空放外部数字

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      {data.map((d, i) => {
        const y = 12 + i * (barH + gap);
        const w = d.count > 0
          ? Math.max((d.count / max) * barMaxW, 4)
          : 0;
        const insideText = w > 36; // 仅当条足够宽时数字放条内
        return (
          <g key={d.moduleId}>
            <text
              x={0}
              y={y + barH / 2 + 5}
              textAnchor="start"
              fontSize="12"
              fill="var(--text-secondary)"
            >
              {d.moduleName}
            </text>
            {d.count > 0 && (
              <>
                <rect
                  x={barStart}
                  y={y}
                  width={w}
                  height={barH}
                  rx="5"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={0.88}
                />
                <text
                  x={insideText ? barStart + w / 2 : barStart + w + 8}
                  y={y + barH / 2 + 5}
                  textAnchor={insideText ? "middle" : "start"}
                  fontSize="11"
                  fontWeight="700"
                  fill={insideText ? "#fff" : "var(--text-secondary)"}
                >
                  {d.count}次
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ===== SVG 折线图（30天趋势 + 7日移动平均） =====
const LineChart: React.FC<{ data: DailyStats[]; movingAvg?: number[] }> = ({ data, movingAvg }) => {
  const W = 520;
  const H = 180;
  const pad = { t: 16, r: 16, b: 30, l: 32 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...data.map((d) => d.count), ...(movingAvg || []), 1);
  const yFor = (v: number) => pad.t + ch - (v / maxVal) * ch;

  const pts = data.map((d, i) => {
    const x = pad.l + (i / Math.max(data.length - 1, 1)) * cw;
    return `${x},${yFor(d.count)}`;
  }).join(" ");

  const areaPath = pts ? `M${pad.l},${pad.t + ch} L${pts.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, "$1,$2 L")} L${pad.l + cw},${pad.t + ch} Z` : "";

  const maPts = movingAvg ? movingAvg.map((v, i) => {
    const x = pad.l + (i / Math.max(data.length - 1, 1)) * cw;
    return `${x},${yFor(v)}`;
  }).join(" ") : null;

  const xLabels: { label: string; x: number }[] = [];
  data.forEach((d, i) => {
    if (i % 5 === 0 || i === data.length - 1) {
      xLabels.push({ label: d.date, x: pad.l + (i / Math.max(data.length - 1, 1)) * cw });
    }
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity="0.25" />
          <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((r) => {
        const y = yFor(maxVal * r);
        return (
          <g key={r}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="var(--light-border)" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{Math.round(maxVal * r)}</text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#lineGrad)" />
      <polyline points={pts} fill="none" stroke={CHART_COLORS[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {maPts && (
        <polyline points={maPts} fill="none" stroke={CHART_COLORS[2]} strokeWidth="1.5" strokeDasharray="6 3" strokeLinecap="round" opacity="0.7" />
      )}

      {data.map((d, i) => {
        const x = pad.l + (i / Math.max(data.length - 1, 1)) * cw;
        if (d.count === 0) return null;
        const y = yFor(d.count);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="2.5" fill={CHART_COLORS[0]} opacity="0.9" />
            {d.count > 0 && (
              <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill={CHART_COLORS[0]}>{d.count}</text>
            )}
          </g>
        );
      })}

      {xLabels.map((l) => (
        <text key={l.label} x={l.x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{l.label}</text>
      ))}
    </svg>
  );
};

// ===== SVG 环形图 =====
const DonutChart: React.FC<{ data: ModuleStats[] }> = ({ data }) => {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 60;
  const strokeW = 18;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const top5 = data.filter((d) => d.count > 0).slice(0, 5);

  let cumulativeAngle = -Math.PI / 2;

  return (
    <div className="dash-donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {data.map((d, i) => {
          const slice = (d.count / total) * Math.PI * 2;
          if (slice === 0) return null;
          const startX = cx + radius * Math.cos(cumulativeAngle);
          const startY = cy + radius * Math.sin(cumulativeAngle);
          const endAngle = cumulativeAngle + slice;
          const endX = cx + radius * Math.cos(endAngle);
          const endY = cy + radius * Math.sin(endAngle);
          const largeArc = slice > Math.PI ? 1 : 0;
          const dPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
          const el = (
            <path
              key={d.moduleId}
              d={dPath}
              fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={strokeW}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
          cumulativeAngle = endAngle;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--muted)">
          总计
        </text>
      </svg>
      <div className="dash-donut-legend">
        {top5.map((d, i) => (
          <div key={d.moduleId} className="dash-legend-item">
            <span
              className="dash-legend-dot"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span>{d.moduleName}</span>
            <span className="dash-legend-val">{Math.round(d.percentage)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 标签分布条 =====
const TagBars: React.FC<{ data: import("../services/analytics").TagStats[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const H = Math.max(data.length * 30 + 16, 60);
  const W = 360;
  const barH = 18;
  const gap = 10;
  const labelW = 70;
  const barStart = labelW + 8;
  const barMaxW = W - barStart - 40;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      {data.map((d, i) => {
        const y = 8 + i * (barH + gap);
        const w = Math.max((d.count / max) * barMaxW, 4);
        return (
          <g key={d.tag}>
            <text x={0} y={y + barH / 2 + 4} textAnchor="start" fontSize="11" fill="var(--text-secondary)">{d.tag}</text>
            <rect x={barStart} y={y} width={w} height={barH} rx="4" fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.82} />
            <text x={barStart + w + 6} y={y + barH / 2 + 4} textAnchor="start" fontSize="10" fontWeight="600" fill="var(--muted)">{d.count}次</text>
          </g>
        );
      })}
    </svg>
  );
};

// ===== 最近活动 =====
const RecentActivity: React.FC<{ sessions: Analytics["recentSessions"]; onSelect?: (entry: HistoryEntry) => void }> = ({ sessions, onSelect }) => {
  if (sessions.length === 0) {
    return <div className="dash-empty">暂无活动记录</div>;
  }
  return (
    <div className="dash-activity">
      {sessions.map((s: HistoryEntry, i: number) => (
        <div key={s.id} className="dash-activity-item dash-activity-clickable" onClick={() => onSelect?.(s)}>
          <div className="dash-activity-left">
            <div className="dash-activity-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="dash-activity-title">
              {s.pinned && "📌 "}{s.title}
            </span>
            <span className="dash-activity-meta">
              {s.moduleName}
            </span>
          </div>
          <div className="dash-activity-time">
            {new Date(s.timestamp).toLocaleString("zh-CN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== SVG 24小时热力条 =====
const HourHeatmap: React.FC<{ data: import("../services/analytics").HourStats[]; max: number }> = ({ data, max }) => {
  const W = 520;
  const H = 60;
  const barW = 16;
  const gap = 4;
  const startX = 30;
  const maxH = 36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      {data.map((d) => {
        const x = startX + d.hour * (barW + gap);
        const h = max > 0 ? (d.count / max) * maxH : 2;
        const y = maxH - h + 10;
        return (
          <g key={d.hour}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx="3" fill={d.count > 0 ? CHART_COLORS[0] : "var(--code-bg)"} opacity={d.count > 0 ? 0.8 : 0.3} />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fontWeight="600" fill={CHART_COLORS[0]}>{d.count}</text>
            )}
            {d.hour % 6 === 0 && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
                {String(d.hour).padStart(2, "0")}:00
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ===== SVG 周分布条 =====
const WeekdayBars: React.FC<{ data: import("../services/analytics").WeekdayStats[]; max: number }> = ({ data, max }) => {
  const W = 520;
  const H = 70;
  const barW = 44;
  const gap = 16;
  const startX = 28;
  const maxH = 42;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      {data.map((d, i) => {
        const x = startX + i * (barW + gap);
        const h = max > 0 ? (d.count / max) * maxH : 2;
        const y = maxH - h + 10;
        const isToday = new Date().getDay() === d.day;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx="4" fill={isToday ? CHART_COLORS[1] : CHART_COLORS[0]} opacity={d.count > 0 ? 0.85 : 0.25} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)">
              {d.count > 0 ? d.count : ""}
            </text>
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="11" fill={isToday ? "var(--primary)" : "var(--muted)"} fontWeight={isToday ? 700 : 400}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ===== 词频展示 =====
const WordCloud: React.FC<{ words: import("../services/analytics").TitleWord[] }> = ({ words }) => {
  if (words.length === 0) return <div className="dash-empty">暂无数据</div>;
  const max = words[0]?.count || 1;
  return (
    <div className="dash-wordcloud">
      {words.map((w, i) => {
        const size = 11 + Math.round((w.count / max) * 9);
        const opacity = 0.5 + (w.count / max) * 0.5;
        return (
          <span
            key={w.word}
            className="dash-word"
            style={{
              fontSize: size,
              color: CHART_COLORS[i % CHART_COLORS.length],
              opacity,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ===== 收藏排行条 =====
const FavBars: React.FC<{ data: ModuleStats[] }> = ({ data }) => {
  const favModules = [...data].filter((d) => d.favoriteCount > 0).sort((a, b) => b.favoriteCount - a.favoriteCount).slice(0, 5);
  if (favModules.length === 0) return <div className="dash-empty">暂无收藏数据</div>;
  const max = favModules[0].favoriteCount;
  const W = 420; const H = favModules.length * 30 + 14; const barH = 18; const gap = 10;
  const labelW = 110; const barStart = labelW + 6; const barMaxW = W - barStart - 50;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="dash-chart-svg">
      {favModules.map((d, i) => {
        const y = 6 + i * (barH + gap);
        const w = d.favoriteCount > 0 ? Math.max((d.favoriteCount / max) * barMaxW, 4) : 0;
        const insideText = w > 40;
        return (
          <g key={d.moduleId}>
            <text x={0} y={y + barH / 2 + 4} textAnchor="start" fontSize="11" fill="var(--text-secondary)">{d.moduleName}</text>
            {d.favoriteCount > 0 && (
              <>
                <rect x={barStart} y={y} width={w} height={barH} rx="4" fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} />
                <text
                  x={insideText ? barStart + w / 2 : barStart + w + 8}
                  y={y + barH / 2 + 4}
                  textAnchor={insideText ? "middle" : "start"}
                  fontSize="10"
                  fontWeight="700"
                  fill={insideText ? "#fff" : "var(--text-secondary)"}
                >
                  {d.favoriteCount}⭐
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ===== 主仪表盘 =====
const Dashboard: React.FC<{ onHistorySelect?: (entry: HistoryEntry) => void; onViewProject?: () => void }> = ({ onHistorySelect, onViewProject }) => {
  const [range, setRange] = useState(7);
  const stats = useMemo(() => computeAnalytics(range), [range]);
  const [imageCount, setImageCount] = useState(0);
  const [imageKB, setImageKB] = useState(0);

  useEffect(() => {
    import("../services/imageStore").then(async ({ getAllImageIds, getImage }) => {
      const ids = await getAllImageIds();
      let kb = 0;
      for (const id of ids) {
        const img = await getImage(id);
        if (img) kb += Math.round(img.size / 1024);
      }
      setImageCount(ids.length);
      setImageKB(kb);
    }).catch(() => {});
  }, [range]);
  const hourMax = Math.max(...stats.hourStats.map((h) => h.count), 1);
  const weekdayMax = Math.max(...stats.weekdayStats.map((w) => w.count), 1);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const loadConfig = (): LLMConfig | null => {
    try {
      const s = localStorage.getItem("ai-philosophy-llm-config");
      if (s) return JSON.parse(s) as LLMConfig;
    } catch { /* ignore */ }
    return null;
  };

  const handleGenerateInsight = async () => {
    const config = loadConfig();
    if (!config) {
      setInsight("⚠️ 请先在设置中配置API信息");
      return;
    }
    setInsightLoading(true);
    try {
      const top3 = stats.moduleStats.filter((m) => m.count > 0).slice(0, 3);
      const prompt = `你是一位数据分析师。请根据以下用户使用数据，写一段80字左右的洞察总结，风格轻松有洞察力，指出最有趣的使用模式并给一个建议。不要客套话直接说发现。

总使用${stats.totalSessions}次，本周${stats.thisWeekCount}次（上周${stats.lastWeekCount}次），收藏${stats.favoriteSessions}个，置顶${stats.pinnedSessions}个。
最爱模块：${top3.map((m) => `${m.moduleName}(${m.count}次)`).join("、")}。
活跃时段：${stats.mostActiveHour}点，连续使用最长${stats.longestStreak}天。`;
      const res = await generate({
        moduleId: "dashboard-insight",
        inputs: {},
        llmConfig: config,
        customPrompt: prompt,
      });
      const text = (res.result as Record<string, unknown>).raw as string || JSON.stringify(res.result);
      setInsight(text.slice(0, 300));
    } catch (e) {
      setInsight("生成洞察失败：" + (e instanceof Error ? e.message : ""));
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>系统仪表盘</h2>
        <span className="dash-header-sub">
          {stats.totalSessions > 0
            ? `基于 ${stats.totalSessions} 次会话数据的统计分析`
            : "暂无数据，开始使用系统后将自动生成统计"}
        </span>
        <div className="dash-range-bar">
          {[7, 30, 90, 0].map((r) => (
            <span
              key={r}
              className={`dash-range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r === 0 ? "全部" : `${r}天`}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {stats.totalSessions > 0 && (
            <button
              className="dash-insight-btn"
              onClick={handleGenerateInsight}
              disabled={insightLoading}
            >
              {insightLoading ? "分析中..." : "🔮 AI洞察"}
            </button>
          )}
          {stats.totalSessions > 0 && (
            <button
              className="dash-insight-btn"
              style={{ background: "linear-gradient(135deg, #389e0d, #4caf50)" }}
              onClick={() => {
                const top3 = stats.moduleStats.filter(m => m.count > 0).slice(0, 3).map(m => `${m.moduleName}(${m.count}次)`).join("、");
                const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>文史哲AI系统统计报告</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.8;color:#1d1d1f}h1{font-size:22px;border-bottom:2px solid #4a6cf7;padding-bottom:8px}h2{font-size:16px;margin-top:24px;color:#555}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:8px 12px;border-bottom:1px solid #eee}td:first-child{font-weight:600;width:140px}.tag{display:inline-block;padding:2px 10px;background:#eef2ff;color:#4a6cf7;border-radius:10px;font-size:11px;margin:2px}.card{background:#f7f7f7;border-radius:10px;padding:16px;margin:12px 0}</style></head><body>
<h1>文史哲AI系统 · 统计报告</h1><p style="color:#888">导出时间：${new Date().toLocaleString("zh-CN")}</p>
<div class="card"><h2>概览</h2><table>
<tr><td>总会话数</td><td>${stats.totalSessions}</td><td>今日会话</td><td>${stats.todaySessions}</td></tr>
<tr><td>日均使用</td><td>${stats.averagePerDay}次/天</td><td>最长连续</td><td>${stats.longestStreak}天</td></tr>
<tr><td>收藏率</td><td>${stats.favoriteRate}% (${stats.favoriteSessions}个)</td><td>置顶率</td><td>${stats.pinRate}% (${stats.pinnedSessions}个)</td></tr>
<tr><td>总生成量</td><td>${(stats.totalWordsGenerated/1000).toFixed(1)}k字</td><td>平均输入</td><td>${stats.averageInputLen}字</td></tr>
<tr><td>本周会话</td><td>${stats.thisWeekCount}次 (上周${stats.lastWeekCount}次)</td><td>活跃时段</td><td>${stats.mostActiveHour}:00</td></tr>
<tr><td>存储占用</td><td>${(stats.storageBytes/1024).toFixed(1)}KB</td><td>周趋势</td><td>${stats.weeklyTrend > 0 ? "+" : ""}${stats.weeklyTrend}%</td></tr>
</table></div>
<div class="card"><h2>模块分布</h2><table>${stats.moduleStats.filter(m=>m.count>0).map(m=>`<tr><td>${m.moduleName}</td><td>${m.count}次 (${Math.round(m.percentage)}%)</td><td>收藏${m.favoriteCount}个</td></tr>`).join("")}</table></div>
<div class="card"><h2>最爱模块</h2><p>${top3}</p></div>
<div class="card"><h2>标签分布</h2><p>${stats.tagStats.map(t=>`<span class="tag">${t.tag} ${t.count}次</span>`).join(" ")}</p></div>
<div class="card"><h2>高频主题词</h2><p>${stats.titleWords.map(w=>`<span class="tag">${w.word}(${w.count})</span>`).join(" ")}</p></div>
<p style="font-size:11px;color:#999;text-align:center;margin-top:24px">由文史哲AI生成系统导出</p>
</body></html>`;
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `文史哲AI统计报告-${new Date().toISOString().slice(0,10)}.html`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}
            >
              📄 导出报告
            </button>
          )}
        </div>
        {insight && (
          <div className="dash-insight-box">{insight}</div>
        )}
      </div>

      {/* 统计卡片行 */}
      <div className="dash-cards">
        <StatCard label="总会话数" value={stats.totalSessions} sub="所有模块累计使用" trend={stats.weeklyTrend} />
        <StatCard label="今日会话" value={stats.todaySessions} sub={stats.thisWeekCount > 0 ? `本周 ${stats.thisWeekCount} 次 · 上周 ${stats.lastWeekCount} 次` : "今天的使用次数"} color="#4a6cf7" trend={stats.weeklyTrend} />
        <StatCard
          label="最热模块"
          value={stats.topModule ? stats.topModule.moduleName : "—"}
          sub={stats.topModule ? `${stats.topModule.count} 次 · ${Math.round(stats.topModule.percentage)}%` : "暂无数据"}
          color="#e82127"
        />
        <StatCard label="日均使用" value={stats.averagePerDay} sub="次/天" />
        <StatCard label="最长连续" value={`${stats.longestStreak}天`} sub="连续使用天数" color="#7c3aed" />
        <StatCard label="收藏率" value={`${stats.favoriteRate}%`} sub={`${stats.favoriteSessions} 个已收藏`} color="#f59e0b" />
        <StatCard label="笔记率" value={`${stats.noteRate}%`} sub={`${stats.noteSessions} 条有笔记`} color="#0891b2" />
        <StatCard label="置顶率" value={`${stats.pinRate}%`} sub={`${stats.pinnedSessions} 个已置顶`} />
        <StatCard label="总生成量" value={`${(stats.totalWordsGenerated / 1000).toFixed(1)}k`} sub="字符数" color="#389e0d" />
        <StatCard label="总Token" value={`${(stats.totalTokens / 1000).toFixed(1)}k`} sub="累计消耗" color="#0891b2" />
        <StatCard label="平均输入" value={`${stats.averageInputLen}字`} sub={`累计输入 ${(stats.totalInputChars / 1000).toFixed(1)}k 字`} />
        <StatCard label="存储占用" value={`${(stats.storageBytes / 1024).toFixed(1)}KB`} sub="本地数据量" />
        <StatCard label="研究项目" value={stats.totalProjects} sub="个项目" color="#7c3aed" />
        <StatCard label="展馆" value={stats.showcaseCount} sub="件展品" color="#f59e0b" />
        <StatCard label="知识图谱" value={`${stats.knowledgeEntities}/${stats.knowledgeEdges}`} sub="实体/关系" color="#0891b2" />
        <StatCard label="自定义模块" value={stats.customModuleCount} sub="个" color="#db2777" />
        <StatCard label="图片存储" value={`${imageCount}张/${(imageKB / 1024).toFixed(1)}MB`} sub="IndexedDB" color="#d97706" />
        <StatCard label="多模态会话" value={stats.multimodalSessions} sub="含图片" color="#f59e0b" />
      </div>

      {/* 图表行 */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-title">模块使用分布</div>
          {stats.totalSessions > 0 ? (
            <BarChart data={stats.moduleStats} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
        <div className="dash-card">
          <div className="dash-card-title">使用趋势（近30天 · 虚线=7日平均）</div>
          {stats.totalSessions > 0 ? (
            <LineChart data={stats.dailyStats} movingAvg={stats.movingAverage7d} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>

      {/* 第三行：环形图 + 收藏排行 */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-title">模块占比</div>
          {stats.totalSessions > 0 ? (
            <DonutChart data={stats.moduleStats} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
        <div className="dash-card">
          <div className="dash-card-title">模块收藏排行</div>
          <FavBars data={stats.moduleStats} />
        </div>
      </div>

      {/* 第四行：24h + 每周 */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-title">24小时活跃分布</div>
          {stats.totalSessions > 0 ? (
            <HourHeatmap data={stats.hourStats} max={hourMax} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
        <div className="dash-card">
          <div className="dash-card-title">每周分布</div>
          {stats.totalSessions > 0 ? (
            <WeekdayBars data={stats.weekdayStats} max={weekdayMax} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>

      {/* 第五行：标签 + 最近活动 */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-title">标签统计</div>
          {stats.tagStats.length > 0 ? (
            <TagBars data={stats.tagStats} />
          ) : (
            <div className="dash-empty">暂无标签数据</div>
          )}
        </div>
        <div className="dash-card">
          <div className="dash-card-title">最近活动</div>
          <RecentActivity sessions={stats.recentSessions} onSelect={onHistorySelect} />
        </div>
      </div>

      {/* 项目 + 词频 */}
      <div className="dash-charts">
        {stats.projectStats.length > 0 && (
          <div className="dash-card">
            <div className="dash-card-title">研究项目</div>
            <div className="dash-activity">
              {stats.projectStats.map(p => (
                <div key={p.project.id} className="dash-activity-item dash-activity-clickable" onClick={onViewProject}>
                  <div className="dash-activity-left">
                    <span>{p.project.icon}</span>
                    <div>
                      <div className="dash-activity-title" style={{ maxWidth: "unset" }}>{p.project.name}</div>
                      <div className="dash-activity-meta">{p.project.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{p.sessionCount} 次会话</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="dash-card">
          <div className="dash-card-title">高频主题词</div>
          {stats.titleWords.length > 0 ? (
            <WordCloud words={stats.titleWords} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
