import KnowledgeGraphView from "./KnowledgeGraph";
import type { HistoryEntry } from "../services/historyStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectEntry?: (entry: HistoryEntry) => void;
}

const KnowledgeGraphPanel: React.FC<Props> = ({ visible, onClose, onSelectEntry }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2>🕸️ 知识图谱</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#4a6cf7" }}>● 人物</span>
            <span style={{ fontSize: 11, color: "#e82127" }}>● 概念</span>
            <span style={{ fontSize: 11, color: "#389e0d" }}>● 事件</span>
            <span style={{ fontSize: 11, color: "#c75a2c" }}>● 作品</span>
          </div>
          <KnowledgeGraphView onSelectEntry={onSelectEntry} />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphPanel;
