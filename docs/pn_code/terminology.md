# 跨厂商公开字段术语

采集日期：2026-05-15；更新日期：2026-09-12

本文档定义 fdnext result contract 中跨厂商共用的 canonical field keys。公开结果用 `device` 表达身份信息，用 `subtitle` 表达 decode 摘要，用 `blocks[].fields[]` 输出详情字段；每个字段使用稳定的 `key` / `value` / `unit` / `display`，语言包负责 `label`、`display`、block label、warning message 等展示文本，不改变 key。

维护规则：

- iTXTech fdnext DecodePack 规则应直接输出 canonical snake_case field key，不维护旧 key alias 或运行时兼容转换。新增/重命名字段同步源规则、共享表、`packages/core/src/field-registry.ts`、`packages/core/resources/lang/eng.json`、`chs.json` 和测试，把旧 key 加入 metadata audit 禁止列表。
- 可信度、reference status、source、inference note 等维护信息只能留在 `evidence/decodepack-references.json` 或 PN 文档中，不能进入 iTXTech fdnext DecodePack 或公开 fields。
- 未知值直接省略；不要为了填满旧响应形状输出 `Unknown`、空数组或 NAND-only 默认槽位。
- `vendor`、`chip_kind`、`product_type`、`part_number`、`identifier`、`id_scheme`、`marking_code` 已由 `device` 承载，不再复制进 `blocks[].fields[]`。
- `config_code`、`package_code`、`controller_code`、`die_code`、`feature_code` 以及其他 `*_code` token 只用于 DecodePack 内部解析，不进入 `fields.*` 或用户可见 `blocks[].fields[]`，也不以 `Code` 标签展示；应优先输出 `package`、`controller`、`controller_revision`、`die_revision`、`die_codename`、`process_node`、`special_option` 等语义字段。`nand_component`、design ID、product generation code 等纯编码线索没有稳定可读语义时同样留在内部。
- 容量字段从源规则、共享表到公开结果均使用数值 Mbit：`density`、`storage_density`、`component_density`、`die_density`、`dram_density`、`dram_die_density` 的 `value` 必须是正数，并带 `unit = Mbit`。NAND / managed NAND 的 `display` 使用 Bytes，DRAM 的 `display` 使用 bits；接口或产品类型通过各自字段表达，不拼入容量值。未知容量省略，不用 `0` 或字符串占位，也不做旧字符串兼容转换。

## 字段分组

`packages/core/src/field-profiles.ts` 是详情字段归属与顺序的唯一配置来源，按芯片类别或 identifier scheme 选择 profile；字段注册表只定义值类型、单位、标签、格式化和重要性。新增字段时同时补齐适用 profile。同一 profile 的每个字段只声明一次；设备身份保留在 `device`，内部 token 不进入详情组。

| 场景 | 归属 |
| --- | --- |
| Raw NAND 的 die 容量、die/CE/channel/plane 数和页块参数 | `geometry`（组织结构） |
| Managed NAND 的内部 NAND 容量、组织结构与 NAND 接口 | `components`；设备或 storage 总容量、对外 storage 接口在 `storage` |
| 独立 DRAM 的 die 容量、die/CS/bank/channel 数 | `geometry`；制程、die 修订和系列随主规格放在 `dram` |
| MCP/eMCP/uMCP 的 DRAM 子系统 | DRAM 容量、die 数、时序等集中在 `dram`，与 NAND 组件分开 |
| 独立 DRAM 的 CAS latency 和有增量信息的 speed grade | `timing`；接口模式与 ECC 状态在 `interface` |
| NAND Flash ID 的 die 容量、数量和页块参数 | `geometry`；NAND 接口在 `interface` |
| 丝印年码、周次、Die 版本、晶圆产地和封装地 | `marking`（丝印信息）；封装属性在 `package`，控制器修订在 `controllers` |

未列入 profile 的已知公开字段仍进入 `additional`，以免丢失信息；当前有意保留的场景包括未知芯片类别和 Flash ID 的 `enterprise` 标记。常规产品线已有明确语义的字段应显式归组，不依赖 `additional` 兜底。

## 公开值与去重

