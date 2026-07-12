# SanDisk iNAND UFS PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Western Digital Mobile and Compute brochure: 汇总 MC EU551 / EU521 / EU511 / EU311 的容量、接口和订购型号，例如 `SDINFDO4-128G`、`SDINFDK4-128G`、`SDINEDK4-128G`、`SDINDDH4-32G`。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk industrial / IoT brochure: UFS 2.1 覆盖 64GB-512GB，UFS 3.1 覆盖 128GB-512GB，UFS 4.1 覆盖 256GB-1TB。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-industrial-iot-storage-solutions.pdf>
- 同一原厂 brochure 给出 `SDINHFT4-XXXX` ordering pattern，确认 iNAND MC EU711、UFS 4.1、256GB~1TB、3D TLC、-25°C~85°C。exact 外部表已确认 `HFT4-128G/256G/1T00` 与 `HFT2-256G/512G`；`HFT4-512G` 仍只有容量范围推断，已从 exact PN 搜索资源移除。
- Sandisk automotive eMMC/UFS brochure: AT EU752 / EU552 / EU312 的接口、容量范围、温区和 ordering pattern。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>
- iNAND AT EU552 product brief: `SDINFDQ6-64G/128G/256G/512G-XA1|ZA1`，UFS 3.1，112L 3D NAND。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu552.pdf>
- iNAND AT EU752 product brief: `SDINHDL6-256G/512G/1T00-ZA`，UFS 4.1，218L 3D NAND。规则按仓库共享 die profile 映射为 `SBiCS8`。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu752.pdf>
- Dediprog WDC UFS socket support list 逐 family 确认 `DDH4/DDH6/EDK4/FDK4/FDO2/FDO4/FDQ6` 为 BGA-153；原厂 mobile/automotive brochure 与 EU552/EU752 product brief 提供逐 family + density 尺寸。规则只按 family + density 局部组合输出 package，不按完整 PN 查表；`HDL6` 沿用同一 11.5x13 footprint 与已确认的 WDC UFS BGA-153 family layout。
  <https://www.dediprog.com/product/3361>
- EU551 brief 明确 `FEO2-256G` 为 4-die configuration；原厂 2022 mobile matrix 同时列出 `FDO2-256G` 为 4-die。两者共同否证第四 token 是电压或可全局等同 die count。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/product-brief/product-brief-inand-mc-eu551-embedded-flash-drive.pdf>
- Sandisk 当前保修 family 清单新增 `HFR4/EU721`；Sandisk/MemoryS 资料确认 EU721 为 UFS 4.1、BiCS8 218L QLC。该组合支持 `H:R` profile，但 exact commercial suffix 仍待确认。
  <https://www.sandisk.com/support/store/warranty-policy/commercial-products>
  <https://www.memorys.com/2026/a/99>
- Sandisk/MemoryS EU711 资料确认 BiCS6 162L TLC，支持第三 token `T` 映射。
  <https://www.memorys.com/2025/a/60>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/sandisk-inand-managed-token.json`
- `vendor.sndk.inand.managed.v1`（现代四 token eMMC/UFS 共用）

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | SanDisk iNAND UFS |
| family 的第 1 位 | 接口世代：`D`=UFS 2.1、`E`=UFS 3.0、`F`=UFS 3.1、`H`=UFS 4.x；family 资料再精化为 HFT2=4.0、HFT4/HDL6=4.1。`L` 按用户提供的编码线索归入 UFS，但公开原厂 PN 仍未找到，因此只输出 `UFS` |
| family 的第 2 位 | package/layout token；`D`=BGA-153，`F` 在 HFT2/HFT4 上确认 BGA-153/9x13；`E` 只确认 11.5x13x1.0，不能机械补 pin count |
| family 的第 3 位 | NAND technology token：`H`=BiCS3/64L TLC、`K/O`=BiCS4/96L TLC、`Q`=BiCS5/112L TLC、`T`=BiCS6/162L TLC、`L`=BiCS8/218L TLC、`H:R`=BiCS8/218L QLC。字母必须写作 `O`，不是数字 `0` |
| family 的第 4 位 | configuration token；`FEO2-256G` 官方明确为 4-die configuration，证明该位不是 voltage，但现有资料不足以把 `2/4/6` 泛化为固定 die count |
| family `DDH4` | iNAND MC EU311, UFS 2.1 |
| family `DDH6` | iNAND AT EU312, UFS 2.1 |
| family `EDK4` | iNAND MC EU511, UFS 3.0 |
| family `FDK4` | iNAND MC EU521, UFS 3.1 |
| family `FDO2/FDO4/FEO2` | iNAND MC EU551, UFS 3.1, 96L/BiCS4 TLC；官方 brief 明列 `FEO2` 为 256GB 4-die configuration |
| family `FEO4` | iNAND MC EU561, UFS 3.1, BiCS4 TLC；128GB/256GB/512GB exact 外部表确认 |
| family `FDQ6` | iNAND AT EU552, UFS 3.1, 112L 3D NAND |
| family `HDL6` | iNAND AT EU752, UFS 4.1, BiCS8 218L |
| family `HFT2/HFT4` | iNAND MC EU711, BiCS6 162L TLC；exact 分销资料把 HFT2 标为 UFS 4.0，原厂 brochure 把 HFT4 标为 UFS 4.1。当前 exact PN 为 HFT2 256GB/512GB 与 HFT4 128GB/256GB/1TB |
| family `HFR4` | iNAND MC EU721, UFS 4.1, BiCS8 218L QLC；目前只落 family/token，未把样品海关字符串当正式 exact PN |
| family `HFT4` package | Falcon `BG153C` 与 Mouser 9x13 交叉确认，输出 `BGA-153, 9x13`，不猜具体 BGA subtype |
| `DDH4/EDK4/FDK4/FDO4` package inference | 已确认容量组合输出 `BGA-153, 11.5x13x1.0` |
| `DDH6/FDQ6/HDL6` package inference | 已确认容量组合输出 `BGA-153, 11.5x13x1.2` |
| suffix `XA1/XA2` | Automotive, -40°C to 85°C |
| suffix `ZA/ZA1/ZA2` | Automotive, -40°C to 105°C |
| suffix `I/I1/I2` | Industrial Wide Temperature, -25°C to 85°C |
| suffix `XI/XI1/XI2` | Industrial Extended Temperature, -40°C to 85°C |

## 输出字段

- `product_family`
- `storage_interface`
- `interface_type`
- `die_codename`
- `layer_count`
- `cell_level`
- `die_count`
- `product_class`
- `operation_temperature`

## 测试样例

- `SDINFDK4-128G`
- `SDINFEO2-256G`
- `SDINDDH6-128G-ZA2`
- `SDINHFT4-256G`
- `SDINFDQ6-512G-ZA1`
- `SDINHDL6-1T00-ZA`

## 注意

现代 eMMC/UFS 共用四 token pipeline，首 token 动态决定 `device.productType`。未知但结构合法的 family 会保留可确定 token 字段，不输出虚构的 family；`SDINFD04` 可降级识别接口/package，但不会把数字 `0` 当成已知 `O` profile。

合并仅限解析骨架；NAND 语义不能全局单键化。例如 `8:R` 是旧 eMMC 的 A19nm TLC，而 `H:R` 是 UFS EU721 的 BiCS8 QLC，规则必须使用 scoped token 或 family overlay。
