# NAND Die Profile 标准化

采集日期：2026-05-16

本文档记录 `nand.die_profile` 共享表的维护约定。该表用于 PN、NAND Flash ID、MPTool / firmware 线索之间的统一匹配，不代表所有字段都会进入公开 result。

## 公开字段边界

- `die_codename`、`process_alias`、`layer_count`、`die_density`、`cell_level`、`plane_count` 可以按规则需要进入公开 fields。
- `die_codename` 公开 label 为 `Process` / `制程`；它是用户可见制程名，不等同于 `nand.die_profile` lookup key。已有 `die_codename` 时不再重复公开 `generation_info` / `series_info`。Micron / Intel / SpecTek 2D raw NAND 的 subtitle 优先使用 `process_alias` 中的 die codename，而不是只显示 `25nm` / `20nm` 这类 litho。
- `layer_count` 与 `process_alias` 独立展示，不拼进 `die_codename` 文本；`process_alias` 用于 `X3-9060`、`8T23` 这类厂商工艺或 full-code 代号。
- `firmware_match`、`die_mark` 只作为匹配和维护 metadata，不默认进入公开 fields。
- Kioxia / SanDisk 的 BiCS profile key 必须带厂商前缀，例如 `KBiCS4` / `SBiCS4` 或 `K8T24` / `S8T24`；公开展示统一使用 `die_codename = BiCS4` / `BiCS4.5` 这类制程名，不带厂商前缀或 Cell 后缀。full code 可通过 `process_alias` 显示为 `8T24` 这类代号，而不是把内部 die mark 展示给用户。
- 2D NAND 默认不要求补齐 `generation_info`；如果规则或 FDB 只知道旧制程字样，生成侧应先规范化为 vendor profile，最弱只允许落到表内 fallback profile，例如 `50nm`、`1ynm`、`3DV4`。运行时兼容旧 FDB 时才使用 `generation_info` + `fdb_process_fallback` warning。

## Key 约定

2D profile 使用：

```text
Cell / Die Density / Plane / Codename
```

示例：

| Key | 含义 | Firmware match |
| --- | --- | --- |
| `TSB15M2P` | Toshiba 15nm MLC 128Gb 2-plane | `2DM` |
| `TSB15M4P` | Toshiba 15nm MLC 128Gb 4-plane | `2DM` |
| `SNK15M2P` | SanDisk 15nm MLC 128Gb 2-plane | `2DM` |
| `SNK15M4P` | SanDisk 15nm MLC 128Gb 4-plane | `2DM` |
| `TSB15T` | Toshiba 15nm TLC | `2DT` |
| `SNK15T` | SanDisk 15nm TLC | `2DT` |
| `TSB15` / `TSB15M2P` / `TSB15M4P` / `TSB15T` / `TSB19` / `TSB1Y` / `TSB24` / `TSB24A` / `TSB24B` / `TSB32` / `TSB43` / `TSB56` / `TSB70` / `TSB90` | Toshiba / Kioxia legacy raw NAND process profile；公开 `die_codename` 只显示 `15nm` / `A19nm` / `24nm` 这类 litho | `2DM` / `2DT` when cell-specific |
| `SNK15` / `SNK15M` / `SNK15T` / `SNK19` / `SNK19M` / `SNK19T` / `SNK1Y` / `SNK24` / `SNK24M` / `SNK24T` / `SNK32` / `SNK43` / `SNK56` | SanDisk legacy 2D process profile，cell 已知时优先使用 `M` / `T` / `S` 后缀；公开 `die_codename` 只显示 litho | `2DM` / `2DT` when cell-specific |
| `TSBD2H` / `TSBDFK` | Toshiba / Kioxia legacy 24nm 2-plane D2H / A19nm 4-plane DFK profile；公开 `die_codename` 分别显示 `24nm` / `A19nm` | `2DM` |

Kioxia / SanDisk 2D 旧式 token（例如 `7DDL`、`7DFL`、Enterprise 变种）应在规则侧先规范化到对应 profile 或 `2DM` / `2DT` firmware token。

3D profile 使用：

```text
Generation / Layer / Cell / Die Density / Plane / Codename
```

示例：`V4 / 96L / TLC / 256Gb / 2-plane / B27A`。

跨厂商命名约定：

| 厂商 | 2D key | 3D key | Cell 后缀 |
| --- | --- | --- | --- |
| SK hynix | `HY14`、`HY16`、`HY20` | `HYV1`、`HYV4`、`HYV9`、`HYV9Q` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC；`H25FT*` / `H27*` 属于 `die_mark`，固件匹配仍用 `HYVx` |
| Samsung | `SS2D`、`SS16`、`SS16M`、`SS21M` | `SSV1`、`SSV2M`、`SSV3M`、`SSV4`、`SSV6P` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC；更老 2D 用 `SS2D` |
| Kioxia / SanDisk | `TSB15`、`TSB24A`、`SNK19M`、`SNK24M`、`TSB15M2P`、`SNK15T` | `KBiCS4` / `SBiCS4` 或 `K8T24` / `S8T24` 这类 vendor-scoped firmware full code | BiCS 默认 TLC；`M` = MLC；`Q` = QLC；`S` = SLC / XL-Flash |
| Micron / Intel / SpecTek | `L95B`、`M70M` 等 | `B27A`、`N28A` 等 | 3D 直接使用 codename；2D 一般用 `IM2DS` / `IM2DM` / `IM2DT`，`7x` / `8x` / `9x` die codename 可作为匹配 key，公开 `die_codename` 补齐为 `25nm` / `20nm` / `16nm` |

Samsung 的真实内部代号常来自单 die PN（例如 `K9AHGD8U0M/A/B/C/D` 表示不同 3D Vx 的同容量 die）。这类 PN 线索可作为规则来源，但公开 profile key 仍优先使用 `SSVx`。

