# FDBGen 文档

`@itxtech/fdnext-fdbgen` 是 `fdnext` 内置的独立 TypeScript 实现，用于从本地数据目录生成 `fdb.json`。当前 raw FlashDB 数据目录是仓库外部的 `../fdfdb`，raw 目录解析逻辑参考 PHP 版 `../FlashDetector/FDBGen`。

## 功能范围

- 从多种输入来源合并 PN 与 FlashId 数据
- 兼容 FlashDetector raw FlashDB 子目录（`smff/smufd/smssd/jm/mk/ma/sf/al/cbm/is/ps/ys/fc`）
- 归一化厂商名与主键格式（Vendor/PN/FlashId）
- 按确定性 PN 前缀校正厂商归属，避免 `MT29F...` 被放入 Samsung 等错误厂商桶
- 清理无效 FlashId、残缺 PN 别名与悬空 `iddb.n` 反向引用
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
```

当前 raw FlashDB 生成命令：

```bash
pnpm -s tsx ./packages/fdbgen/src/cli.ts build --input ../fdfdb --output packages/resources/resources/fdb.json --version 79 --pretty
```

`mdb` 爬取工具（参考 FlashDetector 的 `microndb` 流程）：

```bash
node packages/fdbgen/dist/cli.js crawl-mdb --file <mdb.json> [options]
```

或使用根脚本：

```bash
pnpm fdbgen:crawl-mdb -- --file <mdb.json> [options]
```

说明：SpecTek 查询沿用旧版 ASPX 页面流程（`https://www.spectek.com/menus/mark_code.aspx`），通过提交表单后解析页面 DOM 表格，不依赖新接口。

### 参数

- `--input <dir>`：输入目录（必填）
- `--output <file>`：输出文件路径（必填）
- `--version <ver>`：写入 `info.version`（必填）
- `--meta <file>`：元信息 JSON 覆盖文件（可选）
- `--extra <file>`：额外合并补丁文件（可选）
- `--name <name>`：覆盖 `info.name`
- `--website <url>`：覆盖 `info.website`
- `--pretty`：格式化输出 JSON（`crawl-mdb` 和 `crawl-mdb-from-fbga` 默认已格式化，便于查看 diff）

`info.version` 必须显式传入。`info.time` 始终在生成时写入当前 UTC 时间，不从 `meta.json` / `extra.json` 或命令行覆盖。

`crawl-mdb` 额外参数：

- `--file <path>`：`mdb.json` 文件路径（必填）
- `--micron-max <n>`：Micron 爬取上界（不含，默认 `1000`）
- `--spectek-max <n>`：SpecTek 爬取上界（不含，默认按前缀自动计算）
- `--delay-ms <n>`：每次请求间隔（毫秒）
- `--user-agent <ua>`：自定义请求 UA
- `--concurrency <n>`：并行请求上限（默认 `5`）
- `--flush-hits <n>`：累计命中多少条后 flush 一次 `mdb.json`（默认 `20`）
- `--save-each-hit`：每次命中都 flush `mdb.json`
- `--no-save-each-hit`：仅在结束时写盘

`crawl-mdb-from-fbga` 默认按 Micron DRAM FBGA 常见 code 段生成候选（`C9/D8/D9/Z8/Z9` + 字母网格），只信 Micron 官方 FBGA decoder API 返回的 PN，并写入统一 `mdb.json`：

```bash
pnpm fdbgen:crawl-mdb-from-fbga -- --file packages/resources/resources/mdb.json
```

- `--codes <path>`：可选补充 Micron FBGA code JSON，当前为顶层字符串数组，用于保留非默认字母网格的历史例外；读取时会跳过 `crawl-mdb` 使用的 Micron NAND 段 `NC/NW/NY/NX/NQ/NV`
- `--file <path>`：`mdb.json` 文件路径（必填）
- `--start-from <code>`：从指定 FBGA code 或 code 段开始，例如 `D9N` 会从 `D9N*` 段继续跑
- `--delay-ms <n>`：每次请求间隔（毫秒）
- `--user-agent <ua>`：自定义请求 UA
- `--no-generated-codes`：禁用默认 `C9/D8/D9/Z8/Z9` 生成候选，只使用 `--codes` 补充文件
- `--concurrency <n>`：并行请求上限（默认 `5`）
- `--flush-hits <n>`：累计命中多少条后 flush 一次 `mdb.json`（默认 `20`）
- `--save-each-hit`：每次命中都 flush `mdb.json`
- `--no-save-each-hit`：仅在结束时写盘

## 输入目录约定

输入目录支持两种来源。

### Raw FlashDB

当前底层数据目录为 `../fdfdb`，它是独立 raw 数据文件夹，不是已生成的 `packages/resources/resources/fdb.json`。生成器发现以下任一子目录时会按 raw 模式加载，并按 PHP `FDBGen` 的生成器顺序合并：

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
extra.json
```

### 结构化输入

未发现 raw 子目录时，输入目录支持以下文件/子目录（均可选）：

- `fdb.json`
- `meta.json`
- `extra.json`
- `vendors/*.json`
- `iddb/*.json`
- `flashids/*.json`

推荐结构示例：

```text
dataset/
  fdb.json
  meta.json
  extra.json
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

`extra.json`：

```json
{
  "info": {
    "controllers": ["PS3111"]
  },
  "vendors": {
    "phison": {
      "TA17GABCH0": {
        "t": ["PS3111"]
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

主生成器通过 controller registry 维持 PHP `FDBGen` 的加载顺序，具体解析逻辑由对应控制器厂商文件负责。

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
14. `extra.json`
15. 命令行参数覆盖 `info` 字段

结构化输入模式：

1. `fdb.json`
2. `vendors/*.json`
3. `iddb/*.json`
4. `flashids/*.json`
5. `extra.json`（对 `info/vendors/iddb` 追加合并）
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
- FlashId key 统一移除空白、转大写；非十六进制、奇数字节长度或异常长度的 ID 会被丢弃
- 数组字段（如 `id/t/n/controllers`）会去重
- 数值字段（`s/p/b/d/e/r/n`）仅接受有限数值
- 如果 `*_1` 或尾部 `-` PN 有明确 base PN，会合并回 base PN
- `iddb.n` 只保留能在 vendor PN 表中找到的反向引用

### 自动回填

- 对每个 PN 的 `id`，自动向对应 `iddb[flashId].n` 写入 `"<vendor> <partNumber>"` 反向关联
- `info.controllers` 会汇总：
  - `meta/extra` 中声明的 controllers
  - PN 的 `t` 字段
  - IDDB 的 `t` 字段

### 输出排序

- Vendor、PN、FlashId 按字典序排序
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
- [DSL 规范](./DSL_SPEC.md)
- [PN 编码资料](./pn_code/README.md)
