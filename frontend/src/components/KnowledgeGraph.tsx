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

      {/* 右侧面板 */}
      <div style={{ flex: 1, minWidth: 200, maxHeight: 500, overflow: "auto" }}>
        {selectedEntity ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {selectedEntity.name} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({relatedSessions.length} 条会话)</span>
              </div>
              <button className="btn-reset" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => { setSelectedEntity(null); setRelatedSessions([]); }}>返回图谱</button>
            </div>
            {relatedSessions.length === 0 ? (
              <div className="dash-empty">无关联会话</div>
            ) : (
              relatedSessions.map(s => (
                <div key={s.id} className="search-result-item" onClick={() => onSelectEntry?.(s)}>
                  <div className="search-result-title">{s.pinned && "📌 "}{s.favorite && "⭐ "}{s.title}</div>
                  <div className="search-result-meta">{s.moduleName}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text-secondary)" }}>
              📊 实体排行
              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400, marginLeft: 6 }}>
                {graph.entities.length} 个实体 · {graph.edges.length} 条关系
              </span>
            </div>
            {[...graph.entities].sort((a, b) => b.count - a.count).slice(0, 10).map((e, i) => (
              <div key={e.id} className="search-result-item" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => handleNodeClick(e)}>
                <span style={{ fontSize: 11, fontWeight: 600, color: CAT_COLORS[e.category], minWidth: 20 }}>
                  {i + 1}.
                </span>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.name}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{e.count}次</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, textAlign: "center" }}>点击条目在图谱中定位</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
