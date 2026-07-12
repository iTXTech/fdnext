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
| `K9` + classification + density + organization + voltage + mode + generation + optional package / temperature / bad-block | Samsung raw NAND token form |
| classification | cell level and die count |
| density | package density |
| organization | bus width and SDR / Toggle DDR interface marker |
| voltage | voltage option |
| mode | configuration: CE / R/B count and option notes |
| generation | generation code; may also feed process profile matching through FDB / die profile rules |

## 第 6/7 位 Organization

第 6/7 位按 Samsung organization 表整体解析。DecodePack 公开输出 `device_width`、`interface_type` 和有增量信息的 `interface_note`：`D8` / `Y8` / `B8` / `W8` / `K8` / `S8` / `A8` / `C8` 均只标注为 `Toggle DDR`，不再输出 Toggle DDR 版本号。`Normal` / `DDR Normal` 这类默认 note 不进入 public fields；`K8` / `S8` / `A8` / `C8` 的 Channel / 封装厂 note 仍不进入 DecodePack note，也不进入 public fields。

| Code | Bus width | public interface | public interface_note | Source note |
| --- | --- | --- | --- | --- |
| `00` | NONE | NONE |  |  |
| `08` | x8 | SDR |  | Normal |
| `16` | x16 | SDR |  | Normal |
| `32` | x32 | SDR |  | Normal |
| `64` | x64 | SDR |  | Normal |
| `Z8` | x8 | SDR | `SSD` | SSD |
| `D8` | x8 | Toggle DDR |  | DDR Normal |
| `Y8` | x8 | Toggle DDR | `HP` | HP |
| `B8` | x8 | Toggle DDR | `HP w/ FBI Chip` | HP w/ FBI Chip |
| `W8` | x8 | Toggle DDR | `Wafer` | Wafer |
| `K8` | x8 | Toggle DDR |  |  |
| `S8` | x8 | Toggle DDR |  |  |
| `A8` | x8 | Toggle DDR |  |  |
| `C8` | x8 | Toggle DDR |  |  |

`FBI` 指 `Frequency Boosting Interface`。DecodePack 内部 note 保持 `FBI` 缩写，不把展开文本写入规则输出。

## 第 8 位 Operating Voltage Range

第 8 位 voltage token 按 Samsung operating-voltage 表输出。表中同一 code 有多行可选 VccQ 或宽范围组合时，public result 只保留一个合并后的主值；固定双电源组合才同时输出 `Vcc` / `VccQ`。完整来源行保留在下方 source table，避免丢失截图资料。

| Code | public voltage |
| --- | --- |
| `0` | `NONE` |
| `A` | `Vcc: 1.65V~3.60V` |
| `B` | `Vcc: 2.70V (2.50V~2.90V)` |
| `C` | `Vcc: 5.00V (4.50V~5.50V)` |
| `D` | `Vcc: 2.65V (2.40V~2.90V)` |
| `E` | `Vcc: 2.30V~3.60V` |
| `F` / `H` | `Vcc: 3.30V (2.70V~3.60V); VccQ: 1.80V (1.70V~1.95V)` |
| `J` | `Vcc: 2.50V (2.35V~2.75V); VccQ: 1.20V (1.14V~1.26V)` |
| `Q` | `Vcc: 1.80V (1.70V~1.95V)` |
| `R` | `Vcc: 1.80V (1.65V~1.95V)` |
| `S` | `Vcc: 3.30V (2.70V~3.60V); VccQ: 1.80V (1.65V~1.95V)` |
| `T` | `Vcc: 2.40V~3.00V` |
| `U` | `Vcc: 3.30V (2.70V~3.60V)` |
| `V` | `Vcc: 3.30V (3.00V~3.60V)` |
| `W` | `Vcc: 2.70V~5.50V` |

完整来源表：

