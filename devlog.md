# 开发日志

## 2026-05-25 - v12.0 全文搜索高亮 + 多模态视觉 + 展馆系统 + 多模型配置 + 数据全量同步

### 修改文件
- `frontend/src/services/searchHistory.ts` - 新增highlightedSnippet字段，HTML转义+<mark>标签包装匹配词
- `frontend/src/components/SearchPanel.tsx` - 摘要改为dangerouslySetInnerHTML渲染高亮HTML
- `frontend/src/services/imageStore.ts` - 新建，IndexedDB图片存储（保存/读取/删除/列举），Canvas压缩800px+JPEG 0.7
- `frontend/src/services/showcaseStore.ts` - 新建，展馆CRUD（发布/列表/删除），含发布时间和历史ID
- `frontend/src/components/ImageManager.tsx` - 新建，图片管理器（上传/预览/管理）
- `frontend/src/components/ShowcasePanel.tsx` - 新建，展馆面板（卡片网格/结构化预览/查看详细/查看原图）
- `frontend/src/components/InputPanel.tsx` - 新增image类型字段，ImagePreview异步加载+ImagePicker缩略图复用
- `frontend/src/components/SettingsModal.tsx` - 完全重写，多文本模型+多视觉模型独立配置，radio单选激活
- `frontend/src/App.tsx` - loadConfig适配多模型存储，doGenerate集成IndexedDB图片解析+多模态配置检测
- `frontend/src/App.css` - 新增search-result-snippet mark高亮样式，展馆/图片管理/多模型配置样式
- `frontend/src/components/Dashboard.tsx` - 默认7天，新增展馆/知识图谱/自定义模块/多模态/图片统计卡片
- `frontend/src/components/OutputPanel.tsx` - Token消耗显示，展馆发布按钮+已发布标记
- `frontend/src/components/HistoryPanel.tsx` - 面板打开时清空搜索和模块筛选
- `frontend/src/components/PromptEditor.tsx` - 侧栏直接读取getAllCustomModules，handleSelect降级查找
- `frontend/src/components/KnowledgeGraph.tsx` - 实体排行榜，useMemo排序修复
- `frontend/src/components/ModuleList.tsx` - 移除useMemo缓存，直接读取自定义模块保证实时更新
- `frontend/src/services/customModuleStore.ts` - syncModuleNames()全量同步，updateCustomModule即时联动历史+展馆
- `frontend/src/services/historyStore.ts` - deleteHistory/deleteHistories/deleteAllHistory联动清理展馆
- `frontend/src/services/analytics.ts` - 新增展馆/知识图谱/自定义模块/多模态/提示词版本统计字段
- `backend/src/services/llmService.ts` - callMultimodalLLM(OpenAI Vision)+callDashScopeMultimodal(通义千问原生API)
- `backend/src/index.ts` - express.json limit 50mb，多模态路由检测，usage返回
- `CHANGELOG.md` - v12.0更新日志
- `README.md` - v12.0版本号和功能更新
- `TEST.md` - v12.0测试清单和验证结果
- `devlog.md` - 本文件

### 修改内容
参见 CHANGELOG.md v12.0 条目

### 风险
- 多模态视觉模型依赖DashScope原生API，非OpenAI兼容格式，切换其他视觉模型需新增适配函数
- IndexedDB图片存储无上限控制，大量图片可能占满浏览器配额
- 展馆数据全量存localStorage，条目过多时同步读取可能变慢

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-24 - v11.0 全文搜索 + 知识图谱 + AI综述 + 引用导出 + 提示词版本管理

