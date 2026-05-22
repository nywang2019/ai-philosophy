import { useMemo } from "react";
import { computeAnalytics, type ModuleStats, type DailyStats, type Analytics } from "../services/analytics";
import type { HistoryEntry } from "../services/historyStore";

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
}> = ({ label, value, sub, color }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-label">{label}</div>
    <div className="dash-stat-value" style={color ? { color } : {}}>
      {value}
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

// ===== SVG 折线图（30天趋势） =====
const LineChart: React.FC<{ data: DailyStats[] }> = ({ data }) => {
  const W = 520;
  const H = 180;
  const pad = { t: 16, r: 16, b: 30, l: 32 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const yFor = (v: number) => pad.t + ch - (v / maxVal) * ch;

  const pts = data
    .map((d, i) => {
      const x = pad.l + (i / Math.max(data.length - 1, 1)) * cw;
      const y = yFor(d.count);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M${pad.l},${pad.t + ch} L${pts.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, "$1,$2 L")} L${pad.l + cw},${pad.t + ch} Z`;

  // X轴标签（每5天）
  const xLabels: { label: string; x: number }[] = [];
  data.forEach((d, i) => {
    if (i % 5 === 0 || i === data.length - 1) {
      xLabels.push({
        label: d.date,
        x: pad.l + (i / Math.max(data.length - 1, 1)) * cw,
      });
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

      {/* Y轴网格 */}
      {[0, 0.5, 1].map((r) => {
        const y = yFor(maxVal * r);
        return (
          <g key={r}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="var(--light-border)" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {Math.round(maxVal * r)}
            </text>
          </g>
        );
      })}

      {/* 面积 + 折线 */}
      <path d={areaPath} fill="url(#lineGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke={CHART_COLORS[0]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 数据点 */}
      {data.map((d, i) => {
        const x = pad.l + (i / Math.max(data.length - 1, 1)) * cw;
        const y = yFor(d.count);
        if (d.count === 0) return null;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={CHART_COLORS[0]} opacity="0.9" />
        );
      })}

      {/* X轴标签 */}
      {xLabels.map((l) => (
        <text key={l.label} x={l.x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {l.label}
        </text>
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

// ===== 最近活动 =====
const RecentActivity: React.FC<{ sessions: Analytics["recentSessions"] }> = ({ sessions }) => {
  if (sessions.length === 0) {
    return <div className="dash-empty">暂无活动记录</div>;
  }
  return (
    <div className="dash-activity">
      {sessions.map((s: HistoryEntry, i: number) => (
        <div key={s.id} className="dash-activity-item">
          <div className="dash-activity-left">
            <div className="dash-activity-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <div>
              <div className="dash-activity-title">
                {s.pinned && "📌 "}{s.title}
              </div>
              <div className="dash-activity-meta">
                {s.moduleName}
              </div>
            </div>
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

// ===== 主仪表盘 =====
const Dashboard: React.FC = () => {
  const stats = useMemo(() => computeAnalytics(), []);
  const hourMax = Math.max(...stats.hourStats.map((h) => h.count), 1);
  const weekdayMax = Math.max(...stats.weekdayStats.map((w) => w.count), 1);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>系统仪表盘</h2>
        <span className="dash-header-sub">
          {stats.totalSessions > 0
            ? `基于 ${stats.totalSessions} 次会话数据的统计分析`
            : "暂无数据，开始使用系统后将自动生成统计"}
        </span>
      </div>

      {/* 统计卡片行 */}
      <div className="dash-cards">
        <StatCard label="总会话数" value={stats.totalSessions} sub="所有模块累计使用" />
        <StatCard label="今日会话" value={stats.todaySessions} sub="今天的使用次数" color="#4a6cf7" />
        <StatCard
          label="最热模块"
          value={stats.topModule ? stats.topModule.moduleName : "—"}
          sub={stats.topModule ? `${stats.topModule.count} 次 · ${Math.round(stats.topModule.percentage)}%` : "暂无数据"}
          color="#e82127"
        />
        <StatCard label="日均使用" value={stats.averagePerDay} sub="次/天" />
        <StatCard label="最长连续" value={`${stats.longestStreak}天`} sub="连续使用天数" color="#7c3aed" />
        <StatCard label="置顶率" value={`${stats.pinRate}%`} sub={`${stats.pinnedSessions} 个已置顶`} />
        <StatCard label="总生成量" value={`${(stats.totalWordsGenerated / 1000).toFixed(1)}k`} sub="字符数" color="#389e0d" />
        <StatCard label="存储占用" value={`${(stats.storageBytes / 1024).toFixed(1)}KB`} sub="本地数据量" />
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
          <div className="dash-card-title">使用趋势（近30天）</div>
          {stats.totalSessions > 0 ? (
            <LineChart data={stats.dailyStats} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>

      {/* 第三行：环形图 + 24h + 每周 */}
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
          <div className="dash-card-title">24小时活跃分布</div>
          {stats.totalSessions > 0 ? (
            <HourHeatmap data={stats.hourStats} max={hourMax} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>

      {/* 第四行：每周分布 + 最近活动 */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-title">每周分布</div>
          {stats.totalSessions > 0 ? (
            <WeekdayBars data={stats.weekdayStats} max={weekdayMax} />
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
        <div className="dash-card">
          <div className="dash-card-title">最近活动</div>
          <RecentActivity sessions={stats.recentSessions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
