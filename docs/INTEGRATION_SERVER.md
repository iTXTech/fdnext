# 服务端集成（Node.js）

`@fdnext/server` 提供一个“兼容 FDWebServer 路由形状”的 Node HTTP 服务实现，适合：

- 直接部署成独立服务
- 嵌入到你自己的 Node.js 程序中（复用 `@fdnext/core` 引擎能力）

## 1. 在仓库内运行

```bash
pnpm install
pnpm sync:resources
pnpm -r build
node /Users/peratx/dev/fdnext/packages/server/dist/bin.js --host 0.0.0.0 --port 8080 --resources /Users/peratx/dev/fdnext/resources
```

也可以使用 CLI 启动服务：

```bash
node /Users/peratx/dev/fdnext/packages/cli/dist/index.js serve 0.0.0.0 8080
```

## 2. HTTP 路由

当前内置路由（与原 FDWebServer 兼容方向一致）：

- `GET /`：健康检查
- `GET /info`：版本与统计信息
- `GET /decode?pn=...&lang=...`
- `GET /decodeId?id=...&lang=...`
- `GET /searchPn?pn=...&lang=...&limit=...`
- `GET /searchId?id=...&lang=...&limit=...`
- `GET /summary?pn=...&lang=...`
- `GET /summaryId?id=...&lang=...`

## 3. 资源目录（resources）

服务端默认从 `--resources` 指向的目录读取：

- `fdb.json`
- `mdb.json`
- `lang/chs.json`
- `lang/eng.json`

在仓库内可用 `pnpm sync:resources` 从旧项目同步资源到 `/Users/peratx/dev/fdnext/resources`。

## 4. 自定义规则/解码器（推荐方式）

`@fdnext/core` 本身不内置厂商解析逻辑，你可以自己注入：

```ts
import { createEngine } from "@fdnext/core";
import { loadResourcesFromDir } from "@fdnext/core/node";
import { compileRulesToDecoders, defaultDslRules, compileFlashIdRulesToDecoders, defaultFlashIdRules } from "@fdnext/dsl";

const engine = createEngine({
  resources: loadResourcesFromDir("./resources"),
  decoders: compileRulesToDecoders(defaultDslRules),
  flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
});
```

如果你想在 HTTP 层也做定制，建议复用 `engine` 自己封装路由，而不是修改 vendor decoder 文件（核心思想是 “规则数据化”）。

