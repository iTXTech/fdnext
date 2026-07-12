# Micron MCP / eMCP / uMCP PN 编码资料

采集日期：2026-07-12

本文档记录 Micron NAND MCP、AiO legacy MCP/eMCP 与 UFS uMCP 组合封装规则。它们不是 raw NAND，也不是单独的 `MTFC` eMMC / UFS；应作为 composite managed NAND 输出，并用 storage / DRAM 字段表达子组件。`nummcp.pdf` 中的 NOR MCP 页面本轮按需求忽略，不进入规则和测试。

## 来源

- Micron 官方 `NOR MCP, NAND MCP, PoP and AiO Part Numbering Systems` PDF (`nummcp.pdf`) 给出 NAND MCP、MCP/PoP/AiO、AiO legacy 的结构表，确认 product family、NAND/LPDRAM density/width、voltage、package configuration、package、`-` 后 speed / temperature / production status / special option / die revision 后缀。本文只使用 NAND MCP、MCP/PoP/AiO、AiO 页面，忽略 NOR。
- 用户补充的 Micron locked datasheet catalog rows 确认 `MT29VZZZ...` 254-ball uMCP UFS + LPDDR4X 与 `MT30AZZZ...` 297-ball uMCP UFS + LPDDR5 的实际 PN、storage density、controller、DRAM density、package configuration、speed/temp/die revision 后缀。
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) Table 1 给出 `MT29V` / `MT30A` uMCP 已知 PN、NAND die 组成、DRAM 颗粒组成、package code 和 Health Report 适用范围。
- Micron 官方 UFS-based MCP live catalog JSON 的 14 条记录用于全量回归，补齐 `023 = LPDDR5-8533`，使 `MT30AZZZCDA4TKXL-023 W.273` / `MT30AZZZDDA4TOXM-023 W.274` 不再回退为 NAND；同一 catalog 直接确认 `SL/PR/SM` 的 254-ball package 与 `EQ/QS/WL/XL/XM` 的 297-ball package 类型和尺寸。<https://www.micron.com/content/micron/us/en/products/storage/managed-nand/universal-flash-storage/part-catalog/_jcr_content.products.json/getpartcatalog/multichip-packages/ufs-based-mcp/-/en_US>
- 2026-07-12 复查 Micron 官方 eMMC-based MCP live catalog 的 15 条记录。`MT29GZ9A9BPMET...` 与 `MT29GZ6A9BPGET...` 的组合容量确认 density token `9 = 16Gb`；同一 catalog 确认 `ET = VFBGA-149, 8x9.5x1.0` 及 `AUT = -40°C ~ 125°C`。排除已有有效 MDB 覆盖后，5 条结构化 decoder 可完整解析的 `MT29GZ...` PN 进入搜索资源；唯一 compact `MT29V5D7GVESL-046I.216` 因公开 ordering token 不足继续排除，不为单一料号扩大 match。<https://www.micron.com/products/multichip-packages/emmc-based-mcp/part-catalog>
- 同轮复查 UFS-based MCP 14 条记录后，仅 `MT30AZZZDDA0TPQS-031 WL.19Q` 尚无有效 MDB / 搜索资源覆盖；它已由既有 `MT30A` uMCP token 规则完整解析并进入搜索资源。
- 同轮继续全量复查 Micron 官方 current / obsolete NAND-based MCP catalog 的 96 条记录。其中 89 条 `MT29A/C/GZ/RZ/UZ...` NAND MCP / AiO PN 均由结构化规则识别，且 exact PN 已由有效 MDB 或现有搜索资源覆盖，不重复入库。catalog 进一步确认 AiO package token `PB/PL/SK/SP/TB` 与 MT29C package token `KB` 的类型、球数和尺寸；规则仅补这些局部 token 映射，不加入完整 PN 查表。<https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog>
- Micron 168-Ball NAND Flash and LPDRAM PoP MCP datasheet mirror 给出 `MT29C2G24MAKLAJG-6 IT` 等 production part number，确认产品为 NAND Flash + LPDRAM PoP MCP，并列出 NAND product、LPDDR product 与 physical marking。
  <https://datasheet.octopart.com/MT29C2G24MAKLAJG-6-IT-Micron-datasheet-8368047.pdf>
- DigiKey `MT29C4G96MAZAPCJA-5 IT` 页面确认 Technology 为 `FLASH - NAND, Mobile LPDRAM`，Memory Size 为 `4Gbit (NAND), 4Gbit (LPDRAM)`，package 为 `137-TFBGA (10.5x13)`。
  <https://www.digikey.at/en/products/detail/micron-technology-inc/MT29C4G96MAZAPCJA-5-IT/2810752>