| Code | Vcc | VccQ |
| --- | --- | --- |
| `0` | NONE | NONE |
| `A` | 1.65V~3.60V | - |
| `B` | 2.70V (2.50V~2.90V) | - |
| `B` | 2.70V (2.50V~2.90V) | 2.70V (2.50V~2.90V) |
| `C` | 5.00V (4.50V~5.50V) | - |
| `D` | 2.65V (2.40V~2.90V) | - |
| `D` | 2.65V (2.40V~2.90V) | 2.65V (2.40V~2.90V) |
| `E` | 2.30V~3.60V | - |
| `F` | 3.30V (2.70V~3.60V) | 1.80V (1.70V~1.95V) |
| `H` | 3.30V (2.70V~3.60V) | 1.80V (1.70V~1.95V) |
| `J` | 2.50V (2.35V~2.75V) | 1.20V (1.14V~1.26V) |
| `Q` | 1.80V (1.70V~1.95V) | - |
| `Q` | 1.80V (1.70V~1.95V) | 1.80V (1.70V~1.95V) |
| `R` | 1.80V (1.65V~1.95V) | - |
| `R` | 1.80V (1.65V~1.95V) | 1.80V (1.65V~1.95V) |
| `S` | 3.30V (2.70V~3.60V) | 1.80V (1.70V~1.95V) |
| `S` | 3.30V (2.70V~3.60V) | 1.80V (1.65V~1.95V) |
| `T` | 2.40V~3.00V | - |
| `U` | 3.30V (2.70V~3.60V) | - |
| `U` | 3.30V (2.70V~3.60V) | 3.30V (2.70V~3.60V) |
| `U` | 3.30V (2.70V~3.60V) | 2.70V~5.50V |
| `V` | 3.30V (2.70V~3.60V) | - |
| `V` | 3.30V (3.00V~3.60V) | - |
| `V` | 3.30V (3.00V~3.60V) | 3.00V~5.50V |
| `W` | 3.00V~5.50V | - |
| `W` | 2.70V~5.50V | - |
| `W` | 2.70V~5.50V | 2.70V~5.50V |

## 第 3 位 Cell Level / Die Count

第 3 位 classification token 同时决定 cell level 和 die count。当前 DecodePack 按用户提供的 Samsung 表更新这些结构化 token；普通 SDP / DDP / QDP / ODP / HDP 等 stack mnemonic 只重复 die 数量，不进入公开输出。`N` / `M` 的 `DSP (Dual Stack Package, 4-die x2)` 比 `die_count = 8` 多表达封装拓扑，因此公开输出保留短写 `die_stack = DSP (4-die x2)`。

| Token | Cell | Stack note | die_count |
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

## Die Density 工艺归一规则

Samsung raw NAND 的工艺归一不再使用 package density 直接匹配，也不再维护 single-die / package-level 两套表。DecodePack 先由第 3 位 classification 算出 `die_count`，再用 `package density / die_count` 得到 `die_density`，最后按 `cell_level + die_density + generation suffix` 匹配 die profile。

这条规则用于覆盖 FDB 中的旧 `l` 标记和错误 FlashID 关联：只要 DecodePack 根据 PN token 解析出 `die_codename`，FDB 不再覆盖该字段。

内部 profile key 使用 cell 后缀避免同一代际跨 SLC / MLC / TLC / QLC 混淆：MLC 后缀 `M`，QLC 后缀 `Q`，SLC 后缀 `S`，无后缀默认为 TLC。2D Samsung profile 对外只显示 `xxnm`，例如内部 `SS14M` / `SS14S` 均展示为 `14nm`；3D profile 对外保留 `SSVxM` / `SSVxQ` / `SSVxS`。