### 修改文件
- `frontend/src/services/searchHistory.ts` - 全文搜索引擎（分词匹配+权重排序+上下文摘要）
- `frontend/src/components/SearchPanel.tsx` - 搜索UI面板（防抖+结果列表+点击跳转）
- `frontend/src/services/knowledgeGraph.ts` - 知识图谱引擎（实体提取+共现关系构建）
- `frontend/src/components/KnowledgeGraph.tsx` - SVG环形图谱可视化（节点+边+交互）
- `frontend/src/components/KnowledgeGraphPanel.tsx` - 图谱面板（模态框+图例）
- `frontend/src/services/promptVersionStore.ts` - 提示词版本存储（CRUD+去重+上限）
- `frontend/src/components/PromptEditor.tsx` - 版本历史UI（查看/恢复/删除/备注）
- `frontend/src/components/ProjectPanel.tsx` - AI综述生成+保存+查看+删除
- `frontend/src/services/projectStore.ts` - ResearchProject新增summary字段
- `frontend/src/components/OutputPanel.tsx` - 添加学术引用导出
- `frontend/src/services/historyStore.ts` - moduleName.trim()迁移+预防
- `frontend/src/services/customModuleStore.ts` - moduleName.trim()迁移+resetCustomPrompt+saveAsDefaultPrompt
- `frontend/src/components/CustomModulePanel.tsx` - moduleName.trim()，图标选择器
- `frontend/src/services/analytics.ts` - 高频词提取修复（按分隔符拆分+文言虚词停用），noteStats/projectStats/tokenStats
- `frontend/src/components/ResultRenderer.tsx` - ErrorBoundary+全渲染器类型守卫
- `frontend/src/components/HistoryPanel.tsx` - 模块筛选栏
- `frontend/src/App.tsx` - 知识图谱+搜索面板+主页按钮+handleBackToHome修复
- `frontend/src/App.css` - 知识图谱/搜索/版本历史/模块筛选样式
- `CHANGELOG.md` - v11.0更新日志
- `README.md` - v11.0功能列表
- `TEST.md` - v11.0测试清单和验证结果
- `devlog.md` - 本文件

### 修改内容
参见 CHANGELOG.md v11.0 条目

### 风险
- 知识图谱依赖已知实体词典，未收录的实体无法显示
- 提示词版本上限10个，超出后最旧版本被丢弃

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v10.0 研究项目 + 批量生成 + AI标签 + 会话笔记 + Token统计

### 修改文件
- `backend/src/services/llmService.ts` - callLLM返回LLMResult（含content+usage），捕获API Token信息
- `backend/src/index.ts` - 响应新增usage字段，日志增加Token输出
- `frontend/src/services/projectStore.ts` - 新建，研究项目CRUD + 活跃项目 + 图标管理
- `frontend/src/components/ProjectPanel.tsx` - 新建，项目面板（创建/管理/活跃/会话关联/导出文档）
- `frontend/src/services/customModuleStore.ts` - 新增defaultTemplateText、resetCustomPrompt、saveAsDefaultPrompt
- `frontend/src/services/historyStore.ts` - 新增projectId、totalTokens、getSessionsByProject、setTokens、deleteTagGlobally
- `frontend/src/services/analytics.ts` - 新增noteRate/noteSessions/totalTokens/totalProjects/projectStats
- `frontend/src/api/client.ts` - GenerateResult新增usage字段
- `frontend/src/components/Dashboard.tsx` - 笔记率/总Token/研究项目统计卡，时间筛选，项目看板
- `frontend/src/components/OutputPanel.tsx` - 新增NoteEditor、Token显示、delete note
- `frontend/src/components/InputPanel.tsx` - 批量模式、活跃项目徽章
- `frontend/src/components/HistoryPanel.tsx` - 仅看笔记筛选、笔记预览、标签全局删除
- `frontend/src/components/PromptEditor.tsx` - 自定义模块重置/设为默认，保存后不跳转
- `frontend/src/App.tsx` - 页面stats、Token保存、项目面板集成、文字修改
- `frontend/src/App.css` - 骨架屏、笔记区、批量卡片、suggest芯片、项目标签样式
- `CHANGELOG.md` - 全版本更新日志
- `devlog.md` - 本文件

### 修改内容
参见 CHANGELOG.md v10.0 条目

