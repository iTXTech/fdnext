# KIOXIA Raw NAND PN 编码

采集日期：2026-05-13

## 外部资料

- KIOXIA 当前 Memory Selector 的 XL-FLASH 表列出 `TH58LKG9DA5BA4R`、`TH58LKT0DA5BA8R`、`TH58LKT1DA5BA8S`，分别为 64GB / 128GB / 256GB、BiCS FLASH MLC（支持 SLC mode）、154-ball BGA、11.5x13.5mm。规则继续从既有 density/cell/process/package token 独立解码；本轮只把官方尺寸补到 `BA4R` / `BA8R` / `BA8S` package-token 映射，不按完整 PN 增加产品特判。来源：<https://americas.kioxia.com/en-us/business/memory/selector.html>

- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: raw NAND large-block 页给出 `TC58` / `TH58` 单/多芯片、NAND interface、voltage、density、cell level、width/page/block、design rule、package、channel/CE 和 package size token。
- Toshiba / KIOXIA `NAND Flash Part Numbering Decoder`, current part number system `(130nm ~ now)`: 补充 current raw NAND 的 product type、`B*` / `Y*` density、BiCS generation、ECB-style package/config 和 package size token。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kioxia-raw-token.json`
- `vendor.kioxia.raw.tc-th.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC58/TH58` + interface + voltage + density + cell + width + process + package + channel/CE + package size | Toshiba/KIOXIA raw NAND large-block form |
| prefix `TC58` / `TH58` | single-chip / multi-chip |
| product/interface `N/D/T/L/X/V/B/C/M` | 公开 `interface_type`，覆盖 large/small block NAND、Toggle DDR、Apple X-Para、dual x8 TSV、BENAND、SPI NAND 和 mDOC |
| voltage `V/Y/A/B/D/E/F/G/H/J/K/L` | Vcc/VccQ/VccQL 组合，按 current decoder 官方电压范围输出 |
| density `M0..M9/G0..G9/GA..GF/T0..T9/TG/TH/TJ/TK/B1/B2/B4/B8/BD/Y1..Y5` | 1Mbit 到 512Tbit；`B*` 按项目既有 1.33Tbit = `1397760` Mbit 口径，`Y*` 为 PLC 1Tbit x N |
| cell `S/H` | SLC |
| cell `D/E/J/C` | MLC |
| cell `T/U/V/X/Z/W/Y` | TLC |
| cell `F/A` | QLC |
| cell `R` | PLC |
| width/page/block `0..4` / `5..9` | x8 / x16 and page/block size |
| process `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z，对应 legacy profile `TSB130/TSB90/TSB70/TSB56/TSB43/TSB32/TSB24A/TSB24B/TSB19/TSB1Y/TSB15` |
| process `2/3/4/M/5/6/8/9` | BiCS2/BiCS3/BiCS4/BiCS4.5/BiCS5/BiCS6/BiCS8/BiCS9；current decoder 图中 BiCS10 行的 code 不清晰，暂不编码 |
| package `FT/TG/TA/QA/RA/XB/XG/BA/BB/BS/VA/XL/LA/LD` | TSOP/SOP/WSON/BGA/LGA plus lead-free、halogen-free 和 IF Chip/Downgrade/TSV/SAT-only 语义选项 |
| classification `0/1/2/3/4/7/8/A/B/D/E` and industrial `I/J/K/L/M/R/S/U/V/X` | channel / CE count |
| package size code | TSOP/SOP/WSON/LGA/BGA package dimensions；同一 code 在多封装族冲突时只输出能由 package family 确定的尺寸 |

## Die stack / package suffix notes

Toshiba/KIOXIA raw NAND 的末两位不能只按一个独立 die token 理解：第一位仍先按
classification 解释 CE / channel；BGA 需要结合两位 package code 形成完整 4 字符 tail
解释 package / die stack，TSOP/LGA 则继续按封装族和末两位 suffix 解释。
下面表格来自 Toshiba raw NAND decoder 的 CE / channel 结构、本地 `fdb.json` PN 聚合、
以及 `../fdfdb` 中带 die / controller support 标注的交叉样本。当前 DecodePack 已把
`TC58` / `TH58` raw NAND 合并为同一套 token 规则：`TC` 前缀强制输出 `die_count = 1`，
`TH` 前缀按下表稳定 tail 输出 `die_count`，同时继续输出 `ce_count`、`channel_count`
和 `package`；证据不足的 suffix 只保留 CE / channel / package 解析，不公开 `die_count`。

### BGA suffix inference

Current decoder 底部绿色表给出 BGA package/config code `(12~15)` 的官方 die stack。
DecodePack 对 BGA package / die count 均按完整 4 字符 tail 解释，不再用末两位
suffix 兜底；这样可以处理 `BA8R` = BGA154 / 4-die 与 `BB8R` = BGA152 /
16-die 这类同 suffix 不同含义的冲突。旧样本中已经确认的 BGA 组合也迁入同一张
完整 tail 表，例如 `BA4D`、`BA89`、`BAS9`、`BA8A`、`BASA`。

