# SpecTek DRAM PN 编码

采集日期：2026-05-14；更新日期：2026-08-27

## 外部资料

- SpecTek Laser Mark to Marketing Part Number Decoder: 官方 5 位标记编码到销售 PN 的查询入口。实测 `PE001` ~ `PE020` 返回 DRAM 芯片 PN，例如 `PE010` -> `PRA128M8V88AG8GQF`。
  <https://www.spectek.com/menus/mark_code.aspx>
- SpecTek Marketing Part Number Decoder: 官方 MPN 拆解入口，`DramComponent` 可确认 `PRN1G16Z22AD8RC-062E` 中 `Z = DDR4`，`PRM2G8Y52KBFRZ-56B` 中 `Y = DDR5`；`MobileDram` 可确认 `SN512M32Z42MD1DNQ-053BT` 为移动版 LPDDR4，`SM768M16Y2BMD1FDS` 这类 `Y*D*` 移动版结构只能保守归入 LPDDR 系列。
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=DramComponent>
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=MobileDram>
- SpecTek DRAM Component Part Numbering Guide: 官方 `SpecTek Components Part Number Matrix`，2024-07-09 版，覆盖芯片前缀、容量-位宽、内部标识、电压、刷新、速度档位、封装编码与 die 数表。
  `spectek-pns-components.pdf`
- SpecTek Mobile DRAM Part Numbering System: 官方移动版 DRAM PN 矩阵，2025-03-19 版，覆盖移动版前缀、深度/位宽、最高时钟频率、die 数、电压、完整封装编码表、速度等级与特殊选项。
  `spectek-pns-mobile-dram.pdf`
- 用户补充的 SpecTek DDR3 / DDR4 数据手册 / 补充资料截图覆盖 1Gb / 2Gb / 4Gb DDR3 芯片样例、4Gb / 8Gb / 16Gb 芯片 DDR4、16Gb / 32Gb x4 3DS DDR4、16Gb x16 TwinDie 单 Rank DDR4，以及 Micron 32Gb x4/x8 TwinDie DDR4 对应封装 / 速度表；本轮用于补齐 DDR3 `V:*` 限定范围的速度档位、`GD` 按速度校准的刷新选项、`GFF/GHF/GKF/GNF/GPF/GQF/GQL/RAF/ZRF` 封装，以及 DDR4 大容量配置、`Z` 产品编码限定范围的速度档位、3DS `H/J` 速度档位和 `GK` 封装。
- Micron SpecTek Buyers Guide: DRAM 页列出 `PRN` / `PRM`、`TP`、`PG` 等等级和样例 PN，并把 DRAM Component Part Numbering Guide、DRAM Component Mark Reference、Laser Mark to MPN Decoder 作为官方资料入口。
  <https://www.micron.com/content/dam/micron/global/public/spectek/buyers-guide/spectekbuyersguide.pdf>
- 2015 SpecTek Components FBGA Matrix 镜像: 覆盖 `PE008` ~ `PE012` 等 `PE` DRAM 标记编码到 PN 的对应关系，可用于交叉验证旧表。
  <https://pcper.com/wp-content/uploads/2013/06/8c06-fbgamark.pdf>
- Puris SpecTek DRAM/LPDDR 表: 第三方表格把 `PE001`、`PE002`、`PE003`、`PE004`、`PE006`、`PE007` 等标为 DDR3，用于辅助判断 `PE` 批次的 DRAM 类型；不作为唯一规则来源。
  <https://www.puris.net/archives/7244>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/spectek-dram-token.json`
- `vendor.spectek.mobile-dram.component.v1`
- `vendor.spectek.dram.component.v1`

MDB 标记编码:

- `packages/core/resources/mdb.json`
- `PE001` ~ `PE020` 已按官方解码器查询结果加入 `spectek` 丝印映射。
- `PB001`、`PP002`、`PU001` 已作为新 DRAM 系列回归样本加入 `spectek` 丝印映射；`PEB09`、`PE918`、`PE027` 等 DDR3 截图样本也在 `mdb.spectek` 中用于标记编码回查。
- `packages/fdbgen/src/mdb.ts` 的 `crawl-mdb` 默认仍运行 SpecTek 分段，SpecTek 抓取头部已加入 `PB`、`PE`、`PP`、`PU`，后续可用同一个入口补全更大范围。

## PN 结构

当前只接入 DRAM 芯片的稳定公共字段，不处理仅适用于模组的 结构。

