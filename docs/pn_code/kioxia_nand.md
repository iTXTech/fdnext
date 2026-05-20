# KIOXIA Raw NAND PN 编码

采集日期：2026-05-13

## 外部资料

- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: raw NAND large-block 页给出 `TC58` / `TH58` 单/多芯片、NAND interface、voltage、density、cell level、width/page/block、design rule、package、channel/CE 和 package size token。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kioxia-raw-token.json`
- `vendor.kioxia.token.tc.v1`
- `vendor.kioxia.token.th.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC58/TH58` + interface + voltage + density + cell + width + process + package + channel/CE + package size | Toshiba/KIOXIA raw NAND large-block form |
| prefix `TC58` / `TH58` | single-chip / multi-chip |
| interface/flag `N/D/T` | token position from Toshiba raw NAND decoder; `T` marks Toggle mode internally, current rule also recognizes `L`; no public `interface_type` output |
| voltage `V/Y/A/B/D` | Vcc/VccQ 组合 |
| density `M8/M9/G0..G9/GA/GB/GC/GD/GE/GF/T0/T1` | 256Mbit 到 2Tbit |
| cell `S/H` | SLC |
| cell `D/E/J/C` | MLC |
| cell `T/U/V/X` | TLC |
| cell `F` | QLC |
| width/page/block `0..4` / `5..9` | x8 / x16 and page/block size |
| process `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z，对应 legacy profile `TSB130/TSB90/TSB70/TSB56/TSB43/TSB32/TSB24A/TSB24B/TSB19/TSB1Y/TSB15` |
| package `FT/TG/TA/XB/XG/BA/XL/LA` | TSOP/BGA/LGA plus lead-free and halogen-free flags |
| classification `0/2/4/7/8/A/B` and industrial `I/K/M/R/S/U/V` | channel / CE count |
| package size code | TSOP/LGA/BGA package dimensions |

## Die stack / package suffix notes

Toshiba/KIOXIA raw NAND 的末两位不能只按一个独立 die token 理解：第一位仍先按
classification 解释 CE / channel，第二位再结合封装族推断 package detail 和 die-per-CE。
下面表格来自 Toshiba raw NAND decoder 的 CE / channel 结构、本地 `fdb.json` PN 聚合、
以及 `../fdfdb` 中带 die / controller support 标注的交叉样本。当前 DecodePack 已把
`TC58` / `TH58` raw NAND 合并为同一套 token 规则：`TC` 前缀强制输出 `die_count = 1`，
`TH` 前缀按下表稳定 suffix 输出 `die_count`，同时继续输出 `ce_count`、`channel_count`
和 `package`；证据不足的 suffix 只保留 CE / channel / package 解析，不公开 `die_count`。

### BGA suffix inference

