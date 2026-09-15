# NAND die 规格标准化

采集日期：2026-05-16

本文档记录 `nand.die_profile` 共享表的维护约定。该表用于 PN、NAND Flash ID、MPTool / 固件线索之间的统一匹配，不代表所有字段都会进入公开结果。

## 公开字段边界

公开字段、显示格式与元数据边界统一见 [NAND 术语](terminology.md#nand--受管理-nand)。精确规格键的输出语法见 [DecodePack](../DECODEPACK.md#赋值表达式-assigndecodeexpr)。

## 键约定

2D 规格使用：

```text
Cell / Die Density / Plane / Codename
```

示例：

| 键 | 含义 | 固件匹配 |
| --- | --- | --- |
| `TSB15M2P` | Toshiba 15nm MLC 128Gb 2-平面 | `2DM` |
| `TSB15M4P` | Toshiba 15nm MLC 128Gb 4-平面 | `2DM` |
| `SNK15M2P` | SanDisk 15nm MLC 128Gb 2-平面 | `2DM` |
| `SNK15M4P` | SanDisk 15nm MLC 128Gb 4-平面 | `2DM` |
| `TSB15T` | Toshiba 15nm TLC | `2DT` |
| `SNK15T` | SanDisk 15nm TLC | `2DT` |
| `TSB15` / `TSB15M2P` / `TSB15M4P` / `TSB15T` / `TSB19` / `TSB1Y` / `TSB24` / `TSB24A` / `TSB24B` / `TSB32` / `TSB43` / `TSB56` / `TSB70` / `TSB90` | Toshiba / Kioxia 旧版裸 NAND 制程规格；公开 `die_codename` 只显示 `15nm` / `A19nm` / `24nm` 这类光刻制程 | 单元类型明确时使用 `2DM` / `2DT` |
| `SNK15` / `SNK15M` / `SNK15T` / `SNK19` / `SNK19M` / `SNK19T` / `SNK1Y` / `SNK24` / `SNK24M` / `SNK24T` / `SNK32` / `SNK43` / `SNK56` | SanDisk 旧版 2D 制程规格，单元已知时优先使用 `M` / `T` / `S` 后缀；公开 `die_codename` 只显示光刻制程 | 单元类型明确时使用 `2DM` / `2DT` |
| `TSBD2H` / `TSBDFK` | Toshiba / Kioxia 旧版 24nm 2-平面 D2H / A19nm 4-平面 DFK 规格；公开 `die_codename` 分别显示 `24nm` / `A19nm` | `2DM` |

Kioxia / SanDisk 2D 旧式编码段（例如 `7DDL`、`7DFL`、企业级变种）应在规则侧先规范化到对应规格或 `2DM` / `2DT` 固件编码段。

3D 规格使用：

```text
Generation / Layer / Cell / Die Density / Plane / Codename
```

示例：`FG / 96L / TLC / 512Gb / B27A`。

跨厂商命名约定：

| 厂商 | 2D 键 | 3D 键 | 单元后缀 |
| --- | --- | --- | --- |
| SK hynix | `HY14`、`HY16`、`HY20` | `HYV1`、`HYV4`、`HYV9`、`HYV9H`、`HYV9Q` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC；`H` 可表示维护者确认的 V9H 变体；`H25FT*` / `H27*` 属于 `die_mark`，固件匹配仍用 `HYVx` |
| Samsung | `SS2D`、`SS16`、`SS16M`、`SS21M` | `SSV1`、`SSV2M`、`SSV3M`、`SSV4`、`SSV4Q`、`SSV5Q`、`SSV6P`、`SSV7Q`、`SSV9Q` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC；更老 2D 用 `SS2D`；Samsung 已确认的 QLC 规格仅内置 `V4Q` / `V5Q` / `V7Q` / `V9Q` |
| Kioxia / SanDisk | `TSB15`、`TSB24A`、`SNK19M`、`SNK24M`、`TSB15M2P`、`SNK15T` | `KBiCS4` / `SBiCS4` 或 `K8T24` / `S8T24` 这类厂商范围内的固件完整编码 | BiCS 默认 TLC；`M` = MLC；`Q` = QLC；`S` = SLC / XL-闪存 |
| Micron / Intel / SpecTek | `L95B`、`M70M` 等 | `B27A`、`N28A` 等 | 3D 直接使用代号；2D 一般用 `IM2DS` / `IM2DM` / `IM2DT`，`7x` / `8x` / `9x` die 代号可作为匹配键，公开 `die_codename` 补齐为 `25nm` / `20nm` / `16nm` |

Samsung 的真实内部代号常来自单 die PN（例如 `K9AHGD8U0M/A/B/C/D` 表示不同 3D Vx 的同容量 die）。这类 PN 线索可作为规则来源，但公开规格键仍优先使用 `SSVx`。

## FDBGen 回退规格

生成后的 `fdb.json` 不允许再把任意制程文本写入 `l`。`l` 必须能命中 `nand.die_profile`：优先是厂商 / die 代号规格，例如 `SNK15T`、`TSB32`、`SSV4`、`HYV3`、`B16A`；公开结果再由规格表转换成用户可见制程，例如 `15nm`、`BiCS4`、`20nm`。如果原始资料只有泛化 2D 线索，才允许使用表内回退键，例如 `50nm`。泛化 `1ynm` / `1znm` / `3D` / `3DVx` 不作为回退。

IMFT / Micron / Intel 旧短键不再作为 FDB `l` 或 `nand.die_profile` 键保留。生成侧会按下表归一：

| 旧版键 | 规范规格 | 依据 |
| --- | --- | --- |
| `B74` | `B74A` | 25nm TLC 64Gb |
| `B95` | `B95A` | 16nm TLC 128Gb |
| `L06` | `L06B` | FG 32L MLC 256Gb |
| `L62` | `L62A` | 34nm MLC 16Gb |
| `L74` | `L74A` | 25nm MLC 64Gb |
| `M70` | `M70M` | 25nm SLC 4Gb E-die 旧版映射 |

`L84` / `L85` 同时存在 A / C die，裸短键不自动归一；只有 PN、Flash ID 或原始资料明确给出 `L84A` / `L84C` / `L85A` / `L85C` 时才写入对应规范规格。旧 FDB 中没有证据的裸 `L85` 记录应移除 `l`，避免把未知写成 A-die。

旧的 `M26`、`N18`、`N38` 系列键不再作为 `nand.die_profile` 键保留。`M16A`、`M26A`、`N18A`、`N38A` / `N38B` / `N38C` / `N38E` 等具体规格仍保留；只有 PN 规则、Flash ID 规格或外部资料能确认具体 die 时才写入。pSLC 物理映射见 [SpecTek NAND](spectek_nand.md#分级与原生-die)；规格不另输出等价关系字段。

历史 `1ynm` / `1znm` FDB 绑定已按 Samsung Flash ID 规格迁移：

| 旧版规格 | PN | Flash ID | 规范规格 |
| --- | --- | --- | --- |
| `1ynm` | `K9ACGD8S0C` | `ECAEB8DE86C5` | `SS19` |
| `1ynm` | `K9BDGD8U0D` | `EC3AC9BF94C6` | `SS16` |
| `1ynm` | `K9BFGD8U0D` | `EC3CD9BF98C6` | `SS16` |
| `1znm` | `K9GCGD8U0F` | `EC3A94C3A4CA` / `ECDE94C3A4CA` | `SS14` |

运行时 FDB 命中后，`l` 只作为 `nand.die_profile` 键使用，再由规格表统一补齐公开字段，例如 `layer_count`、`die_density`、`cell_level`、`plane_count` 和 `process_alias`。不要在 FDB 或核心运行时中为某个 die 单独写层数补丁。

## Kioxia / SanDisk BiCS 固件键

Kioxia / SanDisk BiCS 规格键必须带厂商前缀，不能只在 `firmware_match` 中区分厂商。泛化制程键使用 `KBiCS3` / `SBiCS3`，完整编码键使用 `K8T23` / `S8T23`。同一制程下的具体 die 差异主要由完整编码和 `die_mark` 维护。

Kioxia / SanDisk BiCS4 与 BiCS4.5 的 Flash ID 代际位仍会落在同一组 BiCS4 编码上，需要结合第 5 字节高半字节区分：`7x` 为 BiCS4，`Fx` 为 BiCS4.5。

| 规格键 | 固件匹配 | 代际 | 单元 | 单 die 容量 | 平面 | 内部 die 标记 |
| --- | --- | --- | --- | --- | --- | --- |
| `KBiCS3` / `SBiCS3` | 与键相同 | BiCS3 | TLC | - | 2 | `FRN1` / `FRN2` / `FRN4` |
| `KBiCS4` / `SBiCS4` | 与键相同 | BiCS4 | TLC | - | - | `FST0` / `FSK3` |
| `KBiCS4S` | 与键相同 | BiCS4 | SLC | 128Gb | 16 | `FSN9` |
| `K8T22` / `S8T22` | 与键相同 | BiCS2 | TLC | 256Gb | 2 | `FPL9` |
| `K7T23` / `S7T23` | 与键相同 | BiCS3 | TLC | 125Gb | 2 | `FRN2` |
| `K8T23` / `S8T23` | 与键相同 | BiCS3 | TLC | 256Gb | 2 | `FRN1` |
| `K9T23` / `S9T23` | 与键相同 | BiCS3 | TLC | 512Gb | 2 | `FRN4` |
| `K7SA4` | 与键相同 | BiCS4 | SLC | 128Gb | 16 | `FSN9` |
| `K8T24` / `S8T24` | 与键相同 | BiCS4 | TLC | 256Gb | 2 | `FST0` |
| `K9T24` / `S9T24` | 与键相同 | BiCS4 | TLC | 512Gb | 2 | `FSK3` |
| `K8F24` | 与键相同 | BiCS4 | QLC | 1.33Tb | - | `FSP0` |
| `K8T2M` / `S8T2M` | 与键相同 | BiCS4.5 | TLC | 256Gb | 2 | `FXE4` |
| `K9T2M` / `S9T2M` | 与键相同 | BiCS4.5 | TLC | 512Gb | 2 | `FXE5` |
| `K9T45` / `S9T45` | 与键相同 | BiCS5 | TLC | 512Gb | 4 | `FXN5` |
| `K0T25` / `S0T25` | 与键相同 | BiCS5 | TLC | 1Tb | 2 | `FXN6` |
| `K9T46` / `S9T46` | 与键相同 | BiCS6 | TLC | 512Gb | 4 | `FXZ5` |
| `K0T46` / `S0T46` | 与键相同 | BiCS6 | TLC | 1Tb | 4 | `FXZ0` |

## Micron / Intel 固件键

Micron / Intel 的 3D NAND 固件匹配直接使用 die 代号，不再同时保留 `IM3D` 或 `IMB16A` 这类前缀别名。例如：

| 规格键 | 固件匹配 |
| --- | --- |
| `B16A` | `B16A` |
| `B17A` | `B17A` |
| `B27A` | `B27A` |
| `N28A` | `N28A` |
| `N38B` | `N38B` |
| `N38C` | `N38C` |
| `N38E` | `N38E` |

Intel 的编码段→规格对照见 [Intel NAND](intel_nand.md#die-规格归一)；Micron PN 的组合规则见 [Micron NAND](micron_nand.md)。

2D NAND 固件匹配一般不再按每个 die 代号展开，默认按单元类型归并：

| 单元 | 固件匹配 |
| --- | --- |
| SLC | `IM2DS` |
| MLC | `IM2DM` |
| TLC | `IM2DT` |

命名边界：IMFT / Solidigm FG 体系的 3D die 代号继续使用 `A/B/C/D/E` 等后缀，例如 `N38A`、`N38B`、`N38C`、`N38E`、`N4PA`；Micron RG 体系使用 `R/S/T` 等后缀，例如 `B47R`、`B57T`、`N58R`，这类 3D 规格不折叠成 `xxnm`。是否输出光刻制程只看 `nand.die_profile` 表内定义，不从后缀临时推断。

例外：IMFT 2D `L/M/B` die 代号可直接作为规格键匹配，例如 `L52A`、`M60A`、`L74A`、`L84A`、`B95A`、`L95B`；公开 `die_codename` 按系列补齐为 `50nm`、`34nm`、`25nm`、`20nm`、`16nm`，原始 die 代号作为 `process_alias` 展示。

公开字段选择遵循 [术语](terminology.md#nand--受管理-nand)。
