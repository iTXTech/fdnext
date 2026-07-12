# Micron Raw NAND PN 编码

采集日期：2026-07-12

本文档记录 Micron `MT29E...` / `MT29F...` / `MT29H...` raw NAND 解析规则，以及
`MT29FB...` 的 HSC NAND ordering 结构。`MT29FB` 中的 `B` 表示 `Flash + IOE ASIC`，
公开输出中分类仍为 Raw NAND，HSC 只作为 NAND technology 备注，mode 输出为
`IO Expander`。

## 外部资料

- 用户提供的 Micron `Current Part Number System (HSC NAND Flash)` ordering 图给出
  `MT 29F B 64T 08 G D L B B N2 - QJ ES : B` 结构，可确认 `MT29FB` HSC NAND
  的 density、cell、configuration、voltage、IOE ASIC、interface、package、feature、
  production status 和 design revision token。
- 用户提供的 Micron `Current Part Number System (NAND Flash 50-series ~ now)` ordering 图给出
  `MT 29F 16T 08 E W L E H D6 - 36 IT R ES : E` 结构，可确认 current raw NAND
  的 density、bus width、cell、device configuration、voltage、die generation、interface、
  package、speed、temperature、feature、production status 和 design revision token。
- 用户提供的 Micron `Legacy Part Number System (NAND Flash 20-series ~ 60-series)` ordering 图给出
  `MT 29F 128G 08 W A A C6 - xx xx xx ET ES : A` 结构，可确认 legacy raw NAND
  中 width 后直接跟 device configuration，且 `29H` speed grade 只对 High Speed NAND Flash
  有效。
- Micron 官方 FBGA decoder 可确认 `NC103` 对应 `MT29FB16T08GALAAM5-TES:B`，`NC104`
  对应 `MT29FB16T08GALAAM5-T:B`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 obsolete catalog 有 `MT29FB16T08GALAAM5-T-B` 与
  `MT29FB8T08EALAAM5-QK-E` 详情页，可作为 PN 存在性与产品线 reference。
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb16t08galaam5-t-b>
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb8t08ealaam5-qk-e>
- Micron 官方 current SLC NAND catalog JSON 在 2026-07-12 审计时返回 107 个 PN。逐 PN 对照
  catalog 的 capacity、bus width、technology、package pin/dimension 后，现有 current structured
  decoder 107/107 一致；实际出现的 `WP/H4/HC/12/WB/SF/H1/H3` package token 均已有 token
  映射，因此本轮没有为了扩大样例数重复加入完整 PN 查表。
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/slc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/slc-nand/-/en_US>
- 2026-07-12 继续审计 Micron 官方 current MLC/TLC/QLC 与 obsolete MLC/TLC/3D/SLC
  catalog JSON，共 348 条 `MT29E/MT29F/MT29H` PN。逐 PN 对照 vendor、Raw NAND 类型、
  capacity、bus width、cell type 和 component package 后，现有 structured decoder 348/348
  均能保持这些确定字段；catalog 中存在的 component package 也均已有语义映射，因此没有
  新增完整 PN 查表。`J4` / `H3` 的部分 catalog 行所列厚度与既有映射不一致，属于待进一步
  核对的来源冲突，本轮按只增不改原则保留既有 mapping，不以单次 catalog 扫描覆盖。
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/mlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/mlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/tlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/tlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/qlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/qlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-mlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-mlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-tlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-tlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-3d-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-3d-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-slc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-slc-nand/-/en_US>
- Micron `TN-29-19: NAND Flash 101` 的 READ ID 表逐 bit 给出旧 2Gb SLC
  `MT29F2G08/16 AAD/ABD` 的 device ID、die 数、cell、page、block、位宽、plane
  与电压。Identifier DecodePack 因此只对该表明确列出的 `AA/BA/CA/DA` device ID
  补充 2Gb density、x8/x16、1.8V/3.3V、2KB page、64B spare area 和 128KB block；不把旧格式
  位段泛化到现代 3D NAND ID。
  <https://user.eng.umd.edu/~blj/CS-590.26/micron-tn2919.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-raw-structured-token.json`
- `packages/core/src/decodepack/rules/packs/micron-raw-token.json`
- `packages/core/src/decodepack/identifier/packs/micron-inteldef.json`
- `vendor.micron.hsc.mt29fb.v1`
- `vendor.micron.raw.current.v1`
- `vendor.micron.raw.legacy.v1`

Micron Raw NAND 由三类官方 ordering 结构覆盖，不保留旧的未分型通用规则：

- `vendor.micron.hsc.mt29fb.v1`：`MT29FB` HSC NAND，优先级最高。
- `vendor.micron.raw.current.v1`：`MT29E` / `MT29F` current 50-series 及后续 raw NAND。
- `vendor.micron.raw.legacy.v1`：官方 legacy 20-series ~ 60-series raw NAND，包括 `29H`
  High Speed NAND Flash。

