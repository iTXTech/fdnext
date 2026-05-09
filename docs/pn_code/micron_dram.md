# Micron DRAM PN 编码资料

采集日期：2026-05-08

## 资料来源

- Micron 官方 Packaging and shipping information 页面列出 `DRAM Component Part Numbering System`，版本日期为 2022-07-14，覆盖 DDR4/3/2/DDR/SDRAM、LPDDR5/4/3/2、RLDRAM 与 GDDR 系列；下载入口当前需要 Micron 登录/NDA。
  <https://www.micron.com/sales-support/sales/packaging-and-shipping-information>
- Micron 官方 FBGA and component marking decoder 会返回 Micron `MT...` 或 Crucial namespace `CT...` 的完整 PN；例如 `C9BJZ` 反查为 `CT40A1G8SA-62M:E`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 part detail / part catalog 页面可直接确认样例 PN 属于对应 DRAM 产品线。
  - DDR4 `MT40A1G8SA-075-E`: <https://www.micron.com/products/memory/dram-components/ddr4-sdram/part-catalog/part-detail/mt40a1g8sa-075-e>
  - DDR5 `MT60B2G8HB-48B-IT-A`: <https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b2g8hb-48b-it-a>
  - DDR5 high-capacity configs `MT60B6G4RW-56B:B` / `MT60B3G8RW-64B:B` / `MT60B1536M16RV-56B:B` and `MT60B4G8AT-64B:B` confirm 24Gb / 32Gb component configuration forms. Sources: <https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b3g8rw-64b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b6g4rw-56b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b1536m16rv-56b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b4g8at-64b-b>
  - DDR3 `MT41K512M8DA-107`: <https://www.micron.com/products/memory/dram-components/ddr3-sdram/part-catalog/part-detail/mt41k512m8da-107>
  - DDR2 `MT47H128M16RT-25E-IT`: <https://www.micron.com/products/memory/dram-components/ddr2-sdram/part-catalog/part-detail/mt47h128m16rt-25e-it>
  - LPDDR4 `MT53E1G32D2FW-046-AIT-A`: <https://www.micron.com/products/memory/dram-components/lpddr4/part-catalog/part-detail/mt53e1g32d2fw-046-ait-a>
  - LPDDR5 `MT62F1G32D4DS-031-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr5/part-catalog/part-detail/mt62f1g32d4ds-031-wt-b>
  - LPDDR5X `MT62F1G64D4EK-023 WT:B`: <https://www.micron.com/products/memory/dram-components/lpddr5x/part-catalog>、分销页交叉确认 `LPDDR5X SDRAM` / `8533 Mbps` / `441-ball TFBGA`: <https://www.absunshine.com/en/parts/MT62F1G64D4EK-023-WT-B-MICRON-5778871>
  - LPDDR3 `MT52L512M32D2PF-107-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr-components/part-catalog/part-detail/mt52l512m32d2pf-107-wt-b>
  - GDDR6X `MT61K512M32KPA-24-U`: <https://www.micron.com/products/memory/graphics-memory/gddr6x/part-catalog/part-detail/mt61k512m32kpa-24-u>
  - GDDR7 `MT68A512M32DF-32:A`: Micron GDDR7 product brief 明确 `68 = GDDR7 SGRAM`、`A = 1.2V`、`512M32`、`DF = 266-ball FBGA 12.0mm x 14.0mm x 1.1mm`、`-28/-32 = 28/32Gbps`。
    <https://www.micron.com/content/dam/micron/global/public/products/product-flyer/gddr7-product-brief.pdf>
