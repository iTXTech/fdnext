# SK hynix eMCP / uMCP PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix MCP / eMCP / uMCP 料号的公开资料、规则库抽象和测试用例覆盖点。规则维护遵循 [PN 编写规范](authoring.md)；未知容量/配置编码段不阻断厂商/类型的识别。

## 来源

- SK hynix MCP 产品手册 / 目录镜像说明 MCP 将 UFS NAND 与 LPDDR DRAM 堆叠到单一封装，用于移动设备，并列出 NAND 模式/容量、DRAM 模式/容量、封装类型等产品维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/mcp/34497-1045442.html>
- 本地 `H9TQ27ADFTMCUR_Rev0.1.pdf` 给出 `32GB eMMC (x8) / LPDDR3 24Gb(x32)`、eMMC 5.1、LPDDR3-1866、221 球 FBGA，以及 `H 9 T Q 2 7 A D F T M C U R - K U M` 的逐编码段标注。H9TQ 旧版规则优先按该订购编码表拆解容量、NVM 电压、DRAM 容量/堆叠/CS、代际、封装、材料、eMMC 速度、DRAM 速度与温度。
- `H9TQ17ABJTMCUR-KUM` CI-MCP 数据手册镜像给出 `16GB eNAND (x8) / LPDDR3 16Gb(x32)`、eMMC 5.0、221 球 FBGA，以及 `H 9 T Q 1 7 ... - K * M` 的字段标注。
  <https://datasheet4u.com/pdf/1055141/H9TQ17ABJTMCUR-KUM.pdf>
- `H9TP32A4GDBCPR-KGM` CI-MCP 数据手册镜像给出 `4GB eNAND (x8) / LPDDR2-S4B 4Gb(x32)`、eMMC 4.41、162 球 FBGA，以及 `H 9 T P 3 2 ... - K G M` 的字段标注。
  <https://datasheet4u.com/pdf-down/H/9/T/H9TP32A4GDBCPR-HynixSemiconductor.pdf>
- 本地 `H9HP27ADAMADAR_Rev1.0.pdf` 给出 `32GB eMMC (x8) / LPDDR4X 24Gb(x16, 2CH/2CS)`、eMMC 5.1、LPDDR4X-3733、254 球 FBGA，以及 `H 9 H P 2 7 A D A M A D A R - K M M` 的字段标注。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9HP27ADAMADAR_Rev1.0.pdf>
- 本地 `H9HP52ACPMADAR_Rev1.0.pdf` 给出 `64GB eMMC (x8) / LPDDR4X 32Gb(x16, 2CH/2CS)`、eMMC 5.1、LPDDR4X-3733、254 球 FBGA，以及 `H 9 H P 5 2 A C P M A D A R - K M M` 的字段标注。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9HP52ACPMADAR_Rev1.0.pdf>
- 本地 `H9AG9G5ANBX100_Rev0.2.pdf` 给出 `H9A` = LPDDR4 eMCP，`G9G5` = 64GB eMMC + 32Gb / 4GB LPDDR4X，`N` = DDR 4266/CL32 + 52MHz，`B` = MMC 5.0，`100` = PKG 选项，254 球 FBGA。
  <https://uttc.com.tw/wp-content/uploads/2025/12/H9AG9G5ANBX100_Rev0.2.pdf>
- 本地 `H9QT0GECN6X145_Rev0.1.pdf` 给出 `H9Q` = LPDDR4 uMCP，`T0GE` = 128GB UFS + 48Gb / 6GB LPDDR4X，`C` = Gen4，`N` = DDR 4266，`6` = UFS 2.2，`X` 保留，`145` = PKG 选项，254 球 FBGA，无铅无卤，工作温度 -25°C ~ 85°C。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/H9QT0GECN6X145_Rev0.1.pdf>
- `H9HQ15ACPMADAR-KEM` 分销页标注类型 `uMCP`、子类型 `UFS+LPDDR4x`、封装 `254ball_UFS+LPD4x`、容量 `128+32`。
  <https://www.preduo.com/product/umcp/ufs-lpddr4x/254ball_ufs-lpd4x/h9hq15acpmadar-kem>
- SK hynix eMCP 公开产品表补充 H9HP/H9A 当前产品系列：存储 16/32/64GB 与 LPDDR4X 2/3/4/6GB 的组合。该表用于补齐相互独立的存储容量与 DRAM 容量编码段；不能再把同一存储编码段（例如 `52`）固定解释为单一 DRAM 容量。来源：<https://www.skhynix.glochip.com/h-pd-18.html>
- SK hynix uMCP 公开产品表列出 H9HQ53/H9HQ54 的 64GB UFS 2.1/2.2 + 3GB/4GB/6GB LPDDR4X 组合；分销资料交叉确认 254 球封装。
  <https://www.skhynix.glochip.com/h-pd-17.html>
  <https://www.preduo.com/product/umcp/ufs-lpddr4x/254ball_ufs-lpd4x/h9hq54aecmmdar-kem>
