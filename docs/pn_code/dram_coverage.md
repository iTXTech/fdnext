# DRAM 世代覆盖约定

采集日期：2026-05-11

DRAM 解码模块按“厂商 + 世代矩阵”维护。新增或扩展 standalone DRAM 厂商时，不能只补少量热门 PN；需要先确认该厂商公开资料中可验证的 DDR/SDR、LPDDR、Graphics DRAM 世代，再按结构化 token 建表。

## 标准世代矩阵

| 产品线 | 内部 `dram_type` 来源 |
| --- | --- |
| SDR / DDR | `SDR SDRAM`, `LPSDR SDRAM`, `DDR SDRAM`, `DDR2 SDRAM`, `DDR3 SDRAM`, `DDR4 SDRAM`, `DDR5 SDRAM` |
| LPDDR | `LPDDR SDRAM`, `LPDDR2 SDRAM`, `LPDDR3 SDRAM`, `LPDDR4 SDRAM`, `LPDDR4X SDRAM`, `LPDDR5 SDRAM`, `LPDDR5X SDRAM` |
| Graphics DRAM | `GDDR SGRAM`, `GDDR2 SGRAM`, `GDDR3 SGRAM`, `GDDR4 SGRAM`, `GDDR5 SGRAM`, `GDDR5X SGRAM`, `GDDR6 SGRAM`, `GDDR6X SGRAM`, `GDDR7 SGRAM` |
| Specialty | `RLDRAM`, `RLDRAM 3` |

## 规则准入

- 每个厂商 pack 必须按产品线 / 世代拆 token 表，避免把 DDR、LPDDR、GDDR 的字段混在一条不可维护的规则里。
- 同一厂商同一 family 可能覆盖多个标准世代，例如 Micron `MT53` 通过 voltage token 区分 LPDDR4/LPDDR4X，`MT62` 通过 speed/package 资料区分 LPDDR5/LPDDR5X，`MT61` 通过 speed bin 区分 GDDR6/GDDR6X。
- 规则内部只能保留单一 `dram_type` 来源。公开输出时折叠到顶层短 `type`，例如 `LPDDR5` / `LPDDR5X` / `GDDR6` / `GDDR6X`，不保留 `SDRAM` / `SGRAM` 后缀；如果 token 不足以确认细分世代，输出更保守的基础世代，或等待后续 token / 外部资料确认。
- 已有厂商规则需要优先补全 frequency / speed bin 与 CS / die stack 信息；LPDDR、stacked DRAM 或 datasheet 明确 DDP/QDP/1CS/2CS 的 PN 必须输出 `dram_die_stack`。
- `fields.ce_count` 不对 LPDDR/GDDR 做缺省推断；只有 `dram_die_stack` 明确包含 CS 数量时才写入。普通 DDR/DDR2/DDR3/DDR4/DDR5 缺少 CS 资料时可按单 CS 输出。
- 大容量 configuration 可以基于已确认的 density / width token 规律扩展到新一代高容量 PN；但不能仅凭 `24Gb`、`32Gb`、`64Gb` 或 config 容量推断 `dram_die_stack`，必须有封装 / ordering table / datasheet 明确说明。
- `-` 后的 suffix 不应成为解码主结构的强制条件。缺 suffix 时应保留可确定字段，只减少 `dram_speed`、`operation_temperature`、`die_revision` 等后缀信息。
- `fields.package` 只写可由 datasheet、原厂 catalog、TechInsights/TechPowerUp 或可信分销页确认的实际封装；仅有厂商代码时只写 `package_code`。
- 每个新增世代至少补一个 testcase，验证 `device.productType` 以及 `fields.dram_density`、`fields.dram_width`、`fields.dram_voltage`、`fields.package` 等 canonical fields。
- 已知 DRAM PN 样例维护在 `packages/resources/resources/dram-pn.json`，用于 PN 补全和搜索，只保留 `vendor/pn`；Micron / Crucial / Micron legacy Elpida DRAM FBGA code 映射统一维护在 `packages/resources/resources/mdb.json`，用于 code 反查和补全。两者都不是解码规则来源，字段仍必须由 DSL token 解析得出。`crawl-mdb-from-fbga` 默认按 `C9/D8/D9/Z8/Z9` + 字母网格生成 Micron DRAM FBGA 候选，`packages/resources/resources/micron-fbga-codes.json` 仅作为非默认网格的补充 code 输入，并排除 `crawl-mdb` 已覆盖的 Micron NAND 段 `NC/NW/NY/NX/NQ/NV`。

## 当前覆盖进度

| 厂商 | SDR / DDR | LPDDR | Graphics DRAM | Specialty |
| --- | --- | --- | --- | --- |
| Micron / Crucial | SDR, LPSDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR5, GDDR5X, GDDR6, GDDR6X, GDDR7 | RLDRAM, RLDRAM 3 |
| SK hynix | SDR, DDR, DDR2, DDR3, DDR3L, DDR4, DDR5 | LPDDR4, LPDDR5, LPDDR5X | GDDR5, GDDR6 | - |
| Samsung | SDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR, GDDR2, GDDR3, GDDR4, GDDR5, GDDR6, GDDR7 | - |
| Nanya | DDR, DDR2, DDR3/DDR3L, DDR4, DDR5 | LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5/5X | - | - |
| Elpida | SDR, DDR, DDR2, DDR3 | LPDDR2, LPDDR3 | GDDR5 | - |
| CXMT | DDR4 | LPDDR4X | - | - |
| ISSI | DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |
| Winbond | DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |

SK hynix 仍需继续补齐 LPDDR/LPDDR2/LPDDR3、GDDR/GDDR2/GDDR3/GDDR4/GDDR7 等公开 ordering table；没有外部 PN 证据前不把推测写成确定结论。

当前大容量 config 已覆盖 Micron DDR5 24Gb / 32Gb、SK hynix DDR5 24Gb、Samsung DDR4 32Gb / DDR5 24Gb / 32Gb / LPDDR5X 64Gb，以及 Nanya DDR5-8000 `2048M8` 样例。CXMT 官方资料只确认 DDR5 / LPDDR5X 高容量产品存在，未公开足够 PN token breakdown，暂不进入 DSL。

Nanya 官方产品线未列 GDDR；Elpida 独立品牌 standard DDR 世代到 DDR3 结束，后续 DDR4/DDR5 不作为待补缺口；CXMT 官方资料确认 DDR5/LPDDR5/LPDDR5X 产品存在，但公开页面没有足够 PN breakdown，当前只把 DDR4 与 LPDDR4X 写入 DSL。ISSI 官方 PSG 明确列出更早 DDR/SDR 与 RLDRAM 产品，但本轮只把 DDR3/DDR3L、DDR4、LPDDR4/4X 写入 DSL；Winbond 官方 2026 PSG 明确列出 SDR/DDR/DDR2 与 LPDDR3，但本轮先覆盖 DDR3/DDR4/LPDDR4/4X。
