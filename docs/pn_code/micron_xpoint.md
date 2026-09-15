# Micron 3D XPoint PN

资料状态：本页依据维护线程中提供的 Micron MTX / 3D XPoint 料号体系图片整理。仓库内未记录公开 URL。图中的速度等级只用于占位对齐，不进入 DecodePack 公开输出。

## 当前结构化格式

当前表格按以下结构解析 PN：

`MT XP [容量] [配置] [封装通道] [die generation] [封装] - [speed grade] [features] [production status]`

其中：

| 位置 | 含义 |
| --- | --- |
| `MT` | Micron 技术 |
| `XP` | MTX / 3D XPoint |
| 容量 | 器件总容量 |
| 配置 | die 数量和 nCE |
| 封装通道 | 1 通道或 2 通道 |
| die 代际 | 按单 die 容量 + 代际编码解释 |
| 封装 | 256 球 LFBGA 尺寸 |
| 速度等级 | 当前忽略，不输出 |
| 特性 | 图中未给出可读含义，当前只消费编码段，不输出 |
| 生产状态 | 空白为量产，`ES` 为 工程样品 |

## 容量编码段

| 编码段 | 标称容量 |
| --- | --- |
| 128G | 128Gb (16GB) |
| 256G | 256Gb (32GB) |
| 512G | 512Gb (64GB) |
| 1T | 1024Gb (128GB) |
| 2T | 2048Gb (256GB) |
| 4T | 4096Gb (512GB) |

DecodePack 仍按项目约定使用 Mbit 存储 `density`。

## 配置与通道

配置编码段：

| 编码段 | Die 数量 | nCE |
| --- | --- | --- |
| A | 1 | 1 |
| C | 2 | 2 |
| J | 4 | 4 |
| N | 8 | 8 |

封装通道编码段：

| 编码段 | 含义 |
| --- | --- |
| 1 | 1 通道 |
| 2 | 2 通道 |

## die 代际

die 代际表按单 die 容量解释；例如 `MTXP2TN2ARS-125AES` 的器件容量为 2T，配置 `N` 为 8 die，因此单 die 容量为 256Gb，代际 `A` 对应 `S26A / 4-Deck`。

| 单 die 容量 | 编码段 | die 代号 | Deck |
| --- | --- | --- | --- |
| 128Gb | A | S15C | 2-Deck |
| 128Gb | B | - | 2-Deck |
| 128Gb | D | S25D | 2-Deck |
| 256Gb | A | S26A | 4-Deck |
| 512Gb | D | S37D | 8-Deck |

`128Gb:B` 图中没有给出 die 代号，DecodePack 只输出 `2-Deck`，不推断代号。

## 封装、状态与忽略项

封装编码段：

| 编码段 | 含义 |
| --- | --- |
| RJ | 256 球 LFBGA 14x18x1.30 |
| RS | 256 球 LFBGA 14x18x1.50 |

生产状态：

| 编码段 | 含义 |
| --- | --- |
| 空白 | 生产 |
| ES | 工程样品 |

特性编码段包含 `A`、`AM`、`B`、`C`、`P`、`R`、`RM`，但图中没有提供可读含义，当前不输出公开字段。速度等级位置目前只消费三位数字，不输出 `speed_grade`。

## 示例

| PN | 预期解码 |
| --- | --- |
| MTXP2TN2ARS-125AES | 3D XPoint, 2048Gb, 8 die, 2 通道, S26A, 4-Deck, 256 球 LFBGA 14x18x1.50, 工程样品 |
| MTXP128GA1BRJ-125 | 3D XPoint, 128Gb, 1 die, 1 通道, 2-Deck, 256 球 LFBGA 14x18x1.30 |
