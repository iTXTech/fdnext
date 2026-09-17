# Samsung 裸 NAND PN 编码

采集日期：2026-05-16；更新日期：2026-07-13

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/samsung-raw-token.json`
- `packages/core/src/decodepack/identifier/packs/samsung.json`
- `vendor.samsung.token.v1`
- `flashid.samsung.legacy-slc.v1`
- `flashid.samsung.legacy-large-page.v1`
- `flashid.samsung.v1`

来源状态：Samsung 3D V-NAND die 标识表由维护者提供；旧版 Flash ID 由公开 Samsung 数据手册镜像确认。规则只按结构编码段 / 数据手册已确认的 ID 字节规格落地，不用完整 PN 反推字段。

## 旧版 Flash ID

Samsung 旧版 SLC 使用与现代 NAND 不同的第 4/5 字节定义。不能把现代 `page_size`、
`block_size`、备用区/ECC 位段公式直接套到这些旧 ID，也不能仅凭相同器件编码覆盖现代 ID。
`flashid.samsung.legacy-slc.v1` 因此只在数据手册已确认的旧版字节
结构命中：

| 系列 | Read ID 规格 | 已确认输出 | 来源 |
| --- | --- | --- | --- |
| `K9F1G08Q0A/U0A` | `EC A1/F1 xx 15` | 1Gb SLC, x8, 1.8V/3.3V, 2KB 页, 128KB 块, 64B 备用区 | Samsung K9F1G08Q0A/U0A 数据手册 |
| `K9F2G08U0D` | `EC DA 10 95 46` | 2Gb SLC, x8, 3.3V, 2KB 页, 128KB 块, 64B 备用区, 2 平面 | Samsung K9F2G08U0D 数据手册 |
| `K9F4G08U0A` | `EC DC 10 95 54` | 4Gb SLC 每器件/CE, x8, 3.3V, 2KB 页, 128KB 块, 64B 备用区, 2 平面 | Samsung K9F4G08U0A 数据手册 |

公开镜像：

- <https://www.micros.com.pl/mediaserver/info-pefnand01g08-030.pdf>
- <https://www.szyuda88.com/home/8/a/2lhtb2/resource/2022/05/09/6278f8904b749.pdf>
- <https://pccomponents.com/datasheets/SAMS-K9F.PDF>

该规格按器件/配置字节系列匹配；第 3 字节为数据手册 `don't care`
的 1Gb 系列不会被写成单一完整 ID。未命中这些旧版结构的 Samsung ID 仍进入既有
`flashid.samsung.v1`，已有现代容量 / 几何参数 / die 规格映射
保持不变。

后续 8Gb/16Gb 大页世代也不能沿用现代通用位域。以下三组数据手册
规格使用相同厂商/容量字节，但第 3/4 字节的含义不同；DecodePack 只在完整字节
组合吻合时采用确认几何参数，邻近但未确认的组合继续进入通用回退：

| 系列 | Read ID 规格 | 已确认输出 | 来源 |
| --- | --- | --- | --- |
| `K9F8G08U0M/B0M` | `EC D3 10 A6 64` | 8Gb SLC, x8, 1 die, 4KB 页, 256KB 块, 128B 备用区, 2 平面 | Samsung K9F8G08U0M 数据手册 |
| `K9G8G08U0A/B` | `EC D3 14 A5 64` | 8Gb MLC, x8, 1 die, 2KB 页, 256KB 块, 64B 备用区, 2 平面 | Samsung K9G8G08U0A/B 数据手册 |
| `K9GAG08U0M/B0M` | `EC D5 14 B6 74` | 16Gb MLC, x8, 1 die, 4KB 页, 512KB 块, 128B 备用区, 2 平面 | Samsung K9GAG08U0M 数据手册 |

公开镜像：

- <https://www.rcscomponents.kiev.ua/datasheets/k9f8g08u0m-pib0.pdf>
- <https://datasheet4u.com/pdf/975328/K9G8G08U0B.pdf>
- <https://datasheet4u.com/pdf-down/K/9/G/K9G8G08U0A-Samsung.pdf>
- <https://opendevices.ru/wp-content/uploads/2011/11/K9GAG08U0M.pdf>

