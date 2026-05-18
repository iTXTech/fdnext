# DRAM 世代覆盖约定

采集日期：2026-05-18

DRAM 解码模块按“厂商 + 世代矩阵”维护。新增或扩展 standalone DRAM 厂商时，不能只补少量热门 PN；需要先确认该厂商公开资料中可验证的 DDR/SDR、LPDDR、Graphics DRAM 世代，再按结构化 token 建表。

## 标准世代矩阵

| 产品线 | 内部 `dram_type` 来源 |
| --- | --- |
| SDR / DDR | `SDR`, `LPSDR`, `DDR`, `DDR2`, `DDR3`, `DDR4`, `DDR5` |
| LPDDR | `LPDDR`, `LPDDR2`, `LPDDR3`, `LPDDR4`, `LPDDR4X`, `LPDDR5`, `LPDDR5X` |
| Graphics DRAM | `GDDR`, `GDDR2`, `GDDR3`, `GDDR4`, `GDDR5`, `GDDR5X`, `GDDR6`, `GDDR6X`, `GDDR7` |
| Specialty | `RLDRAM`, `RLDRAM 3`, `HBM2E`, `HMC` |

## 规则准入

- 每个厂商 pack 必须按产品线 / 世代拆 token 表，避免把 DDR、LPDDR、GDDR 的字段混在一条不可维护的规则里。
- 同一厂商同一 family 可能覆盖多个标准世代，例如 Micron `MT53` 通过 voltage token 区分 LPDDR4/LPDDR4X，`MT62` 通过 speed/package 资料区分 LPDDR5/LPDDR5X，`MT61` 通过 speed bin 区分 GDDR6/GDDR6X。
- 规则内部只能保留单一 `dram_type` 来源。公开输出时折叠到顶层短 `type`，例如 `LPDDR5` / `LPDDR5X` / `GDDR6` / `GDDR6X`，不保留 `SDRAM` / `SGRAM` 后缀；如果 token 不足以确认细分世代，输出更保守的基础世代，或等待后续 token / 外部资料确认。
- 已有厂商规则需要优先补全 frequency / speed bin 与 CS / die stack 信息；只有物理 die 数和 CS 同时明确时才输出 `dram_die_stack = N die(s), M CS`，只确认 rank/CS 时不要把 rank 当 die 推断。
- `fields.ce_count` 不对 LPDDR/GDDR 做缺省推断；只有资料或 token 明确包含 CS / rank 数量时才写入。普通 DDR/DDR2/DDR3/DDR4/DDR5 缺少 CS 资料时可按单 CS 输出。
- `dram_die_stack` 简化时不能丢掉非 stack 语义：PoP/MCP 归入 `package`，2Ch 归入 `channel_count`，reduced page address / 2 CKE / JEDEC 或 Flexframe layout 归入 `special_option`。
- 大容量 configuration 可以基于已确认的 density / width token 规律扩展到新一代高容量 PN；但不能仅凭 `24Gb`、`32Gb`、`64Gb` 或 config 容量推断 `dram_die_stack`，必须有封装 / ordering table / datasheet 明确说明。
- `-` 后的 suffix 不应成为解码主结构的强制条件。缺 suffix 时应保留可确定字段，只减少 `dram_speed`、`operation_temperature`、`die_revision` 等后缀信息。
- `fields.package` 只写可由 datasheet、原厂 catalog、TechInsights/TechPowerUp 或可信分销页确认的实际封装；仅有厂商 code 时保留为内部解析 token，不输出公开字段。
- 每个新增世代至少补一个 testcase，验证 `device.productType` 以及 `fields.dram_density`、`fields.dram_width`、`fields.dram_voltage`、`fields.package` 等 canonical fields。
- 已知 DRAM PN 样例维护在 `packages/core/resources/dram-pn.json`，用于 PN 补全和搜索，只保留 `vendor/pn`；Micron / Crucial / Micron legacy Elpida DRAM FBGA code 映射统一维护在 `packages/core/resources/mdb.json`，用于 code 反查和补全。两者都不是解码规则来源，字段仍必须由 iTXTech fdnext DecodePack token 解析得出。`crawl-mdb` 默认按 Micron FBGA prefix profile 生成候选：`C9/D8/D9/Z8/Z9` 使用后三位字母网格，`NC/NW/NY/NX/NQ/NV` 使用数字段；`--codes` 补充输入按前缀路由，命中 Micron profile 的 code 走 Micron API，`P*` code 走 SpecTek。
- 2026-05-12 网络补全只刷新非 Micron exact PN：Samsung DDR4 Product Guide、SK hynix DDR4/DDR5 datasheet / listing、Nanya 官方产品列表、CXMT LCSC exact PN 列表、ESMT / Etron 官方产品表。ISSI / Winbond 已由官方 PSG 批量展开，Micron 继续由 `mdb.json` / Micron FBGA 路径覆盖。
- 2026-05-17 根据 SK hynix DDR5 component ordering / decoder / serial-code 表扩展 H5C DDR5 token：补齐 8Gb/16Gb/24Gb/32Gb/64Gb density、4800/5600/6400/7200/8000 speed、82/106-ball package、serial die count/TSV，并把已知 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Samsung Product Selection Guide 1H 2017 补齐 Samsung DDR3/DDR4 exact PN 种子，并只把 `K4B8G1646Q` 作为 DDR3 8Gb x16 规则补充；表中误列到 DDR3 区域的 `K4G...` 仍按 GDDR5 family 规则处理。
- 2026-05-18 根据 Samsung LPDDR4/4X ordering diagrams 优化 `K4F/K4U` mobile DRAM token：补齐 8Gb/16Gb/32Gb/64Gb density、Mono/DDP/QDP/2CS organization、8-bank、LVSTL_11/LVSTLE_06、generation 与 exact PN 种子，并保持 `K4U` LPDDR4X ordering 优先于 legacy GDDR4 `K4U` 规则。
- 2026-05-18 根据 Nanya DDR4 8Gb C-Die / 4Gb E-Die ordering 截图补齐 `NT5AD` DDR4 的 C/E die revision、VDD/VDDQ/VPP、电压与速度时序、TFBGA 封装尺寸、bank count、温度 grade，并把 ordering table 中的 C/E exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Nanya LPDDR3 4Gb / 8Gb / 16Gb / 32Gb ordering 截图补齐 `NT6CL` 的 A/B/D device version、M/P/Q/R package、H0/H1/H2 speed + RL、DDP/QDP CS、x64 2-channel 组合，并把 ordering table 中的 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Nanya LPDDR4 2Gb / 4Gb、4Gb / 8Gb、8Gb / 16Gb / 32Gb ordering 截图补齐 `NT6AN` 的 LVSTL、A version、M/T/F die、x16/x32 channel、200-ball FBGA 厚度差异、J1/J2/J3 speed + RL，并把 ordering table 中的 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 CXMT DDR4 / LPDDR4X ordering 截图细化 `CXDQ` 与 `CXDB` token：DDR4 speed 输出 2666/3200 timing，LPDDR4X suffix 拆为 temp + speed，`WG` 无 final die-version 时不再输出 die revision，并把 `CXDQ3A8AM-WG` 加入 `dram-pn.json`。

