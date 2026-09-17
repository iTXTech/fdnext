# FDBGen 文档

`@itxtech/fdnext-fdbgen` 负责 FDB / MDB 数据维护。本文是生成、归一化、PN↔ID 关联与数据审计的唯一操作参考。

## 功能范围

- 从多种输入来源合并 PN 与 Flash ID 数据
- 支持原始 FlashDB 子目录（`smff/smufd/smssd/jm/mk/ma/sf/al/cbm/is/ps/ys/fc`）
- 归一化厂商名与主键格式（厂商 / PN / Flash ID）
- 按确定性 PN 前缀校正厂商归属，避免 `MT29F...` 被放入 Samsung 等错误厂商桶
- 清理无效 Flash ID、残缺 PN 别名与悬空 `iddb.n` 反向引用
- 自动回填 `iddb.n`（`vendor partNumber` 反向引用）
- 聚合并去重 `info.controllers`
- 生成稳定排序的输出 JSON，便于差异与审阅

## 安装与构建

作为依赖安装：`pnpm add @itxtech/fdnext-fdbgen`，二进制入口为 `fdnext-fdbgen`。仓库环境准备见 [开发环境](TESTING.md#开发环境与入口)。

```bash
pnpm -C packages/fdbgen build
```

## CLI 用法

构建后可直接运行：

```bash
node packages/fdbgen/dist/cli.js build --input <dataset-dir> --output <fdb.json> --version <ver> [options]
```

仓库根目录也提供脚本入口：

```bash
pnpm fdbgen:generate --input <dataset-dir> --output <fdb.json> --version <ver> [options]
pnpm fdbgen:audit
pnpm fdbgen:audit:trace
```

当前原始 FlashDB 生成命令：

```bash
pnpm fdbgen:generate -- --input ../fdfdb --output packages/core/resources/fdb.json --version <ver> --pretty
```

`mdb` 爬取工具：

```bash
node packages/fdbgen/dist/cli.js crawl-mdb --file <mdb.json> [options]
```

或使用根脚本：

```bash
pnpm fdbgen:crawl-mdb -- --file <mdb.json> [options]
```

说明：SpecTek 查询沿用旧版 ASPX 页面流程（`https://www.spectek.com/menus/mark_code.aspx`），通过提交表单后解析页面 DOM 表格，不依赖新接口；默认覆盖 NAND `PF*` / `PX*` 以及 DRAM `PB*` / `PE*` / `PEB*` / `PP*` / `PPE*` / `PU*` 标记编码前缀。
SpecTek 返回的斜杠前缀合并料号会在写入 MDB 前展开成完整 PN，例如 `SGG/SMA256M16V70SG8REF` 写为 `SGG256M16V70SG8REF` 和 `SMA256M16V70SG8REF`。

Micron 查询统一按 FBGA 编码前缀规格生成候选并调用官方 FBGA 解码器 API。默认规格包括 `C9/D8/D9/Z8/Z9` 两位前缀后三位字母网格，以及 `NC/NW/NY/NX/NQ/NV` 数字段。后续新增 Micron 数字段或字母网格段时扩展规格，不再新增抓取器入口。`--codes` 补充输入会按前缀路由：命中 Micron 规格的编码走 Micron API，`P*` 编码走 SpecTek。

### 参数

- `--input <dir>`：输入目录（必填）
- `--output <file>`：输出文件路径（必填）
- `--version <ver>`：写入 `info.version`（必填）
- `--meta <file>`：元信息 JSON 覆盖文件（可选）
- `--extra <file>`：额外合并补丁文件（可选，可重复）；未显式传入时自动读取 `input/extra/*.json`
- `--name <name>`：覆盖 `info.name`
- `--website <url>`：覆盖 `info.website`
- `--exclude-controller <name>`：从生成的 FDB 输出中排除指定控制器，可重复传入，也可用逗号分隔；默认黑名单包含 `3281FL` / `3379FL`
- `--pretty`：格式化输出 JSON（`crawl-mdb` 默认已格式化，便于查看差异）

`info.version` 必须显式传入。`info.time` 始终在生成时写入当前 UTC 时间，不从 `meta.json` / `extra/*.json` 或命令行覆盖。

提取工具输出的标准支持列表请使用 `fdnext fdbgen v1` 格式，详见 [`FDBGEN_FORMAT_V1.md`](FDBGEN_FORMAT_V1.md)。

`crawl-mdb` 额外参数：

- `--file <path>`：`mdb.json` 文件路径（必填）
- `--codes <path>`：可选补充 MDB 编码 JSON，当前参考文件为 `references/micron-fbga-codes.json`，使用顶层字符串数组保存非默认规格的历史例外；读取时按前缀路由，命中 Micron 规格的编码走 Micron API，`P*` 编码走 SpecTek，未知前缀跳过。
- `--header <prefix>`：限制本次 MDB 爬取到指定头部，可重复或逗号分隔；`P*` 自动走 SpecTek，已知 Micron 前缀自动归入对应 Micron 规格，例如 `--header PEB --header PPE` 只跑 SpecTek DRAM `PEB*` / `PPE*`，`--header D9 --header NW` 只跑 Micron 对应段。
- `--micron-header <prefix>` / `--spectek-header <prefix>`：显式限制 Micron 或 SpecTek 头部，可重复或逗号分隔。
- `--start-from <code>`：从 Micron 或 SpecTek 编码段开始，例如 `D9N` 从 Micron 字母网格段继续跑，`NW101` 从 Micron 数字段继续跑，`PB002` / `PEB01` 从 SpecTek 队列继续跑。
- `--micron-max <n>`：Micron 数字段 FBGA 上界（不含，默认 `1000`）
- `--spectek-max <n>`：SpecTek 爬取上界（不含，默认按前缀自动计算）
- `--delay-ms <n>`：每次请求间隔（毫秒）
- `--user-agent <ua>`：自定义请求 UA
- `--concurrency <n>`：并行请求上限（默认 `5`）
- `--flush-hits <n>`：累计命中多少条后写入磁盘一次 `mdb.json`（默认 `20`）
- `--save-each-hit`：每次命中都写入磁盘 `mdb.json`
- `--no-save-each-hit`：仅在结束时写盘

`audit` 是只读检查命令，用于在清理前后固定 FDB 质量口径，不会修改 `fdb.json`：

```bash
pnpm fdbgen:audit
pnpm fdbgen:audit -- --json
pnpm exec tsx ./packages/fdbgen/src/cli.ts audit --file packages/core/resources/fdb.json --max-samples 12
pnpm exec tsx ./packages/fdbgen/src/cli.ts audit --input ../fdfdb --version <ver> --trace-sources --max-samples 12
```

- `--file <path>`：要检查的 `fdb.json` 文件，根脚本默认指向 `packages/core/resources/fdb.json`
- `--input <dir>`：从原始 / 结构化数据集临时生成 FDB 后审计，不写入 `fdb.json`
- `--version <ver>`：配合 `--input` 使用，写入临时生成结果的 `info.version`
- `--trace-sources`：配合 `--input` 使用，在问题中输出来源控制器、文件、行号或记录序号、原始记录、归一化结果和合并决策
- `--json`：输出结构化 JSON 报告，方便后续 CI 或脚本消费
- `--max-samples <n>`：每类问题最多输出多少个样本，默认 `8`
- `--fail-on-issues`：发现任意问题时以退出码 `2` 结束，默认只报告不失败

当前审计会覆盖以下规范：

- 顶层厂商是否在已知 FDB 厂商集合内
- `iddb` 键和 PN `id` / `f` 引用是否为完整 6 字节 / 12 位十六进制 Flash ID
- PN `id` / `f`、`a`、`iddb.n` 是否存在悬空引用
- 确定性 PN 前缀和厂商桶是否冲突
- PN 表中是否混入合成标签、描述片段、日期码、异常标点或仅控制器记录
- `iddb` 中缺少 PN 反向引用或控制器支持的低置信记录
- [PN↔ID 关联](#pn-与-flash-id-关联) 的冲突、双向完整性和未知原因

开启 `--trace-sources` 时，审计会在 fdbgen 内部构建临时来源追溯信息映射，但不会把追溯信息写入最终 FDB。报告会同时展示最终 FDB 问题和该问题对应的引入位置，例如哪个控制器解析器、哪个原始文件、哪一行或 JSON 记录、原始内容、归一化后的厂商 / PN / Flash ID 以及 `add_part_id` / `merge_part_payload` / `merge_flash_payload` 等决策。报告还保留双方匹配事实和关系移除原因；来源 `s/p/b` 的 ID/字段级多值冲突与可观测的长 ID 截断另作警告。部分控制器输入已在合并前截为六字节，无法恢复已丢失字节，也不能据此猜测 `00/FF` 通配掩码。完整来源值仅在追溯信息中保留。

`audit-extra` 是 extra 候选文件的只读审计入口，适合在一次性清洗数据合并前检查覆盖影响：

```bash
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-extra ../fdfdb/extra/base.json --base-fdb packages/core/resources/fdb.json --decodepack
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-fdb packages/core/resources/fdb.json --json --out ../fdfdb/sky.audit.json
```

- `--candidate <path>`：候选 extra 文件，必填
- `--base-extra <path>`：现有基础 extra 文件，用于检查同厂商 + PN 的 `fid/id/l/c/m/d/e/r/n/t/a/f` 差异
- `--base-fdb <path>`：现有已生成的 `fdb.json`，用于检查 ID 覆盖、关联扩散、控制器支持和 `iddb.n` 反向引用
- `--decodepack`：在 CLI 层加载 fdnext 核心/decodepack 引擎，对候选 extra PN 的厂商、制程、单元和拓扑做冲突审计。关联检查见 [PN↔ID 关联](#pn-与-flash-id-关联)。
- `--json` / `--out <path>` / `--max-samples <n>` / `--fail-on-issues`：与普通审计相同

## 输入目录约定

输入目录支持两种来源。

### 原始 FlashDB

当前底层数据目录为 `../fdfdb`，它是独立原始数据文件夹，不是已生成的 `packages/core/resources/fdb.json`。生成器发现以下任一子目录时会按原始模式加载，并按固定控制器顺序合并：

```text
smff/
smufd/
smssd/
jm/
mk/
ma/
sf/
al/
cbm/
is/
ps/
ys/
fc/
extra/
  base.json
  sky.json
```

### 结构化输入

未发现原始子目录时，输入目录支持以下文件/子目录（均可选）：

- `fdb.json`
- `meta.json`
- `extra/*.json`
- `vendors/*.json`
- `iddb/*.json`
- `flashids/*.json`

推荐结构示例：

```text
dataset/
  fdb.json
  meta.json
  extra/
    base.json
    sky.json
  vendors/
    micron.json
    samsung.json
  iddb/
    micron.json
  flashids/
    vendor_patch.json
```

## JSON 结构示例

`vendors/micron.json`：

```json
{
  "MT29F64G08CBABA": {
    "id": ["2C64444BA900"],
    "l": "20nm",
    "c": "MLC",
    "t": ["SM2258XT"],
    "m": "sample",
    "d": 1,
    "e": 1,
    "r": 1,
    "n": 1
  }
}
```

`iddb/micron.json`：

```json
{
  "2C64444BA900": {
    "s": 16,
    "p": 256,
    "b": 1024,
    "t": ["SM2258XT"]
  }
}
```

`meta.json`（可写为 `{"info": {...}}` 或直接对象）：

```json
{
  "info": {
    "name": "iTXTech fdnext FDB",
    "website": "https://github.com/iTXTech/fdnext",
    "controllers": ["SM2258XT"]
  }
}
```

`extra/base.json` 或 `extra/sky.json`：

```json
{
  "schemaVersion": "fdnext.fdb.extra.v1",
  "priority": 100,
  "info": {
    "controllers": ["PS3111"]
  },
  "controllerBlacklist": ["3281FL", "3379FL"],
  "vendors": {
    "phison": {
      "TA17GABCH0": {
        "t": ["PS3111"]
      }
    },
    "sndk": {
      "SDTNQGAMA-008G": {
        "fid": ["45DE949376570000"],
        "l": "BiCS3",
        "c": "TLC"
      }
    }
  },
  "iddb": {
    "98D598B27654": {
      "t": ["PS3111"]
    }
  }
}
```

## 合并与归一化规则

Extra 结构定义名为 `fdnext.fdb.extra.v1`，已生成的 `fdb.json` 结构定义名为 `fdnext.fdb.v1`，对应结构定义文件分别是 [`docs/schemas/fdnext.fdb.extra.v1.schema.json`](schemas/fdnext.fdb.extra.v1.schema.json) 和 [`docs/schemas/fdnext.fdb.v1.schema.json`](schemas/fdnext.fdb.v1.schema.json)。`schemaVersion` 是可选根字段；旧数据不带该字段仍可读取，但一旦提供就必须匹配对应结构定义。fdbgen 生成新的 `fdb.json` 时会写入 `"schemaVersion": "fdnext.fdb.v1"`。

### 厂商解码模块

厂商相关规则不直接写在主生成流程里。`packages/fdbgen/src/vendors/` 下每个支持的厂商使用独立文件维护：

- 厂商别名（如 `sandisk` / `sndk`，兼容 `westerndigital` / `wd` → `sndk`）
- PN 前缀归属判断（如 `MT29*` → `micron`）
- 厂商特有 PN 封装后缀清理（如 Micron / SK hynix / SpecTek）

主生成器只负责原始控制器数据解析、合并和输出，厂商归属与 PN 清理由厂商注册表统一调用。

### 控制器厂商模块

控制器原始数据解析也不直接写在主生成流程里。`packages/fdbgen/src/controllers/` 下按控制器厂商拆分：

- `silicon-motion.ts`：`smff` / `smufd` / `smssd`
- `jmicron.ts`：`jm`
- `maxiotek.ts`：`mk`
- `maxio.ts`：`ma`
- `sand-force.ts`：`sf`
- `alcor-micro.ts`：`al`
- `chips-bank.ts`：`cbm`
- `innostor.ts`：`is`
- `phison.ts`：`ps`
- `yeestor.ts`：`ys`
- `first-chip.ts`：`fc`

主生成器通过控制器注册表维持固定加载顺序，具体解析逻辑由对应控制器厂商文件负责。

Alcor Micro `al/` 目录同时支持旧版 CSV 和标准 `fdnext fdbgen v1c/v1f` JSON。FirstChip `fc/` 目录同时支持旧版制表符 `.txt`、旧版 FirstChip 原始 JSON 数组，以及标准 `fdnext fdbgen v1c/v1f` JSON。Innostor `is/` 目录同时支持旧版 `.ini` 和标准 `fdnext fdbgen v1c/v1f` JSON。Phison `ps/` 目录保留旧版 Phison JSON 数组解析，并额外支持 `ufd.json` 这类标准 `fdnext fdbgen v1c/v1f` UFD 支持列表。

标准 v1 JSON 先由共享 `parseFdnextFdbgenV1` 解析器读取，再通过共享 `mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry` 导入；PN 清理、厂商前缀准入、控制器名称归一化、可信 PN 写入 PN 表、不可信 PN 回落 `iddb` 都在该通用组件处理。JSON 输入只读取完整十六进制字节形式的 Flash ID，并只合并当前 NAND Flash ID 解码器支持的厂商前缀（Micron / Intel / Samsung / SK hynix / KIOXIA / SanDisk / YMTC / SpecTek）。未支持控制器别名统一通过 fdbgen 控制器黑名单排除，而不是写在单个控制器解析器中。

Phison UFD 支持列表中的群联侧 PN 会进入 `phison` PN 表，但使用单向字段表达关联：`f` 表示查询该 PN 时可跳转的 Flash ID，`a` 表示可显示的原厂 PN 引用。字段方向见 [自动回填](#自动回填)。Phison UFD 只把符合群联 10 位编码形态的 PN 写入 `phison` 表；Micron FBGA / 丝印编码这类输入只通过 v1 条目回调清除 PN 后合并到 `iddb[id].t`。

### 加载顺序

原始 FlashDB 模式：

1. `smff`
2. `smufd`
3. `smssd`
4. `jm`
5. `mk`
6. `ma`
7. `sf`
8. `al`
9. `cbm`
10. `is`
11. `ps`
12. `ys`
13. `fc`
14. `extra/*.json`（按文件名排序；例如 `base.json` 先于 `sky.json`）
15. 命令行参数覆盖 `info` 字段

结构化输入模式：

1. `fdb.json`
2. `vendors/*.json`
3. `iddb/*.json`
4. `flashids/*.json`
5. `extra/*.json`（按文件名排序，对 `info/vendors/iddb` 追加合并）
6. 命令行参数覆盖 `info` 字段

### 厂商名归一化

以下别名会自动修正：

- `sandisk` / `sndk`，兼容 `western digital` / `westerndigital` / `wd` → `sndk`
- `toshiba` / `toshiba-iver` → `kioxia`
- `hynix` → `skhynix`
- `septeck` → `spectek`
- `stm` → `st`

### 厂商归属校正

生成器会按高置信 PN 前缀重新分配厂商：

- `MT29*` / `MTFC*` / `MTFD*` → `micron`
- `K9*` / `KLM*` / `KLU*` / `KMD*` / `KMF*` / `KMN*` / `KMV*` → `samsung`
- `HY27*` / `H27*` / `H25*` / `H26*` / `H2D*` / `H2J*` / `H9A*` / `H9H*` / `H9Q*` / `H9T*` → `skhynix`
- `TC58*` / `TH58*` / `THG*` → `kioxia`
- `SD*` / `S34*` / `S35*` / `SANDISK*` / `SNDK*` / `DFT*` / `MDT*` / `05xxx*` → `sndk`
- `JS29F*` / `I29F*` / `PF29F*` / `PC29F*` / `PD29F*` → `intel`
- `FBNL*` / `FNNL*` / `FNN*` / `FXXL*` → `spectek`
- `NAND*` / `M29F*` → `st`
- `YM*` / `YMN*` / `XT*` → `ymtc`

### 键与字段处理

- PN 键统一转大写，并移除空格、逗号、`&`、`.`、`|`
- Flash ID 键统一移除空白、转大写；非十六进制、奇数字节长度或异常长度的 ID 会被丢弃
- 数组字段（如 `id/f/a/t/n/controllers`）会去重
- `extra/*.json` 的 PN 载荷额外支持 `fid`，表示可信来源强制覆盖该 PN 的主 Flash ID；`fid` 与 `id` 互斥，生成后的 `fdb.json` 只输出 `id`，不保留 `fid`
- `extra/*.json` 顶层支持 `priority`，语义与 decodepack 相同：数字越大越优先，默认 `0`
- 多个 extra 文件会先按 `priority` 从高到低排序，再按文件名排序；较高优先级文件已提供 `id/fid` 时，较低优先级文件不会抢占该 PN 的身份信息，但仍可补充缺失的非身份字段和追加控制器 / 别名
- 优先级堆叠中胜出的 `id/fid` 会作为该 PN 的权威 ID 覆盖原始输入，因此 sky Micron 这类不需要强制语义的记录可以写 `id`，不必写 `fid`
- 已生成的 `fdb.json` 禁止出现 `fid`，并使用 `fdnext.fdb.v1` 结构定义
- `l` 的规范化、合法键与回退以 [NAND 规格](pn_code/nand_die_profile.md#fdbgen-回退规格) 为准；无效值报告 `part.invalid_die_profile`。
- Micron / SpecTek 保留完整 PN，包括封装、等级和版本尾缀。DecodePack `lookupPartNumbers` 仅供查询回退，不能作为 FDB 身份键删除语义尾缀；原始来源仅有短 PN 时不补造封装。
- SK hynix H25 裸 NAND PN 进入 FDB 前会归一化 X 尾缀但不丢弃尾缀，例如 `H25T2TB88E-X321-N` → `H25T2TB88EX321N`、`H25T1TD48C-X630` → `H25T1TD48CX630`；通用 `GEN2-X321` 这类合成标签仍按无效 PN 丢弃。H25 精确封装资料可使用 `pkg` / `sg` / `pc` / `vol` / `so` / `pl` 补充公开 `package`、`nand_interface.rating`、`product_class`、`voltage`、`special_option` 和 `plane_count`。`sg` 是器件等级补充，不能覆盖 PN 已给出的等级，也不能覆盖 `nand_interface.capability` 中的 die 能力。
- 原始 PN 清理会移除明显跨厂商污染：Samsung `K9` 短键少于 10 位，或最后 3 字符含 `X` 时丢弃；`MT29F...` 但尾部符合 Intel 制程编码段的记录丢弃；`29F...` / `PF29F...` 但整体符合 Micron 原始编码段结构（例如 `...GBLBE`、`...CUCBB`、`...EBHAF`）的记录丢弃。Intel 裸 `29F...` 且制程编码大于等于 `G` 时会归一为 `PF29F...`。
- 数值字段（`s/p/b/d/e/r/n`）仅接受有限数值
- 如果 `*_1` 或尾部 `-` PN 有明确基础 PN，会合并回基础 PN
- 来源别名仍引用的既有 PN 节点不按低信息记录删除；错误 ID 边被裁剪后，其 PN 身份和别名关系仍保留，不补造容量或 ID。
- 控制器黑名单会统一作用于 `info.controllers`、PN `t` 和 `iddb.t`，默认排除 `3281FL` / `3379FL`；额外黑名单可通过 CLI `--exclude-controller` 或 extra 顶层 `controllerBlacklist` 指定

### 自动回填

- 对每个 PN 的 `id`，自动向对应 `iddb[flashId].n` 写入 `"<vendor> <partNumber>"`；反向引用必须能在厂商 PN 表中找到对应节点
- PN 的 `f` 只作为当前 PN 的单向 Flash ID 关联，不参与 `iddb.n` 回填
- `info.controllers` 会汇总：
  - `meta/extra` 中声明的控制器
  - PN 的 `t` 字段
  - IDDB 的 `t` 字段

### 输出排序

- 厂商、PN、Flash ID 按字典序排序
- 对象键稳定输出，便于版本管理与差异比较

## PN 与 Flash ID 关联

### 判断入口与品牌

- PN↔ID 的生成、审计共用 `packages/fdbgen/src/relation-matcher.ts`。一个长期复用的引擎使用空 FDB/MDB 资源独立解析双方，避免关联通过资源补全证明自身。`id` / `f` 以及 `iddb.n` 使用同一结论，只有 `conflict` 被裁剪；`unknown` 保留。

- `B5` 的 Read ID 身份为 SpecTek，`2C` 为 Micron；已识别的 ID 身份不被 PN 反向引用覆盖。二者允许保留同 Micron 原生 die 的跨品牌关联，不能仅因品牌不同裁剪，也不能全局替换 ID 前缀来生成关联。`id` / `iddb.n` 清理其他跨厂商身份引用；`f` 可承载外部品牌关联，其方向遵循上文自动回填规则。

`compatible` 只表示在可用规则下相容，不代表唯一 PN、质量等级或真实准确率。

### 制程、原生容量与拓扑

- 制程按规范 die 键比较。Micron `L04A/L84A` 或 `L85A/L85C` 即使显示相同 nm 或容量相同也不能视为同 die；`TSB24` 与 `TSB24A/B`、BiCS 等粗粒度家族相交只表示未排除。多候选规格必须全部不相交才能按 die 冲突裁剪。
- 匹配同时提供 `part.nativeDieDensity` 与 `identifier.nativeDieDensity`，单位均为 Mbit。原生单 die 容量与 die 规格、单元、层数共同约束制程，不能仅凭容量相同认定同 die。普通 PN 按 `density / die_count` 求单 die、按 `die_count / ce_count` 求每 CE die 数、按 `density / ce_count` 求每 CE 容量；ID 的 `density`、`die_count` 按当前目标/CE 解释。整除、正数和每侧容量自洽性先检查。
- 原生容量优先用明确 die 规格；分级、半页、部分 CE 可用和 pSLC 不把有效容量反推成原生容量。pSLC 映射及 PFPT 语义见 [SpecTek NAND](pn_code/spectek_nand.md#分级与原生-die)。B5 无法从 ID 确定分级时不硬比有效容量，但具体 die 与双方明确的原生容量仍参与检查。PFPT A 继续检查拓扑；其他部分可用标记不能直接套完整封装拓扑。
- BiCS M/S 工作形态在没有原生 die 映射时不以单元或有效容量差异硬裁剪；TLC/QLC 冲突仍检查。不同厂商页、块、平面的粒度未统一，不加入全局硬比较。源 `iddb.s/p/b` 不用于关系判断。

双方匹配事实另保留每 CE die 数、每 CE 容量、单元、层数、规格候选、容量来源和不确定原因。SK hynix 同一家族下的容量变体由 [SK hynix NAND](pn_code/skhynix_nand.md#3d--4d-die-规格补充) 定义。

### 未知与资源消费

- 解码自身不自洽、未解析/受管理 PN、明确占位 ID（如 `980000000000`、`EC0000…`）、旧 Intel SLC 通用布局、Hynix `79 A5 00` 的新旧编码歧义保留为 `unknown`，不据此修造 PN/ID 映射。`50504E` PPN 签名也不按普通裸 NAND 几何处理。
- 源 PN 的 `c/l/d/e` 等观测字段可能有误；关系判断采用独立 DecodePack 事实，运行时资源补充不覆盖已经解析的 PN 字段。
- SpecTek PN 同样返回 FDB 的 ID / 控制器关系，容量、单元、分级、封装仍由 PN 自身解析。ID→PN 的品牌推断只补未知品牌；从多个 ID 补全规格时也保留规范键，不因显示文本相同而合并具体 die。

全量样本、测量口径和保留限制见 [FDB 87 关系审计](pn_code/evidence/pn-flash-id-matching-2026-09.md)。

## 输出结构

生成结果包含：

- `info`
- `iddb`
- 各厂商顶层对象（如 `micron`、`samsung`、`kioxia` 等）

## SDK 调用

```ts
import { generateFdb, auditFdb } from "@itxtech/fdnext-fdbgen";

const fdb = generateFdb({
  inputDir: "./dataset",
  version: "<ver>",
  outputFile: "./packages/core/resources/fdb.json",
  pretty: true
});
const audit = auditFdb(fdb, { maxSamples: 8 });
```

`mdb` 爬取 SDK：

```ts
import { crawlMdb } from "@itxtech/fdnext-fdbgen";

await crawlMdb({
  file: "./packages/core/resources/mdb.json",
  pretty: true
});
```

类型定义见：

- `packages/fdbgen/src/types.ts`

## 相关文档

- [项目主页](../README.md)
- [集成指南](./INTEGRATION.md)
- [iTXTech fdnext DecodePack 规范](./DECODEPACK.md)
- [PN 编码资料](./pn_code/README.md)
