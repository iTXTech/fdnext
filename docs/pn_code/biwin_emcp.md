# BIWIN eMCP / uMCP PN 编码

采集日期：2026-05-08

## 外部资料

- BIWIN eMCP LPDDR4X 页面给出 eMMC 5.1 + LPDDR4X、32GB+16Gb 到 128GB+64Gb、FBGA254、11.50 x 13.00 mm 和 ordering table。
  <https://www.biwintechnology.com/product/emcp-lpddr4x/>
- BIWIN uMCP LPDDR4X 页面给出 UFS 2.2 + LPDDR4X、64GB+32Gb 到 512GB+64Gb、FBGA254、11.50 x 13.00 mm 和 ordering table。
  <https://www.biwintechnology.com/product/umcp-lpddr4x/>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/biwin-emcp-token.json`
- `vendor.biwin.emcp.v1`
- `vendor.biwin.umcp.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWCA2` + config + density | BIWIN eMCP4X |
| `BW2A2` + config + density | BIWIN uMCP LPDDR4X |
| eMCP config `EZA/KZC/KZA` | 官方 ordering table config token |
| uMCP config `KZC02/LEI02/MZC02/MZCNY` | 官方 ordering table config token |
| density `32G/64G/128G/256G/512G` | eMMC/UFS storage 容量，落库为 Mbit |

## 输出字段

- `storage_density`
- `storage_interface`
- `dram_density`
- `dram_type`
- `product_family`
- `package_code`
- `operation_temperature`

## 测试样例

- `BWCA2KZC-64G`
- `BW2A2MZC02-256G`

## 注意

官方 eMCP 表中 `BWCA2KZA-128G` 同时覆盖 128GB+32Gb 和 128GB+64Gb，公开 PN 不能区分 DRAM 容量；规则只输出 storage 容量和 DRAM 类型，不输出不确定的 `dram_density`。

BIWIN uMCP 页面规格摘要区的容量行与 Order Information 区存在文本不一致；规则以同页 Order Information 中的 capacity/part-number 对应关系为准。
