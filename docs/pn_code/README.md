# PN 编码资料索引

采集日期：2026-05-15；更新日期：2026-09-06

本目录收集 eMMC、UFS、eMCP/uMCP、E2NAND/E3NAND、裸 NAND 与 DRAM 的 PN 编码资料。README 只保留目录和维护入口；任何厂商特定来源、PN 结构、编码段表、样例和规则说明都必须放入对应厂商独立文档。

## 文档索引

| 厂商 | 裸 NAND | eMMC | UFS | eMCP / uMCP | E2NAND | SATA / NVMe SSD | DRAM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SK hynix | [skhynix_nand.md](skhynix_nand.md) | [skhynix_emmc.md](skhynix_emmc.md) | [skhynix_ufs.md](skhynix_ufs.md) | [skhynix_emcp.md](skhynix_emcp.md) | [skhynix_nand.md](skhynix_nand.md) | - | [skhynix_dram.md](skhynix_dram.md) |
| Samsung | [samsung_nand.md](samsung_nand.md) | [samsung_emmc.md](samsung_emmc.md) | [samsung_ufs.md](samsung_ufs.md) | [samsung_emcp.md](samsung_emcp.md) | - | - | [samsung_dram.md](samsung_dram.md) |
| Silicon Motion | - | [siliconmotion_emmc.md](siliconmotion_emmc.md) | [siliconmotion_ufs.md](siliconmotion_ufs.md) | - | - | - | - |
| SanDisk | [sandisk_raw.md](sandisk_raw.md) | [sandisk_emmc.md](sandisk_emmc.md) | [sandisk_ufs.md](sandisk_ufs.md) | [sandisk_emcp.md](sandisk_emcp.md) | - | [sandisk_issd.md](sandisk_issd.md) | - |
| SpecTek | [spectek_nand.md](spectek_nand.md) | - | - | [spectek_emcp.md](spectek_emcp.md) | - | - | [spectek_dram.md](spectek_dram.md) |
| Intel / Solidigm | [intel_nand.md](intel_nand.md) (NAND / 3D XPoint PN) | - | - | - | - | - | - |
| KIOXIA | [kioxia_nand.md](kioxia_nand.md) (旧版/当前版裸 NAND) | [kioxia_emmc.md](kioxia_emmc.md) | [kioxia_ufs.md](kioxia_ufs.md) | [kioxia_emcp.md](kioxia_emcp.md) | [kioxia_e2nand.md](kioxia_e2nand.md) | - | - |
| Micron | [micron_nand.md](micron_nand.md) (当前版, 旧版, MT29FB HSC, ClearNAND), [micron_xpoint.md](micron_xpoint.md) (3D XPoint) | [micron_emmc.md](micron_emmc.md), [micron_managed.md](micron_managed.md) | [micron_ufs.md](micron_ufs.md), [micron_managed.md](micron_managed.md) | [micron_emcp.md](micron_emcp.md) | - | [micron_ssd.md](micron_ssd.md) | [micron_dram.md](micron_dram.md) (MT/CT/NT/AMD 芯片别名), [micron_hbm.md](micron_hbm.md), [micron_hmc.md](micron_hmc.md) |
| Phison 标签 | [phison_candidate_rules_report.md](phison_candidate_rules_report.md) | - | - | - | - | - | - |
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

- [PN 规则编写规范](authoring.md)：结构化编码段、封装推导、搜索资源和完成条件
- [DecodePack 资料覆盖审计](coverage_audit.md)
- [DRAM 世代覆盖约定](dram_coverage.md)
- [NAND die 规格标准化](nand_die_profile.md)
- [输出术语](terminology.md)
- [PN 规则可信度策略](reference_policy.md)
- [DecodePack 规则证据清单](evidence/decodepack-references.json)

## 维护入口

- 编码段和资源维护：[编写规范](authoring.md)
- 产品类别、组件与字段：[术语](terminology.md)
- 新增依据：[可信度策略](reference_policy.md)
- 验证范围：[验证指南](../TESTING.md)
- 厂商和模组扩展授权：[AGENTS.md](../../AGENTS.md)

## 历史审计

- [跨字段信息治理](field_information_audit.md)
- [FDB 87 PN↔ID 匹配审计](evidence/pn-flash-id-matching-2026-09.md)
