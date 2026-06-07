# SK hynix NAND PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix raw NAND 与 E2NAND 料号在现有规则库中的覆盖范围。eMMC / UFS managed NAND 已拆分到独立文档：

- [SK hynix eMMC / e-NAND](skhynix_emmc.md)
- [SK hynix UFS](skhynix_ufs.md)
- [SK hynix eMCP / uMCP](skhynix_emcp.md)

## 来源

- SK hynix Newsroom 说明 4D NAND 的技术路线：96-layer 4D NAND 基于 CTF + PUC，后续覆盖 128-layer、176-layer、238-layer 和 321-layer 产品。
  <https://news.skhynix.com/sk-hynix-inc-launches-the-worlds-first-ctf-based-4d-nand-flash-96-layer-512gb-tlc/>
  <https://news.skhynix.com/sk-hynix-starts-mass-producing-worlds-first-128-layer-4d-nand/>
  <https://news.skhynix.com/sk-hynix-unveils-the-industrys-highest-layer-176-layer-4d-nand-flash/>
  <https://news.skhynix.com/sk-hynix-develops-worlds-highest-238-layer-4d-nand-flash/>
  <https://news.skhynix.com/begin-supply-321-layer-qlc-nand-cssd/>
- TechInsights 摘要确认 `H25T2TB88E` 内含 H25FTB0 128L NAND；`H25T2TC88C` 是 176L NAND；`H25T1TC48C` package 内含 4 个 H25FTC0 512Gb 176L TLC die；`H25T1TD48C-X630` package 内含 4 个 H25FTD0 238L 512Gb TLC die；`H25T2TD88C-X682` 属于 PC811 V8 NAND package。
  <https://www.techinsights.com/products/mfr-2008-805>
  <https://www.techinsights.com/products/ame-2206-801>
  <https://www.techinsights.com/products/iwo-2206-801>
  <https://www.techinsights.com/blog/sk-hynix-h25ftd0-238l-512-gb-tlc-3d-nand-internal-waveform-analysis>
  <https://www.techinsights.com/blog/sk-hynix-h25ftd0-238l-512-gb-tlc-3d-nand-advanced-memory-process-analysis>
- TechPowerUp SSD database 给出 `H25T2TB88E-X259` 和 `H25T2TD88C-X682` 的封装容量、die 数与 die 容量，可用于校准 H25T package density。
  <https://www.techpowerup.com/ssd-specs/sk-hynix-gold-p31-1-tb.d444>
  <https://www.techpowerup.com/ssd-specs/sk-hynix-platinum-p51-1-tb.d1967>
- flashinfo.top、Wuyou、SSD dump 与分销页面用于低一档外部交叉验证；这类来源不等同原厂资料，但可与本地 fdb/fdfdb 共同标注 `external_table_confirmed`。
  <https://flashinfo.top/>
  <https://bbs.wuyou.net/forum.php?extra=&mod=viewthread&tid=449091>
  <https://hisubway.online/blog/ssd/>
  <https://www.puris.net/dir/product/flash/rawnand>
- 本地资料：`packages/core/resources/fdb.json`、`../fdfdb/smssd/2259XT3_Y1226.SET`、`../fdfdb/smssd/2259XT2_Y0321.SET`、`../fdfdb/smufd/flash_3281BB.dbf`、`../fdfdb/smff/ForceFlash-W1116.SET`、`../fdfdb/ma/mas1102_16.ini` 中的 H25 PN、Flash ID、容量、Vx/MLC/TLC/QLC 标签。
- 维护者补充的 SK hynix 3D NAND 表记录 `HYV2` 到 `HYV8` 的层数、cell、die 容量、Toggle 接口与 die marking。`H25FT*` / `H27*` 属于 die marking，只进入 `die_mark`；固件匹配仍使用 `HYVx` / `HYVxQ` / `HYVxM` 这类 profile key。
- SK hynix NAND Flash catalog mirror 列出 SLC/MLC/TLC/eMMC/E2NAND3.0/SSD 分类，其中 E2NAND3.0 页面使用 `PRODUCT` / `BLOCK SIZE` 维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/nand-flash/34497-603624.html>
- `H27UCG8T2E` datasheet mirror 标注 64Gb (8192M x 8bit) MLC NAND，作为 H27 raw NAND 资料参考。
  <https://app2.alldatasheet.com/datasheet-pdf/pdf/1425049/HYNIX/H27UCG8T2E.html>