同一 Read ID 可由不同电压后缀或多芯片封装返回，因此该规格不输出电压，也不从
封装 PN 反推封装总容量；`density` 仅表达当前 ID 分段可确认的 8Gb/16Gb。

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `K9` + 分类 + 容量 + 组织结构 + 电压 + 模式 + 代际 + 可选封装 / 温度 / 坏块 | Samsung 裸 NAND 编码段结构 |
| 分类 | 单元类型和 die 数 |
| 容量 | 封装总容量 |
| 组织结构 | 总线位宽及 SDR / Toggle DDR 接口标记 |
| 电压 | 电压选项 |
| 模式 | 配置: CE / R/B 数量和选项说明 |
| 代际 | 代际编码；也可通过 FDB / die 规格规则参与制程规格匹配 |

## 第 6/7 位组织结构

第 6/7 位按 Samsung 组织结构表整体解析。DecodePack 公开输出 `device_width`、`interface_type` 和有增量信息的 `interface_note`：`D8` / `Y8` / `B8` / `W8` / `K8` / `S8` / `A8` / `C8` 均只标注为 `Toggle DDR`，不再输出 Toggle DDR 版本号。`Normal` / `DDR Normal` 这类默认说明不进入公开字段；`K8` / `S8` / `A8` / `C8` 的通道 / 封装厂说明仍不进入 DecodePack 说明，也不进入公开字段。

| 编码 | 总线位宽 | 公开接口 | 公开 interface_note | 来源说明 |
| --- | --- | --- | --- | --- |
| `00` | 无 | 无 |  |  |
| `08` | x8 | SDR |  | `Normal` |
| `16` | x16 | SDR |  | `Normal` |
| `32` | x32 | SDR |  | `Normal` |
| `64` | x64 | SDR |  | `Normal` |
| `Z8` | x8 | SDR | `SSD` | `SSD` |
| `D8` | x8 | Toggle DDR |  | `DDR Normal` |
| `Y8` | x8 | Toggle DDR | `HP` | `HP` |
| `B8` | x8 | Toggle DDR | `HP w/ FBI Chip` | `HP w/ FBI Chip` |
| `W8` | x8 | Toggle DDR | `Wafer` | `Wafer` |
| `K8` | x8 | Toggle DDR |  |  |
| `S8` | x8 | Toggle DDR |  |  |
| `A8` | x8 | Toggle DDR |  |  |
| `C8` | x8 | Toggle DDR |  |  |

`FBI` 指 `Frequency Boosting Interface`。DecodePack 内部说明保持 `FBI` 缩写，不把展开文本写入规则输出。

## 第 8 位工作电压范围

第 8 位电压编码段按 Samsung 工作-电压表输出。表中同一编码有多行可选 VccQ 或宽范围组合时，公开结果只保留一个合并后的主值；固定双电源组合才同时输出 `Vcc` / `VccQ`。完整来源行保留在下方来源表，避免丢失截图资料。

| 编码 | 公开电压 |
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

| 编码 | Vcc | VccQ |
| --- | --- | --- |
| `0` | 无 | 无 |
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

## 第 3 位单元类型 / die 数

第 3 位分类编码段同时决定单元类型和 die 数。当前 DecodePack 按用户提供的 Samsung 表更新这些结构化编码段；普通 SDP / DDP / QDP / ODP / HDP 等堆叠助记名只重复 die 数量，不进入公开输出。`N` / `M` 的 `DSP (Dual Stack Package, 4-die x2)` 比 `die_count = 8` 多表达封装拓扑，因此公开输出保留短写 `die_stack = DSP (4-die x2)`。

