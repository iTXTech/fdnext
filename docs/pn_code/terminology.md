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
| `controller` / `controller_code` | 控制器描述或控制器 token | `UFS 4.1 G5-2Lane Controller`, `AX` |

约定：

- 顶层 `density` 继续使用项目既有单位 Mbit。
- `component_density` 是用户可见字段，可以表达封装总容量；不要把内部 reference 状态塞进此字段。
- `generation_info` 与顶层 `processNode` 可以同源，但 `generation_info` 用于 `extraInfo` 展示，`processNode` 保持引擎字段。

## DRAM 预留字段

后续加入 DRAM / MCP DRAM 子系统解析时，使用以下字段，避免和 NAND 字段混用：

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

MCP/eMCP/uMCP 同时有 NAND 和 DRAM 时：

- NAND storage 使用 `storage_*`、`component_density`、`die_density`、`generation_info`。
- DRAM 使用 `dram_*`。
- 不要用 `component_density` 表示 DRAM 容量。
