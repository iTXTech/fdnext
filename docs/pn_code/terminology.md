# 跨厂商 PN 输出术语

采集日期：2026-05-08

本文档定义 PN 规则输出时跨厂商共用的 `extraInfo` 字段。规则实现可以保留厂商原始 token 字段，但面向用户的容量、die、代际字段应优先使用这里的统一命名。

## NAND / Managed NAND

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `component_density` | 当前 PN 指向的封装/组件总容量；raw NAND 可写 bit，managed NAND 可写 GB package | `4Tbit package`, `256GB package` |
| `die_density` | 单颗 NAND die 容量 | `512Gb`, `1Tb` |
| `die_stack` | 封装内 die 堆叠数量或厂商堆叠代号 | `QDP (4-die)`, `8-die package` |
| `generation_info` | NAND 产品代际、层数或制程节点 | `V8 236L`, `238-layer 4D NAND (V8 / H25FTD0)` |
| `storage_density` | MCP/eMCP/uMCP 内 storage 子系统容量 | `64GB eMMC`, `256GB UFS` |
| `storage_interface` | managed NAND 或 MCP storage 接口 | `eMMC 5.1`, `UFS 4.0` |
| `interface_type` | 接口模式、Gear、lane 或 HS 模式 | `HS400`, `Gear 4 / 2-Lane` |
| `controller` / `controller_code` | 控制器描述或控制器 token | `UFS 4.1 G5-2Lane Controller`, `AX` |
| `operation_temperature` | 工作温度范围或温度等级 | `-40°C ~ 105°C`, `Automotive Grade 2` |
| `page_size` / `block_size` | page / block 几何信息 | `16KB`, `128 pages` |
| `ecc_enabled` | 内部 ECC 状态 | `true`, `Yes` |

约定：

- 顶层 `density` 继续使用项目既有单位 Mbit。
- `component_density` 是用户可见字段，可以表达封装总容量；不要把内部 reference 状态塞进此字段。
- `generation_info` 可以在 DSL 内部承接产品代际、层数或制程节点；若与顶层 `processNode` 完全相同，用户可见 `extraInfo` 不再重复输出。
- 用户可见 `extraInfo` 避免重复顶层字段：`system` / `managed_family` / `group` 这类只重复 vendor/type 的字段不输出，`storage_interface` 与顶层 type 完全相同时也不输出。
- 若 `product_version` 与 `storage_interface` 完全相同，优先只输出 `storage_interface`；`product_family` 只在表达真实系列、等级或 MCP 组合时输出。
- 输出层不维护历史别名，也不把旧 camelCase key 自动转换为 canonical key。新增规则必须直接使用 canonical snake_case key；旧 key 只应保留在审计测试的禁止列表里。

## DRAM

DRAM / MCP DRAM 子系统解析使用以下字段，避免和 NAND 字段混用：

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `dram_type` | DRAM 类型 | `LPDDR4X`, `LPDDR5`, `DDR5` |
| `dram_density` | DRAM 子系统总容量 | `32Gb`, `12GB` |
| `dram_die_density` | 单颗 DRAM die 容量 | `16Gb`, `24Gb` |
| `dram_die_stack` | DRAM die 数量或封装堆叠 | `2-die`, `4-die` |
| `dram_generation` | DRAM 工艺/代际 | `1y-nm LPDDR4X`, `LPDDR5X` |
| `dram_speed` | DRAM 速率 | `4266 Mbps`, `8533 Mbps` |
| `dram_width` | DRAM 组织位宽 | `x16`, `x32` |
| `dram_voltage` | DRAM 电压/I/O 信息 | `VDD2 1.8V / VDDQ 0.6V` |
| `die_revision` | DRAM die 修订或设计修订 | `Rev A`, `Rev E` |

### DRAM 标准输出格式

standalone DRAM 顶层字段：

| 顶层字段 | 含义 |
| --- | --- |
| `type` | 固定输出 `dram`，展示为 `DRAM` |
| `density` | 当前 DRAM component 总容量，单位仍为 Mbit |
| `deviceWidth` | 当前 DRAM component 组织位宽 |
| `voltage` | 主电源或 VDD/VDDQ 组合 |
| `package` | 实际封装，只在外部资料可确认 package style / pin 或 ball count 时输出 |

standalone DRAM `extraInfo` 只输出以下补充字段：

| 字段 | 输出要求 |
| --- | --- |
| `dram_type` | 必须是规范 DRAM 类型名，不带厂商名，不输出组合候选 |
| `dram_die_stack` | 只在 PN 明确给出 die stack / addressing token 时输出 |
| `dram_speed` | 速率、speed bin 或 JEDEC bin |
| `operation_temperature` | 温度等级或范围 |
| `die_revision` | die/design revision |
| `config_code` | 厂商配置 token |
| `package_code` | 厂商封装 token；不替代顶层 `package` |
| `prod_status` | ES/MS/QS 等生产状态 |

`dram_type` 规范值优先使用：

| 类别 | 标准值 |
| --- | --- |
| SDR / DDR | `SDR SDRAM`, `LPSDR SDRAM`, `DDR SDRAM`, `DDR2 SDRAM`, `DDR3 SDRAM`, `DDR4 SDRAM`, `DDR5 SDRAM` |
| LPDDR | `LPDDR SDRAM`, `LPDDR2 SDRAM`, `LPDDR3 SDRAM`, `LPDDR4 SDRAM`, `LPDDR5 SDRAM` |
| Graphics DRAM | `GDDR5 SGRAM`, `GDDR5X SGRAM`, `GDDR6 SGRAM`, `GDDR6X SGRAM` |
| RLDRAM | `RLDRAM`, `RLDRAM 3` |

不符合标准的输出：

- 不在 `dram_type` 里写厂商名，例如不要输出 `Micron DDR5 SDRAM`。
- 不同时输出 `product_family` / `product_version` 和 `dram_type` 来描述同一件事。
- standalone DRAM 不重复输出已经在顶层表达的 `dram_density` / `dram_width`。
- 不用 `package_code` 代替顶层 `package`；若只能解析出厂商 token，继续只输出 `package_code`，不要推定成实际封装。
- 不输出 `DDR SDRAM / LPDDR SDRAM`、`GDDR6/GDDR6X SGRAM` 这类组合候选；无法确认时应输出更保守的单一标准值，或等待后续 token 细化。

MCP/eMCP/uMCP 同时有 NAND 和 DRAM 时：

- NAND storage 使用 `storage_*`、`component_density`、`die_density`、`generation_info`。
- DRAM 使用 `dram_*`。
- 不要用 `component_density` 表示 DRAM 容量。
- 只在外部资料确认封装尺寸/ball map 时输出具体封装；否则优先输出 `package_code`。
- standalone DRAM 若顶层已经输出 `density` / `deviceWidth`，`extraInfo` 不再重复输出 `dram_density` / `dram_width`。
