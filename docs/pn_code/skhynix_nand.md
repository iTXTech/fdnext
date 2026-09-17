# SK hynix NAND PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix 裸 NAND 与 E2NAND 料号在现有规则库中的覆盖范围。eMMC / UFS 受管理 NAND 已拆分到独立文档：

- [SK hynix eMMC / e-NAND](skhynix_emmc.md)
- [SK hynix UFS](skhynix_ufs.md)
- [SK hynix eMCP / uMCP](skhynix_emcp.md)

## 来源

- SK hynix Newsroom 说明 4D NAND 的技术路线：96 层 4D NAND 基于 CTF + PUC，后续覆盖 128 层、176 层、238 层和 321 层产品。
  <https://news.skhynix.com/sk-hynix-inc-launches-the-worlds-first-ctf-based-4d-nand-flash-96-layer-512gb-tlc/>
  <https://news.skhynix.com/sk-hynix-starts-mass-producing-worlds-first-128-layer-4d-nand/>
  <https://news.skhynix.com/sk-hynix-unveils-the-industrys-highest-layer-176-layer-4d-nand-flash/>
  <https://news.skhynix.com/sk-hynix-develops-worlds-highest-238-layer-4d-nand-flash/>
  <https://news.skhynix.com/begin-supply-321-layer-qlc-nand-cssd/>
- TechInsights 摘要确认 `H25T2TB88E` 内含 H25FTB0 128L NAND；`H25T2TC88C` 是 176L NAND；`H25T1TC48C` 封装内含 4 个 H25FTC0 512Gb 176L TLC die；`H25T1TD48C-X630` 封装内含 4 个 H25FTD0 238L 512Gb TLC die；`H25T2TD88C-X682` 属于 PC811 V8 NAND 封装。
  <https://www.techinsights.com/products/mfr-2008-805>
  <https://www.techinsights.com/products/ame-2206-801>
  <https://www.techinsights.com/products/iwo-2206-801>
  <https://www.techinsights.com/blog/sk-hynix-h25ftd0-238l-512-gb-tlc-3d-nand-internal-waveform-analysis>
  <https://www.techinsights.com/blog/sk-hynix-h25ftd0-238l-512-gb-tlc-3d-nand-advanced-memory-process-analysis>
- TechPowerUp SSD 数据库给出 `H25T2TB88E-X259` 和 `H25T2TD88C-X682` 的封装容量、die 数与 die 容量，可用于校准 H25T 封装总容量。
  <https://www.techpowerup.com/ssd-specs/sk-hynix-gold-p31-1-tb.d444>
  <https://www.techpowerup.com/ssd-specs/sk-hynix-platinum-p51-1-tb.d1967>
- flashinfo.top、Wuyou、SSD 转储与分销页面用于低一档外部交叉验证；这类来源不等同原厂资料，但可与本地 fdb/fdfdb 共同标注 `external_table_confirmed`。
  <https://flashinfo.top/>
  <https://bbs.wuyou.net/forum.php?extra=&mod=viewthread&tid=449091>
  <https://hisubway.online/blog/ssd/>
  <https://www.puris.net/dir/product/flash/rawnand>
- 本地资料：`packages/core/resources/fdb.json`、`../fdfdb/smssd/2259XT3_Y1226.SET`、`../fdfdb/smssd/2259XT2_Y0321.SET`、`../fdfdb/smufd/flash_3281BB.dbf`、`../fdfdb/smff/ForceFlash-W1116.SET`、`../fdfdb/ma/mas1102_16.ini` 中的 H25 PN、Flash ID、容量、Vx/MLC/TLC/QLC 标签。
- SK hynix `H27U2G8F2C` 2Gbit 数据手册的旧版 Read ID 表：确认 `AA/BA/CA/DA` 器件 ID 分别编码 1.8V/3.3V 与 x8/x16，并确认 3rd/4th/5th 字节的 die/单元、页/块/备用区、平面位段。公开镜像：<https://www.alldatasheet.fr/datasheet-pdf/pdf/2079233/HYNIX/H27U2G8F2CTR.html>。
- Hynix `HY27US(08/16)281A` 128Mbit 数据手册的 Read ID 表确认 `73/53` 分别为 3.3V x8/x16：<https://docs.rs-online.com/2289/0900766b80d6fb37.pdf>。
- Hynix `HY27(U/S)S(08/16)561A` 256Mbit 数据手册的 Read ID 表确认 `75/55` 为 3.3V x8/x16，`35/45` 为 1.8V x8/x16：<https://datasheet4u.com/pdf-down/H/Y/2/HY27US08561A_HynixSemiconductor.pdf>。
- Hynix `HY27(U/S)S(08/16)121A` 512Mbit 数据手册的 Read ID 表确认 `76/56` 为 3.3V x8/x16，`36/46` 为 1.8V x8/x16：<https://images.100y.com.tw/pdf_file/HYNIX_HY27US08121A-TP.pdf>。
- Hynix `HY27UF081G2A` 1Gbit 数据手册的 Read ID 表确认 `F1/C1` 分别为 3.3V x8/x16，byte3=`80`，并给出 2KB 页、128KB 块与 64B 备用区；公开 PDF 镜像：<https://docs.rs-online.com/af21/0900766b80d6fc8d.pdf>。
- Hynix `H27U4G8F2D` 数据手册的旧版 Read ID 支持的-配置表同时列出 4Gbit `AC/BC/CC/DC + 90`、8Gbit `A3/B3/C3/D3 + D1` 和 16Gbit `A5/B5/C5/D5 + D2` 的电压/位宽组合；公开镜像：<https://www.datasheetq.com/pdf-html/384049/Hynix/24page/H27U4G8F2DTR-BC.html>。
- Hynix `H27(U/S)2G8/6F2C` 数据手册的旧版 Read ID 表确认 2Gbit 四种组合：`AD DA 90 95 44` = 3.0V x8、`AD CA 90 D5 44` = 3.0V x16、`AD AA 90 15 44` = 1.8V x8、`AD BA 90 55 44` = 1.8V x16。现有结构化规则已覆盖，本轮补齐四组回归测试：<https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/791/8004.2Gb-Nand-flash-H27U2G8F2C.pdf.pdf>。
- Hynix `HY27UG088G(5/D)M` 8Gbit 数据手册确认 `AD DC 80 95`，组织为 2KB 页、128KB 块；公开 PDF 镜像：<https://wiki.laptop.org/mediawiki/images/1/1b/CL1_NAND_Hynix.pdf>。
- SK hynix `H27UAG8T2B` 16Gbit MLC 数据手册确认 `AD D5 94 9A 74 42` 仍使用 `D5`，但组织为 8KB 页、2MB 块、448B 备用区。因此 Flash ID 规则必须结合 byte3 条件化旧式 SLC 几何参数，不能仅按器件编码全局覆盖；公开 PDF 镜像：<https://www.farnell.com/datasheets/1382715.pdf>。
- 维护者补充的 SK hynix 3D NAND 表记录 `HYV2` 到 `HYV8` 的层数、单元、die 容量、Toggle 接口与 die 丝印。`H25FT*` / `H27*` 属于 die 丝印，只进入 `die_mark`；固件匹配仍使用 `HYVx` / `HYVxQ` / `HYVxM` 这类规格键。
- 维护者补充的 H27/H2E/H2N 订购编码图覆盖 `H27Q4T8LQA3R-BDH`、`H2E...` 和 `H2N...` 这类结构，给出电压、器件容量、die 堆叠、配置、die 代际、封装、材料、坏块、温度与 I/O 速度编码段。规格判断按 `cell family + derived die density + die generation` 组合，不按完整 PN 白名单。
- SK hynix NAND 闪存目录镜像列出 SLC/MLC/TLC/eMMC/E2NAND3.0/SSD 分类，其中 E2NAND3.0 页面使用 `PRODUCT` / `BLOCK SIZE` 维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/nand-flash/34497-603624.html>
- `H27UCG8T2E` 数据手册镜像标注 64Gb (8192M x 8bit) MLC NAND，作为 H27 裸 NAND 资料参考。
  <https://app2.alldatasheet.com/datasheet-pdf/pdf/1425049/HYNIX/H27UCG8T2E.html>
