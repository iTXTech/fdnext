# KIOXIA e-MMC PN 编码

采集日期：2026-05-08

## 外部资料

- KIOXIA e-MMC product brief: 给出 `THGBMNG5D1LBAIT`、`THGBMUG8C2LBAIL`、`THGAMVT0T43BAIR`、`THGBMJG8C4LBAU8` 等 part number、容量、eMMC 版本、FG NAND / BiCS FLASH、400 MB/s、温区和封装。
  <https://www.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_e-MMC_Product_Brief.pdf>
- KIOXIA Memory Selector: 给出 consumer、industrial、automotive e-MMC 表，包含 `THGAMVT1T83BAB5`、`THGAMVT0T43BAA8` 等 automotive 型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/kioxia-emmc-token.json`
- `vendor.kioxia.emmc.managed.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + series(3) + density(2) + package/revision/class | KIOXIA e-MMC managed flash |
| series `BMN/BMT` | eMMC 5.0, FG NAND |
| series `BMU/BMJ` | eMMC 5.1, FG NAND |
| series `AMV/AMS` | eMMC 5.1, BiCS FLASH |
| density `G5/G6/G7/G8/G9/T0/T1` | 4GB/8GB/16GB/32GB/64GB/128GB/256GB |
| class `BAI` | Consumer, -25°C to 85°C |
| class `BAU` | Industrial, -40°C to 105°C |
| class `BAC/BAB` | Automotive AEC-Q100 Grade 2, -40°C to 105°C |
| class `BAA` | Automotive AEC-Q100 Grade 3, -40°C to 85°C |

## 输出字段

- `series_code`
- `product_version`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `product_class`
- `operation_temperature`

## 测试样例

- `THGBMNG5D1LBAIT`
- `THGAMVT0T43BAB8`

## 注意

KIOXIA `THG*` 还覆盖 UFS，不能只靠 `THG` 前缀判断。当前规则按 `BM*` / `AM*` series 进入 eMMC pack。

