// 自定义模块存储 - localStorage 持久化
import type { ModuleField } from "../modules/moduleConfig";

export interface CustomModule {
  moduleId: string;
  moduleName: string;
  icon: string;
  description: string;
  fields: ModuleField[];
  templateText: string;
  defaultTemplateText: string;
  createdAt: number;
}

const STORAGE_KEY = "ai-philosophy-custom-modules";

// 迁移：为已有模块补充 defaultTemplateText，清理首尾空格
function migrate(mods: CustomModule[]): boolean {
  let changed = false;
  for (const m of mods) {
    if (!m.defaultTemplateText) {
      m.defaultTemplateText = m.templateText;
      changed = true;
    }
    const trimmed = m.moduleName.trim();
    if (m.moduleName !== trimmed) {
      // 同步修正历史会话和展馆中的旧模块名
      try {
        const oldName = m.moduleName;
        const history = JSON.parse(localStorage.getItem("ai-philosophy-history") || "[]");
        let hChanged = false;
        for (const e of history) {
          if (e.moduleName === oldName) { e.moduleName = trimmed; hChanged = true; }
        }
        if (hChanged) localStorage.setItem("ai-philosophy-history", JSON.stringify(history));
        const sc = JSON.parse(localStorage.getItem("ai-philosophy-showcase") || "[]");
        let sChanged = false;
        for (const item of sc) {
          if (item.moduleName === oldName) { item.moduleName = trimmed; sChanged = true; }
        }
        if (sChanged) localStorage.setItem("ai-philosophy-showcase", JSON.stringify(sc));
      } catch { /* ignore */ }
      m.moduleName = trimmed;
      changed = true;
    }
  }
  return changed;
}

function loadAll(): CustomModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const mods = JSON.parse(raw) as CustomModule[];
      if (migrate(mods)) saveAll(mods);
      syncModuleNames(mods);
      return mods;
    }
  } catch { /* ignore */ }
  return [];
}

// 同步自定义模块名到所有引用它的数据
function syncModuleNames(mods: CustomModule[]): void {
  // 构建 moduleId → 当前名称 的映射
  const nameMap = new Map<string, string>();
  for (const m of mods) nameMap.set(m.moduleId, m.moduleName);

  try {
    const history = JSON.parse(localStorage.getItem("ai-philosophy-history") || "[]");
    let changed = false;
    for (const e of history) {
      const currentName = nameMap.get(e.moduleId);
      if (currentName && e.moduleName !== currentName) {
        e.moduleName = currentName;
        changed = true;
      }
    }
    if (changed) localStorage.setItem("ai-philosophy-history", JSON.stringify(history));
  } catch { /* ignore */ }

  try {
    const sc = JSON.parse(localStorage.getItem("ai-philosophy-showcase") || "[]");
    let changed = false;
    for (const item of sc) {
      const currentName = nameMap.get(item.moduleId);
      if (currentName && item.moduleName !== currentName) {
        item.moduleName = currentName;
        changed = true;
      }
    }
    if (changed) localStorage.setItem("ai-philosophy-showcase", JSON.stringify(sc));
  } catch { /* ignore */ }
}

function saveAll(mods: CustomModule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
}

export function getAllCustomModules(): CustomModule[] {
  return loadAll();
}

export function addCustomModule(mod: Omit<CustomModule, "createdAt" | "defaultTemplateText">): CustomModule {
  const all = loadAll();
  const entry: CustomModule = { ...mod, defaultTemplateText: mod.templateText, createdAt: Date.now() };
  all.push(entry);
  saveAll(all);
  return entry;
}

export function updateCustomModule(
  moduleId: string,
  updates: Partial<Omit<CustomModule, "moduleId" | "createdAt">>
): boolean {
  const all = loadAll();
  const idx = all.findIndex((m) => m.moduleId === moduleId);
  if (idx === -1) return false;
  const oldName = all[idx].moduleName;
  all[idx] = { ...all[idx], ...updates };
  saveAll(all);

  // 同步历史会话中的模块名
  if (updates.moduleName && updates.moduleName !== oldName) {
    try {
      const history = JSON.parse(localStorage.getItem("ai-philosophy-history") || "[]");
      let changed = false;
      for (const e of history) {
        if (e.moduleName === oldName) { e.moduleName = updates.moduleName; changed = true; }
      }
      if (changed) localStorage.setItem("ai-philosophy-history", JSON.stringify(history));
    } catch { /* ignore */ }
    // 同步展馆
    try {
      const sc = JSON.parse(localStorage.getItem("ai-philosophy-showcase") || "[]");
      let changed = false;
      for (const item of sc) {
        if (item.moduleName === oldName) { item.moduleName = updates.moduleName; changed = true; }
      }
      if (changed) localStorage.setItem("ai-philosophy-showcase", JSON.stringify(sc));
    } catch { /* ignore */ }
  }
  return true;
}

export function deleteCustomModule(moduleId: string): boolean {
  const all = loadAll().filter((m) => m.moduleId !== moduleId);
  if (all.length === loadAll().length) return false;
  saveAll(all);
  return true;
}

export function getCustomModule(moduleId: string): CustomModule | undefined {
  return loadAll().find((m) => m.moduleId === moduleId);
}

export function resetCustomPrompt(moduleId: string): boolean {
  const all = loadAll();
  const found = all.find((m) => m.moduleId === moduleId);
  if (!found) return false;
  found.templateText = found.defaultTemplateText;
  saveAll(all);
  return true;
}

export function saveAsDefaultPrompt(moduleId: string): boolean {
  const all = loadAll();
  const found = all.find((m) => m.moduleId === moduleId);
  if (!found) return false;
  found.defaultTemplateText = found.templateText;
  saveAll(all);
  return true;
}
