# 集成指南（Node / 浏览器 / 服务端）

本项目核心是 `@itxtech/fdnext-core`（纯逻辑、无运行时网络依赖）。它已经内置 iTXTech fdnext DecodePack JSON 规则、编译器、默认资源和平台无关运行时。

本文档说明如何把 fdnext 嵌入 Node、浏览器和服务端部署。HTTP 路由、查询参数、响应结构和 CORS 规则统一维护在 [服务接口文档](SERVER_API.md)。

## 1. Node.js（作为库集成）

```bash
pnpm add @itxtech/fdnext-core
```

安装后可用 `fdnext` CLI，例如 `fdnext part decode MT29F64G08CBABA eng`；规则诊断见 [DecodePack 维护工具](DECODEPACK.md#7-维护工具)。

导出入口：

| 入口 | 用途 |
| --- | --- |
| `@itxtech/fdnext-core` | 引擎、输入输出类型、能力信息和 JSON Schema |
| `@itxtech/fdnext-core/runtime` | HTTP 分发/fetch、CORS 和外部链接提供方 |
| `@itxtech/fdnext-core/node-http` | Node 请求/响应与 Fetch API 桥接 |
| `@itxtech/fdnext-core/cli` | CLI 集成入口 |
| `@itxtech/fdnext-core/decodepack` | 规则编译、检查、解释、默认规则包和共享表 |

```ts
import { createEngine } from "@itxtech/fdnext-core";
// 应用启动时创建一次，后续所有请求复用该实例。
const engine = createEngine();

console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
```

`FdnextEngine` 的首要推荐生命周期是：每个进程、应用、Worker 隔离实例或浏览器运行时只创建一个长期实例。不要在每个 HTTP 请求、解码或搜索调用中重新执行 `createEngine()`。

如需覆盖默认资源（例如热更新数据）：

```ts
import { createEngine, type FdnextResourceBundle } from "@itxtech/fdnext-core";

const resources: FdnextResourceBundle = await loadResourcesFromYourStore();
const engine = createEngine({ resources });
```

只有确实需要在同一份资源上运行多个不同配置的引擎时，才使用 `PreparedCatalog` 共享不可变的资源解析和搜索索引：

```ts
import { createEngine, prepareCatalog } from "@itxtech/fdnext-core";

const catalog = prepareCatalog(resources);
const primaryEngine = createEngine({ catalog });
const chineseEngine = createEngine({ catalog, fallbackLang: "chs" });
```

`prepareCatalog()` 会按资源对象身份缓存；传入的资源在准备后应视为不可变。它是多配置场景的优化边界，不是鼓励逐请求创建引擎。

### 1.1 处理器管线与 SDK 方法

`@itxtech/fdnext-core` 支持操作级处理器管线：

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

### 1.2 运行时分发与外部链接

`@itxtech/fdnext-core` 是平台无关入口，负责统一分发、HTTP 路由和外部链接提供方。Node.js、Cloudflare Workers 等适配器都应调用同一个运行时，而不是各自维护路由。

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
            category: "vnd",
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

外部链接通过正式结果约定输出到 `result.links` 或搜索结果的 `items[].links`：

```ts
interface ExternalLink {
  id: string;
  label: string;
  url: string;
  category?: "vnd" | "ds" | "mkt" | "ref" | "tl" | "com" | "ads";
  image?: string;
  hint?: string;
  fieldKey?: string;
  priority?: number;
}
```

运行时会过滤缺少 `id/label/url` 的链接，只允许 `http:`、`https:`、`mailto:` URL，并按 `priority` 排序。

### 结果 v2 迁移

`fdnext.result.v2` 将外链类别统一为缩写：`vendor → vnd`、`datasheet → ds`、
`marketplace → mkt`、`reference → ref`、`tool → tl`、`community → com`，并新增
`ads`，用于广告、自有推广和服务导流。`ds/ref` 表示资料用途；其他资源不自动等同于技术证据。
分类与 `hint` 独立，展示广告时应保留明确标记。通用结果复制应排除广告；链接可单独导出。
旧名称不属于 v2 结构定义；提供方和严格校验消费者须一起升级，不能只替换显示标签。

成功的 PN/FID 解码新增 `summary: { brief: FieldValue[], full: ResultBlock[] }`：
`brief` 按器件类型给出有序重点字段，`full` 保留全部参数和组件分组。两者
沿用原字段的键、翻译、单位和值。DRAM 包含类型、容量、位宽、速率和电压；受管理 NAND
分别保留设备和组件容量，MCP 的 DRAM 在独立 `dram` 块中；3D XPoint 保留 Deck 语义。
摘要仅选取可见且确实返回的字段，不推算缺失容量、组件数或供电。`full` 与 `blocks` 一致，
关联与警告仍在 `relations/warnings`；摘要不能代替这些内容。丝印与完整 PN 从 `device`
及 `input.query` 读取。`subtitle` 同步补充 DRAM 速率/电压、受管理接口/协议和 XPoint Deck。

## 2. 浏览器（Web / 前端）

浏览器侧推荐用 Vite / Webpack / Rollup / esbuild 打包，关键点：

- 浏览器内嵌解析应使用 `createEngine()`，直接调用 `decodePart()` / `searchParts()` / `decodeIdentifier()` / `searchIdentifiers()` / `getCapabilities()`；`@itxtech/fdnext-core/runtime` 只面向 HTTP 适配器，不是前端本地解析入口。
- 浏览器侧也应在应用启动时创建并复用一个引擎，不要在组件渲染或单次查询中重复创建。
- 默认的 `fdb/mdb/lang` 和 PN 补全资源已嵌入核心打包产物；普通集成不需要额外下载或托管 JSON。
- 自定义 PN 搜索资源的结构与去重要求见 [搜索资源](pn_code/authoring.md#搜索资源)。
- 默认解码器（PN / 带类型的标识符）已由 `@itxtech/fdnext-core` 内置；只有裁剪规则或注入自定义规则时才需要显式传入 `decoders` / `identifierDecoders`
- `@itxtech/fdnext-core/decodepack` 是规则维护入口，面向检查 / 解释 / 编译等工具链；普通前端查询不需要直接引用它。
- `searchParts()` / `searchIdentifiers()` 不传 `limit` 时返回全部匹配项，适合前端一次获取后在内存中分页；传入正整数 `limit` 才会启用前 K 项截断。默认料号搜索同时保留前缀和包含匹配。
- HTTP 搜索的结果上限见 [通用参数](SERVER_API.md#3-通用参数)。
- 自定义搜索结果若需要额外 DecodePack 字段，可通过 `createEngine({ partSearchProjection: ["fields.<key>"] })` 追加投影路径；默认搜索依赖仍会自动保留。

### 2.1 默认内嵌资源（推荐）

核心 npm 发布包仅携带已嵌入打包产物的资源，不重复发布原始 `resources/*.json`；使用上文默认引擎即可。

### 2.2 自定义外部资源

只有需要替换默认数据库或语言包时，才由应用自行维护并托管资源 JSON，再将其组装为 `FdnextResourceBundle`。这些文件不由核心 npm 包提供。下面示例假设应用自己的静态资源挂载到 `/fdnext-resources/`：

- `/fdnext-resources/fdb.json`
- `/fdnext-resources/mdb.json`
- `/fdnext-resources/managed-nand-pn.json`
- `/fdnext-resources/dram-pn.json`
- `/fdnext-resources/lang/chs.json`
- `/fdnext-resources/lang/eng.json`

```ts
import { createEngine } from "@itxtech/fdnext-core";

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
  }
});
```

## 3. 服务端（HTTP 服务）

`@itxtech/fdnext-server` 是基于原生 `node:http` 的标准适配器。它通过 `@itxtech/fdnext-core/node-http` 在 Node 请求/响应与 Fetch API 之间转换，实际路由由运行时统一处理。

### 3.1 仓库内运行

```bash
pnpm install
pnpm server:dev
```

如需指定外部资源目录，增加参数：

```bash
pnpm -C packages/server dev -- --resources /path/to/packages/core/resources
```

发布包不会附带上述目录；生产部署使用 `--resources` 时，需要自行提供符合 `FdnextResourceBundle` 结构的外部资源目录。

构建后运行生产入口：

```bash
pnpm -C packages/server build
pnpm server:start
```

### 3.2 Docker（最小镜像）

使用 [Dockerfile](../Dockerfile)。

### 3.3 PM2 部署

仓库根目录提供 `ecosystem.config.cjs`：

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs fdnext-server
```

### 3.4 发布包与程序化接入

```bash
pnpm add @itxtech/fdnext-server
fdnext-server [--host 0.0.0.0] [--port 8080] [--resources ./resources]
```

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--host` | `0.0.0.0` | 监听地址 |
| `--port` | `8080` | 监听端口 |
| `--resources` | 内嵌资源 | 自备资源目录 |

```ts
import { createHttpServer } from "@itxtech/fdnext-server";

const app = createHttpServer({
  host: "0.0.0.0",
  port: 8080,
  resourceDir: "./resources", // 可选
  cors: { origins: ["https://app.example.com"] },
  searchLimit: 300
});
await app.listen();
// app.server 是 node:http 的 Server 实例；app.engine 可直接执行 SDK 操作。
```

显式 `cors` / `searchLimit` 优先于环境配置；变量语义与 HTTP 行为见 [服务 API](SERVER_API.md)。

### 3.5 构建信息

标准打包产物构建会从 git 写入短 `commitHash`，`buildTime` 使用当前 ISO 时间。CI / 无服务器平台可以显式设置 `FDNEXT_COMMIT_HASH` 和 `FDNEXT_BUILD_TIME` 覆盖。直接从源码运行服务 / CLI、没有打包器注入构建元数据时，`buildTime` 使用进程启动时的 ISO 时间。

Worker 的核心与适配器构建都注入上述信息，避免全局范围的 `Date` 回退将构建时间记为 Unix 纪元起点。

## 4. 无服务器平台适配

[Cloudflare Workers 部署](CF_WORKERS.md) 负责 Worker 入口、Wrangler 和 Dashboard 配置。
