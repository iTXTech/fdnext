# KIOXIA e-MMC PN 编码

采集日期：2026-05-13

## 外部资料

- KIOXIA e-MMC 产品简介: 给出 `THGBMNG5D1LBAIT`、`THGBMUG8C2LBAIL`、`THGAMVT0T43BAIR`、`THGBMJG8C4LBAU8` 等料号、容量、eMMC 版本、FG NAND / BiCS 闪存、400 MB/s、温区和封装。
  <https://www.kioxia.com/content/dam/kioxia/shared/business/memory/mlc-nand/asset/productbrief/KIOXIA_e-MMC_Product_Brief.pdf>
- KIOXIA Memory Selector: 给出消费级、工业级、车规 e-MMC 表，包含 `THGAMVT1T83BAB5`、`THGAMVT0T43BAA8` 等车规型号。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- KIOXIA Embedded Flash Memory 产品手册给出车规 e-MMC 5.1 的等级 2 / 等级 3 全容量产品系列：`THGAMVG8T13BAB7` / `THGAMVG8T13BAA7`、`THGAMVG9T23BAB8` / `THGAMVG9T23BAA8`、`THGAMVT0T43BAB8` / `THGAMVT0T43BAA8`、`THGAMVT1T83BAB5` / `THGAMVT1T83BAA5`，分别覆盖 32GB / 64GB / 128GB / 256GB。上述完整 PN 只进入搜索资源和测试用例，公开字段仍由既有局部编码段规则解析。
  <https://my.avnet.com/wcm/connect/f6654e9b-a0e2-4424-80ca-8928280e5c8c/KIOXIA%2BEmbedded%2BFlash%2BMemory%2BBrochure.pdf?CACHE=NONE&CVID=oW06hid&ContentCache=NONE&MOD=AJPERES>
- KIOXIA 当前版 e-MMC 产品表: 给出 BiCS5 `THGAMSG9T15BAIL` / `THGAMST0T25BAIL`、容量和 `11.5x13.0x0.8` 封装。
  <https://europe.kioxia.com/en-europe/business/memory/mlc-nand/emmc.html>
- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: `NAND w/ controller` 页给出 `THG` 系列中电压、接口、控制器修订版、容量、单元类型、堆叠 die、工艺规则、封装、温度/类别和封装尺寸编码段表。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kioxia-managed-token.json`
- `vendor.kioxia.managed.thg.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG` + 电压(1) + 类型(1) + 控制器修订版(1) + 容量(2) + 单元(1) + 堆叠 die(1) + 工艺规则(1) + 封装/类别/大小 | Toshiba/KIOXIA 带控制器的 NAND 共享结构 |
| 类型 `M` | eMMC |
| 电压 `V/Y/A/B/D` | Vcc/VccQ 组合 |
| 控制器修订版 | 用单个字符表示唯一的控制器修订版 |
| 容量 `M8/M9/G0..G9/GA/GB/GC/GD/GE/GF/T0/T1` | 256Mbit 到 2Tbit |
| 单元 `S/D/T` | SLC / MLC / TLC |
| 堆叠 die `1..9/A/B` | 1-9 die / 12 die / 16 die |
| `BMN/BMT` | eMMC 5.0, FG NAND |
| `BMU/BMJ` | eMMC 5.1, FG NAND |
| `AMV/AMS` | eMMC 5.1, BiCS 闪存 |
| FG 工艺规则 `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z |
| BiCS 设计/代际编码段 `2/3/4/5/6/8/M` | BiCS2/3/4/5/6/8/4.5；该编码段位于堆叠 die 之后 |
| 封装 `FT/TG/TA/XB/XG/BA/XL/LA` | TSOP / BGA / LGA，以及无铅和无卤标记 |
| 封装后缀 `BAIL` | `BGA, 11.5x13x0.8` |
| 封装尺寸编码 `0/1/2/3/6/8/9/B/E/F/G/H/I/J/K` | Toshiba 解码器中的 TSOP/LGA/BGA 尺寸表 |
| 类别 `BAI` | 消费级, -25°C 至 85°C |
| 类别 `BAU` | 工业级, -40°C 至 105°C |
| 类别 `BAC/BAB` | 车规 AEC-Q100 等级 2, -40°C 至 105°C |
| 类别 `BAA` | 车规 AEC-Q100 等级 3, -40°C 至 85°C |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
解码器编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `THGBMNG5D1LBAIT`
- `THGBM2G9DBFBAI2`
- `THGAMVT0T43BAB8`
- `THGAMVT1T83BAB5`
- `THGAMVT0T43BAA8`
- `THGAMSG9T15BAIL`

## 注意

KIOXIA `THG*` 还覆盖 UFS 和 E2NAND，不能只靠 `THG` 前缀判断。当前共享规则中，`THGxM` 的第二个编码 `M` 才输出 eMMC；`THGxR` / `THGxX` 输出 E2NAND/SmartNAND。`THGxX` 的第一个 `x` 仍只按电压解释。

eMMC 的 2D FG NAND 与 BiCS 闪存共用同一套 `density + cell + stacked die + design/generation` 尾部结构：`stacked die` 只输出 `die_count`，BiCS 系列从其后的设计/代际编码段推定 `KBiCS*` 这类 `die_codename`。2D FG NAND 没有稳定 die 规格时不再退回输出旧制程文本。
