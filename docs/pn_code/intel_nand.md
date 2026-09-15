# Intel / Solidigm NAND 与 Intel 3D XPoint PN

资料状态：PN 部分依据维护线程中提供的 Intel-SOLIDIGM NAND Flash / Intel 3D XPoint Part Numbering Decoder 图片整理。Flash ID 部分另依据公开镜像中的 Intel 3D NAND Gen4 `Q4128A` 数据手册 Read ID 表：<https://dfsimg1.hqewimg.com/group5/M00/0E/10/wKhk3WSZnBCACjIqAAv2nmPd1Z8208.pdf>。

## 当前结构化格式

当前表格按以下结构解析 PN：

`[封装][29][产品组][容量][总线/通道][配置][电压][产品类型][光刻/代际][产品代际/SKU]`

封装标识：

| 编码段 | 含义 |
| --- | --- |
| JS | 48-引脚无铅 TSOP |
| BK | 无铅 LGA |
| PF | 无铅 BGA |

旧版解码器仍保留 `CU = LSOP`，用于覆盖较早的 Intel 兼容 PN。

产品组标识：

| 编码段 | 含义 |
| --- | --- |
| 29F | Intel / Solidigm NAND 闪存存储器 |
| 29P | Intel 3D XPoint 存储器 |

## 容量编码段

大多数容量编码段直接映射到标称器件容量。当前表格新增了以下大容量 NAND 编码段：

| 编码段 | 标称容量 |
| --- | --- |
| 80B | 640Gb |
| 09T | 9216Gb |
| 01P | 1368Gb |
| 02P | 2736Gb |
| 04P | 5472Gb |
| 08P | 10944Gb |
| 16P | 21888Gb |

对于 3D1 NAND，`32B`、`64B`、`01T`、`02T`、`04T` 在 MLC 和 TLC 下含义不同。DecodePack 因此使用单元类型 + 光刻制程编码作为覆盖键，避免影响后续 3D 代际的既有容量映射。

## 总线、通道与配置

对于 2D NAND，`08`、`A8`、`16`、`32` 等编码段表示总线宽度。对于 3D NAND 和 3D XPoint，相同位置的两字符编码段表示封装通道数，例如 `2A`、`4A`、`2B`、`4B`。

器件配置使用共享的一字符表来表示 die 数量和 nCE。本次更新补入表格中的数字 BGA 配置：

| 编码段 | Die 数量 | nCE |
| --- | --- | --- |
| 5 | 5 | 5 |
| 7 | 9 | 9 |

## 产品类型与光刻/代际

对于 `29F` NAND，产品类型编码段解码为单元类型：

| 编码段 | 含义 |
| --- | --- |
| N | SLC |
| M | MLC |
| T | TLC |
| Q | QLC |

对于 `29P` 3D XPoint，产品类型编码段解码为堆叠层（Deck）数量，而不是 NAND 单元类型：

| 编码段 | 含义 |
| --- | --- |
| N | 2-Deck |
| S | 4-Deck |

光刻/代际编码段按产品组解释：

| 编码段 | NAND 含义 | 3D XPoint 含义 |
| --- | --- | --- |
| A | 90nm | - |
| B | 72nm | - |
| C | 50nm | - |
| D | 34nm | - |
| E | 25nm | - |
| F | 20nm | 3D-XP G1 |
| G | 3D1 32L | 3D-XP G2 |
| H | 3D2 64L | - |
| J | 3D3 96L | - |
| K | 3D4 144L | - |
| L | 3D5 192L | - |

## DecodePack 行为

