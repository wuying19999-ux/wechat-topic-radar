# AI 群话题雷达网页工作台

一句话说明：这是一个给私域运营员工使用的留学生微信群内容工作台，用学校资料库、历年群聊语气库、时间节点库和已发布记录，生成可复制的群内模拟对话、双口吻回复，并记录试运营效果。

## 核心功能

- 选择学校和国家/地区，按群类型生成内容。
- 支持校友群、飞友群、二手群、各学院群、语言班、AI 安全 6 个模块。
- 每个普通群模块可根据时间节点和最近群内讨论生成 1-3 组模拟对话，每组 10 回合，学姐 2 条、新生 8 条。
- 每个模块独立记录已发布内容，避免同一模块重复生成一模一样的对话。
- 右侧支持群内问题双口吻回复。
- 管理员页支持试运营数据看板、测试记录和 Bug 看板。
- AI 安全模块只输出合规提醒，不提供绕过 AI 检测、代写、作弊等操作方法。

## 本地启动

```bash
npm install
npm run dev
```

打开终端显示的本地地址，例如 `http://127.0.0.1:5173/`。

## 生产部署

当前项目按 Vercel 部署配置：

```bash
npm run build
npx vercel deploy --prod
```

Vercel 环境变量需要配置：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Neco 变量为备用线路：

- `NECO_API_KEY`
- `NECO_BASE_URL`
- `NECO_MODEL`

## 管理员入口

普通页面：

```text
https://wechat-topic-radar.vercel.app
```

管理员看板：

```text
https://wechat-topic-radar.vercel.app/?admin=1
```

## 数据库

Supabase 建表脚本在：

```text
supabase/schema.sql
```

正式部署前，在 Supabase SQL Editor 里运行该脚本。

## 资料更新

学校资料和聊天记录沉淀文件放在：

```text
knowledge_uploads/
```

更新资料后运行导入脚本：

```bash
node scripts/importKnowledge.js
```

脚本会生成 `netlify/functions/_shared/knowledge.generated.js`，供回答和生成逻辑检索使用。