- `H2JTDG8UD1BMS` datasheet mirror 的 E2NAND3.0 表列出 H2JTC/H2JTD/H2JTE/H2JTF/H2JTV/H2JT1T 系列、容量、block size、stack、Vcc/Org 与 WLGA 封装。
  <https://www.alldatasheet.co.nz/html-pdf/1425105/HYNIX/H2JTDG8UD1BMS/741/4/H2JTDG8UD1BMS.html>
- SK hynix NAND Flash Databook Q1'2016 mirror 给出 E2NAND3.0 与 E3NAND line-up：H2J/H23Q 系列、density、4MB block、stack、Vcc/Org、WLGA 与 EMI / Non Shielded remark。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>
- USBDev flash list 与 Flash Extractor 论坛对 H2D/H2J PN 给出 E2NAND / E2NAND2.0 / E2NAND3.0 标签，可作为 `external_table_confirmed` 级别交叉验证。
  <https://www.usbdev.ru/databases/flashlist/flflash3267abdbf/>
  <https://www.flash-extractor.com/forum/viewtopic.php?t=7399>

## 置信度与准入

规则库不做完整 PN 白名单匹配，只解析结构 token。每个 token 组合按外部佐证状态分三档：

| 状态 | 含义 | 处理 |
| --- | --- | --- |
| `external_confirmed` | 原厂、TechInsights、TechPowerUp 等拆解/规格资料直接确认 PN、层数、die 或 package 容量 | 可作为确定规则与 testcase |
| `external_table_confirmed` | flashinfo.top、论坛 flash-id 表、SSD dump、分销页面等外部网页与本地 fdb/fdfdb 同向 | 可进规则，但只在 iTXTech fdnext DecodePack `tables.reference` 内标明来源档位，不输出到 `fields` |
| `local_pending_external_reference` | 仅本地 fdb/fdfdb 或 MPTool 数据，暂未找到外部网页 | 不删除候选，只在 iTXTech fdnext DecodePack 内部 metadata 标记；不作为“已确定”结论 |

单个 MPTool / fdfdb 条目可能乱写，不能单独提升为确定结论；至少需要本地多源一致或外部网页交叉确认。

## 规则入口

- 新式 raw NAND：`packages/core/src/decodepack/rules/packs/skhynix-raw-token.json`
  - 规则 ID：`vendor.skhynix.token.v1`
- legacy raw NAND：`packages/core/src/decodepack/rules/packs/skhynix-legacy-token.json`
  - 规则 ID：`vendor.skhynix.legacy.token.v1`
- H25 NAND package / token：`packages/core/src/decodepack/rules/packs/skhynix-h25-token.json`
  - 规则 ID：`vendor.skhynix.h25.gt-package.v2`
  - 规则 ID：`vendor.skhynix.h25.raw.v2`
- E2NAND：`packages/core/src/decodepack/rules/packs/skhynix-e2nand-token.json`
  - 规则 ID：`vendor.skhynix.e2nand.h2d_h2j.v1`
  - 规则 ID：`vendor.skhynix.e3nand.h23q.v1`

## 覆盖范围

| 前缀 / 结构 | 规则 | 说明 |
| --- | --- | --- |
| `HY27...` | legacy raw NAND | 旧式 Hynix/SK hynix NAND PN |
| `H2DT...` / `H2JT...` | E2NAND | H2D E2NAND2.0 与 H2J E2NAND3.0，按结构 token 分类 |
| `H23Q...` | E3NAND | E3NAND managed NAND，按 density/config/package token 分类 |
| `H2...` | raw NAND | 新式 SK hynix raw NAND PN；不覆盖 H2D/H2J E2NAND 结构 |
| `H27...` | raw NAND | 既有 H27 raw NAND 路径覆盖 |
| `H25T...` / `H25G...` | H25T/G NAND package | H25T/H25G 开头的 SSD/mobile NAND package 型号，按 token 组合推断 V6/V7/V8/V9Q |
| `H25(非 T)...` | H25 3D/4D raw NAND token | 按 voltage/cell/density/stack/config/generation token 推断 MLC/TLC/QLC 与代际 |
| `H26...` | 不属于 raw NAND 文档 | 已由 eMMC / e-NAND 文档覆盖 |
| `HN8...` / `H28S...` | 不属于 raw NAND 文档 | 已由 UFS 文档覆盖 |
| `H9...` | 不属于 raw NAND 文档 | 已由 eMCP / uMCP 文档覆盖 |

