// 数据分析服务 - 从历史记录中提取统计数据
import { getAllHistory, type HistoryEntry } from "./historyStore";
import { moduleConfigs } from "../modules/moduleConfig";
import type { ModuleConfig } from "../modules/moduleConfig";
import { getAllCustomModules } from "./customModuleStore";

export interface ModuleStats {
  moduleId: string;
  moduleName: string;
  count: number;
  percentage: number;
  avgOutputSize: number;
  pinnedCount: number;
  pinRate: number;
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

export interface Analytics {
  totalSessions: number;
  todaySessions: number;
  pinnedSessions: number;
  pinRate: number;
  topModule: ModuleStats | null;
  moduleStats: ModuleStats[];
  dailyStats: DailyStats[];
  recentSessions: HistoryEntry[];
  averagePerDay: number;
  mostActiveHour: number;
  hourStats: HourStats[];
  weekdayStats: WeekdayStats[];
  totalWordsGenerated: number;
  oldestSession: number | null;
  newestSession: number | null;
  longestStreak: number;
  storageBytes: number;
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

export function computeAnalytics(): Analytics {
  const all = getAllHistory();
  const today = getDateKey(Date.now());

  // 总次数
  const totalSessions = all.length;

  // 今日次数
  const todaySessions = all.filter((e) => getDateKey(e.timestamp) === today).length;

  // 置顶统计
  const pinnedSessions = all.filter((e) => e.pinned).length;
  const pinRate = totalSessions > 0 ? Math.round((pinnedSessions / totalSessions) * 100) : 0;

  // 合并内置模块和自定义模块
  const allModuleConfigs: ModuleConfig[] = [
    ...moduleConfigs,
    ...getAllCustomModules().map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      description: m.description,
      fields: m.fields,
      _isCustom: true,
    })),
  ];

  // 模块统计（含平均输出量和 pin 率）
  const moduleMap: Record<string, { count: number; totalSize: number; pins: number }> = {};
  for (const e of all) {
    if (!moduleMap[e.moduleId]) moduleMap[e.moduleId] = { count: 0, totalSize: 0, pins: 0 };
    moduleMap[e.moduleId].count++;
    moduleMap[e.moduleId].totalSize += countWords(e.result);
    if (e.pinned) moduleMap[e.moduleId].pins++;
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
      });
    }
  }
  moduleStats.sort((a, b) => b.count - a.count);

  const topModule = moduleStats[0]?.count > 0 ? moduleStats[0] : null;

  // 每日统计（最近30天）
  const dailyMap: Record<string, number> = {};
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
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
    topModule,
    moduleStats,
    dailyStats,
    recentSessions,
    averagePerDay,
    mostActiveHour,
    hourStats,
    weekdayStats,
    totalWordsGenerated,
    oldestSession: oldest,
    newestSession: newest,
    longestStreak,
    storageBytes,
  };
}
