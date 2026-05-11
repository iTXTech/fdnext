# Micron eMMC PN 编码

采集日期：2026-05-08

## 外部资料

- Micron 官方 e.MMC Standalone Part Numbering System 给出新版 `MT FC 2G AA AA M2 - xx xx ES` 结构、容量、温区、NAND component、controller revision、package code 和 special option 表。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A2e014e65-e44b-4558-931b-e5ebc6b7de00/renditions/original/as/numnextgenemmc.pdf>
- Micron 官方 Flash + Controller Part Numbering System 给出旧版 e-MMC/custom card `MT FC 2G A A M2 - xx ES` 结构。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac81e5b7e-6c40-4314-afc8-067c0034c12e/original/as/numemmc.pdf>
- Micron eMMC software / technical note 页面列出 e.MMC 5.1 TLC Pearl 相关 `MTFC64GBCAQTC` / `MTFC128GBCAQTC` / `MTFC256GBCAQTC` / `MTFC64GBCAQDQ` 型号。
  <https://sg.micron.com/sales-support/downloads/software-drivers/emmc-software>
- Micron e.MMC 5.1 automotive datasheet mirror 给出 `MTFC32GBCAQTC-AIT`、`MTFC128GBCAQTC-AAT`、`MTFC256GBCAQTC-AAT` 等 ordering information，并确认 component `BC`、controller `AQ`、package `TC` / `DQ`。
  <https://cdn.promelec.ru/upload/grab/datasheet.lcsc.com/lcsc/2601221102_micron-MTFC32GBCAQTC-AAT_C31550066.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/micron-managed-token.json`
  - `vendor.micron.managed.mtfc.nextgen.v1`
- `packages/decodepack/src/rules/packs/micron-emmc-token.json`
  - `vendor.micron.emmc.mtfc.legacy.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | 新版 eMMC Flash + Controller |
| `MTFC` + density + component(1) + controller(1) + package(2) + optional suffix | 旧版 eMMC/custom card |
| component `AA..AP` | 新版 eMMC NAND component 表，含 width / component density / generation |
| component `BC` | e.MMC 5.1 TLC Pearl，512Gb component |
| component `A..R` | 旧版 eMMC NAND component 表 |
| controller `AA..AN` / `A..Z` | controller revision 表 |
| package `AM/CN/DM/EA/TC/...` | package code |
| special option `0F/0M/1M/.../O1` | boot/enhanced area / firmware option |
| family key `component:controller` | `AC:AJ` -> eMMC 5.0，`BC:AQ` -> eMMC 5.1 TLC Pearl |

## 输出字段

- `nand_component`
- `controller_code`
- `package_code`
- `component_width`
- `component_density`
- `generation_info`
- `controller_revision`
- `product_version`
- `special_option`
- `operation_temperature`

## 测试样例

- `MTFC4GACAJCN-1M WT`
- `MTFC8GLTEA-WT`
- `MTFC128GBCAQTC-AIT`

## 注意

新版与旧版 `MTFC` 结构长度不同，规则需先按 token 位宽区分，再判断 family。
`BC:AQ:TC` / `BC:AQ:DQ` 进入 iTXTech fdnext DecodePack 的 reference metadata；用户可见输出只暴露 component、controller、package、产品线等 canonical 字段。
