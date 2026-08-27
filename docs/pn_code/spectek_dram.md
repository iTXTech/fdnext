# SpecTek DRAM PN 编码

采集日期：2026-05-14；更新日期：2026-08-27

## 外部资料

- SpecTek Laser Mark to Marketing Part Number Decoder: 官方 5 位 mark code 到 marketing PN 的查询入口。实测 `PE001` ~ `PE020` 返回 DRAM component PN，例如 `PE010` -> `PRA128M8V88AG8GQF`。
  <https://www.spectek.com/menus/mark_code.aspx>
- SpecTek Marketing Part Number Decoder: 官方 MPN 拆解入口，`DramComponent` 可确认 `PRN1G16Z22AD8RC-062E` 中 `Z = DDR4`，`PRM2G8Y52KBFRZ-56B` 中 `Y = DDR5`；`MobileDram` 可确认 `SN512M32Z42MD1DNQ-053BT` 为 Mobile LPDDR4，`SM768M16Y2BMD1FDS` 这类 `Y*D*` mobile 结构只能保守归入 LPDDR family。
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=DramComponent>
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=MobileDram>
- SpecTek DRAM Component Part Numbering Guide: 官方 `SpecTek Components Part Number Matrix`，2024-07-09 版，覆盖 component prefix、density-width、internal designator、voltage、refresh、speed bin、package code 与 die count 表。
  `spectek-pns-components.pdf`
- SpecTek Mobile DRAM Part Numbering System: 官方 mobile DRAM PN matrix，2025-03-19 版，覆盖 mobile prefix、depth/width、speed max clock、die count、voltage、完整 package code 表、speed grade 与 special option。
  `spectek-pns-mobile-dram.pdf`
- 用户补充的 SpecTek DDR3 / DDR4 datasheet / addendum 截图覆盖 1Gb / 2Gb / 4Gb DDR3 component samples、4Gb / 8Gb / 16Gb component DDR4、16Gb / 32Gb x4 3DS DDR4、16Gb x16 TwinDie single-rank DDR4，以及 Micron 32Gb x4/x8 TwinDie DDR4 对应 package / speed 表；本轮用于补齐 DDR3 `V:*` scoped speed bin、`GD` speed-trimmed refresh option、`GFF/GHF/GKF/GNF/GPF/GQF/GQL/RAF/ZRF` 封装，以及 DDR4 大容量 configuration、`Z` product-code scoped speed bin、3DS `H/J` speed bin 和 `GK` 封装。
- Micron SpecTek Buyers Guide: DRAM 页列出 `PRN` / `PRM`、`TP`、`PG` 等等级和样例 PN，并把 DRAM Component Part Numbering Guide、DRAM Component Mark Reference、Laser Mark to MPN Decoder 作为官方资料入口。
  <https://www.micron.com/content/dam/micron/global/public/spectek/buyers-guide/spectekbuyersguide.pdf>
- 2015 SpecTek Components FBGA Matrix mirror: 覆盖 `PE008` ~ `PE012` 等 `PE` DRAM mark code 到 PN 的对应关系，可用于交叉验证旧表。
  <https://pcper.com/wp-content/uploads/2013/06/8c06-fbgamark.pdf>
- Puris SpecTek DRAM/LPDDR 表: 第三方表格把 `PE001`、`PE002`、`PE003`、`PE004`、`PE006`、`PE007` 等标为 DDR3，用于辅助判断 `PE` 批次的 DRAM 类型；不作为唯一规则来源。
  <https://www.puris.net/archives/7244>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/spectek-dram-token.json`
- `vendor.spectek.mobile-dram.component.v1`
- `vendor.spectek.dram.component.v1`

MDB mark code:

- `packages/core/resources/mdb.json`
- `PE001` ~ `PE020` 已按官方 decoder 查询结果加入 `spectek` marking 映射。
- `PB001`、`PP002`、`PU001` 已作为新 DRAM family 回归样本加入 `spectek` marking 映射；`PEB09`、`PE918`、`PE027` 等 DDR3 截图样本也在 `mdb.spectek` 中用于 mark code 回查。
- `packages/fdbgen/src/mdb.ts` 的 `crawl-mdb` 默认仍运行 SpecTek section，SpecTek crawl header 已加入 `PB`、`PE`、`PP`、`PU`，后续可用同一个入口补全更大范围。