## HY27 legacy raw NAND

| PN 结构 | 字段 |
| --- | --- |
| `HY27` + voltage + topology + width(2) + density(2) + mode + generation + reserved + package + optional tail | legacy raw NAND |
| voltage `U/L/S/J/Q/T` | 电压 / VccQ 组合 |
| topology | cell level 与 die count |
| width `08/16/32` | device width |
| density | 64Mb 到 4Tb，按规则表映射 |
| mode | CE / RB / channel |
| generation | generation code |
| package | TSOP / WSOP / FBGA / LGA / wafer / KGD 等 |
| optional tail | package material、operation temperature、bad block policy |

## H2 raw NAND

| PN 结构 | 字段 |
| --- | --- |
| `H2` + model(3) + voltage + density(2) + width + topology + mode + generation + package + material + variety + bad block + op temp | raw NAND |
| voltage `U/L/S/J/Q/T` | 电压 / VccQ 组合 |
| density | 64Mb 到 4Tb，按规则表映射 |
| width `8/6/L/I/D` | x8 / x16 等 |
| topology | cell level 与 die count |
| mode | CE / RB / channel |
| generation | generation code |
| package | TSOP / FBGA / WLGA / BGA 等 |
| package material `P/R/L/A` | lead-free / halogen-free / wafer 等 |
| bad block `B/S/P` | bad block policy |
| op temp `C/E/M/I` | commercial / extended / mobile / industrial |

## H2D / H2J E2NAND

H2D / H2J 系列不是通用 raw NAND fallback。公开 catalog mirror 与 USBDev/Flash Extractor 外部表均把相关 PN 标为 E2NAND，其中 `H2D...` 对应 E2NAND2.0，`H2J...` 对应 E2NAND3.0。规则只按结构 token 解析，不枚举完整 PN。

| PN 结构 | 字段 |
| --- | --- |
| `H2` + series + product + density(2) + config(3) + tech + package(3) + optional suffix | H2D/H2J E2NAND |
| series `D/J` | `D` -> E2NAND2.0；`J` -> E2NAND3.0 |
| density `CG/DF/DG/EG/FG/VG/1T` | 64Gb / 64Gb / 128Gb / 256Gb / 512Gb / 768Gb / 1Tb |
| config `8T2/8UD/8VD/8YD/8PD/8QD` | stack 与 die density 组合；公开输出 die_count / die_density，不输出 config code 或 die_stack |
| tech | 与 series 组合判断 die profile，例如 `D:1` -> `HY26`，`J:1` -> `HY16M`，`J:2` -> `HY20` |
| package | H2D 输出 VLGA；H2J 输出 WLGA；原始 package code 只作为内部解析 token |
| package suffix `R/S` | Non Shielded / EMI Shielded，输出到 `special_option` |

| 示例 | 输出重点 | 佐证状态 |
| --- | --- | --- |
| `H2DTDG8UD1MYR` | E2NAND2.0, 128Gb, x8, MLC, VLGA, 2MB block | `external_table_confirmed` |
| `H2JTDG8UD1BMS` | E2NAND3.0, 128Gb, x8, MLC, WLGA, 4MB block, 2-die, EMI Shielded | `external_table_confirmed` |
| `H2JT1T8QD1MMR` | E2NAND3.0, 1024Gb, x8, MLC, WLGA, 4MB block, 8-die, Non Shielded | `external_table_confirmed` |

## H23Q E3NAND

H23Q 系列按 Q1'2016 databook line-up 进入 managed NAND，不归入 raw NAND fallback。规则只解析 density、config、package/shielding 这些结构 token，不维护完整 PN 白名单。

| PN 结构 | 字段 |
| --- | --- |
| `H23Q` + density(1/2) + config(3/4) + tech(1) + package(3) | H23Q E3NAND |
| density `D/E/F/1T` | 128Gb / 256Gb / 512Gb / 1024Gb |
| config `G8UD/G8VG/G8YK/G8PG/8QK` | stack 与 die density 组合；公开输出 die_count / die_density，不输出 die_stack |
| tech `1` | 1ynm E3NAND |
| package | WLGA |
| package suffix `R/S` | Non Shielded / EMI Shielded，输出到 `special_option` |

