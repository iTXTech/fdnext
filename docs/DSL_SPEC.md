# DSL 规范（JSON）

本仓库把“厂商料号解码”做成纯数据的 DSL（JSON）。`@fdnext/dsl` 负责把规则编译成 `@fdnext/core` 可消费的 `PartNumberDecoder`，从而避免“每个厂商写一个 TS 文件”。

## 1. 规则（Rule）

最基础的规则是“匹配 + 直接赋值”（适合做 vendor/type 前置判断、简单 alias 等）。

```json
{
  "id": "vendor.micron.prefix.mt",
  "priority": 100,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "MT" },
  "set": { "vendor": "micron", "type": "nand" }
}
```

字段说明：

- `id`: 规则唯一标识，建议 `vendor.<vendor>.<kind>.<name>`。
- `priority`: 数字越大越优先（默认 0）。引擎会按优先级从高到低尝试解码器。
- `normalize`: 对输入料号进行预处理（见下）。
- `match`: 匹配条件（见下）。
- `set`: 匹配成功后直接写入的字段（无需 `tokenDecoder` 时使用）。
- `tokenDecoder`: 结构化 token 解析（见下）。

### normalize

`normalize` 的步骤按顺序执行：

- `"trim"`：去除首尾空白
- `"uppercase"`：转大写
- `{ "remove": [...] }`：移除指定字符（逐个替换为空）

### match

`match.kind` 支持：

- `"prefix"`：`value` 为前缀字符串
- `"regex"`：`value` 为正则表达式字符串，可选 `flags`

## 2. Token 解码（tokenDecoder）

适用于“料号内部由固定位置/可选前缀/表驱动字段组成”的情况。通过 steps 把 `rest`（未消费的字符串）逐段解析到上下文变量，再用 `assign` 构造输出对象。

```json
{
  "id": "vendor.kioxia.token.tc.v1",
  "priority": 920,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "TC" },
  "tokenDecoder": {
    "stripPrefixes": ["TC"],
    "tables": {
      "density": { "G3": 8192 },
      "basePackage": { "XB": "BGA", "XL": "LGA" },
      "detailPackage": { "BGA:1": "BGA224 (14 x 18 x 1.46)" }
    },
    "steps": [
      { "op": "take", "len": 2, "to": "densityCode" },
      { "op": "map", "from": "densityCode", "table": "density", "to": "density", "default": 0 },
      { "op": "take", "len": 2, "to": "packageCode" },
      { "op": "map", "from": "packageCode", "table": "basePackage", "to": "basePackage", "default": "Unknown" },
      { "op": "take", "len": 1, "to": "detailCode" },
      { "op": "tpl", "template": "{{basePackage}}:{{detailCode}}", "to": "detailKey" },
      { "op": "map", "from": "detailKey", "table": "detailPackage", "to": "detailPackageValue", "default": "" },
      { "op": "fallback", "primary": "detailPackageValue", "secondary": "basePackage", "to": "package" }
    ],
    "assign": {
      "vendor": "kioxia",
      "type": "nand",
      "density": { "$var": "density" },
      "package": { "$var": "package" }
    }
  }
}
```

### tokenDecoder.stripPrefixes

在执行 `steps` 前，依次从 `rest` 开头剥离固定前缀（仅当 `rest.startsWith(prefix)` 时剥离）。

### assign 表达式（DslExpr）

`assign` 的 value 允许：

- 原始 JSON（字符串/数字/布尔/null/对象/数组）
- `{ "$var": "name" }`：从上下文读取变量
- `{ "$tpl": "..." }`：模板字符串替换 `{{var}}`（用于 URL、拼 key 等）

上下文默认提供：

- `partNumber`: 归一化后的原始输入
- `rest`: 当前未消费的字符串
- 每一步 `steps` 写入的变量

## 3. Steps 操作符（op）

以下是当前 `tokenDecoder.steps` 支持的 `op`（与实现保持一致）：

