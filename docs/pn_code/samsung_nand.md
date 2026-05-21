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

Known package-level process rule:

| PN structure | Profile |
| --- | --- |
| `K9D...VG...[mode]E` 1TB TLC 16-die package | `SSV6P` |
| `K9D...YG...[mode]B` 2TB TLC 16-die package | `SSV8` |
| `K9D...YG...[mode]D` 2TB TLC 16-die package | `SSV9` |
| `K99...UG...[mode]C` 512GB QLC 8-die package | `SSV7Q` |
| `K9X...VG...[mode]M` 1TB QLC 16-die package | `SSV4Q` |
| `K9X...VG...[mode]A` 1TB QLC 16-die package | `SSV5Q` |
| `K9X...VG...[mode]C` 1TB QLC 16-die package | `SSV7Q` |
| `K9X...VG...[mode]D` 1TB QLC 16-die package | `SSV9Q` |

- `K9DYGY8J5B-CCK0`：TechInsights 确认其为 16 die package，内部 die 为 1Tb 236L TLC V8；外部 Flash ID 表和本地 FDB 同向记录 `EC52EA3F8ECF`。单个 `EC52EA3F8ECF` ID decode 为 512GB，4 组组成 `K9D...YG...` 的 2TB package。
  <https://www.techinsights.com/blog/samsung-k9dygy8j5b-cck0-236-layer-3d-nand-flash-advanced-memory-essentials>
  <https://www.techinsights.com/products/iwo-2310-801>
  <https://bbs.wuyou.net/forum.php?mod=viewthread&tid=449091>
- `K9DYGY8J5D`：由用户补充为同拓扑 `SSV9`；当前未在本地 FDB 或公开检索中找到对应 Flash ID。
- Samsung QLC V-NAND 已确认使用 `V4Q` / `V5Q` / `V7Q` / `V9Q`。这些 QLC profile 通过 DecodePack package-level token 和 Flash ID postprocess 确定性匹配，不依赖 FDB `l` 字段补齐；PN 规则绑定 `K9` 后 classification + density 头部和末尾 revision，倒数第二位 mode 只影响 CE / R/B 拓扑，不参与制程判断。FDBGen 只在生成侧把 Samsung `SSV4` / `SSV5` / `SSV7` / `SSV9` + `QLC` 归一到对应 `SSVxQ`。

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
- `K9XVGY8J5M`
- `K9XVGY8J5A`
- `K9XVGD8J5C`
- `K99UGY8J5C`
- `K9XVGD8J5D`
- `K9AFGD8J0M`
- `K9AHGD8J0A`
- `K9AHGD8J0B`
- `K9AHGD8J0D`
- `K9AHGD8J0E`
- `K9AHGD8J0F`
- `K9AHGD8J0M`
- `K9DVGY8J5E`
- `K9DYGY8J5B`
- `K9DYGY8J5D`
