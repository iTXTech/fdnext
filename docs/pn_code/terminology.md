# 跨厂商公开字段术语

采集日期：2026-05-15

本文档定义 fdnext result contract 中跨厂商共用的 canonical field keys。公开结果用 `device` 表达身份信息，用 `subtitle` 表达 decode 摘要，用 `blocks[].fields[]` 输出详情字段；每个字段使用稳定的 `key` / `value` / `unit` / `display`，语言包负责 `label`、`display`、block label、warning message 等展示文本，不改变 key。

维护规则：

- iTXTech fdnext DecodePack 规则应直接输出 canonical snake_case field key，不维护旧 key alias。
- 可信度、reference status、source、inference note 等维护信息只能留在 iTXTech fdnext DecodePack metadata 或文档中，不能进入公开 fields。
- 未知值直接省略；不要为了填满旧响应形状输出 `Unknown`、空数组或 NAND-only 默认槽位。
- `vendor`、`chip_kind`、`product_type`、`part_number`、`identifier`、`id_scheme`、`marking_code` 已由 `device` 承载，不再复制进 `blocks[].fields[]`。
- `config_code`、`package_code`、`controller_code`、`die_code`、`feature_code` 以及其他 `*_code` token 只用于 DecodePack 内部解析，不进入用户可见 `blocks[].fields[]`；应优先输出 `package`、`controller`、`die_revision`、`die_codename`、`special_option` 等语义字段。`speed_grade` 例外，可保留原始 speed / grade token 并附带可读含义。
- 容量数值字段沿用项目约定，`value` 使用 Mbit；NAND / managed NAND 的 `display` 使用 Bytes，DRAM 的 `display` 使用 bits。

## Identity / Subtitle / Relation

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `part_number` | 规范化后的 PN | `device.partNumber` |
| `vendor` | 厂商展示名 | `device.vendor` |
| `chip_kind` | `raw_nand`、`on_die_ecc_nand`、`managed_nand`、`dram` 等芯片类别 | `device.chipKind` |
| `product_type` | eMMC、UFS、SATA、NVMe、eMCP/uMCP、LPDDR5X、DDR4 等产品线 subtype | `device.productType` |
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

## NAND / Managed NAND

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `density` | 当前芯片或 storage 结果的容量，`unit = Mbit`，`display` 用 Bytes | `65536` / `8GB` |
| `component_density` | 封装或组件总容量，常用于 MCP/eMCP/uMCP 子组件，`display` 用 Bytes | `524288` / `64GB` |
| `component_voltage` | 封装或组件电压，不承载产品线或代际信息 | `3.3V` |
| `storage_density` | MCP/eMCP/uMCP 内 storage 子系统容量，`display` 用 Bytes | `262144` / `32GB` |
| `die_density` | 单颗 NAND die 容量，`display` 用 Bytes | `1024` / `128MB` |
| `die_codename` | NAND 用户可见制程名，公开 label 渲染为 `Process` / `制程`；`nand.die_profile` lookup key 可以比公开值更具体 | `BiCS4` / `20nm` |
| `process_alias` | 制程代号或厂商工艺 alias，用于独立展示 `X3-9060`、`8T23` 这类匹配线索 | `X3-9060` |
| `die_stack` | 封装内 die 堆叠数量或厂商堆叠代号 | `8-die package` |
| `die_count` / `plane_count` | die / plane 数量 | `2` / `4` |
| `ce_count` / `rb_count` / `channel_count` | CE / R/B / channel 数量 | `2` / `2` / `4` |
| `page_size` / `block_size` / `sector_size` | page / block / sector 几何信息，字节字段使用 `unit = byte` | `16384` / `16KiB` |
| `half_page_and_size` | 半页 / page-size 相关封装特征 | `true` |
| `generation_info` | NAND 产品代际、层数或制程节点 | `V8 236L` |
| `series_info` | 厂商系列说明 | `3D-V4` |
| `storage_interface` | managed NAND 或 MCP storage 接口 | `eMMC 5.1`, `UFS 4.0` |
| `interface_type` | 接口模式、Gear、lane 或 HS 模式 | `HS400`, `Gear 4 / 2-Lane` |
| `toggle` | Toggle DDR 版本或标记 | `4.0` |
| `controller` / `controller_revision` | 支持控制器列表或控制器版本 | `["SM2244LT", "SM3270AC"]`, `V4.41 EF` |
| `operation_temperature` | 工作温度范围或温度等级 | `-40C ~ 105C`, `Automotive Grade 2` |
| `assembly` / `segment` / `sku` | 厂商封装、产品分段或 SKU token 展开 | `Client Component` |
| `lead_free` / `halogen_free` / `wafer` / `multi_chip` / `cu` | 环保、晶圆、多芯片或铜工艺标记 | `true` |
| `bad_block` | 坏块策略 | `samsung_cbb_b` |
| `ecc_enabled` | 内部 ECC 状态 | `true` / `Yes` |

