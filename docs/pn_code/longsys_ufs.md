# Longsys UFS PN 编码

采集日期：2026-05-08

## 外部资料

- Longsys embedded storage 页面列出 FORESEE Automotive UFS 与 UFS 产品线。
  <https://www.longsys.com/products/embedded-storage/>
- FORESEE Embedded Storage Product Catalogue 2023 给出 `FEUDNN` / `FEUDME` UFS ordering table、容量、UFS version、封装和温区。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>
- Longsys Automotive UFS 官方页面交叉确认 `FEUDME064G-B8A19` / `FEUDME128G-B8A19` 为 UFS 2.1 Gear3 2L，`FEUDME128G-C8H09` / `FEUDME256G-C8H09` 为 UFS 3.1 Gear4 2L，封装 `11.5 x 13 x 1.2mm`。
  <https://www.longsys.com/products/embedded-storage/embedded-storage/automotive-ufs.html>
- Lexar Enterprise UFS 2.2 页面列出 `FEUDNN064G-C2G07` / `FEUDNN128G-C2G07` / `FEUDNN256G-C2G07` / `FEUDNN512G-C2G07`，尺寸 `11.5x13x1.0mm`。
  <https://lexarenterprise.com/product/ufs-2-2/>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/longsys-ufs-token.json`
- `vendor.longsys.foresee.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEUD` + series + density + config | FORESEE UFS |
| series `NN` | Commercial UFS |
| series `ME` | Automotive UFS |
| density `064G/128G/256G` | 64GB/128GB/256GB，落库为 Mbit |
| density `512G` | 512GB，来自 Lexar Enterprise UFS 2.2 reference |
| config `C2A56/C2H14/C2A44/C2G07` | UFS 2.2 |
| config `B8A19` | UFS 2.1 Gear3 2L |
| config `C8H09` | UFS 3.1 Gear4 2L |

## Reference check

- `FEUDME` 车规 UFS 不能只按 `ME` 判成 UFS 2.1；`C8H09` 已外部确认是 UFS 3.1。
- `config_code` 保留完整 5 位 token，避免 `C2A` / `C2H` 前缀丢掉后两位 revision。

## 输出字段

- `series_code`
- `storage_density`
- `product_family`
- `product_class`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `operation_temperature`

## 测试样例

- `FEUDNN128G-C2H14`
- `FEUDME128G-C8H09`
- `FEUDNN512G-C2G07`