| 示例 | 输出重点 | 佐证状态 |
| --- | --- | --- |
| `H23QDG8UD1ACS` | E3NAND, 128Gb, x8, WLGA, 4MB block, 2-die, EMI Shielded | `external_table_confirmed` |
| `H23Q1T8QK1MYR` | E3NAND, 1024Gb, x8, WLGA, 4MB block, 8-die, Non Shielded | `external_table_confirmed` |

除 `H23Q` E3NAND 外，其他 `H23` 结构仍不使用 unsupported fallback；有效 `H26M/H26T` 由 eMMC/e-NAND 文档和规则覆盖。

## H25 NAND package / token

H25 目前分成两类结构处理：

1. `H25T...` / `H25G...`：较新的 NAND package 标识，常见于 SSD 拆解、SSD database 和 flash-id 表。规则按 `capacity + cell + generation + geometry + width + voltage + optional package` 解析，不按完整 PN 白名单匹配。
2. `H25(非 T)...`：raw NAND token 结构，按 `voltage + cell + layout + density + stack + config + generation` 解析。第 4 位是 operating voltage code，不参与 `HYVx` profile 判断；没有外部 reference 的 token 不删除，只标记待确认。

规则输出只保留结构字段，例如 `density`、`cell_level`、`die_codename`、`process_alias` 和 `die_count`。3D / 4D、层数、die 容量与 Toggle 接口属于 `nand.die_profile` 统一维护的信息，不在 H25 规则内重复组装公开 `generation_info` 文案。

### 3D / 4D die profile 补充

`H25FT*`、`H25G*` 和 `H27*` 是 die marking，不作为 firmware match。`nand.die_profile` 中 firmware 匹配继续保持 `HYVx`，die 标识只追加到 `die_mark`。

| Profile | 代际 | Cell | 层数 | Die 容量 | 接口 | Die marking |
| --- | --- | --- | --- | --- | --- | --- |
| `HYV2` | 3D V2 | MLC | 36 | 128Gb | Toggle 2.0 / 400MT/s | `H27DGS8` |
| `HYV3M` | 3D V3 | MLC | 48 | 64Gb | Toggle 2.0 / 400MT/s | - |
| `HYV3` | 3D V3 | TLC | 48 | 128Gb / 256Gb | Toggle 2.0 / 400MT/s | `H27DGLG`, `H27EGLM` |
| `HYV4M` | 3D V4 | MLC | 76 | 256Gb | Toggle 2.0 / 800MT/s | `H25EMB0` |
| `HYV4` | 3D V4 | TLC | 72 | 256Gb / 512Gb | Toggle 2.0 / 800MT/s | `H27EGLM_72L`, `H25FT4MA0` |
| `HYV5` | 4D V5 | TLC | 96 | 512Gb | Toggle 3.0 / 1200MT/s | `H25FT4MMI` |
| `HYV5Q` | 4D V5 | QLC | 96 | 1Tb | Toggle 3.0 / 800MT/s | `H25GQM0` |
| `HYV6` | 4D V6 | TLC | 128 | 512Gb / 1Tb | Toggle 4.0 / 1400MT/s | `H25FTB0`, `H25GTM0` |
| `HYV6Q` | 4D V6 | QLC | 128 | 1Tb | Toggle 4.0 / 1400MT/s | - |
| `HYV7` | 4D V7 | TLC | 176 | 512Gb | Toggle 4.0 / 1600MT/s | `H25FTC0` |
| `HYV7Q` | 4D V7 | QLC | 176 | 1Tb | Toggle 4.0 / 1600MT/s | `H25GQA0` |
| `HYV8` | 4D V8 | TLC | 238 | 512Gb / 1Tb | Toggle 5.0 / 2400MT/s | `H25FTD0` |
| `HYV8Q` | 4D V8 | QLC | 238 | 1Tb | Toggle 5.0 / 2400MT/s | - |
| `HYV9` | 4D V9 | TLC | 321 | 1Tb | 见具体 package 表 | - |
| `HYV9H` | 4D V9H | TLC | 321 | 1Tb | 3600MT/s | `G-Die` |
| `HYV9Q` | 4D V9 | QLC | 321 | 2Tb | 3200MT/s | `M-Die` |

`HYV6` 的公开 die density 需要按 die marking 区分：`H25FTB0` 为 512Gb，`H25GTM0` 为 1Tb。共享 `nand.die_profile` 只保留 `HYV6` 的层数、cell 与接口信息，H25T/G package 规则按 package density / die count 计算并输出 die density。

