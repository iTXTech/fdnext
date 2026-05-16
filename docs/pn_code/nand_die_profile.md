# NAND Die Profile 标准化

采集日期：2026-05-16

本文档记录 `nand.die_profile` 共享表的维护约定。该表用于 PN、NAND Flash ID、MPTool / firmware 线索之间的统一匹配，不代表所有字段都会进入公开 result。

## 公开字段边界

- `process_node`、`generation_info`、`layer_count`、`die_density`、`cell_level`、`plane_count`、`die_codename` 可以按规则需要进入公开 fields。
- `firmware_match`、`firmware_base`、`die_mark` 只作为匹配和维护 metadata，不默认进入公开 fields。
- Toshiba / SanDisk 的 full firmware code（例如 `8T24`）可以作为 profile key 直接匹配；公开展示优先使用 `generation_info = BiCS4` 等稳定代际，而不是把内部 die mark 展示给用户。
- 2D NAND 默认没有 `generation_info`；能确认制程节点时使用 `process_node`。

## Key 约定

2D profile 使用：

```text
ProcessNode / Cell / Die Density / Plane / Codename
```

示例：

| Key | 含义 | Firmware base |
| --- | --- | --- |
| `T15M2P` | Toshiba 15nm MLC 128Gb 2-plane | `2DM` |
| `T15M4P` | Toshiba 15nm MLC 128Gb 4-plane | `2DM` |
| `T15T` | Toshiba 15nm TLC | `2DT` |
| `S15T` | SanDisk 15nm TLC | `2DT` |

Toshiba / SanDisk 2D 旧式 token（例如 `7DDL`、`7DFL`、Enterprise 变种）应在规则侧先规范化到对应 profile 或 `2DM` / `2DT` firmware base。

3D profile 使用：

```text
Generation / Layer / Cell / Die Density / Plane / Codename
```

示例：`V4 / 96L / TLC / 256Gb / 2-plane / B27A`。

跨厂商命名约定：

| 厂商 | 2D key | 3D key | Cell 后缀 |
| --- | --- | --- | --- |
| SK hynix | `HY14`、`HY16`、`HY20` | `HYV1`、`HYV4`、`HYV6Q` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC |
| Samsung | `SS14`、`SS16`、`SS19` | `SSV1`、`SSV4`、`SSV6P` | 无后缀默认 TLC；`M` = MLC；`Q` = QLC |
| Toshiba / SanDisk | `T15M2P`、`T15T`、`S15T` | `BiCS4` 或 `8T24` 这类 firmware full code | BiCS 默认 TLC；`M` = MLC；`Q` = QLC；`S` = SLC / XL-Flash |
| Micron / Intel | `L95B`、`M60A` 等 | `B27A`、`N28A` 等 | 按厂商 codename 自身区分 |

Samsung 的真实内部代号常来自单 die PN（例如 `K9AHGD8U0M/A/B/C/D` 表示不同 3D Vx 的同容量 die）。这类 PN 线索可作为规则来源，但公开 profile key 仍优先使用 `SSVx`。

## Toshiba / SanDisk BiCS firmware key

Toshiba / SanDisk BiCS 既保留 `BiCSx` 泛化 key，也保留 full firmware code 作为可直接匹配的 key。固件侧可以先按 `firmware_base` 归并；同一 base 下的差异主要由 full code 和 `die_mark` 维护。

| Profile key | Firmware base | Generation | Cell | Die density | Plane | Internal die mark |
| --- | --- | --- | --- | --- | --- | --- |
| `8T22` | `T22` | BiCS2 | TLC | 256Gb | 2 | `FPL9` |
| `7T23` | `T23` | BiCS3 | TLC | 125Gb | 2 | `FRN2` |
| `8T23` | `T23` | BiCS3 | TLC | 256Gb | 2 | `FRN1` |
| `9T23` | `T23` | BiCS3 | TLC | 512Gb | 2 | `FRN4` |
| `7SA4` | `SA4` | BiCS4 | SLC | 128Gb | 16 | `FSN9` |
| `8T24` | `T24` | BiCS4 | TLC | 256Gb | 2 | `FST0` |
| `9T24` | `T24` | BiCS4 | TLC | 512Gb | 2 | `FSK3` |
| `xF24` | `F24` | BiCS4 | QLC | 1.33Tb | - | `FSP0` |
| `8T2M` | `T2M` | BiCS4.5 | TLC | 256Gb | 2 | `FXE4` |
| `9T2M` | `T2M` | BiCS4.5 | TLC | 512Gb | 2 | `FXE5` |
| `9T45` | `T45` | BiCS5 | TLC | 512Gb | 4 | `FXN5` |
| `0T25` | `T25` | BiCS5 | TLC | 1Tb | 2 | `FXN6` |
| `9T46` | `T46` | BiCS6 | TLC | 512Gb | 4 | `FXZ5` |
| `0T46` | `T46` | BiCS6 | TLC | 1Tb | 4 | `FXZ0` |

这些 full code 和 `die_mark` 偏内部维护，不默认展示。DecodePack 规则需要用户可见代际时，优先输出 `generation_info`、`layer_count`、`cell_level`、`die_density` 和 `plane_count`。
