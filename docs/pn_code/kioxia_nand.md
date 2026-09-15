# KIOXIA 裸 NAND PN 编码

采集日期：2026-05-13

## 外部资料

- KIOXIA 当前 Memory Selector 的 XL-闪存表列出 `TH58LKG9DA5BA4R`、`TH58LKT0DA5BA8R`、`TH58LKT1DA5BA8S`，分别为 64GB / 128GB / 256GB、BiCS 闪存 MLC（支持 SLC 模式）、154 球 BGA、11.5x13.5mm。规则继续从既有容量/单元/制程/封装编码段独立解码；本轮只把官方尺寸补到 `BA4R` / `BA8R` / `BA8S` 封装编码段映射，不按完整 PN 增加产品特判。来源：<https://americas.kioxia.com/en-us/business/memory/selector.html>

- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: 裸 NAND 大块页给出 `TC58` / `TH58` 单/多芯片、NAND 接口、电压、容量、单元类型、位宽/页/块、工艺规则、封装、通道/CE 和封装尺寸编码段。
- Toshiba / KIOXIA `NAND Flash Part Numbering Decoder`, 当前料号体系 `(130nm ~ now)`: 补充当前版裸 NAND 的产品类型、`B*` / `Y*` 容量、BiCS 代际、ECB-形式封装/配置和封装尺寸编码段。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kioxia-raw-token.json`
- `vendor.kioxia.raw.tc-th.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC58/TH58` + 接口 + 电压 + 容量 + 单元 + 位宽 + 制程 + 封装 + 通道/CE + 封装尺寸 | Toshiba/KIOXIA 裸 NAND 大块结构 |
| 前缀 `TC58` / `TH58` | 单芯片 / 多芯片 |
| 产品/接口 `N/D/T/L/X/V/B/C/M` | 公开 `interface_type`，覆盖大/小块 NAND、Toggle DDR、Apple X-Para、双 x8 TSV、BENAND、SPI NAND 和 mDOC |
| 电压 `V/Y/A/B/D/E/F/G/H/J/K/L` | Vcc/VccQ/VccQL 组合，按当前版解码器官方电压范围输出 |
| 容量 `M0..M9/G0..G9/GA..GF/T0..T9/TG/TH/TJ/TK/B1/B2/B4/B8/BD/Y1..Y5` | 1Mbit 到 512Tbit；`B*` 按项目既有 1.33Tbit = `1397760` Mbit 口径，`Y*` 为 PLC 1Tbit x N |
| 单元 `S/H` | SLC |
| 单元 `D/E/J/C` | MLC |
| 单元 `T/U/V/X/Z/W/Y` | TLC |
| 单元 `F/A` | QLC |
| 单元 `R` | PLC |
| 位宽/页/块 `0..4` / `5..9` | x8 / x16 及页/块大小 |
| 制程 `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z，对应旧版规格 `TSB130/TSB90/TSB70/TSB56/TSB43/TSB32/TSB24A/TSB24B/TSB19/TSB1Y/TSB15` |
| 制程 `2/3/4/M/5/6/8/9` | BiCS2/BiCS3/BiCS4/BiCS4.5/BiCS5/BiCS6/BiCS8/BiCS9；当前版解码器图中 BiCS10 行的编码不清晰，暂不编码 |
| 封装 `FT/TG/TA/QA/RA/XB/XG/BA/BB/BS/VA/XL/LA/LD` | TSOP/SOP/WSON/BGA/LGA 以及无铅、无卤和接口芯片/降级品/TSV/仅 SAT 语义选项 |
| 分类 `0/1/2/3/4/7/8/A/B/D/E` 和工业级 `I/J/K/L/M/R/S/U/V/X` | 通道 / CE 数量 |
| 封装尺寸编码 | TSOP/SOP/WSON/LGA/BGA 封装尺寸；同一编码在多封装族冲突时只输出能由封装系列确定的尺寸 |

## die 堆叠与封装后缀说明