三者公开分类都保持 Raw NAND。HSC 规则按头部结构匹配，尾部未知 token 不会阻断 vendor、
density、cell、configuration 等已确认字段输出。

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
| configuration `A/B/C/D` | `A=16 die, 2 nCE, 1 I/O`; `B=8 die, 1 nCE, 1 I/O`; `C=16 die, 2 nCE, 2 I/O`; `D=32 die, 2 nCE, 2 I/O` |
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
- `die_count`、`ce_count`、`channel_count`
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
IOE code、interface code、package code、feature code、design revision code，以及由 evidence manifest 单独维护的 reference / status 信息。

## Current MT29E / MT29F Raw NAND

非 HSC current `MT29E...` / `MT29F...` 使用 50-series 及后续 raw NAND token 结构：

| 结构 | 含义 |
| --- | --- |
| `MT29E/MT29F` + density + width + cell + config + voltage + die generation + interface + package + optional suffix + optional revision | Micron current raw NAND 主结构 |
| density token | 复用 Micron raw NAND density token 表，落库为 Mbit |
| width `01/08/16` | NAND I/O 位宽 |
| cell `A/C/E/G` | SLC / MLC / TLC / QLC |
| config token | 输出 `die_count`、`ce_count`、`rb_count`、`channel_count` |
| voltage token | 输出 `voltage`，只表达电压本身 |
| die generation token | 与 die density + cell type 组合推导 `die_codename` |
| interface token | 输出 `interface_type`，例如 `Sync only`、`NV-DDR3/NV-LPDDR4` |
| package token | 只在 ordering 图给出实际封装尺寸 / ball count 时输出 `package` |
| optional suffix | 按 `speed + temperature + feature + production status` 拆分为 `speed_grade`、`operation_temperature`、`special_option`、`prod_status`；design revision code 不公开 |

Current 规则额外覆盖 `64T` density、`D6/L*` 等新 package、`J` interface、`IT/AIT/AT/AUT`
温度等级，以及 `Q/QZ/ZQ/QJ/QK/R/RZ/...` 等 feature token；其中 `Q` 为 `Enterprise Q`，
`QZ/ZQ` 为 `Enterprise Q + Polyimide Process Applied`。`20` speed code 在资料图中存在重复含义，
当前不公开该 code 的 `speed_grade`，避免把 `100 MT/s` / `2000 MT/s` 误判为确定值。

## Legacy MT29F / MT29H Raw NAND

Legacy 20-series ~ 60-series 结构与 current 结构不同：width 后直接是 device configuration，
没有独立的 cell type token，也没有 current 结构中的 interface token。

| 结构 | 含义 |
| --- | --- |
| `MT29F/MT29H` + density + width + config + voltage + die generation + package + optional suffix + optional revision | Micron legacy raw NAND 主结构 |
| product `29F/29H` | NAND Flash / High Speed NAND Flash |
| config token | 同时推导 SLC/MLC 与 `die_count`、`ce_count`、`rb_count`、`channel_count` |
| voltage `A/B/C/D` | legacy voltage 表 |
| die generation token | 与 die density + cell type 组合推导 `die_codename`；`29H` 8Gb SLC `A` 映射为 `M51H` |
| package token | 只输出图中有封装描述的 token；`BC` 暂不公开 package |
| speed grade | 仅对 `29H` 输出 `20/15/12/10 = 100/133/166/200 MT/s` |
| temperature / production status | 输出 `operation_temperature` / `prod_status` |

## 测试样例

- `MT29FB64T08GDLBBN2-QJES:B`
- `MT29FB16T08GALAAM5-TES:B`
- `MT29FB8T08EALAAM5-QK:E`
- `MT29F16T08EWLEHD6-36ITRES:E`
- `MT29H8G08AAAC6-20ETES:A`
- `MT29F128G08WAAC6-ETES:A`
- `MT29F2G08ABDHC-ET:D`
- 去冒号输入也应匹配 mdb canonical PN，例如 `MT29FB16T08GALAAM5-TESB` -> `MT29FB16T08GALAAM5-TES:B`
- Micron managed NAND PN 同样以有效 `mdb.json` mapping 为优先来源：MDB 已包含等价 PN 或 suffix 更详细的 PN 时，不再向 `managed-nand-pn.json` 重复加入；带 `DO NOT USE` 的 mapping 不作为覆盖依据。

## 注意

- `MT29FB` 使用专用 HSC token 规则，但这只是 Raw NAND 下的系列备注，不是独立 chip kind。
- Raw NAND 结果不额外补 `product_family`；HSC 信息只通过 `nand_technology` 备注。
- `N2` 目前只有 package token，ordering 图没有给出实际封装尺寸 / ball count，因此不公开 `package`。
- HSC configuration 图中的 `I/O` 列映射到公开 `channel_count`。
- `MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP / AiO / uMCP 组合封装不属于 raw NAND parser。
- `package_code`、`config_code`、`die_code`、`feature_code`、design revision code 等 token
  只用于内部解析，不进入 public fields。
