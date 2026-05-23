// 研究项目存储 - localStorage 持久化

export interface ResearchProject {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai-philosophy-projects";
const ACTIVE_KEY = "ai-philosophy-active-project";

function loadAll(): ResearchProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ResearchProject[];
  } catch { /* ignore */ }
  return [];
}

function saveAll(projects: ResearchProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const PROJECT_ICONS = ["📚","🔬","📝","🎓","💡","🏛️","🌿","⚡","🎯","🔮","📖","🧩"];

export function createProject(name: string, description: string): ResearchProject {
  const all = loadAll();
  const used = new Set(all.map(p => p.icon));
  const icon = PROJECT_ICONS.find(i => !used.has(i)) || "📚";
  const project: ResearchProject = {
    id: "proj_" + Date.now().toString(36),
    name,
    description,
    icon,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  all.push(project);
  saveAll(all);
  return project;
}

export function updateProject(id: string, updates: Partial<Pick<ResearchProject, "name" | "description" | "icon">>): boolean {
  const all = loadAll();
  const found = all.find(p => p.id === id);
  if (!found) return false;
  Object.assign(found, updates, { updatedAt: Date.now() });
  saveAll(all);
  return true;
}

export function deleteProject(id: string): void {
  const all = loadAll().filter(p => p.id !== id);
  saveAll(all);
  // 清除活跃项目
  if (getActiveProjectId() === id) clearActiveProject();
}

export function getAllProjects(): ResearchProject[] {
  return loadAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id: string): ResearchProject | undefined {
  return loadAll().find(p => p.id === id);
}

// 活跃项目（当前正在使用的研究项目）
export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProject(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function clearActiveProject(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

export function getActiveProject(): ResearchProject | undefined {
  const id = getActiveProjectId();
  return id ? getProject(id) : undefined;
}