### 风险
- Token统计依赖LLM API返回usage字段，部分代理不返回时显示为0
- 自定义模块defaultTemplateText迁移在loadAll时自动执行，依赖localStorage数据完整性

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v9.0 示例库 + 导出图片 + 思维导图 + 分享链接 + 输入建议 + 模块教程 + 导出报告

### 修改文件
- `frontend/src/modules/moduleConfig.ts` - 10个模块新增example示例值、tips教程文本、suggestions输入建议（每字段20条）
- `frontend/src/components/InputPanel.tsx` - 💡示例按钮一键填入，datalist下拉建议+textarea芯片建议
- `frontend/src/components/OutputPanel.tsx` - 导出图片（新窗口预览）、分享链接编码/还原
- `frontend/src/components/ModuleList.tsx` - "?"模块教程弹出按钮，hover提示
- `frontend/src/components/Dashboard.tsx` - 一键导出统计报告（HTML）
- `frontend/src/App.tsx` - 思维导图视图集成，分享URL hash解析（#share=...）
- `frontend/src/App.css` - 示例按钮/建议芯片/教程弹窗/思维导图/导出报告样式

### 修改内容
1. 示例库：每个内置模块预置精彩示例，点击💡一键填入全部字段，方便新用户体验
2. 思维导图：SVG树形图展示二级节点，中文化字段名，贝塞尔曲线连线
3. 分享链接：将生成结果编码为URL hash，复制链接后打开即还原（含模块名和结果数据）
4. 输入建议：文本字段配datalist下拉，textarea字段配可点击的建议芯片
5. 模块教程：每个模块左侧"?"按钮，悬停弹出使用技巧
6. 导出图片：新窗口渲染完整结果，支持浏览器截图保存
7. 导出报告：仪表盘一键下载含全部统计数据的HTML报告
8. UI优化：左侧栏290px

### 风险
- 分享链接将结果数据编码在URL中，超长内容可能导致URL过长
- 建议项为静态数据（每字段20条），不随用户使用动态更新

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v8.0 Markdown渲染 + AI洞察 + 语音输入 + 仪表盘增强 + UI优化

### 修改文件
- `frontend/src/components/ResultRenderer.tsx` - Markdown渲染模式升级（标题/列表/粗体/行内代码真实排版）
- `frontend/src/components/VoiceInput.tsx` - 新建，Web Speech API中文语音输入组件
- `frontend/src/components/Dashboard.tsx` - AI使用洞察生成按钮，收藏率/平均输入/周环比/7日移动平均/高频词云/收藏排行
- `frontend/src/components/HistoryPanel.tsx` - 宽度780px单行布局，按钮常显，标签固定配色
- `frontend/src/components/InputPanel.tsx` - 文本字段集成VoiceInput语音按钮
- `frontend/src/components/OutputPanel.tsx` - 新增对话历史按钮（与返回主页并列）
- `frontend/src/services/analytics.ts` - 新增收藏率/平均输入/周环比/移动平均统计
- `frontend/src/App.tsx` - 集成VoiceInput + AI洞察
- `frontend/src/App.css` - Markdown渲染/语音按钮/洞察面板/历史宽度调整样式

### 修改内容
1. Markdown渲染：标题/列表/粗体/行内代码真实排版，不再纯文本
2. AI使用洞察：仪表盘一键调用LLM生成个性化使用分析报告
3. 语音输入：文本/多行文本字段支持Web Speech API中文录音转文字
4. 仪表盘增强：新增收藏率、平均输入长度、本周vs上周环比、7日移动平均线、高频主题词Top15、收藏排行榜
5. 渲染器加固：全模块空数据回退+类型守卫，防止渲染崩溃
6. UI优化：历史面板增至780px单行布局，标签固定配色方案

### 风险
- Web Speech API仅Chrome/Edge有较好的中文识别支持，Firefox不可用
- AI洞察生成依赖已配置的LLM，无配置时按钮无效

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v7.1 欢迎面板图片化 + 收藏星标常显 + 模块图标完善

