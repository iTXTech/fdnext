# @itxtech/fd-server

FlashDetector / FDWebServer 兼容服务，用于把当前 fdnext core 暴露成 FlashMaster Classic 可直接使用的旧 HTTP API。

本包面向 FlashMaster Classic 存量用户迁移。它内部使用 `@itxtech/fdnext-core` 的当前解析引擎和内置资源，对外只提供旧 FlashDetector HTTP 响应约定。

首选部署方式是 Cloudflare Workers。Node.js HTTP server、PM2 和 systemd 仍然保留，用于本地调试、自托管或反向代理部署。

它不是 fdnext v3 HTTP server，不暴露 `/parts/*`、`/identifiers/*` 或 `/capabilities`。

## 部署目标

当现有 FlashMaster Classic 客户端仍然请求旧 FlashDetector 路由时，使用 `fd-server`：

- `/`
- `/info`
- `/decode?pn=...&lang=...`
- `/decodeId?id=...&lang=...`
- `/searchPn?pn=...&lang=...&limit=...`
- `/searchId?id=...&lang=...&limit=...`
- `/summary?pn=...&lang=...`
- `/summaryId?id=...&lang=...`

如果客户端使用 fdnext v3 HTTP API，请部署 `@itxtech/fdnext-server`。

## 运行要求

- Cloudflare Workers 部署：Cloudflare 账号、pnpm 10+，以及 Wrangler 登录状态。
- 本地构建和 Node.js HTTP server：Node.js 24+。
- 自托管 Node.js 生产环境建议在前面放反向代理并由反向代理处理 HTTPS。

## Cloudflare Workers 部署（首选）

该部署只提供旧 FlashDetector / FDWebServer HTTP API，用于 FlashMaster Classic 迁移。不要把它当作 fdnext v3 HTTP API 使用；需要 `/parts/*`、`/identifiers/*` 或 `/capabilities` 时应部署 `@itxtech/fdnext-cf-workers`。

### 配置文件

Worker 配置文件位于：

```text
packages/fd-server/wrangler.jsonc
```

关键配置：

```jsonc
{
  "name": "fdnext-fd-server",
  "main": "dist/worker.js",
  "compatibility_date": "2026-06-13",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "minify": true,
  "keep_vars": true,
  "build": {
    "command": "pnpm build",
    "watch_dir": [
      "../core/src",
      "../core/resources",
      "src"
    ]
  },
  "dev": {
    "port": 8080,
    "local_protocol": "http"
  }
}
```

说明：

- `main` 指向 `fd-server` 的 Worker bundle；部署前由 `build.command` 生成。
- `build.command` 在 `packages/fd-server` 目录内执行 `pnpm build`，生成 `dist/worker.js`。
- `watch_dir` 覆盖 `fd-server` 源码和 `core` 源码 / 资源，便于本地 `wrangler dev` 监听相关变更。
- `compatibility_flags` 启用 `nodejs_compat`，用于兼容 bundled dependency 中可能出现的 Node.js 内置模块引用。
- `keep_vars` 保留 Cloudflare Dashboard 中配置的 Worker environment variables，避免部署时清空远端变量。
- `workers_dev` 默认开启，可先部署到 `*.workers.dev`；生产域名可在 Cloudflare Dashboard 绑定，也可在 `wrangler.jsonc` 中维护 `route` / `routes`。

### 本地开发

仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm fdserver:worker:dev
```

本地 Wrangler 服务默认监听：

```text
http://127.0.0.1:8080
```

Wrangler 会先执行 `packages/fd-server/wrangler.jsonc` 中的 `build.command`，再启动本地 Worker。Classic 客户端本地调试时可把服务器地址设为：

```text
http://127.0.0.1:8080
```

### 手动部署

部署前先预览 Wrangler 产物：

```bash
pnpm fdserver:worker:deploy:dry-run
```

发布到 Cloudflare Workers：

```bash
pnpm fdserver:worker:deploy
```

部署后把 FlashMaster Classic 的服务器地址改成 Worker 根路径，例如：

```text
https://fdnext-fd-server.<account>.workers.dev
```

或绑定后的自有域名：

```text
https://fd.example.com
```

不要在 Classic 中追加 path prefix。旧接口必须直接位于服务根路径，例如 `/decode`、`/decodeId`。

### Cloudflare Workers Builds 设置

如果使用 Cloudflare Dashboard 连接 Git 仓库自动部署，建议按下表设置：

| Setting | Value |
| --- | --- |
| Root directory | 留空或仓库根目录 |
| Build command | `pnpm install --frozen-lockfile=false && pnpm -C packages/fd-server build` |
| Deploy command | `pnpm fdserver:worker:deploy` |
| Non-production branch deploy command | `pnpm --dir packages/fd-server dlx wrangler versions upload --config wrangler.jsonc` |

建议同时添加 Build variable：

| Variable | Value |
| --- | --- |
| `SKIP_DEPENDENCY_INSTALL` | `1` |

这样可以避免 Workers Builds 自动选择其他包管理器，确保依赖安装和构建都走 pnpm。

### Worker 环境变量

Wrangler 配置使用 `keep_vars: true`，生产环境建议在 Cloudflare Dashboard 中维护变量，这样后续部署不会清空 Dashboard 中已有配置。

本地调试可在 `packages/fd-server/.dev.vars` 中放置变量：

```dotenv
FD_SERVER_DEFAULT_LANG=chs
FD_SERVER_CONTROLLER_GROUP=selected
FD_SERVER_EXTRA_URLS='{"迁移到新版 FlashMaster":"https://fm.itxtech.org"}'
```

不要提交 `.dev.vars` 或 `.env` 文件。

可配置变量：

- `FD_SERVER_DEFAULT_LANG`：默认语言，允许 `chs` 或 `eng`，空值或非法值回退到 `chs`。
- `FD_SERVER_CONTROLLER_GROUP`：decode 类输出使用的服务端控制器投影视图，默认 `selected`。
- `FD_SERVER_EXTRA_URLS`：JSON object，只追加到 `/decode` 和 `/decodeId` 响应的 `data.url` 中。

### Workers Smoke Test

本地 `wrangler dev` 或部署后执行，部署后把示例中的 `http://127.0.0.1:8080` 换成 Worker URL：

```bash
curl 'http://127.0.0.1:8080/'
curl 'http://127.0.0.1:8080/info'
curl 'http://127.0.0.1:8080/decode?pn=MT29F4G08ABAEA&lang=chs'
curl 'http://127.0.0.1:8080/decodeId?id=2C64444BA900&lang=chs'
curl 'http://127.0.0.1:8080/parts/decode?query=MT29F4G08ABAEA'
```

高层检查项：

- `/` 返回 `{ "result": true, "server": "fdnext-fd-server" }`。
- `/info.info.fdb.controllers` 是非空控制器列表。
- `/decode` 和 `/decodeId` 返回 FlashDetector 旧字段集合。
- `/parts/decode` 等 fdnext v3 路由返回 `{ "result": false, "message": "Not found" }`。

## Node.js 开发启动

在仓库根目录执行：

```bash
pnpm install
pnpm fdserver:dev
```

开发服务默认监听：

```text
http://0.0.0.0:8080
```

可以通过 CLI 参数覆盖 host 或 port：

```bash
pnpm fdserver:dev -- --host 127.0.0.1 --port 8081
```

## Node.js 生产构建

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm -C packages/fd-server build
pnpm -C packages/fd-server start
```

构建后的入口为：

```bash
packages/fd-server/dist/bin.js --host 0.0.0.0 --port 8080
```

只支持以下 CLI 参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--host` | `0.0.0.0` | 监听地址 |
| `--port` | `8080` | 监听端口 |

默认语言、控制器投影视图和强制附加链接通过环境变量配置，不提供 CLI 参数。

## NPM 包部署

作为依赖安装后运行：

```bash
pnpm add @itxtech/fd-server
pnpm exec fd-server --host 0.0.0.0 --port 8080
```

也可以使用一次性执行方式：

```bash
pnpm dlx @itxtech/fd-server --host 0.0.0.0 --port 8080
```

## 环境变量

### `FD_SERVER_DEFAULT_LANG`

请求没有传 `lang` 或传入非法语言时使用的默认响应语言。

允许值：

- `chs`
- `eng`

空值或非法值回退到 `chs`。

示例：

```bash
FD_SERVER_DEFAULT_LANG=chs
```

### `FD_SERVER_CONTROLLER_GROUP`

服务端控制器投影视图，用于 decode 类输出。

默认值：

```bash
FD_SERVER_CONTROLLER_GROUP=selected
```

示例：

```bash
FD_SERVER_CONTROLLER_GROUP=all
FD_SERVER_CONTROLLER_GROUP=if:sata,if:nvme
```

旧 HTTP API 不接受 `controllerGroup` query 参数。即使客户端传入该参数，`fd-server` 也会忽略它，并继续使用此环境变量。

### `FD_SERVER_EXTRA_URLS`

JSON object，用于把额外链接追加到 `/decode` 和 `/decodeId` 响应的 `data.url` 中。

示例：

```bash
FD_SERVER_EXTRA_URLS='{"迁移到新版 FlashMaster":"https://fm.itxtech.org"}'
```

