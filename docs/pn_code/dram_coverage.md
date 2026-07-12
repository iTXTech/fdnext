# DRAM 世代覆盖约定

采集日期：2026-05-18

DRAM 解码模块按“厂商 + 世代矩阵”维护。新增或扩展 standalone DRAM 厂商时，不能只补少量热门 PN；需要先确认该厂商公开资料中可验证的 DDR/SDR、LPDDR、Graphics DRAM 世代，再按结构化 token 建表。

## 标准世代矩阵

| 产品线 | 内部 `dram_type` 来源 |
| --- | --- |
| SDR / DDR | `SDR`, `LPSDR`, `DDR`, `DDR2`, `DDR3`, `DDR4`, `DDR5` |
| LPDDR | `LPDDR`, `LPDDR2`, `LPDDR3`, `LPDDR4`, `LPDDR4X`, `LPDDR5`, `LPDDR5X` |
| Graphics DRAM | `GDDR`, `GDDR2`, `GDDR3`, `GDDR4`, `GDDR5`, `GDDR5X`, `GDDR6`, `GDDR6X`, `GDDR7` |
| Specialty | `RLDRAM`, `RLDRAM 3`, `HBM2E`, `HBM3E`, `HMC` |

## 规则准入

- 每个厂商 pack 必须按产品线 / 世代拆 token 表，避免把 DDR、LPDDR、GDDR 的字段混在一条不可维护的规则里。
- 同一厂商同一 family 可能覆盖多个标准世代，例如 Micron `MT53` 通过 voltage token 区分 LPDDR4/LPDDR4X，`MT62` 通过 speed/package 资料区分 LPDDR5/LPDDR5X，`MT61` 通过 speed bin 区分 GDDR6/GDDR6X。
- 规则内部只能保留单一 `dram_type` 来源。公开输出时折叠到顶层短 `type`，例如 `LPDDR5` / `LPDDR5X` / `GDDR6` / `GDDR6X`，不保留 `SDRAM` / `SGRAM` 后缀；如果 token 不足以确认细分世代，输出更保守的基础世代，或等待后续 token / 外部资料确认。
- 已有厂商规则需要优先补全 frequency / speed bin 与 DRAM topology 信息；物理 die 数输出 `dram_die_count`，CS/rank 输出 `cs_count`，只确认 rank/CS 时不要把 rank 当 die 推断。
- `fields.cs_count` 不对 LPDDR/GDDR 做缺省推断；只有资料或 token 明确包含 CS / rank 数量时才写入。普通 DDR/DDR2/DDR3/DDR4/DDR5 缺少 CS 资料时可按单 CS 输出。
- 清理旧 stack 表述时不能丢掉非计数语义：PoP/MCP 归入 `package`，2Ch 归入 `channel_count`，reduced page address / 2 CKE / JEDEC 或 Flexframe layout 归入 `special_option`。
- 大容量 configuration 可以基于已确认的 density / width token 规律扩展到新一代高容量 PN；但不能仅凭 `24Gb`、`32Gb`、`64Gb` 或 config 容量推断 `dram_die_count`，必须有封装 / ordering table / datasheet 明确说明。
- `-` 后的 suffix 不应成为解码主结构的强制条件。缺 suffix 时应保留可确定字段，只减少 `dram_speed`、`operation_temperature`、`die_revision` 等后缀信息。
- `fields.package` 只写可由 datasheet、原厂 catalog、TechInsights/TechPowerUp 或可信分销页确认的实际封装；仅有厂商 code 时保留为内部解析 token，不输出公开字段。
- 每个新增世代至少补一个 testcase，验证 `device.productType` 以及 `fields.dram_density`、`fields.dram_width`、`fields.dram_voltage`、`fields.package` 等 canonical fields。
- 已知 DRAM PN 样例维护在 `packages/core/resources/dram-pn.json`，用于 PN 补全和搜索，只保留 `vendor/pn`；Micron / Crucial / Micron legacy Elpida DRAM FBGA code 映射统一维护在 `packages/core/resources/mdb.json`，用于 code 反查和补全。两者都不是解码规则来源，字段仍必须由 iTXTech fdnext DecodePack token 解析得出。`crawl-mdb` 默认按 Micron FBGA prefix profile 生成候选：`C9/D8/D9/Z8/Z9` 使用后三位字母网格，`NC/NW/NY/NX/NQ/NV` 使用数字段；`--codes` 补充输入按前缀路由，命中 Micron profile 的 code 走 Micron API，`P*` code 走 SpecTek。
- `dram-pn.json` 不保留同一官方 PN 的纯标点等价重复项；如果厂商 ordering 同时允许带 dash 与不带 dash 的 suffix 写法，应选择一种 canonical 展示形态，并用测试防止等价重复。
- 2026-05-12 网络补全只刷新非 Micron exact PN：Samsung DDR4 Product Guide、SK hynix DDR4/DDR5 datasheet / listing、Nanya 官方产品列表、CXMT LCSC exact PN 列表、ESMT / Etron 官方产品表。ISSI / Winbond 已由官方 PSG 批量展开，Micron 继续由 `mdb.json` / Micron FBGA 路径覆盖。
- 2026-05-17 根据 SK hynix DDR5 component ordering / decoder / serial-code 表扩展 H5C DDR5 token：补齐 8Gb/16Gb/24Gb/32Gb/64Gb density、4800/5600/6400/7200/8000 speed、82/106-ball package、serial die count/TSV，并把已知 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Samsung Product Selection Guide 1H 2017 补齐 Samsung DDR3/DDR4 exact PN 种子，并只把 `K4B8G1646Q` 作为 DDR3 8Gb x16 规则补充；表中误列到 DDR3 区域的 `K4G...` 仍按 GDDR5 family 规则处理。
- 2026-05-18 根据 Samsung LPDDR4/4X ordering diagrams 优化 `K4F/K4U` mobile DRAM token：补齐 8Gb/16Gb/32Gb/64Gb density、Mono/DDP/QDP/2CS organization、8-bank、LVSTL_11/LVSTLE_06、generation 与 exact PN 种子，并保持 `K4U` LPDDR4X ordering 优先于 legacy GDDR4 `K4U` 规则。
- 2026-05-18 根据 Nanya DDR4 8Gb C-Die / 4Gb E-Die ordering 截图补齐 `NT5AD` DDR4 的 C/E die revision、VDD/VDDQ/VPP、电压与速度时序、TFBGA 封装尺寸、bank count、温度 grade，并把 ordering table 中的 C/E exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Nanya LPDDR3 4Gb / 8Gb / 16Gb / 32Gb ordering 截图补齐 `NT6CL` 的 A/B/D device version、M/P/Q/R package、H0/H1/H2 speed + RL、DDP/QDP CS、x64 2-channel 组合，并把 ordering table 中的 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Nanya LPDDR4 2Gb / 4Gb、4Gb / 8Gb、8Gb / 16Gb / 32Gb ordering 截图补齐 `NT6AN` 的 LVSTL、A version、M/T/F die、x16/x32 channel、200-ball FBGA 厚度差异、J1/J2/J3 speed + RL，并把 ordering table 中的 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 CXMT DDR4 / LPDDR4X ordering 截图细化 `CXDQ` 与 `CXDB` token：DDR4 speed 输出 2666/3200 timing，LPDDR4X suffix 拆为 temp + speed，`WG` 无 final die-version 时不再输出 die revision，并把 `CXDQ3A8AM-WG` 加入 `dram-pn.json`。
- 2026-05-18 根据 GigaDevice 官方 DDR4 / LPDDR4X 产品页与 GDQ/GDB ordering 截图新增 GigaDevice DRAM token：覆盖 `GDQ` DDR4 4Gb/8Gb x8/x16、`GDB` LPDDR4X 16Gb/32Gb x32、温度/速度 suffix，并把 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 GigaDevice DDR3L 产品页、XCMemory 产品页和 GDP ordering 截图补齐 `GDP` DDR3L token：覆盖 1Gb/2Gb/4Gb/8Gb、x8/x16、78/96-ball FBGA、1.35V/1.5V、商业/宽温与 1866/2133 timing，并把 exact PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Winbond 2026 PSG 与用户提供的 ordering 表补齐 `W631GG6/8NB`、`W664GG6/8RB` 基础 family PN：suffix 最后两位输出 DDR3/DDR4 speed + timing，最后一位字母输出温度档；基础 family PN 加入 `dram-pn.json`，缺 suffix 时只输出容量、位宽、电压、封装等确定字段。
- 2026-05-18 根据 Winbond 2026 PSG 与用户提供的 ordering 表新增 `W94` DDR 与 `W97` DDR2 token：覆盖 DDR 128Mb/256Mb x16 TSOP、DDR2 128Mb/256Mb/1Gb/2Gb x8/x16 TFBGA、4-bank / 8-bank、speed/timing suffix 与温度等级，并把对应 PN 加入 `dram-pn.json`。
- 2026-05-18 根据 Winbond LPDDR4/LPDDR4X datasheet 与 ordering 表补齐 `W66AP6NB`、`W66AQ6NB`、`W66BP2NQ`、`W66BQ2NQ` 基础 family，以及 `W66BP6RB` / `W66CP2RQ` LPDDR4/4X Combo：base PN 加入 `dram-pn.json`，combo 输出 VDDQ=1.1V LPDDR4 mode / VDDQ=0.6V LPDDR4X mode 与 `LPDDR4/4X-*` speed。
- 2026-05-18 根据用户提供的 Winbond LPDDR / LPDDR2 / LPDDR3 datasheet 补齐 `W948/W949/W94AD`、`W978/W979/W97AH`、`W639/W63AH` token：覆盖 256Mb~1Gb、x16/x32、4-bank / 8-bank 与 LPDDR3 2-bank、VFBGA60/90/134/178、速度和 E/I 温度档，并把 ordering table 中的 base / exact PN 加入 `dram-pn.json`。
- 2026-05-19 根据用户提供的 Etron LPDDR2 / LPDDR4 / LPDDR4X datasheet 截图补齐 `EM6K` LPDDR2 token，并把 Etron LPDDR4/4X 补全项从页眉式 family PN 清理为带 speed suffix 的标准 ordering PN；带 speed token 的 PN 只输出具体速率，不输出 family 级速度范围。
- 2026-05-19 从 Etron 官网 specialty DRAM 页面抓取 DDR、DDR2、DDR3/DDR3L、DDR4 的 52 个公开 datasheet，只解析前两页 ordering information / specs：补齐 DDR~DDR4 speed suffix、DDR3/DDR3L 工业/车规/stacked dice suffix、精确 FBGA/BGA/TSOP 封装尺寸，并把 181 个带 speed suffix 的 ordering PN 加入 `dram-pn.json`。带 speed suffix 的 PN 只输出具体速率，不重复输出 family speed。
- 2026-07-11 根据 Nanya 官方 Standard/Low Power Part Numbering Guide 补齐 DDR4-2933、DDR5-4800 与扩展温区 token；根据 ESMT 两份特定产品 datasheet ordering information 补齐 DDR4 8Gb x16 的 NL/KJ 速度和 LPDDR4X 16Gb x32 双通道 Product ID。
- 2026-07-11 继续按品牌×产品线审计：补 Samsung LPDDR5X 24Gb / 新 64Gb configuration、GDDR7-28 与 Automotive UFS 4.1，补 Micron 24Gb GDDR7、Nanya LPDDR5/5X exact PN；当时 CXMT LPDDR5X 只更新候选范围，不在缺 PN token 时推造规则。
- 2026-07-12 根据 Rockchip DDR 兼容清单的两个 `CXDC` 样本与 CSEKER 的 `CXDD` 样本，新增 CXMT LPDDR5/LPDDR5X family、density、layout/package 局部 token；完整 PN 只进入搜索资源和 testcase。
- 2026-07-12 对照 Winbond 2025 官方 PSG 补入 16 条 4Gb LPDDR4/4X 4267 MT/s ordering PN，覆盖 `W66CP/CQ2NQQ/QUAH` 的工业与车规等级；不修改既有 token mapping。

