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

## 第 3 位 Die Stack / Cell Level

第 3 位 classification token 同时决定 cell level 和封装内 die stack。当前 DecodePack 按用户提供的 Samsung 表更新这些结构化 token；其中 `N` / `M` 的 `DSP` 解释为 Dual Stack Package，即两个 4-die stack，总 die 数输出为 8。

| Token | Cell | Die stack | die_count |
| --- | --- | --- | --- |
| `T` | SLC Small Block | SDP (1-die) | 1 |
| `E` | SLC Small Block | DDP (2-die) | 2 |
| `R` | MLC | 12DP (12-die) | 12 |
| `F` | SLC | SDP (1-die) | 1 |
| `K` | SLC | DDP (2-die) | 2 |
| `W` | SLC | QDP (4-die) | 4 |
| `N` | SLC | DSP (Dual Stack Package, 4-die x2) | 8 |
| `Q` | SLC | ODP (8-die) | 8 |
| `V` | SLC | HDP (16-die) | 16 |
| `G` | MLC | SDP (1-die) | 1 |
| `L` | MLC | DDP (2-die) | 2 |
| `H` | MLC | QDP (4-die) | 4 |
| `M` | MLC | DSP (Dual Stack Package, 4-die x2) | 8 |
| `P` | MLC | ODP (8-die) | 8 |
| `U` | MLC | HDP (16-die) | 16 |
| `J` | MLC | 3DP (3-die) | 3 |
| `S` | MLC | 6DP (6-die) | 6 |
| `A` | TLC | SDP (1-die) | 1 |
| `B` | TLC | DDP (2-die) | 2 |
| `C` | TLC | QDP (4-die) | 4 |
| `O` | TLC | ODP (8-die) | 8 |
| `D` | TLC | HDP (16-die) | 16 |
| `1` | TLC | HDP (16-die) | 16 |
| `3` | QLC | SDP (1-die) | 1 |
| `9` | QLC | QDP (4-die) | 4 |
| `X` | QLC | ODP (8-die) | 8 |
| `Y` | QLC | HDP (16-die) | 16 |
| `8` | QLC | 32DP (32-die) | 32 |
| `2` | SLC XD Card | DDP (2-die) | 2 |
| `4` | SLC XD Card | QDP (4-die) | 4 |
| `5` | MLC XD Card | SDP (1-die) | 1 |
| `6` | MLC XD Card | DDP (2-die) | 2 |
| `7` | MLC XD Card | QDP (4-die) | 4 |

注意：表中存在历史产品线复用 token 的情况，例如 `D` / `S` / `R` 等也在 SmartMedia 或 Small Block 分组出现。当前 raw NAND 规则沿用既有主线解释；如后续需要精确区分 SmartMedia / XD Card，应结合额外位置 token 或外部 datasheet 再拆规则。

## 第 4/5 位 Density

第 4/5 位为 package density。当前补入用户表中的 `20 = 2Mb (256KB)`。`LG` / `ZG` / `NG` / `EG` / `GG` 等 token 在 General / Legacy 表中存在重叠；为兼容已有 legacy 和本地 FDB 样例，本轮不把这些重叠 token 全局迁移到新 General 容量，后续若有可区分上下文再做结构化覆盖。

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
| `K99...UG...[mode]C` 512GB QLC QDP package | `SSV7Q` |
| `K9X...VG...[mode]M` 1TB QLC ODP package | `SSV4Q` |
| `K9X...VG...[mode]A` 1TB QLC ODP package | `SSV5Q` |
| `K9X...VG...[mode]C` 1TB QLC ODP package | `SSV7Q` |
| `K9X...VG...[mode]D` 1TB QLC ODP package | `SSV9Q` |

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
- `die_stack`
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
| classification `N` / `M` | `die_stack = DSP (Dual Stack Package, 4-die x2)`，`die_count = 8` |
| classification `X` | `die_count = 8` |
| classification `9` | `die_count = 4` |
| mode `2` | `ce_count = 4` |

这些规则用于补齐 `K9X...` / `K99...` 等 QLC 拓扑，以及 `K9OVGD8J2B` 这类 mode `2` 的 4 CE 拓扑。

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
