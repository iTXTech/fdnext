# Micron MCP / eMCP PN 编码资料

采集日期：2026-05-11

本文档记录 Micron 老式 `MT29C...` 与 `MT29RZ...` MCP / PoP 组合封装规则。它们不是 raw NAND，也不是 `MTFC` eMMC / UFS；应作为 composite managed NAND 输出 `device.productType = emcp`，并用 storage / DRAM 字段表达子组件。

## 来源

- Micron 168-Ball NAND Flash and LPDRAM PoP MCP datasheet mirror 给出 `MT29C2G24MAKLAJG-6 IT` 等 production part number，确认产品为 NAND Flash + LPDRAM PoP MCP，并列出 NAND product、LPDDR product 与 physical marking。
  <https://datasheet.octopart.com/MT29C2G24MAKLAJG-6-IT-Micron-datasheet-8368047.pdf>
- DigiKey `MT29C4G96MAZAPCJA-5 IT` 页面确认 Technology 为 `FLASH - NAND, Mobile LPDRAM`，Memory Size 为 `4Gbit (NAND), 4Gbit (LPDRAM)`，package 为 `137-TFBGA (10.5x13)`。
  <https://www.digikey.at/en/products/detail/micron-technology-inc/MT29C4G96MAZAPCJA-5-IT/2810752>
- 公开分销规格行可交叉确认 `MT29C1G12...`、`MT29C2G48...`、`MT29C4G48...` 等 legacy MCP / PoP 组合，覆盖 1Gb NAND + 512Mb/1Gb LPDRAM、2Gb NAND + 1Gb LPDRAM、4Gb NAND + 2Gb LPDRAM 变体。此类资料按 `external_table_confirmed` 使用，只把容量、宽度、封装等稳定字段落入规则。
- Elnec `MT29C8G48MAPLDJA [TFBGA137]` 设备页给出 MT29C 通用 PN 结构：`29C = NAND flash + LPDRAM MCP/PoP`，NAND density 覆盖 `DM/EM/FM/1G/2G/4G/8G/AG/BG/CG/DG`，LPDRAM density 覆盖 `56M/12M/40M/24M/52M/48M/72M/96M/92M`，并列出 package、speed、temperature 和 production status token。
  <https://www.elnec.com/en/device/Micron/MT29C8G48MAPLDJA%20%5BTFBGA137%5D/>
- Micron FBGA code list包含 `MT29C8G48MAPLDJA-75 ITES` / `MT29C8G48MAPLDJA-75 IT`，对应 FBGA code `JY332` / `JW332`。
  <https://static6.arrow.com/aropdfconversion/3586d2f02ff8bdf3c705c1963408382dfa8a3528/fbga-microntechnologyinc..pdf>
- Micron obsolete part detail 页面保留 `MT29RZ4C4DZZMGMF-18W.80C` 入口；分销规格页同向确认其 Technology 为 `FLASH - NAND, DRAM - LPDDR2`，Memory Size 为 `4Gb NAND + 4Gb LPDDR2`，package 为 `168-VFBGA (12x12)`。
  <https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog/part-detail/mt29rz4c4dzzmgmf-18w.80c>
- 分销规格页同向确认 `MT29RZ1CVCZZHGTN-18 W.85H` 为 1Gbit NAND + 512Mbit LPDDR2、121-VFBGA (8x7.5)，`MT29RZ4C8DZZMHAN-18W.80D` 为 4Gbit NAND + 4Gbit LPDDR2。

## 规则入口

- 规则文件：`packages/decodepack/src/rules/packs/micron-emcp-token.json`
- 规则 ID：
  - `vendor.micron.emcp.mt29c.v1`
  - `vendor.micron.emcp.mt29rz.v1`
- testcase：`packages/decodepack/test/managed-nand.test.ts`

