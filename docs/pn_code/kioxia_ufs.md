# KIOXIA UFS PN 编码

采集日期：2026-05-08

## 外部资料

- KIOXIA Memory Selector: UFS 4.0/4.1、UFS 3.1、automotive UFS 4.0、automotive UFS 3.1/2.1 表，包含 `THGJFRT3E88BATW`、`THGJFJT1T45BAB8`、`THGAFBT1T83BAA5` 等型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- KIOXIA UFS product brief: 汇总 UFS 产品容量、版本和 package。
  <https://europe.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_UFS_Product_Brief.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kioxia-ufs-token.json`
- `vendor.kioxia.ufs.managed.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + series(3) + density(2) + package/revision/class | KIOXIA UFS managed flash |
| series `AFB/AFE` | UFS 2.1 |
| series `JFG/JFP` | UFS 3.1 |
| series `JFM/JFJ` | UFS 4.0 |
| series `JFR` | UFS 4.1 |
| density `G8/G9/T0/T1/T2/T3` | 32GB/64GB/128GB/256GB/512GB/1TB |
| package/revision 第 2 位 `2/3/4/5/6/8/M` | 复用 raw NAND 工艺映射，输出 `BiCS2/3/4/5/6/8/4.5` |
| package suffix `BA` / exact `BAIT` | `fields.package` 输出 `BGA` / `BGA153`，精确后缀优先 |
| class `BAI/BAT` | Consumer / Industrial, -25°C to 85°C |
| class `BAB` | Automotive AEC-Q100 Grade 2, -40°C to 105°C |
| class `BAA` | Automotive AEC-Q100 Grade 3, -40°C to 85°C |

## 输出字段

- `product_version`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `product_class`
- `operation_temperature`

## 测试样例

- `THGJFRT3E88BATW`
- `THGJFJT1T45BAB8`
- `THGAFBT1T83BAA5`

## 注意

KIOXIA automotive UFS 4.0 使用 `JFJ` series；consumer/industrial UFS 4.0 使用 `JFM` series；UFS 4.1 当前使用 `JFR` series。
BiCS generation 优先从 package/revision token 的第 2 位推定，并映射到 `KBiCS*` 这类 `fields.die_codename`。未知 code 仍回退为 `BiCS FLASH` 这类非 profile 线索时，不输出 die profile。
