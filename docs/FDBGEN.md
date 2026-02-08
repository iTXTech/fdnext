# FDBGen 文档

`@itxtech/fdnext-fdbgen` 是 `fdnext` 内置的独立 TypeScript 实现，用于从本地数据目录生成 `fdb.json`，不依赖上游 PHP 脚本。

## 功能范围

- 从多种输入来源合并 PN 与 FlashId 数据
- 归一化厂商名与主键格式（Vendor/PN/FlashId）
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
node packages/fdbgen/dist/cli.js build --input <dataset-dir> --output <fdb.json> [options]
```

仓库根目录也提供脚本入口：

```bash
pnpm fdbgen:generate -- --input <dataset-dir> --output <fdb.json> [options]
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
- `--meta <file>`：元信息 JSON 覆盖文件（可选）
- `--extra <file>`：额外合并补丁文件（可选）
- `--version <ver>`：覆盖 `info.version`
- `--name <name>`：覆盖 `info.name`
- `--website <url>`：覆盖 `info.website`
- `--time <text>`：覆盖 `info.time`
- `--pretty`：格式化输出 JSON

`crawl-mdb` 额外参数：

- `--file <path>`：`mdb.json` 文件路径（必填）
- `--micron-max <n>`：Micron 爬取上界（不含，默认 `1000`）
- `--spectek-max <n>`：SpecTek 爬取上界（不含，默认按前缀自动计算）
- `--delay-ms <n>`：每次请求间隔（毫秒）
- `--user-agent <ua>`：自定义请求 UA
- `--no-save-each-hit`：仅在结束时写盘（默认命中即写盘，便于中断续跑）

## 输入目录约定

输入目录支持以下文件/子目录（均可选）：

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
    "name": "iTXTech FlashDetector Flash Database",
    "website": "https://github.com/iTXTech/FlashDetector",
    "version": "custom",
    "time": "Mon, 01 Jan 2026 00:00:00 GMT",
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

### 加载顺序

1. `fdb.json`
2. `vendors/*.json`
3. `iddb/*.json`
4. `flashids/*.json`
5. `extra.json`（对 `info/vendors/iddb` 追加合并）
6. 命令行参数覆盖 `info` 字段

### 厂商名归一化

以下别名会自动修正：

- `sandisk` / `sndk` → `westerndigital`
- `toshiba` / `toshiba-iver` → `kioxia`
- `hynix` → `skhynix`

### 键与字段处理

- PN key 统一转大写
- FlashId key 统一转大写
- 数组字段（如 `id/t/n/controllers`）会去重
- 数值字段（`s/p/b/d/e/r/n`）仅接受有限数值

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
  outputFile: "./resources/fdb.json",
  pretty: true
});
```

`mdb` 爬取 SDK：

```ts
import { crawlMdb } from "@itxtech/fdnext-fdbgen";

await crawlMdb({
  file: "./resources/mdb.json",
  pretty: true
});
```

类型定义见：

- `packages/fdbgen/src/types.ts`

## 相关文档

- [项目主页](../README.md)
- [集成指南](./INTEGRATION.md)
- [DSL 规范](./DSL_SPEC.md)
