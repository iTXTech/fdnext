# 集成指南（Node / 浏览器 / 服务端）

本项目核心是 `@itxtech/fdnext-core`（纯逻辑、无运行时网络依赖），解码规则由 `@itxtech/fdnext-dsl` 的 JSON DSL packs 提供，默认数据由 `@itxtech/fdnext-resources` 提供。

## 1. Node.js（作为库集成）

```ts
import { createEngine } from "@itxtech/fdnext-core";
import { compileRulesToDecoders, defaultDslRules, compileIdentifierRulesToDecoders, defaultIdentifierRules } from "@itxtech/fdnext-dsl";
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compileRulesToDecoders(defaultDslRules),
  identifierDecoders: compileIdentifierRulesToDecoders(defaultIdentifierRules)
});

console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
```

如需覆盖默认资源（例如热更新数据）：

```ts
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";

const resources = process.env.FDNEXT_RESOURCES ? loadResourcesFromDir(process.env.FDNEXT_RESOURCES) : embeddedResourceBundle;
```

### 1.1 Processor 管线与 SDK 方法

`@itxtech/fdnext-core` 支持 operation 级 Processor 管线：

```ts
engine.registerProcessor({
  beforeOperation(ctx) {
    if (ctx.operation === "part.decode") {
      console.log(ctx.query);
    }
  },
  afterOperation(ctx, result) {
    return result;
  }
});

const response = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
```

常用 SDK 方法：

- `engine.getFdb()` / `engine.getMdb()` / `engine.getLang()`
- `engine.getProcessors()`
- `engine.decodePart(input)` / `engine.searchParts(input)`
- `engine.decodeIdentifier(input)` / `engine.searchIdentifiers(input)`
- `engine.getCapabilities()`
- `engine.translateString(key, lang)`
- `engine.getHumanReadableDensity(density, useByte)`

### 1.2 Runtime dispatch 与 External Link

`@itxtech/fdnext-runtime` 是平台无关入口，负责统一 dispatch、HTTP 路由和 External Link provider。Hapi、Cloudflare Workers、阿里云 FC 等 adapter 都应调用同一个 runtime，而不是各自维护路由。

```ts
import { createFdnextRuntime } from "@itxtech/fdnext-runtime";

const runtime = createFdnextRuntime({
  externalLinkProviders: [
    {
      id: "docs",
      resolveLinks(ctx) {
        if (ctx.facts.vendor === "micron") {
          return [{
            id: "micron.home",
            label: "Micron",
            url: "https://www.micron.com/",
            category: "vendor",
            priority: 10
          }];
        }
        return [];
      }
    }
  ]
});

const response = await runtime.dispatch({
  operation: "part.decode",
  input: { query: "MT29F64G08CBABA", lang: "eng" },
  meta: { adapter: "custom" }
});
```

External Link 通过正式 result contract 输出到 `result.links` 或搜索结果的 `items[].links`：

```ts
interface ExternalLink {
  id: string;
  label: string;
  url: string;
  category?: "vendor" | "datasheet" | "marketplace" | "reference" | "tool" | "community";
  image?: string;
  hint?: string;
  fieldKey?: string;
  priority?: number;
}
```

runtime 会过滤缺少 `id/label/url` 的链接，并只允许 `http:`、`https:`、`mailto:` URL。

## 2. 浏览器（Web / Frontend）

浏览器侧推荐用 Vite / Webpack / Rollup / esbuild 打包，关键点：

- 不要在浏览器使用 `@itxtech/fdnext-core/node`（它依赖 Node 的 `fs`）
- 资源（`fdb/mdb/lang`，以及用于 PN 补全的 `managed-nand-pn/dram-pn`）建议用 `fetch()` 加载静态 JSON
- `managed-nand-pn.json` / `dram-pn.json` 是顶层数组，只保留 `vendor/pn`；Micron DRAM FBGA code 反查统一来自 `mdb.json`
- 解码器（PN / typed identifier）来自 `@itxtech/fdnext-dsl` 的默认规则包（JSON import attributes：`with { type: "json" }`）

### 2.1 方式 A：fetch 静态 JSON（推荐）

将仓库内的 `packages/resources/resources/` 目录作为静态资源发布。下面示例假设挂载到 `/fdnext-resources/`：

- `/fdnext-resources/fdb.json`
- `/fdnext-resources/mdb.json`
- `/fdnext-resources/managed-nand-pn.json`
- `/fdnext-resources/dram-pn.json`
- `/fdnext-resources/lang/chs.json`
- `/fdnext-resources/lang/eng.json`