## 当前覆盖进度

| 厂商 | SDR / DDR | LPDDR | Graphics DRAM | Specialty |
| --- | --- | --- | --- | --- |
| Micron / Crucial | SDR, LPSDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR5, GDDR5X, GDDR6, GDDR6X, GDDR7 | RLDRAM, RLDRAM 3, HBM2E, HBM3E, HMC |
| SK hynix | SDR, DDR, DDR2, DDR3, DDR3L, DDR4, DDR5 | LPDDR3, LPDDR4, LPDDR5, LPDDR5X | GDDR5, GDDR6 | - |
| Samsung | SDR, DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5, LPDDR5X | GDDR, GDDR2, GDDR3, GDDR4, GDDR5, GDDR6, GDDR7 | - |
| Nanya | DDR, DDR2, DDR3/DDR3L, DDR4, DDR5 | LPDDR2, LPDDR3, LPDDR4, LPDDR4X, LPDDR5/5X | - | - |
| Elpida | SDR, DDR, DDR2, DDR3 | LPDDR2, LPDDR3 | GDDR5 | - |
| CXMT | DDR4, DDR5 inferred `CXDR` | LPDDR4X, LPDDR5/LPDDR5X `CXDC/CXDD`, LPDDR5 `CDTQ` alias | - | - |
| GigaDevice | DDR3/DDR3L, DDR4 | LPDDR4X | - | - |
| ISSI | DDR3/DDR3L, DDR4 | LPDDR4, LPDDR4X | - | - |
| Winbond | DDR, DDR2, DDR3/DDR3L, DDR4 | LPDDR, LPDDR2, LPDDR3, LPDDR4, LPDDR4X | - | - |
| ESMT | SDR, DDR, DDR2, DDR3/DDR3L, DDR4 | LPDDR2, LPDDR3, LPDDR4X | - | - |
| Etron | SDR, DDR, DDR2, DDR3/DDR3L, DDR4 | LPDDR2, LPDDR4, LPDDR4X | - | - |
| SpecTek | DDR, DDR2, DDR3, DDR4, DDR5 | LPDDR, LPDDR2, LPDDR4 | 待调研 | - |

