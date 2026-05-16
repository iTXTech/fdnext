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
- 本地资料：`packages/resources/resources/fdb.json`、`../fdfdb/smssd/2259XT3_Y1226.SET`、`../fdfdb/smssd/2259XT2_Y0321.SET`、`../fdfdb/smufd/flash_3281BB.dbf`、`../fdfdb/smff/ForceFlash-W1116.SET`、`../fdfdb/ma/mas1102_16.ini` 中的 H25 PN、Flash ID、容量、Vx/MLC/TLC/QLC 标签。
- SK hynix NAND Flash catalog mirror 列出 SLC/MLC/TLC/eMMC/E2NAND3.0/SSD 分类，其中 E2NAND3.0 页面使用 `PRODUCT` / `BLOCK SIZE` 维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/nand-flash/34497-603624.html>
- `H27UCG8T2E` datasheet mirror 标注 64Gb (8192M x 8bit) MLC NAND，作为 H27 raw NAND 资料参考。
  <https://app2.alldatasheet.com/datasheet-pdf/pdf/1425049/HYNIX/H27UCG8T2E.html>
- `H2JTDG8UD1BMS` datasheet mirror 的 E2NAND3.0 表列出 H2JTC/H2JTD/H2JTE/H2JTF/H2JTV/H2JT1T 系列、容量、block size、stack、Vcc/Org 与 VLGA 封装。
  <https://www.alldatasheet.co.nz/html-pdf/1425105/HYNIX/H2JTDG8UD1BMS/741/4/H2JTDG8UD1BMS.html>
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

- 新式 raw NAND：`packages/decodepack/src/rules/packs/skhynix-raw-token.json`
  - 规则 ID：`vendor.skhynix.token.v1`
- legacy raw NAND：`packages/decodepack/src/rules/packs/skhynix-legacy-token.json`
  - 规则 ID：`vendor.skhynix.legacy.token.v1`
- 4D NAND package：`packages/decodepack/src/rules/packs/skhynix-4d-token.json`
  - 规则 ID：`vendor.skhynix.4d.package.h25t.v1`
- 3D NAND：`packages/decodepack/src/rules/packs/skhynix-3d-token.json`
  - 规则 ID：`vendor.skhynix.3d.h25.token.v2`
  - 规则 ID：`vendor.skhynix.3d.token.mlc`
  - 规则 ID：`vendor.skhynix.3d.token.tlc`
- E2NAND：`packages/decodepack/src/rules/packs/skhynix-e2nand-token.json`
  - 规则 ID：`vendor.skhynix.e2nand.h2d_h2j.v1`

## 覆盖范围

| 前缀 / 结构 | 规则 | 说明 |
| --- | --- | --- |
| `HY27...` | legacy raw NAND | 旧式 Hynix/SK hynix NAND PN |
| `H2DT...` / `H2JT...` | E2NAND | H2D E2NAND2.0 与 H2J E2NAND3.0，按结构 token 分类 |
| `H2...` | raw NAND | 新式 SK hynix raw NAND PN；不覆盖 H2D/H2J E2NAND 结构 |
| `H27...` | raw NAND | 既有 H27 raw NAND 路径覆盖 |
| `H25T...` | H25T NAND package | H25T 开头的 SSD/mobile NAND package 型号，按 token 组合推断 V6/V7/V8/V9Q |
| `H25(非 T)...` | H25 3D/4D raw NAND token | 按 series/cell/layout/density/stack/generation token 推断 MLC/TLC/QLC 与代际 |
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
| density `CG/DF/DG/EG/FG/VG/1T` | 64Gb / 64Gb / 128Gb / 256Gb / 512Gb / 768Gb / 1024Gb |
| config | 例如 `8UD` / `8VD` / `8YD`，只作为内部解析 token |
| tech | 与 series 组合判断 die profile，例如 `D:1` -> `HY26`，`J:1` -> `HY16M`，`J:2` -> `HY20` |
| package | VLGA，原始 package code 只作为内部解析 token |

| 示例 | 输出重点 | 佐证状态 |
| --- | --- | --- |
| `H2DTDG8UD1MYR` | E2NAND2.0, 128Gb, x8, MLC, VLGA, 2MB block | `external_table_confirmed` |
| `H2JTDG8UD1BMS` | E2NAND3.0, 128Gb, x8, MLC, VLGA, 4MB block | `external_table_confirmed` |

`H23` 未在本地资源或外部表中找到稳定结构证据，不再使用 unsupported fallback；有效 `H26M/H26T` 由 eMMC/e-NAND 文档和规则覆盖。

## H25 4D / 3D NAND

H25 目前分成两类结构处理：

1. `H25T...`：较新的 4D NAND package 标识，常见于 SSD 拆解、SSD database 和 flash-id 表。规则只解析 `density code + generation code + config`，不按完整 PN 白名单匹配。
2. `H25(非 T)...`：3D/4D raw NAND token 结构，按 `series + cell + layout + density + stack + generation` 解析。没有外部 reference 的 token 不删除，只标记待确认。

### H25T 4D NAND package