- 公开分销页面和 datasheet 镜像用于交叉确认实际封装输出，例如 DigiKey `MT40A1G8SA-075:E` / `MT41K512M8DA-107:P` / `MT61K256M32JE-14:A` / `MT61K512M32KPA-24:U`、Microchip USA `MT53E1G32D2FW-046 WT:B`、Allelco `MT62F1G32D4DS-031 WT:B`，以及公开的 Micron GDDR5X datasheet 镜像。
  - <https://www.digikey.kr/ko/products/detail/micron-technology-inc/MT40A1G8SA-075-E/7597774>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT41K512M8DA-107-P-TR/23331051>
  - <https://www.microchipusa.com/product/micron-technology-inc/memory-2/MT53E1G32D2FW-046-WT-B-TR>
  - <https://www.allelcoelec.com/productdetails/Micron-Technology/MT62F1G32D4DS-031%20WT-B.html>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT61K256M32JE-14-A-TR/8510162>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT61K512M32KPA-24-U-TR/17632186>
  - <https://datasheet.octopart.com/MT58K256M32JA-100%3AA-Micron-datasheet-180658177.pdf>
- Micron DDR3/DDR3L TwinDie datasheet 用于确认 `MT41J/MT41K` 的双 die / 2CS 规则。DigiKey 镜像可确认 `MT41J1G4/MT41J512M8`、`MT41K1G4/MT41K512M8`、`MT41K2G4/MT41K1G8`、`MT41K512M16`、`MT41K1G16`；公开 datasheet 镜像交叉确认 `MT41J2G4/MT41J1G8` 与 `MT41K4G4/MT41K2G8`。
- Micron DDR4 TwinDie datasheet 用于确认 `MT40A` 双 die 规则。`MT40A2G4/MT40A1G8` 和 `MT40A4G4/MT40A2G8` 公开 datasheet 明确 x4/x8 TwinDie 是 two ranks / dual CS；`MT40A1G16` 和 `MT40A2G16` 公开 datasheet 明确 x16 TwinDie 是 two x8 die 组合成 single-rank x16；`MT40A8G4/MT40A4G8` 的公开 datasheet 镜像确认 32Gb x4/x8 TwinDie。来源：<https://www.digikey.ch/htmldatasheets/production/1922660/0/0/1/mt40a2g4-mt40a1g8.html>、<https://www.digikey.com/htmldatasheets/production/1952763/0/0/1/mt40a4g4-mt40a2g8.pdf>、<https://www.alldatasheet.net/datasheet-pdf/pdf/2168610/MICRON/MT40A2G16.html>、<https://en.sekorm.com/doc/2000552.html>
  - <https://www.digikey.com/htmldatasheets/production/848961/0/0/1/mt41j1g4-512m8.html>
  - <https://www.digikey.bg/htmldatasheets/production/1004675/0/0/1/mt41k1g4-mt41k512m8.html>
  - <https://www.digikey.com/htmldatasheets/production/1959025/0/0/1/mt41k2g4-mt41k1g8.html>
  - <https://www.digikey.com/en/htmldatasheets/production/1889239/0/0/1/mt41k512m16>
  - <https://www.digikey.com/htmldatasheets/production/1959024/0/0/1/mt41k1g16.html>
  - <https://e-nexty.dxp.nexty-ele.com/en/product_files/download?lc_code=ja&maker_code=MICRONT&product_file_id=4801656&product_id=5843368&product_part_number=MT41J2G4TRF-125%3AE&search_log_id=7616014>
  - <https://pdf.elecfans.com/MICRON/MT41K2G8KJR-125%3AA%20TR.html>
- 公开镜像 `DRAM Component Part Numbering System` 可核对字段顺序、family/voltage/device version/temperature/status/revision/speed 等 token 含义；镜像版本较旧，只用于字段结构交叉验证。
  <https://docslib.org/doc/10329358/dram-component-part-numbering-system>
- 公开评测记录了 Crucial/Ballistix 颗粒 `C9BJZ` / `CT40A1G8SA-62M:E` 的实物和 Micron FBGA decoder 结果；该资料只用于确认 `CT40` namespace 形态，不作为完整 PN 白名单。
  <https://aphnetworks.com/reviews/ballistix-elite-pc4-28800-4x8gb/2>
- Micron 官方 `Legacy LPDRAM Part Numbering System / Legacy DDR4, DDR3/L, & DDR2 SDRAM Part Numbering System` PDF 记录了 Micron 收购 Elpida 后的 legacy Elpida PN 命名；Micron FBGA code 反查可能返回 `EDB/EDF...` Elpida LPDRAM PN，也可能返回 `ED/EE + 40/41/47/...` 这类 legacy PN。
  <https://assets.micron.com/adobe/assets/urn:aaid:aem:0b279ea9-4e4c-49fa-98c6-c18ad4c67279/original/as/legacy-elpida-pns.pdf>
