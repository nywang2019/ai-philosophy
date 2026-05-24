// 提示词版本管理 - localStorage 持久化

export interface PromptVersion {
  versionId: string;
  templateText: string;
  timestamp: number;
  note: string;
}

interface ModuleVersions {
  moduleId: string;
  versions: PromptVersion[];
}

const STORAGE_KEY = "ai-philosophy-prompt-versions";

function loadAll(): ModuleVersions[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ModuleVersions[] : [];
  } catch { return []; }
}

function saveAll(data: ModuleVersions[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 保存新版本（自动上限10个）
export function saveVersion(moduleId: string, templateText: string): PromptVersion {
  const all = loadAll();
  let mod = all.find(m => m.moduleId === moduleId);
  if (!mod) {
    mod = { moduleId, versions: [] };
    all.push(mod);
  }
  // 内容与最新版本相同时跳过，避免重复存档
  if (mod.versions.length > 0 && mod.versions[0].templateText === templateText) {
    return mod.versions[0];
  }
  const version: PromptVersion = {
    versionId: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    templateText,
    timestamp: Date.now(),
    note: "",
  };
  mod.versions.unshift(version);
  if (mod.versions.length > 10) mod.versions = mod.versions.slice(0, 10);
  saveAll(all);
  return version;
}

// 获取所有版本
export function getVersions(moduleId: string): PromptVersion[] {
  const mod = loadAll().find(m => m.moduleId === moduleId);
  return mod?.versions || [];
}

// 获取最新版本
export function getLatestVersion(moduleId: string): PromptVersion | undefined {
  const versions = getVersions(moduleId);
  return versions[0];
}

export function deleteVersion(moduleId: string, versionId: string): void {
  const all = loadAll();
  const mod = all.find(m => m.moduleId === moduleId);
  if (!mod) return;
  mod.versions = mod.versions.filter(v => v.versionId !== versionId);
  saveAll(all);
}

export function updateVersionNote(moduleId: string, versionId: string, note: string): void {
  const all = loadAll();
  const mod = all.find(m => m.moduleId === moduleId);
  if (!mod) return;
  const v = mod.versions.find(v => v.versionId === versionId);
  if (v) { v.note = note; saveAll(all); }
}
