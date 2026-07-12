# KIOXIA UFS PN 编码

采集日期：2026-05-08

## 外部资料

- KIOXIA Memory Selector: UFS 4.0/4.1、UFS 3.1、automotive UFS 4.0、automotive UFS 3.1/2.1 表，包含 `THGJFRT3E88BATW`、`THGJFJT1T45BAB8`、`THGAFBT1T83BAA5` 等型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- KIOXIA UFS product brief: 汇总 UFS 产品容量、版本和 package。
  <https://europe.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_UFS_Product_Brief.pdf>
- KIOXIA Automotive UFS 官方产品页：确认 UFS 4.1 `THGJFJT0E18BAB8`、`THGJFJT1E28BAB8`、`THGJFJT2E48BAB8`、`THGJFJT3E88BAB5`，容量依次为 128GB / 256GB / 512GB / 1TB，均为 4640 MB/s、AEC-Q100 / 104 Grade 2、-40°C 至 105°C；`BAB8` 为 11.5x13.0x1.2，`BAB5` 为 11.5x13.0x1.3。
  <https://www.kioxia.com/en-jp/business/memory/automotive.html>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kioxia-ufs-token.json`
- `vendor.kioxia.ufs.managed.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + voltage(1) + type(1) + controller revision(1) + density(2) + cell(1) + stacked die(1) + design/generation(1) + package/class/size | KIOXIA UFS managed flash；尾部与 eMMC / E2NAND 共用 Toshiba/KIOXIA managed NAND 编码结构 |
| type `F` | UFS |
| controller revision 组合 `AFB/AFE` | UFS 2.1 |
| controller revision 组合 `JFG/JFP` | UFS 3.1 |
| controller revision 组合 `JFM/JFJ` | UFS 4.0；`JFJ` 的 cell token `T` 对应 automotive UFS 4.0 |
| controller revision 组合 `JFR` | UFS 4.1 |
| `JFJ` + cell token `E` | Automotive UFS 4.1 |
| density `G8/G9/T0/T1/T2/T3` | 32GB/64GB/128GB/256GB/512GB/1TB |
| cell `T` | TLC；其他 UFS cell code 在缺少外部语义表时不输出公开 `cell_level` |
| stacked die `1..9/A/B` | 1-9 die / 12 die / 16 die，输出 `die_count` |
| design/generation `2/3/4/5/6/8/M` | BiCS2/3/4/5/6/8/4.5，输出 `die_codename` |
| package suffix `BA` / exact `BAIP/BATV/BATW/BATZ/BAIT` | `fields.package` 输出 BGA 或带尺寸的 BGA package，精确后缀优先 |
| class `BAI/BAT` | Consumer / Industrial, -25°C to 85°C |
| class `BAB` | Automotive AEC-Q100 Grade 2, -40°C to 105°C |
| class `BAA` | Automotive AEC-Q100 Grade 3, -40°C to 85°C |

## 输出字段

- `product_version`
- `storage_interface`
- `speed_grade`
- `voltage`
- `cell_level`
- `die_count`
- `die_codename`
- `controller_revision`
- `product_class`
- `operation_temperature`

已确认 consumer UFS package suffix：

| suffix | package |
| --- | --- |
| `BAIP` | `BGA (11.0 x 13.0 x 0.8)` |
| `BATV` | `BGA (9.0 x 13.0 x 0.8)` |
| `BATW` | `BGA (9.0 x 13.0 x 0.85)` |
| `BATZ` | `BGA (9.0 x 13.0 x 0.9)` |
| `BAA8/BAB8` | `BGA (11.5 x 13.0 x 1.2)` |
| `BAA5/BAB5` | `BGA (11.5 x 13.0 x 1.3)` |

## 测试样例

- `THGJFPT0E18BAIP`
- `THGJFPT1E28BAIP`
- `THGJFPT2E48BAIP`
- `THGJFMT1E45BATV`
- `THGJFMT2E46BATV`
- `THGJFMT3E86BATZ`
- `THGJFRT1E45BATV`
- `THGJFRT2E48BATV`
- `THGJFRT3E88BATW`
- `THGJFJT1T45BAB8`
- `THGJFJT0E18BAB8`
- `THGJFJT1E28BAB8`
- `THGJFJT2E48BAB8`
- `THGJFJT3E88BAB5`
- `THGAFBT1T83BAA5`

## 注意

KIOXIA automotive UFS 4.0 与 4.1 都使用 `JFJ` 控制器版本组合，必须继续结合 cell/design token 区分；consumer/industrial UFS 4.0 使用 `JFM`，consumer/industrial UFS 4.1 使用 `JFR`。
UFS 与 eMMC 遵循同一套 Toshiba/KIOXIA managed NAND 尾部编码：`stacked die` 只输出 `die_count`，其后的 design/generation token 才用于 BiCS profile 推断。例如 `THGAFBT1T83BAA5` 的 `T83` 表示 TLC、8 die、BiCS3，而不是 BiCS8。

Automotive UFS 官方页面给上述 UFS 4.1 PN 的 Vcc 为 2.4V 至 2.7V、VccQ 为 1.14V 至 1.26V，并注明不需要 VccQ2；当前共享 `J` voltage mapping 仍保留既有 2.7V 至 3.6V / 双 VccQ 范围。两者存在来源冲突，本轮遵循“不覆盖已有 mapping”约束只记录，不修改公开 voltage 输出，等待专门的系列级电压证据审计。
