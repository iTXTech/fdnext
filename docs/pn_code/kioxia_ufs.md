# KIOXIA UFS PN 编码

采集日期：2026-05-08

## 外部资料

- KIOXIA Memory Selector: UFS 4.0/4.1、UFS 3.1、车规 UFS 4.0、车规 UFS 3.1/2.1 表，包含 `THGJFRT3E88BATW`、`THGJFJT1T45BAB8`、`THGAFBT1T83BAA5` 等型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- KIOXIA UFS 产品简介: 汇总 UFS 产品容量、版本和封装。
  <https://europe.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_UFS_Product_Brief.pdf>
- KIOXIA 车规 UFS 官方产品页：确认 UFS 4.1 `THGJFJT0E18BAB8`、`THGJFJT1E28BAB8`、`THGJFJT2E48BAB8`、`THGJFJT3E88BAB5`，容量依次为 128GB / 256GB / 512GB / 1TB，均为 4640 MB/s、AEC-Q100 / 104 等级 2、-40°C 至 105°C；`BAB8` 为 11.5x13.0x1.2，`BAB5` 为 11.5x13.0x1.3。
  <https://www.kioxia.com/en-jp/business/memory/automotive.html>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kioxia-ufs-token.json`
- `vendor.kioxia.ufs.managed.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + 电压(1) + 类型(1) + 控制器修订版(1) + 容量(2) + 单元(1) + 堆叠 die(1) + 设计/代际(1) + 封装/类别/大小 | KIOXIA UFS 受管理闪存；尾部与 eMMC / E2NAND 共用 Toshiba/KIOXIA 受管理 NAND 编码结构 |
| 类型 `F` | UFS |
| 控制器修订版组合 `AFB/AFE` | UFS 2.1 |
| 控制器修订版组合 `JFG/JFP` | UFS 3.1 |
| 控制器修订版组合 `JFM/JFJ` | UFS 4.0；`JFJ` 的单元编码段 `T` 对应车规 UFS 4.0 |
| 控制器修订版组合 `JFR` | UFS 4.1 |
| `JFJ` + 单元编码段 `E` | 车规 UFS 4.1 |
| 容量 `G8/G9/T0/T1/T2/T3` | 32GB/64GB/128GB/256GB/512GB/1TB |
| 单元 `T` | TLC；其他 UFS 单元编码在缺少外部语义表时不输出公开 `cell_level` |
| 堆叠 die `1..9/A/B` | 1-9 die / 12 die / 16 die，输出 `die_count` |
| 设计/代际 `2/3/4/5/6/8/M` | BiCS2/3/4/5/6/8/4.5，输出 `die_codename` |
| 封装后缀 `BA` / 精确 `BAIP/BATV/BATW/BATZ/BAIT` | `fields.package` 输出 BGA 或带尺寸的 BGA 封装，精确后缀优先 |
| 类别 `BAI/BAT` | 消费级 / 工业级, -25°C 至 85°C |
| 类别 `BAB` | 车规 AEC-Q100 等级 2, -40°C 至 105°C |

共用编码段表见 [kioxia_emmc](kioxia_emmc.md#规则状态)；本文仅列该产品线的差异。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
已确认消费级 UFS 封装后缀：

| 后缀 | 封装 |
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

KIOXIA 车规 UFS 4.0 与 4.1 都使用 `JFJ` 控制器版本组合，必须继续结合单元/设计编码段区分；消费级/工业级 UFS 4.0 使用 `JFM`，消费级/工业级 UFS 4.1 使用 `JFR`。
UFS 与 eMMC 遵循同一套 Toshiba/KIOXIA 受管理 NAND 尾部编码：`stacked die` 只输出 `die_count`，其后的设计/代际编码段才用于 BiCS 规格推断。例如 `THGAFBT1T83BAA5` 的 `T83` 表示 TLC、8 die、BiCS3，而不是 BiCS8。

车规 UFS 官方页面给上述 UFS 4.1 PN 的 Vcc 为 2.4V 至 2.7V、VccQ 为 1.14V 至 1.26V，并注明不需要 VccQ2；当前共享 `J` 电压映射仍保留既有 2.7V 至 3.6V / 双 VccQ 范围。两者存在来源冲突，本轮遵循“不覆盖已有映射”约束只记录，不修改公开电压输出，等待专门的系列级电压证据审计。
