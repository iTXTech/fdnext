# Longsys eMCP / uMCP PN 编码

采集日期：2026-05-08

## 外部资料

- Longsys 新闻说明 FORESEE MCP 组合 eMMC/UFS 与 LPDDR3/4x，覆盖 eMCP 与 uMCP。
  <https://www.longsys.com/about-longsys/news/longsys-foresee-emcp-umcp-empowering-smart-mobile-terminals.html>
- FORESEE Embedded Storage Product Catalogue 2023 给出 eMCP/uMCP ordering table。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/longsys-emcp-token.json`
- `vendor.longsys.foresee.emcp.v1`
- `vendor.longsys.foresee.umcp.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEP` + density pair + config | FORESEE eMCP |
| `FUP` + density pair + config | FORESEE uMCP |
| `NA1608/NA3208` | eMMC + LPDDR3 |
| `RF6432/RB6432/RFA832` | eMMC + LPDDR4X |
| `RB6432/RFA832` under `FUP` | UFS + LPDDR4X |

## 输出字段

- `storage_density`
- `storage_interface`
- `dram_density`
- `dram_type`
- `product_family`
- `nand_technology`
- `operation_temperature`

`package_code` 等 ordering token 只用于内部解析，不进入公开字段。

## 测试样例

- `FEPRF6432-58A1930`
- `FUPRFA832-C2A56N1`
