# PN 编码资料索引

采集日期：2026-05-15；更新日期：2026-09-06

本目录收集 eMMC、UFS、eMCP/uMCP、E2NAND/E3NAND、raw NAND 与 DRAM 的 PN 编码资料。README 只保留目录、范围和跨厂商维护原则；任何厂商特定来源、PN 结构、token 表、样例和规则说明都必须放入对应厂商独立文档。

## 文档索引

| 厂商 | Raw NAND | eMMC | UFS | eMCP / uMCP | E2NAND | SATA / NVMe SSD | DRAM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SK hynix | [skhynix_nand.md](skhynix_nand.md) | [skhynix_emmc.md](skhynix_emmc.md) | [skhynix_ufs.md](skhynix_ufs.md) | [skhynix_emcp.md](skhynix_emcp.md) | [skhynix_nand.md](skhynix_nand.md) | - | [skhynix_dram.md](skhynix_dram.md) |
| Samsung | [samsung_nand.md](samsung_nand.md) | [samsung_emmc.md](samsung_emmc.md) | [samsung_ufs.md](samsung_ufs.md) | [samsung_emcp.md](samsung_emcp.md) | - | - | [samsung_dram.md](samsung_dram.md) |
| Silicon Motion | - | [siliconmotion_emmc.md](siliconmotion_emmc.md) | [siliconmotion_ufs.md](siliconmotion_ufs.md) | - | - | - | - |
| SanDisk | [sandisk_raw.md](sandisk_raw.md) | [sandisk_emmc.md](sandisk_emmc.md) | [sandisk_ufs.md](sandisk_ufs.md) | [sandisk_emcp.md](sandisk_emcp.md) | - | [sandisk_issd.md](sandisk_issd.md) | - |
| SpecTek | [spectek_nand.md](spectek_nand.md) | - | - | [spectek_emcp.md](spectek_emcp.md) | - | - | [spectek_dram.md](spectek_dram.md) |
| Intel / Solidigm | [intel_nand.md](intel_nand.md) (NAND / 3D XPoint PN) | - | - | - | - | - | - |
| KIOXIA | [kioxia_nand.md](kioxia_nand.md) (legacy/current raw NAND) | [kioxia_emmc.md](kioxia_emmc.md) | [kioxia_ufs.md](kioxia_ufs.md) | [kioxia_emcp.md](kioxia_emcp.md) | [kioxia_e2nand.md](kioxia_e2nand.md) | - | - |
| Micron | [micron_nand.md](micron_nand.md) (current, legacy, MT29FB HSC, ClearNAND), [micron_xpoint.md](micron_xpoint.md) (3D XPoint) | [micron_emmc.md](micron_emmc.md), [micron_managed.md](micron_managed.md) | [micron_ufs.md](micron_ufs.md), [micron_managed.md](micron_managed.md) | [micron_emcp.md](micron_emcp.md) | - | [micron_ssd.md](micron_ssd.md) | [micron_dram.md](micron_dram.md) (MT/CT/NT/AMD component aliases), [micron_hbm.md](micron_hbm.md), [micron_hmc.md](micron_hmc.md) |
| Phison label | [phison_candidate_rules_report.md](phison_candidate_rules_report.md) | - | - | - | - | - | - |
| Nanya | - | - | - | - | - | - | [nanya_dram.md](nanya_dram.md) |
| Elpida | - | - | - | - | - | - | [elpida_dram.md](elpida_dram.md) |
| CXMT | - | - | - | - | - | - | [cxmt_dram.md](cxmt_dram.md) |
| GigaDevice | - | - | - | - | - | - | [gigadevice_dram.md](gigadevice_dram.md) |
| Winbond | [winbond_nand.md](winbond_nand.md) | - | - | - | - | - | [winbond_dram.md](winbond_dram.md) |
| Macronix | [macronix_nand.md](macronix_nand.md) | - | - | - | - | - | - |
| ESMT | [esmt_nand.md](esmt_nand.md) | [esmt_emmc.md](esmt_emmc.md) | - | - | - | - | [esmt_dram.md](esmt_dram.md) |
| Etron | - | - | - | - | - | - | [etron_dram.md](etron_dram.md) |
| ISSI | [issi_nand.md](issi_nand.md) | [issi_emmc.md](issi_emmc.md) | [issi_ufs.md](issi_ufs.md) | - | - | - | [issi_dram.md](issi_dram.md) |
| YMTC | [ymtc_nand.md](ymtc_nand.md) | [ymtc_emmc.md](ymtc_emmc.md) | [ymtc_ufs.md](ymtc_ufs.md) | - | - | - | - |
| Kingston | - | [kingston_emmc.md](kingston_emmc.md) | [kingston_ufs.md](kingston_ufs.md) | [kingston_emcp.md](kingston_emcp.md) | - | - | - |
| Longsys | [longsys_nand.md](longsys_nand.md) | [longsys_emmc.md](longsys_emmc.md) | [longsys_ufs.md](longsys_ufs.md) | [longsys_emcp.md](longsys_emcp.md) | - | - | [longsys_dram.md](longsys_dram.md) |
| BIWIN | - | [biwin_emmc.md](biwin_emmc.md) | [biwin_ufs.md](biwin_ufs.md) | [biwin_emcp.md](biwin_emcp.md) | - | - | [biwin_dram.md](biwin_dram.md) |

## 跨厂商文档

- [PN 规则编写规范](authoring.md)：结构化 token、封装推导、搜索资源和完成条件
- [DecodePack 资料覆盖审计](coverage_audit.md)
- [DRAM 世代覆盖约定](dram_coverage.md)
- [NAND Die Profile 标准化](nand_die_profile.md)
- [输出术语](terminology.md)
- [PN 规则可信度策略](reference_policy.md)
- [DecodePack 规则证据清单](evidence/decodepack-references.json)

## 通用约定

- 维护规则时按 [编写规范](authoring.md) 处理 token 和搜索资源；字段格式查 [术语](terminology.md)，新增依据查 [可信度策略](reference_policy.md)，验证范围查 [验证指南](../TESTING.md)。仅阅读本次改动涉及的章节。
- Managed NAND 与混合封装必须按具体产品线输出 `emmc`、`ufs`、`emcp`、`umcp`、`e2nand` 或 `e3nand`，不要使用泛化 controller 兜底类型；补充信息放入 `fields`。
- 文档和 canonical PN 中的 `-` / `:` 是 token separator；用户输入按原 token 顺序省略 `-` 时，解析和搜索应按同一 PN 处理。
- 厂商与模组扩展范围遵循根目录 [AGENTS.md](../../AGENTS.md)。获准新增产品线时，在同一改动中提供独立资料文档、规则和必要 testcase，无需为这些本地步骤逐项确认。
