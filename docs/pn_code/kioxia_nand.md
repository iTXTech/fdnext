# KIOXIA Raw NAND PN 编码

采集日期：2026-05-13

## 外部资料

- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: raw NAND large-block 页给出 `TC58` / `TH58` 单/多芯片、NAND interface、voltage、density、cell level、width/page/block、design rule、package、channel/CE 和 package size token。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kioxia-raw-token.json`
- `vendor.kioxia.token.tc.v1`
- `vendor.kioxia.token.th.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC58/TH58` + interface + voltage + density + cell + width + process + package + channel/CE + package size | Toshiba/KIOXIA raw NAND large-block form |
| prefix `TC58` / `TH58` | single-chip / multi-chip |
| interface/flag `N/D/T` | token position from Toshiba raw NAND decoder; `T` marks Toggle mode internally, current rule also recognizes `L`; no public `interface_type` output |
| voltage `V/Y/A/B/D` | Vcc/VccQ 组合 |
| density `M8/M9/G0..G9/GA/GB/GC/GD/GE/GF/T0/T1` | 256Mbit 到 2Tbit |
| cell `S/H` | SLC |
| cell `D/E/J/C` | MLC |
| cell `T/U/V/X` | TLC |
| cell `F` | QLC |
| width/page/block `0..4` / `5..9` | x8 / x16 and page/block size |
| process `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z，对应 legacy profile `TSB130/TSB90/TSB70/TSB56/TSB43/TSB32/TSB24A/TSB24B/TSB19/TSB1Y/TSB15` |
| package `FT/TG/TA/XB/XG/BA/XL/LA` | TSOP/BGA/LGA plus lead-free and halogen-free flags |
| classification `0/2/4/7/8/A/B` and industrial `I/K/M/R/S/U/V` | channel / CE count |
| package size code | TSOP/LGA/BGA package dimensions |

## 输出字段

- `density`
- `cell_level`
- `die_codename`
- `device_width`
- `voltage`
- `page_size`
- `block_size`
- `plane`
- `package`
- `lead_free`
- `halogen_free`
- `multi_chip`
- `ce_count`
- `channel_count`

`package_code` 等 Toshiba/KIOXIA decoder token 只用于内部解析，不进入公开字段。

## 测试样例

- `TH58NVG7D2FTA00`
- `TC58NVG7D2FTA00`

## 注意

Raw NAND 的 `TH58` / `TC58` 规则只解释 raw NAND token。`THG...` eMMC/UFS/E2NAND 由独立 managed NAND pack 处理，避免用厂商前缀做泛化分类。
