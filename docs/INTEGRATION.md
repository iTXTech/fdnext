# 集成指南（Node / 浏览器 / 服务端）

本项目核心是 `@itxtech/fdnext-core`（纯逻辑、无运行时网络依赖）。它已经内置 iTXTech fdnext DecodePack JSON 规则、编译器、默认资源和平台无关 runtime。

本文档说明如何把 fdnext 嵌入 Node、浏览器和服务端部署。HTTP 路由、query 参数、响应结构和 CORS 规则统一维护在 [Server 接口文档](SERVER_API.md)。

## 1. Node.js（作为库集成）

```ts
import { createEngine } from "@itxtech/fdnext-core";
// 应用启动时创建一次，后续所有请求复用该实例。
const engine = createEngine();

console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
```

`FdnextEngine` 的首要推荐生命周期是：每个进程、应用、Worker isolate 或浏览器 runtime 只创建一个长期实例。不要在每个 HTTP 请求、decode 或 search 调用中重新执行 `createEngine()`。

如需覆盖默认资源（例如热更新数据）：

```ts
import { createEngine, type FdnextResourceBundle } from "@itxtech/fdnext-core";

const resources: FdnextResourceBundle = await loadResourcesFromYourStore();
const engine = createEngine({ resources });
```

只有确实需要在同一份资源上运行多个不同配置的 engine 时，才使用 `PreparedCatalog` 共享不可变的资源解析和搜索索引：

```ts
import { createEngine, prepareCatalog } from "@itxtech/fdnext-core";

const catalog = prepareCatalog(resources);
const primaryEngine = createEngine({ catalog });
const chineseEngine = createEngine({ catalog, fallbackLang: "chs" });
```

`prepareCatalog()` 会按 resources 对象身份缓存；传入的 resources 在准备后应视为不可变。它是多配置场景的优化边界，不是鼓励逐请求创建 engine。

### 1.1 Processor 管线与 SDK 方法

`@itxtech/fdnext-core` 支持 operation 级 Processor 管线：

```ts
const engine = createEngine({
  processors: [
    {
      beforeOperation(ctx) {
        if (ctx.operation === "part.decode") {
          console.log(ctx.query);
        }
      },
      afterOperation(ctx, result) {
        return result;
      }
    }
  ]
});

const response = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
```

常用 SDK 方法：

- `engine.decodePart(input)` / `engine.searchParts(input)`
- `engine.decodeIdentifier(input)` / `engine.searchIdentifiers(input)`
- `engine.getCapabilities()`

### 1.2 Runtime dispatch 与 External Link

`@itxtech/fdnext-core` 是平台无关入口，负责统一 dispatch、HTTP 路由和 External Link provider。Node.js、Cloudflare Workers、阿里云 FC 等 adapter 都应调用同一个 runtime，而不是各自维护路由。

```ts
import { createRuntime } from "@itxtech/fdnext-core/runtime";

const runtime = createRuntime({
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

- 浏览器内嵌解析应使用 `createEngine()`，直接调用 `decodePart()` / `searchParts()` / `decodeIdentifier()` / `searchIdentifiers()` / `getCapabilities()`；`@itxtech/fdnext-core/runtime` 只面向 HTTP adapter，不是前端本地解析入口。
- 浏览器侧也应在应用启动时创建并复用一个 engine，不要在组件 render 或单次查询中重复创建。
- 资源（`fdb/mdb/lang`，以及用于 PN 补全的 `managed-nand-pn/dram-pn`）建议用 `fetch()` 加载静态 JSON
- `managed-nand-pn.json` / `dram-pn.json` 是顶层数组，只保留 `vendor/pn`；Micron DRAM FBGA code 反查统一来自 `mdb.json`
- 默认解码器（PN / typed identifier）已由 `@itxtech/fdnext-core` 内置；只有裁剪规则或注入自定义规则时才需要显式传入 `decoders` / `identifierDecoders`
- `@itxtech/fdnext-core/decodepack` 是规则维护入口，面向 check / explain / compile 等工具链；普通前端查询不需要直接引用它。
- `searchParts()` / `searchIdentifiers()` 不传 `limit` 时返回全部匹配项，适合前端一次获取后在内存中分页；传入正整数 `limit` 才会启用 top-K 截断。默认 part search 同时保留 prefix 和 contains 匹配。
- 上述完整结果语义只属于 Core SDK。`@itxtech/fdnext-core/runtime` 的 HTTP search 默认和硬上限为 300，可由部署方用 `FDNEXT_SEARCH_LIMIT` 调整；客户端 query 的 `limit` 只能下调。
- 自定义搜索结果若需要额外 DecodePack 字段，可通过 `createEngine({ partSearchProjection: ["fields.<key>"] })` 追加投影路径；默认搜索依赖仍会自动保留。

### 2.1 方式 A：fetch 静态 JSON（推荐）

将 `@itxtech/fdnext-core` 的资源 JSON 目录作为静态资源发布。仓库内路径是 `packages/core/resources/`；发布包内对应路径是 `resources/`。这些 JSON 资源用于 `fetch()` 加载，不作为 package subpath import 使用。下面示例假设挂载到 `/fdnext-core/`：

- `/fdnext-core/fdb.json`
- `/fdnext-core/mdb.json`
- `/fdnext-core/managed-nand-pn.json`
- `/fdnext-core/dram-pn.json`
- `/fdnext-core/lang/chs.json`
- `/fdnext-core/lang/eng.json`

```ts
import { createEngine } from "@itxtech/fdnext-core";

