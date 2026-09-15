# Micron SSD PN 编码

采集日期：2026-06-15

本文档记录 Micron `MTFD` 闪存 Drive / SSD PN 订购编码。规则按 Micron 官方编码表拆编码段，不维护完整 PN 白名单；未知后续编码段只会少输出对应字段，不应阻断已能确定的厂商、接口、外形规格、容量和 NAND 类型。

## 外部资料

- Micron 官方 `SSD Part Numbering System` PDF (`numssd.pdf`)：
  - `3xx and 4xx Series SSD Part Numbering System` 页，Rev. 03/03/14，给出 `MT FD <interface> <form factor> <density> <NAND type> <product family> - <sector> <NAND component> <BOM> <security> <hardware feature> <temperature> <status>` 结构。
  - `420 and 5xx Series SSD Part Numbering System` 页，Rev. 11/11/15，给出 `MT FD <interface> <form factor> <density> <NAND type> <product family> - <BOM> <NAND component> <sector> <firmware> <additional features> <customer> <status>` 结构。
- Micron 官方 2100AI SSD 数据手册截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK128`、`MTFDHBK256`、`MTFDHBK512`、`MTFDHBK1T0`；特性/选项页给出外形规格、容量、产品系列、BOM、工作温度与客户标识丝印；订购编码图给出 `MT FD H XX XXX T XX - X AT 1 2 XX YY ES` 结构和完整基础 PN 表。
- Micron 官方 2100AT SSD 数据手册截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK1T0`；订购编码图给出同一结构，其中 `DQ = 2100AT`，公开 PN 表列出 `MTFDHBL064TDQ-1AT12ATYY`、`MTFDHBL128TDQ-1AT12ATYY`、`MTFDHBL256TDQ-1AT12ATYY`、`MTFDHBL512TDQ-1AT12ATYY`、`MTFDHBM1T0TDQ-1AT12ATYY`、`MTFDHBK1T0TDQ-1AT12ATYY`。
- Micron 官方 P320h/P320s/P420m PCIe NAND SSD 数据手册：给出 `G = PCIe Gen2`，P320 的 `AL/AR/AU` 外形规格、`AH = P320`、`N = 16Gb SLC x8 3.3V (34nm)`，以及 P420m 的 `AL/AR` 外形规格、`AX = P420m`、`J = 32Gb MLC x8 3.3V (25nm)`。
- Micron 官方 M510 / M500IT / 5400 / 6500 ION 订购编码图：确认 M510/M500IT 的 `AZ/BD` 系列编码段、M500IT 的 `032` 容量、`AY = M.2 60mm x 22mm x 3.5mm`、`AI` 车规工业级温度与 `IT` 工业等级；确认 5400 的 `GA/GB/GC` 系列、`BC = 512Gb TLC x8 2.5V (3D)`；确认 6500 ION 的 `K = PCIe Gen4`、`CC/BN` 外形规格、`30T7 = 30,720GB`、`GR = 6500 ION`、扇区大小和 OCP 固件编码段。
- Micron 官方 M500IT mSATA / 2.5-英寸订购编码图：确认 `AT = mSATA`、`AK = 2.5-inch 7mm`、`060/120/160/240` 容量、`AE/AH/AK` NAND 芯片、BOM `A/1/2`、`AI` 车规工业级温度、`IT` 工业级温度、`RA = Bosch` 客户标识、`ES/MS` 生产状态。
- Micron 官方 M510 mSATA 订购编码图：确认 M510 `AT = mSATA` 外形规格，`HA = HP (Client)` 客户标识，`AA/AB/AC/Z/ZZ` 特性集 尾部编码段，以及 `1/2` BOM 修订版。
- Micron 官方 4100AT 产品目录和 4150AT 产品单页 / 新闻稿：确认 `MTFDKEL128THE-1BM15ATYY` 属于 4100AT，PCIe Gen4，-40°C 至 +105°C，BGA-291 16x20x1.3；确认 4150AT 是 PCIe Gen4/NVMe 车规 SSD，容量覆盖 220GB、440GB、900GB 和 1.8TB，工作温区 -40°C 至 +115°C。
- Micron 官方 2500 / 2650 / 3500 / 4600 / 9400 订购编码图：确认 2500/2650/3500 的 PCIe Gen4 M.2 编码段、容量和系列；确认 4600 的 `L = PCIe Gen5`、`HJ = 4600`、`BP = 1024Gb TLC x8 2.5V (3D)`；确认 9400 的 `CC = U.3/U.2`、`GH/GJ = 9400 PRO/MAX` 和容量编码段。
- Micron 官方 EK470 / 6550 ION / 7450 / 7500 / 7600 订购编码图：确认 `MTED` 嵌入式闪存盘 EK470 的 SATA 3.0、40mm x 50mm、8GB/16GB、`K = 32Gb NAND x8 3.3V (25nm)`；确认 6550 ION / 7600 的 PCIe Gen5、7450 / 7500 的 PCIe Gen4、各系列外形规格、容量、系列、扇区大小、OCP 固件编码段和 7600 `BP = 1024Gb TLC x8 2.5V`。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-ssd-token.json`
- `vendor.micron.ssd.modern.v1`
- `vendor.micron.ssd.p420m.v1`
- `vendor.micron.ssd.420-5xx.v1`
- `vendor.micron.ssd.3xx-4xx.v1`
- `vendor.micron.ssd.ek470.v1`
- `vendor.micron.ssd.5400.v1`
- `vendor.micron.ssd.6500-ion.v1`
- `vendor.micron.ssd.datacenter-gen4-gen5.v1`
- `vendor.micron.ssd.4100at.v1`
- `vendor.micron.ssd.4150at.v1`
- `vendor.micron.ssd.client-gen4.v1`
- `vendor.micron.ssd.4600.v1`
- `vendor.micron.ssd.9400.v1`
- `vendor.micron.ssd.generic.v1`

## 通用编码段

| 编码段 | 含义 |
| --- | --- |
| `MT` | Micron 技术 |
| `FD` | 闪存 Drive / SSD |
| `ED` | 嵌入式闪存 Drive |
| 接口 `A/B/D` | SATA 1.5 / 3.0 / 6.0 Gb/s，`device.productType = "sata"` |
| 接口 `E` | SAS 6.0 Gb/s，`device.productType = "sas"` |
| 接口 `F/G` | PCIe Gen1 / Gen2；当前只输出 `storage_interface`，不强行标成 NVMe |
| 接口 `H` | 2100AI/AT 资料确认的 PCIe Gen3 NVMe SSD，`device.productType = "nvme"` |
| 接口 `K` | 6500 ION 资料确认的 PCIe Gen4 SSD，`device.productType = "nvme"` |
| 接口 `L` | 4600 资料确认的 PCIe Gen5 SSD，`device.productType = "nvme"` |
| 容量 | PDF 表中的 GB/TB 编码，落库为 Mbit |
| NAND 类型 `S/M/T/Q` | SLC / MLC / TLC / QLC |
| 生产状态 `ES/MS` | 工程样品 / 机械样品 |

SSD 外形规格使用 `form_factor`；只有 2100AI/AT 等资料确认 BGA/M.2 封装细节时才输出 `package`。

## 3xx / 4xx

| 结构 | 含义 |
| --- | --- |
| `MTFD` + 接口 + 外形规格 + 容量 + NAND 类型 + 产品系列 + 可选后缀 | Micron 3xx / 4xx SSD |
| 产品系列 `AE/AF/AG/AJ/AL/AH/AM` | `C200/P200`、`eUSB`、`C300`、`e230`、`P300`、`P320`、`C400` |
| 后缀 | 扇区大小、1-字符 NAND 芯片、BOM 修订版、安全特性、硬件特性、温度、生产状态 |

P320h/P320s 数据手册的后缀末尾为生产状态；规则用可选 `ES/MS` 捕获，避免把状态吃进未公开的编码字段。

## P420m

| 结构 | 含义 |
| --- | --- |
| `MT FD G <AL/AR> <density> M AX - <sector> J <BOM> <hardware> <status>` | Micron P420m PCIe Gen2 SSD |
| 外形规格 `AL/AR` | `AL = 2.5-inch, 15mm`；`AR = Half height, half length x8` |
| 容量 `350/700/0700/1400` | 350GB、700GB、1.4TB |
| NAND 芯片 `J` | 32Gb MLC x8 3.3V (25nm) |

## 420 / 5xx

| 结构 | 含义 |
| --- | --- |
| `MTFD` + 接口 + 外形规格 + 容量 + NAND 类型 + 产品系列 + 可选后缀 | Micron 420 / 5xx SSD |
| 产品系列 `AV/AY/AZ/BB/BD/BP` | `M500`、`M550`、`M510`、`M500DC`、`M500IT`、`M510DC` |
| M500IT 外形规格 `AK/AT/AY` | `2.5-inch, 7mm`、`mSATA`、`M.2, 60mm x 22mm x 3.50mm` |
| M500IT 容量 `032/060/064/120/128/160/240/256` | 32GB、60GB、64GB、120GB、128GB、160GB、240GB、256GB |
| 后缀 | BOM 修订版、2-字符 NAND 芯片、扇区大小、扩展固件、附加特性、客户标识、生产状态 |

M500IT 图表中部分 `AH/AK` 芯片编码段只给出容量、x8、3.3V 和 20nm，没有稳定声明 SLC/MLC；公开 `cell_level` 由 NAND 类型编码段 `S/M` 决定，芯片文本不重复单元类型。`AE` 明确为 `128Gb MLC x8 3.3V (20nm)`。`AI` 输出为 `Auto industrial temperature`，`IT` 输出为 `Industrial temperature and grade`。

M500 / M510 / M500IT 图表中 `YY/HA/RA` 等客户标识当前只作为内部编码段消费，避免在公开字段中输出客户代码或把客户编码当作产品属性。

## 5400

| 结构 | 含义 |
| --- | --- |
| `MT FD D <AK/AV> <density> T <family> - <BOM> BC <sector> <firmware> <hardware> <customer> <status>` | Micron 5400 SATA SSD |
| 产品系列 `GC/GA/GB` | `5400 BOOT`、`5400 PRO`、`5400 MAX` |
| 容量 `240/480/960/1T9/3T8/7T6` | 240GB、480GB、960GB、1920GB、3840GB、7680GB |
| NAND 芯片 `BC` | 512Gb TLC x8 2.5V (3D) |
| 固件 `5/6` | SED TCG OPAL / SED TCG eSSC |
| 硬件 `TA` | TAA 合规 |

## EK470

| 结构 | 含义 |
| --- | --- |
| `MT ED B TH <008/016> M BA - 1 K 1 <optional status>` | Micron EK470 嵌入式 SATA SSD |
| 接口 `B` | SATA 3.0 Gb/s |
| 外形规格 `TH` | SSD, 40mm x 50mm |
| 容量 `008/016` | 8GB / 16GB |
| NAND 芯片 `K` | 32Gb NAND x8 3.3V (25nm) |

EK470 图中 `M` 位只标注为 NAND 闪存，本规则只消费该编码段，不从它推断公开 `cell_level`。

## 6500 ION

| 结构 | 含义 |
| --- | --- |
| `MT FD K <CC/BN> 30T7 T GR - <BOM> <component> <sector> <firmware> <hardware> <customer>` | Micron 6500 ION PCIe Gen4 SSD |
| 外形规格 `CC/BN` | `U.3, 2.5-inch, 15mm, SFF-8639` / `E1.L, 9.5mm including enclosure` |
| 容量 `30T7` | 30,720GB |
| 扇区 `1/4` | 512 字节 / 4096 字节 |
| 固件 `D/J` | OCP 2.0 + TCG Opal / OCP 2.0 + Non-SED |

6500 ION 截图未给出 `BK` 芯片编码段的公开释义，规则只把它作为内部编码段消耗，不输出 `nand_component`。

## 6550 ION / 7450 / 7500 / 7600

| 结构 | 含义 |
| --- | --- |
| `MT FD <K/L> <form> <density> T <family> - <BOM> <component> <sector> <firmware> <feature> YY <status>` | Micron 数据中心 PCIe SSD |
| 接口 `K/L` | PCIe Gen4 / PCIe Gen5 |
| 6550 外形规格 `AL/BN/BQ` | U.2 15mm / E1.L 9.5mm / E3.S 1T 7.5mm |
| 7450 外形规格 `BA/BG/BZ/CE/BU` | M.2 80mm / M.2 110mm / E1.S 5.9mm / E1.S 15mm / E1.S 25mm |
| 7500 外形规格 `CC` | U.3, 2.5-英寸, 15mm, SFF-8639 |
| 7600 外形规格 `AL/BT/CE/BQ` | U.2 / E1.S 9.5mm / E1.S 15mm / E3.S 1T 7.5mm |
| 产品系列 `HL/FR/FS/GP/GQ/HG/HS` | 6550 ION / 7450 PRO / 7450 最高 / 7500 PRO / 7500 最高 / 7600 PRO / 7600 最高 |
| 6550 容量 `30T7/61T4` | 30.72TB / 61.44TB |
| 7450 容量 `400/480/800/960/1T6/1T9/3T2/3T8/6T4/7T6` | 400GB ... 7680GB |
| 7500 / 7600 容量 `800/960/1T6/1T9/3T2/3T8/6T4/7T6/12T8/15T3` | 800GB ... 15,360GB |
| 7600 NAND 芯片 `BP` | 1024Gb TLC x8 2.5V |

7450 / 7500 的 `BC/BK` 芯片编码段和 6550 的 `BK` 芯片编码段当前没有公开芯片释义，规则只消费编码段，不输出芯片描述。固件由系列 + 固件编码段组合解析，避免把不同系列的 `D/J/Z/5` 混用。

## 4100AT / 4150AT

| 结构 | 含义 |
| --- | --- |
| `MT FD K EL <density> T HE - <BOM> <component> 1 5 AT <customer> <status>` | Micron 4100AT PCIe Gen4 车规 SSD |
| `MT FD K <EL/EM/EP/ER> <density> T GK - <BOM> <component> <sector> <firmware> <hardware> <customer> <status>` | Micron 4150AT PCIe Gen4 车规 SSD |
| 4100AT 容量 `128/256/512/1T0` | 128GB、256GB、512GB、1024GB |
| 4150AT 容量 `220/440/900/1T8` | 220GB、440GB、900GB、1.8TB |
| 4100AT 封装 `EL` | BGA-291, 16x20x1.3 |
| 4100AT 温度 `AT` | 车规 (-40°C 至 +105°C) |
| 4150AT 产品温度 | 车规 (-40°C 至 +115°C) |

4100AT / 4150AT 的 `BM` 芯片、固件、硬件和客户编码段在当前资料中没有稳定公开释义，规则只消费编码段，不输出编码或猜测描述。

## 2500 / 2650 / 3500

| 结构 | 含义 |
| --- | --- |
| `MT FD K <BA/CD/BK> <density> <Q/T> <family> - <BOM> <component> 1 <firmware> <hardware> <customer> <status>` | Micron PCIe Gen4 M.2 SSD |
| 外形规格 `BA/CD/BK` | M.2 80mm x 22mm / 42mm x 22mm / 30mm x 22mm，x4 PCIe |
| 产品系列 `GN/GW/GD` | 2500 / 2650 / 3500 |
| 2500 容量 `512/1T0/2T0` | 512GB、1024GB、2048GB |
| 2650 容量 `256/512/1T0` | 256GB、512GB、1024GB |
| 3500 容量 `512/1T0/2T0` | 512GB、1024GB、2048GB |
| 固件 `A/5` | 非 SED TCG Pyrite / SED TCG Opal |

截图未给出 `BD/BP/BK` 芯片编码段的公开释义，规则只消费编码段，不输出 `nand_component`。

## 4600

| 结构 | 含义 |
| --- | --- |
| `MT FD L BA <density> T HJ - <BOM> BP 1 <firmware> AB YY` | Micron 4600 PCIe Gen5 M.2 SSD |
| 容量 `512/1T0/2T0/4T0` | 512GB、1024GB、2048GB、4096GB |
| NAND 芯片 `BP` | 1024Gb TLC x8 2.5V (3D) |
| 固件 `A/5/K` | 非 SED TCG Pyrite / SED TCG Opal / MSFT |

## 9400

| 结构 | 含义 |
| --- | --- |
| `MT FD K CC <density> T <GH/GJ> - <BOM> <component> <sector> <firmware> <hardware> <customer>` | Micron 9400 PCIe Gen4 U.3/U.2 SSD |
| 外形规格 `CC` | U.3/U.2, 2.5-英寸, 15mm, SFF-8639 |
| 产品系列 `GH/GJ` | 9400 PRO / 9400 最高 |
| 容量 `6T4/7T6/12TB/15T3/25T6/30T7` | 6400GB、7680GB、12800GB、15360GB、25600GB、30720GB |

截图未给出 `BC` 芯片和 `Z` 固件编码段的公开释义，规则只消费编码段，不输出芯片 / 固件描述。

## 2100AI / 2100AT

| 结构 | 含义 |
| --- | --- |
| `MT FD H <form> <density> T <family> - <BOM> AT 1 <firmware> <temperature> YY <status>` | Micron 2100AI / 2100AT PCIe NVMe SSD |
| 外形规格 `BL/BM/BK` | `BL/BM` 为 BGA291 类型 1620，`BK` 为 M.2 类型 2230 M-键 |
| 产品系列 `DP/DQ` | `DP = 2100AI`，`DQ = 2100AT` |
| NAND 芯片 `AT` | 512Gb TLC x8 3.3V (3D) |
| 温度 `AI/AT` | `AI = Automotive support, Industrial (-40°C to +95°C)`；`AT = Automotive (-40°C to +105°C)` |

温区说明：2100 特性/选项页把等级 3 扩展的丝印写为 `IT`，订购编码图和完整基础 PN 表在 PN 温区位置使用 `AI`。当前 `vendor.micron.ssd.modern.v1` 只把订购编码图中的 `AI` / `AT` 当作 2100 PN 温区编码段解析；`IT` 不进入该具体规则，但低优先级通用规则仍可保留基础 SSD 身份字段。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`form factor`、`product family`、`BOM`、`NAND component`、`sector size`、`firmware`、`temperature`、`customer designator` 和其他原始编码只用于规则内部解析，不进入公开 `*_code` 字段。

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
- `MTEDBTH008MBA-1K1`
- `MTFDLAL61T4THL-1BK4DABYY`
- `MTFDKBZ480TFR-1BC4ZABYY`
- `MTFDKCC15T3TGQ-1BK1DABYYES`
- `MTFDLBQ3T8THG-2BP1JFCYY`
- `MTFDKEL128THE-1BM15ATYY`
- `MTFDKEL128THE-ABM15ATYYES`
- `MTFDKEL220TGK-1BM45A2YY`
- `MTFDKER1T8TGK-ABM45A2YYES`
- `MTFDDAY120MBD-AAK12AIYYES`
- `MTFDDAY240MBD-1AK12AIYY`
- `MTFDDAK060MBD-2AH12ITYY`
- `MTFDDAT060MBD-1AH12AIYY`
- `MTFDDAT120MBD-AAK12AIYYES`
- `MTFDDAT120MAZ-1AE12ABHAES`
- `MTFDDAK120MBD-1AE12ITYY`
- `MTFDDAK060MBD-1AH12AIRA`
- `MTFDDAK240MBD-AAK12AIRAES`
- `MTFDDAK160MBD-1AE12AIYY`
- `MTFDDAK060MBD-2AH12AIYY`
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
