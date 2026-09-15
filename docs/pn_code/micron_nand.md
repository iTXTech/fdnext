# Micron 裸 NAND PN 编码

采集日期：2026-07-12

本文档记录 Micron `MT29E...` / `MT29F...` / `MT29H...` 裸 NAND 解析规则，以及
`MT29FB...` 的 HSC NAND 订购编码结构。`MT29FB` 中的 `B` 表示 `Flash + IOE ASIC`，
公开输出中分类仍为裸 NAND，HSC 只作为 NAND 技术备注，模式输出为
`IO Expander`。

## 外部资料

- 用户提供的 Micron `Current Part Number System (HSC NAND Flash)` 订购编码图给出
  `MT 29F B 64T 08 G D L B B N2 - QJ ES : B` 结构，可确认 `MT29FB` HSC NAND
  的容量、单元、配置、电压、IOE ASIC、接口、封装、特性、
  生产状态和设计修订版编码段。
- 用户提供的 Micron `Current Part Number System (NAND Flash 50-series ~ now)` 订购编码图给出
  `MT 29F 16T 08 E W L E H D6 - 36 IT R ES : E` 结构，可确认当前版裸 NAND
  的容量、总线位宽、单元、器件配置、电压、die 代际、接口、
  封装、速度、温度、特性、生产状态和设计修订版编码段。
- 用户提供的 Micron `Legacy Part Number System (NAND Flash 20-series ~ 60-series)` 订购编码图给出
  `MT 29F 128G 08 W A A C6 - xx xx xx ET ES : A` 结构，可确认旧版裸 NAND
  中位宽后直接跟器件配置，且 `29H` 速度等级只对 高速 NAND 闪存
  有效。
- Micron 官方 FBGA 解码器可确认 `NC103` 对应 `MT29FB16T08GALAAM5-TES:B`，`NC104`
  对应 `MT29FB16T08GALAAM5-T:B`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- 2026-08-27 对 Micron MDB 反查确认 8 个 `EE29E...` / `EE29F...` 主体与当前版
  `MT29E...` / `MT29F...` 订购编码的容量、位宽、单元、配置、电压、die、
  接口、封装和后缀位置一致。规则把 `MT/EE` 作为独立体系编码段；`EE`
  固定输出一次 `Early Engineering Samples`，并优先于尾部 `ES`，不泄漏原始体系编码。
- Micron 官方已停产目录有 `MT29FB16T08GALAAM5-T-B` 与
  `MT29FB8T08EALAAM5-QK-E` 详情页，可作为 PN 存在性与产品线参考资料。
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb16t08galaam5-t-b>
  <https://www.micron.com/products/obsolete/obsolete-tlc-nand/part-catalog/part-detail/mt29fb8t08ealaam5-qk-e>
- Micron 官方当前版 SLC NAND 目录 JSON 在 2026-07-12 审计时返回 107 个 PN。逐 PN 对照
  目录的容量、总线位宽、技术、封装引脚/尺寸后，现有当前版结构化
  解码器 107/107 一致；实际出现的 `WP/H4/HC/12/WB/SF/H1/H3` 封装编码段均已有编码段
  映射，因此本轮没有为了扩大样例数重复加入完整 PN 查表。
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/slc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/slc-nand/-/en_US>
- 2026-07-12 继续审计 Micron 官方当前版 MLC/TLC/QLC 与已停产 MLC/TLC/3D/SLC
  目录 JSON，共 348 条 `MT29E/MT29F/MT29H` PN。逐 PN 对照厂商、裸 NAND 类型、
  容量、总线位宽、单元类型和芯片封装后，现有结构化解码器 348/348
  均能保持这些确定字段；目录中存在的芯片封装也均已有语义映射，因此没有
  新增完整 PN 查表。`J4` / `H3` 的部分目录行所列厚度与既有映射不一致，属于待进一步
  核对的来源冲突，本轮按只增不改原则保留既有映射，不以单次目录扫描覆盖。
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/mlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/mlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/tlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/tlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/storage/nand-flash/qlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/storage/qlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-mlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-mlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-tlc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-tlc-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-3d-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-3d-nand/-/en_US>
  <https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-slc-nand/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-slc-nand/-/en_US>
- Micron `TN-29-19: NAND Flash 101` 的 READ ID 表逐位给出旧 2Gb SLC
  `MT29F2G08/16 AAD/ABD` 的器件 ID、die 数、单元、页、块、位宽、平面
  与电压。标识符 DecodePack 因此只对该表明确列出的 `AA/BA/CA/DA` 器件 ID
  补充 2Gb 容量、x8/x16、1.8V/3.3V、2KB 页、64B 备用区和 128KB 块；不把旧格式
  位段泛化到现代 3D NAND ID。
  <https://user.eng.umd.edu/~blj/CS-590.26/micron-tn2919.pdf>
