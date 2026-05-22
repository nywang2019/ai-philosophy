// 10个模块的输入字段定义

export interface ModuleField {
  key: string;
  label: string;
  type: "text" | "textarea" | "tag-input";
  placeholder?: string;
}

export interface ModuleConfig {
  moduleId: string;
  moduleName: string;
  description: string;
  fields: ModuleField[];
  _isCustom?: boolean;
}

export const moduleConfigs: ModuleConfig[] = [
  {
    moduleId: "idiom_time_travel",
    moduleName: "典故时间穿越解释器",
    description: "对典故进行跨历史时期语境重构解释",
    fields: [
      { key: "idiom", label: "典故", type: "text", placeholder: "如：郑人买履" },
      { key: "eras", label: "历史时期", type: "tag-input", placeholder: "输入时期后回车添加" },
    ],
  },
  {
    moduleId: "philosopher_chat",
    moduleName: "哲学家群聊模拟器",
    description: "模拟多位哲学家进行群聊对话",
    fields: [
      { key: "philosophers", label: "哲学家", type: "tag-input", placeholder: "输入名字后回车添加" },
      { key: "question", label: "讨论问题", type: "textarea", placeholder: "如：人生的意义是什么？" },
    ],
  },
  {
    moduleId: "counterfactual_history",
    moduleName: "历史反事实模拟器",
    description: "基于变量变化进行反事实历史推演",
    fields: [
      { key: "event", label: "历史事件", type: "text", placeholder: "如：赤壁之战曹操败北" },
      { key: "changedVariable", label: "变量变化", type: "text", placeholder: "如：曹操军中有神医阻止了瘟疫" },
    ],
  },
  {
    moduleId: "classical_translation",
    moduleName: "古文多层翻译引擎",
    description: "对古文进行直译、白话、短视频等多层转换",
    fields: [
      { key: "text", label: "古文文本", type: "textarea", placeholder: "如：学而时习之，不亦说乎" },
    ],
  },
  {
    moduleId: "poetry_emotion",
    moduleName: "诗歌情绪分析器",
    description: "提取诗歌意象并分析情绪曲线",
    fields: [
      { key: "poem", label: "诗歌文本", type: "textarea", placeholder: "如：床前明月光，疑是地上霜" },
    ],
  },
  {
    moduleId: "philosophy_startup",
    moduleName: "诸子百家创业模拟器",
    description: "将思想学派转化为现代创业公司",
    fields: [
      { key: "school", label: "学派名称", type: "text", placeholder: "如：儒家、道家、墨家" },
    ],
  },
  {
    moduleId: "literary_chat",
    moduleName: "文学角色跨作品对话器",
    description: "模拟不同文学角色进行跨作品对话",
    fields: [
      { key: "characters", label: "角色列表", type: "tag-input", placeholder: "输入角色后回车添加" },
      { key: "topic", label: "讨论主题", type: "text", placeholder: "如：爱情的本质" },
    ],
  },
  {
    moduleId: "era_filter",
    moduleName: "时代滤镜转换器",
    description: "将文本转换为不同历史时代的语言风格",
    fields: [
      { key: "text", label: "原文", type: "textarea", placeholder: "如：我觉得今天天气很好" },
      { key: "eras", label: "目标时代", type: "tag-input", placeholder: "输入时代后回车添加" },
    ],
  },
  {
    moduleId: "philosophy_explainer",
    moduleName: "哲学概念降维解释器",
    description: "对哲学概念进行多层次解释",
    fields: [
      { key: "concept", label: "哲学概念", type: "text", placeholder: "如：存在先于本质" },
    ],
  },
  {
    moduleId: "bias_detector",
    moduleName: "历史叙事偏见检测器",
    description: "分析历史文本中的叙事偏见和忽略视角",
    fields: [
      { key: "text", label: "历史文本", type: "textarea", placeholder: "如：秦始皇统一六国..." },
    ],
  },
];

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return moduleConfigs.find((m) => m.moduleId === moduleId);
}