| Die stack | BGA132 | BGA152 | BGA154 | BGA272 |
| --- | --- | --- | --- | --- |
| SDP 1-die | `BA0M`, `BAIM` | `BA0L` | - | - |
| DDP 2-die | `BA4C`, `BA4M`, `BA49`, `BAMC` | `BA4K`, `BA4L`, `BS2K` | `BA4R` | - |
| QDP 4-die | `BA8C`, `BA8M`, `BS8C`, `BASC` | `BA8K`, `BS8K` | `BA8R` | `BADE`, `BAXE` |
| ODP 8-die | `BA8H`, `BASH` | `BA8J`, `BB8J`, `BASJ` | `BA8S` | `BAEF` |
| HDP 16-die | `BA8P` | `BA8N`, `BB8N`, `BB8R` | `BB8T` | `BAEG` |
| 32DP 32-die | - | - | `BB8U` | - |

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
| BGA | `BA0D`, `BA1C`, `BA4B`, `BABC`, `BAI6`, `BAIC`, `BAID`, `BAK0`, `BAK2`, `BASB`, `BAXC`, `BAX9`, `BAXX` | CE / channel may be inferred for known classification chars, but die-per-CE is not stable enough yet. |
| LGA | `19`, `29`, `45`, `48`, `49`, `8A`, `8C`, `89`, `KF`, `LF`, `M8`, `MC`, `SA` | Package detail is LGA-specific and should not reuse BGA detail-to-die rules. |
| TSOP | `01`, `02`, `03`, `05`, `0X`, `10`, `28`, `2A`, `2H`, `30`, `4K`, `8H`, `8J`, `8K`, `A0`, `I1`, `ID`, `K0`, `KD`, `KH`, `X0` | TSOP samples are mostly legacy / planar parts; infer CE / channel only unless a profile confirms total die. |

## Flash ID 解析

KIOXIA raw NAND Flash ID 使用 `98` maker code 和 6-byte ID。当前 identifier
DecodePack 位于 `packages/core/src/decodepack/identifier/packs/kioxia.json`。
Legacy SLC density token 由 KIOXIA/Toshiba datasheet Read ID 表确认；其中
`F1/DA/DC/D3/D5/D7/DE` 分别覆盖 1/2/4/8/16/32/64Gbit。公开 datasheet
包括 KIOXIA `TC58NVG0S3HBAI4`：<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/201910/DST_TC58NVG0S3HBAI4-TDE_EN_31422.pdf>，以及 Toshiba SLC middle-capacity 合集：<https://www.digikey.com/en/htmldatasheets/production/1123772/0/0/1/nand-flash-memory-slc-middle-capacity-.html>。
KIOXIA 当前 datasheet 还直接确认 `98 F1 80 15 72`、`98 DA 90 15 76`、
`98 DC 90 26 76` 三组 Read ID：均为 3.3V x8 SLC；前两组为 2KiB page、
128KiB block、128B redundant area，后一组为 4KiB page、256KiB block、
256B redundant area。
规则只对这些已确认的 device/configuration byte 组合采用 datasheet 位定义；其他
既有 ID 继续走原有 fallback，不用当前资料覆盖历史或更新的 mapping。对应 2Gbit
和 4Gbit 资料：<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/201910/DST_TC58NVG1S3HTA00-TDE_EN_31442.pdf>、<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TC58NVG2S0HBAI4-TDE_EN_31440.pdf>。

| ID byte | 当前解析 |
| --- | --- |
| 2nd byte | `density`，按 per-target density 输出 Mbit |
| 3rd byte `DQ1..DQ0` | `die_count`；KIOXIA ID 中 LUN count 与 die count 同义 |
| 3rd byte `DQ3..DQ2` | `cell_level`，2/4/8/16 level cell 对应 SLC/MLC/TLC/QLC |
| 4th byte `DQ1..DQ0` | `page_size`，输出 byte；当前 SLC 三组已确认 configuration 使用 datasheet 位定义，其他 ID 保留既有 fallback |
| 4th byte `DQ7,DQ5,DQ4` | `block_size`，输出 byte；当前 SLC 三组已确认 configuration 使用 datasheet 位定义，其他 ID 保留既有 fallback |
| 5th byte `DQ3..DQ2` | target-level `plane_count`；`8/16` case 在 multi-die ID 中按 16 处理，再由 core postprocess 除以 `die_count` 输出 per-die plane count |
| 已确认的完整 2nd–5th byte configuration | `redundant_area_size`；该值不是通用 ID 位域，不向其他 ID 泛化 |
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
- `interface_type`
- `plane_count`
- `package`
- `lead_free`
- `halogen_free`
- `special_option`
- `die_count`
- `ce_count`
- `channel_count`

`package_code` 等 Toshiba/KIOXIA decoder token 只用于内部解析，不进入公开字段。

## 测试样例

- `TH58NVG7D2FTA00`
- `TC58NVG7D2FTA00`
- `TH58LKT4X46BAEG`
- `TH58LKB1F48BAEG`
- `TH58LKY1R48BAEG`
- `TH58LKT4X46BA8R`
- `TH58LKT4X46BB8R`
- `TH58LKT4X46BB8U`
- `TC58NVG7T2HBA4C`
- `TH58LJG8SA4BA4C`
- `TH58TFT1DFKLAVH`

## 注意

Raw NAND 的 `TH58` / `TC58` 规则只解释 raw NAND token。`THG...` eMMC/UFS/E2NAND 由独立 managed NAND pack 处理，避免用厂商前缀做泛化分类。