约定：

- On-die ECC NAND 使用 `device.chipKind = "on_die_ecc_nand"`，展示为 `On-die ECC NAND`。
- NAND 制程/代际匹配优先输出 `die_codename`，公开 label 渲染为 `Process` / `制程`；已有 `die_codename` 时不再重复公开 `generation_info` / `series_info`。2D 公开值优先是 `15nm` / `A19nm` / `20nm` 这类 litho；Kioxia / SanDisk 3D 公开值统一是 `BiCS3` / `BiCS4` / `BiCS4.5`，不带厂商和 Cell 后缀。层数使用独立 `layer_count`，并统一放在 NAND 主解析结果块，不放入封装细节；`X3-9060`、`8T23` 等工艺或 full-code 别名使用独立 `process_alias`。生成后的 FDB `l` 必须是 `nand.die_profile` key；泛化 `xxnm`、`1ynm`、`3DVx` 只有作为表内 fallback profile 时才允许保留。
- `nand.die_profile` 中的 `firmware_match` / `die_mark` 是匹配和维护 metadata，不默认输出到公开 result；整理过的 `process_alias` 可以公开展示。Kioxia / SanDisk 2D 固件侧默认归一为 `2DM` / `2DT`；BiCS profile key 必须带厂商前缀，例如 `KBiCS3` / `SBiCS3`，full code profile key 也必须带厂商前缀，例如 `K7T23` / `S7T23`。Micron / Intel 3D 直接用 `B16A` 这类 die codename；2D 一般使用 `IM2DS` / `IM2DM` / `IM2DT` 区分 SLC / MLC / TLC，但 `L7x` / `M7x` / `B7x`、`L8x` / `M8x` / `B8x`、`L9x` / `B9x` 可直接用 die codename 匹配，公开制程分别补齐为 `25nm`、`20nm`、`16nm`。
- `storage_interface` 与 `product_type` 完全重复时，优先保留更结构化的 identity 字段，除非接口字段含有版本、lane、gear 等增量信息。
- `iNAND`、`iSSD`、`moviNAND` 等厂商品牌或系列名不作为 `product_type`；需要展示时放入 `product_family` 等稳定语义字段，解析中间用的 `system` / `group` 不进入公开 fields。SSD 类封装按接口归类为 `sata` / `nvme`。

## NAND Flash ID

NAND Flash ID 通过 `decodeIdentifier` / `searchIdentifiers` 输出，`input.constraints.idScheme` 和 device `idScheme` 均为 `nand.flash_id`。

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `identifier` | NAND Flash ID | `identity` |
| `id_scheme` | `nand.flash_id` | `identity` |
| `density` | ID 推导出的容量 | `geometry` |
| `cell_level` | SLC / MLC / TLC / QLC | `geometry` |
| `die_count` / `plane_count` | die / plane 数 | `geometry` |
| `page_size` / `block_size` / `pages_per_block` / `blocks_per_lun` | NAND 几何信息 | `geometry` |
| `redundant_area_size` / `simultaneously_programmed_pages` | 冗余区大小和可同时编程页面数 | `geometry` |
| `voltage` / `interface_type` / `ecc_level` | 电压、接口模式和 ECC 要求 | `interface` |
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
| `dram_die_stack` | DRAM 物理 die 数与 CS 数量 | `2 dies, 2 CS` |
| `die_count` | 只确认物理 die 数、但没有 CS 资料时的 die 数量 | `4` |
| `ce_count` / `channel_count` | 只确认 CS/rank 或 channel、但没有物理 die 数时的拓扑数量 | `2` |
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
- package / config 等厂商 code 只保留在规则内部；只有外部资料确认封装尺寸、pin 或 ball count 时才输出 `package`。
- `dram_die_stack` 只在物理 die 数和 CS 数同时明确时输出；PoP/MCP 等封装信息放 `package`，reduced page address、2 CKE、JEDEC/Flexframe stack layout 这类非 die/CS 信息放 `special_option`。
- `-` 后面的 speed / temperature / revision 后缀不作为主结构强制条件；缺失时仍应输出 vendor、product type、density、width、package、die stack 等已能确认的信息。

MCP/eMCP/uMCP 同时有 NAND 和 DRAM 时：

- NAND storage 使用 `storage_*`、`component_density`、`die_density`、`generation_info`。
- DRAM 使用 `dram_*`。
- 子组件用 `component` relation 表达，不把 storage 和 DRAM 字段压平成一个产品专属 key。