### 修改文件
- `frontend/public/db.png` - 新增，欢迎面板展示图片
- `frontend/src/components/WelcomeAnimation.tsx` - 将ASCII艺术替换为db.png，图片展示效果
- `frontend/src/components/InputPanel.tsx` - 模块图标完善
- `frontend/src/App.css` - 欢迎面板图片样式

### 修改内容
1. 欢迎面板：ASCII字符艺术 → 真实图片展示（db.png），视觉更美观
2. 收藏星标：从标题末尾移至标题左侧，始终可见，不依赖hover
3. 模块图标：完善所有内置模块的emoji图标

### 风险
- 无

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v7.0 导出文档 + 收藏夹 + 主页欢迎面板 + 模块图标 + 标签看板

### 修改文件
- `frontend/src/components/OutputPanel.tsx` - 添加导出按钮，Markdown/HTML双格式下载；返回主页按钮
- `frontend/src/components/Dashboard.tsx` - 标签统计看板（彩色柱状图）
- `frontend/src/components/HistoryPanel.tsx` - 收藏星标⭐筛选，星标始终可见
- `frontend/src/components/InputPanel.tsx` - 主页欢迎面板（系统介绍+功能标签+最近动态）
- `frontend/src/components/ModuleList.tsx` - 10个模块添加emoji图标
- `frontend/src/components/CustomModulePanel.tsx` - 自定义模块20种图标选择
- `frontend/src/modules/moduleConfig.ts` - 模块定义新增icon字段
- `frontend/src/services/analytics.ts` - 标签统计数据结构，收藏排行
- `frontend/src/services/customModuleStore.ts` - 自定义模块icon持久化
- `frontend/src/services/historyStore.ts` - favorite字段，toggleFavorite，标签关联
- `frontend/src/App.tsx` - 欢迎面板/收藏/导出/标签看板集成
- `frontend/src/App.css` - 导出按钮/收藏星标/欢迎面板/标签看板/模块图标样式

### 修改内容
1. 导出文档：结果支持Markdown和HTML格式下载
2. 收藏夹：⭐星标收藏/取消，独立收藏筛选，星标在标题旁始终可见
3. 主页欢迎面板：系统介绍+功能标签+最近6条历史记录可点击直达，替代空白占位
4. 模块图标：10个内置模块配emoji图标，自定义模块可选20种图标
5. 仪表盘标签看板：彩色横向柱状图展示标签分布
6. 返回主页按钮：结果页header左侧一键返回

### 风险
- 无

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-22 - v6.0 自定义模块 + 导入导出 + 对比模式 + 历史标签 + 重新生成 + 批量删除

### 修改文件
- `frontend/src/components/CustomModulePanel.tsx` - 新建，自定义模块CRUD面板（名称/图标/字段/提示词）
- `frontend/src/services/customModuleStore.ts` - 新建，自定义模块localStorage持久化（add/update/delete/getAll）
- `frontend/src/components/DataPortPanel.tsx` - 新建，数据导入导出面板
- `frontend/src/services/dataPort.ts` - 新建，导入导出工具函数（导出JSON/导入JSON/恢复）
- `frontend/src/services/historyStore.ts` - 新增deleteHistories批量删除、toggleTag标签操作
- `frontend/src/modules/moduleConfig.ts` - 新增ModuleField类型定义，_isCustom扩展标志
- `frontend/src/components/InputPanel.tsx` - 对比模式UI（双模块选择+并行生成+上下分屏）
- `frontend/src/components/HistoryPanel.tsx` - 批量选择/删除，标签筛选，重新生成按钮
- `frontend/src/components/ModuleList.tsx` - 自定义模块动态加载到列表
- `frontend/src/components/PromptEditor.tsx` - 自定义模块提示词支持
- `frontend/src/components/ResultRenderer.tsx` - 自定义模块输出智能渲染路由
- `frontend/src/components/SettingsModal.tsx` - 新增自定义模块和数据导入导出面板
- `frontend/src/App.tsx` - 对比模式/批量删除/重新生成/自定义模块集成
- `frontend/src/App.css` - 自定义模块表单/导入导出/对比模式/标签筛选样式
- `frontend/src/api/client.ts` - api字段适配
- `backend/src/index.ts` - 自定义模块路由（_isCustom时跳过内置提示词路由）
- `backend/src/prompts/templates.ts` - 新增customPrompt参数支持
- `backend/src/services/llmService.ts` - callLLM支持customPrompt参数
- `frontend/src/services/analytics.ts` - 自定义模块纳入统计