规则：

- 只接受 `http://` 和 `https://` URL。
- 空 label 会被忽略。
- 非法 JSON 会被忽略，并在启动时输出 warning。
- 额外链接不会出现在 search 或 summary 响应中。

## PM2 部署

先构建：

```bash
pnpm install --frozen-lockfile
pnpm -C packages/fd-server build
```

使用 PM2 启动：

```bash
pm2 start packages/fd-server/ecosystem.config.cjs
```

需要附加强制 URL 时，启动前传入环境变量：

```bash
FD_SERVER_EXTRA_URLS='{"迁移到新版 FlashMaster":"https://fm.itxtech.org"}' \
pm2 start packages/fd-server/ecosystem.config.cjs
```

常用操作：

```bash
pm2 status
pm2 logs fd-server
pm2 restart fd-server --update-env
pm2 save
```

## systemd 部署

示例 unit：

```ini
[Unit]
Description=fd-server FlashDetector compatibility API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/fdnext
Environment=NODE_ENV=production
Environment=FD_SERVER_DEFAULT_LANG=chs
Environment=FD_SERVER_CONTROLLER_GROUP=selected
Environment="FD_SERVER_EXTRA_URLS={\"迁移到新版 FlashMaster\":\"https://fm.itxtech.org\"}"
ExecStart=/usr/bin/node packages/fd-server/dist/bin.js --host 127.0.0.1 --port 8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

放置 unit 文件后执行：

```bash
systemctl daemon-reload
systemctl enable --now fd-server
systemctl status fd-server
journalctl -u fd-server -f
```

如果 JSON 值在你的环境中需要额外转义，可以把环境变量放进 `EnvironmentFile`，并按发行版的 systemd 规则引用。

## 反向代理

建议让 `fd-server` 监听 loopback 地址，由 nginx、Caddy、Apache 或其他网关终止 HTTPS。

最小 nginx 示例：

```nginx
server {
    listen 443 ssl http2;
    server_name fd.example.com;

    ssl_certificate /etc/letsencrypt/live/fd.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fd.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

FlashMaster Classic 中配置服务地址：

```text
https://fd.example.com
```

不要额外加 path prefix，除非上游代理会把 prefix rewrite 掉。FlashMaster Classic 期望旧接口直接位于服务根路径。

## Node.js Smoke Test

服务启动后执行：

```bash
curl 'http://127.0.0.1:8080/'
curl 'http://127.0.0.1:8080/info'
curl 'http://127.0.0.1:8080/decode?pn=MT29F4G08ABAEA&lang=chs'
curl 'http://127.0.0.1:8080/decodeId?id=2C64444BA900&lang=chs'
curl 'http://127.0.0.1:8080/searchPn?pn=MT29F4G08ABAEA&lang=eng&limit=5'
curl 'http://127.0.0.1:8080/searchId?id=2C64&lang=eng&limit=5'
```

高层检查项：

- `/` 返回 `{ "result": true, "server": "fdnext-fd-server" }`。
- `/info.info.fdb.controllers` 是非空控制器列表。
- `/decode` 只返回 FlashDetector `FlashInfo` 字段集合。
- `/decodeId` 只返回 FlashDetector `FlashIdInfo` 字段集合。
- 未暴露的 fdnext v3 路由，例如 `/parts/decode`，返回 `{ "result": false, "message": "Not found" }`。

## FlashMaster Classic 配置

将 Classic 的服务器地址指向 fd-server 根路径：

```text
http://127.0.0.1:8080
```

或指向 HTTPS 反向代理地址：

```text
https://fd.example.com
```

Classic UI 会直接渲染旧字段，包括 `extraInfo` 和 `ext` 的 key。`fd-server` 会根据请求 `lang` 输出本地化 label。

## 运维注意事项

- `fd-server` 使用 `@itxtech/fdnext-core` 的内置资源，不支持自定义资源目录加载。
- 业务错误遵循 FlashDetector 行为，使用 HTTP 200 和 `{ "result": false, "message": "..." }`。
- CORS 默认放开：`Access-Control-Allow-Origin: *`。
- `FD_SERVER_CONTROLLER_GROUP=selected` 适合默认精简控制器列表；只有客户端确实需要完整控制器集合时才使用 `all`。
- HTTPS、缓存、访问日志和限流建议放在反向代理或平台层处理。

## 验证命令

仓库部署可先验证新包：

```bash
pnpm -C packages/fd-server typecheck
pnpm -C packages/fd-server test
pnpm -C packages/fd-server build
pnpm fdserver:worker:deploy:dry-run
```

发布前可做更宽的检查：

```bash
pnpm build
git diff --check
```