| 编码段 | 单元 | 堆叠说明 | die_count |
| --- | --- | --- | --- |
| `T` | SLC 小块 | SDP (1-die) | 1 |
| `E` | SLC 小块 | DDP (2-die) | 2 |
| `R` | MLC | 12DP (12-die) | 12 |
| `F` | SLC | SDP (1-die) | 1 |
| `K` | SLC | DDP (2-die) | 2 |
| `W` | SLC | QDP (4-die) | 4 |
| `N` | SLC | DSP (双堆叠封装, 4-die x2) | 8 |
| `Q` | SLC | ODP (8-die) | 8 |
| `V` | SLC | HDP (16-die) | 16 |
| `G` | MLC | SDP (1-die) | 1 |
| `L` | MLC | DDP (2-die) | 2 |
| `H` | MLC | QDP (4-die) | 4 |
| `M` | MLC | DSP (双堆叠封装, 4-die x2) | 8 |
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
| `2` | SLC XD 卡 | DDP (2-die) | 2 |
| `4` | SLC XD 卡 | QDP (4-die) | 4 |
| `5` | MLC XD 卡 | SDP (1-die) | 1 |
| `6` | MLC XD 卡 | DDP (2-die) | 2 |
| `7` | MLC XD 卡 | QDP (4-die) | 4 |

注意：表中存在历史产品线复用编码段的情况，例如 `D` / `S` / `R` 等也在 SmartMedia 或小块分组出现。当前裸 NAND 规则沿用既有主线解释；如后续需要精确区分 SmartMedia / XD 卡，应结合额外位置编码段或外部数据手册再拆规则。

## 第 4/5 位容量

第 4/5 位为封装总容量。当前补入用户表中的 `20 = 2Mb (256KB)`。`LG` / `ZG` / `NG` / `EG` / `GG` 等编码段在 通用 / 旧版表中存在重叠；为兼容已有旧版和本地 FDB 样例，本轮不把这些重叠编码段全局迁移到新通用容量，后续若有可区分上下文再做结构化覆盖。

## 单 die 容量工艺归一规则

Samsung 裸 NAND 的工艺归一不再使用封装总容量直接匹配，也不再维护单 die / 封装级两套表。DecodePack 先由第 3 位分类算出 `die_count`，再用 `package density / die_count` 得到 `die_density`，最后按 `cell_level + die_density + generation suffix` 匹配 die 规格。

这条规则用于覆盖 FDB 中的旧 `l` 标记和错误 FlashID 关联：只要 DecodePack 根据 PN 编码段解析出 `die_codename`，FDB 不再覆盖该字段。

内部规格键使用单元后缀避免同一代际跨 SLC / MLC / TLC / QLC 混淆：MLC 后缀 `M`，QLC 后缀 `Q`，SLC 后缀 `S`，无后缀默认为 TLC。2D Samsung 规格对外只显示 `xxnm`，例如内部 `SS14M` / `SS14S` 均展示为 `14nm`；3D 规格对外保留 `SSVxM` / `SSVxQ` / `SSVxS`。

| 单元 | 单 die 容量 | 后缀 | 规格 |
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

- `K9AHGD8H0A`：按 PN 编码段解析为 TLC 512Gb 单 die 容量，后缀 `A`，归一为 `SSV5`。FDB 中挂到该 PN 的 `EC1E98AF84CD` 会解到 `SSV6`，但它同时属于 `K9AHGD8H0B` / `K9AHGD8J0B` 等 V6 PN，视为 FDB FlashID 关联脏数据，不覆盖 DecodePack。
- `K9AHGD8J0C`：TechInsights 的芯片布局 / 波形分析直接确认 512Gb TLC、133L；规则按 `TLC + 512Gb + suffix C` 的局部组合归一到既有 133L `SSV6P` 规格，并覆盖通用后缀顺序编号，避免错误输出 `Gen4`。该 PN 本身没有封装编码段，因此不输出封装。来源：<https://www.techinsights.com/products/mfr-2402-804>、<https://www.techinsights.com/ja/node/57871>
- `K9UKGB8S7F` / `K9PKGY8S4B`：FDB `l=SSV3`，但 PN 单 die 容量规则分别归一到内部 `SS14M`，对外显示 `14nm`，用于纠正旧标记。
- `K9PMGY8S7M`：FDB `l=SSV2`，但 PN 单 die 容量规则归一到 `SSV3M`。
- `K9DYGY8J5B-CCK0`：TechInsights 确认其为 16 die 封装，内部 die 为 1Tb 236L TLC V8；外部 Flash ID 表和本地 FDB 同向记录 `EC52EA3F8ECF`。单个 `EC52EA3F8ECF` ID 解码为 512GB，4 组组成 `K9D...YG...` 的 2TB 封装。
  <https://www.techinsights.com/blog/samsung-k9dygy8j5b-cck0-236-layer-3d-nand-flash-advanced-memory-essentials>
  <https://www.techinsights.com/products/iwo-2310-801>
  <https://bbs.wuyou.net/forum.php?mod=viewthread&tid=449091>