| End | Typical PN tail | Package | Total die | CE | Channel | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `4C` | `BA4C` | BGA132 | 2DP | 2CE | 2CH | 1 die / CE |
| `4D` | `BA4D` | BGA132 | 2DP | 2CE | 2CH | Same topology as `4C` |
| `8C` | `BA8C` | BGA132 | 4DP | 4CE | 2CH | 1 die / CE |
| `SC` | `BASC` | BGA132 | 4DP | 4CE | 2CH | Industrial / extended suffix equivalent to `8C` |
| `8H` | `BA8H` | BGA132 | 8DP | 4CE | 2CH | 2 die / CE |
| `SH` | `BASH` | BGA132 | 8DP | 4CE | 2CH | Industrial / extended suffix equivalent to `8H` |
| `49` | `BA49` | BGA132 | 2DP | 2CE | 2CH | Observed BGA132 2-die form |
| `89` | `BA89` | BGA132 | 8DP | 4CE | 2CH | Observed alongside 4-die BGA132 variants; keep exact suffix distinction |
| `S9` | `BAS9` | BGA132 | 8DP | 4CE | 2CH | Industrial / extended suffix equivalent to `89` |
| `8A` | `BA8A` | BGA132 | 8DP | 4CE | 2CH | BGA132 high-stack variant |
| `SA` | `BASA` | BGA132 | 8DP | 4CE | 2CH | Industrial / extended suffix equivalent to `8A` |
| `8P` | `BA8P` | BGA132 | 16DP | 4CE | 2CH | 4 die / CE |
| `4K` | `BA4K` | BGA152 | 2DP | 2CE | 2CH | 1 die / CE |
| `8K` | `BA8K` | BGA152 | 4DP | 4CE | 2CH | 1 die / CE |
| `8J` | `BA8J` | BGA152 | 8DP | 4CE | 2CH | 2 die / CE |
| `SJ` | `BASJ` | BGA152 | 8DP | 4CE | 2CH | Industrial / extended suffix equivalent to `8J` |
| `8N` | `BA8N` | BGA152 | 16DP | 4CE | 2CH | 4 die / CE |
| `DE` | `BADE` | BGA272 | 4DP | 4CE | 4CH | 1 die / CE |
| `EF` | `BAEF` | BGA272 | 8DP | 8CE | 4CH | 1 die / CE |
| `EG` | `BAEG` | BGA272 | 16DP | 8CE | 4CH | 2 die / CE |

### LGA suffix inference

`LA` 封装下的 `V` classification follows the observed SAT package layout rather than
the generic 2-channel industrial table alone.

| End | Typical PN tail | Package | Total die | CE | Channel | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `VF` | `LAVF` | LGA60-SAT | 8DP | 8CE | 2CH | SAT LGA package |
| `VH` | `LAVH` | LGA60-SAT | 16DP | 8CE | 2CH | SAT LGA high-stack package |

### TSOP `TA` suffix inference

`TA` package code is treated as TSOP48 with a fixed 1-channel topology. The suffix
still controls CE count and total die count.

| End | Typical PN tail | Package | Total die | CE | Channel | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `00` | `TA00` | TSOP48 | 1DP | 1CE | 1CH | Single CE / single die |
| `0D` | `TA0D` | TSOP48 | 1DP | 1CE | 1CH | Single CE / single die |
| `I0` | `TAI0` | TSOP48 | 1DP | 1CE | 1CH | Single CE / single die |
| `1D` | `TA1D` | TSOP48 | 1DP | 1CE | 1CH | Single CE / single die |
| `20` | `TA20` | TSOP48 | 2DP | 2CE | 1CH | Two CE / two die |
| `2D` | `TA2D` | TSOP48 | 2DP | 2CE | 1CH | Two CE / two die |
| `80` | `TA80` | TSOP48 | 4DP | 4CE | 1CH | Four CE / four die |

### Undetermined observed suffixes

These suffixes appear in local FDB / `../fdfdb` samples, but there is not enough
evidence to expose a public `die_count` only from the suffix. They should stay as
CE / channel / package candidates until exact PN, density, process, or external
datasheet evidence confirms the die stack.

| Package family | Observed suffixes | Current handling note |
| --- | --- | --- |
| BGA | `0D`, `1C`, `2K`, `4B`, `8S`, `BC`, `I6`, `IC`, `ID`, `K0`, `K2`, `SB`, `XC`, `X9`, `XX` | CE / channel may be inferred for known classification chars, but die-per-CE is not stable enough yet. |
| LGA | `19`, `29`, `45`, `48`, `49`, `8A`, `8C`, `89`, `KF`, `LF`, `M8`, `MC`, `SA` | Package detail is LGA-specific and should not reuse BGA detail-to-die rules. |
| TSOP | `01`, `02`, `03`, `05`, `0X`, `10`, `28`, `2A`, `2H`, `30`, `4K`, `8H`, `8J`, `8K`, `A0`, `I1`, `ID`, `K0`, `KD`, `KH`, `X0` | TSOP samples are mostly legacy / planar parts; infer CE / channel only unless a profile confirms total die. |

