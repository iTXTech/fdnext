# Longsys UFS PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Longsys 嵌入式存储页面列出 FORESEE 车规 UFS 与 UFS 产品线。
  <https://www.longsys.com/products/embedded-storage/>
- FORESEE Embedded Storage Product Catalogue 2023 给出 `FEUDNN` / `FEUDME` UFS 订购编码表、容量、UFS 版本、封装和温区。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>
- Longsys 车规 UFS 官方页面交叉确认 `FEUDME064G-B8A19` / `FEUDME128G-B8A19` 为 UFS 2.1 Gear3 2L，`FEUDME128G-C8H09` / `FEUDME256G-C8H09` 为 UFS 3.1 Gear4 2L，封装 `11.5 x 13 x 1.2mm`。
  <https://www.longsys.com/products/embedded-storage/embedded-storage/automotive-ufs.html>
- Lexar Enterprise UFS 2.2 页面列出 `FEUDNN064G-C2G07` / `FEUDNN128G-C2G07` / `FEUDNN256G-C2G07` / `FEUDNN512G-C2G07`，尺寸 `11.5x13x1.0mm`。
  <https://lexarenterprise.com/product/ufs-2-2/>
- Longsys 官方 UFS 产品手册明确 `FEUDNN064G-C2A46` / `128G-C2A44` / `256G-C2A44` 均为 UFS 2.2 HS-Gear3 2L、3D TLC、FBGA-153；64/128GB 厚度 0.8mm，256GB 厚度 1.0mm。来源：<https://longsys.com/uploads/ueditor/file/20221205/1670210267164297.pdf>
- 2023 官方 Embedded Storage Catalogue 还确认 `C2A56` / `C2H14` 系列的 64GB~256GB UFS 2.2 组合，资源已补齐目录差集。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/longsys-ufs-token.json`
- `vendor.longsys.foresee.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEUD` + 系列 + 容量 + 配置 | FORESEE UFS |
| 系列 `NN` | 商业级 UFS |
| 系列 `ME` | 车规 UFS |
| 容量 `064G/128G/256G` | 64GB/128GB/256GB，落库为 Mbit |
| 容量 `512G` | 512GB，来自 Lexar Enterprise UFS 2.2 参考资料 |
| 配置 `C2A56/C2H14/C2A44/C2A46/C2G07` | UFS 2.2 |
| 配置 `B8A19` | UFS 2.1 Gear3 2L |
| 配置 `C8H09` | UFS 3.1 Gear4 2L |

## 参考资料检查

- `FEUDME` 车规 UFS 不能只按 `ME` 判成 UFS 2.1；`C8H09` 已外部确认是 UFS 3.1。
- 配置编码段在规则内部保留完整 5 位，避免 `C2A` / `C2H` 前缀丢掉后两位修订版；不进入公开字段。
- `NN` 封装不能只按系列固定 1.0mm；`064G:C2A46`、`128G:C2A44`、`256G:C2A44` 使用容量+配置组合表。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `FEUDNN128G-C2H14`
- `FEUDME128G-C8H09`
- `FEUDNN512G-C2G07`

## PN 展示

FEU 系列在容量编码后、配置编码前恢复 `-`，例如 `FEUDME064G-B8A19`。