- Preduo 公开 `Micron Part Number List`，列出 FBGA code 与 PN 文本；本项目只将其作为一次性 5 位 code 提取来源，不信任页面中的 PN 对应关系。PN 映射必须由 Micron 官方 FBGA decoder API 重新生成。
  <https://www.preduo.com/part-number-list/micron-part-number-list>

## DSL 范围

- 规则文件：`packages/dsl/src/rules/packs/micron-dram-token.json`
- 规则 ID：`vendor.micron.dram.component.v1`
- 首批覆盖：DDR/SDR/LPDDR/GDDR 主线 component PN，包括 Micron catalog `MT40/41/42/46/47/48/51/52/53/58/60/61/62/68`、Crucial namespace `CT40/41/42/46/47/48/51/52/53/58/60/61/62/68`，以及 Micron legacy Elpida namespace `ED/EE + 40/41/42/44/46/47/48/49/51/52/53/58/60/61/62/68`。
- 不使用完整 PN 白名单；只按 Micron DRAM part-numbering token 解析字段。

## 搜索资源

- `packages/resources/resources/dram-pn.json` 收录已知 Micron / Crucial DRAM PN，用于 PN 补全和 `searchPartNumber()`，不是解码依据。
- `packages/resources/resources/micron-fbga-codes.json` 只保存一次性提取的 5 位 Micron FBGA code，并排除 `crawl-mdb` 已覆盖的 Micron NAND 段 `NC/NW/NY/NX/NQ/NV`；`pnpm fdbgen:crawl-mdb-from-fbga` 读取该 code list，通过 Micron 官方 FBGA decoder API 写入统一 `packages/resources/resources/mdb.json`。
- `packages/resources/resources/mdb.json` 收录官方 API 返回且通过 DRAM family 过滤的 FBGA code 到完整 PN 映射，例如 `C9BJZ -> CT40A1G8SA-62M:E`。它用于 `searchMicronFbgaCode()`、`searchPartNumber()` code 查询，以及 `detect("C9BJZ")` 这类 code 输入时先反查 PN 再走 DSL。
- 资源导入时只保留最小索引字段：DRAM PN 表为 `vendor/pn`，FBGA code 反查统一来自 `mdb.json` 的 code -> PN 映射。真正输出的 `density`、`package`、`dram_type`、`dram_die_stack` 等字段仍由 DSL token 解析。

## PN 结构

典型结构：

```text
(MT|CT) + family + voltage + component configuration + device version + package code + -speed + -temperature + production status + :/ -revision
```

`CT` 前缀来自 Crucial / Ballistix namespace，后续 token 仍沿用 Micron DRAM 结构解析。输出保留原始 `CT...` PN，不强行改写为 `MT...`，因为 Crucial 的 speed/bin token 不一定与公开 `MT...` catalog token 一一对应。

首批 family token：

| Token | 产品线 | 输出 |
| --- | --- | --- |
| `40` | DDR4 SDRAM | `dram_type=DDR4 SDRAM` |
| `41` | DDR3 SDRAM | `dram_type=DDR3 SDRAM` |
| `42` | Mobile LPDDR2 | `dram_type=LPDDR2 SDRAM` |
| `44` | RLDRAM 3 | `dram_type=RLDRAM 3` |
| `46` | DDR SDRAM / Mobile LPDDR | 默认 `dram_type=DDR SDRAM`，`H/HC` voltage token 细化为 `LPDDR SDRAM` |
| `47` | DDR2 SDRAM | `dram_type=DDR2 SDRAM` |
| `48` | SDRAM / Mobile LPSDR | 默认 `dram_type=SDR SDRAM`，`H` voltage token 细化为 `LPSDR SDRAM` |
| `49` | RLDRAM 1/2 | `dram_type=RLDRAM` |
| `51` | GDDR5 | `dram_type=GDDR5 SGRAM` |
| `52` | Mobile LPDDR3 | `dram_type=LPDDR3 SDRAM` |
| `53` | Mobile LPDDR4 / LPDDR4X | 默认 `dram_type=LPDDR4 SDRAM`，`D/E` voltage token 细化为 `LPDDR4X SDRAM` |
| `58` | GDDR5X | `dram_type=GDDR5X SGRAM` |
| `60` | DDR5 SDRAM | `dram_type=DDR5 SDRAM` |
| `61` | GDDR6 / GDDR6X | 默认 `dram_type=GDDR6 SGRAM`，部分 speed bin 细化为 `GDDR6X SGRAM` |
| `62` | Mobile LPDDR5 / LPDDR5X | 默认 `dram_type=LPDDR5 SDRAM`，`020/020F/023` 等 LPDDR5X speed bin 细化为 `LPDDR5X SDRAM` |
| `68` | GDDR7 | `dram_type=GDDR7 SGRAM` |

