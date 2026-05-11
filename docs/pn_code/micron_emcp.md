# Micron MCP / eMCP PN 编码资料

采集日期：2026-05-11

本文档记录 Micron 老式 `MT29C...` 与 `MT29RZ...` MCP / PoP 组合封装规则。它们不是 raw NAND，也不是 `MTFC` eMMC / UFS；应作为 composite managed NAND 输出 `device.productType = emcp`，并用 storage / DRAM 字段表达子组件。

## 来源

- Micron 168-Ball NAND Flash and LPDRAM PoP MCP datasheet mirror 给出 `MT29C2G24MAKLAJG-6 IT` 等 production part number，确认产品为 NAND Flash + LPDRAM PoP MCP，并列出 NAND product、LPDDR product 与 physical marking。
  <https://datasheet.octopart.com/MT29C2G24MAKLAJG-6-IT-Micron-datasheet-8368047.pdf>
- DigiKey `MT29C4G96MAZAPCJA-5 IT` 页面确认 Technology 为 `FLASH - NAND, Mobile LPDRAM`，Memory Size 为 `4Gbit (NAND), 4Gbit (LPDRAM)`，package 为 `137-TFBGA (10.5x13)`。
  <https://www.digikey.at/en/products/detail/micron-technology-inc/MT29C4G96MAZAPCJA-5-IT/2810752>
- 公开分销规格行可交叉确认 `MT29C1G12...`、`MT29C2G48...`、`MT29C4G48...` 等 legacy MCP / PoP 组合，覆盖 1Gb NAND + 512Mb/1Gb LPDRAM、2Gb NAND + 1Gb LPDRAM、4Gb NAND + 2Gb LPDRAM 变体。此类资料按 `external_table_confirmed` 使用，只把容量、宽度、封装等稳定字段落入规则。
- Micron obsolete part detail 页面保留 `MT29RZ4C4DZZMGMF-18W.80C` 入口；分销规格页同向确认其 Technology 为 `FLASH - NAND, DRAM - LPDDR2`，Memory Size 为 `4Gb NAND + 4Gb LPDDR2`，package 为 `168-VFBGA (12x12)`。
  <https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog/part-detail/mt29rz4c4dzzmgmf-18w.80c>

## 规则入口

- 规则文件：`packages/dsl/src/rules/packs/micron-emcp-token.json`
- 规则 ID：
  - `vendor.micron.emcp.mt29c.v1`
  - `vendor.micron.emcp.mt29rz.v1`
- testcase：`packages/dsl/test/managed-nand.test.ts`

## MT29C NAND + LPDRAM MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29C` + NAND density + LPDRAM density + config/package + optional speed/temp/status | Micron NAND + LPDRAM MCP |
| NAND density `1G/2G/4G` | NAND storage density |
| LPDRAM family `12M/24M/48M/96M` | LPDRAM family token；实际容量需要结合 config code |
| package tail `AKC/AKD/AKS/AHK/AMD/AMK/AMR/CJA/CMJ/JG/JI/HP/JA/JC/AKQ` | package code / package family |
| speed `5/6/48` | 200MHz / 166MHz / 208MHz |
| temp suffix `IT` | Industrial temperature |

当前规则只解释已由公开资料确认或可稳定推断的容量、DRAM 类型、package、温区和 config code。中间 config token 不拆成公开语义字段。

MT29C 的 LPDRAM 容量不能只看 `12M/48M/96M` 单 token；规则使用 `NAND density:LPDRAM family:config code` 组合键。当前进入规则的组合包括：

| 组合键 | 解析 |
| --- | --- |
| `1G:12M:AADV` / `1G:12M:AACAE` / `1G:12M:AACAF` / `1G:12M:AAJAF` / `1G:12M:AAJV` | 1Gb NAND + 512Mb LPDRAM |
| `1G:12M:AADAE` / `1G:12M:AADAF` | 1Gb NAND + 1Gb LPDRAM |
| `2G:24M:AKLA` / `2G:48M:AKLC` | 2Gb NAND + 1Gb LPDRAM |
| `4G:48M:AZAM` / `4G:48M:AZAP` / `4G:48M:AZBB` | 4Gb NAND + 2Gb LPDRAM x16 |
| `4G:48M:AYBB` | 4Gb NAND + 2Gb LPDRAM x32 |
| `4G:96M:AZAP` | 4Gb NAND + 4Gb LPDRAM x32 |

## MT29RZ NAND + LPDDR2 MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29RZ` + storage code + DRAM code + config + package + revision + optional speed/temp | Micron NAND + LPDDR2 MCP |
| storage code `4C` | 4Gb NAND |
| DRAM code `4D` | 4Gb LPDDR2 x32 |
| package code `MG` | 168-VFBGA 12x12 |
| speed `18W` | LPDDR2-533 / 533MHz |
| temp `80C/80U` | -25°C ~ 85°C |

## Raw NAND 边界

Micron raw NAND 规则只覆盖 `MT29E...` / `MT29F...`，其中 `MT29FB...` 是 On-die ECC NAND，复用 `MT29F` raw NAND token 结构并额外输出 `ecc_enabled`。`MT29C...` 和 `MT29RZ...` 不应再进入 raw NAND parser。

## 示例

| PN | 解析重点 |
| --- | --- |
| `MT29C1G12MAADVAKC-5 IT` | eMCP, 1Gb NAND + 512Mb Mobile LPDRAM, 107-TFBGA |
| `MT29C1G12MAADAEAKC-5 IT` | eMCP, 1Gb NAND + 1Gb Mobile LPDRAM, 107-TFBGA |
| `MT29C2G48MAKLCJI-6 IT` | eMCP, 2Gb NAND + 1Gb Mobile LPDRAM, 168-ball VFBGA |
| `MT29C4G48MAZBBAKS-48 IT` | eMCP, 4Gb NAND + 2Gb Mobile LPDRAM x16, 137-VFBGA |
| `MT29C4G48MAYBBAHK-48 IT` | eMCP, 4Gb NAND + 2Gb Mobile LPDRAM x32, 137-VFBGA |
| `MT29C4G96MAZAPCJA-5 IT` | eMCP, 4Gb NAND + 4Gb Mobile LPDRAM, 137-TFBGA |
| `MT29C2G24MAKLAJG-6 IT` | eMCP, 2Gb NAND + 1Gb Mobile LPDRAM, 168-ball VFBGA |
| `MT29RZ4C4DZZMGMF-18W.80C` | eMCP, 4Gb NAND + 4Gb LPDDR2, 168-VFBGA 12x12, LPDDR2-533 |
