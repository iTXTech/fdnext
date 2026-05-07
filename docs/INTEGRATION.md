# 集成指南（Node / 浏览器 / 服务端）

本项目核心是 `@itxtech/fdnext-core`（纯逻辑、无运行时网络依赖），解码规则由 `@itxtech/fdnext-dsl` 的 JSON DSL packs 提供，默认数据由 `@itxtech/fdnext-resources` 提供。

## 1. Node.js（作为库集成）

```ts
import { createEngine } from "@itxtech/fdnext-core";
import { compileRulesToDecoders, defaultDslRules, compileFlashIdRulesToDecoders, defaultFlashIdRules } from "@itxtech/fdnext-dsl";
import { embeddedResources } from "@itxtech/fdnext-resources";

const engine = createEngine({
  resources: embeddedResources,
  decoders: compileRulesToDecoders(defaultDslRules),
  flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
});

console.log(engine.detect("MT29F64G08CBABA", { lang: "eng", combineFdb: true }));
console.log(engine.decodeFlashId("2C64444BA900", { lang: "eng", combineFdb: true }));
```

如需覆盖默认资源（例如热更新数据）：

```ts
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";

const resources = process.env.FDNEXT_RESOURCES ? loadResourcesFromDir(process.env.FDNEXT_RESOURCES) : embeddedResources;
```

### 1.1 Processor 管线与 SDK 方法

`@itxtech/fdnext-core` 支持请求级 Processor 管线（可读取请求上下文并短路）：

```ts
engine.registerProcessor({
  info(ctx, payload) {
    if (ctx.userAgent.includes("health-check")) {
      payload.info = { lightweight: true };
      return false;
    }
    return true;
  }
});

const response = engine.dispatch("info", {
  query: "",
  remote: "127.0.0.1",
  userAgent: "my-client/1.0"
});
```

常用 SDK 方法：

- `engine.getVendor(partNumber)`
- `engine.getFdb()` / `engine.getMdb()` / `engine.getLang()`
- `engine.getProcessors()`
- `engine.translate(value, lang)` / `engine.translateArray(value, translateKey, lang)`
- `engine.getHumanReadableDensity(density, useByte)`

## 2. 浏览器（Web / Frontend）

浏览器侧推荐用 Vite / Webpack / Rollup / esbuild 打包，关键点：

- 不要在浏览器使用 `@itxtech/fdnext-core/node`（它依赖 Node 的 `fs`）
- 资源（`fdb/mdb/lang`）建议用 `fetch()` 加载静态 JSON
- 解码器（PN / FlashId）来自 `@itxtech/fdnext-dsl` 的默认规则包（JSON import attributes：`with { type: "json" }`）

### 2.1 方式 A：fetch 静态 JSON（推荐）

将仓库内的 `packages/resources/resources/` 目录作为静态资源发布。下面示例假设挂载到 `/fdnext-resources/`：

- `/fdnext-resources/fdb.json`
- `/fdnext-resources/mdb.json`
- `/fdnext-resources/lang/chs.json`
- `/fdnext-resources/lang/eng.json`

```ts
import { createEngine } from "@itxtech/fdnext-core";
import { compileRulesToDecoders, defaultDslRules, compileFlashIdRulesToDecoders, defaultFlashIdRules } from "@itxtech/fdnext-dsl";

async function loadJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const [fdbRaw, mdbRaw, chs, eng] = await Promise.all([
  loadJson("/fdnext-resources/fdb.json"),
  loadJson("/fdnext-resources/mdb.json"),
  loadJson("/fdnext-resources/lang/chs.json"),
  loadJson("/fdnext-resources/lang/eng.json")
]);

const engine = createEngine({
  resources: { fdbRaw, mdbRaw, langRaw: { chs, eng } },
  decoders: compileRulesToDecoders(defaultDslRules),
  flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
});
```

### 2.2 方式 B：bundler 直接 import JSON

如需把资源打进前端包里，请按你的工具链配置 JSON loader（写法依赖 bundler，不在此展开）。

## 3. 服务端（HTTP Server）

`@itxtech/fdnext-server` 是基于 Hapi 的标准实现（方便直接部署或二次封装）。

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

### 3.4 HTTP 路由（与上游 FDWebServer 对齐）

- `GET /`：健康检查
- `GET /info`：版本与统计信息
- `GET /decode?pn=...&lang=...`
- `GET /decodeId?id=...&lang=...`
- `GET /searchPn?pn=...&lang=...&limit=...`
- `GET /searchId?id=...&lang=...&limit=...`
- `GET /summary?pn=...&lang=...`
- `GET /summaryId?id=...&lang=...`

说明：

- 所有路由返回 JSON
- CORS 允许所有来源（`Access-Control-Allow-Origin: *`）
- 服务端响应会包含 `X-Powered-By` header（用于运维识别）
