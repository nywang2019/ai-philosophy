import { useMemo, useState } from "react";
import { buildKnowledgeGraph, type GraphEntity } from "../services/knowledgeGraph";
import { getAllHistory, type HistoryEntry } from "../services/historyStore";

const CAT_COLORS: Record<string, string> = {
  person: "#4a6cf7", concept: "#e82127", event: "#389e0d", text: "#c75a2c", tag: "#7c3aed",
};

interface Props {
  onSelectEntry?: (entry: HistoryEntry) => void;
}

const KnowledgeGraphView: React.FC<Props> = ({ onSelectEntry }) => {
  const graph = useMemo(() => buildKnowledgeGraph(), []);
  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);
  const [relatedSessions, setRelatedSessions] = useState<HistoryEntry[]>([]);

  if (graph.entities.length === 0) {
    return <div className="dash-empty">数据太少，至少需要2条会话才能构建图谱</div>;
  }

  const cx = 300; const cy = 250; const radius = 200;
  const nodes = graph.entities.map((e, i) => {
    const angle = (i / graph.entities.length) * Math.PI * 2 - Math.PI / 2;
    return { entity: e, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  const maxSize = Math.max(...graph.entities.map(e => e.count), 1);
  const maxWeight = Math.max(...graph.edges.map(e => e.weight), 1);

  const handleNodeClick = (entity: GraphEntity) => {
    setSelectedEntity(entity);
    const all = getAllHistory();
    const sessions = all.filter(e => entity.sessionIds.includes(e.id));
    setRelatedSessions(sessions);
  };

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <svg viewBox="0 0 600 500" width={600} height={500} style={{ background: "var(--code-bg)", borderRadius: 8, flex: "0 0 600px" }}>
        {graph.edges.map((edge, i) => {
          const s = nodes.find(n => n.entity.id === edge.source);
          const t = nodes.find(n => n.entity.id === edge.target);
          if (!s || !t) return null;
          return (
            <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="var(--border)" strokeWidth={1 + (edge.weight / maxWeight) * 3}
              opacity={0.3 + (edge.weight / maxWeight) * 0.4} />
          );
        })}
        {nodes.map(n => {
          const r = 10 + (n.entity.count / maxSize) * 20;
          const isSel = selectedEntity?.id === n.entity.id;
          return (
            <g key={n.entity.id} style={{ cursor: "pointer" }}
              onClick={() => handleNodeClick(n.entity)}>
              <circle cx={n.x} cy={n.y} r={r} fill={CAT_COLORS[n.entity.category]} opacity={isSel ? 1 : 0.85}
                stroke={isSel ? "var(--text)" : "none"} strokeWidth={isSel ? 2 : 0} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={Math.min(13, r / 1.5)} fontWeight="600">{n.entity.count}</text>
              <text x={n.x} y={n.y + r + 8} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
                {n.entity.name.length > 5 ? n.entity.name.slice(0, 5) + "…" : n.entity.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 关联会话列表 */}
      {selectedEntity && (
        <div style={{ flex: 1, minWidth: 200, maxHeight: 500, overflow: "auto" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            {selectedEntity.name} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({relatedSessions.length} 条会话)</span>
          </div>
          {relatedSessions.length === 0 ? (
            <div className="dash-empty">无关联会话</div>
          ) : (
            relatedSessions.map(s => (
              <div key={s.id} className="search-result-item"
                onClick={() => onSelectEntry?.(s)}>
                <div className="search-result-title">
                  {s.pinned && "📌 "}{s.favorite && "⭐ "}{s.title}
                </div>
                <div className="search-result-meta">{s.moduleName}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphView;
