# Longsys eMCP / uMCP PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Longsys 新闻说明 FORESEE MCP 组合 eMMC/UFS 与 LPDDR3/4x，覆盖 eMCP 与 uMCP。
  <https://www.longsys.com/about-longsys/news/longsys-foresee-emcp-umcp-empowering-smart-mobile-terminals.html>
- FORESEE Embedded Storage Product Catalogue 2023 给出 eMCP/uMCP 订购编码表。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>

2023 官方目录的受管理 MCP 产品系列共 8 项，包括 `FEPNA1608/NA3208/RF6432/RB6432/RFA832` eMCP 与 `FUPRB6432/RFA832` uMCP；资源已补齐该官方矩阵。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/longsys-emcp-token.json`
- `vendor.longsys.foresee.emcp.v1`
- `vendor.longsys.foresee.umcp.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEP` + 容量配对 + 配置 | FORESEE eMCP |
| `FUP` + 容量配对 + 配置 | FORESEE uMCP |
| `NA1608/NA3208` | eMMC + LPDDR3 |
| `RF6432/RB6432/RFA832` | eMMC + LPDDR4X |
| `FUP` 下的 `RB6432/RFA832` | UFS + LPDDR4X |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`eMCP3/eMCP4x/uMCP4x` 这类组合由 `device.productType`、`storage_interface`、`storage_density` 和 `dram_type` 分别表达，不额外输出 `product_family`。订购编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `FEPRF6432-58A1930`
- `FUPRFA832-C2A56N1`