## PN 结构

当前只接入 DRAM component 的稳定公共字段，不处理 module-only 结构。

| 结构 | 含义 |
| --- | --- |
| `PNL` / `PRA` / `PRN` / `PRM` / `SGG` / `SMG` / `SNL` / `SUM` / `SUU` / `SCD` / `SCM` / `SCT` / `SMC` / `SMD` / `SMM` / `SMU` / `XAA` / `XBA` / `XCB` / `XCBB` prefix | SpecTek DRAM component mark / customer mark 前缀；只输出官方解释到 `special_option`，不输出 raw `marking_code` 字段 |
| `128M8`、`256M16`、`512M8`、`1024M4`、`2048M8`、`4096M4`、`8192M4`、`3G8`、`4G8`、`8G4` 等 | component configuration，按 depth * width 输出 `dram_density` 和 `dram_width`；`3G8 = 24Gb x8` |
| `V` | DDR3；由 `PE` 官方 decoder 样本和旧 FBGA Matrix / 第三方 DRAM 表交叉确认 |
| `Z` | DDR4 product code；作为内部 `dramTypeCode` token 用于分族解析速度 bin，公开只输出 `dram_type=DDR4`，不输出 raw product code |
| `Y` | DDR5；由官方 MPN decoder 的 `PRM2G8Y52KBFRZ-56B` 样例确认 |
| `U` / `T` / `G` | 旧表辅助映射为 DDR2 / DDR / LPDDR2 |
| `S*` / `PC` / `X` + mobile depth-width | Mobile DRAM；官方 mobile matrix 覆盖 `8M` ~ `8G` depth 与 `x16` / `x32` / `x64` / `x128` width，按 depth * width 输出 `dram_density` 和 `dram_width` |
| mobile design id `Y*` / `Z*` | `Z*` 可确认到 LPDDR4，`Y*` 在没有 speed token 时保守输出 `LPDDR`；若尾部 speed token 命中官方 LPDDR3/4/5 速度表，则由 speed table 收敛到具体 LPDDR 代际；`Y52P` 按官方 LPDDR5X addendum 输出 `LPDDR5X` |
| mobile `D1` / `D2` / `D3` / `D4` / `D6` / `D8` / `DA` / `DB` / `DD` / `DE` | 官方 die count 表，输出 `dram_die_count` |
| mobile `A` / `B` / `C` / `D` / `F` / `L` / `M` voltage token | 官方 mobile voltage 表，输出纯电压字段 |
| 尾部 package code | 仅作为内部解析 token；有官方 package 表命中时输出 `package`，不单独向用户展示 token；公开封装统一为 `TYPE[-PIN][, DIM][, SPECIAL]`，例如 `VFBGA-78/117, 7.5x11x1.0` 或 `FBGA`，不带 `mm` / `ball` / `pin` 单位词，且不输出 datasheet Rev 信息；缺 pin 时不补猜 |
| mobile package code | 官方 mobile package 表已接入唯一 code；`DS` / `FL` / `WT` 这类同 code 多封装项需先由 speed table / design id 判断 LPDDR profile，再输出对应 package；`NZ` 由 `Z00M/Z11M/Z1AM` 与 `Z11N/Z2BM` design ID 区分。公开 `package` 仍只保留 type-pin-dim，不输出 ball pitch、LPDDR 注记或 source notes |
| DDR3 `GD` voltage / refresh | `G` 输出 `1.5V`；`D` 输出 `speed_grade=Speed trimmed for performance`，不把 raw refresh code 暴露到 public fields |
| DDR5 `B8` / OC `PN` 等 voltage / refresh / feature token | 按官方 DDR5 / DDR5 OC addendum 输出纯电压，例如 `1.1V`、`1.25V`；OC trim 进入 `special_option`，不输出 raw code |
| `-023`、`-053`、`-062`、`-107`、`-125`、`-15E`、`-48B`、`-56B`、`-64B`、`-72B`、`-80B`、`-60P`、`-64P`、`-062E` 等 | JEDEC / Micron-style speed token，按已有 DRAM 速度术语输出 `dram_speed`；`80B = DDR5-8000 CL64`；mobile speed table 同时用于判断 LPDDR3/4/5 |
| component `TP` | SpecTek 官方 decoder 定义为 `95% tested`，作为有额外用户价值的 `speed_grade` 输出，不伪造 `dram_speed` |
| DDR3 `V:*` scoped speed | 覆盖 `187E/187/15E/15/125E/125/107/093`；例如 `15E` 输出 `DDR3-1333 CL9`，`15` 输出 `DDR3-1333 CL10`，`125` 输出 `DDR3-1600 CL11` |
| DDR4 `Z:*` scoped speed | 普通 DDR4 覆盖 `062Y/062E/068E/068/075E/075/083E/083/093F/093E/093/107E`；3DS DDR4 覆盖 `062H/068H/075H/083J/083H/093H`。`093F` 输出 `DDR4-2133 CL14`，`093` 输出 `DDR4-2133 CL16`，避免无 product-code scope 时把同一 token 误解到其他 DRAM family |
| mobile `BT` / `FT` / `MB` / `PG` / `UT` | 官方 speed grade / test bin，输出 `speed_grade` |
| mobile `A` / `B` special option | 官方 mobile special option，输出 `special_option` |

