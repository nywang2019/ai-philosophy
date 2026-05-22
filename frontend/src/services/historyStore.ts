// 对话历史存储 - localStorage 持久化

import type { LLMConfig } from "../api/client";

export interface HistoryEntry {
  id: string;
  title: string;
  moduleId: string;
  moduleName: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  llmConfig: LLMConfig;
  timestamp: number;
  pinned: boolean;
  tags: string[];
}

const STORAGE_KEY = "ai-philosophy-history";
const MAX_ENTRIES = 200;

function loadAll(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as HistoryEntry[];
  } catch {
    // ignore
  }
  return [];
}

function saveAll(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// 自动生成标题：根据模块输入组合出自然标题
function autoTitle(_moduleName: string, inputs: Record<string, unknown>): string {
  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v as string[] : []);
  const snip = (s: string, max = 22): string =>
    s.length > max ? s.slice(0, max) + "…" : s;

  const idiom = str(inputs.idiom);
  const eras = arr(inputs.eras);
  const philosophers = arr(inputs.philosophers);
  const question = str(inputs.question);
  const event = str(inputs.event);
  const changedVariable = str(inputs.changedVariable);
  const text = str(inputs.text);
  const poem = str(inputs.poem);
  const school = str(inputs.school);
  const characters = arr(inputs.characters);
  const topic = str(inputs.topic);
  const concept = str(inputs.concept);

  // 典故时间穿越：郑人买履 × 唐宋明清
  if (idiom && eras.length) return snip(`${idiom} · ${eras.join("、")}`);
  if (idiom) return snip(idiom);

  // 历史反事实：赤壁之战：倘若军中无瘟疫
  if (event && changedVariable) return snip(`${event}：${changedVariable}`);
  if (event) return snip(event);

  // 哲学家群聊：孔子、尼采聊人生意义
  if (philosophers.length && question) return snip(`${philosophers.slice(0, 3).join("、")} 聊 ${question}`);
  if (philosophers.length) return snip(`${philosophers.slice(0, 3).join("、")} 的群聊`);

  // 文学角色对话：林黛玉、哈姆雷特聊爱情
  if (characters.length && topic) return snip(`${characters.slice(0, 2).join("、")} 聊 ${topic}`);
  if (characters.length) return snip(`${characters.slice(0, 3).join("、")} 的对话`);

  // 诗歌情绪：静夜思 的情绪分析
  if (poem) return snip(`${poem.slice(0, 12)}`);

  // 诸子百家创业：儒家创业计划
  if (school) return snip(`${school}创业计划`);

  // 时代滤镜：今天天气很好 → 唐宋明清
  if (text && eras.length) return snip(`${text.slice(0, 10)} → ${eras.join("、")}`);

  // 哲学概念降维：存在先于本质
  if (concept) return snip(concept);

  // 纯文本类（古文翻译、偏见检测等）
  if (text) return snip(text);

  // 兜底
  if (question) return snip(question);
  if (topic) return snip(topic);

  // 通用兜底：遍历所有输入值，找到第一个有意义的字符串
  for (const v of Object.values(inputs)) {
    if (typeof v === "string" && v.trim()) return snip(v.trim());
    if (Array.isArray(v) && v.length > 0) return snip(v.join("、"));
  }
  return "未命名对话";
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function addHistory(
  moduleId: string,
  moduleName: string,
  inputs: Record<string, unknown>,
  result: Record<string, unknown>,
  llmConfig: LLMConfig
): HistoryEntry {
  const entries = loadAll();
  const entry: HistoryEntry = {
    id: genId(),
    title: autoTitle(moduleName, inputs),
    moduleId,
    moduleName,
    inputs,
    result,
    llmConfig,
    timestamp: Date.now(),
    pinned: false,
    tags: [],
  };
  entries.unshift(entry);
  // 超出上限时淘汰最旧的未置顶记录
  if (entries.length > MAX_ENTRIES) {
    const pinned = entries.filter((e) => e.pinned);
    const unpinned = entries.filter((e) => !e.pinned);
    const toKeep = unpinned.slice(0, MAX_ENTRIES - pinned.length);
    const trimmed = [...pinned, ...toKeep].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    saveAll(trimmed);
  } else {
    saveAll(entries);
  }
  return entry;
}

export function getAllHistory(): HistoryEntry[] {
  return loadAll();
}

export function updateTitle(id: string, title: string): void {
  const entries = loadAll();
  const found = entries.find((e) => e.id === id);
  if (found) {
    found.title = title;
    saveAll(entries);
  }
}

export function togglePin(id: string): void {
  const entries = loadAll();
  const found = entries.find((e) => e.id === id);
  if (found) {
    found.pinned = !found.pinned;
    saveAll(entries);
  }
}

export function deleteHistory(id: string): void {
  const entries = loadAll().filter((e) => e.id !== id);
  saveAll(entries);
}

export function deleteHistories(ids: string[]): void {
  const idSet = new Set(ids);
  const entries = loadAll().filter((e) => !idSet.has(e.id));
  saveAll(entries);
}

export function deleteAllHistory(): void {
  saveAll([]);
}

export function getHistoryById(id: string): HistoryEntry | undefined {
  return loadAll().find((e) => e.id === id);
}

export function updateTags(id: string, tags: string[]): void {
  const entries = loadAll();
  const found = entries.find((e) => e.id === id);
  if (found) {
    found.tags = tags;
    saveAll(entries);
  }
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  for (const e of loadAll()) {
    for (const t of e.tags || []) tagSet.add(t);
  }
  // 预置标签即使未被使用也显示
  const presets = ["论文素材", "课堂演示", "有趣", "灵感", "待整理"];
  for (const p of presets) tagSet.add(p);
  return [...tagSet].sort();
}