`HY14` 表示旧 2D 14nm profile，公开制程仍显示为 `14nm`。SK hynix Flash ID 中 `E0` 不能单独判作 HY14；当已解析 die size 为 1Tb 级且 cell 为 TLC 时，`E*` die code 归入 `HYV9`。

### H25T / H25G NAND package

| PN 结构 | 字段 |
| --- | --- |
| `H25` + capacity(2) + cell(1) + generation(1) + geometry(1) + width(1) + voltage(1) + optional package tail | SK hynix NAND package |
| capacity `G9/T0/T1/T2/T3/T4/T5` | 64GB / 128GB / 256GB / 512GB / 1TB / 2TB / 4TB package density |
| cell `T/Q` | TLC / QLC |
| generation | 结合 cell 与计算出的 die density 判断 `HYVx`，不能全局写死 `M/B/C/D/E` |
| geometry `1/2/4/8/G` | 1 / 2 / 4 / 8 / 16 die；CE/RB/channel 由该 token 和 package code 共同决定 |
| width `8` | x8 |
| voltage `C` | `Vcc 2.5V / VccQ 1.2V`；`E` 等未确认 token 不输出 public voltage |

公开结果中，H25T / H25G package 容量统一放在 `density`，不再重复输出 `component_density`；die density 由 package density / die count 计算，已知 package 堆叠使用数值 `die_count` / `ce_count`，不再输出字符串 `die_stack`。

| 结构 key / 示例 | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `T2:T:B:8:8:E` / `H25T2TB88E-*` | `HYV6` / `H25FTB0`, TLC, 128L profile, 512GB package, 8 x 512Gb die；`E` 电压不输出 | `external_confirmed` |
| `G9:T:C:1:8:C` / `H25G9TC18CX488` | `HYV7` / `H25FTC0`, TLC, 176L profile, 64GB package, 1 x 512Gb die | `external_table_confirmed` |
| `T2:T:C:8:8:C` / `H25T2TC88C-*` | `HYV7` / `H25FTC0`, TLC, 176L profile, 512GB package, 8 x 512Gb die | `external_confirmed` |
| `T3:T:C:G:8:C` / `H25T3TCG8C` | `HYV7` / `H25FTC0`, TLC, 176L profile, 1TB package, 16 x 512Gb die, 4 CE | `external_table_confirmed` |
| `G9:T:D:1:8:C` / `H25G9TD18CX576` | `HYV8` / `H25FTD0`, TLC, 238L profile, 64GB package, 1 x 512Gb die | `external_table_confirmed` |
| `T2:T:D:8:8:C` / `H25T2TD88C-*` | `HYV8` / `H25FTD0`, TLC, 238L profile, 512GB package, 8 x 512Gb die | `external_confirmed` |
| `T4:T:M:G:8:C` / `H25T4TMG8C` | `HYV6` / `H25GTM0`, TLC, 128L profile, 2TB package, 16 x 1Tb die, 4 CE | `local_pending_external_reference` |
| `T0:Q:A:1:8:C` / `H25T0QA18CX542` | `HYV7Q`, QLC, 176L profile, 128GB package, 1 x 1Tb die | `local_pending_external_reference` |
| `T3:Q:A:8:8:C` / `H25T3QA88CX548` | `HYV7Q`, QLC, 176L profile, 1TB package, 8 x 1Tb die | `external_table_confirmed` |
| `T4:Q:M:8:8:G` / `H25T4QM88G` | `HYV9Q`, QLC, 321L 2Tb M-Die profile, 2TB package, 8 x 2Tb die, 6-plane, 3200MT/s；`G` 电压不输出 | `external_confirmed` |

维护者补充的 HYV9 package 表给出 128GB die 与 `D18/D28/D48/D88/DG8` 结构。`00h` Address ID 按每个 CE 的 stack 选择：SDP = `AD89284B00E0`，DDP = `AD89294B00E0`，QDP = `AD892A4B00E0`。Package 表中的 `T` 是厚度，公开 `package` 统一写成 `x1.0mm` / `x1.35mm` / `x1.5mm`；电压按表格写入 `Vcc: 2.5V, VccQ: 1.2V`，避免仅依赖 token 推测。