## 输出约定

- 顶层 `density` 使用项目统一 Mbit 单位，由 `component configuration` 的 depth x width 推导，例如 `1G8` 输出 `8192`。
- 顶层 `deviceWidth` 输出组织位宽，例如 `1G32` 输出 `x32`。
- 顶层 `voltage` 输出 Micron voltage token 对应说明。
- 顶层 `package` 输出实际封装，例如 `78-ball FBGA (7.5x11)`；仅对 part detail、datasheet 或外部分销页可确认的 `family + package code` 组合输出。
- standalone DRAM 的 `extraInfo` 避免重复顶层输出：不再输出 `product_family`、`product_version`、`dram_density`、`dram_width`。
- `extraInfo` 使用跨厂商 DRAM canonical key：`dram_type`、`dram_die_stack`、`dram_speed`、`operation_temperature`、`die_revision`、`config_code`、`package_code`。
- `device version` 中的 `D1/D2/D4/D6/D8/LF/L2/L4` 需要输出 die stack / CS 相关信息，例如 `D4` 输出 `4-die stack`。
- `-speed`、temperature、revision 后缀不是主结构强制项；缺少尾缀时仍解码 density / width / package / die stack，只减少 `dram_speed` / `die_revision` 等后缀信息。
- `dram_type` 必须使用跨厂商标准名，不带厂商名，不写组合候选。
- `package_code` 保留 Micron 原始封装 token；不要用它替代顶层 `package`，也不把未确认的 token 硬推成封装尺寸或 ball count。
- Crucial namespace 的 `45M` / `55M` / `62M` 这类 speed/bin token 只输出为 `Crucial DDR4 speed bin ...`；没有外部公开表时不推导成 JEDEC CL 或 XMP 时序。
- 维护用来源、外部确认状态或推断来源不得进入 `extraInfo`。

## DDR3 / DDR3L TwinDie

Micron `MT41J/MT41K` TwinDie 不能只按 `config_code` 判断。规则必须同时匹配 `family + voltage + config + package_code`，确认后输出 `dram_die_stack=2-die stack, 2 CS`。没有外部 datasheet 佐证的 `mdb.json` 候选封装只保留为待确认线索，不输出 die stack。

| Key | PN family | die stack / CS | source tier |
| --- | --- | --- | --- |
| `41:J:1G4:THU` / `41:J:1G4:THD` | `MT41J1G4` | 2Gb die x2 / 2 CS | `external_confirmed` |
| `41:J:512M8:THU` / `41:J:512M8:THD` | `MT41J512M8` | 2Gb die x2 / 2 CS | `external_confirmed` |
| `41:J:2G4:THE` / `41:J:2G4:TRF` | `MT41J2G4` | 4Gb die x2 / 2 CS | `external_table_confirmed` |
| `41:J:1G8:THE` / `41:J:1G8:TRF` | `MT41J1G8` | 4Gb die x2 / 2 CS | `external_table_confirmed` |
| `41:K:1G4:THD` / `41:K:1G4:THV` | `MT41K1G4` | 2Gb die x2 / 2 CS | `external_confirmed` |
| `41:K:512M8:THD` / `41:K:512M8:THV` | `MT41K512M8` | 2Gb die x2 / 2 CS | `external_confirmed` |
| `41:K:2G4:TRF` / `41:K:2G4:RKB` | `MT41K2G4` | 4Gb die x2 / 2 CS | `external_confirmed` |
| `41:K:1G8:TRF` / `41:K:1G8:RKB` | `MT41K1G8` | 4Gb die x2 / 2 CS | `external_confirmed` |
| `41:K:512M16:TNA` | `MT41K512M16` | 4Gb x16 die x2 / 2 CS | `external_confirmed` |
| `41:K:4G4:KJR` | `MT41K4G4` | 8Gb die x2 / 2 CS | `external_table_confirmed` |
| `41:K:2G8:KJR` | `MT41K2G8` | 8Gb die x2 / 2 CS | `external_table_confirmed` |
| `41:K:1G16:DGA` | `MT41K1G16` | 8Gb x16 die x2 / 2 CS | `external_confirmed` |

