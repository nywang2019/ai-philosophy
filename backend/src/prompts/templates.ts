// 提示词模板配置 - 所有模板独立管理，支持运行时编辑
// 模板文本使用 {key} 占位符，运行时注入参数
// {key} 用于普通值，{key:json} 用于JSON序列化，数组默认用"、"连接

export interface PromptTemplate {
  moduleId: string;
  moduleName: string;
  templateText: string;
}

// 默认模板（不可变，用于重置）
const defaultTemplates: Record<string, PromptTemplate> = {
  idiom_time_travel: {
    moduleId: "idiom_time_travel",
    moduleName: "典故时间穿越解释器",
    templateText: `你是一位历史语义学家与文化解释者。

任务：
对一个典故进行"跨历史时期语境重构解释"。

输入：
典故：{idiom}
历史时期：{eras}

要求：
1. 对每个历史时期分别输出：
   - 字面理解
   - 社会语境
   - 价值观解读
   - 与现代差异
2. 输出必须结构化JSON格式
3. 禁止泛泛而谈
4. 使用学术性表达

请严格按照以下JSON格式输出：
{
  "idiom": "{idiom}",
  "eras": [
    {
      "era": "时期名称",
      "literalMeaning": "字面理解",
      "socialContext": "社会语境",
      "valueInterpretation": "价值观解读",
      "modernDifference": "与现代差异"
    }
  ]
}`,
  },

  philosopher_chat: {
    moduleId: "philosopher_chat",
    moduleName: "哲学家群聊模拟器",
    templateText: `你是一位哲学史研究者，同时扮演多位哲学家进行群聊模拟。

参与角色：
{philosophers}

讨论问题：
{question}

要求：
1. 每位哲学家必须保持思想一致性
2. 必须包含观点冲突
3. 至少出现一次反驳
4. 输出格式必须类似聊天记录
5. 最后输出"未达成共识总结"

请严格按照以下JSON格式输出：
{
  "topic": "{question}",
  "participants": {philosophers:json},
  "dialogues": [
    {
      "speaker": "发言者",
      "content": "发言内容",
      "type": "陈述/反驳/提问"
    }
  ],
  "summary": "未达成共识总结"
}`,
  },

  counterfactual_history: {
    moduleId: "counterfactual_history",
    moduleName: "历史反事实模拟器",
    templateText: `你是一位历史推演建模专家。

任务：
进行反事实历史推演。

输入：
历史事件：{event}
变量变化：{changedVariable}

要求：
1. 先描述真实历史路径
2. 再描述变量改变后的直接影响
3. 必须生成三条不同发展分支：
   - 保守路径
   - 激进路径
   - 黑天鹅路径
4. 每条路径必须包含时间线节点

请严格按照以下JSON格式输出：
{
  "originalEvent": "{event}",
  "changedVariable": "{changedVariable}",
  "originalHistory": "真实历史概述",
  "branches": [
    {
      "name": "保守/激进/黑天鹅",
      "timeline": [
        { "year": "年份", "event": "事件描述" }
      ]
    }
  ]
}`,
  },

  classical_translation: {
    moduleId: "classical_translation",
    moduleName: "古文多层翻译引擎",
    templateText: `你是一位语言学家与内容改写专家。

任务：
对古文进行多层风格转换。

输入：
{text}

输出：
1. 逐字直译
2. 现代白话翻译
3. 短视频口播版本
4. 社交媒体传播版本

要求：
- 保持核心语义一致
- 不同版本风格差异明显
- 输出结构固定

请严格按照以下JSON格式输出：
{
  "original": "{text}",
  "literalTranslation": "逐字直译",
  "modernTranslation": "现代白话翻译",
  "videoScript": "短视频口播版本",
  "socialMedia": "社交媒体传播版本"
}`,
  },

  poetry_emotion: {
    moduleId: "poetry_emotion",
    moduleName: "诗歌情绪分析器",
    templateText: `你是一位文学分析与情绪建模专家。

输入诗歌：
{poem}

任务：
1. 提取核心意象
2. 分析情绪变化
3. 输出情绪曲线
4. 输出情绪标签
5. 给出整体总结

要求：
- 输出必须结构化
- 情绪曲线必须数值化
- 使用文学分析语言

请严格按照以下JSON格式输出：
{
  "poem": "{poem}",
  "imagery": ["意象1", "意象2"],
  "emotionCurve": [
    { "position": "起始/中段/结尾", "value": -5到5, "description": "情绪描述" }
  ],
  "emotionTags": ["标签1", "标签2"],
  "summary": "整体总结"
}`,
  },

  philosophy_startup: {
    moduleId: "philosophy_startup",
    moduleName: "诸子百家创业模拟器",
    templateText: `你是一位商业策略师与中国思想史专家。

任务：
将思想学派转化为创业公司。

输入：
学派：{school}

输出：
1. 公司名称
2. 核心理念
3. 产品设计
4. 组织结构
5. 管理风格
6. SWOT分析

要求：
- 必须忠于原学派思想
- 必须具备商业逻辑
- 输出结构化

请严格按照以下JSON格式输出：
{
  "school": "{school}",
  "companyName": "公司名称",
  "coreConcept": "核心理念",
  "products": ["产品1", "产品2"],
  "organization": "组织结构描述",
  "managementStyle": "管理风格描述",
  "swot": {
    "strengths": ["优势"],
    "weaknesses": ["劣势"],
    "opportunities": ["机会"],
    "threats": ["威胁"]
  }
}`,
  },

  literary_chat: {
    moduleId: "literary_chat",
    moduleName: "文学角色跨作品对话器",
    templateText: `你是一位文学人格建模与叙事生成专家。

任务：
模拟不同文学角色进行跨作品对话。

输入：
角色列表：{characters}
主题：{topic}

要求：
1. 每个角色必须符合原作品性格
2. 必须出现价值观冲突
3. 至少出现一次误解或讽刺
4. 最后总结"文学张力点"
5. 输出必须为剧本格式

请严格按照以下JSON格式输出：
{
  "topic": "{topic}",
  "characters": {characters:json},
  "dialogues": [
    {
      "character": "角色名",
      "line": "发言内容"
    }
  ],
  "tensionPoints": ["张力点1", "张力点2"],
  "summary": "总结"
}`,
  },

  era_filter: {
    moduleId: "era_filter",
    moduleName: "时代滤镜转换器",
    templateText: `你是一位语言风格迁移专家。

任务：
将文本转换为不同历史时代风格。

输入：
文本：{text}
目标时代：{eras}

输出：
1. 不同时代版本
2. 词汇变化说明
3. 语气变化说明

要求：
- 风格差异必须明显
- 保持核心语义一致
- 输出结构固定

请严格按照以下JSON格式输出：
{
  "original": "{text}",
  "conversions": [
    {
      "era": "时代名称",
      "text": "转换后文本",
      "vocabularyChanges": ["词汇变化说明"],
      "toneChange": "语气变化说明"
    }
  ]
}`,
  },

  philosophy_explainer: {
    moduleId: "philosophy_explainer",
    moduleName: "哲学概念降维解释器",
    templateText: `你是一位哲学教育与传播专家。

任务：
对哲学概念进行多层次解释。

输入：
哲学概念：{concept}

输出：
1. 儿童版解释
2. 日常生活版解释
3. 学术版解释
4. 诗意隐喻版解释

要求：
- 保持核心概念一致
- 各层次表达差异明显

请严格按照以下JSON格式输出：
{
  "concept": "{concept}",
  "childVersion": "儿童版解释",
  "dailyVersion": "日常生活版解释",
  "academicVersion": "学术版解释",
  "poeticVersion": "诗意隐喻版解释"
}`,
  },

  bias_detector: {
    moduleId: "bias_detector",
    moduleName: "历史叙事偏见检测器",
    templateText: `你是一位历史学方法论与叙事分析专家。

任务：
分析历史文本中的叙事偏见。

输入：
{text}

输出：
1. 叙事立场识别
2. 偏见点分析
3. 被忽略视角
4. 中立改写建议

要求：
- 分析必须有依据
- 禁止空泛评价
- 输出必须结构化

请严格按照以下JSON格式输出：
{
  "originalText": "{text}",
  "narrativeStance": "叙事立场识别",
  "biasPoints": ["偏见点1", "偏见点2"],
  "ignoredPerspectives": ["被忽略视角1", "被忽略视角2"],
  "neutralRewrite": "中立改写版本"
}`,
  },
};

