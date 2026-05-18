# iTXTech fdnext DecodePack 规范（JSON）

本仓库把“厂商料号解码”做成纯数据的 iTXTech fdnext DecodePack（JSON）。`@itxtech/fdnext-core/decodepack` 负责把 DecodePack JSON specs 编译成 `@itxtech/fdnext-core` 可消费的 decoder，默认入口是 `defaultDecodePack` + `compileDecodePack(defaultDecodePack)`。

## 1. PartDecodeSpec

最基础的 PartDecodeSpec 是“匹配 + 直接赋值”（适合做 vendor/type 前置判断、简单 alias 等）。

```json
{
  "id": "vendor.micron.prefix.mt",
  "priority": 100,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "MT" },
  "set": {
    "device": { "domain": "memory", "chipKind": "raw_nand", "vendor": "micron", "partNumber": "MT29F64G08CBABA" },
    "fields": { "density": 65536 }
  }
}
```

字段说明：

- `id`: spec 唯一标识，建议 `vendor.<vendor>.<kind>.<name>`。
- `priority`: 数字越大越优先（默认 0）。引擎会按优先级从高到低尝试解码器。
- `normalize`: 对输入料号进行预处理（见下）。
- `match`: 匹配条件（见下）。
- `set`: 匹配成功后直接写入 native draft（无需 `tokenDecoder` 时使用）。
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
      "device.partNumber": { "$var": "partNumber" },
      "device.domain": "memory",
      "device.vendor": "kioxia",
      "device.chipKind": "raw_nand",
      "fields.density": { "$var": "density" },
      "fields.package": { "$var": "package" },
      "meta.ruleId": "vendor.kioxia.token.tc.v1",
      "meta.fieldProfile": "raw_nand",
      "meta.capabilities": ["part.decode", "part.search"]
    }
  }
}
```

### tokenDecoder.stripPrefixes

在执行 `steps` 前，依次从 `rest` 开头剥离固定前缀（仅当 `rest.startsWith(prefix)` 时剥离）。

### DecodePack.sharedTables

DecodePack 顶层可声明 `sharedTables`，供所有 `tokenDecoder.steps` 的 `map` / `takeLongest` 复用。查表顺序为“共享表 + 当前 `tokenDecoder.tables`”，同名时当前规则内的本地表覆盖共享表。

适合放进 `sharedTables` 的内容：

- 跨产品线复用的工艺、die、controller profile。
- 多个 PN / Flash ID / MPTool 规则都需要引用的 key-value 表。
- 只作为规则推导输入的维护信息，例如 `firmware_match`、`die_mark`、reference metadata。

#### `nand.die_profile`

`nand.die_profile` 是最重要的共享表之一。它以 die codename、firmware full code 或规则归一化后的 profile key 为索引，让 PN / Flash ID / MPTool 规则可以 cross-reference 出以下公开字段：

- `die_codename`
- `process_alias`
- `layer_count`
- `die_density`
- `cell_level`
- `plane_count`

公开结果中 `die_codename` 的 label 是 `Process` / `制程`，它是用户可见制程名，不等同于内部 profile key：

- 2D NAND 优先显示 `15nm`、`A19nm`、`20nm` 这类 litho。
- Kioxia / SanDisk 3D NAND 显示 `BiCS3`、`BiCS4`、`BiCS4.5`，不带厂商前缀或 Cell 后缀。
- 已有 `die_codename` 时，不再重复公开 `generation_info` / `series_info`。
- 层数和 `X3-9060`、`8T23` 这类代号分别由 `layer_count` / `process_alias` 表达。
- `firmware_match` / `die_mark` 只作为匹配和维护 metadata，不默认进入公开 fields。

详细 key 命名、fallback profile 和厂商差异见 [NAND Die Profile 标准化](pn_code/nand_die_profile.md)。

#### profile key 维护边界

- Kioxia / SanDisk 2D 固件匹配先归一为 `2DM` / `2DT`。
- Kioxia / SanDisk BiCS profile key 必须带厂商前缀，例如 `KBiCS3` / `SBiCS3`；firmware full code profile key 也必须带厂商前缀，例如 `K7T23` / `S7T23`。
- Micron / Intel 3D 固件匹配直接使用 die codename，例如 `B16A`。
- IMFT / Solidigm FG 体系保留 `A/B/C/D/E` 等后缀 die codename，例如 `N38A`、`N38B`、`N38C`、`N38E`、`N4PA`。
- Micron RG 体系保留 `R/S/T` 等后缀 die codename，例如 `B47R`、`B57T`、`N58R`。
- 3D profile 不从后缀折叠为 `xxnm`；2D `5x/6x/7x/8x/9x` die codename 可作为匹配 key，但公开制程应由 profile 表补齐。
- YMTC PN 规则先把 PN token 组合映射到 `TAS` / `HUS` / `WDS` 这类 die profile key，再 cross-reference `nand.die_profile` 生成公开 profile 字段。

### assign 表达式（DecodeExpr）

`assign` 的 value 允许：

- 原始 JSON（字符串/数字/布尔/null/对象/数组）
- `{ "$var": "name" }`：从上下文读取变量
- `{ "$tpl": "..." }`：模板字符串替换 `{{var}}` 或 `{{obj.key}}`（用于 URL、拼 key 等）
- `{ "$path": "obj.key" }` 或 `{ "$path": ["obj", "key"] }`：读取上下文对象内的嵌套字段

上下文默认提供：

- `partNumber`: 归一化后的原始输入
- `rest`: 当前未消费的字符串
- 每一步 `steps` 写入的变量

### Native draft 输出

```json
{
  "assign": {
    "device.partNumber": { "$var": "partNumber" },
    "device.domain": "memory",
    "device.vendor": "biwin",
    "device.chipKind": "managed_nand",
    "device.productType": "emcp",
    "fields.density": { "$var": "density" },
    "fields.storage_interface": { "$path": "densityKeyObj.storage_interface" },
    "fields.dram_density": { "$path": "densityKeyObj.dram_density" },
    "components": [
      {
        "role": "dram",
        "device": { "domain": "memory", "chipKind": "dram", "productType": "lpddr4x" },
        "fields": { "dram_density": { "$path": "densityKeyObj.dram_density" } }
      }
    ],
    "meta.ruleId": "vendor.biwin.emcp.v1",
    "meta.fieldProfile": "managed_nand",
    "meta.capabilities": ["part.decode", "part.search"]
  }
}
```

约束：

- `assign` 必须输出 fdnext-native draft，不再输出旧 FD 形态的扁平顶层字段。
- `fields.*` 必须使用 `packages/core/src/field-registry.ts` 中的 canonical key。
- 可信度、来源、reference status 等维护信息只能留在内部表（例如 `tables.reference`），不能写进 `fields` 或公开 result。
- composite 产品（例如 eMCP/uMCP）应使用 `components` 表达 storage / DRAM 子组件，不新增产品专属 public key。

## 3. Steps 操作符（op）

以下是当前 `tokenDecoder.steps` 支持的 `op`（与实现保持一致）：

- `take`: 从 `rest` 取固定长度
  - 参数：`len`, `to`
  - 行为：若 `rest.length < len`，则 `to=""`，且不消耗 `rest`
- `map`: 表映射
  - 参数：`from`, `table`, `to`, `default`
  - 行为：`tables[table][context[from]]` 存在则赋值，否则使用 `default`；`tables` 包含顶层 `sharedTables` 与当前 `tokenDecoder.tables`
- `takeLongest`: 最长前缀匹配 + 消费
  - 参数：`table`, `to`, `default`，可选 `scope`, `scopeSeparator`
  - 行为：对 `tables[table]` 的 key 按长度降序匹配 `rest` 开头，匹配成功会消耗相应长度并写入值；`tables` 同样包含顶层 `sharedTables` 与当前 `tokenDecoder.tables`；如设置 `scope`，会先按 `${scope}${scopeSeparator ?? ":"}${token}` 形式匹配 scoped key，未命中时再回退到普通 key
- `stripIfPrefix`: 条件剥离前缀
  - 参数：`prefix`, 可选 `to`
  - 行为：若 `rest` 以 `prefix` 开头则剥离；如提供 `to` 则写入布尔值（是否剥离成功）
- `tpl`: 生成模板字符串
  - 参数：`template`, `to`
  - 行为：替换 `{{var}}` / `{{obj.key}}` 为对应上下文值（缺失则为空串）
- `fallback`: 兜底选择
  - 参数：`primary`, `secondary`, `to`
  - 行为：若 `primary` 未定义/为 null/为空字符串，则取 `secondary`
- `mul`: 乘法（用于密度等派生字段）
  - 参数：`a`, `b`, `to`, 可选 `default`
  - 行为：`Number(context[a]) * Number(context[b])`，非法则使用 `default` 或 0
- `dieDensity`: 单 die 容量派生
  - 参数：`density`, `dieCount`, `to`, 可选 `default`
  - 行为：按 `density / dieCount` 从 Mbit 总容量派生标准 die density 字符串，例如 `262144 / 1 -> 256Gb`、`1048576 / 1 -> 1Tb`、`1394606.08 / 1 -> 1.33Tb`；非法则使用 `default` 或空串
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

iTXTech fdnext DecodePack 的 `assign` 应输出 **core 的 native decoder draft**（未翻译前）。公开结果由 `@itxtech/fdnext-core` 的 fdnext result builder 统一生成：

- `device` 承载 vendor、chip kind、product type、PN / identifier / marking 等身份信息；这些身份字段不再复制到 `blocks`。
- decode 结果提供 `subtitle` 作为列表/详情页的简短摘要，格式由 result builder 根据 chip kind、vendor、容量、cell level、DRAM 组合等字段生成。
- `blocks` 使用 canonical key 和结构化对象；可跳转能力放在对应 `relations[].action`，不再输出独立的顶层 `actions[]`。
- `label` / `display` / warning message / block label 由 field registry 与语言包生成，调用方不应从翻译文本反推语义。
- 未知字段直接省略，不补旧响应里的 `Unknown`、空数组或 NAND-only 默认槽位。

重要约定：

- `fields.*` 和 `components[].fields.*` 中会进入公开结果的字段应使用 canonical snake_case key（例如 `operation_temperature`、`speed_grade`、`marking_code`、`storage_interface`），不要直接写 “Operation Temperature” 这类展示字符串。
- PN / identifier iTXTech fdnext DecodePack 规则源文件必须使用 canonical snake_case 输出 key；运行时不维护历史 camelCase alias，也不做旧 key 自动转换。
- 新增或重命名 metadata key 时，直接迁移全部 iTXTech fdnext DecodePack 源规则、语言包和测试。旧 key 应进入 `packages/core/test/decodepack/metadata-audit.test.ts` 的禁止列表，而不是进入兼容层。
- 外部链接不要从 iTXTech fdnext DecodePack 直接泄漏到公开结果；平台侧应通过 runtime 的 External Link provider 输出到正式 `links` contract。

## 5. Pack 组织方式

推荐把每个厂商的 DecodePack JSON specs 放到单独 pack 文件（JSON 数组）：

- 目录：`packages/core/src/decodepack/rules/packs`
- 接入：`packages/core/src/decodepack/rules/default-rules.ts:1`

源码里用 JSON module 直接导入：

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

仓库 `tsconfig` 已开启 `resolveJsonModule`，并且打包器配置了 `.json` loader。

## 6. 如何新增/验证一个厂商解码器

- 新增 pack：`packages/core/src/decodepack/rules/packs/<vendor>-token.json`
- 在 `default-rules.ts` 中导入并加入 `defaultPartDecodeSpecs`
- 添加/更新 contract 行为测试：`packages/contract-test/test/contract.test.ts`
- 仓库内验证：`pnpm cli decodepack check`、`pnpm contract:check`、`pnpm -C packages/core test`

## 7. 维护工具

DecodePack 维护工具面向 AI 和人工 review，既可通过 TypeScript API 调用，也可通过 CLI 使用。

```ts
import { checkDecodePack, compileDecodePack, defaultDecodePack, explainPartDecode } from "@itxtech/fdnext-core/decodepack";

