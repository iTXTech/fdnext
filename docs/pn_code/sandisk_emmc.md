# SanDisk iNAND eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-11

## 外部资料

- SanDisk iNAND IX EM132 product brief: `SDINBDA6-16G/32G/64G/128G/256G`，eMMC 5.1 HS400，BiCS3 64L 3D NAND，`I1` / `XI1` 工业温区后缀。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-ix-em132-industrial-embedded-flash-devices.pdf>
- Western Digital Mobile and Compute brochure: 汇总 `SDINBDV4` / `SDINBDA4` / `SDINBDG4` / `SDINADF4` 的 MC/CL eMMC 产品族、容量范围和 eMMC 5.1 HS400 接口。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk automotive eMMC/UFS brochure: `SDINBDA6-##G-ZA1|XA1` 对应 AT EM132，`SDINBDG4-##G-ZA3|XA3` 对应 AT EM122，接口均为 eMMC 5.1 HS400。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>
- Sandisk Industrial and IoT brochure 确认 `SDINBDI4-XXXG` 为 iNAND CL EM151、eMMC 5.1、64GB~256GB、3D TLC、-25°C~85°C。授权经销商 Satori SP Technology 列出 `SDINBDI4-64G-H/128G-H/256G-H`；Falcon、Rockchip support list、Mouser/TrustedParts 等独立来源与官方容量和 family pattern 同向。第三方只用于确认 exact PN，接口、容量范围和温区仍以原厂 brochure 为准。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-industrial-iot-storage-solutions.pdf>
- SanDisk iNAND Ultra e.MMC 4.41 datasheet mirror: `SDIN7DU2-8G/16G/32G/64G` 订购型号，X2 MLC，e.MMC 4.41；Elnec 全系列支持表与公开 parametric 数据确认四种容量均为 BGA-153，11.5x13x1.0。
  <https://www.part-elec.com/datasheet/sandisk/SDIN7DU2-8G.pdf>
  <https://www.elnec.com/en/supported-devices?name=DIL48%2FBGA153-1.01+ZIF+eMMC-3%2F>
- SanDisk iNAND Extreme e.MMC 4.5 released datasheet 的 ordering table 列出 `SDIN7DP4-16G/32G/64G` 与 `SDIN7CP4-128G`，确认 X2 MLC 及逐容量尺寸；Minato/Elnec device list 独立确认 `SDIN7DP4` 为 BGA-153，第三方 package 数据确认 `SDIN7CP4` 为 BGA-169。资源采用 datasheet 中的正式 PN，不保留 `INAND` 品牌词拼接或 `16G_32G` 合并写法。封装由 family + density 局部 token 和外部封装表推导，不使用完整 PN 查表。
  <https://www.mouser.lt/datasheet/2/669/sandisk_sand-s-a0002728608-1-1747670.pdf>
  <https://www.minatoat.co.jp/dpexralist/2018/0906/M1883dev/M1883dev/sandisk_dev.htm>
  <https://www.avaq.com/chip/sdin7cp4-128g>
- SanDisk Industrial iNAND brochure mirror: `SDIN8DE#-##G-XI/I` 与 `SDIN7DU2-##G-I` 覆盖 Industrial iNAND e.MMC 4.51+/4.41+。
  <https://pf.unikeyic.com/datasheet/62/a7/6d11/62/655fd5cb797bcac978bc75fe4f025abc.pdf>