H25 的 X package tail 进入 FDB 时保留完整尾缀并去掉分隔符；带 `-X...` 分隔的输入统一归一为无分隔的 canonical PN。

| PN | ID | 可确定内容 |
| --- | --- | --- |
| `H25T0TD18CX655` | `AD89284B00E0` | `HYV9`, 128GB package, 1 x 1Tb die, 1 CE / 1 R/B, 152-ball BGA 14x18x1.0mm |
| `H25T1TD28CX656` | `AD89284B00E0` | `HYV9`, 256GB package, 2 x 1Tb die, 2 CE / 2 R/B, 152-ball BGA 14x18x1.0mm |
| `H25T2TD48CX657` | `AD89284B00E0` | `HYV9`, 512GB package, 4 x 1Tb die, 4 CE / 4 R/B, 152-ball BGA 14x18x1.0mm |
| `H25T3TD88CX676` | `AD89294B00E0` | `HYV9`, 1TB package, 8 x 1Tb die, 4 CE / 4 R/B, 152-ball BGA 14x18x1.35mm |
| `H25T3TD88CX658` | `AD89294B00E0` | `HYV9`, 1TB package, 8 x 1Tb die, 4 CE / 4 R/B, 152-ball BGA 14x18x1.35mm |
| `H25T4TDG8CX658` | `AD892A4B00E0` | `HYV9`, 2TB package, 16 x 1Tb die, 4 CE / 4 R/B, 152-ball BGA 14x18x1.35mm |
| `H25T2TD48CX659` | `AD89284B00E0` | `HYV9`, 512GB package, 4 x 1Tb die, 4 CE / 4 R/B, 316-ball BGA 14x18x1.0mm |
| `H25T3TD88CX660` | `AD89294B00E0` | `HYV9`, 1TB package, 8 x 1Tb die, 4 CE / 4 R/B, 316-ball BGA 14x18x1.35mm |
| `H25T4TDG8CX660` | `AD892A4B00E0` | `HYV9`, 2TB package, 16 x 1Tb die, 4 CE / 4 R/B, 316-ball BGA 14x18x1.35mm |
| `H25T2TD48CX862` | `AD89284B00E0` | `HYV9`, 512GB package, 4 x 1Tb die, 4 CE / 4 R/B, 154-ball BGA 11.5x13.5x1.0mm |
| `H25T3TD88CX860` | `AD89294B00E0` | `HYV9`, 1TB package, 8 x 1Tb die, 4 CE / 4 R/B, 154-ball BGA 11.5x13.5x1.35mm |
| `H25T0TD18CX826` | `AD89284B00E0` | `HYV9`, 128GB package, 1 x 1Tb die, 1 CE / 1 R/B, 154-ball BGA 11.5x13.5x1.0mm |
| `H25T1TD28CX828` | `AD89284B00E0` | `HYV9`, 256GB package, 2 x 1Tb die, 2 CE / 2 R/B, 154-ball BGA 11.5x13.5x1.0mm |
| `H25T2TD48CX809` | `AD89284B00E0` | `HYV9`, 512GB package, 4 x 1Tb die, 4 CE / 4 R/B, 154-ball BGA 11.5x13.5x1.0mm |
| `H25T3TD88CX811` | `AD89294B00E0` | `HYV9`, 1TB package, 8 x 1Tb die, 4 CE / 4 R/B, 154-ball BGA 11.5x13.5x1.35mm |
| `H25T4TDG8CX813` | `AD892A4B00E0` | `HYV9`, 2TB package, 16 x 1Tb die, 4 CE / 4 R/B, 154-ball BGA 11.5x13.5x1.5mm |

维护者补充的 V9Q package 表确认 2Tb QLC M-Die，321L，6-plane；die speed 以 3200MT/s 为准，旧 3360MT/s 记法不再使用。`X830` 是 IF-Chip 变体，speed 为 2280MT/s。