- Elnec `MT29C8G48MAPLDJA [TFBGA137]` 设备页给出 MT29C 通用 PN 结构：`29C = NAND flash + LPDRAM MCP/PoP`，并列出 package、speed、temperature 和 production status token。
  <https://www.elnec.com/en/device/Micron/MT29C8G48MAPLDJA%20%5BTFBGA137%5D/>
- Micron obsolete part detail 页面保留 `MT29RZ4C4DZZMGMF-18W.80C` 入口；分销规格页同向确认其 Technology 为 `FLASH - NAND, DRAM - LPDDR2`，Memory Size 为 `4Gb NAND + 4Gb LPDDR2`，package 为 `168-VFBGA (12x12)`。
  <https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog/part-detail/mt29rz4c4dzzmgmf-18w.80c>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/micron-emcp-token.json`
- 规则 ID：
  - `vendor.micron.umcp.mt29v_mt30a.v1`
  - `vendor.micron.emcp.nand_mcp.v1`
  - `vendor.micron.emcp.aio.v1`
  - `vendor.micron.emcp.mt29c.v1` / `vendor.micron.emcp.mt29rz.v1` 为 lower-priority legacy fallback；`MT29RZ...` 等符合 AiO 结构的旧例优先由 `vendor.micron.emcp.aio.v1` 覆盖。
- testcase：`packages/core/test/decodepack/part-number/micron-mcp-all-in-one.test.ts`、`packages/core/test/decodepack/part-number/micron-mcp-mt29c.test.ts`、`packages/core/test/decodepack/part-number/micron-umcp.test.ts`

## NAND MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29` + family + `Z` + NAND density/width + LPDRAM density/width + voltage + package configuration + package + optional suffix | Micron NAND MCP |
| family `A/B/C/G/R/U` | SLC NAND + LPDDR2 / LPDDR3 / Mobile LPDRAM / LPDDR4 |
| density code `1..6/9` | 512Mb ~ 16Gb NAND / LPDRAM；current catalog 组合确认 `9 = 16Gb` |
| width code `A/B/C` | x8 / x16 / x32 |
| package configuration `G/H/I/M` | NAND Flash 与 LPDRAM 颗数组合 |
| package `ET` | `VFBGA-149, 8x9.5x1.0` |
| suffix after `-` | speed -> temperature -> production status -> special option -> die revision |

示例：`MT29AZ5A3CHHWD-18AIT.84F` 解码为 4Gb SLC NAND + 2Gb LPDDR2，package `162-ball 8.0x10.5x0.9mm`，`dram_speed = LPDDR2-1066 CL8`，temperature `Automotive industrial (-40°C ~ 85°C)`，die revision `84F`。

## AiO / Legacy MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29` + family + `Z` + NAND density/width + LPDRAM density/width + eMMC density/controller + voltage + package configuration + package + optional suffix | Micron AiO / legacy MCP |
| family `C/D/J/K/M/P/Q/R/T/U/V` | NAND + LPDRAM、LPDDR + eMMC、LPDDR2/3/4-S4 + NAND/eMMC 等组合 |
| NAND/eMMC density code | `ZZ` 表示对应子系统缺省；否则按 density table 输出 storage density |
| package configuration `A..R` | NAND Flash / LPDRAM / eMMC 颗数组合 |
| package `PB/PL/SK/SP/TB` | `WFBGA-221, 11.5x13x0.8` / `WFBGA-162, 11.5x13x0.8` / `WFBGA-162, 11.5x13x0.9` / `WFBGA-162, 8x10.5x0.8` / `VFBGA-162, 8x10.5x0.9` |
| suffix after `-` | speed -> temperature -> production status (`ES/MS`) -> special option (`A/B/E/F`) -> die revision |

`MT29RZ...` legacy 旧例现在按 AiO 通用结构解析，避免继续公开 `config_code` / `package_code`。例如 `MT29RZ4C4DZZMGMF-18W.80C` 输出 4Gb NAND + 4Gb LPDDR2-S4、package configuration、`LPDDR2-1066 CL8` 和 die revision `80C`。

`MT29C...` legacy fallback 同样按 density / configuration / package / suffix token 解析。官方 obsolete catalog 的 `MT29C4G48MAZBBAKB-48 IT` 与 ES 变体确认 `KB = WFBGA-168, 12x12x0.8`；该 exact PN 只用于回归和证据，不作为 decoder match 条件。

