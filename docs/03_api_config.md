# 03 API 与环境变量配置

## DeepSeek

用于模拟对话、双口吻回复和 AI 安全话术优化。

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

## Neco 备用线路

如果 DeepSeek 不可用，可保留 Neco 作为备用线路。

```text
NECO_API_KEY=你的 Neco API Key
NECO_BASE_URL=你的 Neco Base URL
NECO_MODEL=你的 Neco 模型名
```

## Supabase

用于保存试运营记录、测试记录、Bug 记录和 AI 安全生成记录。

```text
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
```

## 安全提醒

- 不要把真实 API Key 写进 README、PPT、截图或聊天记录。
- 如果密钥已经在截图中露出，建议及时轮换。
- `SUPABASE_SERVICE_ROLE_KEY` 权限较高，只能放在 Vercel 环境变量和本地 `.env`，不能放到前端代码里。