Toshiba/KIOXIA 裸 NAND 的末两位不能只按一个独立 die 编码段理解：第一位仍先按
分类解释 CE / 通道；BGA 需要结合两位封装编码形成完整 4 字符尾部
解释封装 / die 堆叠，TSOP/LGA 则继续按封装族和末两位后缀解释。
下面表格来自 Toshiba 裸 NAND 解码器的 CE / 通道结构、本地 `fdb.json` PN 聚合、
以及 `../fdfdb` 中带 die / 控制器支持标注的交叉样本。当前 DecodePack 已把
`TC58` / `TH58` 裸 NAND 合并为同一套编码段规则：`TC` 前缀强制输出 `die_count = 1`，
`TH` 前缀按下表稳定尾部输出 `die_count`，同时继续输出 `ce_count`、`channel_count`
和 `package`；证据不足的后缀只保留 CE / 通道 / 封装解析，不公开 `die_count`。

### BGA 后缀推断

当前版解码器底部绿色表给出 BGA 封装/配置编码 `(12~15)` 的官方 die 堆叠。
DecodePack 对 BGA 封装 / die 数均按完整 4 字符尾部解释，不再用末两位
后缀兜底；这样可以处理 `BA8R` = BGA154 / 4-die 与 `BB8R` = BGA152 /
16-die 这类同后缀不同含义的冲突。旧样本中已经确认的 BGA 组合也迁入同一张
完整尾部表，例如 `BA4D`、`BA89`、`BAS9`、`BA8A`、`BASA`。

| die 堆叠 | BGA132 | BGA152 | BGA154 | BGA272 |
| --- | --- | --- | --- | --- |
| SDP 1-die | `BA0M`, `BAIM` | `BA0L` | - | - |
| DDP 2-die | `BA4C`, `BA4M`, `BA49`, `BAMC` | `BA4K`, `BA4L`, `BS2K` | `BA4R` | - |
| QDP 4-die | `BA8C`, `BA8M`, `BS8C`, `BASC` | `BA8K`, `BS8K` | `BA8R` | `BADE`, `BAXE` |
| ODP 8-die | `BA8H`, `BASH` | `BA8J`, `BB8J`, `BASJ` | `BA8S` | `BAEF` |
| HDP 16-die | `BA8P` | `BA8N`, `BB8N`, `BB8R` | `BB8T` | `BAEG` |
| 32DP 32-die | - | - | `BB8U` | - |

### LGA 后缀推断

`LA` 封装下的 `V` 分类按已观察到的 SAT 封装布局解释，不能只套用通用的双通道工业级表。

| 后缀 | 典型 PN 尾部 | 封装 | 总 die 数 | CE | 通道 | 说明 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `VF` | `LAVF` | LGA60-SAT | 8DP | 8CE | 2CH | SAT LGA 封装 |
| `VH` | `LAVH` | LGA60-SAT | 16DP | 8CE | 2CH | SAT LGA 高堆叠封装 |

### TSOP `TA` 后缀推断

`TA` 封装编码按 TSOP48 解释，固定为单通道；后缀仍决定 CE 数和总 die 数。

| 后缀 | 典型 PN 尾部 | 封装 | 总 die 数 | CE | 通道 | 说明 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `00` | `TA00` | TSOP48 | 1DP | 1CE | 1CH | 单 CE / 单 die |
| `0D` | `TA0D` | TSOP48 | 1DP | 1CE | 1CH | 单 CE / 单 die |
| `I0` | `TAI0` | TSOP48 | 1DP | 1CE | 1CH | 单 CE / 单 die |
| `1D` | `TA1D` | TSOP48 | 1DP | 1CE | 1CH | 单 CE / 单 die |
| `20` | `TA20` | TSOP48 | 2DP | 2CE | 1CH | 双 CE / 双 die |
| `2D` | `TA2D` | TSOP48 | 2DP | 2CE | 1CH | 双 CE / 双 die |
| `80` | `TA80` | TSOP48 | 4DP | 4CE | 1CH | 4 个 CE / 4 个 die |

### 已观察但尚未确定的后缀

这些后缀见于本地 FDB / `../fdfdb` 样例，但证据不足以仅凭后缀公开输出 `die_count`。在完整 PN、容量、制程或外部数据手册确认 die 堆叠前，仅保留 CE、通道和封装候选信息。