| PN | ID | 可确定内容 |
| --- | --- | --- |
| `H25T3QM48GX817` | `AD780C5B30E0` | `HYV9Q`, 1TB package, 4 x 2Tb die, 4 CE / 4 R/B, 4 channel, 316-ball BGA 14x18x1.0mm, Client, 3200MT/s |
| `H25T4QM88GX819` | `AD780D5B30E0` | `HYV9Q`, 2TB package, 8 x 2Tb die, 4 CE / 4 R/B, 4 channel, 316-ball BGA 14x18x1.35mm, Client, 3200MT/s |
| `H25T5QMG8GX819` | `AD780E5B30E0` | `HYV9Q`, 4TB package, 16 x 2Tb die, 4 CE / 4 R/B, 4 channel, 316-ball BGA 14x18x1.35mm, Client, 3200MT/s |
| `H25T1QM18GX834` | `AD780C5B30E0` | `HYV9Q`, 256GB package, 1 x 2Tb die, 1 CE / 1 R/B, 2 channel, 154-ball BGA 11.5x13.5x1.0mm, Enterprise, 3200MT/s |
| `H25T2QM28GX836` | `AD780C5B30E0` | `HYV9Q`, 512GB package, 2 x 2Tb die, 2 CE / 2 R/B, 2 channel, 154-ball BGA 11.5x13.5x1.0mm, Enterprise, 3200MT/s |
| `H25T3QM48GX822` | `AD780C5B30E0` | `HYV9Q`, 1TB package, 4 x 2Tb die, 4 CE / 4 R/B, 2 channel, 154-ball BGA 11.5x13.5x1.0mm, Enterprise, 3200MT/s |
| `H25T4QM88GX824` | `AD780D5B30E0` | `HYV9Q`, 2TB package, 8 x 2Tb die, 4 CE / 4 R/B, 2 channel, 154-ball BGA 11.5x13.5x1.35mm, Enterprise, 3200MT/s |
| `H25T5QMG8GX830` | `AD780E5B30E0` | `HYV9Q`, 4TB package, 16 x 2Tb die, 4 CE / 4 R/B, 2 channel, 154-ball BGA 11.5x13.5x1.7mm, Enterprise, 2280MT/s, IF-Chip |

### H25 raw NAND token

| PN 结构 | 字段 |
| --- | --- |
| `H25` + voltage(1) + die density(1) + cell(1) + width/layout(1) + die count(1) + configuration(1) + generation(1) + tail | SK hynix H25 raw NAND token |
| voltage `Q/B/J` | operating voltage code；`Q` = Vcc 3.30V, VccQ 1.80V；`B` = Vcc 3.30V or 2.50V, VccQ 1.80V or 1.20V；`J` = Vcc 3.30V or 2.50V, VccQ 1.20V |
| die density `E/F/G` | 32GB / 64GB / 128GB die，即 256Gb / 512Gb / 1Tb die density |
| cell `M/T/Q` | MLC / TLC / QLC |
| width/layout `8/M` | x8；该 token 只用于结构解析，不输出原始 code |
| die count `A/B/D/F/G` | 1 / 2 / 4 / 8 / 16 die |
| configuration `1/3/4/5/6/A/B` | CE / R/B / channel 组合；表内 I/O 即公开输出中的 channel，`A` 额外表示 IF Chip |
| generation | 结合 cell + die density 判断 `HYVx` profile；第 4 位 voltage 不参与 profile 映射，不能只按 generation 全局映射 |

H25 raw package density 由 die density x die count 计算；公开结果中输出 `density`、`die_density`、`die_count`、`ce_count`、`rb_count`、`channel_count` 和 `voltage`，不输出 voltage / die density / configuration / generation code 等内部 token。

已进入 profile 映射的 generation key：

| key | profile |
| --- | --- |
| `M:E:B` | `HYV4M`, MLC 256Gb, 3D V4 76L |
| `T:F:A` | `HYV4`, TLC 512Gb, 3D V4 72L |
| `T:F:M` | `HYV5`, TLC 512Gb, 4D V5 96L |
| `T:F:B` | `HYV6`, TLC 512Gb, 4D V6 128L |
| `T:G:A` | `HYV5`, TLC 1Tb, 4D V5 96L |
| `T:G:M` | `HYV6`, TLC 1Tb, 4D V6 128L |
| `Q:G:M` | `HYV5Q`, QLC 1Tb, 4D V5 96L |

