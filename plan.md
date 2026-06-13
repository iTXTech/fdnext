# fdnext runtime data v3.1 migration plan

## Goal

将 fdnext runtime 从多份大 JSON + 启动期构建索引，迁移为单一 prebuilt compact JSON artifact。目标是降低 Cloudflare Workers、浏览器嵌入、Node server 和 CLI 的 warmup 开销，并让 runtime 不再携带旧的 raw resource 构建能力。

本仓库只执行 fdnext 部分。FlashMaster 相关内容只记录集成约束和后续验证入口，不在本仓库直接改 FlashMaster。

## Decisions

- 继续使用 fdnext v3.1 版本线，不提升 major 版本。
- 对外 result contract、HTTP API、decode/search 操作语义保持不变；主要迁移点是 runtime 初始化和自定义资源输入格式。
- 当前没有大规模基于 fdnext 的二次开发产品，FlashMaster 是主要下游，因此可以在 v3.1 内直接推进 runtime data 迁移。
- runtime data 文件固定为 `packages/core/runtime-data/fdnext-runtime-data.json`。
- runtime data 顶层只保留 `v`、`src`、`d`：

```json
{
  "v": "fdnext.runtime.v1",
  "src": "8A91F03C",
  "d": {}
}
```

- `src` 是 `packages/core/data-source/**` canonical 内容的 CRC32，8 位大写十六进制。
- `src` CRC32 的 canonical 输入规则必须固定：按声明的相对路径顺序读取 data-source 文件，统一为 UTF-8 文本和 LF 换行，用相对路径、NUL 分隔符、文件内容依次拼接后计算 CRC32。不要 parse JSON 后重排再计算，避免不同工具改变源文本语义。
- 不写 `pkg`、`g`、`builtAt`、commit、sha256、整体 checksum 或每文件 checksum。
- runtime 不引入额外压缩库。artifact 使用 compact JSON，传输压缩交给 HTTP/CDN/bundler。
- 旧 JSON 可以继续作为维护源数据，但不再作为 runtime 分发物。
- 用户自定义资源只允许传新 runtime data 格式，不保留旧 `resources` API 兼容。
- `createEngine()` 和 `createRuntime()` 迁移为 async。
- 虽然继续使用 v3.1 版本线，但同步初始化改 async 仍是 SDK 初始化方式变化；文档和 FlashMaster 迁移需要明确这一点。
- core 只保留 runtime 能力，不保留 raw resource builder。
- runtime loader 只校验 `v` 和 `src` 格式，不深度校验 `d`。
- 深度校验、构建、审计全部归属 `packages/fdbgen`。
- 官方 prebuilt runtime data 直接提交到 git；用户和 FlashMaster 不需要自行生成。

## Repository Layout

目标目录：

```text
packages/core/data-source/
  fdb.json
  mdb.json
  managed-nand-pn.json
  dram-pn.json
  controller-groups.json
  lang/
    chs.json
    eng.json

packages/core/runtime-data/
  fdnext-runtime-data.json
```

`packages/core/package.json` 只发布 runtime artifact，不发布 `data-source`：

```json
{
  "files": [
    "dist/**/*.js",
    "dist/**/*.d.ts",
    "runtime-data/fdnext-runtime-data.json"
  ]
}
```

## Runtime Data Shape

`d` 按功能分区：

```json
{
  "f": {},
  "m": {},
  "s": {},
  "c": {},
  "l": {}
}
```

分区含义：

- `f`: FDB runtime lookup data。
- `m`: MDB / marking exact lookup data。
- `s`: PN、marking、Flash ID search indexes。
- `c`: capability inventory and controller groups。
- `l`: language packs。

### FDB Section

`f` 使用对象索引加 tuple payload。decode 路径需要 `vendor + pn` 和 `flashId` 精确查询，所以不转成全局 tuple array 后再 hydrate Map。

建议结构：

```json
{
  "i": {},
  "p": {
    "micron": {
      "MT29F64G08CBABA": ["MT29F64G08CBABA", ["2C..."]]
    }
  },
  "id": {
    "2C64444BA900": [0, 0, 0, ["SM2259XT"], ["micron MT29F64G08CBABA"]]
  },
  "tk": {
    "micron": {
      "MT29F64G08CBABA": "MT29F64G08CBABA"
    }
  },
  "ct": ["SM2259XT"]
}
```

`tk` 是 token-equivalent part-number lookup，避免 runtime 在 vendor PN 表中扫描。

PN record tuple 按固定顺序编码，空尾部字段可省略：

