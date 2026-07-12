# PN 编码资料索引

采集日期：2026-05-15

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
| Micron | [micron_nand.md](micron_nand.md) (current, legacy, MT29FB HSC), [micron_xpoint.md](micron_xpoint.md) (3D XPoint) | [micron_emmc.md](micron_emmc.md) | [micron_ufs.md](micron_ufs.md) | [micron_emcp.md](micron_emcp.md) | - | [micron_ssd.md](micron_ssd.md) | [micron_dram.md](micron_dram.md), [micron_hbm.md](micron_hbm.md), [micron_hmc.md](micron_hmc.md) |
| Phison label | [phison_candidate_rules_report.md](phison_candidate_rules_report.md) | - | - | - | - | - | - |
| Nanya | - | - | - | - | - | - | [nanya_dram.md](nanya_dram.md) |
| Elpida | - | - | - | - | - | - | [elpida_dram.md](elpida_dram.md) |
| CXMT | - | - | - | - | - | - | [cxmt_dram.md](cxmt_dram.md) |
| GigaDevice | - | - | - | - | - | - | [gigadevice_dram.md](gigadevice_dram.md) |
| ISSI | - | - | - | - | - | - | [issi_dram.md](issi_dram.md) |
| Winbond | [winbond_nand.md](winbond_nand.md) | - | - | - | - | - | [winbond_dram.md](winbond_dram.md) |
| ESMT | [esmt_nand.md](esmt_nand.md) | [esmt_emmc.md](esmt_emmc.md) | - | - | - | - | [esmt_dram.md](esmt_dram.md) |
| Etron | - | - | - | - | - | - | [etron_dram.md](etron_dram.md) |
| ISSI | - | [issi_emmc.md](issi_emmc.md) | [issi_ufs.md](issi_ufs.md) | - | - | - | [issi_dram.md](issi_dram.md) |
| YMTC | [ymtc_nand.md](ymtc_nand.md) | [ymtc_emmc.md](ymtc_emmc.md) | [ymtc_ufs.md](ymtc_ufs.md) | - | - | - | - |
| Kingston | - | [kingston_emmc.md](kingston_emmc.md) | [kingston_ufs.md](kingston_ufs.md) | [kingston_emcp.md](kingston_emcp.md) | - | - | - |
| Longsys | [longsys_nand.md](longsys_nand.md) | [longsys_emmc.md](longsys_emmc.md) | [longsys_ufs.md](longsys_ufs.md) | [longsys_emcp.md](longsys_emcp.md) | - | - | [longsys_dram.md](longsys_dram.md) |
| BIWIN | - | [biwin_emmc.md](biwin_emmc.md) | [biwin_ufs.md](biwin_ufs.md) | [biwin_emcp.md](biwin_emcp.md) | - | - | [biwin_dram.md](biwin_dram.md) |

## 跨厂商文档

- [DecodePack 资料覆盖审计](coverage_audit.md)
- [DRAM 世代覆盖约定](dram_coverage.md)
- [NAND Die Profile 标准化](nand_die_profile.md)
- [输出术语](terminology.md)
- [PN 规则可信度策略](reference_policy.md)
- [DecodePack 规则证据清单](evidence/decodepack-references.json)

## 通用约定

- iTXTech fdnext DecodePack 中 `density` 继续使用项目现有单位：Mbit。
- Managed NAND 与混合封装必须按具体产品线输出 `emmc`、`ufs`、`emcp`、`umcp`、`e2nand` 或 `e3nand`，不要使用泛化 controller 兜底类型；补充信息放入 `fields`。
- 规则实现禁止完整 PN 白名单匹配，只允许按 PN 结构切 token，再用规则库解释已知 token。
- 文档和 canonical PN 中的 `-` / `:` 是 token separator；用户输入按原 token 顺序省略 `-` 时，解析和搜索应按同一 PN 处理。
- 未知 token 不应阻断 vendor、type、density 等已能确定字段的解析。
- 用户可见字段统一使用跨厂商 canonical key；厂商原始 token 只在确实参与解析时留在规则内部，可信度、来源和外部确认状态统一放入 `evidence/decodepack-references.json` 或厂商文档，禁止放入 iTXTech fdnext DecodePack。
- 新增厂商或产品线时，先创建独立文档，再补 iTXTech fdnext DecodePack pack 和 testcase。
