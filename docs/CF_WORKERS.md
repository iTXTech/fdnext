# Cloudflare Workers 部署

本文档只覆盖 `@itxtech/fdnext-cf-workers` 的 Cloudflare Workers 部署。该入口复用 `@itxtech/fdnext-core` 的 HTTP 路由和外部链接提供方机制，不维护独立兼容路由。

如果目标是 FlashMaster Classic 迁移，或客户端仍然请求旧 FlashDetector / FDWebServer 路由，请部署 `@itxtech/fd-server`，部署说明见 [`packages/fd-server/README.md`](../packages/fd-server/README.md)。

## 1. 前置条件

- 已完成 [开发环境准备](TESTING.md#开发环境与入口)
- 已拥有 Cloudflare 账号，并准备通过 Wrangler 登录或使用 API 编码段部署

Wrangler 可以临时执行，不需要加入仓库依赖：

```bash
pnpm dlx wrangler login
```

如果在 CI 中部署，使用 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 等环境变量即可，不需要交互式登录。

## 2. 配置文件

`packages/cf-workers/wrangler.jsonc` 是 Workers 部署入口：

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "fdnext",
  "main": "dist/index.js",
  "compatibility_date": "2026-05-10",
  "workers_dev": true,
  "minify": true,
  "keep_vars": true,
  "build": {
    "command": "pnpm -C ../core build && pnpm build",
    "watch_dir": [
      "../core/src",
      "../core/resources",
      "src"
    ]
  }
}
```

关键点：

- `main` 指向包目录内的 Cloudflare Workers 适配器构建产物；根目录脚本会进入 `packages/cf-workers` 后执行 Wrangler。
- `build.command` 会先构建 `@itxtech/fdnext-core`，再构建 Cloudflare Workers 适配器。构建信息的来源与覆盖变量见 [构建信息](INTEGRATION.md#35-构建信息)。
- `keep_vars` 保留 Cloudflare Dashboard 中配置的 Worker 环境变量，避免自动部署时用仓库配置清空远端变量。
- 当前 Worker 不需要 `nodejs_compat`，入口只依赖 Web Fetch API。
- 默认打开 `workers_dev`，可以直接部署到 `*.workers.dev`；如果要绑定生产域名，在该配置中添加 `route` / `routes` 或在 Cloudflare 控制台绑定后保持 Wrangler 配置同步。

## 3. Cloudflare Workers Builds 设置

如果使用 Cloudflare Dashboard 连接 Git 仓库自动构建，不能把构建命令设置成 `pnpm build`。那会构建整个多包仓库，包括 Node.js 服务，而 Workers 部署只需要核心和 `cf-workers` 适配器。

Workers Builds 目前不会执行 `wrangler.jsonc` 里的定制构建配置，因此 Dashboard 里需要显式设置：

| 设置 | 值 |
| --- | --- |
| 根目录 | 留空或仓库根目录 |
| 构建命令 | `pnpm install --frozen-lockfile=false && pnpm cf-workers:build` |
| 部署命令 | `pnpm cf-workers:deploy` |
| 非生产分支部署命令 | `pnpm --dir packages/cf-workers dlx wrangler versions upload --config wrangler.jsonc` |

建议同时添加构建变量：

| 变量 | 值 |
| --- | --- |
| `SKIP_DEPENDENCY_INSTALL` | `1` |

这样可以避免 Workers Builds 自动选择 `bun install`，确保依赖安装和构建都走 pnpm。

运行时的 `FDNEXT_CORS_ORIGINS` / `FDNEXT_SEARCH_LIMIT` 在 Dashboard 的 Worker 环境变量中维护，语义见 [服务 API](SERVER_API.md)。仅在 Dashboard 保存的变量不要同时写入 Wrangler `vars`；上文 `keep_vars` 配置负责保留它们。

## 4. 本地开发

```bash
pnpm cf-workers:dev
```

Wrangler 会先执行 `packages/cf-workers/wrangler.jsonc` 中的 `build.command`，然后启动本地 Worker。默认地址通常是 `http://127.0.0.1:8787`。

冒烟检查:

```bash
curl 'http://127.0.0.1:8787/'
curl 'http://127.0.0.1:8787/capabilities?lang=eng'
curl 'http://127.0.0.1:8787/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8787/identifiers/decode?query=2C,64,44,4B,A9,00'
```

响应判定见 [HTTP 接口总览](SERVER_API.md#2-接口总览)。

## 5. HTTP 配置与接口

路由、参数、响应、CORS 和搜索上限统一见 [服务 API](SERVER_API.md)。

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

## 8. 自定义外部链接

默认入口不会注入外部链接提供方。仓库将适配器构建为 `packages/cf-workers/dist/index.js`；该包目前不声明 npm 运行时 `main` / `exports`，自定义接入使用 `src/index.ts` 的 `createCfWorkersAdapter()`。如果部署环境需要对结果追加平台侧链接，可以在 `packages/cf-workers` 内维护一个自定义 Worker 源码入口，并把 `packages/cf-workers/wrangler.jsonc` 的 `main` 指向该入口。

示例：

```ts
import { createCfWorkersAdapter } from "./src/index";
import type { ExternalLinkProvider } from "@itxtech/fdnext-core/runtime";

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
        category: "ds",
        priority: 10
      }
    ];
  }
};

export default createCfWorkersAdapter({
  externalLinkProviders: [productPageLinks]
});
```

提供方的约定、URL 清理和排序见 [运行时与外部链接](INTEGRATION.md#12-运行时分发与外部链接)。

## 9. 维护边界

- Cloudflare 适配器只负责把 `fetch()` 请求交给共享运行时。
- HTTP 路由、响应约定和外部链接清理逻辑属于 `packages/core`。
- 不新增旧接口别名，也不在 Workers 入口维护与 Node.js 服务不一致的行为。
- 资源 JSON 会随 Worker 打包产物打入产物；上线前以 Wrangler 试运行输出为准检查最终打包产物大小。