反例：`MT41K512M8DA-107:P` 和 `MT41K1G4DA-107:P` 是同 family / config 下的非 TwinDie 封装，不能因为 base PN 形态相似就输出 `dram_die_stack`。

## DDR4 TwinDie

Micron `MT40A` DDR4 TwinDie 同样按 `family + voltage + config + package_code` 判定。x4/x8 TwinDie 是 two-rank / dual CS；x16 TwinDie 是 two x8 die 组合成 single-rank x16，因此输出 `2-die stack, 1 CS`。

| Key | PN family | die stack / CS | source tier |
| --- | --- | --- | --- |
| `40:A:2G4:TRF` | `MT40A2G4` | 4Gb die x2 / 2 CS | `external_confirmed` |
| `40:A:1G8:TRF` | `MT40A1G8` | 4Gb die x2 / 2 CS | `external_confirmed` |
| `40:A:4G4:FSE` / `40:A:4G4:NRE` | `MT40A4G4` | 8Gb die x2 / 2 CS | `external_confirmed` |
| `40:A:2G8:FSE` / `40:A:2G8:NRE` | `MT40A2G8` | 8Gb die x2 / 2 CS | `external_confirmed` |
| `40:A:8G4:BAF` / `40:A:8G4:NEA` | `MT40A8G4` | 16Gb die x2 / 2 CS | `external_table_confirmed` |
| `40:A:4G8:BAF` / `40:A:4G8:NEA` | `MT40A4G8` | 16Gb die x2 / 2 CS | `external_table_confirmed` |
| `40:A:1G16:HBA` / `40:A:1G16:WBU` / `40:A:1G16:KNR` | `MT40A1G16` | x8 die x2 / 1 CS | `external_confirmed` |
| `40:A:2G16:TBB` | `MT40A2G16` | x8 die x2 / 1 CS | `external_confirmed` |

## DDR5 大容量 configuration

Micron DDR5 仍按 `depth x width` 推导容量。24Gb 组件已确认 `6G4` / `3G8` / `1536M16` 这三类结构；32Gb 组件已确认 `4G8`，已有通用表也覆盖 `4G4` / `2G16` 等同密度结构。这里只扩展 density / width / package / speed，不因为 24Gb 或 32Gb 直接推断 stacked die：

| Config | 示例 | 输出 |
| --- | --- | --- |
| `6G4` | `MT60B6G4RW-56B:B` | `24Gb`, `x4` |
| `3G8` | `MT60B3G8RW-64B:B` | `24Gb`, `x8` |
| `1536M16` | `MT60B1536M16RV-56B:B` | `24Gb`, `x16` |
| `4G8` | `MT60B4G8AT-64B:B` | `32Gb`, `x8` |

本轮未找到 Micron standalone DDR5 component 公开 datasheet 明确使用 TwinDie / DDP。MRDIMM、RDIMM 或 SOCAMM2 模块层面的多 die / 3DS 资料不进入 standalone component PN 的 `dram_die_stack` 规则。

## 封装映射

封装映射按 `family token + package code` 建表，不按 package code 单独全局复用；同一个封装 code 在不同产品线可能含义不同。首批只纳入公开资料可交叉确认的样例映射。

