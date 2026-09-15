# Micron MCP / eMCP / uMCP PN 编码资料

采集日期：2026-07-12；更新日期：2026-08-27

本文档记录 Micron NAND MCP、AiO 旧版 MCP/eMCP 与 UFS uMCP 组合封装规则。它们不是裸 NAND，也不是单独的 `MTFC` eMMC / UFS；应作为复合受管理 NAND 输出，并用存储 / DRAM 字段表达子组件。`nummcp.pdf` 中的 NOR MCP 页面本轮按需求忽略，不进入规则和测试。

## 来源

- Micron 官方 `NOR MCP, NAND MCP, PoP and AiO Part Numbering Systems` PDF (`nummcp.pdf`) 给出 NAND MCP、MCP/PoP/AiO、AiO 旧版的结构表，确认产品系列、NAND/LPDRAM 容量/位宽、电压、封装配置、封装、`-` 后速度 / 温度 / 生产状态 / 特殊选项 / die 修订版后缀。本文只使用 NAND MCP、MCP/PoP/AiO、AiO 页面，忽略 NOR。
- 用户补充的 Micron 受限数据手册目录条目确认 `MT29VZZZ...` 254 球 uMCP UFS + LPDDR4X 与 `MT30AZZZ...` 297 球 uMCP UFS + LPDDR5 的实际 PN、存储容量、控制器、DRAM 容量、封装配置、速度/温度/die 修订版后缀。
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) 表 1 给出 `MT29V` / `MT30A` uMCP 已知 PN、NAND die 组成、DRAM 颗粒组成、封装编码和 Health Report 适用范围。
- Micron 官方基于 UFS 的 MCP 在线目录 JSON 的 14 条记录用于全量回归，补齐 `023` 的 8533 MT/s 速率，使 `MT30AZZZCDA4TKXL-023 W.273` / `MT30AZZZDDA4TOXM-023 W.274` 不再回退为 NAND；2026-08-27 根据官方文档搜索元数据将 MT30A 控制器 `4/5` 的 DRAM 类型及对应速率细化为 `LPDDR5X` / `LPDDR5X-8533`。同一目录直接确认 `SL/PR/SM` 的 254 球封装与 `EQ/QS/WL/XL/XM` 的 297 球封装类型和尺寸。<https://www.micron.com/content/micron/us/en/products/storage/managed-nand/universal-flash-storage/part-catalog/_jcr_content.products.json/getpartcatalog/multichip-packages/ufs-based-mcp/-/en_US>
- 2026-07-12 复查 Micron 官方基于 eMMC 的 MCP 在线目录的 15 条记录。`MT29GZ9A9BPMET...` 与 `MT29GZ6A9BPGET...` 的组合容量确认容量编码段 `9 = 16Gb`；同一目录确认 `ET = VFBGA-149, 8x9.5x1.0` 及 `AUT = -40°C ~ 125°C`。排除已有有效 MDB 覆盖后，5 条结构化解码器可完整解析的 `MT29GZ...` PN 进入搜索资源；唯一紧凑编码 `MT29V5D7GVESL-046I.216` 因公开订购编码段不足继续排除，不为单一料号扩大匹配。<https://www.micron.com/products/multichip-packages/emmc-based-mcp/part-catalog>
- 同轮复查基于 UFS 的 MCP 14 条记录后，仅 `MT30AZZZDDA0TPQS-031 WL.19Q` 尚无有效 MDB / 搜索资源覆盖；它已由既有 `MT30A` uMCP 编码段规则完整解析并进入搜索资源。
- 同轮继续全量复查 Micron 官方当前版 / 已停产基于 NAND 的 MCP 目录的 96 条记录。其中 89 条 `MT29A/C/GZ/RZ/UZ...` NAND MCP / AiO PN 均由结构化规则识别，且完整 PN 已由有效 MDB 或现有搜索资源覆盖，不重复入库。目录进一步确认 AiO 封装编码段 `PB/PL/SK/SP/TB` 与 MT29C 封装编码段 `KB` 的类型、球数和尺寸；规则仅补这些局部编码段映射，不加入完整 PN 查表。<https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog>
- Micron《168-Ball NAND Flash and LPDRAM PoP MCP》数据手册镜像给出 `MT29C2G24MAKLAJG-6 IT` 等生产料号，确认产品为 NAND 闪存 + LPDRAM PoP MCP，并列出 NAND 产品、LPDDR 产品与实物丝印。
  <https://datasheet.octopart.com/MT29C2G24MAKLAJG-6-IT-Micron-datasheet-8368047.pdf>
