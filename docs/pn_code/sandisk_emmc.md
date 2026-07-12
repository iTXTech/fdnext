# SanDisk iNAND eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- SanDisk iNAND Extreme e.MMC 5.0 HS400 datasheet: `SDIN9DW4-16G/32G/64G`，X2，BGA-153 11.5x13x1.0；每个容量另有 `-Q` sample PN。
  <https://www.mouser.com/datasheet/2/669/sandisk_sand-s-a0002571728-1-1747548.pdf>
- SanDisk iNAND 7232 datasheet: `SDINADF4-16G/32G/64G/128G` 为 eMMC 5.0，`-L/-H` 为 eMMC 5.1；X3/TLC，逐容量厚度为 0.9/0.9/1.0/1.2mm；sample PN 分别使用 `-Q/-LQ/-HQ`。
  <https://files.pine64.org/doc/datasheet/pine64/SDINADF4-16-128GB-H%20data%20sheet%20v1.13.pdf>
- SanDisk iNAND 7250 datasheet: `SDINBDG4-8G/16G/32G/64G`，eMMC 5.1 HS400，15nm X2 eMLC，逐容量厚度为 0.8/0.8/1.0/1.2mm；每个容量另有 `-Q` sample PN。
  <https://file.elecfans.com/web2/M00/72/E3/pYYBAGNVUESAWgCnABxrTf4tSGM159.pdf>
- SanDisk iNAND 7250 Industrial brief: 同一 `BDG4` family 的 Commercial、Industrial Wide、Industrial Extended ordering 分别使用无后缀、`-I`、`-XI`；温区为 -25°C~85°C、-25°C~85°C、-40°C~85°C。
  <https://www.mouser.com/catalog/specsheets/SanDisk_10092017_iNAND-7250-Industrial-Brochure.pdf>
- 2015 Commercial Embedded Product Brief: PN 表补充 `SDIN7DP2-4G`、`SDIN8DE1-8G`、`SDIN8DE2-8G/16G`、`SDIN8DE4-32G/64G`、`SDIN9DS2-8G/16G/32G/64G`、`SDINADB4-16G`、`SDIN8CE4-128G`，并给出接口、温区、容量与逐项尺寸。
  <https://static6.arrow.com/aropdfconversion/c61a381409e1a71f463727b4340fad3ac7f59520/sandisk_12282015_commercialembeddedproductbrief-792691.pdf>
- SanDisk PCN-001278 逐 PN 确认 `7DP2/7DP4/7DU2/7CP4/8DE1/8DE2/8DE4/8CE4` 使用 19nm eX2/MLC；因此第三 token `E/P/U/W` 可绑定 `SNK19M`，不再把 `P` 留作未知制程。
  <https://www.mouser.com/PCN/SanDisk_PCN_001278_19nm_EOL_Generic_%289%29.pdf>

- SanDisk iNAND IX EM132 product brief: `SDINBDA6-16G/32G/64G/128G/256G`，eMMC 5.1 HS400，BiCS3 64L 3D NAND，`I1` / `XI1` 工业温区后缀。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-ix-em132-industrial-embedded-flash-devices.pdf>
- Western Digital Mobile and Compute brochure: 汇总 `SDINBDV4` / `SDINBDA4` / `SDINBDG4` / `SDINADF4` 的 MC/CL eMMC 产品族、容量范围和 eMMC 5.1 HS400 接口。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk automotive eMMC/UFS brochure: `SDINBDA6-##G-ZA1|XA1` 对应 AT EM132，`SDINBDG4-##G-ZA3|XA3` 对应 AT EM122，接口均为 eMMC 5.1 HS400。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>
- Sandisk Industrial and IoT brochure 确认 `SDINBDI4-XXXG` 为 iNAND CL EM151、eMMC 5.1、64GB~256GB、3D TLC、-25°C~85°C。授权经销商 Satori SP Technology 列出 `SDINBDI4-64G-H/128G-H/256G-H`；Falcon、Rockchip support list、Mouser/TrustedParts 等独立来源与官方容量和 family pattern 同向。第三方只用于确认 exact PN，接口、容量范围和温区仍以原厂 brochure 为准。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-industrial-iot-storage-solutions.pdf>
- SanDisk iNAND Ultra e.MMC 4.41 datasheet mirror: `SDIN7DU2-8G/16G/32G/64G` 订购型号，X2 MLC，e.MMC 4.41；厚度依次为 1.0/1.0/1.2/1.4。
  <https://www.part-elec.com/datasheet/sandisk/SDIN7DU2-8G.pdf>
  <https://www.elnec.com/en/supported-devices?name=DIL48%2FBGA153-1.01+ZIF+eMMC-3%2F>
