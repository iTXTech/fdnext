# SK hynix eMCP / uMCP PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix MCP / eMCP / uMCP 料号的公开资料、规则库抽象和 testcase 覆盖点。实现禁止按完整 PN 白名单匹配，应按结构切 token，再用规则库解释已知 token；未知 density/config token 不阻断 vendor/type 的识别。

## 来源

- SK hynix MCP brochure / catalog mirror 说明 MCP 将 UFS NAND 与 LPDDR DRAM 堆叠到单一封装，用于移动设备，并列出 NAND mode/density、DRAM mode/density、package type 等产品维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/mcp/34497-1045442.html>
- 本地 `H9TQ27ADFTMCUR_Rev0.1.pdf` 给出 `32GB eMMC (x8) / LPDDR3 24Gb(x32)`、eMMC 5.1、LPDDR3-1866、221-ball FBGA，以及 `H 9 T Q 2 7 A D F T M C U R - K U M` 的逐 token 标注。H9TQ legacy 规则优先按该 ordering table 拆解 density、NVM voltage、DRAM density/stack/CS、generation、package、material、eMMC speed、DRAM speed 与 temperature。
- `H9TQ17ABJTMCUR-KUM` CI-MCP datasheet mirror 给出 `16GB eNAND (x8) / LPDDR3 16Gb(x32)`、eMMC 5.0、221-ball FBGA，以及 `H 9 T Q 1 7 ... - K * M` 的字段标注。
  <https://datasheet4u.com/pdf/1055141/H9TQ17ABJTMCUR-KUM.pdf>
- `H9TP32A4GDBCPR-KGM` CI-MCP datasheet mirror 给出 `4GB eNAND (x8) / LPDDR2-S4B 4Gb(x32)`、eMMC 4.41、162-ball FBGA，以及 `H 9 T P 3 2 ... - K G M` 的字段标注。
  <https://datasheet4u.com/pdf-down/H/9/T/H9TP32A4GDBCPR-HynixSemiconductor.pdf>
- 本地 `H9HP27ADAMADAR_Rev1.0.pdf` 给出 `32GB eMMC (x8) / LPDDR4X 24Gb(x16, 2CH/2CS)`、eMMC 5.1、LPDDR4X-3733、254-ball FBGA，以及 `H 9 H P 2 7 A D A M A D A R - K M M` 的字段标注。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9HP27ADAMADAR_Rev1.0.pdf>
- 本地 `H9HP52ACPMADAR_Rev1.0.pdf` 给出 `64GB eMMC (x8) / LPDDR4X 32Gb(x16, 2CH/2CS)`、eMMC 5.1、LPDDR4X-3733、254-ball FBGA，以及 `H 9 H P 5 2 A C P M A D A R - K M M` 的字段标注。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9HP52ACPMADAR_Rev1.0.pdf>
- 本地 `H9AG9G5ANBX100_Rev0.2.pdf` 给出 `H9A` = LPDDR4 eMCP，`G9G5` = 64GB eMMC + 32Gb / 4GB LPDDR4X，`N` = DDR 4266/CL32 + 52MHz，`B` = MMC 5.0，`100` = PKG option，254-ball FBGA。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9AG9G5ANBX100_Rev0.2.pdf>
- 本地 `H9QT0GECN6X145_Rev0.1.pdf` 给出 `H9Q` = LPDDR4 uMCP，`T0GE` = 128GB UFS + 48Gb / 6GB LPDDR4X，`C` = 4th generation，`N` = DDR 4266，`6` = UFS 2.2，`X` reserved，`145` = PKG option，254-ball FBGA，Lead & Halogen Free，operation temperature -25°C ~ 85°C。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/H9QT0GECN6X145_Rev0.1.pdf>
- `H9HQ15ACPMADAR-KEM` 分销页标注 type `uMCP`、sub-type `UFS+LPDDR4x`、package `254ball_UFS+LPD4x`、density `128+32`。
  <https://www.preduo.com/product/umcp/ufs-lpddr4x/254ball_ufs-lpd4x/h9hq15acpmadar-kem>

## 规则入口

- 规则文件：
  - `packages/core/src/decodepack/rules/packs/skhynix-emcp-token.json`
  - `packages/core/src/decodepack/rules/packs/skhynix-umcp-token.json`
- 规则 ID：
  - `vendor.skhynix.emcp.h9hp-lpddr4x.v1`
  - `vendor.skhynix.emcp.h9t_h9h.v1`
  - `vendor.skhynix.emcp.h9a.v1`
  - `vendor.skhynix.umcp.h9q.v1`
  - `vendor.skhynix.umcp.h9hq.v1`
- testcase：`packages/core/test/decodepack/part-number/skhynix.test.ts`

## H9HP LPDDR4X eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9HP` + density(2) + NVM voltage(1) + DRAM density(1) + DRAM option(1) + generation(1) + package type(1) + material(1) + eMMC speed(1) + DRAM speed(1) + optional temp tail | SK hynix eMMC + LPDDR4X eMCP |
| density `27` | 32GB eMMC + 24Gb LPDDR4X |
| density `52` | 64GB eMMC + 32Gb LPDDR4X |
| NVM voltage `A` | eMMC/NVM 3.3V x8 |
| DRAM density `D/C` | 24Gb / 32Gb LPDDR4X |
| DRAM option `A/P` | LPDDR4X x16, 1.1V/0.6V I/O option；DRAM type / width 从该 token 输出，不从 `H9HP` 前缀或 density 推断 |
| generation `M` | 2nd generation |
| package type `A` | 254Ball FBGA 11.5x13 |
| package material `D` | Lead & Halogen Free |
| eMMC speed `A` | 400MHz |
| DRAM speed `R` | LPDDR4X-3733 |
| tail `KMM` | Mobile -25~85°C |

