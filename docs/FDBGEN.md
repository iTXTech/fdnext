# FDBGen 文档

`@itxtech/fdnext-fdbgen` 是 `fdnext` 的 FDB / MDB 维护包，用于从本地数据目录生成 `fdb.json`。当前 raw FlashDB 数据目录是仓库外部的 `../fdfdb`，raw 目录由仓库内 controller / vendor registry 解析并归一化。

## 功能范围

- 从多种输入来源合并 PN 与 Flash ID 数据
- 支持 raw FlashDB 子目录（`smff/smufd/smssd/jm/mk/ma/sf/al/cbm/is/ps/ys/fc`）
- 归一化厂商名与主键格式（Vendor / PN / Flash ID）
- 按确定性 PN 前缀校正厂商归属，避免 `MT29F...` 被放入 Samsung 等错误厂商桶
- 清理无效 Flash ID、残缺 PN 别名与悬空 `iddb.n` 反向引用
- 自动回填 `iddb.n`（`vendor partNumber` 反向引用）
- 聚合并去重 `info.controllers`
- 生成稳定排序的输出 JSON，便于 diff 与审阅

## 安装与构建

```bash
pnpm install
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

当前 raw FlashDB 生成命令：

```bash
pnpm fdbgen:generate -- --input ../fdfdb --output packages/resources/resources/fdb.json --version <ver> --pretty
```

`mdb` 爬取工具：

```bash
node packages/fdbgen/dist/cli.js crawl-mdb --file <mdb.json> [options]
```

或使用根脚本：

```bash
pnpm fdbgen:crawl-mdb -- --file <mdb.json> [options]
```

说明：SpecTek 查询沿用旧版 ASPX 页面流程（`https://www.spectek.com/menus/mark_code.aspx`），通过提交表单后解析页面 DOM 表格，不依赖新接口；默认覆盖 NAND `PF*` / `PX*` 以及 DRAM `PB*` / `PE*` / `PP*` / `PU*` mark code 前缀。

Micron 查询统一按 FBGA code 前缀 profile 生成候选并调用官方 FBGA decoder API。默认 profile 包括 `C9/D8/D9/Z8/Z9` 两位前缀后三位字母网格，以及 `NC/NW/NY/NX/NQ/NV` 数字段。后续新增 Micron 数字段或字母网格段时扩展 profile，不再新增 crawler 入口。`--codes` 补充输入会按前缀路由：命中 Micron profile 的 code 走 Micron API，`P*` code 走 SpecTek。

### 参数

- `--input <dir>`：输入目录（必填）
- `--output <file>`：输出文件路径（必填）
- `--version <ver>`：写入 `info.version`（必填）
- `--meta <file>`：元信息 JSON 覆盖文件（可选）
- `--extra <file>`：额外合并补丁文件（可选，可重复）；未显式传入时自动读取 `input/extra/*.json`
- `--name <name>`：覆盖 `info.name`
- `--website <url>`：覆盖 `info.website`
- `--exclude-controller <name>`：从生成的 FDB 输出中排除指定控制器，可重复传入，也可用逗号分隔；默认黑名单包含 `3281FL` / `3379FL`
- `--pretty`：格式化输出 JSON（`crawl-mdb` 默认已格式化，便于查看 diff）

`info.version` 必须显式传入。`info.time` 始终在生成时写入当前 UTC 时间，不从 `meta.json` / `extra/*.json` 或命令行覆盖。

提取工具输出的标准支持列表请使用 `fdnext fdbgen v1` 格式，详见 [`FDBGEN_FORMAT_V1.md`](FDBGEN_FORMAT_V1.md)。该格式分为短 key 的 compact (`fdnext.fdbgen.v1c`) 和 full (`fdnext.fdbgen.v1f`)；entry 字段允许缺损，fdbgen 会只消费足够形成有效记录的部分。

`crawl-mdb` 额外参数：

- `--file <path>`：`mdb.json` 文件路径（必填）
- `--codes <path>`：可选补充 MDB code JSON，当前参考文件为 `references/micron-fbga-codes.json`，使用顶层字符串数组保存非默认 profile 的历史例外；读取时按前缀路由，命中 Micron profile 的 code 走 Micron API，`P*` code 走 SpecTek，未知前缀跳过。
- `--start-from <code>`：从 Micron 或 SpecTek code 段开始，例如 `D9N` 从 Micron 字母网格段继续跑，`NW101` 从 Micron 数字段继续跑，`PB002` 从 SpecTek 队列继续跑。
- `--micron-max <n>`：Micron 数字段 FBGA 上界（不含，默认 `1000`）
- `--spectek-max <n>`：SpecTek 爬取上界（不含，默认按前缀自动计算）
- `--delay-ms <n>`：每次请求间隔（毫秒）
- `--user-agent <ua>`：自定义请求 UA
- `--concurrency <n>`：并行请求上限（默认 `5`）
- `--flush-hits <n>`：累计命中多少条后 flush 一次 `mdb.json`（默认 `20`）
- `--save-each-hit`：每次命中都 flush `mdb.json`
- `--no-save-each-hit`：仅在结束时写盘