| Key | 实际封装 |
| --- | --- |
| `40:BAF` | `78-ball FBGA (10.5x11)` |
| `40:FSE` | `78-ball FBGA (9.5x13)` |
| `40:HBA` | `96-ball FBGA (9.5x14)` |
| `40:KNR` | `96-ball FBGA (7.5x13.5)` |
| `40:NEA` | `78-ball FBGA (7.5x11)` |
| `40:NRE` | `78-ball FBGA (8x12)` |
| `40:SA` | `78-ball FBGA (7.5x11)` |
| `40:TBB` | `96-ball FBGA (7.5x13)` |
| `40:TRF` | `78-ball FBGA (9.5x11.5)` |
| `40:WBU` | `96-ball FBGA (8x14)` |
| `41:DA` | `78-ball FBGA (8x10.5)` |
| `41:DGA` | `96-ball FBGA (9.5x14)` |
| `41:KJR` | `78-ball FBGA (9.5x13)` |
| `41:RKB` | `78-ball FBGA (8x10.5)` |
| `41:THD` | `78-ball FBGA (9x11.5)` |
| `41:THE` | `78-ball FBGA (10.5x12)` |
| `41:THU` | `82-ball FBGA (12.5x15)` |
| `41:THV` | `78-ball FBGA (8x11.5)` |
| `41:TNA` | `96-ball FBGA (10x14)` |
| `41:TRF` | `78-ball FBGA (9.5x11.5)` |
| `42:LF` | `168-ball WFBGA (12x12)` |
| `46:B5` | `90-ball VFBGA (8x13)` |
| `46:P` | `66-pin TSOP` |
| `47:RT` | `84-ball FBGA (9x12.5)` |
| `48:B5` | `90-ball VFBGA (8x13)` |
| `48:P` | `54-pin TSOP II` |
| `51:HF` | `170-ball FBGA (12x14)` |
| `52:PF` | `178-ball FBGA (11.5x11)` |
| `53:FW` | `200-ball TFBGA (10x14.5)` |
| `58:JA` | `190-ball FBGA (10x14)` |
| `60:AT` | `78/117-ball VFBGA` |
| `60:HB` | `82-ball VFBGA (9x11)` |
| `60:HD` | `102-ball VFBGA (7.5x14)` |
| `60:RV` | `102/153-ball VFBGA` |
| `60:RW` | `78-ball VFBGA (8x11)` |
| `60:RZ` | `78-ball VFBGA (7.5x11)` |
| `61:JE` | `180-ball FBGA (12x14)` |
| `61:KPA` | `180-ball FBGA (12x14)` |
| `62:DS` | `200-ball WFBGA (10x14.5)` |
| `62:EK` | `441-ball TFBGA` |
| `68:DF` | `266-ball FBGA (12x14x1.1)` |

## 首批样例

