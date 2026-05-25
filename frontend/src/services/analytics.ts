// 数据分析服务 - 从历史记录中提取统计数据
import { getAllHistory, type HistoryEntry } from "./historyStore";
import { moduleConfigs } from "../modules/moduleConfig";
import type { ModuleConfig } from "../modules/moduleConfig";
import { getAllCustomModules } from "./customModuleStore";
import { getAllProjects, type ResearchProject } from "./projectStore";
import { getAllShowcase } from "./showcaseStore";
import { buildKnowledgeGraph } from "./knowledgeGraph";

export interface ModuleStats {
  moduleId: string;
  moduleName: string;
  count: number;
  percentage: number;
  avgOutputSize: number;
  pinnedCount: number;
  pinRate: number;
  favoriteCount: number;
  favoriteRate: number;
}

export interface TitleWord {
  word: string;
  count: number;
}

export interface ProjectStats {
  project: ResearchProject;
  sessionCount: number;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface HourStats {
  hour: number;
  count: number;
}

export interface WeekdayStats {
  day: number;
  label: string;
  count: number;
}

export interface TagStats {
  tag: string;
  count: number;
  percentage: number;
}

export interface Analytics {
  totalSessions: number;
  todaySessions: number;
  pinnedSessions: number;
  pinRate: number;
  favoriteSessions: number;
  favoriteRate: number;
  noteSessions: number;
  noteRate: number;
  totalProjects: number;
  showcaseCount: number;
  knowledgeEntities: number;
  knowledgeEdges: number;
  customModuleCount: number;
  imageCount: number;
  imageStorageKB: number;
  multimodalSessions: number;
  promptVersionCount: number;
  topModule: ModuleStats | null;
  moduleStats: ModuleStats[];
  dailyStats: DailyStats[];
  movingAverage7d: number[];
  recentSessions: HistoryEntry[];
  averagePerDay: number;
  mostActiveHour: number;
  hourStats: HourStats[];
  weekdayStats: WeekdayStats[];
  tagStats: TagStats[];
  totalWordsGenerated: number;
  totalTokens: number;
  totalInputChars: number;
  averageInputLen: number;
  thisWeekCount: number;
  lastWeekCount: number;
  weeklyTrend: number;
  oldestSession: number | null;
  newestSession: number | null;
  longestStreak: number;
  storageBytes: number;
  titleWords: TitleWord[];
  projectStats: ProjectStats[];
}

function countWords(result: Record<string, unknown>): number {
  try {
    return JSON.stringify(result).length;
  } catch {
    return 0;
  }
}

function getDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeAnalytics(daysBack = 0): Analytics {
  const allRaw = getAllHistory();
  const cutoff = daysBack > 0 ? Date.now() - daysBack * 86400000 : 0;
  const all = daysBack > 0 ? allRaw.filter(e => e.timestamp >= cutoff) : allRaw;
  const today = getDateKey(Date.now());

  // 总次数
  const totalSessions = all.length;

  // 今日次数
  const todaySessions = all.filter((e) => getDateKey(e.timestamp) === today).length;

  // 置顶统计
  const pinnedSessions = all.filter((e) => e.pinned).length;
  const pinRate = totalSessions > 0 ? Math.round((pinnedSessions / totalSessions) * 100) : 0;

  // 收藏统计
  const favoriteSessions = all.filter((e) => e.favorite).length;
  const favoriteRate = totalSessions > 0 ? Math.round((favoriteSessions / totalSessions) * 100) : 0;

  const noteSessions = all.filter((e) => e.note).length;
  const noteRate = totalSessions > 0 ? Math.round((noteSessions / totalSessions) * 100) : 0;

  // 合并内置模块和自定义模块
  const allModuleConfigs: ModuleConfig[] = [
    ...moduleConfigs,
    ...getAllCustomModules().map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      icon: m.icon || "📦",
      description: m.description,
      fields: m.fields,
      _isCustom: true,
    })),
  ];

  // 模块统计（含平均输出量和 pin 率）
  const moduleMap: Record<string, { count: number; totalSize: number; pins: number; favs: number }> = {};
  for (const e of all) {
    if (!moduleMap[e.moduleId]) moduleMap[e.moduleId] = { count: 0, totalSize: 0, pins: 0, favs: 0 };
    moduleMap[e.moduleId].count++;
    moduleMap[e.moduleId].totalSize += countWords(e.result);
    if (e.pinned) moduleMap[e.moduleId].pins++;
    if (e.favorite) moduleMap[e.moduleId].favs++;
  }
  const moduleStats: ModuleStats[] = allModuleConfigs
    .map((m) => {
      const d = moduleMap[m.moduleId] || { count: 0, totalSize: 0, pins: 0 };
      return {
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        count: d.count,
        percentage: totalSessions > 0 ? (d.count / totalSessions) * 100 : 0,
        avgOutputSize: d.count > 0 ? Math.round(d.totalSize / d.count) : 0,
        pinnedCount: d.pins,
        pinRate: d.count > 0 ? Math.round((d.pins / d.count) * 100) : 0,
        favoriteCount: d.favs,
        favoriteRate: d.count > 0 ? Math.round((d.favs / d.count) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  // 补充：历史中存在但模块配置中已删除的模块
  const configIds = new Set(allModuleConfigs.map((m) => m.moduleId));
  for (const [mid, d] of Object.entries(moduleMap)) {
    if (!configIds.has(mid) && d.count > 0) {
      moduleStats.push({
        moduleId: mid,
        moduleName: `${mid}（已删除）`,
        count: d.count,
        percentage: totalSessions > 0 ? (d.count / totalSessions) * 100 : 0,
        avgOutputSize: d.count > 0 ? Math.round(d.totalSize / d.count) : 0,
        pinnedCount: d.pins,
        pinRate: d.count > 0 ? Math.round((d.pins / d.count) * 100) : 0,
        favoriteCount: d.favs,
        favoriteRate: d.count > 0 ? Math.round((d.favs / d.count) * 100) : 0,
      });
    }
  }
  moduleStats.sort((a, b) => b.count - a.count);

  const topModule = moduleStats[0]?.count > 0 ? moduleStats[0] : null;

  // 每日统计（跟随时间筛选范围）
  const dailyMap: Record<string, number> = {};
  const now = Date.now();
  const dayCount = Math.min(daysBack || 30, 90); // 默认30天，上限90
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyMap[key] = 0;
  }
  for (const e of all) {
    const key = getDateKey(e.timestamp);
    if (key in dailyMap) dailyMap[key]++;
  }
  const dailyStats: DailyStats[] = Object.entries(dailyMap).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));

  // 最近会话
  const recentSessions = all.slice(0, 10);

  // 日均使用
  const oldest = all.length > 0 ? Math.min(...all.map((e) => e.timestamp)) : null;
  const newest = all.length > 0 ? Math.max(...all.map((e) => e.timestamp)) : null;
  let averagePerDay = 0;
  if (oldest && newest && newest > oldest) {
    const days = Math.max(1, Math.ceil((newest - oldest) / 86400000));
    averagePerDay = Math.round((totalSessions / days) * 10) / 10;
  } else if (totalSessions > 0) {
    averagePerDay = totalSessions;
  }

  // 24小时分布
  const hourCounts: number[] = new Array(24).fill(0);
  for (const e of all) {
    hourCounts[new Date(e.timestamp).getHours()]++;
  }
  let mostActiveHour = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > hourCounts[mostActiveHour]) mostActiveHour = h;
  }
  const hourStats: HourStats[] = hourCounts.map((count, hour) => ({ hour, count }));

  // 每周分布
  const DAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekdayCounts: number[] = new Array(7).fill(0);
  for (const e of all) {
    weekdayCounts[new Date(e.timestamp).getDay()]++;
  }
  const weekdayStats: WeekdayStats[] = weekdayCounts.map((count, day) => ({
    day,
    label: DAY_LABELS[day],
    count,
  }));

  // 最长连续使用天数
  let longestStreak = 0;
  if (all.length > 0) {
    const days = new Set(all.map((e) => getDayStart(e.timestamp)));
    const sorted = [...days].sort((a, b) => a - b);
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 86400000) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  // 标签统计
  const tagMap: Record<string, number> = {};
  for (const e of all) {
    for (const t of e.tags || []) {
      tagMap[t] = (tagMap[t] || 0) + 1;
    }
  }
  const tagStats: TagStats[] = Object.entries(tagMap)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 输入统计
  const totalInputChars = all.reduce((sum, e) => sum + JSON.stringify(e.inputs).length, 0);
  const averageInputLen = totalSessions > 0 ? Math.round(totalInputChars / totalSessions) : 0;

  // 本周 vs 上周对比
  const nowD = new Date();
  const dayOfWeek = nowD.getDay();
  const thisWeekStart = getDayStart(nowD.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000);
  const lastWeekStart = thisWeekStart - 7 * 86400000;
  const thisWeekCount = all.filter((e) => {
    const t = e.timestamp;
    return t >= thisWeekStart && t < thisWeekStart + 7 * 86400000;
  }).length;
  const lastWeekCount = all.filter((e) => {
    const t = e.timestamp;
    return t >= lastWeekStart && t < thisWeekStart;
  }).length;
  const weeklyTrend = lastWeekCount > 0
    ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
    : (thisWeekCount > 0 ? 100 : 0);

  // 7天移动平均（基于30天dailyStats）
  const movingAverage7d: number[] = dailyStats.map((_, i) => {
    const start = Math.max(0, i - 3);
    const end = Math.min(dailyStats.length, i + 4);
    let sum = 0;
    for (let j = start; j < end; j++) sum += dailyStats[j].count;
    return Math.round((sum / (end - start)) * 10) / 10;
  });

  // 高频词（从用户输入文本和标签中提取自然词）
  const wordMap: Record<string, number> = {};
  const stopWords = new Set(["的","了","在","是","我","有","和","就","不","人","都","一","个","上","也","很","到","说","要","去","你","会","着","没有","看","好","自己","这","他","她","它","们","那","些","什么","怎么","如何","为什么","因为","所以","但是","如果","可以","已经","还","又","再","才","刚","就","只","被","把","从","让","对","与","或","等","及","其","为","而","之","以","于","则","所","者","也","哉","乎","矣","焉","耳"]);
  // 从输入文本中提取完整片段（按常见分隔符拆分）
  const delimiters = /[·，。！？、：；\s→—\-…,.!?\n]+/;
  for (const e of all) {
    // 输入文本
    for (const v of Object.values(e.inputs)) {
      if (typeof v === "string" && v.trim()) {
        const parts = v.split(delimiters).filter(p => p.length >= 2 && p.length <= 6);
        for (const p of parts) {
          if (!stopWords.has(p) && /[一-龥]/.test(p)) {
            wordMap[p] = (wordMap[p] || 0) + 1;
          }
        }
      }
    }
    // 标签本身就是人肉精选的词
    for (const t of e.tags || []) {
      wordMap[t] = (wordMap[t] || 0) + 1;
    }
  }
  const titleWords: TitleWord[] = Object.entries(wordMap)
    .filter(([, c]) => c >= 2)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // 项目统计
  const projects = getAllProjects();
  const totalProjects = projects.length;

  // 展馆和知识图谱统计
  const showcase = getAllShowcase();
  const showcaseCount = showcase.length;
  const kg = buildKnowledgeGraph();
  const knowledgeEntities = kg.entities.length;
  const knowledgeEdges = kg.edges.length;

  // 新增统计
  const customModuleCount = getAllCustomModules().length;
  const multimodalSessions = all.filter(e => Object.values(e.inputs).some(v => typeof v === "string" && v.startsWith("img_"))).length;

  // 提示词版本总数
  let promptVersionCount = 0;
  try {
    const pv = JSON.parse(localStorage.getItem("ai-philosophy-prompt-versions") || "[]");
    for (const m of pv) promptVersionCount += (m.versions || []).length;
  } catch { /* ignore */ }

  // 图片统计粗略值（IndexedDB 异步，此处用0占位，仪表盘独立异步加载）
  const imageCount = 0;
  const imageStorageKB = 0;
  const projectStats: ProjectStats[] = projects.map(p => ({
    project: p,
    sessionCount: all.filter(e => e.projectId === p.id).length,
  })).sort((a, b) => b.sessionCount - a.sessionCount);

  // Token统计
  const totalTokens = all.reduce((sum, e) => sum + (e.totalTokens || 0), 0);

  // 总生成量 + 存储占用
  const totalWordsGenerated = all.reduce((sum, e) => sum + countWords(e.result), 0);
  let storageBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("ai-philosophy")) {
      storageBytes += (localStorage.getItem(key) || "").length * 2; // UTF-16
    }
  }

  return {
    totalSessions,
    todaySessions,
    pinnedSessions,
    pinRate,
    favoriteSessions,
    favoriteRate,
    noteSessions,
    noteRate,
    totalProjects,
    showcaseCount,
    knowledgeEntities,
    knowledgeEdges,
    customModuleCount,
    imageCount,
    imageStorageKB,
    multimodalSessions,
    promptVersionCount,
    topModule,
    moduleStats,
    dailyStats,
    movingAverage7d,
    recentSessions,
    averagePerDay,
    mostActiveHour,
    hourStats,
    weekdayStats,
    tagStats,
    totalWordsGenerated,
    totalTokens,
    totalInputChars,
    averageInputLen,
    thisWeekCount,
    lastWeekCount,
    weeklyTrend,
    oldestSession: oldest,
    newestSession: newest,
    longestStreak,
    storageBytes,
    titleWords,
    projectStats,
  };
}