- `take`: 从 `rest` 取固定长度
  - 参数：`len`, `to`
  - 行为：若 `rest.length < len`，则 `to=""`，且不消耗 `rest`
- `map`: 表映射
  - 参数：`from`, `table`, `to`, `default`
  - 行为：`tables[table][context[from]]` 存在则赋值，否则使用 `default`
- `takeLongest`: 最长前缀匹配 + 消费
  - 参数：`table`, `to`, `default`
  - 行为：对 `tables[table]` 的 key 按长度降序匹配 `rest` 开头，匹配成功会消耗相应长度并写入值
- `stripIfPrefix`: 条件剥离前缀
  - 参数：`prefix`, 可选 `to`
  - 行为：若 `rest` 以 `prefix` 开头则剥离；如提供 `to` 则写入布尔值（是否剥离成功）
- `tpl`: 生成模板字符串
  - 参数：`template`, `to`
  - 行为：替换 `{{var}}` 为对应上下文值（缺失则为空串）
- `fallback`: 兜底选择
  - 参数：`primary`, `secondary`, `to`
  - 行为：若 `primary` 未定义/为 null/为空字符串，则取 `secondary`
- `mul`: 乘法（用于密度等派生字段）
  - 参数：`a`, `b`, `to`, 可选 `default`
  - 行为：`Number(context[a]) * Number(context[b])`，非法则使用 `default` 或 0
- `set`: 设置上下文常量（通常用于初始化对象）
  - 参数：`to`, `value`
- `merge`: 合并对象（浅拷贝）
  - 参数：`into`, `from`
  - 行为：当两者都是“非数组对象”时 `Object.assign(into, from)`
- `notEmpty`: 判断字符串非空
  - 参数：`from`, `to`
  - 行为：`to = String(context[from]).length > 0`
- `mergeIf`: 条件合并
  - 参数：`if`, `into`, `from`
  - 行为：当 `context[if]` 为真且两者都是“非数组对象”时合并

## 4. 输出字段与翻译约定

DSL 的 `assign` 应输出 **core 的内部字段**（未翻译前），最终通过 `@fdnext/core` 的 `toPublicFlashInfo()` 做：

- 必填 key 补齐（缺失时填 `Unknown` 或 `[]`）
- `cellLevel`、`generation` 等字段做兼容转换
- 基于 `resources/lang/*.json` 的 key 翻译为最终 `vendor/type/extraInfo/...` 的展示值

重要约定：

- `extraInfo` 的 key 应使用语言包中的内部 key（例如 `opTemp`、`speed_grade`、`micronPartNumber`、`sandisk_code`），不要直接写 “Operation Temperature” 这类展示字符串。
- `url/urls` 的 `desc` 也建议使用语言包 key（例如 `micron_website`）。

## 5. 规则包（packs）组织方式

推荐把每个厂商的规则放到单独 pack 文件（JSON 数组）：

- 目录：`/Users/peratx/dev/fdnext/packages/dsl/src/rules/packs`
- 接入：`/Users/peratx/dev/fdnext/packages/dsl/src/rules/default-rules.ts:1`

源码里用 JSON module 直接导入：

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

仓库 `tsconfig` 已开启 `resolveJsonModule`，并且打包器配置了 `.json` loader。

## 6. 如何新增/验证一个厂商解码器

- 新增 pack：`packages/dsl/src/rules/packs/<vendor>-token.json`
- 在 `default-rules.ts` 中导入并加入 `defaultDslRules`
- 添加/更新夹具：`/Users/peratx/dev/fdnext/scripts/gen-fixtures.mjs:1`
- 运行回归：`pnpm compat:ci`

## 7. FlashId DSL（概览）

FlashId 解码同样支持 DSL：按“字节偏移 + bitfield 规则”描述（输入为 12 位 hex 字符串），编译为 `FlashIdDecoder`。
