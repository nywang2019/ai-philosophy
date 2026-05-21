import { moduleConfigs } from "../modules/moduleConfig";
import type { ModuleConfig } from "../modules/moduleConfig";

interface Props {
  selectedId: string | null;
  onSelect: (config: ModuleConfig) => void;
}

const ModuleList: React.FC<Props> = ({ selectedId, onSelect }) => {
  return (
    <div className="module-list">
      <div className="module-list-header">模块列表</div>
      <div className="module-list-items">
        {moduleConfigs.map((mod) => (
          <div
            key={mod.moduleId}
            className={`module-item ${selectedId === mod.moduleId ? "active" : ""}`}
            onClick={() => onSelect(mod)}
          >
            <div className="module-item-name">{mod.moduleName}</div>
            <div className="module-item-desc">{mod.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
