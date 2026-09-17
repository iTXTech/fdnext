# iTXTech fdnext DecodePack 规范（JSON）

本仓库把“厂商料号解码”做成纯数据的 iTXTech fdnext DecodePack（JSON）。`@itxtech/fdnext-core/decodepack` 负责把 DecodePack JSON 规格编译成 `@itxtech/fdnext-core` 可消费的解码器，默认入口是 `defaultDecodePack` + `compileDecodePack(defaultDecodePack)`。

本文是语法/API 参考，按需要查阅相应章节。维护仓库 PN 规则时使用 [PN 编写规范](pn_code/authoring.md)；测试范围统一见 [验证指南](TESTING.md)。

## 1. 料号规则 `PartDecodeSpec`

最基础的 PartDecodeSpec 是“匹配 + 直接赋值”。下面只演示厂商前缀判断；产品线、容量和完整 PN 不能由这个前缀直接赋值，需由后续结构化规则确定。

```json
{
  "id": "vendor.micron.prefix.mt",
  "priority": 100,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "MT" },
  "set": {
    "device": { "domain": "memory", "vendor": "micron" }
  }
}
```

字段说明：

- `id`: 规范唯一标识，建议 `vendor.<vendor>.<kind>.<name>`。
- `priority`: 数字越大越优先（默认 0）。引擎会按优先级从高到低尝试解码器。
- `normalize`: 对输入料号进行预处理（见下）。
- `match`: 匹配条件（见下）。
- `set`: 匹配成功后直接写入原生草稿（无需 `tokenDecoder` 时使用）。
- `tokenDecoder`: 结构化编码段解析（见下）。

### 归一化 `normalize`

`normalize` 的步骤按顺序执行：

- `"trim"`：去除首尾空白
- `"uppercase"`：转大写
- `{ "remove": [...] }`：移除指定字符（逐个替换为空）

这些步骤产生匹配与解析串。展示 PN 另行执行同组步骤，但保留 `-` / `:`；
规则声明的分隔边界随后生成 `device.partNumber`。显式重写器件身份的赋值仍由规则负责。

### 匹配 `match`

`match.kind` 支持：

- `"prefix"`：`value` 为前缀字符串
- `"regex"`：`value` 为正则表达式字符串，可选 `flags`

## 2. 编码段解码（tokenDecoder）

适用于“料号内部由固定位置/可选前缀/表驱动字段组成”的情况。通过步骤把 `rest`（未消费的字符串）逐段解析到上下文变量，再用 `assign` 构造输出对象。