- 控制器支持列表中可见的 `I29F...` 形式把开头 `I` 作为 Intel 厂商标记；规则结构化消费 `I29F + density + width`，不把 `I` 当作封装。`I29F256G08CBCBB` 的外部表项确认 32GB、MLC、x8 与 `L06B`，但没有提供后半段逐编码段定义，因此 DecodePack 只公开可由通用位置稳定解析的容量与位宽，不把该完整 PN 的 MLC / 制程结论硬编码进规则。来源：<https://f-hauri.ch/vrac/SSD-16Tb/CB/219x/CBM219X%20UMPToolV7200%282022-04-28%29/CBM209X%20Flash%20Support%20List%282020-8-21%29.pdf>
- `29P` 输出芯片种类 `3d_xpoint`，不再归类为 `raw_nand`。
- 3D XPoint 下的 `N` 和 `S` 不输出 `cell_level`，而是输出 `die_stack`。
- 3D XPoint 电压编码 `D` 目前只作为内部编码识别；在确认实际电压范围前，不输出公开 `voltage` 字段。
- Intel QLC 3D4 的 `K` + 代际 / SKU 后缀 `M` 归一为 `N38E`，优先于基础 `3D4 144L` 光刻制程输出。
- 已有 Intel / Solidigm die 规格覆盖逻辑仍然优先，例如 `B0KB`、`N38E`、`N4PA` 等，在单元 / 制程 / die 容量键可确定时继续覆盖基础光刻/代际信息。

## Intel Gen4 Flash ID

`Q4128A` 数据手册给出 TLC / QLC 各 1、2、4、8 die 的完整 Read ID 矩阵。标识符规则包仍按字节/位解析：第 2 字节的高 5 位确定封装总容量，第 3 字节低 2 位确定 die 数、`DQ3..DQ2` 确定 TLC/QLC。此次补齐此前缺少的 TLC 奇数高位编码段 `25/27/29/31`，因此 `CB/DB/EB/FB` 能分别输出 `512Gb/1Tb/2Tb/4Tb`；QLC `D3/E3/F3/2B` 则保持 `1/2/4/8Tb`。

完整 8-字节数据手册 ID 的末尾两个保留字节不参与推导；fdnext 接受并测试其前 6-字节 NAND Flash ID。

## 示例

| PN | 预期解码 |
| --- | --- |
| PF29F16P2BWCQL1 | NAND, 21888Gb, QLC, BGA, 16 die, 2 通道, 3D5 192L |
| PF29P64G2ALDNF1 | 3D XPoint, 64Gb, BGA, 1 die, 2 通道, 2-Deck, 3D-XP G1 |

## die 规格归一

Intel 裸 NAND PN 的制程编码段按 `cell + generation suffix + computed die density` 归一，避免只用后缀误判同一代中不同 die 大小的型号。本轮用 `../fdfdb` 中 Alcor CSV 与 SMI / SM 闪存支持表交叉聚合后，确认 25nm `7x` 与 34nm `6x` 仍应走这套组合键，而不是单看 `D/E/F` 代号。IMFT 2D 别名第三位是单 die 容量编码：`2 = 16Gb`、`3 = 32Gb`、`4 = 64Gb`、`5 = 128Gb`，规则表不得违反这个编码关系。当前确认规则：

| 单元 + 后缀 + 单 die 容量 | 规格键 |
| --- | --- |
| `M:D2/DB:16Gb` | `L62A` |
| `M:D1/D2:32Gb` | `L63A` |
| `M:DA/DB:32Gb` | `L63B` |
| `M:E1:16Gb` | `L72A` |
| `M:E1:32Gb` | `L73A` |
| `M:E1:64Gb` | `L74A` |
| `M:E2:64Gb` | `L74A` |
| `N:E1:32Gb` | `M73A` |
| `T:E1:64Gb` | `B74A` |
| `M:F1:64Gb` | `L84A` |
| `M:FH/FS:64Gb` | `L84C` |
| `M:F2:128Gb` | `L85A` |
| `M:FP/FS:128Gb` | `L85C` |
| `M:G1/G2/G3:256Gb` | `L06B` |
| `T:G1/G2/G3:256Gb/384Gb` | `B0KB` |
| `T:H1/H2:256Gb` | `B16A` |
| `T:H1/H2:512Gb` | `B17A` |
| `T:J1:512Gb` | `B27A` |
| `Q:K1/K2/KA/KM/L1:1Tb` | `N38A` / `N38B` / `N38B` / `N38E` / `N4PA` |
