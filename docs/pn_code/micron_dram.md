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

## 封装映射

封装映射按 `family token + package code` 建表，不按 package code 单独全局复用；同一个封装 code 在不同产品线可能含义不同。首批只纳入公开资料可交叉确认的样例映射。

| Key | 实际封装 |
| --- | --- |
| `40:SA` | `78-ball FBGA (7.5x11)` |
| `41:DA` | `78-ball FBGA (8x10.5)` |
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
| `60:HB` | `82-ball VFBGA (9x11)` |
| `61:JE` | `180-ball FBGA (12x14)` |
| `61:KPA` | `180-ball FBGA (12x14)` |
| `62:DS` | `200-ball WFBGA (10x14.5)` |
| `62:EK` | `441-ball TFBGA` |
| `68:DF` | `266-ball FBGA (12x14x1.1)` |

## 首批样例

| PN | 产品线 | 关键输出 |
| --- | --- | --- |
| `MT40A1G8SA-075-E` | DDR4 SDRAM | `8Gb`, `x8`, `78-ball FBGA`, `DDR4-2666 CL19`, `Rev E` |
| `CT40A1G8SA-62M:E` | Crucial DDR4 SDRAM | `8Gb`, `x8`, `78-ball FBGA`, `Crucial DDR4 speed bin 62M`, `Rev E` |
| `MT60B2G8HB-48B-IT-A` | DDR5 SDRAM | `16Gb`, `x8`, `82-ball VFBGA`, `DDR5-4800B`, `Industrial`, `Rev A` |
| `MT41K512M8DA-107:P` | DDR3 SDRAM | `4Gb`, `x8`, `78-ball FBGA`, `1866 MT/s / 933 MHz`, `Rev P` |
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
