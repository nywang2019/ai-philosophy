import { useState, useEffect, useCallback } from "react";
import { getAllShowcase, unpublish, type ShowcaseItem } from "../services/showcaseStore";
import { getAllHistory } from "../services/historyStore";
import ResultRenderer from "./ResultRenderer";

const KEY_CN: Record<string, string> = {
  keyword: "关键词", religion: "宗教", scripture: "经典出处", interpretation: "核心阐释",
  practice: "实践意义", comparison: "对比分析", summary: "总结", religions: "宗教分析",
  explicitEmotion: "显性情感", implicitEmotion: "隐性情感", rhetoricEmotion: "修辞情感",
  intensityCurve: "情感强度", overallAssessment: "整体评价", intensity: "强度",
  quality: "情感质地", position: "节点位置", original: "原文", literalTranslation: "逐字直译",
  modernTranslation: "现代白话", videoScript: "短视频口播", socialMedia: "社交媒体",
  campusMeme: "校园热梗", childVersion: "儿童版", dailyVersion: "日常生活版",
  academicVersion: "学术版", poeticVersion: "诗意隐喻版", idiom: "典故", eras: "时期",
  literalMeaning: "字面理解", socialContext: "社会语境", valueInterpretation: "价值观解读",
  modernDifference: "与现代差异", topic: "主题", participants: "参与者", dialogues: "对话",
  speaker: "发言者", content: "内容", type: "类型", originalEvent: "原始事件",
  changedVariable: "变量变化", originalHistory: "真实历史", branches: "分支", name: "名称",
  timeline: "时间线", year: "年份", event: "事件", poem: "诗歌", imagery: "意象",
  emotionCurve: "情绪曲线", emotionTags: "情绪标签", description: "描述",
  school: "学派", companyName: "公司名称", coreConcept: "核心理念", products: "产品",
  organization: "组织结构", managementStyle: "管理风格", swot: "SWOT分析",
  strengths: "优势", weaknesses: "劣势", opportunities: "机会", threats: "威胁",
  characters: "角色", line: "发言", tensionPoints: "张力点", text: "文本",
  conversions: "转换", era: "时代", vocabularyChanges: "词汇变化", toneChange: "语气变化",
  narrativeStance: "叙事立场", biasPoints: "偏见点", ignoredPerspectives: "被忽略视角",
  neutralRewrite: "中立改写", originalText: "分析文本", concept: "概念", work: "作品",
  topWords: "高频词", frequency: "频率", insight: "特征", featureAnalysis: "特征分析",
  word: "词语", count: "次数", percentage: "占比",
};

const cn = (k: string) => KEY_CN[k] || k;

function previewResult(obj: Record<string, unknown>): { label: string; val: string }[] {
  const lines: { label: string; val: string }[] = [];
  for (const [k, v] of Object.entries(obj).slice(0, 4)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
      const first = v[0] as Record<string, unknown>;
      const firstKey = Object.keys(first)[0];
      const firstVal = firstKey ? String(first[firstKey] || "").slice(0, 30) : "";
      lines.push({ label: cn(k), val: `[${v.length}条] ${firstVal}` });
    } else if (Array.isArray(v)) {
      lines.push({ label: cn(k), val: v.slice(0, 3).join("、") });
    } else if (typeof v === "object" && v !== null) {
      const subKeys = Object.keys(v as Record<string, unknown>).slice(0, 3).map(cn).join("·");
      lines.push({ label: cn(k), val: `{${subKeys}}` });
    } else {
      lines.push({ label: cn(k), val: String(v).slice(0, 40) });
    }
  }
  return lines;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onView: (item: ShowcaseItem) => void;
}

const ShowcasePanel: React.FC<Props> = ({ visible, onClose, onView }) => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);

  const load = useCallback(() => setItems(getAllShowcase()), []);

  useEffect(() => { if (visible) { load(); setSelectedItem(null); } }, [visible, load]);

  if (!visible) return null;

  // 模块名列表
  const modules = [...new Set(items.map(i => i.moduleName))].sort();
  const filtered = filterModule ? items.filter(i => i.moduleName === filterModule) : items;

  // 详情视图
  if (selectedItem) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
          <div className="history-header">
            <h2>{selectedItem.title}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--light-border)", display: "flex", gap: 8 }}>
            <button className="btn-save-prompt" onClick={() => setSelectedItem(null)}>返回列表</button>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center" }}>
              {selectedItem.moduleName} · {new Date(selectedItem.publishedAt).toLocaleString("zh-CN")}
            </span>
          </div>
          <div style={{ padding: 16, maxHeight: "60vh", overflow: "auto" }}>
            <ResultRenderer result={{ moduleId: selectedItem.moduleId, moduleName: selectedItem.moduleName, result: selectedItem.result, duration: 0 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2>🎨 内容展示馆</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* 模块筛选 */}
        {modules.length > 1 && (
          <div className="history-tag-filter">
            <span className={`history-filter-tag ${filterModule === null ? "active" : ""}`}
              onClick={() => setFilterModule(null)}>全部</span>
            {modules.map(m => (
              <span key={m} className={`history-filter-tag ${filterModule === m ? "active" : ""}`}
                onClick={() => setFilterModule(filterModule === m ? null : m)}>{m}</span>
            ))}
          </div>
        )}

        <div className="dash-cards" style={{ padding: 16, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtered.length === 0 && <div className="history-empty" style={{ gridColumn: "1 / -1" }}>暂无展示内容</div>}
          {filtered.map(item => (
            <div key={item.id} className="showcase-card" onClick={() => setSelectedItem(item)}>
              <div className="showcase-card-body" title="点击查看展板">
                <div className="showcase-card-title">
                  {item.historyId ? (getAllHistory().find(e => e.id === item.historyId)?.title || item.title) : item.title}
                </div>
                <div className="showcase-card-meta">
                  {item.moduleName} · {new Date(item.publishedAt).toLocaleDateString("zh-CN")}
                </div>
                <div className="showcase-card-preview">
                  {previewResult(item.result).map((line, i) => (
                    <div key={i} className="showcase-preview-line">
                      <span className="showcase-preview-key">{line.label}</span>
                      <span className="showcase-preview-val">{line.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button className="btn-save-prompt" style={{ fontSize: 11 }}
                  onClick={(e) => { e.stopPropagation(); onView(item); onClose(); }}>查看详细</button>
                <button className="btn-reset" style={{ fontSize: 11 }}
                  onClick={(e) => { e.stopPropagation(); unpublish(item.id); load(); }}>移除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShowcasePanel;