```text
[pn, id, f, a, l, c, t, m, pkg, sg, pc, vol, so, d, e, r, n, pl]
```

### MDB Section

`m` 保留最小 exact lookup，不只依赖 search rows：

```json
{
  "mi": { "D9ABC": "MT40..." },
  "sp": { "PF123": ["PE..."] },
  "dc": { "12345": ["MT40..."] },
  "mk": ["D9ABC"]
}
```

含义：

- `mi`: Micron marking code to PN。
- `sp`: SpecTek marking code to PN list。
- `dc`: Micron DRAM 5-character FBGA code to PN list。
- `mk`: Micron FBGA code set input，避免 runtime 再从 object keys 派生。

### Search Section

`s` 使用 plain object bucket，JSON.parse 后直接属性查询，不做 pair-array hydrate：

```json
{
  "p": [
    ["MT29F64G08CBABA", "MT29F64G08CBABA", "micron", 1, 0, 0, 2]
  ],
  "m": [
    ["D9ABC", "micron", "MT40...", "MT40...", 2, 0, 5]
  ],
  "id": ["2C64444BA900"],
  "pe": { "MT29F64G08CBABA": 0 },
  "pp": { "MT29": [0, 1, 2] },
  "me": { "D9ABC": 0 },
  "mp": { "D9": [0, 1] }
}
```

含义：

- `p`: part rows。
- `m`: marking rows。
- `id`: identifier search keys。
- `pe`: part exact index。
- `pp`: part prefix index。
- `me`: marking exact index。
- `mp`: marking prefix index。

Bucket values 保持 `number | number[]`。

### Capability Section

`c` 只存 inventory 原料，不存完整 localized capabilities result：

```json
{
  "n": {
    "fid": 2519,
    "pn": 24445,
    "fbga": 28163
  },
  "ct": ["SM2259XT"],
  "dg": ["usb", "sata"],
  "g": [
    ["all", 167, ["SM2259XT"], 0]
  ]
}
```

最终 capabilities 仍由 runtime 使用 language packs、decoder list 和 build metadata 轻量拼装。

### Language Section

`l` 采用列式格式，原始维护输入仍是普通 lang JSON object：

```json
{
  "k": ["density", "package"],
  "eng": ["Density", "Package"],
  "chs": ["容量", "封装"]
}
```

## fdnext Implementation Scope

### fdbgen

新增 runtime data 构建和校验能力：

```bash
fdnext-fdbgen build-runtime \
  --source packages/core/data-source \
  --output packages/core/runtime-data/fdnext-runtime-data.json

fdnext-fdbgen check-runtime \
  --source packages/core/data-source \
  --file packages/core/runtime-data/fdnext-runtime-data.json

fdnext-fdbgen audit-runtime \
  --file packages/core/runtime-data/fdnext-runtime-data.json
```

职责：

- 读取 `data-source`。
- 完整迁移 raw FDB/MDB/PN/lang/controller-group 构建逻辑。
- 生成 compact runtime data。
- 计算 `src` CRC32。
- 保证 deterministic JSON 输出。
- 深度校验 tuple、bucket ref、反向引用、language column、capability counts。
- 提供 `check-runtime` 供 CI 固定 generated artifact。

根脚本建议：

```json
{
  "runtime-data:generate": "pnpm -C packages/fdbgen exec fdnext-fdbgen build-runtime --source packages/core/data-source --output packages/core/runtime-data/fdnext-runtime-data.json",
  "runtime-data:check": "pnpm -C packages/fdbgen exec fdnext-fdbgen check-runtime --source packages/core/data-source --file packages/core/runtime-data/fdnext-runtime-data.json"
}
```

实际脚本可以按现有 CLI 入口调整，不要求使用上面的精确命令实现。

### core

一步到位移除旧 runtime resource path：

- 删除 `EngineOptions.resources`。
- 删除旧多文件资源包作为 runtime public API。
- 删除 core 内 raw builder 能力：
  - `buildFdb(rawInput)`
  - `buildMdb(rawInput)`
  - `buildKnownPartNumbers(raw)`
  - `buildMicronDramFbgaCodes(raw)`
  - `buildNormalizedIndexes(input)`
  - runtime 侧 `collectFdbControllers(fdb)` 这类构建期扫描。
- 保留 runtime lookup/classification 能力，并让它直接消费 compact runtime data。
- `createEngine()` 改为 async：

```ts
const engine = await createEngine();
const engine = await createEngine({ runtimeData });
const engine = await createEngine({ runtimeDataUrl });
```