## 输出字段

- `dram_type`
- `dram_density`
- `dram_width`
- `dram_voltage`
- `package`
- `dram_die_count`
- `dram_speed`
- `speed_grade`
- `special_option`（用于 SpecTek/customer mark、mobile special option 等解释性信息；不输出 raw prefix code）

## 测试样例

- `PRA128M8V88AG8GQF`
- `PE010`
- `SU512M8V80A11ARH`
- `PE002`
- `PB001`
- `PRM2G8Y52KBFRZ-56B`
- `PRN1G8Y52KB8RZ-64B`
- `PRN4G8Y53AB8AT-64B`
- `PRM4G8Y53BB8AT-72B`
- `SNL2G8Y52KPNRZ-60P`
- `SNL2G8Y52KPNRZ-64P`
- `PRA512M8V80AG8RHF-15E`
- `PRN512M8V70SGDRAF-15E`
- `PRN256M8V79DG8GQF-15E`
- `PRN512M8V00HG8GQF-125`
- `SGG256M4V88AG8GFF-125E`
- `SMG128M8V88AG8GKF-15`
- `SGG64M16V88AG8GNF-187E`
- `SGG256M4V88AG8ZRF-187`
- `SGG512M4V69AG8GHF-107`
- `SGG128M16V69AG8GPF-093`
- `SMG128M16V69AG8GNF-15E`
- `PRN512M8Z80AD8GK-093F`
- `SGG1024M8Z80AD8JC-068`
- `PRN4096M4Z22AD8DVN-075H`
- `SUM8192M4Z22AD8CLU-083J`
- `PRM1G16Z22AD8KNR-107E`
- `PRN4G8Z22AD8BAF-062E`
- `PU001`
- `SM8G32Y52PDAFDV-UT`
- `SN512M32Z42MD1DNQ-053BT`
- `SM1G32Z11MD4DDT-062BTA`
- `SM1G32Z11MD4DDS-062BTA`
- `SM1G32Y11MD4BDS-023FTB`
- `SM1G32Z11MD4DNH-062BT`
- `SM1G32Z11MD4DFL-062BT`
- `SM1G32Y11MD4FFL-023FT`
- `SM1G32Z11MD4DWT-062BT`
- `SM1G32Y11MD4FWT-023FT`
- `SM1G32Z11MD4DNZ-062BT`
- `SM1G32Z11ND4DNZ-062BT`
- `PRN1G8V91AG8SN-107`
- `SCM3G8Z41BD8JF-062E`
- `SCM1G16Y62EB8HD-80B`
- `SCM1G16Y62EB8HD-TP`

## 注意

`PE` 是 SpecTek mark code 头，不是完整 PN 头。接入时优先把官方 mark decoder 的 PE 结果落入 `mdb.spectek`，再由 DRAM PN 规则解析返回的 marketing PN。`package_code`、`config_code` 等 token 只用于内部解析，不进入公开字段；只在官方 package 表命中时展示封装描述，且 `package` 字段不重复包含 DDR / LPDDR 代际信息。电压字段只保留电压值本身，不把 DDR 代际重复写进电压文本。
