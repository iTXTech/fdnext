# DRAM 世代覆盖约定

采集日期：2026-05-08

DRAM 解码模块按“厂商 + 世代矩阵”维护。新增或扩展 standalone DRAM 厂商时，不能只补少量热门 PN；需要先确认该厂商公开资料中可验证的 DDR/SDR、LPDDR、Graphics DRAM 世代，再按结构化 token 建表。

## 标准世代矩阵

| 产品线 | 标准 `dram_type` |
| --- | --- |
| SDR / DDR | `SDR SDRAM`, `LPSDR SDRAM`, `DDR SDRAM`, `DDR2 SDRAM`, `DDR3 SDRAM`, `DDR4 SDRAM`, `DDR5 SDRAM` |
| LPDDR | `LPDDR SDRAM`, `LPDDR2 SDRAM`, `LPDDR3 SDRAM`, `LPDDR4 SDRAM`, `LPDDR4X SDRAM`, `LPDDR5 SDRAM`, `LPDDR5X SDRAM` |
| Graphics DRAM | `GDDR SGRAM`, `GDDR2 SGRAM`, `GDDR3 SGRAM`, `GDDR4 SGRAM`, `GDDR5 SGRAM`, `GDDR5X SGRAM`, `GDDR6 SGRAM`, `GDDR6X SGRAM`, `GDDR7 SGRAM` |
| Specialty | `RLDRAM`, `RLDRAM 3` |

## 规则准入

- 每个厂商 pack 必须按产品线 / 世代拆 token 表，避免把 DDR、LPDDR、GDDR 的字段混在一条不可维护的规则里。
- 同一厂商同一 family 可能覆盖多个标准世代，例如 Micron `MT53` 通过 voltage token 区分 LPDDR4/LPDDR4X，`MT62` 通过 speed/package 资料区分 LPDDR5/LPDDR5X，`MT61` 通过 speed bin 区分 GDDR6/GDDR6X。
- 规则只能输出单一标准 `dram_type`。如果 token 不足以确认 `LPDDR5` vs `LPDDR5X` 或 `GDDR6` vs `GDDR6X`，输出更保守的基础世代，或等待后续 token / 外部资料确认。
- 已有厂商规则需要优先补全 frequency / speed bin 与 CS / die stack 信息；LPDDR、stacked DRAM 或 datasheet 明确 DDP/QDP/1CS/2CS 的 PN 必须输出 `dram_die_stack`。
- `-` 后的 suffix 不应成为解码主结构的强制条件。缺 suffix 时应保留可确定字段，只减少 `dram_speed`、`operation_temperature`、`die_revision` 等后缀信息。
- 顶层 `package` 只写可由 datasheet、原厂 catalog、TechInsights/TechPowerUp 或可信分销页确认的实际封装；仅有厂商代码时只写 `package_code`。
- 每个新增世代至少补一个 testcase，验证顶层 `type/density/deviceWidth/voltage/package` 与标准 `extraInfo`。

## 当前覆盖进度

| 厂商 | SDR / DDR | LPDDR | Graphics DRAM | Specialty |
| --- | --- | --- | --- | --- |
| Micron / Crucial | SDR, LPSDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR5, GDDR5X, GDDR6, GDDR6X, GDDR7 | RLDRAM, RLDRAM 3 |
| SK hynix | SDR, DDR, DDR2, DDR3, DDR3L, DDR4, DDR5 | LPDDR4, LPDDR5, LPDDR5X | GDDR5, GDDR6 | - |

SK hynix 仍需继续补齐 LPDDR/LPDDR2/LPDDR3、GDDR/GDDR2/GDDR3/GDDR4/GDDR7 等公开 ordering table；没有外部 PN 证据前不把推测写成确定结论。
