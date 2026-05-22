import { useMemo } from "react";
import { moduleConfigs } from "../modules/moduleConfig";
import type { ModuleConfig } from "../modules/moduleConfig";
import { getAllCustomModules } from "../services/customModuleStore";

interface Props {
  selectedId: string | null;
  secondSelectedId?: string | null;
  onSelect: (config: ModuleConfig) => void;
}

const ModuleList: React.FC<Props> = ({ selectedId, secondSelectedId, onSelect }) => {
  const allModules = useMemo(() => {
    const customs: ModuleConfig[] = getAllCustomModules().map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      description: m.description,
      fields: m.fields,
      _isCustom: true,
    }));
    return [...moduleConfigs, ...customs];
  }, []);

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
                {isA && "● "}{isB && "▲ "}{mod._isCustom ? "✦ " : ""}{mod.moduleName}
              </div>
              <div className="module-item-desc">{mod.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleList;