| 封装系列 | 已观察的后缀 | 当前处理方式 |
| --- | --- | --- |
| BGA | `BA0D`, `BA1C`, `BA4B`, `BABC`, `BAI6`, `BAIC`, `BAID`, `BAK0`, `BAK2`, `BASB`, `BAXC`, `BAX9`, `BAXX` | 可从已知分类字符推断 CE / 通道数，但每 CE 的 die 数尚不稳定。 |
| LGA | `19`, `29`, `45`, `48`, `49`, `8A`, `8C`, `89`, `KF`, `LF`, `M8`, `MC`, `SA` | 封装细节属于 LGA，不能套用 BGA 封装细节到 die 数的映射规则。 |
| TSOP | `01`, `02`, `03`, `05`, `0X`, `10`, `28`, `2A`, `2H`, `30`, `4K`, `8H`, `8J`, `8K`, `A0`, `I1`, `ID`, `K0`, `KD`, `KH`, `X0` | TSOP 样例多为旧版 / 平面工艺器件；除非规格可确认总 die 数，否则只推断 CE / 通道。 |

## Flash ID 解析

KIOXIA 裸 NAND Flash ID 使用 `98` 制造商编码和 6 字节 ID。当前标识符
DecodePack 位于 `packages/core/src/decodepack/identifier/packs/kioxia.json`。
旧版 SLC 容量编码段由 KIOXIA/Toshiba 数据手册 Read ID 表确认；其中
`F1/DA/DC/D3/D5/D7/DE` 分别覆盖 1/2/4/8/16/32/64Gbit。公开数据手册
包括 KIOXIA `TC58NVG0S3HBAI4`：<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/201910/DST_TC58NVG0S3HBAI4-TDE_EN_31422.pdf>，以及 Toshiba SLC 中等容量资料合集：<https://www.digikey.com/en/htmldatasheets/production/1123772/0/0/1/nand-flash-memory-slc-middle-capacity-.html>。
KIOXIA 当前数据手册还直接确认 `98 F1 80 15 72`、`98 DA 90 15 76`、
`98 DC 90 26 76` 三组 Read ID：均为 3.3V x8 SLC；前两组为 2KiB 页、
128KiB 块、128B 冗余区，后一组为 4KiB 页、256KiB 块、
256B 冗余区。
规则只对这些已确认的器件/配置字节组合采用数据手册位定义；其他
既有 ID 继续走原有回退，不用当前资料覆盖历史或更新的映射。对应 2Gbit
和 4Gbit 资料：<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/201910/DST_TC58NVG1S3HTA00-TDE_EN_31442.pdf>、<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TC58NVG2S0HBAI4-TDE_EN_31440.pdf>。

24nm 并行 SLC 数据手册进一步确认五组完整 Read ID 配置。1.8V 系列
`98 A1 80 15 72` / `98 AA 90 15 76` / `98 AC 90 26 76` /
`98 A3 91 26 76` 分别对应每目标 1/2/4/8Gbit；3.3V
`98 D3 91 26 76` 对应每目标 8Gbit。A1/AA 使用 2KiB 页、128KiB 块、
128B 冗余区，AC/A3/D3 使用 4KiB 页、256KiB 块、256B
冗余区；五组均要求 8bit/512B ECC。规则以完整第 2–5 字节组合精确匹配，并只允许沿用现有的单个
`00` 填充；相邻配置继续走通用回退。来源：
<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TC58NYG0S3HBAI4-TDE_EN_31426.pdf>、
<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TC58NYG1S3HBAI4-TDE_EN_31443.pdf>、
<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TC58NYG2S0HBAI4-TDE_EN_31446.pdf>、
<https://americas.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TH58NYG3S0HBAI4-TDE_EN_31565.pdf>、
<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/201910/DST_TH58NVG3S0HTA00-TDE_EN_31580.pdf>。

`98 D3 91 26 76` 也会由双 CE 的 16Gbit `TH58NVG4` 封装分 CE 返回；因此
Flash ID 解码器只输出字节组合能确认的每目标/CE 8Gbit，不把封装总容量
反推成 16Gbit。该边界由 16Gbit 数据手册的 CE 级 Read ID 表交叉确认：
<https://www.kioxia.com/content/dam/kioxia/newidr/productinfo/datasheet/202502/DST_TH58NVG4S0HTAK0-TDE_EN_35719.pdf>。

