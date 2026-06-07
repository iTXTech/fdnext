# Micron Raw NAND PN 编码

采集日期：2026-06-07

本文档记录 Micron `MT29E...` / `MT29F...` raw NAND 解析规则，以及 `MT29FB...`
的 HSC NAND ordering 结构。`MT29FB` 中的 `B` 表示 `Flash + IOE ASIC`，公开输出中
分类仍为 Raw NAND，HSC 只作为 NAND technology 备注，mode 输出为 `IO Expander`。

## 外部资料

- 用户提供的 Micron `Current Part Number System (HSC NAND Flash)` ordering 图给出
  `MT 29F B 64T 08 G D L B B N2 - QJ ES : B` 结构，可确认 `MT29FB` HSC NAND
  的 density、cell、configuration、voltage、IOE ASIC、interface、package、feature、
  production status 和 design revision token。
- Micron 官方 FBGA decoder 可确认 `NC103` 对应 `MT29FB16T08GALAAM5-TES:B`，`NC104`
  对应 `MT29FB16T08GALAAM5-T:B`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 obsolete catalog 有 `MT29FB16T08GALAAM5-T-B` 与
  `MT29FB8T08EALAAM5-QK-E` 详情页，可作为 PN 存在性与产品线 reference。
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb16t08galaam5-t-b>
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb8t08ealaam5-qk-e>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-raw-token.json`
- `vendor.micron.hsc.mt29fb.v1`
- `vendor.micron.token.v1`

`vendor.micron.hsc.mt29fb.v1` 优先解析 HSC NAND token 结构；普通 `MT29E...` /
`MT29F...` raw NAND 仍由 `vendor.micron.token.v1` 处理。两者公开分类都保持 Raw NAND。
HSC 规则按头部结构匹配，尾部未知 token 不会阻断 vendor、density、cell、configuration
等已确认字段输出。

## MT29FB HSC Raw NAND

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT/EE` + `29F` + `B` + density + `08` + cell + config + voltage + IOE + interface + package + optional suffix + optional revision | Micron raw NAND with HSC ordering |
| system `MT/EE` | Micron Technology / Early Engineering Samples |
| product `29F` | NAND Flash |
| product type `B` | Flash + IOE ASIC；公开 mode 为 `IO Expander` |
| density `8T/16T/32T/62T/64T` | 8Tb / 16Tb / 32Tb / 62Tb / 64Tb，落库为 Mbit |
| bus width `08` | x8 |
| die type `E/G` | TLC / QLC |
| configuration `A/B/C/D` | `A=16 die, 2 nCE`; `B=8 die, 1 nCE`; `C=16 die, 2 nCE`; `D=32 die, 2 nCE` |
| voltage `L` | Vcc 3.30V or 2.50V, VccQ 1.20V |
| IOE `A/B` | IOE Gen 1 Rev.A / IOE Gen 2 Rev.A |
| interface `A/B/C` | NV-DDR3 only / NV-DDR3 + NV-LPDDR4 / NV-LPDDR4 only |
| package `M5/D5/D6/D7/N2` | `M5/D5/D6/D7` 有公开尺寸；`N2` 仅作内部 token |
| feature `T/QC/QJ/VJ/QK` | FortisMax 或 Performance enterprise option |
| production status `ES/EE/MS/QS` | Engineering / Early Engineering / Mechanical / Qualification samples |
| design revision | 与 die density + cell type 组合推导 `die_codename` |

Design revision 映射：

| Cell | Die density | Revision | Process |
| --- | --- | --- | --- |
| TLC | 512Gb | C | B27B |
| TLC | 512Gb | E | B47R |
| TLC | 1Tb | C | B58R |
| TLC | 1Tb | E | B68S |
| TLC | 1Tb | H | B78R |
| QLC | 1Tb | B | N28A |
| QLC | 1Tb | C | N48R |
| QLC | 1Tb | D | N58R |
| QLC | 2Tb | B | N69R |

公开输出：

- `density`、`device_width`、`cell_level`
- `die_count`、`ce_count`
- `voltage`
- `interface_type`
- `package`，仅限 `M5/D5/D6/D7` 这种资料给出实际尺寸的 token
- `nand_technology = HSC NAND`
- `product_mode = IO Expander`
- `controller_revision = IOE Gen ...`
- `special_option`
- `prod_status`
- `die_codename`，并由 `nand.die_profile` 补 `layer_count`、`die_density` 等标准字段

以下 token 不进入 public fields：system code、density code、configuration code、voltage code、
IOE code、interface code、package code、feature code、design revision code、reference / status metadata。

## 普通 MT29E / MT29F Raw NAND

非 HSC `MT29E...` / `MT29F...` 继续使用通用 raw NAND token 结构：

| 结构 | 含义 |
| --- | --- |
| `MT29E/MT29F` + density + width + cell + class + voltage + die + interface + package + optional suffix | Micron raw NAND 主结构 |
| density token | 复用 Micron raw NAND density token 表，落库为 Mbit |
| width `01/08/16` | NAND I/O 位宽 |
| cell token | SLC / MLC / TLC / QLC |
| class / voltage / die / interface token | 复用 Micron raw NAND token 表 |
| package token | 复用 Micron raw NAND package token 表 |
| optional `-...` suffix and optional `:A` / `:B` style revision | 用于匹配和 canonical PN 保留，不作为公开字段输出 |

## 测试样例

- `MT29FB64T08GDLBBN2-QJES:B`
- `MT29FB16T08GALAAM5-TES:B`
- `MT29FB8T08EALAAM5-QK:E`
- `MT29F2G08ABDHC-ET:D`
- 去冒号输入也应匹配 mdb canonical PN，例如 `MT29FB16T08GALAAM5-TESB` -> `MT29FB16T08GALAAM5-TES:B`

## 注意

- `MT29FB` 使用专用 HSC token 规则，但这只是 Raw NAND 下的系列备注，不是独立 chip kind。
- Raw NAND 结果不额外补 `product_family`；HSC 信息只通过 `nand_technology` 备注。
- `N2` 目前只有 package token，ordering 图没有给出实际封装尺寸 / ball count，因此不公开 `package`。
- HSC configuration 图中 `I/O` 列暂不映射到 `channel_count`；当前只公开可稳定对应的 `die_count`
  与 `ce_count`。
- `MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP / AiO / uMCP 组合封装不属于 raw NAND parser。
