# 文史哲AI多模块生成系统

统一的文史哲AI生成平台，将10个独立功能模块整合为一个可切换的AI应用系统。

## 功能模块

| 图标 | 模块 | 说明 |
|------|------|------|
| 🏛️ | 典故时间穿越解释器 | 对典故进行跨历史时期语境重构 |
| 💬 | 哲学家群聊模拟器 | 多位哲学家模仿原著文风的思想交锋 |
| 🔄 | 历史反事实模拟器 | 改变历史变量后的因果推演 |
| 📖 | 古文多层翻译引擎 | 5种风格转译（含校园热梗） |
| 🎭 | 诗歌情绪分析器 | 意象提取+情绪曲线+标签 |
| 🚀 | 诸子百家创业模拟器 | 思想学派转化为商业模型 |
| 🎭 | 文学角色跨作品对话器 | 不同文学宇宙的角色对话 |
| 🔮 | 时代滤镜转换器 | 文本转换为不同时代风格 |
| 💡 | 哲学概念降维解释器 | 儿童/生活/学术/诗意四层解释 |
| 🔍 | 历史叙事偏见检测器 | 叙事立场+偏见+被忽略视角分析 |

## 技术栈

- **前端**: React + Vite 5 + TypeScript，纯CSS极简风
- **后端**: Express + TypeScript
- **LLM**: OpenAI兼容API抽象层，支持配置任意API
- **存储**: localStorage全量本地存储

## 快速开始

```bash
# 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 启动后端 (端口3001)
cd backend && npx tsx src/index.ts

# 启动前端 (端口5173)
cd frontend && npm run dev
```

打开 `http://localhost:5173`，在设置中配置API endpoint、key、model后即可使用。

## 核心特性

- 三栏SPA布局：模块列表 | 输入区 | 输出区
- 10个内置模块 + 无限自定义模块
- 6种渲染模式：对话气泡/多层卡片/时间线/分析报告/商业卡片/转换卡片
- 三套主题：Apple / Tesla / Anthropic
- 系统仪表盘：20+统计指标，SVG图表，时间筛选
- 对话历史：搜索/pin/标签/收藏/笔记/批量管理
- 思考导图：SVG树形结构可视化结果
- 研究项目：会话归入项目，项目导出为Markdown文档
- 对比模式 + 批量生成
- AI自动标签 + 输入建议
- Token消耗统计
- 数据导入导出
- 语音输入（Web Speech API）
- 分享链接 + 导出（Markdown / HTML / 图片）

## 项目结构

```
ai-philosophy/
├── frontend/                  # React SPA
│   └── src/
│       ├── components/        # UI组件
│       ├── services/          # 数据服务
│       ├── modules/           # 模块配置
│       └── api/               # API客户端
├── backend/                   # Express API
│   └── src/
│       ├── prompts/           # 提示词模板
│       └── services/          # LLM服务
├── prd.md                     # 产品需求
├── Agent.md                   # 开发行为规范
├── CLAUDE.md                  # 项目配置
├── CHANGELOG.md               # 更新日志
└── devlog.md                  # 开发日志
```

## 版本

v1.0 ~ v10.0，详见 [CHANGELOG.md](CHANGELOG.md)