`audit` 是只读检查命令，用于在清理前后固定 FDB 质量口径，不会修改 `fdb.json`：

```bash
pnpm fdbgen:audit
pnpm fdbgen:audit -- --json
pnpm -s tsx ./packages/fdbgen/src/cli.ts audit --file packages/resources/resources/fdb.json --max-samples 12
pnpm -s tsx ./packages/fdbgen/src/cli.ts audit --input ../fdfdb --version 82 --trace-sources --max-samples 12
```

- `--file <path>`：要检查的 `fdb.json` 文件，根脚本默认指向 `packages/resources/resources/fdb.json`
- `--input <dir>`：从 raw / structured dataset 临时生成 FDB 后审计，不写入 `fdb.json`
- `--version <ver>`：配合 `--input` 使用，写入临时生成结果的 `info.version`
- `--trace-sources`：配合 `--input` 使用，在 issue 中输出来源 controller、文件、行号或 record index、原始记录、归一化结果和 merge decision
- `--json`：输出结构化 JSON 报告，方便后续 CI 或脚本消费
- `--max-samples <n>`：每类问题最多输出多少个样本，默认 `8`
- `--fail-on-issues`：发现任意 issue 时以退出码 `2` 结束，默认只报告不失败

当前审计会覆盖以下规范：

- 顶层 vendor 是否在已知 FDB vendor 集合内
- `iddb` key 和 PN `id` / `f` 引用是否为完整 6 字节 / 12 位十六进制 Flash ID
- PN `id` / `f`、`a`、`iddb.n` 是否存在悬空引用
- 确定性 PN 前缀和 vendor 桶是否冲突
- PN 表中是否混入合成标签、描述片段、日期码、异常标点或 controller-only 记录
- `iddb` 中缺少 PN 反向引用或 controller 支持的低置信记录

开启 `--trace-sources` 时，audit 会在 fdbgen 内部构建临时 provenance map，但不会把 trace 写入最终 FDB。报告会同时展示最终 FDB issue 和该 issue 对应的引入位置，例如哪个 controller parser、哪个 raw 文件、哪一行或 JSON record、原始内容、归一化后的 vendor / PN / Flash ID 以及 `add_part_id` / `merge_part_payload` / `merge_flash_payload` 等 decision。该模式用于清理前定位来源，常规发布资源仍只输出干净的 `fdb.json`。

`audit-extra` 是 extra 候选文件的只读审计入口，适合在一次性清洗数据合并前检查覆盖影响：

```bash
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-extra ../fdfdb/extra/base.json --base-fdb packages/resources/resources/fdb.json --decodepack
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-fdb packages/resources/resources/fdb.json --json --out ../fdfdb/sky.audit.json
```

- `--candidate <path>`：候选 extra 文件，必填
- `--base-extra <path>`：现有 base extra 文件，用于检查同 vendor + PN 的 `fid/id/l/c/m/d/e/r/n/t/a/f` 差异
- `--base-fdb <path>`：现有 generated `fdb.json`，用于检查 ID 覆盖、fanout、controller 支持和 `iddb.n` 反向引用
- `--decodepack`：在 CLI 层加载 fdnext core/decodepack engine，对候选 PN 的 vendor、制程、cell 和 topology 做冲突审计；通用 fdbgen 库不直接依赖 decodepack
- `--json` / `--out <path>` / `--max-samples <n>` / `--fail-on-issues`：与普通 audit 相同

## 输入目录约定

输入目录支持两种来源。

### Raw FlashDB

当前底层数据目录为 `../fdfdb`，它是独立 raw 数据文件夹，不是已生成的 `packages/resources/resources/fdb.json`。生成器发现以下任一子目录时会按 raw 模式加载，并按固定 controller 顺序合并：

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

未发现 raw 子目录时，输入目录支持以下文件/子目录（均可选）：

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

Extra schema 名为 `fdnext.fdb.extra.v1`，generated `fdb.json` schema 名为 `fdnext.fdb.v1`，对应 schema 文件分别是 [`docs/schemas/fdnext.fdb.extra.v1.schema.json`](schemas/fdnext.fdb.extra.v1.schema.json) 和 [`docs/schemas/fdnext.fdb.v1.schema.json`](schemas/fdnext.fdb.v1.schema.json)。`schemaVersion` 是可选 root 字段；旧数据不带该字段仍可读取，但一旦提供就必须匹配对应 schema。fdbgen 生成新的 `fdb.json` 时会写入 `"schemaVersion": "fdnext.fdb.v1"`。

### 厂商解码模块

厂商相关规则不直接写在主生成流程里。`packages/fdbgen/src/vendors/` 下每个支持的厂商使用独立文件维护：

- 厂商别名（如 `sandisk` / `sndk`，兼容 `westerndigital` / `wd` → `sndk`）
- PN 前缀归属判断（如 `MT29*` → `micron`）
- 厂商特有 PN 封装后缀清理（如 Micron / SK hynix / SpecTek）

主生成器只负责 raw 控制器数据解析、合并和输出，厂商归属与 PN 清理由 vendor registry 统一调用。

### 控制器厂商模块