- Micron `4Gb, 8Gb, and 16Gb x8 NAND Flash Memory` 数据手册的表 8 给出
  `2C DC 90 95 54` 与 `2C D3 D1 95 58` 两组按 CE/分段读取的旧版 SLC
  配置规格。表中同时确认 3V x8、2KB 页、128KB 块、64B 备用区、
  die/交错/缓存和 2/4 平面；8Gb `DAA` 与 16Gb `FAA` 的 ID 分别反映每个
  4Gb/8Gb 分段，因此标识符输出 ID 能确定的分段容量，不从 PN 反推整包容量。
  <https://media.digikey.com/pdf/Data%20Sheets/Micron%20Technology%20Inc%20PDFs/MT29FxG08xAA.pdf>
- Micron `1Gb x8, x16 NAND Flash Memory` 数据手册的表 6 给出
  `2C F1 80 95 02`、`2C A1 80 15 02`、`2C B1 80 55 02`：分别为 3.3V x8、
  1.8V x8、1.8V x16，三者均为 1Gb SLC、2KB 页、128KB 块、64B 备用区、
  单 die/单-平面。该系列与 4/8/16Gb 旧版规格共用相同的结构化
  标识符规范，不回落到现代容量位段。
  <https://www.micros.com.pl/mediaserver/PEF29f1g08abbdah4d_0001.pdf>
- ESMT `F59D2G81XA (2B)` 数据手册的 READ ID 与 ONFI 参数页给出
  `2C AA 90 15 06`，并确认参数页制造商为 `MICRON`。该字节组合对应
  2Gb、1.8V、x8 SLC、单 die/两-平面、2KB 页、128B 备用区、128KB 块、
  缓存与双页并行编程，ECC 为 8bit/544B。标识符只对这一完整字节组合覆盖通用
  Micron Intel-definition 位段，不把 ESMT 作为 `2C` 制造商，也不扩展相邻 ID。
  <https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D2G81XA%282B%29.pdf>
- ESMT `F59L8G81XA (2Y)` 数据手册的 READ ID 与 ONFI 参数页给出
  `2C D3 90 A6 64`，并确认参数页制造商为 `MICRON`。该字节组合对应
  8Gb、3.3V、x8 SLC、单 die/两-平面、4KB 页、224B 备用区、256KB 块、
  缓存与双页并行编程，ECC 为 8bit/540B。该精确覆盖修正通用位段对容量、
  备用区、块和平面的错误解释，但不覆盖或删除其他既有 `2C` 映射。
  <https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L8G81XA%282Y%29.pdf>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-raw-structured-token.json`
- `packages/core/src/decodepack/rules/packs/micron-raw-token.json`
- `packages/core/src/decodepack/identifier/packs/micron.json`
- `flashid.micron.legacy-slc.v1`
- `flashid.micron.slc-geometry.v1`
- `flashid.micron.v1`
- `vendor.micron.hsc.mt29fb.v1`
- `vendor.micron.raw.current.v1`
- `vendor.micron.raw.legacy.v1`

Micron 裸 NAND 由三类官方订购编码结构覆盖，不保留旧的未分型通用规则：

- `vendor.micron.hsc.mt29fb.v1`：`MT29FB` HSC NAND，优先级最高。
- `vendor.micron.raw.current.v1`：`MT29E/F` / `EE29E/F` 当前版 50-系列及后续裸 NAND。
- `vendor.micron.raw.legacy.v1`：官方旧版 20-系列 ~ 60-系列裸 NAND，包括 `29H`
  高速 NAND 闪存。

三者公开分类都保持裸 NAND。HSC 规则按头部结构匹配，尾部未知编码段不会阻断厂商、
容量、单元、配置等已确认字段输出。

## MT29FB HSC 裸 NAND

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT/EE` + `29F` + `B` + 容量 + `08` + 单元 + 配置 + 电压 + IOE + 接口 + 封装 + 可选后缀 + 可选修订版 | Micron 带 HSC 的裸 NAND 订购编码 |
| 体系 `MT/EE` | Micron 技术 / 早期工程样品 |
| 产品 `29F` | NAND 闪存 |
| 产品类型 `B` | 闪存 + IOE ASIC；公开模式为 `IO Expander` |
| 容量 `8T/16T/32T/62T/64T` | 8Tb / 16Tb / 32Tb / 62Tb / 64Tb，落库为 Mbit |
| 总线位宽 `08` | x8 |
| die 类型 `E/G` | TLC / QLC |
| 配置 `A/B/C/D` | `A=16 die, 2 nCE, 1 I/O`; `B=8 die, 1 nCE, 1 I/O`; `C=16 die, 2 nCE, 2 I/O`; `D=32 die, 2 nCE, 2 I/O` |
| 电压 `L` | Vcc 3.30V 或 2.50V, VccQ 1.20V |
| IOE `A/B` | IOE 代际 1 Rev.A / IOE 代际 2 Rev.A |
| 接口 `A/B/C` | 仅 NV-DDR3 / NV-DDR3 + NV-LPDDR4 / 仅 NV-LPDDR4 |
| 封装 `M5/D5/D6/D7/N2` | `M5/D5/D6/D7` 有公开尺寸；`N2` 仅作内部编码段 |
| 特性 `T/QC/QJ/VJ/QK` | FortisMax 或 Performance 企业级选项 |
| 生产状态 `ES/EE/MS/QS` | 工程 / 早期工程 / 机械 / 资格认证样品 |
| 设计修订版 | 与单 die 容量 + 单元类型组合推导 `die_codename` |