## MT29C NAND + LPDRAM MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29C` + NAND density + LPDRAM density + config/package + optional speed/temp/status | Micron NAND + LPDRAM MCP |
| NAND density `DM/EM/FM/1G/2G/4G/8G/AG/BG/CG/DG` | 128Mb ~ 128Gb NAND storage density；`AG/BG` 对应 16Gb / 32Gb |
| LPDRAM family `56M/12M/40M/24M/52M/48M/72M/96M/92M` | LPDRAM family token；规则先按通用表给出容量，再用确认组合覆盖例外 |
| package tail `JA/JG/JI/KC/KD/KQ/KS/MD/MK/PL/SK/...` | package code / package family |
| speed `5/54/6/75/8/10/48` | 200MHz / 185MHz / 166MHz / 133MHz / 125MHz / 100MHz / 208MHz |
| temp suffix `IT/W` | Industrial / Wireless temperature |
| status suffix `ES/MS/QS/DC` | sample / qualification / daisy-chain status |

当前规则会宽匹配 `MT29C...`，避免 legacy MCP/PoP 被 Micron `MT` vendor fallback 误标为 raw NAND；中间 config token 只保留为内部解析线索，不拆成未确认的公开语义字段。

MT29C 的 LPDRAM 容量以公开 PN 表的 LPDRAM density token 为默认值；遇到 datasheet / 分销规格明确不同的组合时，规则使用 `NAND density:LPDRAM family:config code` 组合键覆盖。当前覆盖组合包括：

| 组合键 | 解析 |
| --- | --- |
| `1G:12M:AADV` / `1G:12M:AACAE` / `1G:12M:AACAF` / `1G:12M:AAJAF` / `1G:12M:AAJV` | 1Gb NAND + 512Mb LPDRAM |
| `1G:12M:AADAE` / `1G:12M:AADAF` | 1Gb NAND + 1Gb LPDRAM |
| `2G:24M:AKLA` / `2G:48M:AKLC` | 2Gb NAND + 1Gb LPDRAM |
| `4G:48M:AZAM` / `4G:48M:AZAP` / `4G:48M:AZBB` | 4Gb NAND + 2Gb LPDRAM x16 |
| `4G:48M:AYBB` | 4Gb NAND + 2Gb LPDRAM x32 |
| `4G:96M:AZAP` | 4Gb NAND + 4Gb LPDRAM x32 |
| `8G:48M:APLD` / `8G:48M:AZAPB` | 8Gb NAND + 2Gb LPDRAM x32 |

## MT29RZ NAND + LPDDR2 MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29RZ` + storage code + DRAM code + config + package + revision + optional speed/temp | Micron NAND + LPDDR2 MCP |
| storage code `4C` | 4Gb NAND |
| DRAM code `4D` | 4Gb LPDDR2 x32 |
| package code `MG` | 内部映射到 168-VFBGA 12x12 |
| package code `HG` | 内部映射到 121-VFBGA 8x7.5 |
| speed `18W` | LPDDR2-533 / 533MHz |
| temp `80C/80D/80U/80Y/85H` | -25°C ~ 85°C |

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
| `MT29C8G48MAPLDJA-75ITES` | eMCP, 8Gb NAND + 2Gb Mobile LPDRAM x32, 137-ball TFBGA, Engineering Sample |
| `MT29C4G96MAZAPCJA-5 IT` | eMCP, 4Gb NAND + 4Gb Mobile LPDRAM, 137-TFBGA |
| `MT29C2G24MAKLAJG-6 IT` | eMCP, 2Gb NAND + 1Gb Mobile LPDRAM, 168-ball VFBGA |
| `MT29RZ4C4DZZMGMF-18W.80C` | eMCP, 4Gb NAND + 4Gb LPDDR2, 168-VFBGA 12x12, LPDDR2-533 |
| `MT29RZ1CVCZZHGTN-18 W.85H` | eMCP, 1Gb NAND + 512Mb LPDDR2, 121-VFBGA, LPDDR2-533 |
