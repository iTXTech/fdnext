# Cloudflare Workers 部署

本文档只覆盖 `@itxtech/fdnext-cf-workers` 的 Cloudflare Workers 部署。该入口复用 `@itxtech/fdnext-core` 的 HTTP route 和 External Link provider 机制，不维护独立兼容路由。

## 1. 前置条件

- 已安装 Node.js `>= 24` 和 `pnpm`
- 已在仓库根目录执行 `pnpm install`
- 已拥有 Cloudflare 账号，并准备通过 Wrangler 登录或使用 API token 部署

Wrangler 可以临时执行，不需要加入仓库依赖：

```bash
pnpm dlx wrangler login
```

如果在 CI 中部署，使用 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 等环境变量即可，不需要交互式登录。

## 2. 配置文件

根目录的 `wrangler.jsonc` 是 Workers 部署入口：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "fdnext",
  "main": "packages/cf-workers/dist/index.js",
  "compatibility_date": "2026-05-10",
  "workers_dev": true,
  "minify": true,
  "vars": {
    "FDNEXT_CORS_ORIGINS": "https://fm.itxtech.org,https://fm.imlxy.net"
  },
  "build": {
    "command": "pnpm cf-workers:build"
  }
}
```

关键点：

- `main` 指向已打包的 Worker 入口，不直接让 Wrangler 解析 monorepo TypeScript 路径。
- `build.command` 会先构建 `@itxtech/fdnext-core`，再构建 Cloudflare Workers adapter。这个配置适用于本地 `wrangler dev/deploy`。
- `vars.FDNEXT_CORS_ORIGINS` 控制 CORS 允许的来源。当前仓库配置限制为 `https://fm.itxtech.org,https://fm.imlxy.net`；如需公开 API，可显式改成 `*`。
- 当前 Worker 不需要 `nodejs_compat`，入口只依赖 Web Fetch API。
- 默认打开 `workers_dev`，可以直接部署到 `*.workers.dev`；如果要绑定生产域名，在该配置中添加 `route` / `routes` 或在 Cloudflare 控制台绑定后保持 Wrangler 配置同步。

## 3. Cloudflare Workers Builds 设置

如果使用 Cloudflare Dashboard 连接 Git 仓库自动构建，不能把 Build command 设置成 `pnpm build`。那会构建整个 monorepo，包括 Hapi server，而 Workers 部署只需要 core 和 `cf-workers` adapter。

Workers Builds 目前不会执行 `wrangler.jsonc` 里的 custom build 配置，因此 Dashboard 里需要显式设置：

| Setting | Value |
| --- | --- |
| Root directory | 留空或仓库根目录 |
| Build command | `pnpm install --frozen-lockfile=false && pnpm cf-workers:build` |
| Deploy command | `pnpm dlx wrangler deploy --config wrangler.jsonc` |
| Non-production branch deploy command | `pnpm dlx wrangler versions upload --config wrangler.jsonc` |

建议同时添加 Build variable：

| Variable | Value |
| --- | --- |
| `SKIP_DEPENDENCY_INSTALL` | `1` |

这样可以避免 Workers Builds 自动选择 `bun install`，确保依赖安装和构建都走 pnpm。

Worker 运行时变量：

| Variable | Value |
| --- | --- |
| `FDNEXT_CORS_ORIGINS` | `*` 或逗号 / 空格分隔的 origin 列表，例如 `https://app.example.com,https://admin.example.com` |

`FDNEXT_CORS_ORIGINS=*` 会返回 `Access-Control-Allow-Origin: *`。设置多个域名时，runtime 会按请求的 `Origin` 精确匹配，命中后返回对应 origin，并附带 `Vary: Origin`。

## 4. 本地开发

```bash
pnpm cf-workers:dev
```

Wrangler 会先执行 `build.command`，然后启动本地 Worker。默认地址通常是 `http://127.0.0.1:8787`。

Smoke test:

```bash
curl 'http://127.0.0.1:8787/'
curl 'http://127.0.0.1:8787/capabilities?lang=eng'
curl 'http://127.0.0.1:8787/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8787/identifiers/decode?query=2C,64,44,4B,A9,00'
```

`/` 返回服务状态、服务名和 fdnext 版本号。仓库不提供单独的 `/health` endpoint。

## 5. CORS

Cloudflare Workers adapter 从 Worker env 读取 `FDNEXT_CORS_ORIGINS`：

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

行为：

- `*`：所有来源放开，响应 `Access-Control-Allow-Origin: *`。
- 多域名列表：仅当请求 `Origin` 精确命中列表中的 origin 时返回 CORS header。
- 支持 `OPTIONS` preflight，返回 `204`，并透传 `Access-Control-Request-Headers` 到 `Access-Control-Allow-Headers`。
- 未设置 `FDNEXT_CORS_ORIGINS` 时，serverless adapter 不额外返回 CORS header。

## 6. HTTP 接口

Workers 入口只暴露当前 runtime 的正式 HTTP 接口，不维护 Worker 专属路由或旧接口 alias。接口表、query 参数、响应结构、旧接口移除说明和 `X-Powered-By` header 约定见 [Server 接口文档](SERVER_API.md)。

## 7. 手动部署

先做一次本地构建确认：

```bash
pnpm cf-workers:build
```

预览 Wrangler 产物：

```bash
pnpm cf-workers:deploy:dry-run
```

正式部署：

```bash
pnpm cf-workers:deploy
```

部署后可访问 Wrangler 输出的 `workers.dev` URL，或绑定后的自有域名：

```bash
curl 'https://<worker>.<account>.workers.dev/'
curl 'https://<worker>.<account>.workers.dev/parts/search?query=MT29'
```

## 8. 自定义 External Link

默认入口不会注入 External Link provider。如果部署环境需要对结果追加平台侧链接，可以维护一个自定义 Worker 入口，并把 `wrangler.jsonc` 的 `main` 指向该入口构建后的文件。

示例：

```ts
import { createCfWorkersAdapter } from "@itxtech/fdnext-cf-workers";
import type { ExternalLinkProvider } from "@itxtech/fdnext-core";

const productPageLinks: ExternalLinkProvider = {
  id: "product-page",
  resolveLinks(context) {
    const partNumber = context.facts.partNumber;
    if (!partNumber) return [];
    return [
      {
        id: "product-page",
        label: "Product page",
        url: `https://example.com/parts/${encodeURIComponent(partNumber)}`,
        category: "datasheet",
        priority: 10
      }
    ];
  }
};

export default createCfWorkersAdapter({
  externalLinkProviders: [productPageLinks]
});
```

External Link provider 只能返回 `http:`、`https:` 或 `mailto:` URL。runtime 会清理无效链接，并按 `priority` 排序。

## 9. 维护边界

- Cloudflare adapter 只负责把 `fetch()` 请求交给共享 runtime。
- HTTP route、响应 contract 和 External Link 清理逻辑属于 `packages/core`。
- 不新增旧接口 alias，也不在 Workers 入口维护与 Hapi server 不一致的行为。
- 资源 JSON 会随 Worker bundle 打入产物；上线前以 Wrangler dry-run 输出为准检查最终 bundle 大小。
