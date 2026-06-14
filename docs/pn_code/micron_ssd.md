# Micron SSD PN 编码

采集日期：2026-06-15

本文档记录 Micron `MTFD` Flash Drive / SSD PN ordering。规则按 Micron 官方 numbering 表拆 token，不维护完整 PN 白名单；未知后续 token 只会少输出对应字段，不应阻断已能确定的 vendor、接口、form factor、容量和 NAND type。

## 外部资料

- Micron 官方 `SSD Part Numbering System` PDF (`numssd.pdf`)：
  - `3xx and 4xx Series SSD Part Numbering System` 页，Rev. 03/03/14，给出 `MT FD <interface> <form factor> <density> <NAND type> <product family> - <sector> <NAND component> <BOM> <security> <hardware feature> <temperature> <status>` 结构。
  - `420 and 5xx Series SSD Part Numbering System` 页，Rev. 11/11/15，给出 `MT FD <interface> <form factor> <density> <NAND type> <product family> - <BOM> <NAND component> <sector> <firmware> <additional features> <customer> <status>` 结构。
- Micron 官方 2100AI SSD datasheet 截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK128`、`MTFDHBK256`、`MTFDHBK512`、`MTFDHBK1T0`；feature/options 页给出 form factor、density、product family、BOM、operating temperature 与 customer designator marking；ordering 图给出 `MT FD H XX XXX T XX - X AT 1 2 XX YY ES` 结构和完整 base PN 表。
- Micron 官方 2100AT SSD datasheet 截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK1T0`；ordering 图给出同一结构，其中 `DQ = 2100AT`，公开 PN 表列出 `MTFDHBL064TDQ-1AT12ATYY`、`MTFDHBL128TDQ-1AT12ATYY`、`MTFDHBL256TDQ-1AT12ATYY`、`MTFDHBL512TDQ-1AT12ATYY`、`MTFDHBM1T0TDQ-1AT12ATYY`、`MTFDHBK1T0TDQ-1AT12ATYY`。
- Micron 官方 P320h/P320s/P420m PCIe NAND SSD datasheet：给出 `G = PCIe Gen2`，P320 的 `AL/AR/AU` form factor、`AH = P320`、`N = 16Gb SLC x8 3.3V (34nm)`，以及 P420m 的 `AL/AR` form factor、`AX = P420m`、`J = 32Gb MLC x8 3.3V (25nm)`。
- Micron 官方 M510 / M500IT / 5400 / 6500 ION ordering 图：确认 M510/M500IT 的 `AZ/BD` 系列 token、M500IT 的 `032` 容量、`AY = M.2 60mm x 22mm x 3.5mm`、`AI` auto industrial temperature 与 `IT` 工业等级；确认 5400 的 `GA/GB/GC` 系列、`BC = 512Gb TLC x8 2.5V (3D)`；确认 6500 ION 的 `K = PCIe Gen4`、`CC/BN` form factor、`30T7 = 30,720GB`、`GR = 6500 ION`、sector size 和 OCP firmware token。
- Micron 官方 4100AT part catalog 和 4150AT product flyer / press release：确认 `MTFDKEL128THE-1BM15ATYY` 属于 4100AT，PCIe Gen4，-40°C to +105°C，BGA-291 16x20x1.3；确认 4150AT 是 PCIe Gen4/NVMe automotive SSD，容量覆盖 220GB、440GB、900GB 和 1.8TB，工作温区 -40°C to +115°C。
- Micron 官方 2500 / 2650 / 3500 / 4600 / 9400 ordering 图：确认 2500/2650/3500 的 PCIe Gen4 M.2 token、容量和 family；确认 4600 的 `L = PCIe Gen5`、`HJ = 4600`、`BP = 1024Gb TLC x8 2.5V (3D)`；确认 9400 的 `CC = U.3/U.2`、`GH/GJ = 9400 PRO/MAX` 和容量 token。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-ssd-token.json`
- `vendor.micron.ssd.modern.v1`
- `vendor.micron.ssd.p420m.v1`
- `vendor.micron.ssd.420-5xx.v1`
- `vendor.micron.ssd.3xx-4xx.v1`
- `vendor.micron.ssd.5400.v1`
- `vendor.micron.ssd.6500-ion.v1`
- `vendor.micron.ssd.4100at.v1`
- `vendor.micron.ssd.4150at.v1`
- `vendor.micron.ssd.client-gen4.v1`
- `vendor.micron.ssd.4600.v1`
- `vendor.micron.ssd.9400.v1`
- `vendor.micron.ssd.generic.v1`

## 通用 token

| token | 含义 |
| --- | --- |
| `MT` | Micron Technology |
| `FD` | Flash Drive / SSD |
| interface `A/B/D` | SATA 1.5 / 3.0 / 6.0 Gb/s，`device.productType = "sata"` |
| interface `E` | SAS 6.0 Gb/s，`device.productType = "sas"` |
| interface `F/G` | PCIe Gen1 / Gen2；当前只输出 `storage_interface`，不强行标成 NVMe |
| interface `H` | 2100AI/AT 资料确认的 PCIe Gen3 NVMe SSD，`device.productType = "nvme"` |
| interface `K` | 6500 ION 资料确认的 PCIe Gen4 SSD，`device.productType = "nvme"` |
| interface `L` | 4600 资料确认的 PCIe Gen5 SSD，`device.productType = "nvme"` |
| density | PDF 表中的 GB/TB code，落库为 Mbit |
| NAND type `S/M/T/Q` | SLC / MLC / TLC / QLC |
| production status `ES/MS` | Engineering Sample / Mechanical samples |

SSD 外形规格使用 `form_factor`；只有 2100AI/AT 等资料确认 BGA/M.2 package 细节时才输出 `package`。

## 3xx / 4xx

| 结构 | 含义 |
| --- | --- |
| `MTFD` + interface + form factor + density + NAND type + product family + optional suffix | Micron 3xx / 4xx SSD |
| product family `AE/AF/AG/AJ/AL/AH/AM` | `C200/P200`、`eUSB`、`C300`、`e230`、`P300`、`P320`、`C400` |
| suffix | sector size、1-character NAND component、BOM revision、security feature、hardware feature、temperature、production status |

P320h/P320s datasheet 的 suffix 末尾为 production status；规则用可选 `ES/MS` 捕获，避免把状态吃进未公开的 code 字段。

## P420m

| 结构 | 含义 |
| --- | --- |
| `MT FD G <AL/AR> <density> M AX - <sector> J <BOM> <hardware> <status>` | Micron P420m PCIe Gen2 SSD |
| form factor `AL/AR` | `AL = 2.5-inch, 15mm`；`AR = Half height, half length x8` |
| density `350/700/0700/1400` | 350GB、700GB、1.4TB |
| NAND component `J` | 32Gb MLC x8 3.3V (25nm) |

## 420 / 5xx

| 结构 | 含义 |
| --- | --- |
| `MTFD` + interface + form factor + density + NAND type + product family + optional suffix | Micron 420 / 5xx SSD |
| product family `AV/AY/AZ/BB/BD/BP` | `M500`、`M550`、`M510`、`M500DC`、`M500IT`、`M510DC` |
| suffix | BOM revision、2-character NAND component、sector size、extended firmware、additional features、customer designator、production status |

M500IT chart 中部分 `AH/AK` component token 只给出 density、x8、3.3V 和 20nm，没有稳定声明 SLC/MLC；公开 `cell_level` 由 NAND type token `S/M` 决定，component 文本不重复 cell level。`AI` 输出为 `Auto industrial temperature`，`IT` 输出为 `Industrial temperature and grade`。

## 5400

| 结构 | 含义 |
| --- | --- |
| `MT FD D <AK/AV> <density> T <family> - <BOM> BC <sector> <firmware> <hardware> <customer> <status>` | Micron 5400 SATA SSD |
| product family `GC/GA/GB` | `5400 BOOT`、`5400 PRO`、`5400 MAX` |
| density `240/480/960/1T9/3T8/7T6` | 240GB、480GB、960GB、1920GB、3840GB、7680GB |
| NAND component `BC` | 512Gb TLC x8 2.5V (3D) |
| firmware `5/6` | SED TCG OPAL / SED TCG eSSC |
| hardware `TA` | TAA Compliant |

## 6500 ION

| 结构 | 含义 |
| --- | --- |
| `MT FD K <CC/BN> 30T7 T GR - <BOM> <component> <sector> <firmware> <hardware> <customer>` | Micron 6500 ION PCIe Gen4 SSD |
| form factor `CC/BN` | `U.3, 2.5-inch, 15mm, SFF-8639` / `E1.L, 9.5mm including enclosure` |
| density `30T7` | 30,720GB |
| sector `1/4` | 512 byte / 4096 byte |
| firmware `D/J` | OCP 2.0 + TCG Opal / OCP 2.0 + Non-SED |

6500 ION 截图未给出 `BK` component token 的公开释义，规则只把它作为内部 token 消耗，不输出 `nand_component`。

## 4100AT / 4150AT

| 结构 | 含义 |
| --- | --- |
| `MT FD K EL <density> T HE - <BOM> <component> 1 5 AT <customer> <status>` | Micron 4100AT PCIe Gen4 automotive SSD |
| `MT FD K <EL/EM/EP/ER> <density> T GK - <BOM> <component> <sector> <firmware> <hardware> <customer> <status>` | Micron 4150AT PCIe Gen4 automotive SSD |
| 4100AT density `128/256/512/1T0` | 128GB、256GB、512GB、1024GB |
| 4150AT density `220/440/900/1T8` | 220GB、440GB、900GB、1.8TB |
| 4100AT package `EL` | BGA-291, 16x20x1.3 |
| 4100AT temperature `AT` | Automotive (-40°C to +105°C) |
| 4150AT product temperature | Automotive (-40°C to +115°C) |

4100AT / 4150AT 的 `BM` component、firmware、hardware 和 customer token 在当前资料中没有稳定公开释义，规则只消费 token，不输出 code 或猜测描述。

## 2500 / 2650 / 3500

| 结构 | 含义 |
| --- | --- |
| `MT FD K <BA/CD/BK> <density> <Q/T> <family> - <BOM> <component> 1 <firmware> <hardware> <customer> <status>` | Micron PCIe Gen4 M.2 SSD |
| form factor `BA/CD/BK` | M.2 80mm x 22mm / 42mm x 22mm / 30mm x 22mm，x4 PCIe |
| product family `GN/GW/GD` | 2500 / 2650 / 3500 |
| 2500 density `512/1T0/2T0` | 512GB、1024GB、2048GB |
| 2650 density `256/512/1T0` | 256GB、512GB、1024GB |
| 3500 density `512/1T0/2T0` | 512GB、1024GB、2048GB |
| firmware `A/5` | non-SED TCG Pyrite / SED TCG Opal |

截图未给出 `BD/BP/BK` component token 的公开释义，规则只消费 token，不输出 `nand_component`。

## 4600

| 结构 | 含义 |
| --- | --- |
| `MT FD L BA <density> T HJ - <BOM> BP 1 <firmware> AB YY` | Micron 4600 PCIe Gen5 M.2 SSD |
| density `512/1T0/2T0/4T0` | 512GB、1024GB、2048GB、4096GB |
| NAND component `BP` | 1024Gb TLC x8 2.5V (3D) |
| firmware `A/5/K` | non-SED TCG Pyrite / SED TCG Opal / MSFT |

## 9400

| 结构 | 含义 |
| --- | --- |
| `MT FD K CC <density> T <GH/GJ> - <BOM> <component> <sector> <firmware> <hardware> <customer>` | Micron 9400 PCIe Gen4 U.3/U.2 SSD |
| form factor `CC` | U.3/U.2, 2.5-inch, 15mm, SFF-8639 |
| product family `GH/GJ` | 9400 PRO / 9400 MAX |
| density `6T4/7T6/12TB/15T3/25T6/30T7` | 6400GB、7680GB、12800GB、15360GB、25600GB、30720GB |

截图未给出 `BC` component 和 `Z` firmware token 的公开释义，规则只消费 token，不输出 component / firmware 描述。

## 2100AI / 2100AT

| 结构 | 含义 |
| --- | --- |
| `MT FD H <form> <density> T <family> - <BOM> AT 1 <firmware> <temperature> YY <status>` | Micron 2100AI / 2100AT PCIe NVMe SSD |
| form factor `BL/BM/BK` | `BL/BM` 为 BGA291 type 1620，`BK` 为 M.2 Type 2230 M-key |
| product family `DP/DQ` | `DP = 2100AI`，`DQ = 2100AT` |
| NAND component `AT` | 512Gb TLC x8 3.3V (3D) |
| temperature `AI/AT` | `AI = Automotive support, Industrial (-40°C to +95°C)`；`AT = Automotive (-40°C to +105°C)` |

温区说明：2100 feature/options 页把 Grade 3 extended 的 marking 写为 `IT`，ordering 图和完整 base PN 表在 PN 温区位置使用 `AI`。当前 `vendor.micron.ssd.modern.v1` 只把 ordering 图中的 `AI` / `AT` 当作 2100 PN 温区 token 解析；`IT` 不进入该具体规则，但低优先级 generic 规则仍可保留基础 SSD 身份字段。

## 输出字段

- `density`
- `product_family`
- `product_version`
- `storage_interface`
- `form_factor`
- `cell_level`
- `nand_technology`
- `nand_component`
- `component_density`
- `component_width`
- `component_voltage`
- `sector_size`
- `generation_info`
- `product_class`
- `special_option`
- `operation_temperature`
- `prod_status`
- `package`

`form factor`、`product family`、`BOM`、`NAND component`、`sector size`、`firmware`、`temperature`、`customer designator` 和其他原始 code 只用于规则内部解析，不进入公开 `*_code` fields。

## 测试样例

- `MTFDDAC128MAG-1G12AA`
- `MTFDDAK120MAV-1AE12ABYYES`
- `MTFDEAC200MBB-1AE12ABYY`
- `MTFDDAV120MAZ-1AE12ABHAES`
- `MTFDDAK032SBD-1AH12ITYY`
- `MTFDDAK064SBD-1AK12ITYY`
- `MTFDGAL175SAH-1NA4ABES`
- `MTFDGAR1400MAX-1JAABES`
- `MTFDDAK480TGA-1BC16ABYYES`
- `MTFDDAV1T9TGB-1BC15TAYY`
- `MTFDKCC30T7TGR-1BK1JABYY`
- `MTFDKBN30T7TGR-1BK4DABYY`
- `MTFDKEL128THE-1BM15ATYY`
- `MTFDKEL128THE-ABM15ATYYES`
- `MTFDKEL220TGK-1BM45A2YY`
- `MTFDKER1T8TGK-ABM45A2YYES`
- `MTFDDAY120MBD-AAK12AIYYES`
- `MTFDDAY240MBD-1AK12AIYY`
- `MTFDDAK060MBD-2AH12ITYY`
- `MTFDKBA512QGN-1BD1AABYYES`
- `MTFDKCD256TGW-1BP15ABYYES`
- `MTFDKBA2T0TGD-1BK15ABYYES`
- `MTFDLBA4T0THJ-1BP1KABYY`
- `MTFDKCC12TBTGJ-1BC4ZABYY`
- `MTFDDAC256MZZ-XYZ`
- `MTFDHBL064TDP-1AT12AIYY`
- `MTFDHBM1T0TDP-1AT12AIYY`
- `MTFDHBK1T0TDP-1AT12AIYY`
- `MTFDHBL064TDQ-1AT12ATYY`
- `MTFDHBK128TDQ-1AT12ATYY`
- `MTFDHBK1T0TDQ-1AT12ATYY`
- `MTFDHBL128TDP-AAT12AIYYES`

## 注意

Micron `MTFD` SSD 归入 `device.chipKind = "managed_nand"`。`device.productType` 按接口输出 `sata`、`sas` 或 `nvme`；旧 PCIe Gen1 / Gen2 资料只确认 PCIe 代际时，先输出 `storage_interface`，不把它强行标成 NVMe。