- SanDisk iNAND Extreme e.MMC 4.5 released datasheet 的 ordering table 列出 `SDIN7DP4-16G/32G/64G` 与 `SDIN7CP4-128G`，确认 X2 MLC 及逐容量尺寸；Minato/Elnec device list 独立确认 `SDIN7DP4` 为 BGA-153，第三方 package 数据确认 `SDIN7CP4` 为 BGA-169。资源采用 datasheet 中的正式 PN，不保留 `INAND` 品牌词拼接或 `16G_32G` 合并写法。封装由 family + density 局部 token 和外部封装表推导，不使用完整 PN 查表。
  <https://www.mouser.lt/datasheet/2/669/sandisk_sand-s-a0002728608-1-1747670.pdf>
  <https://www.minatoat.co.jp/dpexralist/2018/0906/M1883dev/M1883dev/sandisk_dev.htm>
  <https://www.avaq.com/chip/sdin7cp4-128g>
  Ordering table 同时列出四个 `-Q` sample PN；`-T` 只表示 tape/reel，不进入公开字段。
- SanDisk Industrial iNAND brochure mirror: `SDIN8DE#-##G-XI/I` 与 `SDIN7DU2-##G-I` 覆盖 Industrial iNAND e.MMC 4.51+/4.41+。
  <https://pf.unikeyic.com/datasheet/62/a7/6d11/62/655fd5cb797bcac978bc75fe4f025abc.pdf>
- Elnec/Dataman 支持表与公开封装资料一致确认 `SDIN5C2-32G`、`SDIN5C4-32G/64G` 为 FBGA-169、12x16；规则按 family + density 组合输出，不把完整 PN 放入 decoder 表。<https://www.elnec.com/en/device/SanDisk/SDIN5C2-32G%20%5BFBGA169%5D/>、<https://www.dataman-deviceprogramming.co.uk/pages/supported-sandisk-devices>
- iNAND 7350 brief 与合规表确认 `SDINBDD4-32G/64G/128G/256G` 为 Osprey/BiCS2；Rockchip/分销资料确认 `SDINBDJ4-8G/16G` 为 CL EM102、15nm MLC。
  <https://www.sandisk.cn/content/dam/sandisk-main/en_us/assets/resources/data-sheets/iNAND-7350-Prod-Brief.pdf>
- Allwinner eMMC 支持表确认 `SDIN8DR1-8G/16G` 为 1Ynm TLC，并构成与 UFS `HFR4` 的第三 token `R` 冲突实例。
  <https://dl.linux-sunxi.org/A64/Allwinner_A64_full_set_of_hardware_development_materials_2015/SDK_development_kit_documentation/Allwinner_eMMC-tSD-fSD_support_list_20150612.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/sandisk-inand-managed-token.json`