## H9T / H9H legacy eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9TP/H9TQ/H9HC` + density(2) + NVM voltage(1) + DRAM density(2) + DRAM option(1) + generation(1) + package type(2) + material(1) + eMMC speed(1) + DRAM speed(1) + temp(1) | SK hynix CI-MCP / eMCP |
| `H9TP` | CI-MCP NAND DDR2, e-NAND + LPDDR2 |
| `H9TQ` | CI-MCP NAND DDR3, e-NAND + LPDDR3 |
| `H9HC` | eMCP family，公开资料不足时只输出结构字段 |
| density `32` | 4GB e-NAND + 4Gb LPDDR2 |
| density `64` | 8GB eMMC + 8Gb LPDDR3 |
| density `17` | 16GB e-NAND + 16Gb LPDDR3 |
| density `27` | 32GB eMMC + 24Gb LPDDR3 |
| density `52` | 64GB eMMC + 32Gb LPDDR4X |
| NVM voltage `A` | eMMC/NVM 3.3V x8 |
| DRAM density `4G/8G/BJ/DF` | 4Gb SDP / 8Gb SDP / 16Gb 1ch 2CS / 24Gb 1ch 2CS |
| DRAM option `D/T` | LPDDR2 x32 / LPDDR3 x32 |
| generation `M/A/B` | 1st / 2nd / 3rd generation eMCP |
| package type `CP/CU` | FBGA 162 Ball 11.5x13 / FBGA 221 Ball 11.5x13 |
| package material `R` | Lead & Halogen Free |
| speed tail | eMMC speed uses product-family + density + token combination; DRAM speed `G/T/U` = LPDDR2-1066 / LPDDR3-1600 / LPDDR3-1866 |
| temp `M` | Standard -25~85°C |

## H9A eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9A` + density(4) + generation + speed + interface + reserved + serial(3) | SK hynix LPDDR4 eMCP |
| density `G9G5` | 64GB eMMC + 4GB LPDDR4X |
| DRAM organization for `G9G5` | LPDDR4X x16 |
| generation `A` | 2nd generation eMCP |
| speed `N` | LPDDR4X-4266 CL32 / eMMC 52MHz |
| interface `B` | eMMC 5.0 |
| serial `100` | 254Ball FBGA, Lead & Halogen Free |

## H9Q / H9HQ uMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9Q` + density(4) + generation + speed + interface + reserved + serial(3) | SK hynix LPDDR4 uMCP |
| density `T0GE` | 128GB UFS + 48Gb / 6GB LPDDR4X |
| DRAM organization for `T0GE` | LPDDR4X x8 |
| generation `C` | 4th generation uMCP |
| speed `N` | LPDDR4X-4266 |
| interface `6` | UFS 2.2 |
| reserved `X` | 内部 reserved token，不作为公开 code 字段输出 |
| serial `145` | PKG option token：254Ball FBGA, Lead & Halogen Free, -25~85°C |
| operation voltage | UFS 3.3V；LPDDR4X VDD1/VDD2/VDDQ 1.8V/1.1V/0.6V |
| `H9HQ` + density(2) + config tail | SK hynix UFS + LPDDR4X uMCP |
| density `15` | 128GB UFS + 32Gb LPDDR4X |

## 示例

| PN | 解析重点 |
| --- | --- |
| `H9TQ17ABJTMCUR-KUM` | eMCP, 16GB e-NAND + 16Gb LPDDR3, eMMC 5.0, 221Ball FBGA |
| `H9TQ27ADFTMCUR-KUM` | eMCP, 32GB eMMC + 24Gb LPDDR3, eMMC 5.1, LPDDR3-1866, 221Ball FBGA |
| `H9TQ64A8GTACUR-KUM` | eMCP, 8GB eMMC + 8Gb LPDDR3, eMMC 5.1, LPDDR3-1866, 221Ball FBGA |
| `H9TP32A4GDBCPR-KGM` | eMCP, 4GB e-NAND + 4Gb LPDDR2, eMMC 4.41, 162Ball FBGA |
| `H9HP27ADAMADAR-KMM` | eMCP, 32GB eMMC + 24Gb LPDDR4X, eMMC 5.1, 254Ball FBGA |
| `H9HP52ACPMADAR-KMM` | eMCP, 64GB eMMC + 32Gb LPDDR4X, eMMC 5.1, 254Ball FBGA |
| `H9AG9G5ANBX100` | eMCP, 64GB eMMC + 4GB LPDDR4X x16, eMMC 5.0 |
| `H9QT0GECN6X145` | uMCP, 128GB UFS + 48Gb / 6GB LPDDR4X x8, UFS 2.2, LPDDR4X-4266, 254Ball FBGA |
| `H9HQ15ACPMADAR-KEM` | uMCP, 128GB UFS + 32Gb LPDDR4X |

## 已知缺口

- H9HP / H9A / H9Q 已按 datasheet 拆成 token 表：density 只负责组合容量，DRAM width / type、package、temperature 等由各自 token 表命中后输出。
- H9T/H9H legacy 规则已覆盖本地 H9TQ27 datasheet 与已知 H9TQ17、H9TQ64、H9TP32 样本；eMMC speed 用组合 key 处理，避免把相同 speed token 在不同 legacy 子族里误解成同一频率。
- H9HC、H9HQ 子族公开资料较分散，目前只对已验证 density code 做表驱动解析。
- H9Q 新 uMCP 与 HN8/H28S 纯 UFS 不是同一类产品，不能并入 UFS parser。