控制器 raw 数据解析也不直接写在主生成流程里。`packages/fdbgen/src/controllers/` 下按控制器厂商拆分：

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

主生成器通过 controller registry 维持固定加载顺序，具体解析逻辑由对应控制器厂商文件负责。

Alcor Micro `al/` 目录同时支持旧版 CSV 和标准 `fdnext fdbgen v1c/v1f` JSON。FirstChip `fc/` 目录同时支持旧版制表符 `.txt`、旧版 FirstChip 原始 JSON 数组，以及标准 `fdnext fdbgen v1c/v1f` JSON。Innostor `is/` 目录同时支持旧版 `.ini` 和标准 `fdnext fdbgen v1c/v1f` JSON。Phison `ps/` 目录保留旧版 Phison JSON 数组解析，并额外支持 `ufd.json` 这类标准 `fdnext fdbgen v1c/v1f` UFD 支持列表。

标准 v1 JSON 先由共享 `parseFdnextFdbgenV1` 解析器读取，再通过共享 `mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry` 导入；PN 清理、厂商前缀准入、controller name 归一化、可信 PN 写入 PN 表、不可信 PN 回落 `iddb` 都在该通用组件处理。JSON 输入只读取完整十六进制字节形式的 Flash ID，并只合并当前 NAND Flash ID 解码器支持的厂商前缀（Micron / Intel / Samsung / SK hynix / KIOXIA / SanDisk / YMTC / SpecTek）。未支持控制器别名统一通过 fdbgen 控制器黑名单排除，而不是写在单个 controller parser 中。

Phison UFD 支持列表中的群联侧 PN 会进入 `phison` PN 表，但使用单向字段表达关联：`f` 表示查询该 PN 时可跳转的 Flash ID，`a` 表示可显示的原厂 PN 引用。它们不会触发 `iddb.n` 反向回填，因此查询原厂 PN 或 Flash ID 时不会反向关联群联 PN。Phison UFD 只把符合群联 10 位编码形态的 PN 写入 `phison` 表；Micron FBGA / marking code 这类输入只通过 v1 entry 回调清除 PN 后合并到 `iddb[id].t`。

### 加载顺序

Raw FlashDB 模式：

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

生成器会按高置信 PN 前缀重新分配 vendor：

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

- PN key 统一转大写，并移除空格、逗号、`&`、`.`、`|`
- Flash ID key 统一移除空白、转大写；非十六进制、奇数字节长度或异常长度的 ID 会被丢弃
- 数组字段（如 `id/f/a/t/n/controllers`）会去重
- `extra/*.json` 的 PN payload 额外支持 `fid`，表示可信来源强制覆盖该 PN 的主 Flash ID；`fid` 与 `id` 互斥，生成后的 `fdb.json` 只输出 `id`，不保留 `fid`
- `extra/*.json` 顶层支持 `priority`，语义与 decodepack 相同：数字越大越优先，默认 `0`
- 多个 extra 文件会先按 `priority` 从高到低排序，再按文件名排序；较高优先级文件已提供 `id/fid` 时，较低优先级文件不会抢占该 PN 的身份信息，但仍可补充缺失的非身份字段和追加 controller / alias
- priority stack 中胜出的 `id/fid` 会作为该 PN 的 authoritative ID 覆盖 raw 输入，因此 sky Micron 这类不需要强制语义的记录可以写 `id`，不必写 `fid`
- generated `fdb.json` 禁止出现 `fid`，并使用 `fdnext.fdb.v1` schema
- 数值字段（`s/p/b/d/e/r/n`）仅接受有限数值
- 如果 `*_1` 或尾部 `-` PN 有明确 base PN，会合并回 base PN
- `iddb.n` 只保留能在 vendor PN 表中找到的反向引用
- 控制器黑名单会统一作用于 `info.controllers`、PN `t` 和 `iddb.t`，默认排除 `3281FL` / `3379FL`；额外黑名单可通过 CLI `--exclude-controller` 或 extra 顶层 `controllerBlacklist` 指定

### 自动回填

- 对每个 PN 的 `id`，自动向对应 `iddb[flashId].n` 写入 `"<vendor> <partNumber>"` 反向关联
- PN 的 `f` 只作为当前 PN 的单向 Flash ID 关联，不参与 `iddb.n` 回填
- `info.controllers` 会汇总：
  - `meta/extra` 中声明的 controllers
  - PN 的 `t` 字段
  - IDDB 的 `t` 字段

### 输出排序

- Vendor、PN、Flash ID 按字典序排序
- 对象键稳定输出，便于版本管理与差异比较

## 输出结构

生成结果包含：

- `info`
- `iddb`
- 各 vendor 顶层对象（如 `micron`、`samsung`、`kioxia` 等）

## SDK 调用

```ts
import { generateFdb } from "@itxtech/fdnext-fdbgen";

const fdb = generateFdb({
  inputDir: "./dataset",
  version: "79",
  outputFile: "./packages/resources/resources/fdb.json",
  pretty: true
});
```

`mdb` 爬取 SDK：

```ts
import { crawlMdb } from "@itxtech/fdnext-fdbgen";

await crawlMdb({
  file: "./packages/resources/resources/mdb.json",
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
