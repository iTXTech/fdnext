# SanDisk eMCP PN 记录

采集日期：2026-05-08

## 当前结论

本轮未找到 SanDisk 官方公开 eMCP PN ordering table。公开资料主要覆盖 iNAND eMMC、UFS、SD、microSD、SSD 等 embedded storage 产品线，未能确认可解析的 eMCP family token。

2026-05-08 复查 `fdb/fdfdb` 与公开网页后，仍未找到 SanDisk eMCP PN 与本地 flash id 记录的高置信交叉样本；不新增规则。

## 规则状态

暂不新增 DSL 规则。

原因：

- 没有找到原厂 eMCP PN 表。
- 没有足够外部表格能把 SanDisk eMCP token 与 NAND/DRAM 容量、LPDDR 类型、接口版本稳定对应。
- 不能用完整 PN 白名单或二手维修站料号直接作为规则。

## 后续准入要求

进入规则库至少需要满足以下之一：

- 原厂 product brief / datasheet 给出 eMCP ordering information。
- 多个外部表格与本地 `fdb` / `fdfdb` 同向，可标记为 `external_table_confirmed`，并只按 token 结构解析。
