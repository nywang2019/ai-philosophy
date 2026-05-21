# 开发日志

## 2026-05-21 - 项目初始化与核心功能开发

### 修改文件
- `CLAUDE.md` - 项目配置文件，定义文档读取顺序与核心规则
- `Agent.md` - 从docx转换的AI开发行为规范
- `backend/src/prompts/templates.ts` - 10个模块的提示词模板（独立配置）
- `backend/src/services/llmService.ts` - LLM抽象层（OpenAI兼容API）
- `backend/src/index.ts` - Express服务器 + POST /api/generate + GET /api/modules
- `frontend/src/App.tsx` - 主应用组件（状态管理、三栏布局）
- `frontend/src/App.css` - 极简风样式
- `frontend/src/components/ModuleList.tsx` - 左侧模块列表（10个模块）
- `frontend/src/components/InputPanel.tsx` - 中间动态输入表单（支持tag-input）
- `frontend/src/components/OutputPanel.tsx` - 右侧结果展示（JSON/Markdown切换）
- `frontend/src/components/SettingsModal.tsx` - API配置弹窗（endpoint/key/model）
- `frontend/src/modules/moduleConfig.ts` - 10个模块的输入字段配置
- `frontend/src/api/client.ts` - 后端API调用封装
- `frontend/src/main.tsx` - 入口文件
- `frontend/index.html` - HTML入口
- `frontend/vite.config.ts` - Vite配置（含API代理）
- `backend/tsconfig.json` - TypeScript配置
- `devlog.md` - 本文件

### 修改内容
1. 搭建项目脚手架（Vite 5 + React + TS 前端，Express + TS 后端）
2. 实现10个模块的提示词模板，每个模板支持参数注入，统一JSON输出格式
3. 实现LLM抽象层，支持OpenAI兼容API（用户可配置endpoint/apiKey/model）
4. 实现提示词路由系统：POST /api/generate 根据moduleId路由到对应模板
5. 实现三栏布局SPA：模块列表 | 输入区 | 输出区
6. 实现API配置弹窗，配置存储在localStorage，每次请求前端传给后端
7. 支持JSON/Markdown两种输出显示模式

### 风险
- 当前Node版本v20.18.0，Vite降级到5.x以兼容。未来升级Node后可升级Vite
- LLM返回的JSON可能不严格符合格式，extractJSON做了兜底处理（代码块提取+括号匹配）

### 未完成项
- 无

### 下一步建议
1. 配置API endpoint和key后在浏览器中测试各模块
2. 根据实际LLM输出效果微调提示词模板
3. 可添加Markdown渲染增强（代码高亮、表格等）

---

## 2026-05-21 - 设置功能多面板架构 + 提示词模板在线编辑

### 修改文件
- `backend/src/prompts/templates.ts` - 提示词从函数改为可编辑文本模板，支持 {key} 占位符和 {key:json} 修饰符，新增 updatePromptTemplate/resetPromptTemplate
- `backend/src/index.ts` - 新增 GET /api/prompts、PUT /api/prompts/:moduleId、POST /api/prompts/:moduleId/reset
- `frontend/src/api/client.ts` - 新增 fetchPrompts/updatePrompt/resetPrompt 接口
- `frontend/src/components/SettingsModal.tsx` - 重构为多面板架构（左侧导航 + 右侧内容），API配置和提示词模板两个面板
- `frontend/src/components/PromptEditor.tsx` - 新建提示词编辑器（模块列表 + 可编辑文本框 + 保存/重置）
- `frontend/src/App.css` - 新增设置面板、提示词编辑器样式

### 修改内容
1. 设置弹窗改为左侧导航 + 右侧内容的多面板架构，后续可方便新增设置项
2. 提示词模板从硬编码函数改为可编辑文本，通过 {key} 占位符注入参数
3. 新增提示词在线编辑功能：左侧选模块，右侧编辑文本，支持保存和重置默认
4. 后端改为可变的运行时模板存储，支持 GET/PUT/RESET 操作

### 风险
- 用户手动编辑提示词后如果语法错误可能导致LLM输出异常，提供了"重置默认"按钮作为恢复手段

### 未完成项
- 无

### 下一步建议
1. 后续如需新增设置面板（如系统主题、输出格式偏好等），只需在 panels 数组中添加一项并在 settings-content 中添加对应渲染

---

## 2026-05-21 - 系统主题 + 输出格式偏好

### 修改文件
- `frontend/src/themes/themes.ts` - 新建主题系统，Apple/Tesla/Anthropic 三套预设，CSS变量注入
- `frontend/src/components/ThemePanel.tsx` - 新建主题选择面板（预览卡片 + 即时切换）
- `frontend/src/components/OutputPrefsPanel.tsx` - 新建输出偏好面板（默认显示格式、生成详细度）
- `frontend/src/components/SettingsModal.tsx` - 新增"系统主题"和"输出偏好"两个面板
- `frontend/src/App.tsx` - 启动时加载已保存主题
- `frontend/src/components/OutputPanel.tsx` - 使用存储的默认显示格式偏好
- `frontend/src/App.css` - 全部硬编码颜色替换为CSS变量，新增主题卡片、radio组件样式

### 修改内容
1. 主题系统：Apple（浅色清爽）、Tesla（深色科技）、Anthropic（米色人文）三套预设
2. 主题切换即时生效，所有页面元素同步切换，选择持久化到 localStorage
3. 输出偏好：默认显示格式（JSON/Markdown）、生成详细度（简洁/标准/详细）
4. 偏好更改自动保存，OutputPanel启动时读取默认视图偏好
5. 设置导航栏从2项扩展为4项，后续可继续新增

### 风险
- 无

### 未完成项
- 生成详细度偏好暂存前端，未接入LLM提示词（预留后续接入）

### 下一步建议
1. 将详细度偏好注入到提示词中，实际影响LLM输出
2. 可新增"自定义主题"功能，允许用户自定义CSS变量

---

## 2026-05-21 - 输出展示高级感升级

### 修改文件
- `frontend/src/components/ResultRenderer.tsx` - 新建模块感知的富渲染引擎，6种渲染模式
- `frontend/src/components/OutputPanel.tsx` - 新增"预览"视图模式（默认），三模式切换
- `frontend/src/App.css` - 新增 ~500 行 premium 样式（对话气泡、时间线、卡片、SWOT网格等）

### 修改内容
1. 新增"预览"视图为默认展示模式，根据模块类型自动选择渲染方式：
   - 对话类 → 彩色头像 + 聊天气泡 + 类型标签 + 总结卡片
   - 多层版本类 → 2列版本卡片 + 原文高亮 + 版本图标
   - 时间线类 → 垂直时间轴 + 节点卡片 + 分支对比（典故/反事实）
   - 分析报告类 → 结构化段落 + 情绪曲线柱状图 + 标签芯片 + 改写卡片
   - 商业分析类 → 公司头像 + 产品网格 + SWOT 2x2 四象限
   - 转换类 → Era标签卡片 + 元数据列表
   - 通用 fallback → 结构化键值对 + 嵌套缩进
2. JSON/Markdown 保留为辅助视图（"预览" | "JSON" | "MD" 三按钮切换）
3. 全部渲染带 fadeIn 动画、微妙 hover 效果、统一间距体系

### 风险
- 新增模块时需要更新 ResultRenderer 的路由逻辑，否则会 fallback 到通用渲染

### 未完成项
- 无

### 下一步建议
1. 可为对话类添加打字机动画效果
2. 情绪曲线可升级为 SVG/Canvas 真实图表
