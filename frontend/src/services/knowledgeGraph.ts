// 跨会话知识图谱 - 实体提取+共现关系构建
import { getAllHistory } from "./historyStore";

export interface GraphEntity {
  id: string;
  name: string;
  category: "person" | "concept" | "event" | "text" | "tag";
  count: number;
  sessionIds: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface KnowledgeGraph {
  entities: GraphEntity[];
  edges: GraphEdge[];
}

// 已知实体词典（匹配用户关心的文史哲实体）
const KNOWN_ENTITIES: { name: string; category: GraphEntity["category"] }[] = [
  { name: "孔子", category: "person" }, { name: "老子", category: "person" }, { name: "庄子", category: "person" },
  { name: "孟子", category: "person" }, { name: "墨子", category: "person" }, { name: "韩非子", category: "person" },
  { name: "王阳明", category: "person" }, { name: "苏格拉底", category: "person" }, { name: "柏拉图", category: "person" },
  { name: "亚里士多德", category: "person" }, { name: "康德", category: "person" }, { name: "尼采", category: "person" },
  { name: "萨特", category: "person" }, { name: "维特根斯坦", category: "person" }, { name: "福柯", category: "person" },
  { name: "林黛玉", category: "person" }, { name: "贾宝玉", category: "person" }, { name: "孙悟空", category: "person" },
  { name: "哈姆雷特", category: "person" }, { name: "堂吉诃德", category: "person" },
  { name: "道法自然", category: "concept" }, { name: "存在先于本质", category: "concept" }, { name: "知行合一", category: "concept" },
  { name: "物自体", category: "concept" }, { name: "超人", category: "concept" }, { name: "权力意志", category: "concept" },
  { name: "我思故我在", category: "concept" }, { name: "此在", category: "concept" }, { name: "无为之治", category: "concept" },
  { name: "赤壁之战", category: "event" }, { name: "秦始皇统一六国", category: "event" }, { name: "文艺复兴", category: "event" },
  { name: "法国大革命", category: "event" }, { name: "工业革命", category: "event" }, { name: "五四运动", category: "event" },
  { name: "辛亥革命", category: "event" }, { name: "丝绸之路", category: "event" },
  { name: "道德经", category: "text" }, { name: "论语", category: "text" }, { name: "红楼梦", category: "text" },
  { name: "西游记", category: "text" }, { name: "史记", category: "text" },
];

export function buildKnowledgeGraph(): KnowledgeGraph {
  const all = getAllHistory();
  if (all.length < 2) return { entities: [], edges: [] };

  const entityMap = new Map<string, GraphEntity>();

  // 1. 从已知词典匹配
  for (const kn of KNOWN_ENTITIES) {
    for (const e of all) {
      const inputText = JSON.stringify(e.inputs);
      const resultText = JSON.stringify(e.result);
      const combined = inputText + resultText;
      if (combined.includes(kn.name)) {
        if (!entityMap.has(kn.name)) {
          entityMap.set(kn.name, { id: kn.name, name: kn.name, category: kn.category, count: 0, sessionIds: [] });
        }
        const ge = entityMap.get(kn.name)!;
        ge.count++;
        if (!ge.sessionIds.includes(e.id)) ge.sessionIds.push(e.id);
      }
    }
  }

  // 2. 从输入文本提取高频词（2-5字，按分隔符拆分）
  const delimiters = /[·，。！？、：；\s→—\-…,.!?\n]+/;
  const stopWords = new Set(["的","了","在","是","我","有","和","就","不","人","都","一","个","上","也","很","到","说","要","去","你","会","着","没有","看","好","自己","这","他","她","它","们","那","些","什么","怎么","如何","为什么","因为","所以","但是","如果","可以","已经","还","又","再","才","刚","就","只","被","把","从","让","对","与","或","等","及","其","为","而","之","以","于","则","所","者","也","哉","乎","矣","焉","耳","里路云"]);

  const freqMap = new Map<string, number>();
  for (const e of all) {
    for (const v of Object.values(e.inputs)) {
      if (typeof v === "string" && v.trim()) {
        const parts = v.split(delimiters).filter(p => p.length >= 2 && p.length <= 5 && !stopWords.has(p) && /[一-龥]/.test(p));
        for (const p of parts) freqMap.set(p, (freqMap.get(p) || 0) + 1);
      }
    }
  }
  // 取Top 15高频词作为实体
  const topWords = [...freqMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [w, c] of topWords) {
    if (!entityMap.has(w) && c >= 1) {
      entityMap.set(w, { id: w, name: w, category: "concept", count: c, sessionIds: [] });
      for (const e of all) {
        if (JSON.stringify(e.inputs).includes(w)) {
          const ge = entityMap.get(w)!;
          if (!ge.sessionIds.includes(e.id)) ge.sessionIds.push(e.id);
        }
      }
    }
  }

  const entities = [...entityMap.values()].filter(e => e.count >= 1);

  // 构建边（共现关系）
  const edgeMap = new Map<string, number>();
  for (const e of all) {
    const involved = entities.filter(en => en.sessionIds.includes(e.id));
    for (let i = 0; i < involved.length; i++) {
      for (let j = i + 1; j < involved.length; j++) {
        const key = [involved[i].id, involved[j].id].sort().join("|||");
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      }
    }
  }

  const edges: GraphEdge[] = [...edgeMap.entries()]
    .filter(([, w]) => w >= 1)
    .map(([key, weight]) => {
      const [s, t] = key.split("|||");
      return { source: s, target: t, weight };
    });

  return { entities: entities.slice(0, 40), edges };
}
