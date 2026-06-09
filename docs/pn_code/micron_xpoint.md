# Micron 3D XPoint PN

资料状态：本页依据维护线程中提供的 Micron MTX / 3D XPoint Part Number System 图片整理。仓库内未记录公开 URL。图中的 speed grade 只用于占位对齐，不进入 DecodePack 公开输出。

## 当前结构化格式

当前表格按以下结构解析 PN：

`MT XP [容量] [配置] [封装通道] [die generation] [封装] - [speed grade] [features] [production status]`

其中：

| 位置 | 含义 |
| --- | --- |
| `MT` | Micron Technology |
| `XP` | MTX / 3D XPoint |
| 容量 | 器件总容量 |
| 配置 | die 数量和 nCE |
| 封装通道 | 1 channel 或 2 channel |
| die generation | 按 die density + generation code 解释 |
| 封装 | 256-ball LFBGA 尺寸 |
| speed grade | 当前忽略，不输出 |
| features | 图中未给出可读含义，当前只消费 token，不输出 |
| production status | 空白为量产，`ES` 为 Engineering Samples |

## 容量 token

| Token | 标称容量 |
| --- | --- |
| 128G | 128Gb (16GB) |
| 256G | 256Gb (32GB) |
| 512G | 512Gb (64GB) |
| 1T | 1024Gb (128GB) |
| 2T | 2048Gb (256GB) |
| 4T | 4096Gb (512GB) |

DecodePack 仍按项目约定使用 Mbit 存储 `density`。

## 配置与通道

配置 token：

| Token | Die 数量 | nCE |
| --- | --- | --- |
| A | 1 | 1 |
| C | 2 | 2 |
| J | 4 | 4 |
| N | 8 | 8 |

封装通道 token：

| Token | 含义 |
| --- | --- |
| 1 | 1 Channel |
| 2 | 2 Channel |

## Die generation

Die generation 表按 die density 解释；例如 `MTXP2TN2ARS-125AES` 的器件容量为 2T，配置 `N` 为 8 die，因此 die density 为 256Gb，generation `A` 对应 `S26A / 4-Deck`。

| Die density | Token | Die codename | Deck |
| --- | --- | --- | --- |
| 128Gb | A | S15C | 2-Deck |
| 128Gb | B | - | 2-Deck |
| 128Gb | D | S25D | 2-Deck |
| 256Gb | A | S26A | 4-Deck |
| 512Gb | D | S37D | 8-Deck |

`128Gb:B` 图中没有给出 die codename，DecodePack 只输出 `2-Deck`，不推断代号。

## 封装、状态与忽略项

封装 token：

| Token | 含义 |
| --- | --- |
| RJ | 256-ball LFBGA 14x18x1.30 |
| RS | 256-ball LFBGA 14x18x1.50 |

Production status：

| Token | 含义 |
| --- | --- |
| 空白 | Production |
| ES | Engineering Samples |

Features token 包含 `A`、`AM`、`B`、`C`、`P`、`R`、`RM`，但图中没有提供可读含义，当前不输出公开字段。Speed grade 位置目前只消费三位数字，不输出 `speed_grade`。

## 示例

| PN | 预期解码 |
| --- | --- |
| MTXP2TN2ARS-125AES | 3D XPoint, 2048Gb, 8 die, 2 channel, S26A, 4-Deck, 256-ball LFBGA 14x18x1.50, Engineering Samples |
| MTXP128GA1BRJ-125 | 3D XPoint, 128Gb, 1 die, 1 channel, 2-Deck, 256-ball LFBGA 14x18x1.30 |