### 修改内容
1. 自定义模块：用户创建自有模块（名称/图标/输入字段/提示词模板），完全融入系统（生成/历史/统计/提示词编辑）
2. 数据导入导出：一键导出所有历史会话为JSON文件，从文件恢复导入
3. 对比模式：同一输入选择两个模块，并行生成，结果上下分屏对比
4. 历史标签：预置6种标签+自定义标签，按标签筛选，标签颜色关联
5. 重新生成：历史会话一键用原输入重新调用LLM
6. 批量删除：全选/逐条勾选/删除所选/全部删除
7. 智能渲染路由：自定义模块输出自动检测结构，匹配最佳6种渲染器

### 风险
- 自定义模块提示词质量完全由用户控制，不当的提示词可能导致LLM输出异常
- 导入数据验证依赖JSON结构完整性，损坏文件可能导入失败

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-21 - v5.0 系统仪表盘 + 全面数据统计分析

### 修改文件
- `frontend/src/components/Dashboard.tsx` - 新建，仪表盘页面（统计卡片+SVG图表+活动列表）
- `frontend/src/services/analytics.ts` - 新建，数据分析引擎（模块/标签/时间/日/周/小时多维度统计）
- `frontend/src/App.tsx` - 添加仪表盘按钮和路由，header集成
- `frontend/src/App.css` - 仪表盘全部样式（卡片网格/SVG图表/热力图/环形图）

### 修改内容
1. 系统仪表盘：16项统计数据可视化展示，点击按钮打开独立页面
2. 8个统计卡片：总会话数、今日会话、最热模块、日均、最长连续天数、置顶率、总生成量、存储占用
3. SVG图表：横向柱状图（模块使用分布）、折线面积图（30天趋势）、环形图（Top5模块占比）
4. 24小时活跃热力图：24格渐变色段，深色=高频时段
5. 每周分布图：7柱状图展示周一到周日使用分布
6. 最近活动列表：最新10条会话，可点击跳转
7. 数据分析引擎：computeAnalytics()统一计算所有统计指标（模块级平均输出量、置顶率、pinRate等）

### 风险
- SVG图表纯手工绘制，数据量增大后可能需要虚拟滚动
- 统计计算在每次打开仪表盘时全量遍历localStorage，数据量大时性能待观察

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-21 - v4.0 提示词全面升级 + 文风模拟 + 校园热梗 + 情绪曲线优化

### 修改文件
- `backend/src/prompts/templates.ts` - 10个模块提示词全面重写，新增文风判定/校园热梗/启发性约束
- `frontend/src/components/ResultRenderer.tsx` - 情绪曲线改为红绿长条（正值红/负值绿），对话类渲染增强
- `frontend/src/App.css` - 红绿情绪条/对话头像一致性样式

### 修改内容
1. 10模块提示词全面重写：从简单指令升级为专家级角色设定+精妙任务框架+启发性约束
2. 哲学家群聊两阶段文风判定：第一阶段分析著作体裁/句式/修辞温度/论证姿态，第二阶段生成内容
3. 古文翻译新增第5版本——校园热梗版："郑人买履"自动翻译为2024-2026中国大学流行梗风格
4. 情绪曲线UI改为红绿长条：正值红色（积极情绪）、负值绿色（消极情绪），长度按得分比例缩放
5. 对话类一致性头像：同一发言者头像颜色基于名称哈希，以大写字母首字符识别