设计修订版映射：

| 单元 | 单 die 容量 | 修订版 | 制程 |
| --- | --- | --- | --- |
| TLC | 512Gb | C | B27B |
| TLC | 512Gb | E | B47R |
| TLC | 1Tb | C | B58R |
| TLC | 1Tb | E | B68S |
| TLC | 1Tb | H | B78R |
| QLC | 1Tb | B | N28A |
| QLC | 1Tb | C | N48R |
| QLC | 1Tb | D | N58R |
| QLC | 2Tb | B | N69R |

公开输出：

- `density`、`device_width`、`cell_level`
- `die_count`、`ce_count`、`channel_count`
- `voltage`
- `interface_type`
- `package`，仅限 `M5/D5/D6/D7` 这种资料给出实际尺寸的编码段
- `nand_technology = HSC NAND`
- `product_mode = IO Expander`
- `controller_revision = IOE Gen ...`
- `special_option`
- `prod_status`
- `die_codename`，并由 `nand.die_profile` 补 `layer_count`、`die_density` 等标准字段

以下编码段不进入公开字段：体系编码、容量编码、配置编码、电压编码、
IOE 编码、接口编码、封装编码、特性编码、设计修订版编码，以及由证据清单单独维护的参考资料 / 状态信息。

## 当前版 MT29E / MT29F 裸 NAND

非 HSC 当前版 `MT29E...` / `MT29F...` 使用 50-系列及后续裸 NAND 编码段结构：

| 结构 | 含义 |
| --- | --- |
| `MT29E/MT29F` + 容量 + 位宽 + 单元 + 配置 + 电压 + die 代际 + 接口 + 封装 + 可选后缀 + 可选修订版 | Micron 当前版裸 NAND 主结构 |
| 容量编码段 | 复用 Micron 裸 NAND 容量编码段表，落库为 Mbit |
| 位宽 `01/08/16` | NAND I/O 位宽 |
| 单元 `A/C/E/G` | SLC / MLC / TLC / QLC |
| 配置编码段 | 输出 `die_count`、`ce_count`、`rb_count`、`channel_count` |
| 电压编码段 | 输出 `voltage`，只表达电压本身 |
| die 代际编码段 | 与单 die 容量 + 单元类型组合推导 `die_codename` |
| 接口编码段 | 输出 `interface_type`，例如 `Sync only`、`NV-DDR3/NV-LPDDR4` |
| 封装编码段 | 只在订购编码图给出实际封装尺寸 / 球数时输出 `package` |
| 可选后缀 | 按 `speed + temperature + feature + production status` 拆分为 `speed_grade`、`operation_temperature`、`special_option`、`prod_status`；设计修订版编码不公开 |

当前版规则额外覆盖 `64T` 容量、`D6/L*` 等新封装、`J` 接口、`IT/AIT/AT/AUT`
温度等级，以及 `Q/QZ/ZQ/QJ/QK/R/RZ/...` 等特性编码段；其中 `Q` 为 `Enterprise Q`，
`QZ/ZQ` 为 `Enterprise Q + Polyimide Process Applied`。`20` 速度编码在资料图中存在重复含义，
当前不公开该编码的 `speed_grade`，避免把 `100 MT/s` / `2000 MT/s` 误判为确定值。

