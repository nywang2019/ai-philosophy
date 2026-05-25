// 展示馆存储 - localStorage 持久化

export interface ShowcaseItem {
  id: string;
  title: string;
  moduleId: string;
  moduleName: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  tags: string[];
  publishedAt: number;
  historyId: string;
}

const STORAGE_KEY = "ai-philosophy-showcase";

function loadAll(): ShowcaseItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ShowcaseItem[] : [];
  } catch { return []; }
}

function saveAll(items: ShowcaseItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function publish(item: Omit<ShowcaseItem, "id" | "publishedAt">): ShowcaseItem {
  const all = loadAll();
  const entry: ShowcaseItem = {
    ...item,
    id: "sc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    publishedAt: Date.now(),
  };
  all.unshift(entry);
  saveAll(all);
  return entry;
}

export function unpublish(id: string): boolean {
  const all = loadAll();
  const filtered = all.filter(i => i.id !== id);
  if (filtered.length === all.length) return false;
  saveAll(filtered);
  return true;
}

export function getAllShowcase(): ShowcaseItem[] {
  return loadAll();
}

export function getShowcaseByModule(moduleName: string): ShowcaseItem[] {
  return loadAll().filter(i => i.moduleName === moduleName);
}
