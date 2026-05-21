import type { GenerateResult } from "../api/client";

interface Props {
  result: GenerateResult;
}

// ===== 对话气泡渲染 =====
const ChatBubbles: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const dialogues = (data.dialogues as Array<Record<string, string>>) || [];
  const summary = data.summary as string;
  const tensionPoints = data.tensionPoints as string[];

  const colors = [
    "#4a6cf7", "#e82127", "#389e0d", "#c75a2c",
    "#7c3aed", "#0891b2", "#d97706", "#db2777",
  ];

  return (
    <div className="rr-chat">
      {dialogues.map((d, i) => {
        const speaker = d.speaker || d.character || "";
        const content = d.content || d.line || "";
        const type = (d.type as string) || "";
        const color = colors[i % colors.length];

        return (
          <div key={i} className="rr-chat-msg">
            <div className="rr-chat-avatar" style={{ background: color }}>
              {speaker.slice(0, 2)}
            </div>
            <div className="rr-chat-body">
              <div className="rr-chat-speaker">
                {speaker}
                {type && <span className="rr-chat-type">{type}</span>}
              </div>
              <div className="rr-chat-content">{content}</div>
            </div>
          </div>
        );
      })}
      {summary && (
        <div className="rr-chat-summary">
          <div className="rr-label">总结</div>
          <p>{summary}</p>
        </div>
      )}
      {tensionPoints && tensionPoints.length > 0 && (
        <div className="rr-tension">
          <div className="rr-label">文学张力点</div>
          <ul>
            {tensionPoints.map((tp, i) => (
              <li key={i}>{tp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ===== 多层版本渲染 =====
const MultiVersion: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const versions: { label: string; content: string; icon: string }[] = [];

  if (data.literalTranslation) versions.push({ label: "逐字直译", content: data.literalTranslation as string, icon: "字" });
  if (data.modernTranslation) versions.push({ label: "现代白话", content: data.modernTranslation as string, icon: "白" });
  if (data.videoScript) versions.push({ label: "短视频口播", content: data.videoScript as string, icon: "播" });
  if (data.socialMedia) versions.push({ label: "社交媒体", content: data.socialMedia as string, icon: "社" });
  if (data.childVersion) versions.push({ label: "儿童版", content: data.childVersion as string, icon: "童" });
  if (data.dailyVersion) versions.push({ label: "日常生活版", content: data.dailyVersion as string, icon: "常" });
  if (data.academicVersion) versions.push({ label: "学术版", content: data.academicVersion as string, icon: "学" });
  if (data.poeticVersion) versions.push({ label: "诗意隐喻版", content: data.poeticVersion as string, icon: "诗" });

  const original = (data.original || data.concept) as string;

  return (
    <div className="rr-multi-version">
      {original && (
        <div className="rr-original">
          <div className="rr-label">原文</div>
          <p className="rr-original-text">{original}</p>
        </div>
      )}
      <div className="rr-version-grid">
        {versions.map((v, i) => (
          <div key={i} className="rr-version-card">
            <div className="rr-version-icon">{v.icon}</div>
            <div className="rr-version-label">{v.label}</div>
            <p className="rr-version-content">{v.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 时间线渲染 =====
const TimelineView: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const eras = data.eras as Array<Record<string, string>>;
  const branches = data.branches as Array<{
    name: string;
    timeline: Array<{ year: string; event: string }>;
  }>;
  const originalHistory = data.originalHistory as string;
  const idiom = data.idiom as string;
  const originalEvent = data.originalEvent as string;
  const changedVariable = data.changedVariable as string;

  // 典故时间穿越
  if (eras) {
    return (
      <div className="rr-timeline">
        <div className="rr-original">
          <div className="rr-label">典故</div>
          <p className="rr-original-text">{idiom}</p>
        </div>
        <div className="rr-timeline-track">
          {eras.map((era, i) => (
            <div key={i} className="rr-timeline-node">
              <div className="rr-timeline-dot" />
              <div className="rr-timeline-era">{era.era}</div>
              <div className="rr-timeline-card">
                <div className="rr-timeline-field">
                  <span className="rr-field-label">字面理解</span>
                  <span>{era.literalMeaning}</span>
                </div>
                <div className="rr-timeline-field">
                  <span className="rr-field-label">社会语境</span>
                  <span>{era.socialContext}</span>
                </div>
                <div className="rr-timeline-field">
                  <span className="rr-field-label">价值观解读</span>
                  <span>{era.valueInterpretation}</span>
                </div>
                <div className="rr-timeline-field">
                  <span className="rr-field-label">与现代差异</span>
                  <span>{era.modernDifference}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 历史反事实
  if (branches) {
    const branchColors = ["#4a6cf7", "#e82127", "#c75a2c"];
    const branchIcons = ["●", "▲", "◆"];
    return (
      <div className="rr-timeline">
        <div className="rr-original">
          <div className="rr-label">原始事件</div>
          <p className="rr-original-text">{originalEvent}</p>
          <div className="rr-label" style={{ marginTop: 12 }}>变量变化</div>
          <p className="rr-original-text">{changedVariable}</p>
        </div>
        {originalHistory && (
          <div className="rr-history-box">
            <div className="rr-label">真实历史</div>
            <p>{originalHistory}</p>
          </div>
        )}
        <div className="rr-branches">
          {branches.map((branch, i) => (
            <div key={i} className="rr-branch" style={{ borderLeftColor: branchColors[i] }}>
              <div className="rr-branch-header">
                <span style={{ color: branchColors[i] }}>{branchIcons[i]}</span>
                <strong>{branch.name}</strong>
              </div>
              <div className="rr-branch-timeline">
                {branch.timeline.map((t, j) => (
                  <div key={j} className="rr-branch-node">
                    <div className="rr-branch-year">{t.year}</div>
                    <div className="rr-branch-event">{t.event}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// ===== 分析报告渲染 =====
const AnalysisReport: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const imagery = data.imagery as string[];
  const emotionCurve = data.emotionCurve as Array<{
    position: string;
    value: number;
    description: string;
  }>;
  const emotionTags = data.emotionTags as string[];
  const summary = data.summary as string;
  const poem = data.poem as string;

  const narrativeStance = data.narrativeStance as string;
  const biasPoints = data.biasPoints as string[];
  const ignoredPerspectives = data.ignoredPerspectives as string[];
  const neutralRewrite = data.neutralRewrite as string;
  const originalText = data.originalText as string;

  // 诗歌情绪
  if (poem) {
    return (
      <div className="rr-analysis">
        <div className="rr-original rr-poem-box">
          <div className="rr-label">诗歌原文</div>
          <p className="rr-poem-text">{poem}</p>
        </div>
        {imagery && (
          <div className="rr-section">
            <div className="rr-section-title">核心意象</div>
            <div className="rr-chips">
              {imagery.map((img, i) => (
                <span key={i} className="rr-chip">{img}</span>
              ))}
            </div>
          </div>
        )}
        {emotionCurve && (
          <div className="rr-section">
            <div className="rr-section-title">情绪曲线</div>
            <div className="rr-emotion-curve">
              {emotionCurve.map((ec, i) => (
                <div key={i} className="rr-emotion-point">
                  <div className="rr-emotion-pos">{ec.position}</div>
                  <div className="rr-emotion-bar-wrap">
                    <div
                      className={`rr-emotion-bar ${ec.value > 0 ? "positive" : "negative"}`}
                      style={{
                        width: `${Math.abs(ec.value) * 10}%`,
                        marginLeft: ec.value < 0 ? `${50 - Math.abs(ec.value) * 10}%` : "50%",
                      }}
                    />
                  </div>
                  <div className="rr-emotion-val">
                    {ec.value > 0 ? "+" : ""}{ec.value}
                  </div>
                  <div className="rr-emotion-desc">{ec.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {emotionTags && (
          <div className="rr-section">
            <div className="rr-section-title">情绪标签</div>
            <div className="rr-chips">
              {emotionTags.map((tag, i) => (
                <span key={i} className="rr-chip rr-chip-accent">{tag}</span>
              ))}
            </div>
          </div>
        )}
        {summary && (
          <div className="rr-summary-box">
            <div className="rr-label">总结</div>
            <p>{summary}</p>
          </div>
        )}
      </div>
    );
  }

  // 偏见检测
  return (
    <div className="rr-analysis">
      {originalText && (
        <div className="rr-original">
          <div className="rr-label">分析文本</div>
          <p className="rr-original-text">{originalText}</p>
        </div>
      )}
      {narrativeStance && (
        <div className="rr-section">
          <div className="rr-section-title">叙事立场</div>
          <div className="rr-stance-box">{narrativeStance}</div>
        </div>
      )}
      {biasPoints && (
        <div className="rr-section">
          <div className="rr-section-title">偏见点分析</div>
          <ul className="rr-list">
            {biasPoints.map((bp, i) => (
              <li key={i}>{bp}</li>
            ))}
          </ul>
        </div>
      )}
      {ignoredPerspectives && (
        <div className="rr-section">
          <div className="rr-section-title">被忽略视角</div>
          <ul className="rr-list">
            {ignoredPerspectives.map((ip, i) => (
              <li key={i}>{ip}</li>
            ))}
          </ul>
        </div>
      )}
      {neutralRewrite && (
        <div className="rr-section">
          <div className="rr-section-title">中立改写</div>
          <div className="rr-rewrite-box">{neutralRewrite}</div>
        </div>
      )}
    </div>
  );
};

// ===== 商业分析渲染 =====
const BusinessProfile: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const swot = data.swot as Record<string, string[]>;
  const products = data.products as string[];
  const companyName = data.companyName as string;
  const coreConcept = data.coreConcept as string;
  const organization = data.organization as string;
  const managementStyle = data.managementStyle as string;
  const school = data.school as string;

  return (
    <div className="rr-business">
      <div className="rr-company-header">
        <div className="rr-company-icon">
          {(companyName || school || "").slice(0, 2)}
        </div>
        <div>
          <h3 className="rr-company-name">{companyName}</h3>
          <p className="rr-company-school">{school}</p>
        </div>
      </div>
      {coreConcept && (
        <div className="rr-section">
          <div className="rr-section-title">核心理念</div>
          <p className="rr-concept-text">{coreConcept}</p>
        </div>
      )}
      {products && (
        <div className="rr-section">
          <div className="rr-section-title">产品设计</div>
          <div className="rr-product-grid">
            {products.map((p, i) => (
              <div key={i} className="rr-product-card">
                <span className="rr-product-num">{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rr-org-grid">
        {organization && (
          <div className="rr-section">
            <div className="rr-section-title">组织结构</div>
            <p>{organization}</p>
          </div>
        )}
        {managementStyle && (
          <div className="rr-section">
            <div className="rr-section-title">管理风格</div>
            <p>{managementStyle}</p>
          </div>
        )}
      </div>
      {swot && (
        <div className="rr-swot">
          <div className="rr-section-title">SWOT 分析</div>
          <div className="rr-swot-grid">
            {(["strengths", "weaknesses", "opportunities", "threats"] as const).map(
              (key) => (
                <div key={key} className={`rr-swot-cell rr-swot-${key}`}>
                  <div className="rr-swot-label">
                    {key === "strengths" && "优势"}
                    {key === "weaknesses" && "劣势"}
                    {key === "opportunities" && "机会"}
                    {key === "threats" && "威胁"}
                  </div>
                  <ul>
                    {(swot[key] || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 转换结果渲染 =====
const ConversionView: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const conversions = data.conversions as Array<{
    era: string;
    text: string;
    vocabularyChanges: string[];
    toneChange: string;
  }>;
  const original = data.original as string;

  return (
    <div className="rr-conversion">
      {original && (
        <div className="rr-original">
          <div className="rr-label">原文</div>
          <p className="rr-original-text">{original}</p>
        </div>
      )}
      <div className="rr-conversion-grid">
        {conversions?.map((conv, i) => (
          <div key={i} className="rr-conversion-card">
            <div className="rr-conversion-era">{conv.era}</div>
            <p className="rr-conversion-text">{conv.text}</p>
            {conv.vocabularyChanges && (
              <div className="rr-conversion-meta">
                <span className="rr-field-label">词汇变化</span>
                <span>{conv.vocabularyChanges.join("、")}</span>
              </div>
            )}
            {conv.toneChange && (
              <div className="rr-conversion-meta">
                <span className="rr-field-label">语气变化</span>
                <span>{conv.toneChange}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 通用结构渲染（fallback） =====
const GenericStructured: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const renderValue = (value: unknown, depth: number): React.ReactNode => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      return <span className="rr-generic-string">{value}</span>;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return <span className="rr-generic-prim">{String(value)}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="rr-generic-list">
          {value.map((item, i) => (
            <div key={i} className="rr-generic-list-item">
              <span className="rr-generic-index">{i + 1}</span>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div className="rr-generic-obj" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="rr-generic-row">
              <div className="rr-generic-key">{k}</div>
              <div className="rr-generic-val">{renderValue(v, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="rr-generic">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="rr-generic-section">
          <div className="rr-generic-section-title">{key}</div>
          {renderValue(value, 0)}
        </div>
      ))}
    </div>
  );
};

// ===== 主路由 =====
const ResultRenderer: React.FC<Props> = ({ result }) => {
  const { moduleId, result: data } = result;
  const d = data as Record<string, unknown>;

  // 对话类
  if (moduleId === "philosopher_chat" || moduleId === "literary_chat") {
    return <ChatBubbles data={d} />;
  }

  // 多层版本类
  if (moduleId === "classical_translation" || moduleId === "philosophy_explainer") {
    return <MultiVersion data={d} />;
  }

  // 时间线类
  if (moduleId === "idiom_time_travel" || moduleId === "counterfactual_history") {
    return <TimelineView data={d} />;
  }

  // 分析报告类
  if (moduleId === "poetry_emotion" || moduleId === "bias_detector") {
    return <AnalysisReport data={d} />;
  }

  // 商业分析类
  if (moduleId === "philosophy_startup") {
    return <BusinessProfile data={d} />;
  }

  // 转换类
  if (moduleId === "era_filter") {
    return <ConversionView data={d} />;
  }

  // fallback
  return <GenericStructured data={d} />;
};

export default ResultRenderer;
