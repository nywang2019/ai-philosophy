import { useState } from "react";
import { themes, getStoredTheme, setStoredTheme, applyTheme } from "../themes/themes";

const ThemePanel: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState(getStoredTheme());

  const handleSelect = (themeId: string) => {
    setActiveTheme(themeId);
    setStoredTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div className="settings-panel">
      <p className="settings-panel-desc">
        选择预设主题，所有页面将自动切换风格
      </p>
      <div className="theme-grid">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${activeTheme === theme.id ? "active" : ""}`}
            onClick={() => handleSelect(theme.id)}
          >
            <div className="theme-preview" data-theme={theme.id}>
              <div className="theme-preview-bar" />
              <div className="theme-preview-body">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-content">
                  <div className="theme-preview-line" />
                  <div className="theme-preview-line short" />
                </div>
              </div>
            </div>
            <div className="theme-info">
              <div className="theme-name">{theme.name}</div>
              <div className="theme-desc">{theme.description}</div>
            </div>
            {activeTheme === theme.id && (
              <div className="theme-check">&#10003;</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemePanel;
