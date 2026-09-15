# DecodePack 外部资料覆盖审计

审计日期：2026-08-27

## 2026-08-27 仓库 PN 运行时审计

操作方法与状态分类见 [PN 资源覆盖审计](../TESTING.md#pn-资源覆盖审计)。以下均为 2026-08-27 快照。

本轮规则落地后的仅解码器唯一 PN 结果：

| 来源 | 唯一 PN | 语义匹配 | 仅身份 | 未找到 | 有意省略 | 未分类待办项 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DRAM PN | 3169 | 3168 | 1 | 0 | 1 | 0 |
| 受管理 NAND PN | 891 | 890 | 1 | 0 | 1 | 0 |
| Micron MDB | 15338 | 14984 | 321 | 33 | 7 | 347 |
| SpecTek MDB（逗号分隔 PN 已拆分） | 2882 | 2740 | 0 | 142 | 0 | 142 |

相较第 1～5 项完成时，Micron MDB 语义匹配从 14874 增至 14984（+110），
未分类待办项从 457 降至 347。其中包括仅输出产品组合、容量或部分芯片
字段的保守解析，不等同于每条 PN 全字段已知。

Micron MDB 的首要待办项已收敛为 `MT63G` 73、`MT29Z` 52、`MT29C` 25、
`MT43T` 17、`MTFC` 17、`MT55J` 13、`MT59D` 12 和 `MTFCBA` 12。已确认的
`MT29D` / ClearNAND / `N2M400` / `MT30A` 以及受限 `NT` / `CT` / `EM` / `SCM`
命名空间已进入结构化规则；`AMD` 仍存在 归属冲突，不依 Micron 映射分组 猜测。

## 2026-08-27 研究分组

研究分为旧版 MCP/AiO、受管理 NAND/uMCP、裸 NAND/ClearNAND/特殊 DRAM 三组。具体证据和编码段结论已归入产品线文章：

| 当时研究对象 | 数量或样本范围 | 唯一资料入口 |
| --- | --- | --- |
| MT29C / MT29D / MT29Z | 26 / 39 / 52 条 | [Micron MCP 待办项](micron_emcp.md#2026-08-27-旧版待办项研究) |
| MT29FCA/FEN | ClearNAND / Enhanced ClearNAND | [Micron NAND](micron_nand.md) |
| N2M | 8 条 | [Micron eMMC](micron_emmc.md) |
| MTFCBA | 12 条 | [MTFC 边界](micron_managed.md#注意) |
| MT30A | 12 条 | [Micron uMCP](micron_emcp.md) |
| MTFC BG / 1T5 | 芯片与容量候选 | [UFS](micron_ufs.md#扩展分支与协议确认)、[未知 MTFC](micron_managed.md#注意) |
| MT43T/M/D、MT55J/D、MT59、MT63G、SCM/CT/NT/EM/AMD | 特殊命名空间 | [Micron DRAM](micron_dram.md#2026-08-27-特殊命名空间边界)、[SpecTek DRAM](spectek_dram.md) |

## 本轮范围

本轮按现有厂商审计以下芯片级产品：独立 DRAM（含 HBM/GDDR/LPDDR）、并行裸 NAND、NAND Flash ID、eMMC、UFS、eMCP/uMCP/ePoP、E2NAND/E3NAND、芯片级 BGA 受管理 NAND、控制器分类与丝印。

当次明确排除新增厂商、SPI NAND 扩展和 RLDRAM2；此前已有 SPI NAND 规则保留。长期授权边界见 [AGENTS.md](../../AGENTS.md)，规则准入见 [编写规范](authoring.md)。

## 当次资源与规则检查

- DRAM / 受管理 NAND 搜索资源的重复 PN 与厂商缺失均为 0，Micron MDB 精确 / 后缀边界去重通过。
- 当时有意省略搜索种子为 `H5WG6HMN6QX038R` 与 `HN8T039JHQX099N`，各自资料边界见 [SK hynix DRAM](skhynix_dram.md) 和 [UFS](skhynix_ufs.md)。`CXDR4FFBM-CS-A` 的已知/未知编码段见 [CXMT](cxmt_dram.md)。
- FDB / IDDB 中 165 个控制器全部在 `controller-groups.json`；`all` 另含 2 个外部已知控制器，167 个均已分类。
- 对所有 `partSpecs.match.value` 的资源 PN 扫描未发现完整 PN 命中；DecodePack 检查器与元数据审计通过。

## 当次新增量与资料归属

此表只保存研究和验证数量；物理参数与编码段映射不在审计报告中再维护一份。

| 厂商 | 当次记录的数量 | 规则与来源 |
| --- | --- | --- |
| Samsung | eMMC 11 条搜索 PN；旧版 eMCP 6 条；HBM 4 条规则、22 条 PN；3 组旧版 ID 规格 | [DRAM](samsung_dram.md)、[eMMC](samsung_emmc.md)、[eMCP](samsung_emcp.md)、[UFS](samsung_ufs.md)、[NAND](samsung_nand.md) |
| SK hynix | 旧版 2Gbit 的 4 种电压/位宽回归；2 条 GDDR7 完整 PN | [DRAM](skhynix_dram.md)、[NAND](skhynix_nand.md)、[eMCP](skhynix_emcp.md)、[UFS](skhynix_ufs.md) |
| Micron | 12 组 eMMC 系列；eMMC/UFS 新增 42 条 PN，排除 2 条异常；审计 MCP 15+14 条、DRAM 519+1238 条，新增受管理 6 条、DRAM 67 条；复查 NAND MCP 96 条，搜索缺口为 0；HBM2E 16 条 PN；2 条 Y62P PN、2 个 ESMT 来源 ID | [eMMC](micron_emmc.md)、[UFS](micron_ufs.md)、[MCP](micron_emcp.md)、[DRAM](micron_dram.md)、[HBM](micron_hbm.md)、[NAND](micron_nand.md) |
| YMTC | 2 条 UFS 实机/器件表样本 | [UFS](ymtc_ufs.md)、[NAND](ymtc_nand.md) |
| CXMT | 持续补全外部完整 PN，未单独统计新增量 | [DRAM](cxmt_dram.md) |
| BIWIN | 未单独统计 | [DRAM](biwin_dram.md)、[eMMC](biwin_emmc.md)、[MCP](biwin_emcp.md) |
| Longsys / FORESEE | 未单独统计 | [DRAM](longsys_dram.md)、[eMMC](longsys_emmc.md)、[UFS](longsys_ufs.md)、[MCP](longsys_emcp.md) |
| ESMT | 12 个完整五字节 Read ID 字节组合 | [NAND](esmt_nand.md)、[eMMC](esmt_emmc.md) |
| KIOXIA | eMMC 7 条搜索 PN；5 组并行 SLC 字节组合；车规 UFS 4.1 全容量回归 | [NAND](kioxia_nand.md)、[eMMC](kioxia_emmc.md)、[UFS](kioxia_ufs.md) |
| SanDisk | 未单独统计 | [eMMC](sandisk_emmc.md)、[MCP](sandisk_emcp.md) |
| Intel / SpecTek | 未单独统计 | [Intel NAND](intel_nand.md)、[SpecTek NAND](spectek_nand.md) |
| Winbond | 16 条 LPDDR4/4X PN；23 组完整 Read ID 规格 | [DRAM](winbond_dram.md)、[NAND](winbond_nand.md) |
| Macronix | 按规格复核，未单独统计数量 | [NAND](macronix_nand.md) |
| ISSI | 6 条完整 Read ID 几何参数 | [NAND](issi_nand.md) |
| Nanya | 11 个芯片页面、364 个 PN，新增 178 条；封装/速度/等级缺口为 0 | [DRAM](nanya_dram.md) |

## 当次未解决资料的后续入口

候选继续保留在相应产品线文章；以下只记录移交方向，后续状态以该文章为准。

- Samsung HBM4、V9/V10：[DRAM](samsung_dram.md)、[NAND](samsung_nand.md)
- SK hynix HBM3E/HBM4、V9T/V9Q：[DRAM](skhynix_dram.md)、[NAND](skhynix_nand.md)
- Micron HBM4、未知 MTFC 组合：[HBM](micron_hbm.md)、[受管理 NAND](micron_managed.md)
- CXMT / GigaDevice / Longsys LPDDR：[CXMT](cxmt_dram.md)、[GigaDevice](gigadevice_dram.md)、[Longsys](longsys_dram.md)
- YMTC UC341 / YMN 候选：[UFS](ymtc_ufs.md)、[NAND](ymtc_nand.md)
- KIOXIA / SanDisk eMCP：[KIOXIA](kioxia_emcp.md)、[SanDisk](sandisk_emcp.md)
- SanDisk 封装待确认项：[eMMC](sandisk_emmc.md)、[UFS](sandisk_ufs.md)

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-05-12 网络补全只刷新非 Micron 完整 PN：Samsung DDR4 Product Guide、SK hynix DDR4/DDR5 数据手册 / 列表、Nanya 官方产品列表、CXMT LCSC 完整 PN 列表、ESMT / Etron 官方产品表。ISSI / Winbond 已由官方 PSG 批量展开，Micron 继续由 `mdb.json` / Micron FBGA 路径覆盖。