| PN | 产品线 | 关键输出 |
| --- | --- | --- |
| `MT40A1G8SA-075-E` | DDR4 SDRAM | `8Gb`, `x8`, `78-ball FBGA`, `DDR4-2666 CL19`, `Rev E` |
| `MT40A2G4TRF-093E:A` | DDR4 SDRAM | `8Gb`, `x4`, `78-ball FBGA`, `2-die stack, 2 CS`, `DDR4-2133 CL15`, `Rev A` |
| `MT40A2G8NRE-083E:B` | DDR4 SDRAM | `16Gb`, `x8`, `78-ball FBGA`, `2-die stack, 2 CS`, `DDR4-2400 CL16`, `Rev B` |
| `MT40A4G8NEA-062E:F` | DDR4 SDRAM | `32Gb`, `x8`, `78-ball FBGA`, `2-die stack, 2 CS`, `DDR4-3200 CL22`, `Rev F` |
| `MT40A1G16WBU-083E:B` | DDR4 SDRAM | `16Gb`, `x16`, `96-ball FBGA`, `2-die stack, 1 CS`, `DDR4-2400 CL16`, `Rev B` |
| `MT40A2G16TBB-062E:F` | DDR4 SDRAM | `32Gb`, `x16`, `96-ball FBGA`, `2-die stack, 1 CS`, `DDR4-3200 CL22`, `Rev F` |
| `CT40A1G8SA-62M:E` | Crucial DDR4 SDRAM | `8Gb`, `x8`, `78-ball FBGA`, `Crucial DDR4 speed bin 62M`, `Rev E` |
| `MT60B2G8HB-48B-IT-A` | DDR5 SDRAM | `16Gb`, `x8`, `82-ball VFBGA`, `DDR5-4800B`, `Industrial`, `Rev A` |
| `MT60B3G8RW-64B:B` | DDR5 SDRAM | `24Gb`, `x8`, `78-ball VFBGA`, `DDR5-6400B`, `Rev B` |
| `MT60B1536M16RV-56B:B` | DDR5 SDRAM | `24Gb`, `x16`, `102/153-ball VFBGA`, `DDR5-5600B`, `Rev B` |
| `MT60B4G8AT-64B:B` | DDR5 SDRAM | `32Gb`, `x8`, `78/117-ball VFBGA`, `DDR5-6400B`, `Rev B` |
| `MT41K512M8DA-107:P` | DDR3 SDRAM | `4Gb`, `x8`, `78-ball FBGA`, `1866 MT/s / 933 MHz`, `Rev P` |
| `MT41K2G4RKB-107:P` | DDR3 SDRAM | `8Gb`, `x4`, `78-ball FBGA`, `2-die stack, 2 CS`, `1866 MT/s / 933 MHz`, `Rev P` |
| `MT41K1G16DGA-125:A` | DDR3 SDRAM | `16Gb`, `x16`, `96-ball FBGA`, `2-die stack, 2 CS`, `1600 MT/s / 800 MHz`, `Rev A` |
| `MT47H128M16RT-25E:C` | DDR2 SDRAM | `2Gb`, `x16`, `84-ball FBGA`, `DDR2-800`, `Rev C` |
| `MT46V32M16P-5B-IT-J` | DDR SDRAM | `512Mb`, `x16`, `66-pin TSOP`, `DDR-400`, `Industrial`, `Rev J` |
| `MT46H32M32LFB5-5 IT:B` | LPDDR | `1Gb`, `x32`, `90-ball VFBGA`, `Single die`, `200 MHz`, `Rev B` |
| `MT48LC16M8A2P-6A:L` | SDRAM | `128Mb`, `x8`, `54-pin TSOP II`, `166 MHz`, `Rev L` |
| `MT48H16M32LFB5-75:A` | LPSDR | `512Mb`, `x32`, `90-ball VFBGA`, `Single die`, `133 MHz`, `Rev A` |
| `MT42L128M32D1LF-25 WT:A` | LPDDR2 | `4Gb`, `x32`, `168-ball WFBGA`, `Single die`, `Rev A` |
| `MT52L512M32D2PF-107 WT:B` | LPDDR3 | `16Gb`, `x32`, `178-ball FBGA`, `2-die stack`, `Rev B` |
| `MT53E1G32D2FW-046-AIT-A` | LPDDR4 | `32Gb`, `x32`, `200-ball TFBGA`, `2-die stack`, `LPDDR4-4266`, `Rev A` |
| `MT62F1G32D4DS-031-WT-B` | LPDDR5 | `32Gb`, `x32`, `200-ball WFBGA`, `4-die stack`, `LPDDR5-6400`, `Rev B` |
| `MT51J256M32HF-80:A` | GDDR5 | `8Gb`, `x32`, `170-ball FBGA`, `GDDR5-8Gbps`, `Rev A` |
| `MT58K256M32JA-100:A` | GDDR5X | `8Gb`, `x32`, `190-ball FBGA`, `GDDR5X-10Gbps`, `Rev A` |
| `MT61K256M32JE-14:A` | GDDR6 | `8Gb`, `x32`, `180-ball FBGA`, `GDDR6-14Gbps`, `Rev A` |
| `MT61K512M32KPA-24-U` | GDDR6X | `16Gb`, `x32`, `180-ball FBGA`, `GDDR6X-24Gbps`, `Rev U` |