const check = checkDecodePack(defaultDecodePack);
const compiled = compileDecodePack(defaultDecodePack);
const explain = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G");
```

仓库内 CLI:

```bash
pnpm cli decodepack check
pnpm cli decodepack explain part BWCA2KZC-64G
pnpm cli decodepack explain id 2C64444BA900
```

发布 / 全局安装后的二进制仍是 `fdnext decodepack ...`。

## 8. Identifier iTXTech fdnext DecodePack（NAND Flash ID 概览）

NAND Flash ID 解码通过 typed identifier iTXTech fdnext DecodePack 表达，规则必须声明 `idScheme: "nand.flash_id"`。输入仍按“字节偏移 + bitfield 规则”描述，并编译为 `IdentifierDecoder`。

### 8.1 Pack 位置

- Identifier packs：`packages/core/src/decodepack/identifier/packs/*.json`
- 接入入口：`packages/core/src/decodepack/identifier/default-rules.ts:1`

源码里同样用 JSON module 直接导入：

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

### 8.2 IdentifierDecodeSpec 结构

每个 pack 文件是一个 JSON 数组，元素结构如下：

```json
{
  "id": "identifier.nand_flash_id.micron.inteldef.v1",
  "idScheme": "nand.flash_id",
  "priority": 400,
  "match": { "kind": "prefix", "value": "2C" },
  "vendor": "micron",
  "definition": {
    "2": {
      "density": { "dq": [7, 6, 5, 4, 3], "def": { "9": 32768 } }
    }
  }
}
```

字段说明：

- `id`: spec 唯一标识
- `idScheme`: identifier namespace，目前 NAND Flash ID 使用 `nand.flash_id`
- `priority`: 优先级（越大越优先）
- `match`: 匹配 identifier（支持 `prefix` / `regex`）
- `vendor`: 厂商 key（用于语言包翻译与展示）
- `definition`: bitfield spec 定义

### 8.3 definition（字节偏移 + bitfield）

- `definition` 的第一层 key 是 **字节偏移（字符串数字）**，并且是 **1-based**。
  - 例如 `"1"` 表示第 1 个字节（厂商 ID），`"2"` 表示第 2 个字节。
- 输入 NAND Flash ID 以 12 个 hex 字符（6 字节）为基准；不足会由 core 的内部 NAND Flash ID decoder 在末尾补 `0`。
- 每个字段由：
  - `dq`: bit 位列表，按 spec 定义顺序拼接
  - `def`: 从 bitfield 数值（字符串）映射到输出值（number/string/bool）
  - 可选 `when`: 按 1-based 字节偏移限制 rule，例如 `{ "2": ["05", "09"] }`
- 字段名直接使用 canonical field key（例如 `interface_type`、`timing_mode_async`、`ecc_level`）。
- 同一字段可以写成 rule 数组，编译器会按顺序使用第一个 `when` 命中且 `def` 可解析的 rule。常见用途是先放完整字节精确表，再回落到旧的 bitfield 规则。

### 8.4 NAND Flash ID 后处理（core 内置）

部分 NAND Flash ID 需要“解码后再修正”的逻辑，无法用纯 bitfield iTXTech fdnext DecodePack 表达，因此在 `@itxtech/fdnext-core` 内置了 NAND Flash ID post-process：

- Samsung：当 byte2 == `0xDE`，密度强制为 64Gbit
- SKHynix：`plane_count = simultaneously_programmed_pages`
- SKHynix：当 byte6 >= `0x50`（14nm+）清理不适用的 timing/interface/ECC 细节字段
- Kioxia / WesternDigital：当 `plane_count` 与 `die_count` 都有效时，`plane_count = plane_count / die_count`

### 8.5 如何新增/验证 NAND Flash ID 解码器

- 新增 pack：`packages/core/src/decodepack/identifier/packs/<vendor>.json`
- 在 `packages/core/src/decodepack/identifier/default-rules.ts:1` 中导入并加入 `defaultIdentifierDecodeSpecs`
- 添加/更新 identifier contract 行为测试：`packages/contract-test/test/contract.test.ts`
- 仓库内验证：`pnpm cli decodepack check`、`pnpm contract:check`、`pnpm -C packages/core test`