- SK hynix MWC 2021 公司概览列出 `H9HR56JFA3MEVR-K6M` = 512GB UFS 3.1 + 8GB LPDDR5-6400，-25~85°C；公开产品表另列同编码段系列的 128GB / 256GB + 8GB 组合。未找到可靠封装编码段定义，规则不输出封装。
  <https://gsma.my.site.com/mwcoem/servlet/servlet.FileDownload?file=00P6900002qXdyXEAS>
  <https://www.skhynix.glochip.com/h-pd-17.html>

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
  - `vendor.skhynix.umcp.h9hr-lpddr5.v1`
- 测试用例：`packages/core/test/decodepack/part-number/skhynix-mcp.test.ts`

## H9HP LPDDR4X eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9HP` + 容量(2) + NVM 电压(1) + DRAM 容量(1) + DRAM 选项(1) + 代际(1) + 封装类型(1) + 材料(1) + eMMC 速度(1) + DRAM 速度(1) + 可选温度尾部 | SK hynix eMMC + LPDDR4X eMCP |
| 存储容量 `19/27/52/53` | 16GB / 32GB / 64GB / 64GB eMMC；只表达存储侧 |
| NVM 电压 `A` | eMMC/NVM 3.3V x8 |
| DRAM 容量 `B/C/D/E` | 16Gb / 32Gb / 24Gb / 48Gb LPDDR4X；与存储容量独立 |
| DRAM 选项 `A/P/C/U` | 已确认产品系列输出 LPDDR4X 与电压；只有订购编码解码器已确认的 `A/P` 输出 x16，`C/U` 不猜位宽 |
| 代际 `M` | Gen2 |
| 封装类型 `A` | 254 球 FBGA 11.5x13 |
| 封装材料 `D` | 无铅无卤 |
| eMMC 速度 `A` | 400MHz |
| DRAM 速度 `R` | LPDDR4X-3733 |
| 尾部 `KMM` | 移动版 -25~85°C |

## H9T / H9H 旧版 eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9TP/H9TQ/H9HC` + 容量(2) + NVM 电压(1) + DRAM 容量(2) + DRAM 选项(1) + 代际(1) + 封装类型(2) + 材料(1) + eMMC 速度(1) + DRAM 速度(1) + 温度(1) | SK hynix CI-MCP / eMCP |
| `H9TP` | CI-MCP NAND DDR2, e-NAND + LPDDR2 |
| `H9TQ` | CI-MCP NAND DDR3, e-NAND + LPDDR3 |
| `H9HC` | eMCP 系列，公开资料不足时只输出结构字段 |
| 容量 `32` | 4GB e-NAND + 4Gb LPDDR2 |
| 容量 `64` | 8GB eMMC + 8Gb LPDDR3 |
| 容量 `17` | 16GB e-NAND + 16Gb LPDDR3 |
| 容量 `27` | 32GB eMMC + 24Gb LPDDR3 |
| 容量 `52` | 64GB eMMC + 32Gb LPDDR4X |
| NVM 电压 `A` | eMMC/NVM 3.3V x8 |
| DRAM 容量 `4G/8G/BJ/DF` | 4Gb SDP / 8Gb SDP / 16Gb 1ch 2CS / 24Gb 1ch 2CS |
| DRAM 选项 `D/T` | LPDDR2 x32 / LPDDR3 x32 |
| 代际 `M/A/B` | Gen1 / Gen2 / Gen3 eMCP |
| 封装类型 `CP/CU` | FBGA 162 球 11.5x13 / FBGA 221 球 11.5x13 |
| 封装材料 `R` | 无铅无卤 |
| 速度尾部 | eMMC 速度由产品系列、容量和编码段组合决定；DRAM 速度 `G/T/U` = LPDDR2-1066 / LPDDR3-1600 / LPDDR3-1866 |
| 温度 `M` | 标准 -25~85°C |

eMCP 输出中存储侧的 NAND die 数使用 `die_count`，DRAM 侧的 die 数使用 `dram_die_count`，两者可同时存在；`cs_count` 只表达 DRAM CS/rank。

## H9A eMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9A` + 容量(4) + 代际 + 速度 + 接口 + 保留 + 序列号(3) | SK hynix LPDDR4 eMCP |
| 容量 `G8GD/G9GD/G9G5/G9GE` | 32GB+3GB / 64GB+3GB / 64GB+4GB / 64GB+6GB |
| `G9G5` 的 DRAM 组织结构 | LPDDR4X x16 |
| 代际 `A` | Gen2 eMCP |
| 速度 `N` | LPDDR4X-4266 CL32 / eMMC 52MHz |
| 接口 `B` | eMMC 5.0 |
| 序列号 `100` | 254 球 FBGA, 无铅无卤 |