- DigiKey `MT29C4G96MAZAPCJA-5 IT` 页面确认技术为 `FLASH - NAND, Mobile LPDRAM`，存储器大小为 `4Gbit (NAND), 4Gbit (LPDRAM)`，封装为 `137-TFBGA (10.5x13)`。
  <https://www.digikey.at/en/products/detail/micron-technology-inc/MT29C4G96MAZAPCJA-5-IT/2810752>
- Elnec `MT29C8G48MAPLDJA [TFBGA137]` 设备页给出 MT29C 通用 PN 结构：`29C = NAND flash + LPDRAM MCP/PoP`，并列出封装、速度、温度和生产状态编码段。
  <https://www.elnec.com/en/device/Micron/MT29C8G48MAPLDJA%20%5BTFBGA137%5D/>
- Micron 已停产料号细节页面保留 `MT29RZ4C4DZZMGMF-18W.80C` 入口；分销规格页同向确认其技术为 `FLASH - NAND, DRAM - LPDDR2`，存储器大小为 `4Gb NAND + 4Gb LPDDR2`，封装为 `168-VFBGA (12x12)`。
  <https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog/part-detail/mt29rz4c4dzzmgmf-18w.80c>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/micron-emcp-token.json`
- 规则 ID：
  - `vendor.micron.umcp.mt29v_mt30a.v1`
  - `vendor.micron.emcp.nand_mcp.v1`
  - `vendor.micron.emcp.aio.v1`
  - `vendor.micron.emcp.mt29d.v1`
  - `vendor.micron.emcp.mt29c.v1` / `vendor.micron.emcp.mt29rz.v1` 为较低优先级旧版回退；`MT29RZ...` 等符合 AiO 结构的旧例优先由 `vendor.micron.emcp.aio.v1` 覆盖。
- 测试用例：`packages/core/test/decodepack/part-number/micron-mcp-all-in-one.test.ts`、`packages/core/test/decodepack/part-number/micron-mcp-mt29c.test.ts`、`packages/core/test/decodepack/part-number/micron-umcp.test.ts`

## NAND MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29` + 系列 + `Z` + NAND 容量/位宽 + LPDRAM 容量/位宽 + 电压 + 封装配置 + 封装 + 可选后缀 | Micron NAND MCP |
| 系列 `A/B/C/G/R/U` | SLC NAND + LPDDR2 / LPDDR3 / 移动版 LPDRAM / LPDDR4 |
| 容量编码 `1..6/9` | 512Mb ~ 16Gb NAND / LPDRAM；当前版目录组合确认 `9 = 16Gb` |
| 位宽编码 `A/B/C` | x8 / x16 / x32 |
| 封装配置 `G/H/I/M` | NAND 闪存与 LPDRAM 颗数组合 |
| 封装 `ET` | `VFBGA-149, 8x9.5x1.0` |
| `-` 后的后缀 | 速度 -> 温度 -> 生产状态 -> 特殊选项 -> die 修订版 |

示例：`MT29AZ5A3CHHWD-18AIT.84F` 解码为 4Gb SLC NAND + 2Gb LPDDR2，封装 `162-ball 8.0x10.5x0.9mm`，`dram_speed = LPDDR2-1066 CL8`，温度 `Automotive industrial (-40°C ~ 85°C)`，die 修订版 `84F`。

## AiO / 旧版 MCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29` + 系列 + `Z` + NAND 容量/位宽 + LPDRAM 容量/位宽 + eMMC 容量/控制器 + 电压 + 封装配置 + 封装 + 可选后缀 | Micron AiO / 旧版 MCP |
| 系列 `C/D/J/K/M/P/Q/R/T/U/V` | NAND + LPDRAM、LPDDR + eMMC、LPDDR2/3/4-S4 + NAND/eMMC 等组合 |
| NAND/eMMC 容量编码 | `ZZ` 表示对应子系统缺省；否则按容量表输出存储容量 |
| 封装配置 `A..R` | NAND 闪存 / LPDRAM / eMMC 颗数组合 |
| 封装 `PB/PL/SK/SP/TB` | `WFBGA-221, 11.5x13x0.8` / `WFBGA-162, 11.5x13x0.8` / `WFBGA-162, 11.5x13x0.9` / `WFBGA-162, 8x10.5x0.8` / `VFBGA-162, 8x10.5x0.9` |
| `-` 后的后缀 | 速度 -> 温度 -> 生产状态 (`ES/MS`) -> 特殊选项 (`A/B/E/F`) -> die 修订版 |