async function loadJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const [flashDatabase, packageMarkings, managedNandParts, dramParts, chs, eng] = await Promise.all([
  loadJson("/fdnext-core/fdb.json"),
  loadJson("/fdnext-core/mdb.json"),
  loadJson("/fdnext-core/managed-nand-pn.json"),
  loadJson("/fdnext-core/dram-pn.json"),
  loadJson("/fdnext-core/lang/chs.json"),
  loadJson("/fdnext-core/lang/eng.json")
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
  }
});
```

### 2.2 方式 B：bundler 直接 import JSON

如需把资源打进前端包里，请按你的工具链配置 JSON loader（写法依赖 bundler，不在此展开）。

## 3. 服务端（HTTP Server）

`@itxtech/fdnext-server` 是基于原生 `node:http` 的标准 adapter。它通过 `@itxtech/fdnext-core/node-http` 在 Node request/response 与 Fetch API 之间转换，实际路由由 runtime 统一处理。

### 3.1 仓库内运行

```bash
pnpm install
pnpm server:dev
```

如需指定外部资源目录，增加参数：

```bash
pnpm -C packages/server dev -- --resources /path/to/packages/core/resources
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

### 3.4 HTTP 接口

Node.js server、Cloudflare Workers 和阿里云 FC 使用同一套 runtime HTTP 接口。完整接口表、query 参数、响应结构、旧接口移除说明和 CORS 行为见 [Server 接口文档](SERVER_API.md)。

标准 bundle 构建会从 git 写入短 `commitHash`，`buildTime` 使用当前 ISO 时间。CI / serverless 平台可以显式设置 `FDNEXT_COMMIT_HASH` 和 `FDNEXT_BUILD_TIME` 覆盖。直接从源码运行 server / CLI、没有 bundler 注入 build metadata 时，`buildTime` 使用进程启动时的 ISO 时间。

## 4. Serverless adapter

### 4.1 Cloudflare Workers

Cloudflare Workers adapter 由仓库内 `packages/cf-workers/src/index.ts` 暴露默认 Worker，也可以用 `createCfWorkersAdapter()` 注入自定义 runtime options。独立部署说明和 `wrangler.jsonc` 约定见 [Cloudflare Workers 部署](CF_WORKERS.md)。

```ts
import worker from "./packages/cf-workers/src/index";

export default worker;
```

Worker env `FDNEXT_CORS_ORIGINS` 可设置为 `*` 或多个 origin，例如：

```text
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
FDNEXT_SEARCH_LIMIT=300
```

如果使用 Cloudflare Workers Builds 自动部署，并希望 CORS allowlist 只保存在 Cloudflare Dashboard，不进入仓库配置，保留 `packages/cf-workers/wrangler.jsonc` 中的 `keep_vars: true`，不要在 `vars` 中声明同名变量。

### 4.2 阿里云函数计算 / 自定义运行时

阿里云 FC adapter 由仓库内 `packages/aliyun-fc/src/index.ts` 提供 Node HTTP handler 和可直接启动的自定义运行时入口：

```ts
import { startAliyunFc } from "./packages/aliyun-fc/src/index";

startAliyunFc();
```

默认监听 `FC_SERVER_PORT`、`PORT` 或 `9000`，host 默认为 `0.0.0.0`。

阿里云 FC adapter 从环境变量读取 `FDNEXT_CORS_ORIGINS`：

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
FDNEXT_SEARCH_LIMIT=300
```

`*` 会放开所有来源；多个 origin 用逗号、空格或换行分隔，runtime 会按请求 `Origin` 精确匹配。preflight `OPTIONS` 会返回 `204`。
