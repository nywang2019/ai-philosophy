// 自定义模块存储 - localStorage 持久化
import type { ModuleField } from "../modules/moduleConfig";

export interface CustomModule {
  moduleId: string;
  moduleName: string;
  description: string;
  fields: ModuleField[];
  templateText: string;
  createdAt: number;
}

const STORAGE_KEY = "ai-philosophy-custom-modules";

function loadAll(): CustomModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CustomModule[];
  } catch { /* ignore */ }
  return [];
}

function saveAll(mods: CustomModule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
}

export function getAllCustomModules(): CustomModule[] {
  return loadAll();
}

export function addCustomModule(mod: Omit<CustomModule, "createdAt">): CustomModule {
  const all = loadAll();
  const entry: CustomModule = { ...mod, createdAt: Date.now() };
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
  all[idx] = { ...all[idx], ...updates };
  saveAll(all);
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