| Cell | Die density | Suffix | Profile |
| --- | --- | --- | --- |
| SLC | 1Gb | `E` / `F` | `SS21S` / `SS16S` |
| SLC | 2Gb | `D` | `SS16S` |
| SLC | 4Gb | `E` / `F` | `SS21S` / `SS16S` |
| SLC | 8Gb | `C` / `D` / `E` / `F` | `SS27S` / `SS21S` / `SS19S` / `SS16S` |
| SLC | 32Gb | `A` / `M` | `SS14S` / `SS21S` |
| SLC | 64Gb | `M` | `SSV3S` |
| SLC | 128Gb | `M` | `SSV5S` |
| MLC | 16Gb | `F` | `SS27M` |
| MLC | 32Gb | `A` / `B` / `C` / `D` / `E` | `SS27M` / `SS21M` / `SS19M` / `SS16M` / `SS14M` |
| MLC | 64Gb | `M` / `A` / `C` / `D` / `E` / `F` | `SS21M` / `SS21M` / `SS19M` / `SS16M` / `SS14M` / `SS14M` |
| MLC | 128Gb | `B` / `D` / `M` / `A` | `SS14M` / `SS14M` / `SSV1M` / `SSV2M` |
| MLC | 86Gb pMLC | `M` | `SSV2M` |
| MLC | 256Gb | `M` / `A` / `B` | `SSV3M` / `SSV4M` / `SSV5M` |
| TLC | 16Gb | `A` / `B` | `SS21` / `SS19` |
| TLC | 32Gb | `B` / `C` / `D` / `E` | `SS27` / `SS21` / `SS19` / `SS16` |
| TLC | 64Gb | `M` / `A` / `B` / `C` / `D` | `SS27` / `SS21` / `SS19` / `SS19` / `SS16` |
| TLC | 128Gb | `M` / `D` / `F` / `C` / `E` | `SS19` / `SS16` / `SS14` / `SSV2` / `SSV3` |
| TLC | 256Gb | `M` / `A` / `B` / `C` / `E` | `SSV3` / `SSV4` / `SSV5` / `SSV6` / `SSV6C` |
| TLC | 512Gb | `M` / `A` / `B` / `C` / `D` / `E` / `F` / `G` / `H` | `SSV4` / `SSV5` / `SSV6` / `SSV6P` / `SSV7` / `SSV6P` / `SSV8` / `SSV7` / `SSV8P` |
| TLC | 1Tb | `B` / `D` / `E` | `SSV8` / `SSV9` / `SSV9HS` |
| QLC | 512Gb | `M` | `SSV4Q` |
| QLC | 1Tb | `M` / `A` / `C` / `D` | `SSV4Q` / `SSV5Q` / `SSV7Q` / `SSV9Q` |
| QLC | 2Tb | `M` | `SSV9HSQ` |

- `K9AHGD8H0A`：按 PN token 解析为 TLC 512Gb die density，suffix `A`，归一为 `SSV5`。FDB 中挂到该 PN 的 `EC1E98AF84CD` 会解到 `SSV6`，但它同时属于 `K9AHGD8H0B` / `K9AHGD8J0B` 等 V6 PN，视为 FDB FlashID 关联脏数据，不覆盖 DecodePack。
- `K9AHGD8J0C`：TechInsights 的 floorplan / waveform analysis 直接确认 512Gb TLC、133L；规则按 `TLC + 512Gb + suffix C` 的局部组合归一到既有 133L `SSV6P` profile，并覆盖通用 suffix ordinal，避免错误输出 `4th Gen`。该 PN 本身没有 package token，因此不输出封装。来源：<https://www.techinsights.com/products/mfr-2402-804>、<https://www.techinsights.com/ja/node/57871>
- `K9UKGB8S7F` / `K9PKGY8S4B`：FDB `l=SSV3`，但 PN die density 规则分别归一到内部 `SS14M`，对外显示 `14nm`，用于纠正旧标记。
- `K9PMGY8S7M`：FDB `l=SSV2`，但 PN die density 规则归一到 `SSV3M`。
- `K9DYGY8J5B-CCK0`：TechInsights 确认其为 16 die package，内部 die 为 1Tb 236L TLC V8；外部 Flash ID 表和本地 FDB 同向记录 `EC52EA3F8ECF`。单个 `EC52EA3F8ECF` ID decode 为 512GB，4 组组成 `K9D...YG...` 的 2TB package。
  <https://www.techinsights.com/blog/samsung-k9dygy8j5b-cck0-236-layer-3d-nand-flash-advanced-memory-essentials>
  <https://www.techinsights.com/products/iwo-2310-801>
  <https://bbs.wuyou.net/forum.php?mod=viewthread&tid=449091>
- `K9DYGY8J5D`：由用户补充为同拓扑 `SSV9`；当前未在本地 FDB 或公开检索中找到对应 Flash ID。
- Samsung QLC V-NAND 使用 `V4Q` / `V5Q` / `V6Q` / `V7Q` / `V8Q` / `V9Q` / `V9HSQ`。QLC profile 由 DecodePack 的 `cell_level + die_density + suffix` 规则确定，不依赖 FDB `l` 字段补齐；PN 规则绑定 `K9` 后 classification + density 头部和末尾 revision，倒数第二位 mode 只影响 CE / R/B 拓扑，不参与制程判断。运行时会把 Samsung `SSV4` / `SSV5` / `SSV6` / `SSV7` / `SSV8` / `SSV9` / `SSV9HS` + `QLC` 归一到对应 `SSVxQ`。

## 输出字段