`MT29RZ...` 旧版旧例现在按 AiO 通用结构解析，避免继续公开 `config_code` / `package_code`。例如 `MT29RZ4C4DZZMGMF-18W.80C` 输出 4Gb NAND + 4Gb LPDDR2-S4、封装配置、`LPDDR2-1066 CL8` 和 die 修订版 `80C`。

`MT29C...` 旧版回退同样按容量 / 配置 / 封装 / 后缀编码段解析。官方已停产目录的 `MT29C4G48MAZBBAKB-48 IT` 与 ES 变体确认 `KB = WFBGA-168, 12x12x0.8`；该完整 PN 只用于回归和证据，不作为解码器匹配条件。

## uMCP UFS + LPDDR4X / LPDDR5 / LPDDR5X 结构

| PN 结构 | 字段 |
| --- | --- |
| `MT29VZZZ` + DRAM 容量/位宽 + UFS 容量/控制器 + 电压 + 封装配置 + 封装 + 速度/温度/die 修订版 | 254 球 uMCP UFS + 移动版 LPDDR4X |
| `MT30AZZZ` + DRAM 容量/位宽 + UFS 容量/控制器 + 电压 + 封装配置 + 封装 + 速度/温度/die 修订版 | UFS + LPDDR5/LPDDR5X，封装编码段确认后输出 297/305 球 uMCP |
| DRAM 容量 `7/A/B/C/D` | 24Gb / 32Gb / 48Gb / 64Gb / 96Gb |
| UFS 容量 `7/8/9/A/B/C` | 32GB / 64GB / 128GB / 256GB / 512GB / 1TB |
| 控制器 `H/F/1/Z/0` | SM2750 100s v2.1、SM2752 110s v2.1/v2.2、SM2754 120s/140s、9U6A 140s |
| MT30A 控制器 `4/5` | 9U2A + UFS 3.1/4.1 + LPDDR5X；不将 150s/160s 固定到控制器编码段 |
| MT30A 封装 `AV/AW` | `uMCP-305`，公开元数据未确认尺寸或 V/TFBGA 类型 |
| 封装配置 `F/K/L/O/P` | 2 / 4 / 3 / 6 / 8 LPDRAM + 1 UFS |

DRAM 容量编码段独立解析；例如 `C` 始终按 64Gb 处理，`F/K/O/P` 只表达封装内 LPDRAM 颗数，不覆盖容量。测试中覆盖 `MT29VZZZCD91SFSM 046 W.18C` 与 `MT29VZZZCD91SKSM 046 W.17Y`，两者均输出 64Gb LPDDR4X，但封装配置分别是 `2 LPDRAM, 1 UFS` 和 `4 LPDRAM, 1 UFS`。

TN-29-85 中 `MT30AZZZCD9ZTOQS-031 W.15Q` 这类 `128GB (2 x B27B) + 48Gb (4 x Y2BM) + 16Gb (2 x Y21N)` 不是两个独立 DRAM 子系统，而是同一个 LPDDR5 DRAM 容量由两种 Micron DRAM die / 封装编码段混合组成：4 颗 `Y2BM` 合计 48Gb，再加 2 颗 `Y21N` 合计 16Gb，总 DRAM 容量为 64Gb。公开字段中 `dram_density = 64Gb` 表达总容量，`dram_configuration` 保留这类混合组成细节。

Micron 受限行中的 `046 W.G0J`、`031 WL.19Q` 等无连字符后缀也作为完整规则支持；归一化器会移除空格、点和可选连字符，并保留 `W` / `WL` 温度与后续 die 修订版。

2026-08-27 的官方文档搜索元数据确认 UM278/UM27E/UM27G 系列的
`C` 存储、MT30A `4/5` 控制器和 `AV/AW` 封装；控制器 `4/5` 下 `023` 输出
`LPDDR5X-8533`。`WN/WD` 按完整后缀编码段消费，避免污染后续 die 修订版；`WD` 不猜温区。
安全 PDF 正文需登录，本轮证据限于官方公开标题/描述。
<https://www.micron.com/search-results?searchRequest=MT30AZZZDDC4TOWL>
<https://www.micron.com/search-results?searchRequest=MT30AZZZEDC5TPAW>

## DRAM 速度输出约定

