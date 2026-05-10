# 跨厂商公开字段术语

采集日期：2026-05-10

本文档定义 fdnext result contract 中跨厂商共用的 canonical field keys。公开结果用 `device` 表达身份信息，用 `subtitle` 表达 decode 摘要，用 `blocks[].fields[]` 输出详情字段；每个字段使用稳定的 `key` / `value` / `unit` / `display`，语言包负责 `label`、`display`、block label、warning message 等展示文本，不改变 key。

维护规则：

- DSL 规则应直接 emit canonical snake_case key，不维护旧 key alias。
- 可信度、reference status、source、inference note 等维护信息只能留在 DSL metadata 或文档中，不能进入公开 fields。
- 未知值直接省略；不要为了填满旧响应形状输出 `Unknown`、空数组或 NAND-only 默认槽位。
- `vendor`、`chip_kind`、`product_type`、`part_number`、`identifier`、`id_scheme`、`marking_code` 已由 `device` 承载，不再复制进 `blocks[].fields[]`。
- 容量数值字段沿用项目约定，`value` 使用 Mbit，`display` 可由 field registry 转成 `Gb` / `Tb`。

## Identity / Subtitle / Relation

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `part_number` | 规范化后的 PN | `device.partNumber` |
| `vendor` | 厂商展示名 | `device.vendor` |
| `chip_kind` | `raw_nand`、`on_die_ecc_nand`、`managed_nand`、`dram` 等芯片类别 | `device.chipKind` |
| `product_type` | eMMC、UFS、eMCP/uMCP、LPDDR5X、DDR4 等产品线 subtype | `device.productType` |
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
- `component`: eMCP/uMCP 这类复合产品的 storage / DRAM 子组件。

当 relation 可以直接跳转到另一个解析动作时，使用 `relations[].action` 承载该动作；不要再额外输出独立的顶层 `actions[]`。

## NAND / Managed NAND

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `density` | 当前芯片或 storage 结果的容量，`unit = Mbit`，`display` 用 Bytes | `65536` / `8GB` |
| `component_density` | 封装或组件总容量，常用于 MCP/eMCP/uMCP 子组件，`display` 用 Bytes | `524288` / `64GB` |
| `storage_density` | MCP/eMCP/uMCP 内 storage 子系统容量，`display` 用 Bytes | `262144` / `32GB` |
| `die_density` | 单颗 NAND die 容量，`display` 用 Bytes | `1024` / `128MB` |
| `die_stack` | 封装内 die 堆叠数量或厂商堆叠代号 | `8-die package` |
| `generation_info` | NAND 产品代际、层数或制程节点 | `V8 236L` |
| `storage_interface` | managed NAND 或 MCP storage 接口 | `eMMC 5.1`, `UFS 4.0` |
| `interface_type` | 接口模式、Gear、lane 或 HS 模式 | `HS400`, `Gear 4 / 2-Lane` |
| `controller` / `controller_code` | 控制器描述或控制器 token | `UFS 4.1 G5-2Lane Controller`, `AX` |
| `operation_temperature` | 工作温度范围或温度等级 | `-40C ~ 105C`, `Automotive Grade 2` |
| `page_size` / `block_size` | page / block 几何信息，字节字段使用 `unit = byte` | `16384` / `16KiB` |
| `ecc_enabled` | 内部 ECC 状态 | `true` / `Yes` |

约定：

- On-die ECC NAND 使用 `device.chipKind = "on_die_ecc_nand"`，展示为 `On-die ECC NAND`。
- `generation_info` 可承接产品代际、层数或制程节点；若与 `process_node` 完全重复，公开结果不重复输出。
- `storage_interface` 与 `product_type` 完全重复时，优先保留更结构化的 identity 字段，除非接口字段含有版本、lane、gear 等增量信息。

## NAND Flash ID

NAND Flash ID 通过 `decodeIdentifier` / `searchIdentifiers` 输出，`input.constraints.idScheme` 和 device `idScheme` 均为 `nand.flash_id`。

| 字段 | 含义 | 常见 block |
| --- | --- | --- |
| `identifier` | NAND Flash ID | `identity` |
| `id_scheme` | `nand.flash_id` | `identity` |
| `density` | ID 推导出的容量 | `geometry` |
| `cell_level` | SLC / MLC / TLC / QLC | `geometry` |
| `die_count` / `plane_count` | die / plane 数 | `geometry` |
| `page_size` / `block_size` / `blocks_per_lun` | NAND 几何信息 | `geometry` |
| `voltage` / `interface_type` | 电压和接口模式 | `interface` |
| `timing_mode_async` / `edo` | timing / EDO 扩展字段 | `timing` |
| `controller` | 关联控制器 | `controllers` |

相关 PN 使用 `identifier_for` relation，不再拼进翻译后的字符串字段；可跳转时在 relation 上挂 `action`。

## DRAM

DRAM / MCP DRAM 子系统使用以下字段，避免和 NAND 字段混用：

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `dram_type` | DRAM 类型来源 | `LPDDR5X`, `DDR4`, `GDDR7` |
| `dram_density` | DRAM 子系统或 component 总容量，`unit = Mbit` | `65536` / `64Gb` |
| `dram_die_density` | 单颗 DRAM die 容量 | `16384` / `16Gb` |
| `dram_die_stack` | DRAM die / stack / CS 数量 | `2-die stack, 2 CS` |
| `dram_generation` | DRAM 工艺/代际 | `1y-nm LPDDR4X`, `LPDDR5X` |
| `dram_speed` | DRAM 速率或 speed bin | `8533 Mbps`, `DDR4-2666 CL19` |
| `dram_width` | DRAM 组织位宽，`unit = bit` | `16` / `x16` |
| `dram_voltage` | DRAM 电压/I/O 信息 | `VDD2 1.8V / VDDQ 0.6V` |
| `die_revision` | DRAM die 修订或设计修订 | `Rev A`, `Rev E` |
| `config_code` | 厂商配置 token | `1G8`, `256M32` |
| `package_code` | 厂商封装 token；不替代 `package` | `SA`, `NRE` |
| `prod_status` | ES/MS/QS 等生产状态 | `ES` |

standalone DRAM 约定：

- `device.chipKind = "dram"`，`device.productType` 使用 `ddr4`、`lpddr5x` 等短 product type。
- `dram_type` 和 `product_type` 不写厂商名，例如不要使用 `Micron DDR5 SDRAM`。
- `dram_density` / `dram_width` 已在主 DRAM block 输出时，不再复制到其他字段。
- `package_code` 只表达厂商 token；只有外部资料确认封装尺寸、pin 或 ball count 时才输出 `package`。
- `-` 后面的 speed / temperature / revision 后缀不作为主结构强制条件；缺失时仍应输出 vendor、product type、density、width、package code、die stack 等已能确认的信息。

MCP/eMCP/uMCP 同时有 NAND 和 DRAM 时：

- NAND storage 使用 `storage_*`、`component_density`、`die_density`、`generation_info`。
- DRAM 使用 `dram_*`。
- 子组件用 `component` relation 表达，不把 storage 和 DRAM 字段压平成一个产品专属 key。