SK hynix 仍需继续补齐 LPDDR/LPDDR2、GDDR/GDDR2/GDDR3/GDDR4/GDDR7 等公开 ordering table；没有外部 PN 证据前不把推测写成确定结论。

当前大容量 config 已覆盖 Micron DDR5 24Gb / 32Gb、SK hynix DDR5 24Gb / 32Gb / 64Gb、Samsung DDR4 32Gb / DDR5 24Gb / 32Gb / LPDDR5X 64Gb，以及 Nanya DDR5-8000 `2048M8` 样例。CXMT 已扩展 DDR4 x8/x16、16Gb DDR4、LPDDR4X 2GB/4GB discrete 颗粒，并加入 `CXDR4E8BM-*` DDR5 G4 / 16nm-class 推断、`CXDC/CXDD` LPDDR5/LPDDR5X 局部 token 与 `CDTQ` LPDDR5 G3 / 12Gb die 标记别名；GigaDevice 当前覆盖 DDR3L 1Gb/2Gb/4Gb/8Gb、DDR4 4Gb/8Gb 与 LPDDR4X 16Gb/32Gb standalone 颗粒。GigaDevice LPDDR5/LPDDR5X 仍缺少公开 PN token breakdown，暂不进入 iTXTech fdnext DecodePack。