- `H2JTDG8UD1BMS` 数据手册镜像的 E2NAND3.0 表列出 H2JTC/H2JTD/H2JTE/H2JTF/H2JTV/H2JT1T 系列、容量、块大小、堆叠、Vcc/Org 与 WLGA 封装。
  <https://www.alldatasheet.co.nz/html-pdf/1425105/HYNIX/H2JTDG8UD1BMS/741/4/H2JTDG8UD1BMS.html>
- SK hynix NAND Flash Databook Q1'2016 镜像给出 E2NAND3.0 与 E3NAND 产品系列：H2J/H23Q 系列、容量、4MB 块、堆叠、Vcc/Org、WLGA 与 EMI 屏蔽 / 无屏蔽 备注。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>
- USBDev 闪存列表与闪存 Extractor 论坛对 H2D/H2J PN 给出 E2NAND / E2NAND2.0 / E2NAND3.0 标签，可作为 `external_table_confirmed` 级别交叉验证。
  <https://www.usbdev.ru/databases/flashlist/flflash3267abdbf/>
  <https://www.flash-extractor.com/forum/viewtopic.php?t=7399>

## 置信度与准入

各表状态以 [可信度策略](reference_policy.md) 定义为准，结构化规则遵循 [PN 编写规范](authoring.md)。

## 规则入口

- H27 / H2E / H2N 裸 NAND：`packages/core/src/decodepack/rules/packs/skhynix-h27-raw-nand-token.json`
  - 规则 ID：`vendor.skhynix.h27.raw.v2`
- HY27 裸 NAND：`packages/core/src/decodepack/rules/packs/skhynix-hy27-raw-nand-token.json`
  - 规则 ID：`vendor.skhynix.legacy.token.v1`
- H25 NAND 封装 / 编码段：`packages/core/src/decodepack/rules/packs/skhynix-h25-token.json`
  - 规则 ID：`vendor.skhynix.h25.gt-package.v2`
  - 规则 ID：`vendor.skhynix.h25.raw.v2`
- E2NAND：`packages/core/src/decodepack/rules/packs/skhynix-e2nand-token.json`
  - 规则 ID：`vendor.skhynix.e2nand.h2d_h2j.v1`
  - 规则 ID：`vendor.skhynix.e3nand.h23q.v1`

## 覆盖范围

| 前缀 / 结构 | 规则 | 说明 |
| --- | --- | --- |
| `HY27...` | 旧版裸 NAND | 旧式 Hynix/SK hynix NAND PN |
| `H2DT...` / `H2JT...` | E2NAND | H2D E2NAND2.0 与 H2J E2NAND3.0，按结构编码段分类 |
| `H23Q...` | E3NAND | E3NAND 受管理 NAND，按容量/配置/封装编码段分类 |
| `H27...` / `H2E...` / `H2N...` | 裸 NAND | H27/H2E/H2N 订购编码图路径，按 die 堆叠推导单 die 容量，再判断 2D 光刻制程或 3D `HYVx` 规格 |
| `H25T...` / `H25G...` | H25T/G NAND 封装 | H25T/H25G 开头的 SSD/移动版 NAND 封装型号，按编码段组合推断 V6/V7/V8/V9Q |
| `H25(非 T)...` | H25 3D/4D 裸 NAND 编码段 | 按电压/单元/容量/堆叠/配置/代际编码段推断 MLC/TLC/QLC 与代际 |
| `H26...` | 不属于裸 NAND 文档 | 已由 eMMC / e-NAND 文档覆盖 |
| `HN8...` / `H28S...` | 不属于裸 NAND 文档 | 已由 UFS 文档覆盖 |
| `H9...` | 不属于裸 NAND 文档 | 已由 eMCP / uMCP 文档覆盖 |

## HY27 旧版裸 NAND

