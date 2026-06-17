# 02 本地启动与部署说明

## 本地启动

1. 打开终端。
2. 进入项目目录：

```bash
cd "/Users/angel/Documents/New project/wechat-topic-radar"
```

3. 安装依赖：

```bash
npm install
```

4. 启动本地网页：

```bash
npm run dev
```

5. 打开终端显示的地址，例如：

```text
http://127.0.0.1:5173/
```

## Vercel 部署

```bash
npm run build
npx vercel deploy --prod
```

## 线上地址

员工入口：

```text
https://wechat-topic-radar.vercel.app
```

管理员入口：

```text
https://wechat-topic-radar.vercel.app/?admin=1
```

## 注意事项

- `.env` 只放在本地，不提交 GitHub。
- 线上环境变量在 Vercel 后台配置。
- 修改资料库后，需要重新运行资料导入脚本并部署。