- `K9DYGY8J5D`：由用户补充为同拓扑 `SSV9`；当前未在本地 FDB 或公开检索中找到对应 Flash ID。
- Samsung QLC V-NAND 使用 `V4Q` / `V5Q` / `V6Q` / `V7Q` / `V8Q` / `V9Q` / `V9HSQ`。QLC 规格由 DecodePack 的 `cell_level + die_density + suffix` 规则确定，不依赖 FDB `l` 字段补齐；PN 规则绑定 `K9` 后分类 + 容量头部和末尾修订版，倒数第二位模式只影响 CE / R/B 拓扑，不参与制程判断。运行时会把 Samsung `SSV4` / `SSV5` / `SSV6` / `SSV7` / `SSV8` / `SSV9` / `SSV9HS` + `QLC` 归一到对应 `SSVxQ`。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
- `die_stack`（仅 `N` / `M` 的 DSP 拓扑）

`classificationCode`、`densityCode`、`organizationCode`、`modeCode`、`generationCode`、`packageCode`、`opTempCode`、`badBlockCode` 等编码段只用于内部解析，不进入公开字段。

## 第 10 位封装

该位位于代际后，可选 `-` 分隔。只有 PN 中实际提供封装编码段时才输出 `package`；没有封装编码段或编码段未识别时不输出封装信息。公开输出只保留基础封装标签，格式统一为“封装类型-脚位 / 球数”，例如 `FBGA-316`。资料表中的尺寸、含铅 / 无铅 / 无铅无卤、CU、Apple / ENT / V8 & 之后等说明只用于文档和内部判断，不进入公开字段。

Samsung 封装编码会随年代复用。2009 年 Samsung `NAND Flash Code Information` 明确把旧版
SDR PN 的 `D/E/F/T/Y` 分别定义为 63-TBGA / ISM / WSOP / WSOP / TSOP1；较新的 V-NAND
表则把同一批编码中的 `D/E/F/T/Y` 定义成 FBGA-316 / FBGA-316 / FBGA-308 / BGA-152 /
FBGA-108。规则因此先使用 PN 中实际存在的组织结构编码段分流：`08/16/32/64` 走
旧版 SDR 封装表，`D8/Y8/B8/W8/K8/S8/A8/C8` 走现代 Toggle DDR 表。组织结构
未知时不根据单个封装编码猜封装。

旧版资料和订购编码页还确认 `K9F1208U0C-JIB00` 是 63 球 FBGA 8.5x13、
`K9F1208U0C-PIB00` 是 48 引脚 TSOP1 12x20；规则只泛化二者共同表明的封装类型，
不把完整 PN 当解码器查找。`K9F1G08U0E` 数据手册同向确认 SDR 系列的 `B` 为
FBGA、`S` 为 TSOP1。

- Samsung `NAND Flash Code Information` (August 2009):
  <https://www1.futureelectronics.com/doc/SAMSUNG/K9F2G08U0B-PIB0.pdf>
- Samsung 旧版订购编码页镜像:
  <https://www1.futureelectronics.com/doc/SAMSUNG/K9F1208U0C-JIB0.pdf>
- `K9F1G08U0E` 数据手册镜像:
  <https://www.nyang-tech.com/static/datasheet/samsung/100/K9F1G08U0E.PDF>
