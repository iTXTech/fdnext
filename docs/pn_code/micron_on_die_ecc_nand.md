# Micron On-die ECC NAND PN 编码

采集日期：2026-05-09

本文档记录 Micron `MT29FB` 系列的 On-die ECC NAND 解析规则。这里的 On-die ECC NAND 指 ECC 由 NAND 侧集成处理，但 wear leveling、bad block management 等仍由 host / controller 侧负责；不要和 eMMC / UFS 这类 fully managed NAND 混淆。

## 外部资料

- Micron 官方 Choosing the right NAND 页面区分 Raw NAND、Managed NAND 和 On-die ECC NAND：On-die ECC NAND 集成 ECC，但 wear leveling 与 bad block management 仍由 host controller 处理。
  <https://www.micron.com/products/storage/nand-flash/choosing-the-right-nand>
- Micron 官方 FBGA decoder 可确认 `NC103` 对应 `MT29FB16T08GALAAM5-TES:B`，`NC104` 对应 `MT29FB16T08GALAAM5-T:B`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 obsolete catalog 有 `MT29FB16T08GALAAM5-T-B` 与 `MT29FB8T08EALAAM5-QK-E` 详情页，可作为 PN 存在性与产品线 reference。
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb16t08galaam5-t-b>
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb8t08ealaam5-qk-e>
- Linux / LWN 对 Micron NAND 的 on-die ECC 支持使用 `on-die ECC` / `internal ECC` 术语，可作为第三方术语佐证。
  <https://lwn.net/Articles/637855/>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/micron-raw-token.json`
- `vendor.micron.token.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT29F` + optional `B` + density + width + cell + class + voltage + die + interface + package + optional suffix | Micron NAND PN 主结构 |
| density token | 复用 Micron raw NAND density token 表，落库为 Mbit |
| width `01/08/16` | NAND I/O 位宽 |
| cell token | 复用 Micron raw NAND cell token 表 |
| class / voltage / die / interface token | 复用 Micron raw NAND token 表 |
| package token | 复用 Micron raw NAND package token 表 |
| `B` after `MT29F` | On-die ECC NAND 产品线标记；后续 token 继续按 `MT29F` raw NAND 编码解释 |

## 输出字段

- `device.productType` 输出 `on_die_ecc_nand`，展示为 `On-die ECC NAND`。
- `MT29FB` 复用 `MT29F` raw NAND 的 density、device width、cell level、topology、voltage、die、interface、package 编码；区别是 `device.chipKind` 输出 `on_die_ecc_nand` 并补 `fields.ecc_enabled`。
- `fields` 与 raw NAND 保持一致输出 `enterprise`、`die_code`、`interface_type`，`MT29FB` 额外输出 `ecc_enabled`。

## 测试样例

- `MT29FB16T08GALAAM5-TES:B`
- `MT29FB8T08EALAAM5-QK:E`

## 注意

- 规则按 `MT29F` / `MT29FB` 统一结构化 token 解析，不维护完整 PN 白名单。
- `MT29FB` 与 `MT29F` 只差 `F` 后的 `B` 产品线标记；实现上剥掉该 `B` 后复用 raw NAND token 语义。
- 目前公开资料未确认 `B` 应展示为“内置 ECC 控制器”字段，因此输出产品类型 `On-die ECC NAND` 和 `ECC enabled`，不输出 `B = controller` 结论。
- 公开资料可确认产品线和 PN 存在性；具体 NAND 代际、die density、page / block geometry 只在找到 datasheet 或可靠外部表后再补。
