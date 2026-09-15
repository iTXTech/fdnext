# BIWIN eMCP / uMCP / ePoP PN 编码

采集日期：2026-07-11；更新日期：2026-07-12

## 外部资料

- BIWIN eMCP LPDDR4X 页面给出 eMMC 5.1 + LPDDR4X、32GB+16Gb 到 128GB+64Gb、FBGA254、11.50 x 13.00 mm 和订购编码表。
  <https://www.biwintechnology.com/product/emcp-lpddr4x/>
- BIWIN eMCP LPDDR3 页面给出 eMMC 5.1 + LPDDR3、4GB+4Gb 到 16GB+16Gb、FBGA221、11.50 x 13.00 mm 和四项订购编码表。
  <https://www.biwintechnology.com/product/emcp-lpddr3/>
- BIWIN uMCP LPDDR4X 页面给出 UFS 2.2 + LPDDR4X、64GB+32Gb 到 512GB+64Gb、FBGA254、11.50 x 13.00 mm 和订购编码表。
  <https://www.biwintechnology.com/product/umcp-lpddr4x/>
- BIWIN uMCP5X 页面和规格表给出 UFS 3.1 + 64Gb LPDDR5X、128GB~512GB、SM2753、FBGA297、11.50 x 13.00 mm 和订购编码表。
  <https://www.biwintechnology.com/wp-content/uploads/2026/06/BIWIN-uMCP-UFS-3.1-LPDDR5X-Specifications-1.pdf>
- BIWIN ePoP4X 页面和规格表给出 eMMC 5.1 + LPDDR4X、32GB+16Gb 到 64GB+32Gb、FBGA144、8.00 x 9.50 mm / 8.60 x 10.40 mm 和四项订购编码表。
  <https://www.biwintechnology.com/product/epop4x-lpddr4x-emmc-5-1/>
- BIWIN ePoP3 与 201 球 ePoP5X 官方表分别给出 LPDDR3 / LPDDR5X 组合、FBGA136 / FBGA201 及完整订购编码矩阵。
  <https://www.biwintechnology.com/product/epop3-lpddr3-emmc-5-1/>
  <https://www.biwintechnology.com/product/epop5x-lpddr5x-emmc-5-1/>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/biwin-emcp-token.json`
- `packages/core/src/decodepack/rules/packs/biwin-epop-token.json`
- `vendor.biwin.emcp.v1`
- `vendor.biwin.emcp3.v1`
- `vendor.biwin.umcp.v1`
- `vendor.biwin.umcp5x.v1`
- `vendor.biwin.epop4x.v1`
- `vendor.biwin.epop3.v1`
- `vendor.biwin.epop5x.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWCA2` + 配置 + 容量 | BIWIN eMCP4X |
| `BWCE2` + 配置 + 容量 | BIWIN eMCP3 |
| `BW2A2` + 配置 + 容量 | BIWIN uMCP LPDDR4X |
| `BW3` + 5-字符配置 + 封装 `KG` + 容量 | BIWIN uMCP5X（UFS 3.1 + LPDDR5X）；`KG` 由官方三项订购编码一致确认 FBGA297 |
| `BWC` + 封装 + 代际 + DRAM/配置 + 容量 | BIWIN ePoP4X（eMMC 5.1 + LPDDR4X） |
| `BWCD2` + DRAM/配置 + 容量 | BIWIN ePoP3（eMMC 5.1 + LPDDR3） |
| `BWCSA` + DRAM/配置 + 容量 | BIWIN ePoP5X（eMMC 5.1 + LPDDR5X） |
| eMCP 配置 `EZA/KZC/KZA` | 官方订购编码表配置编码段 |
| uMCP 配置 `KZC02/LEI02/MZC02/MZCNY` | 官方订购编码表配置编码段 |
| 容量 `32G/64G/128G/256G/512G` | eMMC/UFS 存储容量，落库为 Mbit |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`eMCP4X` / `uMCP LPDDR4X` 这类组合由 `device.productType`、`storage_interface`、`storage_density` 和 `dram_type` 分别表达，不额外输出 `product_family`。订购编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `BWCA2KZC-64G`
- `BWCE2ENH-16G`
- `BW2A2MZC02-256G`
- `BW3A2EYAKG256G`
- `BWCK1KZC02-64G`
- `BWCD28NP-32G`
- `BWCSAFEJ02-64G`

## 注意

官方 eMCP 表中 `BWCA2KZA-128G` 同时覆盖 128GB+32Gb 和 128GB+64Gb，公开 PN 不能区分 DRAM 容量；规则只输出存储容量和 DRAM 类型，不输出不确定的 `dram_density`。

BIWIN uMCP 页面规格摘要区的容量行与 订购信息区存在文本不一致；规则以同页 订购信息中的容量/料号对应关系为准。