```ts
import { createEngine } from "@itxtech/fdnext-core";
import { compileRulesToDecoders, defaultDslRules, compileIdentifierRulesToDecoders, defaultIdentifierRules } from "@itxtech/fdnext-dsl";

async function loadJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const [flashDatabase, packageMarkings, managedNandParts, dramParts, chs, eng] = await Promise.all([
  loadJson("/fdnext-resources/fdb.json"),
  loadJson("/fdnext-resources/mdb.json"),
  loadJson("/fdnext-resources/managed-nand-pn.json"),
  loadJson("/fdnext-resources/dram-pn.json"),
  loadJson("/fdnext-resources/lang/chs.json"),
  loadJson("/fdnext-resources/lang/eng.json")
]);

const engine = createEngine({
  resources: {
    partIndex: {
      rawNand: flashDatabase,
      managedNand: managedNandParts,
      dram: dramParts
    },
    identifierIndex: {
      nandFlash: flashDatabase
    },
    markingIndex: {
      packageMarkings
    },
    vendorIndex: {},
    translationIndex: { chs, eng }
  },
  decoders: compileRulesToDecoders(defaultDslRules),
  identifierDecoders: compileIdentifierRulesToDecoders(defaultIdentifierRules)
});
```

### 2.2 方式 B：bundler 直接 import JSON

如需把资源打进前端包里，请按你的工具链配置 JSON loader（写法依赖 bundler，不在此展开）。

## 3. 服务端（HTTP Server）

`@itxtech/fdnext-server` 是基于 Hapi 的标准 adapter。它只负责把 Hapi request 转给 `@itxtech/fdnext-runtime`，实际路由由 runtime 统一处理。

### 3.1 仓库内运行

```bash
pnpm install
pnpm server:dev
```

如需指定外部资源目录，增加参数：

```bash
pnpm -C packages/server dev -- --resources /path/to/packages/resources/resources
```

构建后运行生产入口：

```bash
pnpm -C packages/server build
pnpm server:start
```

### 3.2 Docker（最小镜像）

见 `packages/server/Dockerfile`。

### 3.3 PM2 部署

仓库根目录提供 `ecosystem.config.cjs`：

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs fdnext-server
```

### 3.4 HTTP 路由

- `GET /`：健康检查，返回 server name 和 version
- `GET /capabilities`
- `GET /parts/decode?query=MT29F64G08CBABA&lang=eng`
- `GET /parts/search?query=MT29&lang=eng&limit=10`
- `GET /identifiers/decode?query=2C64444BA900&lang=eng`
- `GET /identifiers/search?query=2C64&lang=eng&limit=10`

`part` routes also accept flat constraint query parameters: `vendor`, `chipKind`, `productType`, and `strict=true|false`.

说明：

- 所有路由返回 JSON
- `/capabilities` 返回服务版本、FDB 版本、控制器清单、FlashID / PN / DRAM PN / Micron FBGA 数量，以及当前引擎注册的 PN / identifier decoder 列表；SDK 的 `engine.getCapabilities()` 与 HTTP 返回同一份结构。
- `identifiers` routes default to `nand.flash_id`; only pass `idScheme` if a future scheme needs to be selected explicitly.
- decode 响应包含 `subtitle`，适合作为列表或详情页副标题；结构化身份仍以 `device` 为准，详情字段在 `blocks[].fields[]`
- Identifier API 只处理真实 decodable identifier scheme。FBGA 等 marking code 通过 `part.search` 返回 `marking_for` relation；可跳转动作放在对应的 `relations[].action`。
- CORS 允许所有来源（`Access-Control-Allow-Origin: *`）
- 服务端响应会包含 `X-Powered-By` header（用于运维识别）

## 4. Serverless adapter

### 4.1 Cloudflare Workers

`@itxtech/fdnext-cf-workers` 暴露默认 Worker，也可以用 `createCfWorkersAdapter()` 注入自定义 runtime options：

```ts
import worker from "@itxtech/fdnext-cf-workers";

export default worker;
```

### 4.2 阿里云函数计算 / 自定义运行时

`@itxtech/fdnext-aliyun-fc` 提供 Node HTTP handler 和可直接启动的自定义运行时入口：

```ts
import { startAliyunFc } from "@itxtech/fdnext-aliyun-fc";

startAliyunFc();
```

默认监听 `FC_SERVER_PORT`、`PORT` 或 `9000`，host 默认为 `0.0.0.0`。