- 同一语义只保留最有价值的 canonical 字段。`speed_grade` 仅在比 `dram_speed` 多表达 binning、测试等级、CAS/RL/WL 时序或温度等级时保留，例如 `046BT Fully Tested`、`PG Partial Good Mixed Bins`；只重复速率单位或回显 token 时省略。已有 `DDR3L-1333 (667MHz)` 时不再输出 `1333Mbps/pin`。
- `Engineering Sample(s)` / `Early Engineering Sample(s)` 只通过 `prod_status` 公开一次，不重复放进 `product_class`、`sku`、`special_option` 等字段；多个 token 推导同一状态时仍只输出一个 Production Status，保留资料中的单复数。
- `voltage` / `dram_voltage` 只表达电压，不重复 DDR 代际、DRAM 类型或产品线。
- 用户可见的数字代际统一为紧凑 `GenN`，例如 `Gen1`、`Gen2 eMCP`、`Gen5 Xtacking 4.0`，适用于 `generation_info`、`product_generation`、`dram_generation`、代际型 `prod_status` 及其他公开代际值。不得使用 `1st Gen`、`1st generation`、`Gen 1`、`CXMT G3`；内部 `generation_code` / token 变量名、`process_node` 的厂商工艺别名以及 `PCIe Gen4` / `USB 3.2 Gen 1` 等标准或专名保留原写法。直接迁移源规则、共享表、测试和文档，不加运行时归一。
- `package` 只输出官方资料、datasheet、catalog、拆解或可信分销页确认的封装类型、脚位、尺寸或特殊信息，格式为 `TYPE[-PIN][, DIM][, SPECIAL]`，例如 `FBGA-153, 11.5x13x1.0`、`BGA, 11.0x13.0x0.8`、`WLGA`。缺 pin 只输出 TYPE，不猜脚位；仅 DIM 确认时只保留 DIM。省略 `mm`、`ball`、`pin`、`Unknown`，只有未解释的 package code 时不输出。PN token 与封装证据的对应限制见 [编写规范](authoring.md#输出与证据)。

## Identity / Subtitle / Relation

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `part_number` | 规范化后的 PN | `device.partNumber` |
| `vendor` | 厂商展示名 | `device.vendor` |
| `chip_kind` | `raw_nand`、`managed_nand`、`dram` 等芯片类别 | `device.chipKind` |
| `product_type` | eMMC、UFS、SATA、SAS、NVMe、eMCP/uMCP、E2NAND/E3NAND、LPDDR5X、DDR4 等产品线 subtype | `device.productType` |
| `identifier` | typed identifier 值，例如 NAND Flash ID | `device.identifier` |
| `id_scheme` | identifier namespace，例如 `nand.flash_id` | `device.idScheme` |
| `marking_code` | FBGA / package marking code | `device.markingCode` |

`subtitle` 只用于快速展示，不作为结构化解析依据。典型形态：

- NAND PN：`NAND Flash · KIOXIA · 32GB MLC`
- Managed NAND：`eMCP · SAMSUNG · 8GB · 32Gb LPDDR4`
- DRAM：`LPDDR5X · Micron · 64Gb · x64`
- NAND Flash ID：`Micron · 8GB MLC · 1 die · 2 planes`

关系使用 `relations[]` 表达：

- `identifier_for`: PN 与 NAND Flash ID 的关系。
- `marking_for`: marking code 与真实 PN 的关系。
- `alternate_part`: 只从当前 PN 指向相关 PN 的单向关系，例如群联侧 PN 指向原厂 PN。
- `component`: eMCP/uMCP 这类复合产品的 storage / DRAM 子组件。

当 relation 可以直接跳转到另一个解析动作时，使用 `relations[].action` 承载该动作；不要再额外输出独立的顶层 `actions[]`。

### Micron 丝印

5 位 FBGA 码与前置 5 位追溯信息的完整丝印复用同一器件匹配；`device.partNumber`
始终是真实 PN，`device.markingCode` 为 5 位 FBGA 码。`input.query` 保留原始输入，
`input.normalized` 保留规范化后的完整输入，不截短为 FBGA 码。搜索同样返回真实 PN，
不将 FDB 中的完整丝印展示成第二颗器件。旧 `micron_part_number`、`prod_date` 字段移除。

完整丝印仅追加以下 `marking` 字段；不输出独立日期码或推测完整年份：

| 字段 | 中文标签 | 含义 |
| --- | --- | --- |
| `marking_year_digit` | 年码 | 年份末位，字符串 `0`–`9`，保留 `0` |
| `marking_week` | 周次 | 打标工作周，数值 2–52 中的偶数；display 为两位，如 `06` |
| `marking_die_revision` | Die版本 | 丝印第三位修订字符；不覆盖 PN 解出的 `die_revision` |
| `diffusion_loc` | 晶圆产地 | 晶圆扩散所在地 |
| `encapsulation_loc` | 封装地 | 封装所在地 |

例如 `1CB2DJZ215` 与 `JZ215` 均对应 `MTFDHBL256TDQ-1AT12ATYY`，前者另有
年码 `1`、周次 `06`、Die版本 `B`、晶圆产地新加坡、封装地马来西亚。
年码和周次分别校验，未知地点省略并给出警告，原始字符可从完整输入追溯。
只输入 5 位码时不出现空的丝印信息组。

编码依据：[Micron CSN-11 Rev.BF 05/2026，第 3、5、6 页](https://www.micron.com/content/dam/micron/global/public/products/broad-products/csns/csn11.pdf)。

## NAND / Managed NAND

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `density` | 当前芯片或 storage 结果的容量，`unit = Mbit`，`display` 用 Bytes | `65536` / `8GB` |
| `component_density` | 封装或组件总容量，常用于 MCP/eMCP/uMCP 子组件，`display` 用 Bytes | `524288` / `64GB` |
| `component_density_options` | 无法唯一确定的组件容量候选，`value` 是不重复的正数 Mbit 数组，不能求和或当作范围；不同时输出单值 `component_density` | `[262144, 524288]` / `32GB / 64GB` |
| `component_voltage` | 封装或组件电压，不承载产品线或代际信息 | `3.3V` |
| `storage_density` | MCP/eMCP/uMCP 内 storage 子系统容量，`display` 用 Bytes | `262144` / `32GB` |
| `die_density` | 单颗 NAND die 容量，`display` 用 Bytes | `1024` / `128MB` |
| `die_codename` | NAND 用户可见制程名，公开 label 渲染为 `Process` / `制程`；`nand.die_profile` lookup key 可以比公开值更具体 | `BiCS4` / `20nm` |
| `process_alias` | 制程代号或厂商工艺 alias，用于独立展示 `X3-9060`、`8T23` 这类匹配线索 | `X3-9060` |
| `die_stack` | 非纯数量的 NAND 堆叠结构或厂商结构代号；纯数量使用 `die_count` | `DSP (4-die x2)`, `2-Deck` |
| `die_count` / `ce_count` / `rb_count` / `channel_count` / `plane_count` | NAND topology 数量字段，统一使用 `*_count` key | `2` / `2` / `2` / `4` / `4` |
| `page_size` / `block_size` / `sector_size` | page / block / sector 几何信息，字节字段使用 `unit = byte` | `16384` / `16KiB` |
| `half_page_and_size` | 半页 / page-size 相关封装特征 | `true` |
| `generation_info` | NAND 产品代际、层数或制程节点 | `V8 236L` |
| `series_info` | 厂商系列说明 | `3D-V4` |
| `storage_interface` | managed NAND 或 MCP storage 接口 | `eMMC 5.1`, `UFS 4.0` |
| `nand_interface` | 结构化 NAND 接口规格；`rating` 为器件等级，`capability` 为 die 能力；不代表 managed NAND 对外速率 | `{ capability: "ONFI 4.1; Max Speed=1600MT/s" }` |
| `interface_type` | 接口模式、Gear、lane 或 HS 模式 | `HS400`, `Gear 4 / 2-Lane` |
| `interface_note` | 接口 / 位宽组合表中有增量信息的 note，不用于默认 `Normal` | `HP w/ FBI Chip` |
| `toggle` | Toggle DDR 标记 | `DDR` |
| `controller` / `controller_revision` | 支持控制器列表或控制器版本 | `["SM2244LT", "SM3270AC"]`, `V4.41 EF` |
| `package_configuration` | MCP/eMCP/uMCP 封装内 storage / DRAM / eMMC / UFS 颗数组合，不表达封装尺寸 | `4 LPDRAM, 1 UFS` |
| `form_factor` | SSD / 模组类产品的整机或模组外形规格，不等同于芯片封装 | `2.5-inch, 7mm` |
| `dram_configuration` | MCP/eMCP/uMCP 中 DRAM 子系统的实际颗粒组成；当同一 PN 混用多种 DRAM die/part token 时用于保留组成细节 | `48Gb (4 x Y2BM) + 16Gb (2 x Y21N)` |
| `product_class` / `assembly` / `segment` / `sku` | 厂商产品等级、封装、产品分段或 SKU token 展开 | `Automotive Grade 2`, `Client Component` |
| `operation_temperature` | 工作温度范围 | `-40~105C` |
| `lead_free` / `halogen_free` / `wafer` / `multi_chip` / `cu` | 环保、晶圆、多芯片或铜工艺标记 | `true` |
| `bad_block` | 坏块策略 | `Include Bad Block` |
| `ecc_enabled` | 内部 ECC 状态 | `true` / `Yes` |

约定：

- NAND 制程/代际匹配优先输出 `die_codename`，公开 label 渲染为 `Process` / `制程`；已有 `die_codename` 时不再重复公开 `generation_info` / `series_info`。2D 公开值优先是 `15nm` / `A19nm` / `20nm` 这类 litho；Kioxia / SanDisk 3D 公开值统一是 `BiCS3` / `BiCS4` / `BiCS4.5`，不带厂商和 Cell 后缀。层数使用独立 `layer_count`，并统一放在 NAND 主解析结果块，不放入封装细节；`X3-9060`、`8T23` 等工艺或 full-code 别名使用独立 `process_alias`。生成后的 FDB `l` 必须是 `nand.die_profile` key；泛化 `xxnm` 只有作为表内 fallback profile 时才允许保留，`1ynm` / `1znm` / 泛化 `3DVx` 不再保留。
- Micron / Intel 2D raw NAND 详情字段仍保留 litho 作为 `die_codename`，但 subtitle 优先使用 `process_alias` 中的 die codename，例如 `M70M` / `L84A`，避免列表摘要只显示泛化制程。
- `nand.die_profile` 中的 `firmware_match` / `die_mark` 是匹配和维护 metadata，不默认输出到公开 result；整理过的 `process_alias` 可以公开展示。Kioxia / SanDisk 2D 固件侧默认归一为 `2DM` / `2DT`；BiCS profile key 必须带厂商前缀，例如 `KBiCS3` / `SBiCS3`，full code profile key 也必须带厂商前缀，例如 `K7T23` / `S7T23`。Micron / Intel 3D 直接用 `B16A` 这类 die codename；2D 一般使用 `IM2DS` / `IM2DM` / `IM2DT` 区分 SLC / MLC / TLC，但 `L7x` / `M7x` / `B7x`、`L8x` / `M8x` / `B8x`、`L9x` / `B9x` 可直接用 die codename 匹配，公开制程分别补齐为 `25nm`、`20nm`、`16nm`。
- `storage_interface` 与 `product_type` 完全重复时，优先保留更结构化的 identity 字段，除非接口字段含有版本、lane、gear 等增量信息。
- NAND profile 的接口能力使用 `nand_interface.capability`；YMTC PN 和 raw NAND FDB 补充的器件等级使用 `nand_interface.rating`。同值合并显示但保留两个作用对象，不同值分别显示；迁移规则见 [跨字段信息治理](field_information_audit.md)。其他尚未迁移的 PN 等级继续保留 `speed_grade`，不得丢弃测试或 binning 信息。Managed NAND 的简短摘要不使用内部 NAND 接口作为对外接口。
- `iNAND`、`iSSD`、`moviNAND` 等厂商品牌或系列名不作为 `product_type`；需要展示时放入 `product_family` 等稳定语义字段，解析中间用的 `system` / `group` 不进入公开 fields。SSD 类封装按接口归类为 `sata` / `sas` / `nvme`。

## NAND Flash ID

NAND Flash ID 通过 `decodeIdentifier` / `searchIdentifiers` 输出，`input.constraints.idScheme` 和 device `idScheme` 均为 `nand.flash_id`。

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `identifier` | NAND Flash ID | `device.identifier` |
| `id_scheme` | `nand.flash_id` | `device.idScheme` |
| `density` | ID 推导出的容量 | `geometry` |
| `die_density` / `die_stack` | 单颗 die 容量和非纯数量的堆叠结构 | `geometry` |
| `cell_level` | SLC / MLC / TLC / QLC | `geometry` |
| `die_count` / `ce_count` / `rb_count` / `channel_count` / `plane_count` | topology 数量字段 | `geometry` |
| `page_size` / `block_size` / `pages_per_block` / `blocks_per_lun` | NAND 几何信息 | `geometry` |
| `redundant_area_size` / `simultaneously_programmed_pages` | 冗余区大小和可同时编程页面数 | `geometry` |
| `voltage` / `interface_type` / `nand_interface` / `ecc_level` | 电压、接口模式、NAND 接口能力和 ECC 要求 | `interface` |
| `timing_mode_async` / `edo` / `interleave` / `cache` / `revision` | timing / EDO / interleave / cache / revision 扩展字段 | `timing` |
| `enterprise` | Enterprise 标记 | `additional` |
| `controller` | 关联控制器列表 | `controllers` |

相关 PN 使用 `identifier_for` relation，不再拼进翻译后的字符串字段；可跳转时在 relation 上挂 `action`。

## DRAM

DRAM / MCP DRAM 子系统使用以下字段，避免和 NAND 字段混用：

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `dram_type` | DRAM 类型来源 | `LPDDR5X`, `DDR4`, `GDDR7` |
| `dram_density` | DRAM 子系统或 component 总容量，`unit = Mbit` | `65536` / `64Gb` |
| `dram_die_density` | 单颗 DRAM die 容量 | `16384` / `16Gb` |
| `dram_die_count` | DRAM 子系统物理 die 数量，避免和 NAND `die_count` 混用 | `4` |
| `cs_count` / `channel_count` | DRAM CS/rank 或 channel 数量；可与 `dram_die_count` 同时输出 | `2` |
| `dram_generation` | DRAM 工艺/代际 | `1y-nm LPDDR4X`, `LPDDR5X` |
| `dram_speed` | DRAM 速率或 speed bin | `8533 Mbps`, `DDR4-2666 CL19` |
| `dram_width` | DRAM 组织位宽，`unit = bit` | `16` / `x16` |
| `dram_voltage` | DRAM 电压/I/O 信息 | `VDD2 1.8V / VDDQ 0.6V` |
| `cas_latency` | DRAM CAS latency token 展开 | `13` |
| `die_revision` | DRAM die 修订或设计修订 | `Rev A`, `Rev E` |
| `solder_type` | 焊接/镀层类型 token 展开 | `100% matte Sn` |
| `special_option` | 不属于 die stack 的地址、CKE、layout 等特殊选项 | `Reduced page-size addressing` |
| `prod_status` | ES/MS/QS 等生产状态 | `ES` |

standalone DRAM 约定：

- `device.chipKind = "dram"`，`device.productType` 使用 `ddr4`、`lpddr5x` 等短 product type。
- `dram_type` 和 `product_type` 不写厂商名，也不保留冗余 `SDRAM` / `SGRAM` 后缀，例如不要使用 `Micron DDR5 SDRAM`。
- `dram_density` / `dram_width` 已在主 DRAM block 输出时，不再复制到其他字段。
- package / config 等厂商 code 和封装输出遵循上文“公开值与去重”的通用约定。
- standalone DRAM 只有在封装 / topology token 被厂商规则识别后才允许补默认拓扑：已确认公开 `package` 默认可补 `dram_die_count=1`，plain DDR 同时可补 `cs_count=1`。如果公开 package 与 die/CS token 不是同一识别来源，规则使用内部 `meta.dramTopologyTokenRecognized` 区分：已知 token 但无可公开封装信息设 `true`，未知 token 即使 package 仍可由其他位置确定也设 `false`。显式 die/CS 或 stack layout 始终优先，不能用默认值覆盖。
- `dram_die_count` 只表达 DRAM 物理 die 数；CS/rank 数用 `cs_count`，PoP/MCP 等封装信息放 `package`，reduced page address、2 CKE、JEDEC/Flexframe stack layout 这类非 die/CS 信息放 `special_option`。
- `-` 后面的 speed / temperature / revision 后缀不作为主结构强制条件；缺失时仍应输出 vendor、product type、density、width、package、die stack 等已能确认的信息。

MCP/eMCP/uMCP 同时有 NAND 和 DRAM 时：

- NAND storage 使用 `storage_*`、`component_density`、`die_density`、`die_count`、`generation_info`。
- DRAM 使用 `dram_*`，其中 DRAM die 数使用 `dram_die_count`，不要复用 storage `die_count`。
- 子组件用 `component` relation 表达，不把 storage 和 DRAM 字段压平成一个产品专属 key。
