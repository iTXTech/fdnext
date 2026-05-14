# SpecTek DRAM PN 编码

采集日期：2026-05-14

## 外部资料

- SpecTek Laser Mark to Marketing Part Number Decoder: 官方 5 位 mark code 到 marketing PN 的查询入口。实测 `PE001` ~ `PE020` 返回 DRAM component PN，例如 `PE010` -> `PRA128M8V88AG8GQF`。
  <https://www.spectek.com/menus/mark_code.aspx>
- SpecTek Marketing Part Number Decoder: 官方 MPN 拆解入口，`DramComponent` 可确认 `PRN1G16Z22AD8RC-062E` 中 `Z = DDR4`，`PRM2G8Y52KBFRZ-56B` 中 `Y = DDR5`；`MobileDram` 可确认 `SN512M32Z42MD1DNQ-053BT` 为 Mobile LPDDR4，`SM768M16Y2BMD1FDS` 这类 `Y*D*` mobile 结构只能保守归入 LPDDR family。
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=DramComponent>
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=MobileDram>
- SpecTek DRAM Component Part Numbering Guide: 官方 `SpecTek Components Part Number Matrix`，2024-07-09 版，覆盖 component prefix、density-width、internal designator、voltage、refresh、speed bin、package code 与 die count 表。
  `/Users/peratx/Downloads/spectek-pns-components.pdf`
- SpecTek Mobile DRAM Part Numbering System: 官方 mobile DRAM PN matrix，2025-03-19 版，覆盖 mobile prefix、depth/width、speed max clock、die count、voltage、package code、speed grade 与 special option。
  `/Users/peratx/Downloads/spectek-pns-mobile-dram.pdf`
- Micron SpecTek Buyers Guide: DRAM 页列出 `PRN` / `PRM`、`TP`、`PG` 等等级和样例 PN，并把 DRAM Component Part Numbering Guide、DRAM Component Mark Reference、Laser Mark to MPN Decoder 作为官方资料入口。
  <https://www.micron.com/content/dam/micron/global/public/spectek/buyers-guide/spectekbuyersguide.pdf>
- 2015 SpecTek Components FBGA Matrix mirror: 覆盖 `PE008` ~ `PE012` 等 `PE` DRAM mark code 到 PN 的对应关系，可用于交叉验证旧表。
  <https://pcper.com/wp-content/uploads/2013/06/8c06-fbgamark.pdf>
- Puris SpecTek DRAM/LPDDR 表: 第三方表格把 `PE001`、`PE002`、`PE003`、`PE004`、`PE006`、`PE007` 等标为 DDR3，用于辅助判断 `PE` 批次的 DRAM 类型；不作为唯一规则来源。
  <https://www.puris.net/archives/7244>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/spectek-dram-token.json`
- `vendor.spectek.mobile-dram.component.v1`
- `vendor.spectek.dram.component.v1`

MDB mark code:

- `packages/resources/resources/mdb.json`
- `PE001` ~ `PE020` 已按官方 decoder 查询结果加入 `spectek` marking 映射。
- `PB001`、`PP002`、`PU001` 已作为新 DRAM family 回归样本加入 `spectek` marking 映射。
- `packages/fdbgen/src/mdb.ts` 的 `crawl-mdb` 默认仍运行 SpecTek section，SpecTek crawl header 已加入 `PB`、`PE`、`PP`、`PU`，后续可用同一个入口补全更大范围。

## PN 结构

当前只接入 DRAM component 的稳定公共字段，不处理 module-only 结构。

| 结构 | 含义 |
| --- | --- |
| `PR*` / `S*` / `XCB*` grade prefix | SpecTek DRAM grade / sales bin 前缀 |
| `128M8`、`256M16`、`512M8`、`1024M4` 等 | component configuration，按 depth * width 输出 `dram_density` 和 `dram_width` |
| `V` | DDR3；由 `PE` 官方 decoder 样本和旧 FBGA Matrix / 第三方 DRAM 表交叉确认 |
| `Z` | DDR4；由 Buyers Guide 的 `PRN1G16Z22AD8RC-062E` 等样例确认 |
| `Y` | DDR5；由官方 MPN decoder 的 `PRM2G8Y52KBFRZ-56B` 样例确认 |
| `U` / `T` / `G` | 旧表辅助映射为 DDR2 / DDR / LPDDR2 |
| `S*` / `PC` / `X` + mobile depth-width | Mobile DRAM；官方 mobile matrix 覆盖 `8M` ~ `8G` depth 与 `x16` / `x32` / `x64` / `x128` width，按 depth * width 输出 `dram_density` 和 `dram_width` |
| mobile design id `Y*` / `Z*` | `Z*` 可确认到 LPDDR4，`Y*` 在没有 speed token 时保守输出 `LPDDR`；若尾部 speed token 命中官方 LPDDR3/4/5 速度表，则由 speed table 收敛到具体 LPDDR 代际 |
| mobile `D1` / `D2` / `D3` / `D4` / `D6` / `D8` / `DA` / `DB` / `DD` / `DE` | 官方 die count 表，输出 `die_count` |
| mobile `A` / `B` / `C` / `D` / `F` / `L` / `M` voltage token | 官方 mobile voltage 表，输出纯电压字段 |
| 尾部 package code | 仅作为内部解析 token；有官方 package 表命中时输出 `package`，不单独向用户展示 token |
| mobile `DS` package code | 官方 package 表中 `DS` 同时存在 LPDDR4 与 LPDDR5 两种封装，需先由 speed table / design id 判断 LPDDR profile，再输出对应 package |
| `-023`、`-053`、`-062`、`-107`、`-125`、`-15E`、`-062E` 等 | JEDEC / Micron-style speed token，按已有 DRAM 速度术语输出 `dram_speed`；mobile speed table 同时用于判断 LPDDR3/4/5 |
| mobile `BT` / `FT` / `MB` / `PG` / `UT` | 官方 speed grade / test bin，输出 `speed_grade` |
| mobile `A` / `B` special option | 官方 mobile special option，输出 `special_option` |

## 输出字段

- `dram_type`
- `dram_density`
- `dram_width`
- `dram_voltage`
- `package`
- `die_count`
- `dram_speed`
- `speed_grade`
- `special_option`

## 测试样例

- `PRA128M8V88AG8GQF`
- `PE010`
- `SU512M8V80A11ARH`
- `PE002`
- `PB001`
- `PRM2G8Y52KBFRZ-56B`
- `PU001`
- `SN512M32Z42MD1DNQ-053BT`
- `SM1G32Z11MD4DDT-062BTA`
- `SM1G32Z11MD4DDS-062BTA`
- `SM1G32Y11MD4BDS-023FTB`
- `PRN1G8V91AG8SN-107`

## 注意

`PE` 是 SpecTek mark code 头，不是完整 PN 头。接入时优先把官方 mark decoder 的 PE 结果落入 `mdb.spectek`，再由 DRAM PN 规则解析返回的 marketing PN。`package_code`、`config_code` 等 token 只用于内部解析，不进入公开字段；只在官方 package 表命中时展示封装描述，且 `package` 字段不重复包含 DDR / LPDDR 代际信息。电压字段只保留电压值本身，不把 DDR 代际重复写进电压文本。
