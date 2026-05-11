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
| FG NAND package/revision 末位 `A/B/C/D/E/F/G/H/J/K/L` | 复用 raw NAND 2D 制程映射，输出 `130 nm` 到 `15 nm/1z`，例如 `K=A19 nm/1y`、`L=15 nm/1z` |
| BiCS package/revision 第 2 位 `2/3/4/5/6/8/M` | 复用 raw NAND BiCS 映射，输出 `BiCS2/3/4/5/6/8/4.5` |
| package suffix `BA` / exact `BAIT` | `fields.package` 输出 `BGA` / `BGA153`，精确后缀优先 |
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
FG NAND 系列从 package/revision token 末位推定 2D 制程；BiCS 系列从第 2 位推定 BiCS 代际。推定结果写入 `fields.process_node`，不在 `fields` 里重复输出 `generation_info`。未知 code 仍回退为 `FG NAND` / `BiCS FLASH`。