| 示例 PN / token | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `H25QEM8A1B` / `Q:E:M:M:A:1:B` | `HYV4M`, MLC, 32GB package, 1 x 256Gb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25QFT8A1A` / `Q:F:T:8:A:1:A` | `HYV4`, TLC, 64GB package, 1 x 512Gb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25QFT8B3A` / `Q:F:T:8:B:3:A` | `HYV4`, TLC, 128GB package, 2 x 512Gb die, 2 CE / 2 R/B / 2 channel | `external_table_confirmed` |
| `H25QFT8D4A` / `Q:F:T:8:D:4:A` | `HYV4`, TLC, 256GB package, 4 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFT8F4A` / `Q:F:T:8:F:4:A` | `HYV4`, TLC, 512GB package, 8 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFT8F6A` / `Q:F:T:8:F:6:A` | `HYV4`, TLC, 512GB package, 8 x 512Gb die, 8 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFT8G4A` / `Q:F:T:8:G:4:A` | `HYV4`, TLC, 1TB package, 16 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFTMA1A` / `Q:F:T:M:A:1:A` | `HYV4`, TLC, 64GB package, 1 x 512Gb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25QFTMB3A` / `Q:F:T:M:B:3:A` | `HYV4`, TLC, 128GB package, 2 x 512Gb die, 2 CE / 2 R/B / 2 channel | `external_table_confirmed` |
| `H25QFTMD4A` / `Q:F:T:M:D:4:A` | `HYV4`, TLC, 256GB package, 4 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFTMF4A` / `Q:F:T:M:F:4:A` | `HYV4`, TLC, 512GB package, 8 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFTMF6A` / `Q:F:T:M:F:6:A` | `HYV4`, TLC, 512GB package, 8 x 512Gb die, 8 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25QFTMG4A` / `Q:F:T:M:G:4:A` | `HYV4`, TLC, 1TB package, 16 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25BFT8A1M` / `B:F:T:8:A:1:M` | `HYV5`, TLC, 64GB package, 1 x 512Gb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25BFT8A1B` / `B:F:T:8:A:1:B` | `HYV6`, TLC, 64GB package, 1 x 512Gb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25BFT8B3M` / `B:F:T:8:B:3:M` | `HYV5`, TLC, 128GB package, 2 x 512Gb die, 2 CE / 2 R/B / 2 channel | `external_table_confirmed` |
| `H25BFT8D4M` / `B:F:T:8:D:4:M` | `HYV5`, TLC, 256GB package, 4 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25BFT8F4M` / `B:F:T:8:F:4:M` | `HYV5`, TLC, 512GB package, 8 x 512Gb die, 4 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25BFT8F6M` / `B:F:T:8:F:6:M` | `HYV5`, TLC, 512GB package, 8 x 512Gb die, 8 CE / 4 R/B / 2 channel | `external_table_confirmed` |
| `H25JGT8A1A` / `J:G:T:8:A:1:A` | `HYV5`, TLC, 128GB package, 1 x 1Tb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25JGT8A1M` / `J:G:T:8:A:1:M` | `HYV6`, TLC, 128GB package, 1 x 1Tb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |
| `H25JGT8B3M` / `J:G:T:8:B:3:M` | `HYV6`, TLC, 256GB package, 2 x 1Tb die, 2 CE / 2 R/B / 2 channel | `external_table_confirmed` |
| `H25JGQ8A1M` / `J:G:Q:8:A:1:M` | `HYV5Q`, QLC, 128GB package, 1 x 1Tb die, 1 CE / 1 R/B / 1 channel | `external_table_confirmed` |

当前未进入 profile 映射的候选，例如 `B:F:T:8:A:1:Z` 这类 generation 组合，仍可按结构输出容量、die density、die count、CE/R/B/channel；但在 profile 未确认前不输出 `HYVx`。

## 已知缺口

- H25T/G package tail 仍只有部分表格确认：HYV9 `X655` / `X656` / `X657` / `X676` / `X658` / `X659` / `X660` / `X862` / `X860` / `X826` / `X828` / `X809` / `X811` / `X813`，V9Q `X817` / `X819` / `X834` / `X836` / `X822` / `X824` / `X830` 已可输出封装尺寸和厚度；其他如 `X321N` / `X535` / `X630` 仍只保留前段稳定 token。
- 没有外部 reference 的 H25/H25T 候选不删除，但必须在 iTXTech fdnext DecodePack metadata 标记为 `local_pending_external_reference` 或进入本文档待确认列表，不能输出到用户可见解析结果。
- `H2` / `HY27` 的 topology、mode、generation 表来自既有规则表，后续应逐步补对应资料出处。
- `H26`、`HN8`、`H28S` 已被更高优先级 managed NAND 规则拦截，不应在 raw NAND 文档中重复解析。
- `H9` 已拆到 eMCP / uMCP 文档，不能用 raw NAND 规则兜底解释。