| ID 字节 | 当前解析 |
| --- | --- |
| 第 2 字节 | `density`，按每目标容量输出 Mbit |
| 第 3 字节 `DQ1..DQ0` | 原厂 `Internal Chip Number`；项目映射为 `die_count`，文档不把该映射写成原厂逐字定义 |
| 第 3 字节 `DQ3..DQ2` | `cell_level`，每单元 2/4/8/16 个电平对应 SLC/MLC/TLC/QLC |
| 第 4 字节 `DQ1..DQ0` | `page_size`，输出字节；当前 SLC 三组已确认配置使用数据手册位定义，其他 ID 保留既有回退 |
| 第 4 字节 `DQ7,DQ5,DQ4` | `block_size`，输出字节；当前 SLC 三组已确认配置使用数据手册位定义，其他 ID 保留既有回退 |
| 第 5 字节 `DQ3..DQ2` | 原厂 ID 表的平面 / 分区数量，直接输出 `plane_count`，不再按 die 数二次换算 |
| 已确认的完整第 2–5 字节配置 | `redundant_area_size`；该值不是通用 ID 位域，不向其他 ID 泛化 |
| 已确认的完整第 2–5 字节配置 | `ecc_level`；五组 24nm SLC 精确字节组合输出 `8bit/512B`，不向相邻 ID 泛化 |
| 第 6 字节 `DQ6..DQ0` | 旧版 2D `die_codename`；`50/D0` = A19nm, `51/D1` = 15nm, `55/D5` = 32nm, `56/D6` = 24nm, `57/D7` = 19nm |
| 第 6 字节 `DQ5,DQ2..DQ0` | BiCS `die_codename`，映射到 KIOXIA 专属 BiCS 规格键 |
| 第 6 字节 `DQ7` | `interface_type`，`0` = 常规接口，`1` = Toggle 模式 |

2D 制程输出走 `nand.die_profile`：标识符规则包内部输出 `TSB15` /
`TSB19` / `TSB1Y` / `TSB24` 规格键，公开结果再显示为
`15nm` / `19nm` / `A19nm` / `32nm` / `24nm`。`DQ7` 只表示接口类型，所以
`51` 与 `D1`、`50` 与 `D0`、`55` 与 `D5`、`56` 与 `D6`、`57` 与 `D7` 的制程相同。
Flash ID 只能稳定输出泛化 `24nm`；`TSB24A` / `TSB24B` 这类更细分
制程编码段仍以 PN 解析为准。

典型样例：

| Flash ID | 关键输出 |
| --- | --- |
| `98A1801572` | 1Gbit（每目标）, 1.8V x8 SLC, 1 个内部芯片, 1 个平面/分区, 24nm, 2KiB 页, 128KiB 块 |
| `98AA901576` | 2Gbit（每目标）, 1.8V x8 SLC, 1 个内部芯片, 2 个平面/分区, 24nm, 2KiB 页, 128KiB 块 |
| `98AC902676` | 4Gbit（每目标）, 1.8V x8 SLC, 1 个内部芯片, 2 个平面/分区, 24nm, 4KiB 页, 256KiB 块 |
| `98A3912676` | 8Gbit（每目标）, 1.8V x8 SLC, 2 个内部芯片, 2 个分区/平面, 24nm, 4KiB 页, 256KiB 块 |
| `98D3912676` | 8Gbit（每目标/CE）, 3.3V x8 SLC, 2 个内部芯片, 2 个分区/平面, 24nm, 4KiB 页, 256KiB 块 |
| `983AA0B17EE3` | 128Gbit（每目标）, SLC, 1 个 die, 8 个平面, Toggle 模式, BiCS4 |
| `983CA1B17EE3` | 256Gbit（每目标）, SLC, 2 个 die, 8 个平面/分区, Toggle 模式, BiCS4 |
| `983A94937651` / `983A949376D1` | 128Gbit（每目标）, MLC, 1 个 die, 2 个平面, 15nm |
| `983A95937A50` / `983A95937AD0` | 128Gbit（每目标）, MLC, 2 个 die, 4 个平面/分区, A19nm |
| `983A95937A57` / `983A95937AD7` | 128Gbit（每目标）, MLC, 2 个 die, 4 个平面/分区, 19nm |
| `983A95827A55` / `983A95827AD5` | 128Gbit（每目标）, MLC, 2 个 die, 4 个平面/分区, 32nm |
| `983A95827A56` / `983A95827AD6` | 128Gbit（每目标）, MLC, 2 个 die, 4 个平面/分区, 24nm |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
解码器编码段的公开边界见 [术语](terminology.md)。

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

裸 NAND 的 `TH58` / `TC58` 规则只解释裸 NAND 编码段。`THG...` eMMC/UFS/E2NAND 由独立受管理 NAND 规则包处理，避免用厂商前缀做泛化分类。
