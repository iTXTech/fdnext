# KIOXIA e-MMC PN 编码

采集日期：2026-05-13

## 外部资料

- KIOXIA e-MMC product brief: 给出 `THGBMNG5D1LBAIT`、`THGBMUG8C2LBAIL`、`THGAMVT0T43BAIR`、`THGBMJG8C4LBAU8` 等 part number、容量、eMMC 版本、FG NAND / BiCS FLASH、400 MB/s、温区和封装。
  <https://www.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_e-MMC_Product_Brief.pdf>
- KIOXIA Memory Selector: 给出 consumer、industrial、automotive e-MMC 表，包含 `THGAMVT1T83BAB5`、`THGAMVT0T43BAA8` 等 automotive 型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: `NAND w/ controller` 页给出 `THG` 系列中 voltage、interface、controller revision、density、cell level、stacked die、design rule、package、temperature/class 和 package size token 表。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kioxia-managed-token.json`
- `vendor.kioxia.managed.thg.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + voltage(1) + type(1) + controller revision(1) + density(2) + cell(1) + stacked die(1) + design rule(1) + package/class/size | Toshiba/KIOXIA NAND with controller shared form |
| type `M` | eMMC |
| voltage `V/Y/A/B/D` | Vcc/VccQ 组合 |
| controller revision | one-character unique controller revision code |
| density `M8/M9/G0..G9/GA/GB/GC/GD/GE/GF/T0/T1` | 256Mbit 到 2Tbit |
| cell `S/D/T` | SLC / MLC / TLC |
| stacked die `1..9/A/B` | 1-9 die / 12 die / 16 die |
| `BMN/BMT` | eMMC 5.0, FG NAND |
| `BMU/BMJ` | eMMC 5.1, FG NAND |
| `AMV/AMS` | eMMC 5.1, BiCS FLASH |
| FG design rule `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z |
| BiCS stack/design token `2/3/4/5/6/8/M` | BiCS2/3/4/5/6/8/4.5 |
| package `FT/TG/TA/XB/XG/BA/XL/LA` | TSOP / BGA / LGA plus lead-free and halogen-free flags |
| package size code `0/1/2/3/6/8/9/B/E/F/G/H/I/J/K` | TSOP/LGA/BGA size table from the Toshiba decoder |
| class `BAI` | Consumer, -25°C to 85°C |
| class `BAU` | Industrial, -40°C to 105°C |
| class `BAC/BAB` | Automotive AEC-Q100 Grade 2, -40°C to 105°C |
| class `BAA` | Automotive AEC-Q100 Grade 3, -40°C to 85°C |

## 输出字段

- `storage_interface`
- `density`
- `cell_level`
- `process_node`
- `voltage`
- `controller_revision`
- `die_stack`
- `package`
- `lead_free`
- `halogen_free`
- `speed_grade`
- `nand_technology`
- `product_class`

`package_code` 等 Toshiba/KIOXIA decoder token 只用于内部解析，不进入公开字段。
- `operation_temperature`

## 测试样例

- `THGBMNG5D1LBAIT`
- `THGBM2G9DBFBAI2`
- `THGAMVT0T43BAB8`

## 注意

KIOXIA `THG*` 还覆盖 UFS 和 E2NAND，不能只靠 `THG` 前缀判断。当前共享规则中，`THGxM` 的第二个 code `M` 才输出 eMMC；`THGxR` / `THGxX` 输出 E2NAND/SmartNAND。`THGxX` 的第一个 `x` 仍只按 voltage 解释。

eMMC 仍保留既有 2D/BiCS 制程表：FG NAND 从 design rule token 推定 2D 制程，BiCS 系列从 stacked/design token 推定 BiCS 代际。推定结果写入 `fields.process_node`，并保留规则内 `generation_info` 表供审计；公开结果中与 `process_node` 重复的 `generation_info` 会由 core 去重。