// 运行时模板存储（初始化为默认模板的副本）
const templates: Record<string, PromptTemplate> = {};
for (const [key, tmpl] of Object.entries(defaultTemplates)) {
  templates[key] = { ...tmpl };
}

// 参数注入：将 {key} 和 {key:json} 替换为实际值
function injectParams(
  templateText: string,
  inputs: Record<string, unknown>
): string {
  return templateText.replace(
    /\{(\w+)(?::(json))?\}/g,
    (_match, key: string, modifier: string) => {
      const value = inputs[key];
      if (value === undefined || value === null) return `{${key}}`;

      if (modifier === "json") {
        return JSON.stringify(value);
      }

      if (Array.isArray(value)) {
        return value.join("、");
      }

      return String(value);
    }
  );
}

export function getTemplate(moduleId: string): {
  moduleId: string;
  moduleName: string;
  buildPrompt: (inputs: Record<string, unknown>) => string;
} | undefined {
  const tmpl = templates[moduleId];
  if (!tmpl) return undefined;
  return {
    moduleId: tmpl.moduleId,
    moduleName: tmpl.moduleName,
    buildPrompt: (inputs) => injectParams(tmpl.templateText, inputs),
  };
}

export function getAllModules(): { moduleId: string; moduleName: string }[] {
  return Object.values(templates).map(({ moduleId, moduleName }) => ({
    moduleId,
    moduleName,
  }));
}

// 获取所有提示词模板（用于编辑器）
export function getAllPromptTemplates(): PromptTemplate[] {
  return Object.values(templates).map((t) => ({ ...t }));
}

// 更新单个提示词模板
export function updatePromptTemplate(
  moduleId: string,
  templateText: string
): boolean {
  if (!templates[moduleId]) return false;
  templates[moduleId].templateText = templateText;
  return true;
}

// 重置为默认模板
export function resetPromptTemplate(moduleId: string): boolean {
  if (!defaultTemplates[moduleId]) return false;
  templates[moduleId].templateText = defaultTemplates[moduleId].templateText;
  return true;
}