- `density`
- `die_density`
- `cell_level`
- `die_codename`
- `layer_count`
- `die_stack`（仅 `N` / `M` 的 DSP 拓扑）
- `die_count`
- `ce_count`
- `rb_count`
- `special_option`
- `device_width`
- `interface_type`
- `interface_note`
- `voltage`
- `package`
- `product_class`
- `operation_temperature`
- `bad_block`

`classificationCode`、`densityCode`、`organizationCode`、`modeCode`、`generationCode`、`packageCode`、`opTempCode`、`badBlockCode` 等 token 只用于内部解析，不进入公开字段。

## 第 10 位 Package

该位位于 generation 后，可选 `-` 分隔。只有 PN 中实际提供 package token 时才输出 `package`；没有 package token 或 token 未识别时不输出封装信息。公开输出只保留基础封装标签，格式统一为“封装类型-脚位 / ball 数”，例如 `FBGA-316`。资料表中的 dimension、Leaded / Pb-Free / Pb/Halo-Free、CU、Apple / ENT / V8 & later 等 notes 只用于文档和内部判断，不进入 public fields。

Samsung package code 会随年代复用。2009 年 Samsung `NAND Flash Code Information` 明确把 legacy
SDR PN 的 `D/E/F/T/Y` 分别定义为 63-TBGA / ISM / WSOP / WSOP / TSOP1；较新的 V-NAND
表则把同一批 code 中的 `D/E/F/T/Y` 定义成 FBGA-316 / FBGA-316 / FBGA-308 / BGA-152 /
FBGA-108。规则因此先使用 PN 中实际存在的 organization token 分流：`08/16/32/64` 走
legacy SDR package 表，`D8/Y8/B8/W8/K8/S8/A8/C8` 走 modern Toggle DDR 表。organization
未知时不根据单个 package code 猜封装。

Legacy 资料和 ordering page 还确认 `K9F1208U0C-JIB00` 是 63-ball FBGA 8.5x13、
`K9F1208U0C-PIB00` 是 48-pin TSOP1 12x20；规则只泛化二者共同表明的 package type，
不把 exact PN 当 decoder lookup。`K9F1G08U0E` datasheet 同向确认 SDR family 的 `B` 为
FBGA、`S` 为 TSOP1。

- Samsung `NAND Flash Code Information` (August 2009):
  <https://www1.futureelectronics.com/doc/SAMSUNG/K9F2G08U0B-PIB0.pdf>
- Samsung legacy ordering page mirror:
  <https://www1.futureelectronics.com/doc/SAMSUNG/K9F1208U0C-JIB0.pdf>
- `K9F1G08U0E` datasheet mirror:
  <https://www.nyang-tech.com/static/datasheet/samsung/100/K9F1G08U0E.PDF>
- TechInsights confirms modern `K9HQGY8S5M-CCK0` is FBGA-316:
  <https://www.techinsights.com/products/pkg-1407-802>

Modern Toggle DDR table如下；`packageCode` 本身不输出。

| Code | public package |
| --- | --- |
| `1` | `FBGA-168` |
| `5` | `FBGA-63` |
| `7` | `FBGA-168` |
| `8` | `TSOP-I-48` |
| `9` | `TSOP-I-56` |
| `A` | `FBGA-154` |
| `B` | `FBGA-63` |
| `C` | `FBGA-316` |
| `D` | `FBGA-316` |
| `E` | `FBGA-316` |
| `F` | `FBGA-308` |
| `G` | `FBGA-63` |
| `H` | `BGA-132/136` |
| `I` | `LGA-52` |
| `J` | `FBGA-63` |
| `K` | `LGA-52` |
| `L` | `LGA-52` |
| `M` | `LGA-52` |
| `N` | `LGA-52` |
| `P` | `TSOP-I-48` |
| `Q` | `TSOP-II-44(40)` |
| `R` | `TSOP-I-56` |
| `S` | `TSOP-I-48` |
| `T` | `BGA-152` |
| `U` | `COB (MMC)` |
| `V` | `WSOP-I-48` |
| `W` | `Wafer` |
| `X` | `FBGA-108` |
| `Y` | `FBGA-108` |
| `Z` | `WELP-48` |

Legacy SDR 中与 modern 表不同或更保守的公开值如下：