- 有官方 CL 的旧 LPDRAM 速度输出为 `LPDDR2-1066 CL8`、`LPDDR-333 CL3` 这类 `LPDDR*-rate CL*` 形式，不再输出 `533MHz CL8 (LPDDR 1066)`。
- `046/053/062/031/026/023` 这类 LPDDR4/LPDDR4X/LPDDR5/LPDDR5X 速度档位在当前资料中只确认数据率，未确认 CL；规则输出 `LPDDR4X-4266`、`LPDDR4X-3733`、`LPDDR5-6400`、`LPDDR5-8533`，MT30A 控制器 `4/5` 下的 `023` 输出 `LPDDR5X-8533`，不补未确认的 CL。
- `speed_grade` 只保留真正表达测试等级或分级的场景；Micron MCP 速度编码段统一输出到 `dram_speed`。
- 速度按已确认的 DRAM 类型 + 三位速度编码段查表；未知编码段或未经确认的跨代组合不输出速度，但保留容量、类型及后续温区/修订版。

## 裸 NAND 边界

Micron 裸 NAND 规则只覆盖 `MT29E...` / `MT29F...`，其中 `MT29FB...` 复用 `MT29F` 裸 NAND 编码段结构；`B` 标记只作内部解析，不额外输出独立芯片种类或 `ecc_enabled`。`MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP/AiO/uMCP 结构不应进入裸 NAND 解析器。

## 2026-08-27 旧版待办项研究

- `MT29C8G96MAAAEBACKD-5 WT` 已通过结构化主体长度扩展解析。
  `MT29C1G512MAACAUAMD-5 IT ES` 的 `512M` 分段没有可公开语法，官方指南对应位置只定义
  `12M`，因此仍仅身份；其余 24 条 `MT29C[23]D...-DC` 也保持
  仅搜索，不从紧凑编码主体推导容量、菊花链或封装。
- 39 条 `MT29D` 已接入结构化分类规则：输出
  `SLC NAND + LPDDR + MLC eMMC`、速度/温度/状态；三组芯片三元组合
  因官方未解释而只作内部编码段，不公开编码或猜测容量。
- 52 条 `MT29Z...OTP` 可通过封装 + die 修订版与正式 `MT29V/MT30A` 目录 PN
  对应，但同一紧凑编码命名空间横跨 eMMC 与 UFS；它们应作为内部 OTP/仅搜索，
  不公开 OTP 语义，也不建立精确别名转换表。

以上研究使用 Micron MCP/AiO 编码、官方 FBGA 解码器、基于 eMMC 的 MCP 与基于 UFS 的
MCP 目录：<https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac8a329b9-b44e-4bd8-b309-a75929865e96/original/as/nummcp.pdf>、
<https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>、
<https://www.micron.com/content/micron/us/en/products/multichip-packages/emmc-based-mcp/part-catalog/_jcr_content.products.json/getpartcatalog/multichip-packages/emmc-based-mcp/-/en_US>、
<https://www.micron.com/products/multichip-packages/ufs-based-mcp/part-catalog>。

## 示例

| PN | 解析重点 |
| --- | --- |
| `MT29AZ5A3CHHWD-18AIT.84F` | eMCP, 4Gb NAND + 2Gb LPDDR2, `LPDDR2-1066 CL8`, die 修订版 `84F` |
| `MT29JZZZ2DWMAFJV-6IES.63m` | eMCP, 256MB eMMC + 2Gb LPDRAM, `LPDDR-333 CL3`, 工程样品, die 修订版 `63M` |
| `MT29RZ4C4DZZMGMF-18W.80C` | eMCP, 4Gb NAND + 4Gb LPDDR2-S4, 封装配置, die 修订版 `80C` |
| `MT29VZZZBDAFQKWL 046 W.G0J` | uMCP, 256GB UFS + 48Gb LPDDR4X, SM2752 110s, `LPDDR4X-4266`, die 修订版 `G0J` |
| `MT29VZZZCD91SFSM 046 W.18C` | uMCP, 128GB UFS + 64Gb LPDDR4X, 2 LPDRAM + 1 UFS, die 修订版 `18C` |
| `MT30AZZZCD9ZTOQS 031 W.15Q` | uMCP, 128GB UFS + 64Gb LPDDR5, `48Gb (4 x Y2BM) + 16Gb (2 x Y21N)`, die 修订版 `15Q` |
| `MT30AZZZDDA0TPQS 031 WL.19Q` | uMCP, 256GB UFS + 96Gb LPDDR5, 9U6A 140s, `LPDDR5-6400`, `WL` 温度 |