| 结构 | 含义 |
| --- | --- |
| `PNL` / `PRA` / `PRN` / `PRM` / `SGG` / `SMG` / `SNL` / `SUM` / `SUU` / `SCD` / `SCM` / `SCT` / `SMC` / `SMD` / `SMM` / `SMU` / `XAA` / `XBA` / `XCB` / `XCBB` 前缀 | SpecTek DRAM 芯片标记 / 客户标记前缀；只输出官方解释到 `special_option`，不输出原始 `marking_code` 字段 |
| `128M8`、`256M16`、`512M8`、`1024M4`、`2048M8`、`4096M4`、`8192M4`、`3G8`、`4G8`、`8G4` 等 | 芯片配置，按深度 * 位宽输出 `dram_density` 和 `dram_width`；`3G8 = 24Gb x8` |
| `V` | DDR3；由 `PE` 官方解码器样本和旧 FBGA 矩阵 / 第三方 DRAM 表交叉确认 |
| `Z` | DDR4 产品编码；作为内部 `dramTypeCode` 编码段用于分族解析速度档位，公开只输出 `dram_type=DDR4`，不输出原始产品编码 |
| `Y` | DDR5；由官方 MPN 解码器的 `PRM2G8Y52KBFRZ-56B` 样例确认 |
| `U` / `T` / `G` | 旧表辅助映射为 DDR2 / DDR / LPDDR2 |
| `S*` / `PC` / `X` + 移动版深度-位宽 | 移动版 DRAM；官方移动版矩阵覆盖 `8M` ~ `8G` 深度与 `x16` / `x32` / `x64` / `x128` 位宽，按深度 * 位宽输出 `dram_density` 和 `dram_width` |
| 移动版设计 id `Y*` / `Z*` | `Z*` 可确认到 LPDDR4，`Y*` 在没有速度编码段时保守输出 `LPDDR`；若尾部速度编码段命中官方 LPDDR3/4/5 速度表，则由速度表收敛到具体 LPDDR 代际；`Y52P` 按官方 LPDDR5X 补充资料输出 `LPDDR5X` |
| 移动版 `D1` / `D2` / `D3` / `D4` / `D6` / `D8` / `DA` / `DB` / `DD` / `DE` | 官方 die 数表，输出 `dram_die_count` |
| 移动版 `A` / `B` / `C` / `D` / `F` / `L` / `M` 电压编码段 | 官方移动版电压表，输出纯电压字段 |
| 尾部封装编码 | 仅作为内部解析编码段；有官方封装表命中时输出 `package`，不单独向用户展示编码段；公开封装统一为 `TYPE[-PIN][, DIM][, SPECIAL]`，例如 `VFBGA-78/117, 7.5x11x1.0` 或 `FBGA`，不带 `mm` / `ball` / `pin` 单位词，且不输出数据手册 Rev 信息；缺引脚时不补猜 |
| 移动版封装编码 | 官方移动版封装表已接入唯一编码；`DS` / `FL` / `WT` 这类同编码多封装项需先由速度表 / 设计 id 判断 LPDDR 规格，再输出对应封装；`NZ` 由 `Z00M/Z11M/Z1AM` 与 `Z11N/Z2BM` 设计 ID 区分。公开 `package` 仍只保留类型-引脚-尺寸，不输出球间距、LPDDR 注记或来源说明 |
| DDR3 `GD` 电压 / 刷新 | `G` 输出 `1.5V`；`D` 输出 `speed_grade=Speed trimmed for performance`，不把原始刷新编码暴露到公开字段 |
| DDR5 `B8` / OC `PN` 等电压 / 刷新 / 特性编码段 | 按官方 DDR5 / DDR5 OC 补充资料输出纯电压，例如 `1.1V`、`1.25V`；OC 校准进入 `special_option`，不输出原始编码 |
| `-023`、`-053`、`-062`、`-107`、`-125`、`-15E`、`-48B`、`-56B`、`-64B`、`-72B`、`-80B`、`-60P`、`-64P`、`-062E` 等 | JEDEC / Micron-形式速度编码段，按已有 DRAM 速度术语输出 `dram_speed`；`80B = DDR5-8000 CL64`；移动版速度表同时用于判断 LPDDR3/4/5 |
| 芯片 `TP` | SpecTek 官方解码器定义为 `95% tested`，作为有额外用户价值的 `speed_grade` 输出，不伪造 `dram_speed` |
| DDR3 `V:*` 限定范围的速度 | 覆盖 `187E/187/15E/15/125E/125/107/093`；例如 `15E` 输出 `DDR3-1333 CL9`，`15` 输出 `DDR3-1333 CL10`，`125` 输出 `DDR3-1600 CL11` |
| DDR4 `Z:*` 限定范围的速度 | 普通 DDR4 覆盖 `062Y/062E/068E/068/075E/075/083E/083/093F/093E/093/107E`；3DS DDR4 覆盖 `062H/068H/075H/083J/083H/093H`。`093F` 输出 `DDR4-2133 CL14`，`093` 输出 `DDR4-2133 CL16`，避免无产品编码范围时把同一编码段误解到其他 DRAM 系列 |
| 移动版 `BT` / `FT` / `MB` / `PG` / `UT` | 官方速度等级 / 测试档位，输出 `speed_grade` |
| 移动版 `A` / `B` 特殊选项 | 官方移动版特殊选项，输出 `special_option` |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
- `special_option`（用于 SpecTek/客户标记、移动版特殊选项等解释性信息；不输出原始前缀编码）

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

`PE` 是 SpecTek 标记编码头，不是完整 PN 头。接入时优先把官方标记解码器的 PE 结果落入 `mdb.spectek`，再由 DRAM PN 规则解析返回的销售 PN。`package_code`、`config_code` 等编码段只用于内部解析，不进入公开字段；只在官方封装表命中时展示封装描述，且 `package` 字段不重复包含 DDR / LPDDR 代际信息。电压字段只保留电压值本身，不把 DDR 代际重复写进电压文本。

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-08-27 覆盖审计引用的补充来源：<https://in.micron.com/sales-support/customer-support/spectek-support>。