- 默认无参数时加载内置 `runtime-data/fdnext-runtime-data.json`。
- `runtimeDataUrl` 支持 FlashMaster web/PWA 和其他浏览器集成。
- loader 只检查：
  - `v === "fdnext.runtime.v1"`
  - `src` 是 8 位大写 hex。
- `createRuntime()` 改为 async。
- CLI 改为 await engine 初始化。
- 为避免浏览器宿主重复携带内置数据，保留统一 async API，但提供同 API 的 external import path：

```ts
import { createEngine } from "@itxtech/fdnext-core/external";
```

  该入口不触发默认内置 runtime data import，要求调用方传 `runtimeData` 或 `runtimeDataUrl`。默认 `@itxtech/fdnext-core` 入口仍可无参数加载内置 runtime data。

### cf-workers

Worker adapter 使用模块级 Promise 缓存 runtime：

```ts
let runtimePromise: Promise<FdnextRuntime> | undefined;

export default {
  fetch(request, env, ctx) {
    runtimePromise ??= createRuntime();
    return runtimePromise.then((runtime) => runtime.fetch(request, {
      adapter: "cf-workers",
      cors: createFdnextCorsOptionsFromEnv(env)
    }));
  }
};
```

目标是同一 isolate 只 warmup 一次。

### server

Node server 启动阶段 await runtime：

```ts
const runtime = await createRuntime(options);
```

HTTP handler 不在每个请求中初始化 engine。

## Tests And Verification

fdnext 侧默认验证：

```bash
pnpm runtime-data:check
pnpm cli decodepack check
pnpm -C packages/core test
pnpm -C packages/core typecheck
pnpm -C packages/fdbgen test
pnpm -C packages/fdbgen typecheck
git diff --check
```

如果 result contract 或跨包 adapter 变更明显，再跑：

```bash
pnpm contract:check
pnpm typecheck
pnpm test
```

新增/调整测试重点：

- generated artifact 与 `data-source` 一致。
- core 默认 async engine 能 decode/search。
- custom `runtimeData` 能 decode/search。
- `runtimeDataUrl` 能通过 fetch-like loader 初始化。
- public result 不泄漏 internal code/source metadata。
- search exact/prefix bucket ref 不越界。
- FDB PN lookup 和 token-equivalent lookup 行为与迁移前一致。
- Flash ID exact/search 行为与迁移前一致。
- capabilities counts/controller groups 与 artifact `c` 一致。

## FlashMaster Integration Notes

这些是后续 FlashMaster 仓库的约束，不在本仓库直接执行：

- FlashMaster 继续使用 `vendor/fdnext` Git submodule。
- 不复制 fdnext source 或 runtime data 到 FlashMaster 仓库。
- 当前 FlashMaster `vite.config.js` 通过 alias 把 `@itxtech/fdnext-core` 指向 `vendor/fdnext/packages/core/src/index.ts`。更新 submodule 后，保持这个主入口用于 embedded web/PWA/singlefile/nano build，让 `packages/core/runtime-data/fdnext-runtime-data.json` 随 fdnext 一起完整内嵌进构建产物。
- FlashMaster embedded build 不使用 code-only `@itxtech/fdnext-core/external` 路径；该入口只留给明确自行分发 runtime data 的第三方集成。
- pico build 保持 HTTP-only，不携带 embedded runtime data。
- FlashMaster embedded adapter 和 worker 迁移到 async `createEngine()`。
- 更新 fdnext submodule 后，通过 FlashMaster build 验证 runtime data 与代码一起更新。

## Migration Order

本仓库执行顺序：

1. 移动旧 runtime source JSON 到 `packages/core/data-source`。
2. 在 `packages/fdbgen` 新增 runtime data builder/checker/auditor。
3. 生成并提交 `packages/core/runtime-data/fdnext-runtime-data.json`。
4. core 迁移为 async runtime data consumer。
5. 删除旧 `resources` API 和 core raw builder。
6. 更新 cf-workers、server、CLI 调用 async runtime。
7. 更新 tests、docs、package files 和 scripts。
8. 跑 fdnext 验证命令。
9. 后续在 FlashMaster 仓库更新 submodule 和 adapter。

## Non-goals

- 不在 core 保留旧 `resources` API。
- 不在 runtime 引入压缩库或 binary decoder。
- 不预编译 DecodePack 到 runtime data。
- 不提交 decode-only runtime artifact。
- 不在本仓库修改 FlashMaster。