现有封测/品牌厂商中，BIWIN 已按 2026 官方 ordering 表加入 LPDDR4X 8Gb~64Gb 与 LPDDR5X 32Gb~128Gb standalone 颗粒；Longsys / FORESEE 已按官方 P/N 表加入 2Gb/4Gb DDR3L。Longsys LPDDR 页面仍只公开容量/封装矩阵而无逐容量 P/N，因此不反推料号。

Nanya 官方产品线未列 GDDR；Elpida 独立品牌 standard DDR 世代到 DDR3 结束，后续 DDR4/DDR5 不作为待补缺口；CXMT 官方资料确认 DDR5/LPDDR5/LPDDR5X 产品存在，当前按 Rockchip/CSEKER 外部料号表补入 `CXDC/CXDD` 的 family、density、layout/package 局部 token，尚未确认的 speed、temperature 和 die topology 继续省略。ISSI 官方 PSG 明确列出更早 DDR/SDR 与 RLDRAM 产品，但本轮只把 DDR3/DDR3L、DDR4、LPDDR4/4X 写入 iTXTech fdnext DecodePack；Winbond 当前已覆盖 DDR/DDR2/DDR3/DDR4 与 LPDDR/LPDDR2/LPDDR3/LPDDR4/LPDDR4X，SDR 仍待后续外部 ordering 细化。ESMT 与 Etron 本轮按官方产品页补入成熟制程 / specialty DRAM 颗粒：ESMT 覆盖 SDR 到 DDR4 以及 LPDDR2/3/4X，Etron 覆盖 automotive SDR、specialty DDR 到 DDR4 以及 LPDDR2/4/4X。