### 风险
- 校园热梗版翻译极大依赖LLM对当代中国大学文化的理解，输出质量有波动
- 两阶段文风判定增加Token消耗和响应时间

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-21 - v3.0 对话历史 + 打字机动画 + 智能命名

### 修改文件
- `frontend/src/services/historyStore.ts` - 新建，对话历史localStorage CRUD（添加/查询/更新/删除）+ pin/rename
- `frontend/src/components/HistoryPanel.tsx` - 新建，对话历史面板（列表/搜索/pin/重命名/删除/分享）
- `frontend/src/components/OutputPanel.tsx` - 新增打字机动画效果（对话类模块逐字出现），分享按钮
- `frontend/src/components/ResultRenderer.tsx` - 对话类渲染器集成打字机动画，头像颜色哈希一致性
- `frontend/src/App.tsx` - 对话历史面板集成，自动保存，智能命名调用
- `frontend/src/App.css` - 历史面板/打字机动画/头像/分享按钮样式

### 修改内容
1. 对话历史：每次生成完成后自动保存（含模块ID/名称/输入/输出/时间戳），上限200条，超限自动淘汰最旧未置顶记录
2. 历史面板：列表展示所有会话，支持搜索、pin置顶、重命名、删除、一键分享JSON到剪贴板
3. 打字机动画：对话类模块（哲学家群聊/校园热梗等）结果逐字出现，模拟真实对话体验
4. 一致性头像：同一发言者名称在多次生成中头像颜色保持哈希一致
5. 智能命名：根据模块输入字段自动生成贴合内容的标题（如"存在先于本质 四版本哲学降维"）

### 风险
- 打字机动画在长文本时可能持续较久，用户需等待
- 历史上限200条，超出自动淘汰未置顶记录

### 未完成项
- 无

### 下一步建议
继续按用户需求迭代

---

## 2026-05-21 - v2.0 主题系统 + 输出偏好 + 高级感渲染

### 修改文件
- `frontend/src/themes/themes.ts` - 新建，主题引擎（Apple/Tesla/Anthropic三套CSS变量预设）
- `frontend/src/components/ThemePanel.tsx` - 新建，主题选择面板（预览卡片+即时切换）
- `frontend/src/components/OutputPrefsPanel.tsx` - 新建，输出偏好面板（默认显示格式/生成详细度）
- `frontend/src/components/ResultRenderer.tsx` - 新建，模块感知富渲染引擎（6种渲染模式）
- `frontend/src/components/OutputPanel.tsx` - 新增预览/JSON/MD三模式切换，使用存储偏好
- `frontend/src/components/SettingsModal.tsx` - 新增"系统主题"和"输出偏好"两个面板（导航从2→4项）
- `frontend/src/App.tsx` - 启动时加载已保存主题
- `frontend/src/App.css` - 全部硬编码颜色替换为CSS变量（~500行新增premium样式），主题卡片/radio组件样式

### 修改内容
1. 三套CSS变量主题：Apple（浅色清爽/蓝灰调）、Tesla（深色科技/黑红调）、Anthropic（米色人文/暖色调），全站即时切换
2. 输出偏好：默认显示格式（JSON/Markdown）、生成详细度（简洁/标准/详细），偏好持久化
3. 高级感输出渲染引擎——6种渲染模式：
   - 对话类 → 彩色头像 + 聊天气泡 + 类型标签 + 总结卡片
   - 多层版本类 → 2列版本卡片 + 原文高亮 + 版本图标
   - 时间线类 → 垂直时间轴 + 节点卡片 + 分支对比
   - 分析报告类 → 结构化段落 + 情绪曲线柱状图 + 标签芯片
   - 商业分析类 → 公司头像 + 产品网格 + SWOT 2x2 四象限
   - 转换类 → Era标签卡片 + 元数据列表
