# @itxtech/fd-server

FlashDetector / FDWebServer 兼容服务，用于把当前 fdnext core 暴露成 FlashMaster Classic 可直接使用的旧 HTTP API。

本包面向 FlashMaster Classic 存量用户迁移。它内部使用 `@itxtech/fdnext-core` 的当前解析引擎和内置资源，对外只提供旧 FlashDetector HTTP 响应约定。

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

- Node.js 24+
- 使用 monorepo 部署时需要 pnpm 10+
- 生产环境建议在前面放反向代理并由反向代理处理 HTTPS

## 开发启动

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

## 生产构建

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

## Smoke Test

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
```

发布前可做更宽的检查：

```bash
pnpm build
git diff --check
```
