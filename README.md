# 文史哲AI多模块生成系统

统一的文史哲AI生成平台，将10个内置模块整合为可切换的AI应用，同时支持用户创建无限自定义模块，涵盖典故、哲学、历史、文学、宗教等文史哲领域。

> **作者**：nywang2019 &nbsp;|&nbsp; **版本**：v11.0 &nbsp;|&nbsp; **许可证**：All rights reserved

## 功能模块

### 10个内置模块

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

### 自定义模块

支持用户创建和管理自定义模块，可定义：

- 模块名称、描述、图标（20种emoji可选）
- 输入字段（文本/多行文本/标签输入，任意数量和组合）
- 提示词模板（使用 `{key}` 和 `{key:json}` 占位符）
- 自定义模块与内置模块无缝融合：模块列表显示、提示词编辑器管理、仪表盘统计纳入、渲染器智能匹配

## 技术栈

- **前端**: React + Vite 5 + TypeScript，纯CSS极简风，无UI库依赖
- **后端**: Express + TypeScript
- **LLM**: OpenAI兼容API抽象层，支持配置任意API endpoint/key/model
- **存储**: localStorage全量本地存储，无数据库依赖

## 系统截图

<div align="center">
  <p align="center"><b>主页界面</b></p>
  <img src="screenshots/1.png" width="100%" alt="主页界面" />
  <br/><br/>
  <p align="center"><b>生成结果</b></p>
  <img src="screenshots/2.png" width="100%" alt="生成结果" />
  <br/><br/>
  <p align="center"><b>仪表盘全景</b></p>
  <img src="screenshots/3.png" width="100%" alt="仪表盘全景" />
  <br/><br/>
  <p align="center"><b>知识图谱</b></p>
  <img src="screenshots/4.png" width="100%" alt="知识图谱" />
  <br/><br/>
  <p align="center"><b>对话历史</b></p>
  <img src="screenshots/5.png" width="100%" alt="对话历史" />
  <br/><br/>
  <p align="center"><b>研究项目</b></p>
  <img src="screenshots/6.png" width="100%" alt="研究项目" />
  <br/><br/>
  <p align="center"><b>系统设置</b></p>
  <img src="screenshots/7.png" width="100%" alt="系统设置" />
</div>

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

### 生成能力
- 10个内置模块 + 无限自定义模块（定义字段→写提示词→即用）
- 对比模式：同输入双模块并行生成，上下分屏
- 批量模式：多行输入依次生成，结果卡片汇总
- 示例库：每个内置模块预置精彩示例，💡一键填入

### 输出体验
- 4种视图：预览（6种模块感知渲染）/ JSON / Markdown / 思维导图
- 6种渲染模式：对话气泡 / 多层卡片 / 时间线 / 分析报告 / 商业卡片 / 转换卡片
- 骨架屏加载 + 渲染错误边界守卫
- Token消耗显示（每次生成+首页累计）

### 数据管理
- 对话历史：自动保存、搜索/pin/标签/收藏/笔记/模块筛选/批量删除
- 全文搜索：跨会话搜索输入/输出/笔记，分词匹配排序
- 研究项目：创建项目→会话归入→AI生成综述→导出Markdown文档
- 跨会话知识图谱：实体提取+共现关系+SVG交互可视化
- 数据导入导出：历史会话JSON文件，导出时自动剥离API Key

### 提示词管理
- 提示词模板独立配置，支持在线编辑
- 提示词版本管理：自动存档+去重，点击恢复，支持删除和备注
- 自定义模块提示词支持设为默认和重置
- 输入建议：12个字段配datalist下拉/建议芯片，每字段20选项

### 分析仪表盘
- 30+统计指标：会话/模块/标签/项目/Token/收藏/笔记
- SVG图表：柱状图 / 折线图（含7日移动平均）/ 环形图 / 24h热力 / 每周分布
- 时间筛选：7天/30天/90天/全部
- 高频主题词 + 标签统计 + 收藏排行
- AI洞察 + 一键导出统计报告

### 主题与UI
- 三套CSS变量主题：Apple / Tesla / Anthropic
- 三栏SPA布局，响应式适配
- 极简风格，纯CSS，统一按钮和交互

### 导出与分享
- 导出格式：Markdown / HTML / 图片 / 学术引用（GB/T 7714）
- 分享链接：结果编码到URL，复制分享即查看
- 导出统计报告：一键下载含全部数据的HTML报告

### 辅助功能
- 语音输入（Web Speech API，中文识别）
- 模块图标：10个内置emoji，自定义模块20种图标
- 模块教程：10个模块"?"按钮弹出使用技巧
- 自定义模块提示词同步到提示词编辑器

## 项目结构

```
ai-philosophy/
├── frontend/                  # React SPA
│   └── src/
│       ├── components/        # UI组件（15+个）
│       ├── services/          # 数据服务（9个）
│       ├── modules/           # 模块配置
│       ├── api/               # API客户端
│       └── themes/            # 主题引擎
├── backend/                   # Express API
│   └── src/
│       ├── prompts/           # 提示词模板
│       └── services/          # LLM服务
├── prd.md                     # 产品需求
├── Agent.md                   # 开发行为规范
├── CLAUDE.md                  # 项目配置
├── CHANGELOG.md               # 版本更新日志
├── API.md                     # API接口文档
├── TEST.md                    # 人工测试验证清单
├── README.md                  # 项目说明
└── devlog.md                  # 开发日志
```

## 版本

v1.0 ~ v11.0，详见 [CHANGELOG.md](CHANGELOG.md)

---

© 2026 nywang2019. All rights reserved.