| PN 结构 | 字段 |
| --- | --- |
| `HY27` + 电压 + 拓扑 + 位宽(2) + 容量(2) + 模式 + 代际 + 保留 + 封装 + 可选尾部 | 旧版裸 NAND |
| 电压 `U/L/S/J/Q/T` | 电压 / VccQ 组合 |
| 拓扑 | 单元类型与 die 数 |
| 位宽 `08/16/32` | 器件位宽 |
| 容量 | 64Mb 到 4Tb，按规则表映射 |
| 模式 | CE / RB / 通道 |
| 代际 | 代际编码 |
| 封装 | TSOP / WSOP / FBGA / LGA / 晶圆 / KGD 等 |
| 可选尾部 | 封装材料、工作温度、坏块策略 |

## H27 / H2E / H2N 裸 NAND

H27 / H2E / H2N 使用同一张订购编码图规则，不再只把第 10 位输出成数值代际。规则仍按结构编码段解析，不维护完整 PN 白名单。

| PN 结构 | 字段 |
| --- | --- |
| `H` + 产品类型(`27`/`2E`/`2N`) + 电压 + 容量(2) + 总线位宽 + die 堆叠 + 配置 + die 代际 + 封装 + 材料 + 可选 `-` + 坏块 + 温度 + I/O 速度 | 裸 NAND |
| 产品类型 `27/2E/2N` | `27` 为普通 NAND 闪存；`2E` 输出 `special_option = Emulated`；`2N` 输出 `special_option = NVDIMM` |
| 电压 `U/L/S/T/Q/J/B/C` | Vcc / VccQ 组合 |
| 容量 | 器件容量，先输出 `density`，再结合 die 堆叠计算 `die_density` |
| 总线位宽 `8/6/2/M/N/O/L/I/D` | x8 / x16 / x32；`M/N` 输出 `Enterprise`，`O` 输出 `Structure 2`，`L/I/D` 输出 `Customized ECC`，不输出总线位宽编码 |
| die 堆叠 | 输出 `cell_level` 与 `die_count`；TLC `L` = 16 die，`X` = 3 die，`0` = 6 die |
| 配置 | 输出 CE / R/B / 通道数量；带 Sequential 行 Read Enable / Disable 说明的行额外输出 `product_mode` |
| die 代际 | 结合单元系列与计算出的单 die 容量判断 `die_codename` |
| 封装 | 输出确认过的封装类型 / 引脚 / 尺寸，不输出封装编码 |
| 材料 / 坏块 / 温度 / I/O 速度 | 输出含铅 / 无铅 / 无卤 / 晶圆、晶圆包装类型、PGD/LAS/ZQ 特殊选项、坏块策略、工作温度与 `speed_grade` |

H27 制程键使用 `cell family:die density:generation code`。其中单元系列不是公开字段，只用于规则内部：`S` = SLC，`M` = MLC/eMLC/通道 MLC，`T` = TLC/通道 TLC。例：`H27Q4T8LQA3R-BDH` 为 4Tb 封装、TLC `L` 16-die，推导出的单 die 容量是 256Gb；`T:256Gb:A` 映射 `HYV4`，不是按整包 4Tb 判断。

已进入规则的 H27 规格映射：

| 制程键 | 规格 |
| --- | --- |
| `S:512Mb:C` | `HY57` |
| `S:1Gb:B`, `S:4Gb:C`, `S:8Gb:M`, `M:2Gb:M`, `M:4Gb:B`, `M:8Gb:B`, `M:16Gb:M`, `T:32Gb:1`, `T:32Gb:M` | `HY48` |
| `S:1Gb:C`, `S:2Gb:D`, `S:4Gb:E`, `S:16Gb:A`, `M:16Gb:B`, `M:32Gb:A`, `T:32Gb:A` | `HY32` |
| `S:2Gb:C`, `S:4Gb:D`, `S:8Gb:A`, `S:16Gb:M`, `M:16Gb:A`, `M:32Gb:M`, `T:16Gb:M` | `HY41` |
| `S:4Gb:F`, `M:32Gb:B`, `M:64Gb:M` | `HY26` |
| `S:4Gb:G`, `M:32Gb:D`, `M:64Gb:C`, `M:64Gb:D`, `M:64Gb:E`, `M:64Gb:F`, `M:128Gb:M`, `M:128Gb:B`, `T:64Gb:M` | `HY16` |
| `M:16Gb:C`, `M:32Gb:C`, `M:64Gb:A`, `M:64Gb:B` | `HY20` |
| `M:128Gb:D`, `T:128Gb:B` | `HY14` |
| `M:128Gb:A` | `HYV1` |
| `M:128Gb:C`, `M:256Gb:M` | `HYV2` |
| `M:64Gb:G` | `HYV3M` |
| `T:128Gb:C`, `T:256Gb:B` | `HYV3` |
| `T:256Gb:A`, `T:512Gb:A` | `HYV4` |

H27 图表中 TLC `128Gb + M` 同时出现 16nm 与 3D V3 48L 两条，当前规则不对这个重复键输出确定 `die_codename`，只保留已能确定的结构字段。

## H2D / H2J E2NAND

H2D / H2J 系列不是通用裸 NAND 回退。公开目录镜像与 USBDev/闪存 Extractor 外部表均把相关 PN 标为 E2NAND，其中 `H2D...` 对应 E2NAND2.0，`H2J...` 对应 E2NAND3.0。规则只按结构编码段解析，不枚举完整 PN。

| PN 结构 | 字段 |
| --- | --- |
| `H2` + 系列 + 产品 + 容量(2) + 配置(3) + 技术 + 封装(3) + 可选后缀 | H2D/H2J E2NAND |
| 系列 `D/J` | `D` -> E2NAND2.0；`J` -> E2NAND3.0 |
| 容量 `CG/DF/DG/EG/FG/VG/1T` | 64Gb / 64Gb / 128Gb / 256Gb / 512Gb / 768Gb / 1Tb |
| 配置 `8T2/8UD/8VD/8YD/8PD/8QD` | 堆叠与单 die 容量组合；公开输出 die_count / die_density，不输出配置编码或 die_stack |
| 技术 | 与系列组合判断 die 规格，例如 `D:1` -> `HY26`，`J:1` -> `HY16M`，`J:2` -> `HY20` |
| 封装 | H2D 输出 VLGA；H2J 输出 WLGA；原始封装编码只作为内部解析编码段 |
| 封装后缀 `R/S` | 无屏蔽 / EMI 屏蔽，输出到 `special_option` |

