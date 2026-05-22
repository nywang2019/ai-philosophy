import { useMemo, useState } from "react";
import { moduleConfigs } from "../modules/moduleConfig";
import type { ModuleConfig } from "../modules/moduleConfig";
import { getAllCustomModules } from "../services/customModuleStore";

interface Props {
  selectedId: string | null;
  secondSelectedId?: string | null;
  onSelect: (config: ModuleConfig) => void;
  onTryExample?: (config: ModuleConfig) => void;
}

const ModuleList: React.FC<Props> = ({ selectedId, secondSelectedId, onSelect, onTryExample }) => {
  const allModules = useMemo(() => {
    const customs: ModuleConfig[] = getAllCustomModules().map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      icon: m.icon || "📦",
      description: m.description,
      fields: m.fields,
      _isCustom: true,
    }));
    return [...moduleConfigs, ...customs];
  }, []);

  const [tipId, setTipId] = useState<string | null>(null);

  return (
    <div className="module-list">
      <div className="module-list-header">模块列表</div>
      <div className="module-list-items">
        {allModules.map((mod) => {
          const isA = selectedId === mod.moduleId;
          const isB = secondSelectedId === mod.moduleId;
          return (
            <div
              key={mod.moduleId}
              className={`module-item ${isA ? "active" : ""} ${isB ? "second-active" : ""}`}
              onClick={() => onSelect(mod)}
            >
              <div className="module-item-name">
                <span className="module-icon">{mod.icon || "📦"}</span>
                {isA && "● "}{isB && "▲ "}{mod._isCustom ? "✦ " : ""}{mod.moduleName}
                {mod.tips && (
                  <span
                    className="module-tips-btn"
                    title="使用技巧"
                    onClick={(e) => { e.stopPropagation(); setTipId(tipId === mod.moduleId ? null : mod.moduleId); }}
                  >
                    ?
                  </span>
                )}
                {mod.example && onTryExample && (
                  <span
                    className="module-try-btn"
                    title="试用示例"
                    onClick={(e) => { e.stopPropagation(); onTryExample(mod); }}
                  >
                    💡
                  </span>
                )}
              </div>
              <div className="module-item-desc">{mod.description}</div>
              {mod.tips && tipId === mod.moduleId && (
                <div className="module-tips-pop" onClick={(e) => e.stopPropagation()}>
                  <div className="module-tips-pop-title">使用技巧</div>
                  <p>{mod.tips}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleList;
