# 集成指南（Node / 浏览器 / 服务端）

本项目核心是 `@itxtech/fdnext-core`（纯逻辑、无运行时网络依赖）。它已经内置 iTXTech fdnext DecodePack JSON 规则、编译器、默认 runtime data 和平台无关 runtime。

本文档说明如何把 fdnext 嵌入 Node、浏览器和服务端部署。HTTP 路由、query 参数、响应结构和 CORS 规则统一维护在 [Server 接口文档](SERVER_API.md)。

## 1. Node.js（作为库集成）

```ts
import { createEngine } from "@itxtech/fdnext-core";
const engine = await createEngine();

console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
```

如需覆盖默认 runtime data（例如热更新数据），只接受 `fdnext-runtime-data.json` 新格式：

```ts
import { createEngine, type FdnextRuntimeData } from "@itxtech/fdnext-core";

const runtimeData: FdnextRuntimeData = await loadRuntimeDataFromYourStore();
const engine = await createEngine({ runtimeData });
```

如果 runtime data 作为静态文件发布，也可以让 core 自行 fetch：

```ts
import { createEngine } from "@itxtech/fdnext-core";

const engine = await createEngine({
  runtimeDataUrl: "/fdnext-core/fdnext-runtime-data.json"
});
```

### 1.1 Processor 管线与 SDK 方法

`@itxtech/fdnext-core` 支持 operation 级 Processor 管线：

```ts
const engine = await createEngine({
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

`@itxtech/fdnext-core` 是平台无关入口，负责统一 dispatch、HTTP 路由和 External Link provider。Hapi、Cloudflare Workers、阿里云 FC 等 adapter 都应调用同一个 runtime，而不是各自维护路由。

```ts
import { createRuntime } from "@itxtech/fdnext-core/runtime";

const runtime = await createRuntime({
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
- 默认入口会把内嵌 `fdnext-runtime-data.json` 打进 bundle；如果需要 code-only bundle，应从 `@itxtech/fdnext-core/external` 导入并通过 `runtimeData` / `runtimeDataUrl` 注入单文件 runtime data。
- 用户自定义资源必须先由 fdbgen 生成 `fdnext-runtime-data.json`，runtime 不再接受旧的多文件 raw JSON 资源。
- 默认解码器（PN / typed identifier）已由 `@itxtech/fdnext-core` 内置；只有裁剪规则或注入自定义规则时才需要显式传入 `decoders` / `identifierDecoders`
- `@itxtech/fdnext-core/decodepack` 是规则维护入口，面向 check / explain / compile 等工具链；普通前端查询不需要直接引用它。

### 2.1 方式 A：fetch 单文件 runtime data（推荐）

将 `@itxtech/fdnext-core` 的 runtime data JSON 作为静态资源发布。仓库内路径和发布包 subpath 都是 `runtime-data/fdnext-runtime-data.json`。下面示例假设挂载到 `/fdnext-core/fdnext-runtime-data.json`：

```ts
import { createEngine } from "@itxtech/fdnext-core/external";

const engine = await createEngine({
  runtimeDataUrl: "/fdnext-core/fdnext-runtime-data.json"
});
```

也可以自己 fetch 后传入。loader 只检查 `v` 和 `src`，其余结构按生成器输出约定消费：

```ts
import { createEngine, type FdnextRuntimeData } from "@itxtech/fdnext-core/external";

async function loadRuntimeData(path: string): Promise<FdnextRuntimeData> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const runtimeData = await loadRuntimeData("/fdnext-core/fdnext-runtime-data.json");
const engine = await createEngine({
  runtimeData
});
```

### 2.2 方式 B：使用内嵌 runtime data

如果允许 bundle 直接携带 runtime data，使用主入口即可：

```ts
import { createEngine } from "@itxtech/fdnext-core";

const engine = await createEngine();
```

## 3. 服务端（HTTP Server）

`@itxtech/fdnext-server` 是基于 Hapi 的标准 adapter。它只负责把 Hapi request 转给 `@itxtech/fdnext-core`，实际路由由 runtime 统一处理。

### 3.1 仓库内运行

```bash
pnpm install
pnpm server:dev
```

如需指定外部 runtime data 文件，增加参数：

```bash
pnpm -C packages/server dev -- --runtime-data packages/core/runtime-data/fdnext-runtime-data.json
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

Hapi server、Cloudflare Workers 和阿里云 FC 使用同一套 runtime HTTP 接口。完整接口表、query 参数、响应结构、旧接口移除说明和 CORS 行为见 [Server 接口文档](SERVER_API.md)。

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
```

如果使用 Cloudflare Workers Builds 自动部署，并希望 CORS allowlist 只保存在 Cloudflare Dashboard，不进入仓库配置，保留根目录 `wrangler.jsonc` 中的 `keep_vars: true`，不要在 `vars` 中声明同名变量。

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
```

`*` 会放开所有来源；多个 origin 用逗号、空格或换行分隔，runtime 会按请求 `Origin` 精确匹配。preflight `OPTIONS` 会返回 `204`。