- `vendor.sndk.inand.managed.v1`（现代四 token eMMC/UFS 共用）
- `packages/core/src/decodepack/rules/packs/sandisk-inand-legacy-token.json`
- `vendor.sndk.inand.legacy-emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | SanDisk iNAND eMMC |
| family 的第 1 位 | 接口世代；`7/8/9/A/B` 分别覆盖 eMMC 4.x/4.51/5.0/5.x/5.1。`7` 和 `A` 必须由 family/suffix 精化：7DU2=4.41、7DP4=4.5、7DP2=4.51；ADF4 base=5.0、`-L/-H`=5.1 |
| family 的第 2 位 | package/layout token；跨 datasheet 可确认 `D` 对应 BGA-153 family，`C` 对应 BGA-169 family。尺寸仍按 family+density 表，不凭该位猜厚度 |
| family 的第 3 位 | NAND technology token；eMMC 已确认 `E/P/U/W`=19nm MLC、`B/R(8:R)`=1Ynm TLC、`F`=15nm TLC、`G/J`=15nm MLC、`A`=BiCS3 TLC、`D`=BiCS2 TLC、`V`=BiCS4 TLC。遇到跨世代冲突必须用 `interfaceCode:nandCode`，不能全局单键映射 |
| family 的第 4 位 | configuration token。现有资料不足以给出通用数字含义；供电规格并不随此位变化，因此不解释为 voltage |
| family `9DW4` | iNAND Extreme, eMMC 5.0 HS400, X2 MLC；16GB/32GB/64GB |
| family `ADF4` | iNAND 7232；base eMMC 5.0，`-L/-H` eMMC 5.1 HS400；X3/TLC；16GB~128GB |
| family `BDA4` | iNAND MC EM131, eMMC 5.1 HS400 |
| family `BDA6` | iNAND IX/AT EM132-class, eMMC 5.1 HS400, BiCS3 64L 3D NAND |
| family `BDG4` | iNAND 7250 / EM122-class, eMMC 5.1 HS400, 15nm X2 eMLC；规则绑定 `SNK15M`，公开只显示 Process=15nm 与 Cell=MLC |
| family `BDI4` | iNAND CL EM151, eMMC 5.1 HS400, 3D TLC；64GB/128GB/256GB |
| family `BDI4` package | 授权渠道表确认 BGA-153, 11.5x13x1.0；未确认具体 BGA subtype |
| family `BDV4` | iNAND MC EM141, eMMC 5.1 HS400 |
| family `BDD4` | iNAND 7350, Osprey/BiCS2 TLC；32GB~256GB |
| family `BDJ4` | iNAND CL EM102, 15nm MLC；8GB/16GB |
| `BDA4` package inference | family + density：32GB/64GB/128GB/256GB 均为 `BGA-153, 11.5x13x1.0` |
| `BDA6` package inference | family + density：16GB/32GB/64GB/128GB 为 `BGA-153, 11.5x13x1.0`；256GB 为 `BGA-153, 11.5x13x1.2` |
| `BDG4` package inference | family + density：8GB/16GB 为 `BGA-153, 11.5x13x0.8`；32GB 为 `BGA-153, 11.5x13x1.0`；64GB 为 `BGA-153, 11.5x13x1.2` |
| family `5C2/5C4` | local FDB and public distributor/datasheet references point to legacy iNAND eMMC 4.41-class parts |
| `5C2/5C4` package inference | 已确认资源组合输出 `BGA-169, 12x16` |
| family `7DU2` | iNAND Ultra, eMMC 4.41, X2 MLC |
| family `7DP4/7CP4` | iNAND Extreme, eMMC 4.5, X2 MLC；正式 ordering table 覆盖 16GB~128GB |
| family `7DP2` | Commercial brief 确认 4GB、eMMC 4.51、BGA-153 11.5x13x1.0 |
| family `7LP4` | local FDB identifies iNAND; eMMC classification is inferred from neighboring legacy iNAND structure |
| `7DP4` package inference | family + density：16GB/32GB `BGA-153, 11.5x13x1.0`；64GB `BGA-153, 11.5x13x1.4` |
| `7CP4` package inference | family + density：128GB `BGA-169, 12x16x1.6` |
| `7DU2` package inference | family + density：8GB/16GB 为 `BGA-153, 11.5x13x1.0`；32GB 为 1.2；64GB 为 1.4 |
| family `8DE1/8DE2/8DE4` | Industrial iNAND eMMC family |
| family `8CE4` | Commercial brief 确认 128GB、eMMC 4.51 HS200、BGA-169 12x16x1.4 |
| family `9DS2` | iNAND 5130, eMMC 5.0 HS400；8GB~64GB |
| family `ADB4` | iNAND 7132, eMMC 5.0+ HS400；本轮原厂表确认 16GB |
| process profile | `5C2/5C4` -> `SNK24M`；`E/P/U/W` -> `SNK19M`；`F` -> `SNK15T`；`G/J` -> `SNK15M`；`8:R` -> `SNK1YT` |
| capacity `4G/8G/16G/32G/64G/128G/256G` | eMMC 容量，落库为 Mbit |
| family `BDG4/BDA6` + suffix `H` | Connected Home, -25°C to 95°C |
| family `BDI4` + suffix `H` | Commercial, -25°C to 85°C；`H` 必须按 family 解释，不能全局化 |
| suffix `I/I1/I2` | Industrial Wide Temperature, -25°C to 85°C |
| suffix `XI/XI1/XI2` | Industrial Extended Temperature, -40°C to 85°C |
| suffix `XA1/XA3` | Automotive, -40°C to 85°C |
| suffix `ZA/ZA1/ZA3` | Automotive, -40°C to 105°C |
| suffix `Q` | Engineering Sample；仅 `7CP4/7DP4/9DW4/ADF4/BDG4` 等 ordering table 已确认 family 解释，公开只使用 `prod_status` |

上述四位解释是多份原厂 ordering table 的位置级归纳，不是 Sandisk 发布的通用 PN decoder。规则仍以已确认 family 识别产品线，未知组合不自动外推。

## 输出字段

- `product_family`
- `storage_interface`
- `interface_type`
- `die_codename`
- `layer_count`
- `cell_level`
- `component_voltage`
- `product_class`
- `operation_temperature`
- `prod_status`

## 测试样例

- `SDINBDA6-256G-XI1`
- `SDINBDG4-32G-ZA3`
- `SDINBDG4-64G-XI`
- `SDINBDG4-8G-Q`
- `SDINADF4-128G-HQ`
- `SDIN9DW4-32G-Q`
- `SDINBDI4-64G-H`
- `SDIN7DU2-8G`
- `SDIN7DP4-16G`
- `SDIN7CP4-128G`
- `SDIN5C4-64G`

## 注意

`SDIN` 只是 iNAND 前缀，不能单独判断为 eMMC。规则必须先识别 family token，再决定 `type`。
现代规则按首 token 判断 eMMC/UFS，并允许未知但结构合法的 family 降级输出已确认的接口、package、NAND token 和容量；不会伪造 `product_family`。legacy `5C2/5C4` 因三字符 grammar 保留独立 spec。

本地 FDB 还出现 `SDIN7LP4_H45-64G` 标记变体，但当前外部 ordering 资料只确认正式 PN `SDIN7LP4-64G`。因此前者保留为待外部确认的候选说明，不进入搜索资源，也不为了 `_H45` 写 decoder 特判。

`PESBBFLGAIV` 在本轮原厂 PDF、公开网页和本地 `fdfdb` 中均没有可交叉确认的命中，当前只能列为 `local_pending_external_reference` 候选。它不像 `SDIN...` sales PN，不能据字符串形态推断制程或 Cell，也不进入规则和搜索资源。
