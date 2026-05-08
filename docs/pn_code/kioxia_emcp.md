# KIOXIA eMCP PN 记录

采集日期：2026-05-08

## 当前结论

本轮未找到 KIOXIA 官方公开 eMCP PN ordering table。网络上可见少量 Toshiba/KIOXIA eMCP 料号的第三方库存页或维修供应页，但信息通常只给出组合容量、LPDDR 类型或封装，缺少可验证的逐 token 规则表。

## 已见候选

以下候选只作为待确认线索，不进入规则：

| PN 线索 | 外部信息档位 | 当前处理 |
| --- | --- | --- |
| `TYD0GH221651RA` | 第三方 eMCP 库存/维修页 | 待原厂或多源表格确认 |
| `TYE0HH231659RA` | 第三方库存页 | 待原厂或多源表格确认 |

## 规则状态

暂不新增 DSL 规则。

原因：

- 未找到原厂 PN decoder 或 ordering table。
- 第三方页面不足以推导 series、NAND 容量、DRAM 容量、LPDDR 类型、封装等 token 的稳定含义。
- 不允许用完整 PN 白名单直接匹配。

## 后续准入要求

若后续找到原厂资料，eMCP 输出需要使用统一 MCP 字段：

- storage: `storage_density`、`storage_interface`
- DRAM: `dram_type`、`dram_density`、`dram_speed`、`dram_voltage`
- package/class: `package`、`product_class`、`operation_temperature`