## 旧版 MT29F / MT29H 裸 NAND

旧版 20-系列 ~ 60-系列结构与当前版结构不同：位宽后直接是器件配置，
没有独立的单元类型编码段，也没有当前版结构中的接口编码段。

| 结构 | 含义 |
| --- | --- |
| `MT29F/MT29H` + 容量 + 位宽 + 配置 + 电压 + die 代际 + 封装 + 可选后缀 + 可选修订版 | Micron 旧版裸 NAND 主结构 |
| 产品 `29F/29H` | NAND 闪存 / 高速 NAND 闪存 |
| 配置编码段 | 同时推导 SLC/MLC 与 `die_count`、`ce_count`、`rb_count`、`channel_count` |
| 电压 `A/B/C/D` | 旧版电压表 |
| die 代际编码段 | 与单 die 容量 + 单元类型组合推导 `die_codename`；`29H` 8Gb SLC `A` 映射为 `M51H` |
| 封装编码段 | 只输出图中有封装描述的编码段；`BC` 暂不公开封装 |
| 速度等级 | 仅对 `29H` 输出 `20/15/12/10 = 100/133/166/200 MT/s` |
| 温度 / 生产状态 | 输出 `operation_temperature` / `prod_status` |

## 测试样例

- `MT29FB64T08GDLBBN2-QJES:B`
- `MT29FB16T08GALAAM5-TES:B`
- `MT29FB8T08EALAAM5-QK:E`
- `MT29F16T08EWLEHD6-36ITRES:E`
- `MT29H8G08AAAC6-20ETES:A`
- `MT29F128G08WAAC6-ETES:A`
- `MT29F2G08ABDHC-ET:D`
- `EE29E2T08CTCCBJ7-10NES:C`
- `EE29F512G08EBLDEH6-QAES:D`
- 去冒号输入也应匹配 mdb 规范 PN，例如 `MT29FB16T08GALAAM5-TESB` -> `MT29FB16T08GALAAM5-TES:B`
- Micron 受管理 NAND PN 同样以有效 `mdb.json` 映射为优先来源：MDB 已包含等价 PN 或后缀更详细的 PN 时，不再向 `managed-nand-pn.json` 重复加入；带 `DO NOT USE` 的映射不作为覆盖依据。

## 注意

- `MT29FB` 使用专用 HSC 编码段规则，但这只是裸 NAND 下的系列备注，不是独立芯片种类。
- 裸 NAND 结果不额外补 `product_family`；HSC 信息只通过 `nand_technology` 备注。
- `N2` 目前只有封装编码段，订购编码图没有给出实际封装尺寸 / 球数，因此不公开 `package`。
- HSC 配置图中的 `I/O` 列映射到公开 `channel_count`。
- `MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP / AiO / uMCP 组合封装不属于裸 NAND 解析器。
- `MT29PZZZ...` 已由 AiO 规则按官方 `29P = LPDDR2-S4 + MLC eMMC` 解码。MDB 中另外 6 个
  `MT29P` 裸 NAND 形态的 PN 虽可由 Micron FBGA 解码器确认精确主体，但缺少公开订购编码
  资料解释 `P`、封装与无连字符后缀；它们与 `MT29P5DAMN-DC` 一起列入有意省略
  仅搜索，不能把当前版裸 NAND 匹配从 `[EF]` 扩成 `[EFP]`，也不能让 `AT/RW` 被误读为温区。
- MDB 中的 `MT29FCA...` / `MT29FEN...` 不是普通裸 NAND 订购编码缺口。Micron 官方资料确认
  它们是 ClearNAND / Enhanced ClearNAND：使用并行 NAND 接口，但封装内集成错误
  管理，且官方旧件目录把代表型号列为 ClearNAND MLC / MCP。
  `vendor.micron.clearnand.v1` 已以独立结构规则接入 CA 8/16/32GB 与 EN 16/32/64GB；
  EN `DQ` 封装和 `-10` 速率有公开资料时才输出，不塞入 `vendor.micron.raw.current.v1`。
  <https://investors.micron.com/news-releases/news-release-details/micron-unveils-innovative-flash-memory-devices-extend-life-nand>
  <https://www.micron.com/products/obsolete/obsolete-nand-mcp-catalog/part-catalog/part-detail/mt29fen64gdkcaaxdq-10-a>
- `package_code`、`config_code`、`die_code`、`feature_code`、设计修订版编码等编码段
  只用于内部解析，不进入公开字段。
