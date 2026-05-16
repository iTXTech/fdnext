# Micron Raw NAND PN 编码

采集日期：2026-05-16

本文档记录 Micron `MT29E...` / `MT29F...` raw NAND 解析规则。`MT29FB...` 仍复用 `MT29F` raw NAND token 结构；当前没有公开 datasheet 或 catalog 明确证明它应作为独立 ECC NAND 类别展示，因此规则只把 `B` 作为内部 family marker 消费，不输出独立 chip kind 或 `ecc_enabled`。

## 外部资料

- Micron 官方 FBGA decoder 可确认 `NC103` 对应 `MT29FB16T08GALAAM5-TES:B`，`NC104` 对应 `MT29FB16T08GALAAM5-T:B`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 obsolete catalog 有 `MT29FB16T08GALAAM5-T-B` 与 `MT29FB8T08EALAAM5-QK-E` 详情页，可作为 PN 存在性与产品线 reference。
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb16t08galaam5-t-b>
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb8t08ealaam5-qk-e>
- 侧面资料显示部分相关器件可能包含 ONFI I/O expander，但当前资料不足以把该线索公开成稳定产品类别。

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
| optional `-...` suffix and optional `:A` / `:B` style revision | 作为 Micron NAND 尾部状态 / revision token 消费；用于匹配和 canonical PN 保留，不作为公开字段输出 |
| `B` after `MT29F` | `MT29FB` family marker；仅用于内部剥离并复用 `MT29F` 后续 token 结构 |

## 输出字段

- `device.chipKind` 输出 `raw_nand`，展示为 `NAND` / `NAND Flash`。
- `MT29FB` 复用 `MT29F` raw NAND 的 density、device width、cell level、topology、voltage、die、interface、package 编码。
- `fields` 与 raw NAND 保持一致输出 `enterprise`、`interface_type`；die/package 等 code token 只用于内部解析，不进入公开字段。
- 当前不输出 `ecc_enabled`，也不新增 I/O expander 类别；这些线索需要 datasheet、ordering information 或可靠外部表确认后再进入 public result。

## 测试样例

- `MT29FB16T08GALAAM5-TES:B`
- `MT29FB8T08EALAAM5-QK:E`
- `MT29F2G08ABDHC-ET:D`
- 去冒号输入也应匹配 mdb canonical PN，例如 `MT29FB16T08GALAAM5-TESB` -> `MT29FB16T08GALAAM5-TES:B`

## 注意

- 规则按 `MT29F` / `MT29FB` 统一结构化 token 解析，不维护完整 PN 白名单。
- `MT29FB` 与 `MT29F` 只差 `F` 后的 `B` marker；实现上剥掉该 `B` 后复用 raw NAND token 语义。
- 公开资料可确认 PN 存在性；具体 NAND 代际、die density、page / block geometry、ECC 状态和 I/O expander 结构只在找到 datasheet 或可靠外部表后再补。