## 当前覆盖进度

| 厂商 | SDR / DDR | LPDDR | Graphics DRAM | Specialty |
| --- | --- | --- | --- | --- |
| Micron / Crucial | SDR, LPSDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR5, GDDR5X, GDDR6, GDDR6X, GDDR7 | RLDRAM, RLDRAM 3, HBM2E, HMC |
| SK hynix | SDR, DDR, DDR2, DDR3, DDR3L, DDR4, DDR5 | LPDDR3, LPDDR4, LPDDR5, LPDDR5X | GDDR5, GDDR6 | - |
| Samsung | SDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR, GDDR2, GDDR3, GDDR4, GDDR5, GDDR6, GDDR7 | - |
| Nanya | DDR, DDR2, DDR3/DDR3L, DDR4, DDR5 | LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5/5X | - | - |
| Elpida | SDR, DDR, DDR2, DDR3 | LPDDR2, LPDDR3 | GDDR5 | - |
| CXMT | DDR4, DDR5 inferred `CXDR` | LPDDR4X, LPDDR5 `CDTQ` alias | - | - |
| ISSI | DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |
| Winbond | DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |
| ESMT | SDR, DDR, DDR2, DDR3/DDR3L, DDR4 | LPDDR2, LPDDR3, LPDDR4X | - | - |
| Etron | SDR, DDR, DDR2, DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |
| SpecTek | DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR4 | 待调研 | - |

SK hynix 仍需继续补齐 LPDDR/LPDDR2、GDDR/GDDR2/GDDR3/GDDR4/GDDR7 等公开 ordering table；没有外部 PN 证据前不把推测写成确定结论。

当前大容量 config 已覆盖 Micron DDR5 24Gb / 32Gb、SK hynix DDR5 24Gb / 32Gb / 64Gb、Samsung DDR4 32Gb / DDR5 24Gb / 32Gb / LPDDR5X 64Gb，以及 Nanya DDR5-8000 `2048M8` 样例。CXMT 已扩展 DDR4 x8/x16、16Gb DDR4、LPDDR4X 2GB/4GB discrete 颗粒，并加入 `CXDR4E8BM-*` DDR5 G4 / 16nm-class 推断与 `CDTQ` LPDDR5 G3 / 12Gb die 标记别名；CXMT LPDDR5X 仍缺少公开 PN token breakdown，暂不进入 iTXTech fdnext DecodePack。

Nanya 官方产品线未列 GDDR；Elpida 独立品牌 standard DDR 世代到 DDR3 结束，后续 DDR4/DDR5 不作为待补缺口；CXMT 官方资料确认 DDR5/LPDDR5/LPDDR5X 产品存在，但公开页面没有足够 LPDDR5X PN breakdown，当前只把 DDR4、DDR5 `CXDR` 推断、LPDDR4X 与 LPDDR5 `CDTQ` 别名写入 iTXTech fdnext DecodePack。ISSI 官方 PSG 明确列出更早 DDR/SDR 与 RLDRAM 产品，但本轮只把 DDR3/DDR3L、DDR4、LPDDR4/4X 写入 iTXTech fdnext DecodePack；Winbond 官方 2026 PSG 明确列出 SDR/DDR/DDR2 与 LPDDR3，但本轮先覆盖 DDR3/DDR4/LPDDR4/4X。ESMT 与 Etron 本轮按官方产品页补入成熟制程 / specialty DRAM 颗粒：ESMT 覆盖 SDR 到 DDR4 以及 LPDDR2/3/4X，Etron 覆盖 automotive SDR、specialty DDR 到 DDR4 以及 LPDDR4/4X。