| Code | legacy SDR public package |
| --- | --- |
| `A` | `COB` |
| `B/G/J` | `FBGA` |
| `D` | `TBGA-63` |
| `E` | `ISM` |
| `F/T/V` | `WSOP` |
| `H` | `BGA` |
| `I/K` | `ULGA, 12x17` |
| `L` | `ULGA, 14x18` |
| `M` | `ULGA-52, 13x18` |
| `P/S` | `TSOP-I-48` |
| `Q` | `TSOP-II` |
| `R` | `TSOP-I-56` |
| `U` | `COB, MMC` |
| `W` | `Wafer` |
| `Y` | `TSOP-I` |
| `Z` | `WELP` |

## 第 12 位 Temperature & SmartMedia Color

该位位于 package token 后。DecodePack 把 product class 与温度范围分开输出：`product_class` 保存产品等级 / SmartMedia 颜色线索，`operation_temperature` 只保存温度范围。`0` 是 NONE / Wafer / CHIP BIZ / Exception Handling，不进入公开字段；SmartMedia 的 BLACK / BLUE 颜色折叠进 `product_class`，不新增单独 color 字段。

| Code | public product_class | public operation_temperature | Source note |
| --- | --- | --- | --- |
| `0` |  |  | NONE (Wafer, CHIP BIZ, Exception Handling) |
| `3` | `Wafer Level 3` |  |  |
| `C` | `Commercial` | `0~70C` |  |
| `E` | `Extended Commercial` | `-25~85C` |  |
| `I` | `Industrial` | `-40~85C` |  |
| `F` | `Automotive Grade 3` | `-40~85C` |  |
| `H` | `Automotive Grade 2` | `-40~105C` |  |
| `S` | `SmartMedia BLACK` | `0~55C` |  |
| `B` | `SmartMedia BLUE` | `0~55C` |  |

## 第 13 位 Customer Bad Block

该位位于 temperature token 后。DecodePack 只输出明确的坏块策略；`0` 的 NONE / Wafer / CHIP BIZ / Exception Handling 以及空白 `J` 不进入公开字段。`K` 是 Samsung `Special Handling` note，不再按 SanDisk bin 或坏块策略输出，公开落到 `special_option`。

| Code | public bad_block | public special_option | Source note |
| --- | --- | --- | --- |
| `0` |  |  | NONE (Wafer, CHIP BIZ, Exception Handling) |
| `A` | `Apple Bad Block` |  |  |
| `B` | `Include Bad Block` |  |  |
| `D` | `Daisychain Sample` |  |  |
| `E` | `Enterprise MLC` |  |  |
| `J` |  |  | blank / reserved |
| `K` |  | `Special Handling` | Special Handling |
| `L` | `1-5 Bad Block` |  |  |
| `N` | `ini 0 blk, add 10 blk` |  |  |
| `S` | `All Good Block` |  |  |

## 第 9 位 Configuration

该位是 generation 前一位，当前公开输出 `ce_count` / `rb_count`，以及非数值配置的 `special_option`。截图表中 `2` / `3` 另有 revoked option 行，本轮只采用未标记 revoked 的 nCE / RnB 拓扑，不把 revoked option 输出到 public result。

| Code | nCE | RnB | public note |
| --- | --- | --- | --- |
| `0` | 1 | 1 |  |
| `1` | 2 | 2 |  |
| `2` | 4 | 2 | revoked Mask Option 1 row is not public |
| `3` | 3 | 3 | revoked Fuse Option 1 row is not public |
| `4` | 4 | 1 |  |
| `5` | 4 | 4 |  |
| `6` | 6 | 2 |  |
| `7` | 8 | 4 |  |
| `8` | 8 | 2 |  |
| `9` | - | - | `special_option = 1st Block OTP` |
| `A` | - | - | `special_option = Mask Option 1` |
| `B` | 2 | 2 | `special_option = V4 512Gb eTLC HDP 168-FBGA` |
| `C` | 16 | 4 |  |
| `F` | - | - | `special_option = Fuse Option 1` |
| `J` | 2 | 2 | `special_option = V3 256Gb eTLC HDP 316-FBGA` |
| `L` | - | - | `special_option = Low Grade` |

这些规则用于补齐 `K9X...` / `K99...` 等 QLC 拓扑，以及 `K9OVGD8J2B` 这类 mode `2` 的 4 CE / 2 R/B 拓扑。除 DSP 外，Samsung raw NAND 不公开 `die_stack`，只输出 `die_count`。

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