## H9Q / H9HQ uMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9Q` + 容量(4) + 代际 + 速度 + 接口 + 保留 + 序列号(3) | SK hynix LPDDR4 uMCP |
| 容量 `T0GE` | 128GB UFS + 48Gb / 6GB LPDDR4X |
| `T0GE` 的 DRAM 组织结构 | LPDDR4X x8 |
| 代际 `C` | Gen4 uMCP |
| 速度 `N` | LPDDR4X-4266 |
| 接口 `6` | UFS 2.2 |
| 保留 `X` | 内部保留编码段，不作为公开编码字段输出 |
| 序列号 `145` | PKG 选项编码段：254 球 FBGA, 无铅无卤, -25~85°C |
| 操作电压 | UFS 3.3V；LPDDR4X VDD1/VDD2/VDDQ 1.8V/1.1V/0.6V |
| `H9HQ` + 容量(2) + 配置尾部 | SK hynix UFS + LPDDR4X uMCP |
| 容量 `15` | 128GB UFS + 32Gb LPDDR4X |
| 容量 `53/54` | 64GB UFS 2.1 / UFS 2.2 |
| DRAM 容量 `D/C/E` | 24Gb / 32Gb / 48Gb LPDDR4X |
| 封装编码段 `A/M` | FBGA-254；只有该编码段存在时输出封装 |
| 尾部 `KEM` | LPDDR4X-4266 |

## H9HR LPDDR5 uMCP 结构

| PN 结构 | 字段 |
| --- | --- |
| `H9HR` + 存储容量(2) + DRAM 配置(3) + 选项编码段(5) + 速度/温度尾部 | SK hynix UFS 3.1 + LPDDR5 uMCP |
| 存储容量 `15/21/56` | 128GB / 256GB / 512GB UFS 3.1 |
| DRAM 配置 `JFA` | 64Gb LPDDR5，1.8V/1.05V/0.5V |
| 尾部 `K6M` | LPDDR5-6400，-25~85°C |
| 封装 | 公开资料未确认封装编码段，不输出 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `H9TQ17ABJTMCUR-KUM` | eMCP, 16GB e-NAND + 16Gb LPDDR3, eMMC 5.0, 221 球 FBGA |
| `H9TQ27ADFTMCUR-KUM` | eMCP, 32GB eMMC + 24Gb LPDDR3, eMMC 5.1, LPDDR3-1866, 221 球 FBGA |
| `H9TQ64A8GTACUR-KUM` | eMCP, 8GB eMMC + 8Gb LPDDR3, eMMC 5.1, LPDDR3-1866, 221 球 FBGA |
| `H9TP32A4GDBCPR-KGM` | eMCP, 4GB e-NAND + 4Gb LPDDR2, eMMC 4.41, 162 球 FBGA |
| `H9HP27ADAMADAR-KMM` | eMCP, 32GB eMMC + 24Gb LPDDR4X, eMMC 5.1, 254 球 FBGA |
| `H9HP52ACPMADAR-KMM` | eMCP, 64GB eMMC + 32Gb LPDDR4X, eMMC 5.1, 254 球 FBGA |
| `H9AG9G5ANBX100` | eMCP, 64GB eMMC + 4GB LPDDR4X x16, eMMC 5.0 |
| `H9AG9GEANBX101` | eMCP, 64GB eMMC + 6GB LPDDR4X, eMMC 5.0；无已确认封装编码段时不输出封装 |
| `H9HP19ABUMMDAR-KEM` | eMCP, 16GB eMMC + 2GB LPDDR4X, eMMC 5.1 |
| `H9HP52AECMMDAR-KMM` | eMCP, 64GB eMMC + 6GB LPDDR4X, eMMC 5.1 |
| `H9QT0GECN6X145` | uMCP, 128GB UFS + 48Gb / 6GB LPDDR4X x8, UFS 2.2, LPDDR4X-4266, 254 球 FBGA |
| `H9HQ15ACPMADAR-KEM` | uMCP, 128GB UFS + 32Gb LPDDR4X |
| `H9HQ54AECMMDAR-KEM` | uMCP, 64GB UFS 2.2 + 48Gb LPDDR4X-4266, FBGA-254 |
| `H9HR56JFA3MEVR-K6M` | uMCP, 512GB UFS 3.1 + 64Gb LPDDR5-6400；不输出未确认封装 |

## 已知缺口

- H9HP 的存储容量与 DRAM 容量已拆为独立编码段；`19/27/52/53` 不再隐含固定 DRAM 容量。H9A 当前目录组合仍使用 4 字符组合编码段，但序列号不参与容量解析。DRAM 位宽 / 封装 / 温度只在对应语义编码段有订购编码证据时输出。
- H9T/H9H 旧版规则已覆盖本地 H9TQ27 数据手册与已知 H9TQ17、H9TQ64、H9TP32 样本；eMMC 速度用组合键处理，避免把相同速度编码段在不同旧版子族里误解成同一频率。
- H9HC 子族公开资料仍较分散；H9HQ/H9HR 只对多来源一致的容量 / DRAM 配置 / 接口 / 后缀编码段做表驱动解析，未确认封装编码段的 H9HR 不输出封装。
- H9Q 新 uMCP 与 HN8/H28S 纯 UFS 不是同一类产品，不能并入 UFS 解析器。

## PN 展示

H9HP、H9TP/H9TQ/H9HC 与 H9HQ 在既有 14 字符主体后恢复订购尾部前的 `-`，例如 `H9HP27ADAMADAR-KMM`；H9A/H9Q 的连续写法不插入分隔符。