- Elnec/Dataman 支持表与公开封装资料一致确认 `SDIN5C2-32G`、`SDIN5C4-32G/64G` 为 FBGA-169、12x16；规则按 family + density 组合输出，不把完整 PN 放入 decoder 表。<https://www.elnec.com/en/device/SanDisk/SDIN5C2-32G%20%5BFBGA169%5D/>、<https://www.dataman-deviceprogramming.co.uk/pages/supported-sandisk-devices>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/sandisk-inand-emmc-token.json`
- `vendor.sndk.inand.emmc.v1`
- `packages/core/src/decodepack/rules/packs/sandisk-inand-token.json`
- `vendor.sndk.inand.legacy-emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | SanDisk iNAND eMMC |
| family `ADF4` | iNAND MC EM111, eMMC 5.1 HS400 |
| family `BDA4` | iNAND MC EM131, eMMC 5.1 HS400 |
| family `BDA6` | iNAND IX/AT EM132-class, eMMC 5.1 HS400, BiCS3 64L 3D NAND |
| family `BDG4` | iNAND 7250 / EM122-class, eMMC 5.1 HS400 |
| family `BDI4` | iNAND CL EM151, eMMC 5.1 HS400, 3D TLC；64GB/128GB/256GB |
| family `BDI4` package | 授权渠道表确认 BGA-153, 11.5x13x1.0；未确认具体 BGA subtype |
| family `BDV4` | iNAND MC EM141, eMMC 5.1 HS400 |
| `BDA4` package inference | family + density：32GB/64GB/128GB/256GB 均为 `BGA-153, 11.5x13x1.0` |
| `BDA6` package inference | family + density：16GB/32GB/64GB/128GB 为 `BGA-153, 11.5x13x1.0`；256GB 为 `BGA-153, 11.5x13x1.2` |
| `BDG4` package inference | family + density：8GB/16GB 为 `BGA-153, 11.5x13x0.8`；32GB 为 `BGA-153, 11.5x13x1.0`；64GB 为 `BGA-153, 11.5x13x1.2` |
| family `5C2/5C4` | local FDB and public distributor/datasheet references point to legacy iNAND eMMC 4.41-class parts |
| `5C2/5C4` package inference | 已确认资源组合输出 `BGA-169, 12x16` |
| family `7DU2` | iNAND Ultra, eMMC 4.41, X2 MLC |
| family `7DP4/7CP4` | iNAND Extreme, eMMC 4.5, X2 MLC；正式 ordering table 覆盖 16GB~128GB |
| family `7LP4` | local FDB identifies iNAND; eMMC classification is inferred from neighboring legacy iNAND structure |
| `7DP4` package inference | family + density：16GB/32GB `BGA-153, 11.5x13x1.0`；64GB `BGA-153, 11.5x13x1.4` |
| `7CP4` package inference | family + density：128GB `BGA-169, 12x16x1.6` |
| `7DU2` package inference | family + density：8GB/16GB/32GB/64GB 均为 `BGA-153, 11.5x13x1.0` |
| family `8DE1/8DE2/8DE4` | Industrial iNAND eMMC family |
| legacy process profile | `5C2/5C4` -> `SNK24M`; `7DP4/7DU2/7LP4` -> `SNK19M` |
| capacity `4G/8G/16G/32G/64G/128G/256G` | eMMC 容量，落库为 Mbit |
| suffix `H` | Connected Home, -25°C to 95°C |
| family `BDI4` + suffix `H` | Commercial, -25°C to 85°C；组合规则优先于全局 `H` |
| suffix `I1/I2` | Industrial Wide Temperature, -25°C to 85°C |
| suffix `XI1/XI2` | Industrial Extended Temperature, -40°C to 85°C |
| suffix `XA1/XA3` | Automotive, -40°C to 85°C |
| suffix `ZA/ZA1/ZA3` | Automotive, -40°C to 105°C |

## 输出字段

- `product_family`
- `product_version`
- `storage_interface`
- `interface_type`
- `nand_technology`
- `generation_info`
- `component_voltage`
- `product_class`
- `operation_temperature`

## 测试样例

- `SDINBDA6-256G-XI1`
- `SDINBDG4-32G-ZA3`
- `SDINBDI4-64G-H`
- `SDIN7DU2-8G`
- `SDIN7DP4-16G`
- `SDIN7CP4-128G`
- `SDIN5C4-64G`

## 注意

`SDIN` 只是 iNAND 前缀，不能单独判断为 eMMC。规则必须先识别 family token，再决定 `type`。
未知 `SDIN` family 没有 family 证据时返回未命中，避免被 SanDisk raw NAND 前缀规则误判。

本地 FDB 还出现 `SDIN7LP4_H45-64G` 标记变体，但当前外部 ordering 资料只确认正式 PN `SDIN7LP4-64G`。因此前者保留为待外部确认的候选说明，不进入搜索资源，也不为了 `_H45` 写 decoder 特判。
