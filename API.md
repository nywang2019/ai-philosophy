# API 接口文档

本文档描述文史哲AI多模块生成系统的所有后端API接口。

**Base URL**: `http://localhost:3001`

---

## 1. 获取模块列表

获取所有可用模块的基本信息。

```
GET /api/modules
```

**请求参数**: 无

**成功响应 (200)**:
```json
{
  "modules": [
    { "moduleId": "idiom_time_travel", "moduleName": "典故时间穿越解释器" },
    { "moduleId": "philosopher_chat", "moduleName": "哲学家群聊模拟器" }
  ]
}
```

---

## 2. 核心生成接口

根据模块ID和输入参数调用LLM生成内容。

```
POST /api/generate
```

**请求体 (JSON)**:
```json
{
  "moduleId": "idiom_time_travel",
  "inputs": { "idiom": "郑人买履", "eras": ["唐代", "宋代"] },
  "llmConfig": {
    "endpoint": "https://api.openai.com",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  },
  "customPrompt": null,
  "multimodalConfig": {
    "endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "apiKey": "sk-...",
    "model": "qwen-vl-max"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID，内置模块如 `idiom_time_travel`，自定义模块如 `custom_xxx` |
| inputs | object | 是 | 模块的输入参数，key 对应字段 key，value 为字符串或字符串数组。含图片时 value 为 `data:image/...` Base64 |
| llmConfig.endpoint | string | 是 | OpenAI兼容API地址 |
| llmConfig.apiKey | string | 是 | API密钥 |
| llmConfig.model | string | 是 | 模型名称 |
| customPrompt | string | 否 | 自定义提示词模板（用于自定义模块），使用 `{key}` 占位符 |
| multimodalConfig | object | 否 | 多模态视觉模型配置，检测到图片输入时必填。结构同 llmConfig |
| multimodalConfig.endpoint | string | 否 | 视觉模型API地址，支持 OpenAI Vision 或 DashScope 原生格式 |
| multimodalConfig.apiKey | string | 否 | 视觉模型API密钥 |
| multimodalConfig.model | string | 否 | 视觉模型名称（如 qwen-vl-max、gpt-4o） |

**成功响应 (200)**:
```json
{
  "moduleId": "idiom_time_travel",
  "moduleName": "典故时间穿越解释器",
  "result": {
    "idiom": "郑人买履",
    "eras": [...]
  },
  "duration": 2345,
  "usage": {
    "promptTokens": 320,
    "completionTokens": 512,
    "totalTokens": 832
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| result | object | LLM返回的结构化JSON结果 |
| duration | number | 生成耗时（毫秒） |
| usage | object/null | Token使用量（依赖LLM API返回） |

**错误响应 (400)**: 缺少必要参数
**错误响应 (404)**: 模块不存在
**错误响应 (500)**: LLM调用失败

---

## 3. 获取提示词模板列表

获取所有内置模块的提示词模板（含文本内容）。

```
GET /api/prompts
```

**请求参数**: 无

**成功响应 (200)**:
```json
{
  "prompts": [
    {
      "moduleId": "idiom_time_travel",
      "moduleName": "典故时间穿越解释器",
      "templateText": "你是一位历史语义学家..."
    }
  ]
}
```

---

## 4. 更新提示词模板

```
PUT /api/prompts/:moduleId
```

**路径参数**: `moduleId` - 模块ID

**请求体 (JSON)**:
```json
{
  "templateText": "你是一位..."
}
```

**成功响应 (200)**: `{ "success": true, "moduleId": "..." }`

**错误响应 (400)**: `templateText` 缺失
**错误响应 (404)**: 模块不存在

---

## 5. 重置提示词模板

```
POST /api/prompts/:moduleId/reset
```

**路径参数**: `moduleId` - 模块ID

**成功响应 (200)**: `{ "success": true, "moduleId": "..." }`

**错误响应 (404)**: 模块不存在

---

## 数据流

```
[用户输入] → [POST /api/generate]
              ├─ 检测图片（data:image/... Base64）→ 多模态路由
              ├─ 模块识别 → 路由提示词模板
              ├─ 参数注入（{key} → 实际值）
              ├─ 调用 LLM API（OpenAI兼容 或 DashScope原生多模态）
              ├─ 提取结构化 JSON
              └─ 返回 { result, duration, usage }
```

## 提示词注入语法

模板中使用 `{key}` 作为占位符：
- `{key}` — 替换为输入值（字符串直接替换，数组用"、"连接）
- `{key:json}` — 替换为 JSON 序列化值
- `customPrompt` 使用相同语法，在前端传入时直接传给后端
