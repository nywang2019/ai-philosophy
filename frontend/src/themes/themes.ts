// 主题系统 - 每套主题定义一组CSS变量
// 新增主题只需在此数组中添加

export interface Theme {
  id: string;
  name: string;
  description: string;
  // CSS变量值
  vars: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: "apple",
    name: "Apple",
    description: "简洁、清爽的浅色风格",
    vars: {
      "--bg": "#f5f5f7",
      "--text": "#1d1d1f",
      "--surface": "#ffffff",
      "--primary": "#0071e3",
      "--primary-hover": "#0060c0",
      "--border": "#d2d2d7",
      "--input-border": "#d2d2d7",
      "--hover": "#f5f5f7",
      "--active-bg": "#e8f0fe",
      "--muted": "#86868b",
      "--tag-bg": "#f5f5f7",
      "--tag-accent-bg": "#e8f0fe",
      "--tag-accent-text": "#0071e3",
      "--code-bg": "#f5f5f7",
      "--light-border": "#e8e8ed",
      "--error-bg": "#fff0f0",
      "--error-border": "#ffccc7",
      "--error-text": "#cf1322",
      "--success-bg": "#f0fff0",
      "--success-border": "#b7eb8f",
      "--success-text": "#389e0d",
      "--overlay": "rgba(0,0,0,0.4)",
      "--shadow": "0 8px 30px rgba(0,0,0,0.1)",
    },
  },
  {
    id: "tesla",
    name: "Tesla",
    description: "未来感的深色风格",
    vars: {
      "--bg": "#000000",
      "--text": "#e0e0e0",
      "--surface": "#1a1a1a",
      "--primary": "#e82127",
      "--primary-hover": "#c41a1f",
      "--border": "#333333",
      "--input-border": "#444444",
      "--hover": "#222222",
      "--active-bg": "#2a1111",
      "--muted": "#888888",
      "--tag-bg": "#222222",
      "--tag-accent-bg": "#2a1111",
      "--tag-accent-text": "#e82127",
      "--code-bg": "#111111",
      "--light-border": "#2a2a2a",
      "--error-bg": "#1a0000",
      "--error-border": "#660000",
      "--error-text": "#ff4444",
      "--success-bg": "#001a00",
      "--success-border": "#006600",
      "--success-text": "#44ff44",
      "--overlay": "rgba(0,0,0,0.7)",
      "--shadow": "0 8px 30px rgba(0,0,0,0.5)",
    },
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "温暖、人文的米色风格",
    vars: {
      "--bg": "#faf8f5",
      "--text": "#2c2c2c",
      "--surface": "#ffffff",
      "--primary": "#c75a2c",
      "--primary-hover": "#a84a20",
      "--border": "#e8e4dc",
      "--input-border": "#d4cfc4",
      "--hover": "#f5f1eb",
      "--active-bg": "#faf0e6",
      "--muted": "#8c8279",
      "--tag-bg": "#f5f1eb",
      "--tag-accent-bg": "#faf0e6",
      "--tag-accent-text": "#c75a2c",
      "--code-bg": "#f5f1eb",
      "--light-border": "#ebe6dc",
      "--error-bg": "#fef0ee",
      "--error-border": "#f4c8c2",
      "--error-text": "#b33a2e",
      "--success-bg": "#f0faf0",
      "--success-border": "#b8d9b8",
      "--success-text": "#3a7d3a",
      "--overlay": "rgba(0,0,0,0.35)",
      "--shadow": "0 8px 30px rgba(0,0,0,0.08)",
    },
  },
];

const THEME_STORAGE_KEY = "ai-philosophy-theme";
const DEFAULT_THEME = "apple";

export function getStoredTheme(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setStoredTheme(themeId: string): void {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function applyTheme(themeId: string): void {
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute("data-theme", themeId);
}

export function getThemeById(themeId: string): Theme | undefined {
  return themes.find((t) => t.id === themeId);
}
