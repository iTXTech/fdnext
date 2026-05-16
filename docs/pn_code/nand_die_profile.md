# NAND Die Profile 标准化

采集日期：2026-05-16

本文档记录 `nand.die_profile` 共享表的维护约定。该表用于 PN、NAND Flash ID、MPTool / firmware 线索之间的统一匹配，不代表所有字段都会进入公开 result。

## 公开字段边界

- `die_codename`、`generation_info`、`layer_count`、`die_density`、`cell_level`、`plane_count` 可以按规则需要进入公开 fields。
- `firmware_match`、`die_mark` 只作为匹配和维护 metadata，不默认进入公开 fields。
- Kioxia / SanDisk 的 BiCS profile key 必须带厂商前缀，例如 `KBiCS4` / `SBiCS4` 或 `K8T24` / `S8T24`；公开展示优先使用 `generation_info = BiCS4` 等稳定代际，而不是把内部 die mark 展示给用户。
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
| `TSB15` / `TSB15M2P` / `TSB15M4P` / `TSB15T` / `TSB19` / `TSB1Y` / `TSB24` / `TSB24A` / `TSB24B` / `TSB32` / `TSB43` / `TSB56` / `TSB70` / `TSB90` | Toshiba / Kioxia legacy raw NAND process profile，node 信息由 key 承载，默认不额外输出 `generation_info` | `2DM` / `2DT` when cell-specific |
| `SNK15` / `SNK15M` / `SNK15T` / `SNK19` / `SNK19M` / `SNK19T` / `SNK1Y` / `SNK24` / `SNK24M` / `SNK24T` / `SNK32` / `SNK43` / `SNK56` | SanDisk legacy 2D process profile，cell 已知时优先使用 `M` / `T` / `S` 后缀 | `2DM` / `2DT` when cell-specific |
| `TSBD2H` / `TSBDFK` | Toshiba / Kioxia legacy 24nm 2-plane D2H / A19nm 4-plane DFK profile，node 信息由 key 承载，默认不额外输出 `generation_info` | `2DM` |

Kioxia / SanDisk 2D 旧式 token（例如 `7DDL`、`7DFL`、Enterprise 变种）应在规则侧先规范化到对应 profile 或 `2DM` / `2DT` firmware token。

3D profile 使用：

```text
Generation / Layer / Cell / Die Density / Plane / Codename
```

示例：`V4 / 96L / TLC / 256Gb / 2-plane / B27A`。

跨厂商命名约定：

| 厂商 | 2D key | 3D key | Cell 后缀 |
| --- | --- | --- | --- |
| SK hynix | `HY14`、`HY16`、`HY20` | `HYV1`、`HYV4`、`HYV9`、`HYV9Q` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC |
| Samsung | `SS2D`、`SS16`、`SS16M`、`SS21M` | `SSV1`、`SSV2M`、`SSV3M`、`SSV4`、`SSV6P` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC；更老 2D 用 `SS2D` |
| Kioxia / SanDisk | `TSB15`、`TSB24A`、`SNK19M`、`SNK24M`、`TSB15M2P`、`SNK15T` | `KBiCS4` / `SBiCS4` 或 `K8T24` / `S8T24` 这类 vendor-scoped firmware full code | BiCS 默认 TLC；`M` = MLC；`Q` = QLC；`S` = SLC / XL-Flash |
| Micron / Intel | `L95B`、`M60A` 等 | `B27A`、`N28A` 等 | 3D 直接使用 codename；2D 一般用 `IM2DS` / `IM2DM` / `IM2DT`，`L8x` / `B9x` / `L9x` 直接使用 codename |

Samsung 的真实内部代号常来自单 die PN（例如 `K9AHGD8U0M/A/B/C/D` 表示不同 3D Vx 的同容量 die）。这类 PN 线索可作为规则来源，但公开 profile key 仍优先使用 `SSVx`。

## FDBGen fallback profile

生成后的 `fdb.json` 不允许再把任意制程文本写入 `l`。`l` 必须能命中 `nand.die_profile`：优先是 vendor / die codename profile，例如 `SNK15T`、`TSB32`、`SSV4`、`HYV3`、`B16A`；如果原始资料只有泛化 2D 或 3D 线索，才允许使用表内 fallback key，例如 `50nm`、`1ynm`、`1znm`、`3DV4`、`3DV4P5`。没有代际的 `3D` 不作为 fallback。

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
| `B27A` | `B27A` |
| `N28A` | `N28A` |

2D NAND 固件匹配一般不再按每个 die codename 展开，默认按 cell 类型归并：

| Cell | Firmware match |
| --- | --- |
| SLC | `IM2DS` |
| MLC | `IM2DM` |
| TLC | `IM2DT` |

例外：`L8x`、`B9x`、`L9x` 直接使用 die codename，例如 `L84A`、`B95A`、`L95B`。

这些 full code 和 `die_mark` 偏内部维护，不默认展示。DecodePack 规则需要用户可见代际时，优先输出 `generation_info`、`layer_count`、`cell_level`、`die_density` 和 `plane_count`。