## uMCP UFS + LPDDR4X / LPDDR5 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29VZZZ` + DRAM density/width + UFS density/controller + voltage + package configuration + package + speed/temp/die revision | 254-ball uMCP UFS + Mobile LPDDR4X |
| `MT30AZZZ` + DRAM density/width + UFS density/controller + voltage + package configuration + package + speed/temp/die revision | 297-ball uMCP UFS + Mobile LPDDR5 |
| DRAM density `7/A/B/C/D` | 24Gb / 32Gb / 48Gb / 64Gb / 96Gb |
| UFS density `7/8/9/A/B` | 32GB / 64GB / 128GB / 256GB / 512GB |
| controller `H/F/1/Z/0` | SM2750 100s v2.1、SM2752 110s v2.1/v2.2、SM2754 120s/140s、9U6A 140s |
| package configuration `F/K/L/O/P` | 2 / 4 / 3 / 6 / 8 LPDRAM + 1 UFS |

DRAM density token 独立解析；例如 `C` 始终按 64Gb 处理，`F/K/O/P` 只表达封装内 LPDRAM 颗数，不覆盖 density。测试中覆盖 `MT29VZZZCD91SFSM 046 W.18C` 与 `MT29VZZZCD91SKSM 046 W.17Y`，两者均输出 64Gb LPDDR4X，但 package configuration 分别是 `2 LPDRAM, 1 UFS` 和 `4 LPDRAM, 1 UFS`。

TN-29-85 中 `MT30AZZZCD9ZTOQS-031 W.15Q` 这类 `128GB (2 x B27B) + 48Gb (4 x Y2BM) + 16Gb (2 x Y21N)` 不是两个独立 DRAM 子系统，而是同一个 LPDDR5 DRAM 容量由两种 Micron DRAM die / package token 混合组成：4 颗 `Y2BM` 合计 48Gb，再加 2 颗 `Y21N` 合计 16Gb，总 DRAM 容量为 64Gb。公开字段中 `dram_density = 64Gb` 表达总容量，`dram_configuration` 保留这类混合组成细节。

Micron locked rows 中的 `046 W.G0J`、`031 WL.19Q` 等无 hyphen 后缀也作为完整规则支持；normalizer 会移除空格、点和可选 hyphen，并保留 `W` / `WL` temperature 与后续 die revision。

## DRAM Speed 输出约定

- 有官方 CL 的旧 LPDRAM speed 输出为 `LPDDR2-1066 CL8`、`LPDDR-333 CL3` 这类 `LPDDR*-rate CL*` 形式，不再输出 `533MHz CL8 (LPDDR 1066)`。
- `046/053/062/031/026/023` 这类 LPDDR4/LPDDR4X/LPDDR5 speed bin 在当前资料中只确认数据率，未确认 CL；规则输出 `LPDDR4X-4266`、`LPDDR4X-3733`、`LPDDR5-6400`、`LPDDR5-8533`，不补未确认的 CL。
- `speed_grade` 只保留真正表达测试等级或 binning 的场景；Micron MCP speed token 统一输出到 `dram_speed`。

## Raw NAND 边界

Micron raw NAND 规则只覆盖 `MT29E...` / `MT29F...`，其中 `MT29FB...` 复用 `MT29F` raw NAND token 结构；`B` marker 只作内部解析，不额外输出独立 chip kind 或 `ecc_enabled`。`MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP/AiO/uMCP 结构不应进入 raw NAND parser。

## 示例

| PN | 解析重点 |
| --- | --- |
| `MT29AZ5A3CHHWD-18AIT.84F` | eMCP, 4Gb NAND + 2Gb LPDDR2, `LPDDR2-1066 CL8`, die revision `84F` |
| `MT29JZZZ2DWMAFJV-6IES.63m` | eMCP, 256MB eMMC + 2Gb LPDRAM, `LPDDR-333 CL3`, Engineering Sample, die revision `63M` |
| `MT29RZ4C4DZZMGMF-18W.80C` | eMCP, 4Gb NAND + 4Gb LPDDR2-S4, package configuration, die revision `80C` |
| `MT29VZZZBDAFQKWL 046 W.G0J` | uMCP, 256GB UFS + 48Gb LPDDR4X, SM2752 110s, `LPDDR4X-4266`, die revision `G0J` |
| `MT29VZZZCD91SFSM 046 W.18C` | uMCP, 128GB UFS + 64Gb LPDDR4X, 2 LPDRAM + 1 UFS, die revision `18C` |
| `MT30AZZZCD9ZTOQS 031 W.15Q` | uMCP, 128GB UFS + 64Gb LPDDR5, `48Gb (4 x Y2BM) + 16Gb (2 x Y21N)`, die revision `15Q` |
| `MT30AZZZDDA0TPQS 031 WL.19Q` | uMCP, 256GB UFS + 96Gb LPDDR5, 9U6A 140s, `LPDDR5-6400`, `WL` temperature |