| 示例 | 输出重点 | 佐证状态 |
| --- | --- | --- |
| `H2DTDG8UD1MYR` | E2NAND2.0, 128Gb, x8, MLC, VLGA, 2MB 块 | `external_table_confirmed` |
| `H2JTDG8UD1BMS` | E2NAND3.0, 128Gb, x8, MLC, WLGA, 4MB 块, 2-die, EMI 屏蔽 | `external_table_confirmed` |
| `H2JT1T8QD1MMR` | E2NAND3.0, 1024Gb, x8, MLC, WLGA, 4MB 块, 8-die, 无屏蔽 | `external_table_confirmed` |

`H2DTDG8UD1MYR` 另由 Electronics360 的 iPhone 4S 拆解确认 SK hynix / 16GB MLC，本轮补入受管理 NAND 搜索资源；解码器继续使用 E2NAND 结构编码段，不按完整 PN 匹配。

## H23Q E3NAND

H23Q 系列按 Q1'2016 数据手册产品系列进入受管理 NAND，不归入裸 NAND 回退。规则只解析容量、配置、封装/屏蔽这些结构编码段，不维护完整 PN 白名单。

| PN 结构 | 字段 |
| --- | --- |
| `H23Q` + 容量(1/2) + 配置(3/4) + 技术(1) + 封装(3) | H23Q E3NAND |
| 容量 `D/E/F/1T` | 128Gb / 256Gb / 512Gb / 1024Gb |
| 配置 `G8UD/G8VG/G8YK/G8PG/8QK` | 堆叠与单 die 容量组合；公开输出 die_count / die_density，不输出 die_stack |
| 技术 `1` | 1ynm E3NAND |
| 封装 | WLGA |
| 封装后缀 `R/S` | 无屏蔽 / EMI 屏蔽，输出到 `special_option` |

| 示例 | 输出重点 | 佐证状态 |
| --- | --- | --- |
| `H23QDG8UD1ACS` | E3NAND, 128Gb, x8, WLGA, 4MB 块, 2-die, EMI 屏蔽 | `external_table_confirmed` |
| `H23Q1T8QK1MYR` | E3NAND, 1024Gb, x8, WLGA, 4MB 块, 8-die, 无屏蔽 | `external_table_confirmed` |

除 `H23Q` E3NAND 外，其他 `H23` 结构仍不使用不支持回退；有效 `H26M/H26T` 由 eMMC/e-NAND 文档和规则覆盖。

## H25 NAND 封装 / 编码段

H25 目前分成两类结构处理：

1. `H25T...` / `H25G...`：较新的 NAND 封装标识，常见于 SSD 拆解、SSD 数据库和 Flash ID 表。规则按 `capacity + cell + generation + geometry + width + voltage + optional package` 解析，不按完整 PN 白名单匹配。
2. `H25(非 T)...`：裸 NAND 编码段结构，按 `voltage + cell + layout + density + stack + config + generation` 解析。第 4 位是工作电压编码，不参与 `HYVx` 规格判断；没有外部参考资料的编码段不删除，只标记待确认。为覆盖本地 FDB 中的短 PN / 局部 PN，H25 裸 NAND 规则只要求 `H25` 后存在至少 5 个编码段字符；长度不足或未在表中的编码段只跳过对应字段，仍输出厂商 / 裸 NAND 与已能确认的字段。

规则输出只保留结构字段，例如 `density`、`cell_level`、`die_codename`、`process_alias` 和 `die_count`。3D / 4D、层数、die 容量与 Toggle 接口属于 `nand.die_profile` 统一维护的信息，不在 H25 规则内重复组装公开 `generation_info` 文案。

### 3D / 4D die 规格补充

`H25FT*`、`H25G*` 和 `H27*` 是 die 丝印，不作为固件匹配。`nand.die_profile` 中固件匹配继续保持 `HYVx`，die 标识只追加到 `die_mark`。

| 规格 | 代际 | 单元 | 层数 | Die 容量 | 接口 | Die 丝印 |
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
| `HYV9` | 4D V9 | TLC | 321 | 1Tb | 见具体封装表 | - |
| `HYV9H` | 4D V9H | TLC | 321 | 1Tb | 3600MT/s | `G-Die` |
| `HYV9Q` | 4D V9 | QLC | 321 | 2Tb | 3200MT/s | `M-Die` |

`HYV6` 的公开单 die 容量需要按 die 丝印区分：`H25FTB0` 为 512Gb，`H25GTM0` 为 1Tb。共享 `nand.die_profile` 只保留 `HYV6` 的层数、单元与接口信息，H25T/G 封装规则按封装总容量 / die 数计算并输出单 die 容量。