## Flash ID 解析

KIOXIA raw NAND Flash ID 使用 `98` maker code 和 6-byte ID。当前 identifier
DecodePack 位于 `packages/core/src/decodepack/identifier/packs/kioxia.json`。

| ID byte | 当前解析 |
| --- | --- |
| 2nd byte | `density`，按 per-target density 输出 Mbit |
| 3rd byte `DQ1..DQ0` | `die_count`；KIOXIA ID 中 LUN count 与 die count 同义 |
| 3rd byte `DQ3..DQ2` | `cell_level`，2/4/8/16 level cell 对应 SLC/MLC/TLC/QLC |
| 4th byte `DQ1..DQ0` | `page_size`，输出 byte |
| 4th byte `DQ7,DQ5,DQ4` | `block_size`，已知值输出 byte，reserved/others 不输出 |
| 5th byte `DQ3..DQ2` | target-level `plane_count`；`8/16` case 在 multi-die ID 中按 16 处理，再由 core postprocess 除以 `die_count` 输出 per-die plane count |
| 6th byte `DQ6..DQ0` | legacy 2D `die_codename`；`50/D0` = A19nm, `51/D1` = 15nm, `55/D5` = 32nm, `56/D6` = 24nm, `57/D7` = 19nm |
| 6th byte `DQ5,DQ2..DQ0` | BiCS `die_codename`，映射到 KIOXIA-scoped BiCS profile key |
| 6th byte `DQ7` | `interface_type`，`0` = Conventional，`1` = Toggle Mode |

2D 制程输出走 `nand.die_profile`：identifier pack 内部输出 `TSB15` /
`TSB19` / `TSB1Y` / `TSB24` profile key，公开 result 再显示为
`15nm` / `19nm` / `A19nm` / `32nm` / `24nm`。`DQ7` 只表示接口类型，所以
`51` 与 `D1`、`50` 与 `D0`、`55` 与 `D5`、`56` 与 `D6`、`57` 与 `D7` 的制程相同。
Flash ID 只能稳定输出泛化 `24nm`；`TSB24A` / `TSB24B` 这类更细分
process token 仍以 PN 解析为准。

典型样例：

| Flash ID | 关键输出 |
| --- | --- |
| `983AA0B17EE3` | 128Gbit per target, SLC, 1 die, 8 planes, Toggle Mode, BiCS4 |
| `983CA1B17EE3` | 256Gbit per target, SLC, 2 die, 8 planes per die, Toggle Mode, BiCS4 |
| `983A94937651` / `983A949376D1` | 128Gbit per target, MLC, 1 die, 2 planes, 15nm |
| `983A95937A50` / `983A95937AD0` | 128Gbit per target, MLC, 2 die, 2 planes, A19nm |
| `983A95937A57` / `983A95937AD7` | 128Gbit per target, MLC, 2 die, 2 planes, 19nm |
| `983A95827A55` / `983A95827AD5` | 128Gbit per target, MLC, 2 die, 2 planes, 32nm |
| `983A95827A56` / `983A95827AD6` | 128Gbit per target, MLC, 2 die, 2 planes, 24nm |

## 输出字段

- `density`
- `cell_level`
- `die_codename`
- `device_width`
- `voltage`
- `plane`
- `package`
- `lead_free`
- `halogen_free`
- `multi_chip`
- `die_count`
- `ce_count`
- `channel_count`

`package_code` 等 Toshiba/KIOXIA decoder token 只用于内部解析，不进入公开字段。

## 测试样例

- `TH58NVG7D2FTA00`
- `TC58NVG7D2FTA00`
- `TC58NVG7T2HBA4C`
- `TH58LJG8SA4BA4C`
- `TH58TFT1DFKLAVH`

## 注意

Raw NAND 的 `TH58` / `TC58` 规则只解释 raw NAND token。`THG...` eMMC/UFS/E2NAND 由独立 managed NAND pack 处理，避免用厂商前缀做泛化分类。
