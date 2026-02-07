# 浏览器集成（Web / Frontend）

`@fdnext/core` 是“浏览器安全”的纯逻辑引擎：不依赖 `fs`、不做网络抓取。浏览器侧集成的关键是：

1. 资源（`fdb/mdb/lang`）如何加载
2. 解码器（Part Number / FlashId）如何注入（来自 `@fdnext/dsl` 规则包）

## 1. 注意事项

- 不要在浏览器使用 `@fdnext/core/node`（它依赖 Node 的 `fs`）
- 推荐用 bundler（Vite/Webpack/Rollup/esbuild）打包
- `@fdnext/dsl` 的默认规则包使用 JSON import attributes（`with { type: "json" }`）
  - 现代 bundler 通常可处理
  - 若要“无 bundler 直连浏览器 ESM”，需要浏览器支持 import attributes 并正确提供 JSON MIME

## 2. 资源加载方式 A：fetch 静态 JSON（推荐）

把 `resources/` 当作静态目录发布，例如：

- `/resources/fdb.json`
- `/resources/mdb.json`
- `/resources/lang/chs.json`
- `/resources/lang/eng.json`

示例：

```ts
import { createEngine } from "@fdnext/core";
import {
  compileRulesToDecoders,
  defaultDslRules,
  compileFlashIdRulesToDecoders,
  defaultFlashIdRules
} from "@fdnext/dsl";

async function loadJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const [fdbRaw, mdbRaw, chs, eng] = await Promise.all([
  loadJson("/resources/fdb.json"),
  loadJson("/resources/mdb.json"),
  loadJson("/resources/lang/chs.json"),
  loadJson("/resources/lang/eng.json")
]);

const engine = createEngine({
  resources: { fdbRaw, mdbRaw, langRaw: { chs, eng } },
  decoders: compileRulesToDecoders(defaultDslRules),
  flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
});

console.log(engine.detect("MT29F64G08CBABA", { lang: "eng" }));
console.log(engine.decodeFlashId("2C64444BA900", { lang: "eng" }));
```

## 3. 资源加载方式 B：bundler 直接 import JSON

如果你用 bundler，也可以将资源作为静态 import（具体写法取决于你的工具链对 JSON 的支持）。

## 4. 自定义规则包（减小体积）

默认规则包是“可用起步”，浏览器侧建议按需组合：

- 只引入你需要的 vendor 规则 pack
- 使用 `compileRulesToDecoders(rules)` 生成 PN decoder
- 使用 `compileFlashIdRulesToDecoders(rules)` 生成 FlashId decoder

规则文件位置（仓库内）：

- `PN` 规则包：`/Users/peratx/dev/fdnext/packages/dsl/src/rules/packs`
- `FlashId` 规则包：`/Users/peratx/dev/fdnext/packages/dsl/src/flashid/packs`

