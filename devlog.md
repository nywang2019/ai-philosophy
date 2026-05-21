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