下面的局部表演示语法，不是厂商订购编码证据；实际映射按 [PN 编写规范](pn_code/authoring.md) 和产品线资料准入。

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
      "detailPackage": { "BGA:1": "BGA-224, 14x18x1.46" }
    },
    "steps": [
      { "op": "take", "len": 2, "to": "densityCode" },
      { "op": "map", "from": "densityCode", "table": "density", "to": "density" },
      { "op": "take", "len": 2, "to": "packageCode" },
      { "op": "map", "from": "packageCode", "table": "basePackage", "to": "basePackage" },
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

### 前缀移除 `tokenDecoder.stripPrefixes`

在执行 `steps` 前，依次从 `rest` 开头剥离固定前缀（仅当 `rest.startsWith(prefix)` 时剥离）。

### 共享表 `DecodePack.sharedTables`

DecodePack 顶层可声明 `sharedTables`，供所有 `tokenDecoder.steps` 的 `map` / `takeLongest` 复用。查表顺序为“共享表 + 当前 `tokenDecoder.tables`”，同名时当前规则内的本地表覆盖共享表。

适合放进 `sharedTables` 的内容：

- 跨产品线复用的工艺、die、控制器规格。
- 多个 PN / Flash ID / MPTool 规则都需要引用的键-值表。
- 实际参与规则推导的匹配信息，例如 `firmware_match`、`die_mark`；证据与映射的边界见 [可信度策略](pn_code/reference_policy.md)。

#### 表形态

`tables` 的单张表支持三种写法，`map` 和 `takeLongest` 都会先归一化后再查询：

- 普通对象表：`{ "AB": { "package": "FBGA-78" } }`，适合每个键有独立值的场景。
- 身份数组表：`["AB", "CD"]`，等价于 `{ "AB": "AB", "CD": "CD" }`，适合编码段白名单 / 最长前缀匹配，不需要再写 `"AB": "AB"` 这类重复映射。
- 别名-条目数组表：`[{ "keys": ["AB", "CD"], "value": { "package": "FBGA-78" } }]`，适合多个编码段共享同一个结构化值。`value` 省略时，每个键仍按身份输出自身。

数组表中的键不应重复；`pnpm cli decodepack check` 会报告重复键，避免后写项静默覆盖前写项。

#### `nand.die_profile`

共享规格的键、回退和固件命名见 [NAND die 规格](pn_code/nand_die_profile.md)，公开字段见 [术语](pn_code/terminology.md#nand--受管理-nand)。精确键的显式元数据输出方式见下节。

### 赋值表达式 `assign`（`DecodeExpr`）

`assign` 的值允许：

- 原始 JSON（字符串/数字/布尔/`null`/对象/数组）
- `{ "$var": "name" }`：从上下文读取变量
- `{ "$tpl": "..." }`：模板字符串替换 `{{var}}` 或 `{{obj.key}}`（用于 URL、拼键等）
- `{ "$path": "obj.key" }` 或 `{ "$path": ["obj", "key"] }`：读取上下文对象内的嵌套字段

当 PN 规则已经把编码段归一化成 `nand.die_profile` 键（常见变量名如 `processNode` / `processKey`）时，直接复用该键输出元数据：

```json
{
  "op": "map",
  "from": "processNode",
  "table": "nand.die_profile",
  "to": "processObj",
  "default": {}
}
```

```json
{
  "fields.die_codename": { "$var": "processNode" },
  "meta.nandDieProfileKey": { "$var": "processNode" }
}
```

`takeLongest` 可设置 `keyTo`，在输入本身不是已有规格键、需要捕获命中的表键时再把键写入上下文变量。

标识符 DecodePack 的位域定义 `definition` 也可以直接使用 `meta.nandDieProfileKey` 或 `meta.nandDieProfileKeys` 作为输出键；如果该值已经由同一个 `definition` 解出，应使用 `{"from": "die_codename"}` 复用已有输出，避免复制同一张位域表。这个 `from` 仍然是 DecodePack 显式声明，不是编译器自动从公开字段反推元数据。

上下文默认提供：

- `partNumber`: 归一化后的原始输入
- `rest`: 当前未消费的字符串
- 每一步 `steps` 写入的变量

### 原生草稿输出

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

原生草稿的公开字段与组件约束见 [术语](pn_code/terminology.md)，维护信息边界见 [可信度策略](pn_code/reference_policy.md)。

## 3. 步骤操作符（`op`）

以下是当前 `tokenDecoder.steps` 支持的 `op`（与实现保持一致）：

- `take`: 从 `rest` 取固定长度
  - 参数：`len`, `to`
  - 行为：若 `rest.length < len`，则 `to=""`，且不消耗 `rest`
- `map`: 表映射
  - 参数：`from`, `table`, `to`, `default`
  - 行为：`tables[table][context[from]]` 存在则赋值，否则使用 `default`；`tables` 包含顶层 `sharedTables` 与当前 `tokenDecoder.tables`，并支持对象 / 身份数组 / 别名-条目数组三种表形态
- `takeLongest`: 最长前缀匹配 + 消费
  - 参数：`table`, `to`, `default`，可选 `scope`, `scopeSeparator`
  - 行为：对 `tables[table]` 的键按长度降序匹配 `rest` 开头，匹配成功会消耗相应长度并写入值；`tables` 同样包含顶层 `sharedTables` 与当前 `tokenDecoder.tables`，并支持对象 / 身份数组 / 别名-条目数组三种表形态；如设置 `scope`，会先按 `${scope}${scopeSeparator ?? ":"}${token}` 形式匹配限定范围的键，未命中时再回退到普通键
- `stripIfPrefix`: 条件剥离前缀
  - 参数：`prefix`, 可选 `to`
  - 行为：若 `rest` 以 `prefix` 开头则剥离；如提供 `to` 则写入布尔值（是否剥离成功）
- `markPartNumberSeparator`: 在当前已消费主体与 `rest` 之间声明展示分隔符，不消费字符；
  `separator` 为 `-` 或 `:`，可用 `if` 引用已解析的主体变量。
  两侧都有实际字符且条件成立时才标记；解析失败或无后缀时不插入。
  例如 `{ "op": "markPartNumberSeparator", "separator": "-", "if": "generationCode" }`。
  分隔位置来自解析游标，投影与完整解码使用同一组位置；不改变 `partNumber`、`rest` 或 FDB 查询主体。
  多个标记按字符偏移重建已识别部分的分隔符，最后一个边界后的未解析尾部仍保留原有标点。
- `tpl`: 生成模板字符串
  - 参数：`template`, `to`
  - 行为：替换 `{{var}}` / `{{obj.key}}` 为对应上下文值（缺失则为空串）
- `fallback`: 兜底选择
  - 参数：`primary`, `secondary`, `to`
  - 行为：若 `primary` 未定义/为 `null`/为空字符串，则取 `secondary`
- `mul`: 乘法（用于密度等派生字段）
  - 参数：`a`, `b`, `to`, 可选 `default`
  - 行为：`Number(context[a]) * Number(context[b])`，非法则使用 `default` 或 0
- `dieDensity`: 单 die 容量派生
  - 参数：`density`, `dieCount`, `to`, 可选 `default`
  - 行为：`density` 为正有限 Mbit 数值，`dieCount` 为正整数时返回 `density / dieCount` 的 Mbit 数值，例如 `262144 / 1 -> 262144`、`1048576 / 2 -> 524288`；保留数值精度，不生成容量字符串。非法输入使用数值 `default` 或 `0`。以该结果组成查找键时同样使用 Mbit 数值。
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

`assign` 生成未翻译的原生草稿，结果构建器负责公开结果。字段键、分组、翻译、封装和默认拓扑统一见 [公开字段术语](pn_code/terminology.md)。平台侧外链使用 [运行时外部链接](INTEGRATION.md#12-运行时分发与外部链接)。

## 5. 规则包组织方式

推荐按厂商和芯片/产品线把 DecodePack JSON 规格放到单独规则包文件（JSON 数组），例如 `samsung-ufs-token.json`，避免一个厂商的全部产品共用一个规则包：

- 目录：`packages/core/src/decodepack/rules/packs`
- 接入：`packages/core/src/decodepack/rules/default-rules.ts:1`

源码里用 JSON 模组直接导入：

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

仓库 `tsconfig` 已开启 `resolveJsonModule`，并且打包器配置了 `.json` 加载器。

## 6. 如何新增/验证一个厂商解码器

实施与文档完成条件见 [PN 编写规范](pn_code/authoring.md#完成条件)，检查范围见 [验证指南](TESTING.md)。

## 7. 维护工具

DecodePack 维护工具面向 AI 和人工审阅，既可通过 TypeScript API 调用，也可通过 CLI 使用。

```ts
import {
  checkDecodePack,
  compileDecodePack,
  type DecodePack,
  defaultDecodePack,
  explainPartDecode,
  validateDecodePack
} from "@itxtech/fdnext-core/decodepack";

const check = checkDecodePack(defaultDecodePack);
const compiled = compileDecodePack(defaultDecodePack);
const explain = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G");

// 自定义规则包必须先通过校验；validate 会冻结规则包，编译器只接受带校验标记的结果。
const compileCustomPack = (pack: DecodePack) => compileDecodePack(validateDecodePack(pack));
```

仓库内 CLI:

```bash
pnpm cli decodepack check
pnpm cli decodepack explain part BWCA2KZC-64G
pnpm cli decodepack explain id 2C64444BA900
```

发布 / 全局安装后的二进制仍是 `fdnext decodepack ...`。

### 7.1 按目标字段投影解码

编译后的 PN 解码器支持运行时传入任意草稿路径，而不是绑定固定的“搜索字段集”：

```ts
for (const decoder of compiled.partDecoders) {
  const match = decoder.match(partNumber);
  if (!match) continue;
  const summary = decoder.project?.(match, [
    "device.vendor",
    "fields.density",
    "fields.package"
  ]);
  break;
}
```

编译器会按 `assign` 表达式反向追踪变量依赖，为每组目标路径缓存执行计划；无关步骤不执行，并在最后一个必要步骤后停止。目标字段的值必须与完整 `decode()` 一致。投影结果会保留 `device.partNumber`，也可能带有计算目标所需的附加依赖字段，调用方不应把“未请求字段一定不存在”作为约定。

搜索层默认依赖由 `DEFAULT_PART_SEARCH_PROJECTION` 声明；应用扩展投影见 [浏览器集成](INTEGRATION.md#2-浏览器web--前端)。

## 8. 标识符 DecodePack（NAND Flash ID 概览）

NAND Flash ID 解码通过带类型的标识符 iTXTech fdnext DecodePack 表达，规则必须声明 `idScheme: "nand.flash_id"`。输入仍按“字节偏移 + 位域规则”描述，并编译为 `IdentifierDecoder`。

### 8.1 规则包位置

- 标识符规则包：`packages/core/src/decodepack/identifier/packs/*.json`
- 接入入口：`packages/core/src/decodepack/identifier/default-rules.ts:1`

源码里同样用 JSON 模组直接导入：

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

### 8.2 IdentifierDecodeSpec 结构

每个规则包文件是一个 JSON 数组，元素结构如下：

```json
{
  "id": "flashid.micron.v1",
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

- `id`: 规范唯一标识；内置 Flash ID 规范统一使用 `flashid.<vendor>[.<family-or-profile>].vN`
- `idScheme`: 标识符命名空间，目前 NAND Flash ID 使用 `nand.flash_id`
- `priority`: 优先级（越大越优先）
- `match`: 匹配标识符（支持 `prefix` / `regex`）
- `vendor`: 厂商键（用于语言包翻译与展示）
- `definition`: 位域规范定义

内置 Flash ID 规范的厂商段必须与 `vendor` 字段一致；层级使用 `.`，复合词使用 `-`，不使用 `_`。`identifier`、`nand_flash_id`、`parallel` 等已由模块和 `idScheme` 表达的信息不再重复写入 `id`。

### 8.3 字段定义 `definition`（字节偏移与位域）

- `definition` 的第一层键是 **字节偏移（字符串数字）**，并且是 **从 1 开始计数**。
  - 例如 `"1"` 表示第 1 个字节（厂商 ID），`"2"` 表示第 2 个字节。
- 输入 NAND Flash ID 以 12 个十六进制字符（6 字节）为基准；不足会由核心的内部 NAND Flash ID 解码器在末尾补 `0`。
- 每个字段由：
  - `dq`: 位位列表，按规范定义顺序拼接
  - `def`: 从位域数值（字符串）映射到输出值（number/string/bool）
  - 可选 `when`: 按从 1 开始计数字节偏移限制规则，例如 `{ "2": ["05", "09"] }`
- 字段名直接使用规范字段键（例如 `interface_type`、`timing_mode_async`、`ecc_level`）。
- 同一字段可以写成规则数组，编译器会按顺序使用第一个 `when` 命中且 `def` 可解析的规则。常见用途是先放完整字节精确表，再回落到旧的位域规则。

### 8.4 NAND Flash ID 后处理（核心内置）

部分 NAND Flash ID 需要“解码后再修正”的逻辑，无法用纯位域 iTXTech fdnext DecodePack 表达，因此在 `@itxtech/fdnext-core` 内置了 NAND Flash ID 后处理：

- Samsung：当 byte2 == `0xDE`，密度强制为 64Gbit
- SKHynix：`plane_count = simultaneously_programmed_pages`
- SKHynix：当 byte6 >= `0x50`（14nm+）清理不适用的时序/接口/ECC 细节字段
- Kioxia / WesternDigital：当 `plane_count` 与 `die_count` 都有效时，`plane_count = plane_count / die_count`

### 8.5 如何新增/验证 NAND Flash ID 解码器

注册位置见 [规则包位置](#81-规则包位置)，厂商扩展范围见 [AGENTS.md](../AGENTS.md)。在对应标识符测试中覆盖改变的行为；检查范围统一见 [验证指南](TESTING.md)。
