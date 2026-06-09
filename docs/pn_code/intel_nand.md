# Intel / Solidigm NAND 与 Intel 3D XPoint PN

资料状态：本页依据维护线程中提供的 Intel-SOLIDIGM NAND Flash / Intel 3D XPoint Part Numbering Decoder 图片整理。仓库内未记录公开 URL。

## 当前结构化格式

当前表格按以下结构解析 PN：

`[封装][29][产品组][容量][总线/通道][配置][电压][产品类型][光刻/代际][产品代际/SKU]`

封装标识：

| Token | 含义 |
| --- | --- |
| JS | 48-pin Pb-Free TSOP |
| BK | Pb-Free LGA |
| PF | Pb-Free BGA |

旧版解码器仍保留 `CU = LSOP`，用于覆盖较早的 Intel 兼容 PN。

产品组标识：

| Token | 含义 |
| --- | --- |
| 29F | Intel / Solidigm NAND Flash Memory |
| 29P | Intel 3D XPoint Memory |

## 容量 token

大多数容量 token 直接映射到标称器件容量。当前表格新增了以下大容量 NAND token：

| Token | 标称容量 |
| --- | --- |
| 80B | 640Gb |
| 09T | 9216Gb |
| 01P | 1368Gb |
| 02P | 2736Gb |
| 04P | 5472Gb |
| 08P | 10944Gb |
| 16P | 21888Gb |

对于 3D1 NAND，`32B`、`64B`、`01T`、`02T`、`04T` 在 MLC 和 TLC 下含义不同。DecodePack 因此使用 cell type + lithography code 作为覆盖 key，避免影响后续 3D 代际的既有容量映射。

## 总线、通道与配置

对于 2D NAND，`08`、`A8`、`16`、`32` 等 token 表示总线宽度。对于 3D NAND 和 3D XPoint，相同位置的两字符 token 表示封装通道数，例如 `2A`、`4A`、`2B`、`4B`。

器件配置使用共享的一字符表来表示 die 数量和 nCE。本次更新补入表格中的数字 BGA 配置：

| Token | Die 数量 | nCE |
| --- | --- | --- |
| 5 | 5 | 5 |
| 7 | 9 | 9 |

## 产品类型与光刻/代际

对于 `29F` NAND，产品类型 token 解码为 cell level：

| Token | 含义 |
| --- | --- |
| N | SLC |
| M | MLC |
| T | TLC |
| Q | QLC |

对于 `29P` 3D XPoint，产品类型 token 解码为 deck 数量，而不是 NAND cell level：

| Token | 含义 |
| --- | --- |
| N | 2-Deck |
| S | 4-Deck |

光刻/代际 token 按产品组解释：

| Token | NAND 含义 | 3D XPoint 含义 |
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

- `29P` 输出 chip kind `3d_xpoint`，不再归类为 `raw_nand`。
- 3D XPoint 下的 `N` 和 `S` 不输出 `cell_level`，而是输出 `die_stack`。
- 3D XPoint 电压 code `D` 目前只作为内部 code 识别；在确认实际电压范围前，不输出公开 `voltage` 字段。
- 已有 Intel / Solidigm die-profile 覆盖逻辑仍然优先，例如 `B0KB`、`N38E`、`N4PA` 等，在 cell / process / die-density key 可确定时继续覆盖基础光刻/代际信息。

## 示例

| PN | 预期解码 |
| --- | --- |
| PF29F16P2BWCQL1 | NAND, 21888Gb, QLC, BGA, 16 die, 2 channel, 3D5 192L |
| PF29P64G2ALDNF1 | 3D XPoint, 64Gb, BGA, 1 die, 2 channel, 2-Deck, 3D-XP G1 |