- TechInsights 确认现代 `K9HQGY8S5M-CCK0` 为 FBGA-316：
  <https://www.techinsights.com/products/pkg-1407-802>

现代 Toggle DDR 表如下；`packageCode` 本身不输出。

| 编码 | 公开封装 |
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

旧版 SDR 中与现代表不同或更保守的公开值如下：

| 编码 | 旧版 SDR 公开封装 |
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

## 第 12 位温度 & SmartMedia 颜色

该位位于封装编码段后。DecodePack 把产品类别与温度范围分开输出：`product_class` 保存产品等级 / SmartMedia 颜色线索，`operation_temperature` 只保存温度范围。`0` 是无 / 晶圆 / 芯片 BIZ / Exception Handling，不进入公开字段；SmartMedia 的 BLACK / BLUE 颜色折叠进 `product_class`，不新增单独颜色字段。

| 编码 | 公开 product_class | 公开 operation_temperature | 来源说明 |
| --- | --- | --- | --- |
| `0` |  |  | 无 (晶圆, 芯片 BIZ, Exception Handling) |
| `3` | `Wafer Level 3` |  |  |
| `C` | `Commercial` | `0~70C` |  |
| `E` | `Extended Commercial` | `-25~85C` |  |
| `I` | `Industrial` | `-40~85C` |  |
| `F` | `Automotive Grade 3` | `-40~85C` |  |
| `H` | `Automotive Grade 2` | `-40~105C` |  |
| `S` | `SmartMedia BLACK` | `0~55C` |  |
| `B` | `SmartMedia BLUE` | `0~55C` |  |

## 第 13 位客户坏块

该位位于温度编码段后。DecodePack 只输出明确的坏块策略；`0` 的无 / 晶圆 / 芯片 BIZ / Exception Handling 以及空白 `J` 不进入公开字段。`K` 是 Samsung `Special Handling` 说明，不再按 SanDisk 档位或坏块策略输出，公开落到 `special_option`。

| 编码 | 公开 bad_block | 公开 special_option | 来源说明 |
| --- | --- | --- | --- |
| `0` |  |  | 无 (晶圆, 芯片 BIZ, Exception Handling) |
| `A` | `Apple Bad Block` |  |  |
| `B` | `Include Bad Block` |  |  |
| `D` | `Daisychain Sample` |  |  |
| `E` | `Enterprise MLC` |  |  |
| `J` |  |  | 空白 / 保留 |
| `K` |  | `Special Handling` | 特殊 Handling |
| `L` | `1-5 Bad Block` |  |  |
| `N` | `ini 0 blk, add 10 blk` |  |  |
| `S` | `All Good Block` |  |  |

## 第 9 位配置

该位是代际前一位，当前公开输出 `ce_count` / `rb_count`，以及非数值配置的 `special_option`。截图表中 `2` / `3` 另有已撤回选项行，本轮只采用未标记已撤回的 nCE / RnB 拓扑，不把已撤回选项输出到公开结果。

| 编码 | nCE | RnB | 公开说明 |
| --- | --- | --- | --- |
| `0` | 1 | 1 |  |
| `1` | 2 | 2 |  |
| `2` | 4 | 2 | 已撤回的 Mask 选项 1 行不公开 |
| `3` | 3 | 3 | 已撤回的 Fuse 选项 1 行不公开 |
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

这些规则用于补齐 `K9X...` / `K99...` 等 QLC 拓扑，以及 `K9OVGD8J2B` 这类模式 `2` 的 4 CE / 2 R/B 拓扑。除 DSP 外，Samsung 裸 NAND 不公开 `die_stack`，只输出 `die_count`。

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

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-08-27 V9/V10 检索只有产品族层数或营销代际，没有公开颗粒 PN/编码段分项解析。

## PN 展示

K9 在已解析的代际编码后标记订购后缀起点，例如 `K9XVGY8J5M-CCK0`；完整 PN 的 FDB 标点等价命中优先于较短主体回退。