## FDBGen fallback profile

生成后的 `fdb.json` 不允许再把任意制程文本写入 `l`。`l` 必须能命中 `nand.die_profile`：优先是 vendor / die codename profile，例如 `SNK15T`、`TSB32`、`SSV4`、`HYV3`、`B16A`；公开 result 再由 profile 表转换成用户可见制程，例如 `15nm`、`BiCS4`、`20nm`。如果原始资料只有泛化 2D 或 3D 线索，才允许使用表内 fallback key，例如 `50nm`、`1ynm`、`1znm`、`3DV4`、`3DV4P5`。没有代际的 `3D` 不作为 fallback。

运行时 FDB 命中后，`l` 只作为 `nand.die_profile` key 使用，再由 profile 表统一补齐公开字段，例如 `layer_count`、`die_density`、`cell_level`、`plane_count` 和 `process_alias`。不要在 FDB 或 core runtime 中为某个 die 单独写层数补丁。

## Kioxia / SanDisk BiCS firmware key

Kioxia / SanDisk BiCS profile key 必须带厂商前缀，不能只在 `firmware_match` 中区分厂商。泛化制程 key 使用 `KBiCS3` / `SBiCS3`，full code key 使用 `K8T23` / `S8T23`。同一制程下的具体 die 差异主要由 full code 和 `die_mark` 维护。

| Profile key | Firmware match | Generation | Cell | Die density | Plane | Internal die mark |
| --- | --- | --- | --- | --- | --- | --- |
| `KBiCS3` / `SBiCS3` | same as key | BiCS3 | TLC | - | 2 | `FRN1` / `FRN2` / `FRN4` |
| `KBiCS4` / `SBiCS4` | same as key | BiCS4 | TLC | - | - | `FST0` / `FSK3` |
| `KBiCS4S` | same as key | BiCS4 | SLC | 128Gb | 16 | `FSN9` |
| `K8T22` / `S8T22` | same as key | BiCS2 | TLC | 256Gb | 2 | `FPL9` |
| `K7T23` / `S7T23` | same as key | BiCS3 | TLC | 125Gb | 2 | `FRN2` |
| `K8T23` / `S8T23` | same as key | BiCS3 | TLC | 256Gb | 2 | `FRN1` |
| `K9T23` / `S9T23` | same as key | BiCS3 | TLC | 512Gb | 2 | `FRN4` |
| `K7SA4` | same as key | BiCS4 | SLC | 128Gb | 16 | `FSN9` |
| `K8T24` / `S8T24` | same as key | BiCS4 | TLC | 256Gb | 2 | `FST0` |
| `K9T24` / `S9T24` | same as key | BiCS4 | TLC | 512Gb | 2 | `FSK3` |
| `K8F24` | same as key | BiCS4 | QLC | 1.33Tb | - | `FSP0` |
| `K8T2M` / `S8T2M` | same as key | BiCS4.5 | TLC | 256Gb | 2 | `FXE4` |
| `K9T2M` / `S9T2M` | same as key | BiCS4.5 | TLC | 512Gb | 2 | `FXE5` |
| `K9T45` / `S9T45` | same as key | BiCS5 | TLC | 512Gb | 4 | `FXN5` |
| `K0T25` / `S0T25` | same as key | BiCS5 | TLC | 1Tb | 2 | `FXN6` |
| `K9T46` / `S9T46` | same as key | BiCS6 | TLC | 512Gb | 4 | `FXZ5` |
| `K0T46` / `S0T46` | same as key | BiCS6 | TLC | 1Tb | 4 | `FXZ0` |

## Micron / Intel firmware key

Micron / Intel 的 3D NAND 固件匹配直接使用 die codename，不再同时保留 `IM3D` 或 `IMB16A` 这类前缀别名。例如：

| Profile key | Firmware match |
| --- | --- |
| `B16A` | `B16A` |
| `B17A` | `B17A` |
| `B27A` | `B27A` |
| `N28A` | `N28A` |
| `N38B` | `N38B` |
| `N38C` | `N38C` |
| `N38E` | `N38E` |

Intel raw PN 的制程 token 按 `cell + generation suffix + computed die density` 归一，避免只用后缀误判同一代中不同 die size 的型号。当前确认规则：

| Cell + suffix + die density | Profile key |
| --- | --- |
| `M:E1:64Gb` | `L74A` |
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

2D NAND 固件匹配一般不再按每个 die codename 展开，默认按 cell 类型归并：

| Cell | Firmware match |
| --- | --- |
| SLC | `IM2DS` |
| MLC | `IM2DM` |
| TLC | `IM2DT` |

命名边界：IMFT / Solidigm FG 体系的 3D die codename 继续使用 `A/B/C/D/E` 等后缀，例如 `N38A`、`N38B`、`N38C`、`N38E`、`N4PA`；Micron RG 体系使用 `R/S/T` 等后缀，例如 `B47R`、`B57T`、`N58R`，这类 3D profile 不折叠成 `xxnm`。是否输出 litho 只看 `nand.die_profile` 表内定义，不从后缀临时推断。

例外：IMFT 2D `L/M/B` die codename 可直接作为 profile key 匹配，例如 `L52A`、`M60A`、`L74A`、`L84A`、`B95A`、`L95B`；公开 `die_codename` 按系列补齐为 `50nm`、`34nm`、`25nm`、`20nm`、`16nm`，原始 die codename 作为 `process_alias` 展示。

这些 full code 和 `die_mark` 偏内部维护，raw `firmware_match` / `die_mark` 不默认展示。DecodePack 规则需要用户可见制程时，优先输出 `die_codename`、`process_alias`、`layer_count`、`cell_level`、`die_density` 和 `plane_count`。