| PN 结构 | 字段 |
| --- | --- |
| `H25T` + density(2) + generation(1) + config(3) + optional package tail | SK hynix 4D NAND package |
| product key | `density code + generation` 组合；同一个 density code 在不同 generation 下不能直接复用容量 |
| config | 例如 `88E` / `88C` / `48C`，当前只作为结构 token 输出 |

| Product key / 示例 | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `2T:B` / `H25T2TB88E-*` | 128L 4D NAND V6 / H25FTB0, TLC, 4Tbit package, 8 x 512Gb die | `external_confirmed` |
| `1T:C` / `H25T1TC48C` | 176L 4D NAND V7 / H25FTC0, TLC, 2Tbit package, 4 x 512Gb die | `external_confirmed` |
| `2T:C` / `H25T2TC88C-*` | 176L 4D NAND V7 / H25FTC0, TLC, 4Tbit package, 8 x 512Gb die | `external_confirmed` |
| `1T:D` / `H25T1TD48C-X630` | 238L 4D NAND V8 / H25FTD0, TLC, 2Tbit package, 4 x 512Gb die | `external_confirmed` |
| `2T:D` / `H25T2TD88C-X682` | 238L 4D NAND V8 / H25FTD0, TLC, 4Tbit package, 8 x 512Gb die | `external_confirmed` |
| `4Q:M` / `H25T4QM88G` | 321-layer QLC NAND, 2Tb die/package code family | `external_confirmed` |
| `0T:C` / `H25T0TC28C` | 176L/3DV7 TLC, 512Gbit package | `external_table_confirmed` |
| `3T:C` / `H25T3TC88CX658` | 238L/3DV8 TLC, 512Gbit package | `external_table_confirmed` |
| `3Q:A` / `H25T3QA88CX548` | 176L/3DV7 QLC, 1Tbit package | `external_table_confirmed` |
| `0Q:A` / `H25T0QA18CX542` | 本地 fdb/fdfdb 指向 176L/3DV7 QLC, 1Tbit package；尚未找到稳定外部网页 | `local_pending_external_reference` |

### H25 legacy 3D NAND token

| PN 结构 | 字段 |
| --- | --- |
| `H25` + series(2) + cell(1) + layout(1) + density(1) + stack(1) + generation(1) + tail | SK hynix H25 raw NAND token |
| series `QE/QF/BF/JG/G9` | 不同 3D/4D NAND family；例如 `QE` early 3D MLC、`G9` 4D V7/V8 family |
| cell `M/T/Q` | MLC / TLC / QLC |
| density + stack | 组合判断容量，不单看单个 density 字符 |
| generation | 与 series/cell/layout 组合判断 V4/V5/V6/V7/V8 |
| voltage | `Vcc: 2.7V~3.6V, VccQ: 1.7V~1.95V/1.14V~1.26V` |
| device width | x8 |

| 示例 PN / token | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `H25QEM8A1B*` / `QE:M:8:B` | 256Gbit 3D NAND V4 MLC | `external_table_confirmed` |
| `H25QFT8A1A8R` / `QF:T:8:A` | 512Gbit 3D NAND V4 TLC | `external_table_confirmed` |
| `H25QFTMF4A9R` / `QF:T:M:A` | 512Gbit 3D NAND V4 TLC | `external_table_confirmed` |
| `H25BFT8A1M8R` / `BF:T:8:M` | 512Gbit 3D NAND V5 TLC | `external_table_confirmed` |
| `H25BFT8A1B8R` / `BF:T:8:B` | 512Gbit 3D NAND V6 TLC | `external_table_confirmed` |
| `H25JGT8A1M8R` / `JG:T:8:M` | 1Tbit 3D NAND V6 TLC | `external_table_confirmed` |
| `H25JGQ8A1M8R` / `JG:Q:8:M` | 1Tbit 3D NAND V5 QLC | `external_table_confirmed` |
| `H25G9TC18CX488` / `G9:T:C:C` | 512Gbit 176L/3DV7 TLC | `external_table_confirmed` |
| `H25G9TD18CX576` / `G9:T:D:C` | 512Gbit 238L/3DV8 TLC | `external_table_confirmed` |

当前保留但未找到稳定外部 reference 的候选包括 `QF:T:8:M`、`BF:T:8:Z`、`G9:T:B:E`，以及若干仅由本地 fdb/fdfdb 推出的 density-only token，例如 `BF:T:8:A2`、`G9:T:B:18`、`JG:T:8:B1`、`JG:T:8:F1`。这些不会删除，但待确认状态只存在于 iTXTech fdnext DecodePack metadata，不会作为解析结果输出。

## 已知缺口

- H25T package tail（如 `X321N` / `X535` / `X630`）仍缺原厂 ordering table，目前只保留前段稳定 token。
- 没有外部 reference 的 H25/H25T 候选不删除，但必须在 iTXTech fdnext DecodePack metadata 标记为 `local_pending_external_reference` 或进入本文档待确认列表，不能输出到用户可见解析结果。
- `H2` / `HY27` 的 topology、mode、generation 表来自既有规则表，后续应逐步补对应资料出处。
- `H26`、`HN8`、`H28S` 已被更高优先级 managed NAND 规则拦截，不应在 raw NAND 文档中重复解析。
- `H9` 已拆到 eMCP / uMCP 文档，不能用 raw NAND 规则兜底解释。