4. 预览/JSON/MD三按钮切换，默认预览视图
5. 设置弹窗导航从2项扩展为4项（API配置/提示词模板/系统主题/输出偏好）

### 风险
- 新增模块需手动更新ResultRenderer路由逻辑，否则fallback到通用渲染
- 详细度偏好暂存前端，未接入LLM提示词

### 未完成项
- 生成详细度偏好未接入LLM
- 用户自定义主题功能

### 下一步建议
1. 将详细度偏好注入到提示词中
2. 可新增"自定义主题"功能

---

## 2026-05-21 - v1.0 文史哲AI多模块生成系统初始版本

### 修改文件
- `CLAUDE.md` - 项目配置文件，定义文档读取顺序与核心规则
- `Agent.md` - AI开发行为规范（32条规则）
- `backend/src/prompts/templates.ts` - 10个模块的提示词模板（从函数改为可编辑文本模板，{key}占位符+{key:json}修饰符）
- `backend/src/services/llmService.ts` - LLM抽象层（OpenAI兼容API封装，extractJSON兜底）
- `backend/src/index.ts` - Express服务器 + POST /api/generate + GET /api/modules + 提示词CRUD API
- `frontend/src/App.tsx` - 主应用组件（状态管理、三栏布局、生成流程）
- `frontend/src/App.css` - 极简风样式（CSS变量体系）
- `frontend/src/components/ModuleList.tsx` - 左侧模块列表（10个内置模块）
- `frontend/src/components/InputPanel.tsx` - 中间动态输入表单（根据模块配置渲染字段，支持tag-input）
- `frontend/src/components/OutputPanel.tsx` - 右侧结果展示（JSON/Markdown切换）
- `frontend/src/components/SettingsModal.tsx` - API配置弹窗（endpoint/key/model），多面板架构（左侧导航+右侧内容）
- `frontend/src/components/PromptEditor.tsx` - 提示词在线编辑器（模块列表+可编辑文本框+保存/重置）
- `frontend/src/modules/moduleConfig.ts` - 10个模块的输入字段配置
- `frontend/src/api/client.ts` - 后端API调用封装（generate/fetchPrompts/updatePrompt/resetPrompt）
- `frontend/src/main.tsx` - 入口文件
- `frontend/index.html` - HTML入口
- `frontend/vite.config.ts` - Vite配置（含API代理）
- `backend/tsconfig.json` - TypeScript配置
- `devlog.md` - 本文件

### 修改内容
1. 搭建项目脚手架（Vite 5 + React + TS 前端，Express + TS 后端）
2. 10个模块提示词模板：哲学概念降维解释器、典故时间穿越解释器、文学作品比较分析器、历史人物对话生成器、文本风格转换器、文史知识图谱构建器、古文翻译与注释器、中国哲学概念溯源器、文学创作辅助器、文史哲综合问答器
3. LLM抽象层：支持OpenAI兼容API，用户配置endpoint/apiKey/model，运行时传入
4. 提示词路由系统：POST /api/generate 根据moduleId路由到对应模板
5. 三栏SPA布局：左侧模块列表 | 中间动态输入区 | 右侧结果展示
6. API配置弹窗：配置存localStorage，每次请求由前端传给后端，后端不持久化
7. 提示词模板在线编辑：从硬编码函数改为可编辑文本模板，支持{key}占位符，保存/重置
8. JSON/Markdown两种输出显示模式，extractJSON兜底处理非标准JSON
9. 设置弹窗多面板架构：左侧导航+右侧内容，后续可方便扩展

### 风险
- Node版本v20.18.0，Vite需降级到5.x以兼容，未来升级Node后可升级Vite
- LLM返回JSON可能不严格符合格式，extractJSON做代码块提取+括号匹配兜底

### 未完成项
- 无

### 下一步建议
1. 配置API endpoint和key后在浏览器中测试各模块
2. 根据实际LLM输出效果微调提示词模板
3. 可添加Markdown渲染增强（代码高亮、表格等）
