# Samsung Raw NAND PN 编码

采集日期：2026-05-16

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/samsung-raw-token.json`
- `vendor.samsung.token.v1`

来源状态：本轮维护中由用户提供 Samsung 3D V-NAND die 标识表；外部公开 reference 待补。规则只按结构 token 落地，不维护完整 PN 白名单。

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `K9` + classification + density + technology + width + voltage + mode + generation + optional package / temperature / bad-block | Samsung raw NAND token form |
| classification | cell level and die count |
| density | package density |
| technology | Toggle DDR generation flag |
| width | device width |
| voltage | voltage option |
| mode | CE / R/B count |
| generation | generation code; may also feed process profile matching through FDB / die profile rules |

## Single-die profile rule

Samsung 3D V-NAND single-die PN can be mapped by `cell_level + die density + generation suffix`.
This rule only applies when the PN topology token decodes to one physical die; multi-die package PN must use a separate package-level mapping because the package suffix may not equal the equivalent single-die suffix.

| Cell | Die density | Suffix | Profile |
| --- | --- | --- | --- |
| TLC | 256Gb | `M` | `SSV4` |
| TLC | 512Gb | `M` | `SSV4` |
| TLC | 512Gb | `A` | `SSV5` |
| TLC | 512Gb | `B` | `SSV6` |
| TLC | 512Gb | `E` | `SSV6P` |
| TLC | 512Gb | `D` | `SSV7` |
| TLC | 512Gb | `F` | `SSV8` |

Known package-level exception:

| PN structure | Profile |
| --- | --- |
| `K9D...VG...5E` 1TB TLC 16-die package | `SSV6P` |

## 输出字段

- `density`
- `cell_level`
- `die_codename`
- `layer_count`
- `die_count`
- `ce_count`
- `rb_count`
- `device_width`
- `voltage`
- `toggle`
- `package`
- `lead_free`
- `halogen_free`
- `cu`
- `operation_temperature`
- `bad_block`

`classificationCode`、`densityCode`、`modeCode`、`generationCode`、`packageCode` 等 token 只用于内部解析，不进入公开字段。

## 已知拓扑规则

| Token | 输出 |
| --- | --- |
| classification `X` | `die_count = 16` |
| mode `2` | `ce_count = 4` |

这些规则用于补齐 `K9X...` 系列的 16 die 拓扑，以及 `K9OVGD8J2B` 这类 mode `2` 的 4 CE 拓扑。

## 测试样例

- `K9OVGD8J2B`
- `K9XVGB8J1M`
- `K9XVGY8J5A`
- `K9XVGD8J5C`
- `K9AFGD8J0M`
- `K9AHGD8J0A`
- `K9AHGD8J0B`
- `K9AHGD8J0D`
- `K9AHGD8J0E`
- `K9AHGD8J0F`
- `K9AHGD8J0M`
- `K9DVGY8J5E`