`HYV8` 与 `HYV6` 的共享规格均不固定单 die 容量，PN 容量推导沿用上文规则。已支持的堆叠 Read ID 布局使用容量字节的单 die 容量，并将乘以 die_count 的结果作为目标容量。关联判断见 [FDBGen](../FDBGEN.md#process-native-density-and-topology)，实测关系见 [FDB 87 审计](evidence/pn-flash-id-matching-2026-09.md#已验证案例)。

`HY14` 表示旧 2D 14nm 规格，公开制程仍显示为 `14nm`。SK hynix Flash ID 中 `E0` 不能单独判作 HY14；当已解析 die 大小为 1Tb 级且单元为 TLC 时，`E*` die 编码归入 `HYV9`。

### 旧版 2Gbit Flash ID

`H27U2G8F2C` 的 5-字节 Read ID 使用同一组结构化编码段，而不是完整 ID 白名单：

| 2nd 字节 | 电压 | 位宽 | 容量 |
| --- | --- | --- | --- |
| `AA` | 1.8V | x8 | 2Gbit |
| `BA` | 1.8V | x16 | 2Gbit |
| `CA` | 3.3V | x16 | 2Gbit |
| `DA` | 3.3V | x8 | 2Gbit |

这组旧版器件 ID 使第 4 字节按旧表解释为页 `1/2/4/8KB`、块 `64/128/256/512KB`；不能套用后期 SK hynix ID 的扩大一档几何表。四个已确认配置均输出 `2KB` 页、`128KB` 块和 `64B` 备用区。

### 旧版 SLC Flash ID 条件化

旧式 Hynix SLC 器件编码同时编码电压 / 位宽，但 `DC/D3/D5` 也会在其他组织或后期 MLC 中出现。规则只对数据手册明确给出的 `byte2 + byte3` 组合启用旧几何参数，保留其余 ID 的现有解释：

| 字节 2 + 字节 3 | 单 die 容量 | 电压 / 位宽 | 旧版几何参数 |
| --- | --- | --- | --- |
| `F1/C1 + 80` | 1Gbit | 3.3V, x8/x16 | 2KB 页, 128KB 块, 64B 备用区 |
| `AC/BC/CC/DC + 90` | 4Gbit | 1.8V/3.3V, x8/x16 | 2KB 页, 128KB 块, 64B 备用区 |
| `DC + 80` | 8Gbit | 3.3V, x8 | 2KB 页, 128KB 块, 64B 备用区 |
| `A3/B3/C3/D3 + D1` | 8Gbit die 配置 | 1.8V/3.3V, x8/x16 | 2KB 页, 128KB 块, 64B 备用区 |
| `A5/B5/C5/D5 + D2` | 16Gbit die 配置 | 1.8V/3.3V, x8/x16 | 2KB 页, 128KB 块, 64B 备用区 |

`D5 + 94` 的 `H27UAG8T2B` 是反例：它继续走后期位域，输出 8KB 页、2MB 块和 448B 备用区。该条件化避免旧数据手册的几何参数覆盖已经确认的新式编码。

### 旧版小页两字节器件 ID

早期 Hynix 小页 SLC 仅返回制造商 + 器件两字节。当前仅追加数据手册直接确认且原结果完全缺失的容量、电压、器件位宽，不改通用标识符对短 ID 补零后形成的既有几何参数：

| 器件 ID | 容量 | 电压 / 位宽 |
| --- | --- | --- |
| `73/53` | 128Mbit | 3.3V, x8/x16 |
| `75/55` | 256Mbit | 3.3V, x8/x16 |
| `35/45` | 256Mbit | 1.8V, x8/x16 |
| `76/56` | 512Mbit | 3.3V, x8/x16 |
| `36/46` | 512Mbit | 1.8V, x8/x16 |

这些器件的数据手册同时给出 512-字节页、16KB 块和 16-字节备用区，但当前短 ID 会补零后走通用 2KB/128KB/128B 几何参数。遵循不覆盖既有映射的约束，本轮只记录冲突，不修改页/块/备用区。`HY27UA081G1M` 的 `79` 器件 ID 由数据手册确认为 1Gbit，但现有 Flash ID 容量输出为 1Tb，同样只记录、不覆盖。

### H25T / H25G NAND 封装

| PN 结构 | 字段 |
| --- | --- |
| `H25` + 容量(2) + 单元(1) + 代际(1) + die 堆叠(1) + 总线位宽(1) + 电压(1) + 可选 `Xddd` 尾部 + 可选包装类型 | SK hynix NAND 封装 |
| 容量 `G9/T0/T1/T2/T3/T4/T5/T6` | 64GB / 128GB / 256GB / 512GB / 1TB / 2TB / 4TB / 8TB 封装总容量 |
| 单元 `M/T/Q` | MLC / TLC / QLC |
| 代际 | 结合单元与计算出的单 die 容量判断 `HYVx`，不能全局写死 `M/B/C/D/E` |
| die 堆叠 `1/2/4/8/G/X` | 1 / 2 / 4 / 8 / 16 die；`X` 表示晶圆；CE/RB/通道由该编码段和封装选项共同决定 |
| 总线位宽 `8/X` | `8` = x8；`X` 表示晶圆 |
| 电压 `E/C/G` | `E` / `C` / `G` 按当前版表输出工作电压范围；不输出原始电压编码 |
| 封装选项 `Xddd` | 三位封装 & 配置选项；完整 `Xddd` 尾部参与键，不退回只按前段合并 |
| 包装类型 `N/R/M/A` | Normal (托盘) / 卷带 / 模组 / 晶圆 |

公开结果中，H25T / H25G 封装容量统一放在 `density`，不再重复输出 `component_density`；单 die 容量由封装总容量 / die 数计算，已知封装堆叠使用数值 `die_count` / `ce_count` / `rb_count` / `channel_count`，不再输出字符串 `die_stack`。`packing_type` 输出可读出货形态，不输出包装编码。

已进入当前版规格映射的代际键：

| 键 | 规格 |
| --- | --- |
| `T:M:512Gb` | `HYV5`, TLC 512Gb, 4D V5 96L |
| `T:B:512Gb` | `HYV6`, TLC 512Gb, 4D V6 128L |
| `T:C:512Gb` | `HYV7`, TLC 512Gb, 4D V7 176L |
| `T:D:512Gb` | `HYV8`, TLC 512Gb, 4D V8 238L |
| `T:A:1Tb` | `HYV5`, TLC 1Tb, 4D V5 96L |
| `T:M:1Tb` | `HYV6`, TLC 1Tb, 4D V6 128L |
| `T:C:1Tb` | `HYV8`, TLC 1Tb, 4D V8 238L |
| `T:D:1Tb` | `HYV9`, TLC 1Tb, 4D V9 321L |
| `T:G:1Tb` | `HYV9H`, TLC 1Tb, 4D V9H 321L |
| `Q:M:1Tb` | `HYV5Q`, QLC 1Tb, 4D V5 96L |
| `Q:A:1Tb` | `HYV7Q`, QLC 1Tb, 4D V7 176L |
| `Q:M:2Tb` | `HYV9Q`, QLC 2Tb, 4D V9 321L |

图中 V10 375L 行没有清楚暴露代际编码；当前规则只解析已能确认的容量、电压、die 堆叠、总线位宽和包装类型，不把未知编码绑定到新规格。

| 结构键 / 示例 | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `T2:T:B:8:8:E` / `H25T2TB88E-*` | `HYV6` / `H25FTB0`, TLC, 128L 规格, 512GB 封装, 8 x 512Gb die；`E` 电压按当前版表输出 | `external_confirmed` |
| `G9:T:M:1:8:E` / `H25G9TM18E` | `HYV5` / `H25FT4MMI`, TLC, 96L 规格, 64GB 封装, 1 x 512Gb die；别名来自 `nand.die_profile.die_mark` | `external_table_confirmed` |
| `G9:T:C:1:8:C` / `H25G9TC18CX488` | `HYV7` / `H25FTC0`, TLC, 176L 规格, 64GB 封装, 1 x 512Gb die | `external_table_confirmed` |
| `T2:T:C:8:8:C` / `H25T2TC88C-*` | `HYV7` / `H25FTC0`, TLC, 176L 规格, 512GB 封装, 8 x 512Gb die | `external_confirmed` |
| `T3:T:C:G:8:C` / `H25T3TCG8C` | `HYV7` / `H25FTC0`, TLC, 176L 规格, 1TB 封装, 16 x 512Gb die, 4 CE | `external_table_confirmed` |
| `T3:T:C:8:8:C` / `H25T3TC88C-X658-R` | `HYV8`, TLC, 238L 规格, 1TB 封装, 8 x 1Tb die, 卷带 | `external_table_confirmed` |
| `G9:T:D:1:8:C` / `H25G9TD18CX576` | `HYV8` / `H25FTD0`, TLC, 238L 规格, 64GB 封装, 1 x 512Gb die | `external_table_confirmed` |
| `T2:T:D:8:8:C` / `H25T2TD88C-*` | `HYV8` / `H25FTD0`, TLC, 238L 规格, 512GB 封装, 8 x 512Gb die | `external_confirmed` |
| `T4:T:M:G:8:C` / `H25T4TMG8C` | `HYV6` / `H25GTM0`, TLC, 128L 规格, 2TB 封装, 16 x 1Tb die, 4 CE | `external_table_confirmed` |
| `T0:Q:M:1:8:E` / `H25T0QM18E` | `HYV5Q` / `H25GQM0`, QLC, 96L 规格, 128GB 封装, 1 x 1Tb die；别名来自 `nand.die_profile.die_mark` | `external_table_confirmed` |
| `T0:Q:A:1:8:C` / `H25T0QA18CX542` | `HYV7Q`, QLC, 176L 规格, 128GB 封装, 1 x 1Tb die | `external_table_confirmed` |
| `T0:Q:A:X:X:B:X569:A` / `H25T0QAXXBX569A` | QLC 晶圆形式；die 堆叠 / 总线位宽的 `X` 和包装类型的 `A` 均表示晶圆 | `external_table_confirmed` |
| `T3:Q:A:8:8:C` / `H25T3QA88CX548` | `HYV7Q`, QLC, 176L 规格, 1TB 封装, 8 x 1Tb die | `external_table_confirmed` |
| `T4:Q:M:8:8:G` / `H25T4QM88G` | `HYV9Q`, QLC, 321L 2Tb M-die 规格, 2TB 封装, 8 x 2Tb die, 6-平面, 3200MT/s；`G` 电压按当前版表输出 | `external_confirmed` |
| `T6:Q:M:8:8:G` / `H25T6QM88G` | 8TB 封装总容量；规格暂不绑定，避免把未确认 V10 编码写死 | `external_table_confirmed` |

维护者补充的 HYV9 封装表给出 128GB die 与 `D18/D28/D48/D88/DG8` 结构。`00h` Address ID 按每个 CE 的堆叠选择：SDP = `AD89284B00E0`，DDP = `AD89294B00E0`，QDP = `AD892A4B00E0`。封装表中的 `T` 是厚度，公开 `package` 统一写成 `x1.0mm` / `x1.35mm` / `x1.5mm`；电压按表格写入 `Vcc: 2.5V, VccQ: 1.2V`，避免仅依赖编码段推测。

H25 的 X 封装尾部进入 FDB 时保留完整尾缀并去掉分隔符；带 `-X...` 分隔的输入统一归一为无分隔的规范 PN。

| PN | ID | 可确定内容 |
| --- | --- | --- |
| `H25T0TD18CX655` | `AD89284B00E0` | `HYV9`, 128GB 封装, 1 x 1Tb die, 1 CE / 1 R/B, 152 球 BGA 14x18x1.0mm |
| `H25T1TD28CX656` | `AD89284B00E0` | `HYV9`, 256GB 封装, 2 x 1Tb die, 2 CE / 2 R/B, 152 球 BGA 14x18x1.0mm |
| `H25T2TD48CX657` | `AD89284B00E0` | `HYV9`, 512GB 封装, 4 x 1Tb die, 4 CE / 4 R/B, 152 球 BGA 14x18x1.0mm |
| `H25T3TD88CX676` | `AD89294B00E0` | `HYV9`, 1TB 封装, 8 x 1Tb die, 4 CE / 4 R/B, 152 球 BGA 14x18x1.35mm |
| `H25T3TD88CX658` | `AD89294B00E0` | `HYV9`, 1TB 封装, 8 x 1Tb die, 4 CE / 4 R/B, 152 球 BGA 14x18x1.35mm |
| `H25T4TDG8CX658` | `AD892A4B00E0` | `HYV9`, 2TB 封装, 16 x 1Tb die, 4 CE / 4 R/B, 152 球 BGA 14x18x1.35mm |
| `H25T2TD48CX659` | `AD89284B00E0` | `HYV9`, 512GB 封装, 4 x 1Tb die, 4 CE / 4 R/B, 316 球 BGA 14x18x1.0mm |
| `H25T3TD88CX660` | `AD89294B00E0` | `HYV9`, 1TB 封装, 8 x 1Tb die, 4 CE / 4 R/B, 316 球 BGA 14x18x1.35mm |
| `H25T4TDG8CX660` | `AD892A4B00E0` | `HYV9`, 2TB 封装, 16 x 1Tb die, 4 CE / 4 R/B, 316 球 BGA 14x18x1.35mm |
| `H25T2TD48CX862` | `AD89284B00E0` | `HYV9`, 512GB 封装, 4 x 1Tb die, 4 CE / 4 R/B, 154 球 BGA 11.5x13.5x1.0mm |
| `H25T3TD88CX860` | `AD89294B00E0` | `HYV9`, 1TB 封装, 8 x 1Tb die, 4 CE / 4 R/B, 154 球 BGA 11.5x13.5x1.35mm |
| `H25T0TD18CX826` | `AD89284B00E0` | `HYV9`, 128GB 封装, 1 x 1Tb die, 1 CE / 1 R/B, 154 球 BGA 11.5x13.5x1.0mm |
| `H25T1TD28CX828` | `AD89284B00E0` | `HYV9`, 256GB 封装, 2 x 1Tb die, 2 CE / 2 R/B, 154 球 BGA 11.5x13.5x1.0mm |
| `H25T2TD48CX809` | `AD89284B00E0` | `HYV9`, 512GB 封装, 4 x 1Tb die, 4 CE / 4 R/B, 154 球 BGA 11.5x13.5x1.0mm |
| `H25T3TD88CX811` | `AD89294B00E0` | `HYV9`, 1TB 封装, 8 x 1Tb die, 4 CE / 4 R/B, 154 球 BGA 11.5x13.5x1.35mm |
| `H25T4TDG8CX813` | `AD892A4B00E0` | `HYV9`, 2TB 封装, 16 x 1Tb die, 4 CE / 4 R/B, 154 球 BGA 11.5x13.5x1.5mm |

维护者补充的 V9Q 封装表确认 2Tb QLC M-Die，321L，6-平面；die 速度以 3200MT/s 为准，旧 3360MT/s 记法不再使用。`X830` 是 接口芯片变体，速度为 2280MT/s。

| PN | ID | 可确定内容 |
| --- | --- | --- |
| `H25T3QM48GX817` | `AD780C5B30E0` | `HYV9Q`, 1TB 封装, 4 x 2Tb die, 4 CE / 4 R/B, 4 通道, 316 球 BGA 14x18x1.0mm, 客户端, 3200MT/s |
| `H25T4QM88GX819` | `AD780D5B30E0` | `HYV9Q`, 2TB 封装, 8 x 2Tb die, 4 CE / 4 R/B, 4 通道, 316 球 BGA 14x18x1.35mm, 客户端, 3200MT/s |
| `H25T5QMG8GX819` | `AD780E5B30E0` | `HYV9Q`, 4TB 封装, 16 x 2Tb die, 4 CE / 4 R/B, 4 通道, 316 球 BGA 14x18x1.35mm, 客户端, 3200MT/s |
| `H25T1QM18GX834` | `AD780C5B30E0` | `HYV9Q`, 256GB 封装, 1 x 2Tb die, 1 CE / 1 R/B, 2 通道, 154 球 BGA 11.5x13.5x1.0mm, 企业级, 3200MT/s |
| `H25T2QM28GX836` | `AD780C5B30E0` | `HYV9Q`, 512GB 封装, 2 x 2Tb die, 2 CE / 2 R/B, 2 通道, 154 球 BGA 11.5x13.5x1.0mm, 企业级, 3200MT/s |
| `H25T3QM48GX822` | `AD780C5B30E0` | `HYV9Q`, 1TB 封装, 4 x 2Tb die, 4 CE / 4 R/B, 2 通道, 154 球 BGA 11.5x13.5x1.0mm, 企业级, 3200MT/s |
| `H25T4QM88GX824` | `AD780D5B30E0` | `HYV9Q`, 2TB 封装, 8 x 2Tb die, 4 CE / 4 R/B, 2 通道, 154 球 BGA 11.5x13.5x1.35mm, 企业级, 3200MT/s |
| `H25T5QMG8GX830` | `AD780E5B30E0` | `HYV9Q`, 4TB 封装, 16 x 2Tb die, 4 CE / 4 R/B, 2 通道, 154 球 BGA 11.5x13.5x1.7mm, 企业级, 2280MT/s, 接口芯片 |

### H25 裸 NAND 编码段

| PN 结构 | 字段 |
| --- | --- |
| `H25` + 电压(1) + 单 die 容量(1) + 单元(1) + 位宽/布局(1) + die 数(1) + 配置(1) + 代际(1) + 尾部 | SK hynix H25 裸 NAND 编码段 |
| 电压 `Q/B/J` | 工作电压编码；`Q` = Vcc 3.30V, VccQ 1.80V；`B` = Vcc 3.30V 或 2.50V, VccQ 1.80V 或 1.20V；`J` = Vcc 3.30V 或 2.50V, VccQ 1.20V |
| 单 die 容量 `E/F/G` | 32GB / 64GB / 128GB die，即 256Gb / 512Gb / 1Tb 单 die 容量 |
| 单元 `M/T/Q` | MLC / TLC / QLC |
| 位宽/布局 `4/8/M` | x8；`M` 额外输出 `Enterprise`，`4` 由维护者按现有 FDB 候选暂定为 x8，该编码段只用于结构解析，不输出原始编码 |
| die 数 `A/B/D/F/G` | 1 / 2 / 4 / 8 / 16 die |
| 配置 `1/3/4/5/6/A/B` | CE / R/B / 通道组合；表内 I/O 即公开输出中的通道，`A` 额外表示 IF 芯片 |
| 代际 | 结合单元 + 单 die 容量判断 `HYVx` 规格；第 4 位电压不参与规格映射，不能只按代际全局映射 |
| 封装 `8/9/2/3/D` | `VBGA-152, 14x18x1.00` / `LBGA-152, 14x18x1.35` / `VFBGA-316, 14x18x1.00` / `LFBGA-316, 14x18x1.35` / `Wafer, PGD-2` |
| 封装材料 `A/R` | 整片晶圆或无铅无卤；公开为 `wafer`、`lead_free`、`halogen_free` |
| 坏块 `B/S/P` | Include 坏块 / 1~5 坏块 / 全部好块 |
| 温度 `C/D/E/M/I` | 商业级 / 商业级 2 / 扩展 / 移动版 / 工业级 |
| I/O 速度 `F/G/H/I/J` | 400 / 533 / 667 / 800 / 1200 MT/s |

H25 裸 NAND 封装总容量由单 die 容量 x die 数计算；公开结果中输出 `density`、`die_density`、`die_count`、`ce_count`、`rb_count`、`channel_count`、`voltage`、`package`、`operation_temperature`、`bad_block` 和 `speed_grade`，不输出电压 / 单 die 容量 / 配置 / 代际 / 封装编码等内部编码段。长度不足或表内未知的尾部编码段继续跳过，不输出 `Unknown`。

已进入规格映射的代际键：

| 键 | 规格 |
| --- | --- |
| `M:E:B` | `HYV4M`, MLC 256Gb, 3D V4 76L |
| `T:F:A` | `HYV4`, TLC 512Gb, 3D V4 72L |
| `T:F:M` | `HYV5`, TLC 512Gb, 4D V5 96L |
| `T:F:B` | `HYV6`, TLC 512Gb, 4D V6 128L |
| `T:G:A` | `HYV5`, TLC 1Tb, 4D V5 96L |
| `T:G:M` | `HYV6`, TLC 1Tb, 4D V6 128L |
| `Q:G:M` | `HYV5Q`, QLC 1Tb, 4D V5 96L |

| 示例 PN / 编码段 | 可确定内容 | 佐证状态 |
| --- | --- | --- |
| `H25QEM8A1B` / `Q:E:M:M:A:1:B` | `HYV4M`, MLC, 32GB 封装, 1 x 256Gb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25QFT8A1A` / `Q:F:T:8:A:1:A` | `HYV4`, TLC, 64GB 封装, 1 x 512Gb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25QFT8B3A` / `Q:F:T:8:B:3:A` | `HYV4`, TLC, 128GB 封装, 2 x 512Gb die, 2 CE / 2 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFT8D4A` / `Q:F:T:8:D:4:A` | `HYV4`, TLC, 256GB 封装, 4 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFT8F4A` / `Q:F:T:8:F:4:A` | `HYV4`, TLC, 512GB 封装, 8 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFT8F6A` / `Q:F:T:8:F:6:A` | `HYV4`, TLC, 512GB 封装, 8 x 512Gb die, 8 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFT8G4A` / `Q:F:T:8:G:4:A` | `HYV4`, TLC, 1TB 封装, 16 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFTMA1A` / `Q:F:T:M:A:1:A` | `HYV4`, TLC, 64GB 封装, 1 x 512Gb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25QFTMB3A` / `Q:F:T:M:B:3:A` | `HYV4`, TLC, 128GB 封装, 2 x 512Gb die, 2 CE / 2 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFTMD4A` / `Q:F:T:M:D:4:A` | `HYV4`, TLC, 256GB 封装, 4 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFTMF4A` / `Q:F:T:M:F:4:A` | `HYV4`, TLC, 512GB 封装, 8 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFTMF6A` / `Q:F:T:M:F:6:A` | `HYV4`, TLC, 512GB 封装, 8 x 512Gb die, 8 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25QFTMG4A` / `Q:F:T:M:G:4:A` | `HYV4`, TLC, 1TB 封装, 16 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25BFT8A1M` / `B:F:T:8:A:1:M` | `HYV5`, TLC, 64GB 封装, 1 x 512Gb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25BFT8A1B` / `B:F:T:8:A:1:B` | `HYV6`, TLC, 64GB 封装, 1 x 512Gb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25BFT8B3M` / `B:F:T:8:B:3:M` | `HYV5`, TLC, 128GB 封装, 2 x 512Gb die, 2 CE / 2 R/B / 2 通道 | `external_table_confirmed` |
| `H25BFT8D4M` / `B:F:T:8:D:4:M` | `HYV5`, TLC, 256GB 封装, 4 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25BFT8F4M` / `B:F:T:8:F:4:M` | `HYV5`, TLC, 512GB 封装, 8 x 512Gb die, 4 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25BFT8F6M` / `B:F:T:8:F:6:M` | `HYV5`, TLC, 512GB 封装, 8 x 512Gb die, 8 CE / 4 R/B / 2 通道 | `external_table_confirmed` |
| `H25JGT8A1A` / `J:G:T:8:A:1:A` | `HYV5`, TLC, 128GB 封装, 1 x 1Tb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25JGT8A1M` / `J:G:T:8:A:1:M` | `HYV6`, TLC, 128GB 封装, 1 x 1Tb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |
| `H25JGT8B3M` / `J:G:T:8:B:3:M` | `HYV6`, TLC, 256GB 封装, 2 x 1Tb die, 2 CE / 2 R/B / 2 通道 | `external_table_confirmed` |
| `H25JGQ8A1M` / `J:G:Q:8:A:1:M` | `HYV5Q`, QLC, 128GB 封装, 1 x 1Tb die, 1 CE / 1 R/B / 1 通道 | `external_table_confirmed` |

当前未进入规格映射的候选，例如 `B:F:T:8:A:1:Z` 这类代际组合，仍可按结构输出容量、单 die 容量、die 数、CE/R/B/通道；但在规格未确认前不输出 `HYVx`。

## 已知缺口

- H25T/G 封装尾部仍只有部分表格确认：HYV9 `X655` / `X656` / `X657` / `X676` / `X658` / `X659` / `X660` / `X862` / `X860` / `X826` / `X828` / `X809` / `X811` / `X813`，V9Q `X817` / `X819` / `X834` / `X836` / `X822` / `X824` / `X830` 已可输出封装尺寸和厚度；其他如 `X321N` / `X535` / `X630` 仍只保留前段稳定编码段。
- 没有外部参考资料的 H25/H25T 候选不删除，但必须在 `evidence/decodepack-references.json` 标记为 `local_pending_external_reference` 或进入本文档待确认列表，不能写入 DecodePack 维护字段或输出到用户可见解析结果。
- `H2` / `HY27` 的拓扑、模式、代际表来自既有规则表，后续应逐步补对应资料出处。
- `H26`、`HN8`、`H28S` 已被更高优先级受管理 NAND 规则拦截，不应在裸 NAND 文档中重复解析。
- `H9` 已拆到 eMCP / uMCP 文档，不能用裸 NAND 规则兜底解释。

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-08-27 V9T/V9Q 检索未获得订购编码/编码段分项解析；后续维护者补充的家族资料见本页规格章节。

## PN 展示

H27/H2E/H2N 在封装材料编码之后、坏块/温度/I/O 等订购尾部之前显示 `-`，例如 `H27UCG8T2ETR-BC`。H25 的既有 `-X` 无分隔别名政策保持原义。
