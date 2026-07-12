# BIWIN eMCP / uMCP / ePoP PN 编码

采集日期：2026-07-11；更新日期：2026-07-12

## 外部资料

- BIWIN eMCP LPDDR4X 页面给出 eMMC 5.1 + LPDDR4X、32GB+16Gb 到 128GB+64Gb、FBGA254、11.50 x 13.00 mm 和 ordering table。
  <https://www.biwintechnology.com/product/emcp-lpddr4x/>
- BIWIN eMCP LPDDR3 页面给出 eMMC 5.1 + LPDDR3、4GB+4Gb 到 16GB+16Gb、FBGA221、11.50 x 13.00 mm 和四项 ordering table。
  <https://www.biwintechnology.com/product/emcp-lpddr3/>
- BIWIN uMCP LPDDR4X 页面给出 UFS 2.2 + LPDDR4X、64GB+32Gb 到 512GB+64Gb、FBGA254、11.50 x 13.00 mm 和 ordering table。
  <https://www.biwintechnology.com/product/umcp-lpddr4x/>
- BIWIN uMCP5X 页面和规格表给出 UFS 3.1 + 64Gb LPDDR5X、128GB~512GB、SM2753、FBGA297、11.50 x 13.00 mm 和 ordering table。
  <https://www.biwintechnology.com/wp-content/uploads/2026/06/BIWIN-uMCP-UFS-3.1-LPDDR5X-Specifications-1.pdf>
- BIWIN ePoP4X 页面和规格表给出 eMMC 5.1 + LPDDR4X、32GB+16Gb 到 64GB+32Gb、FBGA144、8.00 x 9.50 mm / 8.60 x 10.40 mm 和四项 ordering table。
  <https://www.biwintechnology.com/product/epop4x-lpddr4x-emmc-5-1/>
- BIWIN ePoP3 与 201-ball ePoP5X 官方表分别给出 LPDDR3 / LPDDR5X 组合、FBGA136 / FBGA201 及完整 ordering matrix。
  <https://www.biwintechnology.com/product/epop3-lpddr3-emmc-5-1/>
  <https://www.biwintechnology.com/product/epop5x-lpddr5x-emmc-5-1/>

## 规则状态

iTXTech fdnext DecodePack:

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
| `BWCA2` + config + density | BIWIN eMCP4X |
| `BWCE2` + config + density | BIWIN eMCP3 |
| `BW2A2` + config + density | BIWIN uMCP LPDDR4X |
| `BW3` + 5-character config + package `KG` + density | BIWIN uMCP5X（UFS 3.1 + LPDDR5X）；`KG` 由官方三项 ordering 一致确认 FBGA297 |
| `BWC` + package + generation + DRAM/config + density | BIWIN ePoP4X（eMMC 5.1 + LPDDR4X） |
| `BWCD2` + DRAM/config + density | BIWIN ePoP3（eMMC 5.1 + LPDDR3） |
| `BWCSA` + DRAM/config + density | BIWIN ePoP5X（eMMC 5.1 + LPDDR5X） |
| eMCP config `EZA/KZC/KZA` | 官方 ordering table config token |
| uMCP config `KZC02/LEI02/MZC02/MZCNY` | 官方 ordering table config token |
| density `32G/64G/128G/256G/512G` | eMMC/UFS storage 容量，落库为 Mbit |

## 输出字段

- `storage_density`
- `storage_interface`
- `dram_density`
- `dram_type`
- `operation_temperature`

`eMCP4X` / `uMCP LPDDR4X` 这类组合由 `device.productType`、`storage_interface`、`storage_density` 和 `dram_type` 分别表达，不额外输出 `product_family`。`package_code` 等 ordering token 只用于内部解析，不进入公开字段。

## 测试样例

- `BWCA2KZC-64G`
- `BWCE2ENH-16G`
- `BW2A2MZC02-256G`
- `BW3A2EYAKG256G`
- `BWCK1KZC02-64G`
- `BWCD28NP-32G`
- `BWCSAFEJ02-64G`

## 注意

官方 eMCP 表中 `BWCA2KZA-128G` 同时覆盖 128GB+32Gb 和 128GB+64Gb，公开 PN 不能区分 DRAM 容量；规则只输出 storage 容量和 DRAM 类型，不输出不确定的 `dram_density`。

BIWIN uMCP 页面规格摘要区的容量行与 Order Information 区存在文本不一致；规则以同页 Order Information 中的 capacity/part-number 对应关系为准。
