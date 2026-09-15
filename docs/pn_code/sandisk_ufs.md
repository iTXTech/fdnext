# SanDisk iNAND UFS PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Western Digital Mobile and Compute 产品手册: 汇总 MC EU551 / EU521 / EU511 / EU311 的容量、接口和订购型号，例如 `SDINFDO4-128G`、`SDINFDK4-128G`、`SDINEDK4-128G`、`SDINDDH4-32G`。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk 工业级 / IoT 产品手册: UFS 2.1 覆盖 64GB-512GB，UFS 3.1 覆盖 128GB-512GB，UFS 4.1 覆盖 256GB-1TB。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-industrial-iot-storage-solutions.pdf>
- 同一原厂产品手册给出 `SDINHFT4-XXXX` 订购编码模式，确认 iNAND MC EU711、UFS 4.1、256GB~1TB、3D TLC、-25°C~85°C。精确外部表已确认 `HFT4-128G/256G/1T00` 与 `HFT2-256G/512G`；`HFT4-512G` 仍只有容量范围推断，已从完整 PN 搜索资源移除。
- Sandisk 车规 eMMC/UFS 产品手册: AT EU752 / EU552 / EU312 的接口、容量范围、温区和订购编码模式。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>
- iNAND AT EU552 产品简介: `SDINFDQ6-64G/128G/256G/512G-XA1|ZA1`，UFS 3.1，112L 3D NAND。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu552.pdf>
- iNAND AT EU752 产品简介: `SDINHDL6-256G/512G/1T00-ZA`，UFS 4.1，218L 3D NAND。规则按仓库共享 die 规格映射为 `SBiCS8`。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu752.pdf>
- Dediprog WDC UFS 插座支持列表逐系列确认 `DDH4/DDH6/EDK4/FDK4/FDO2/FDO4/FDQ6` 为 BGA-153；原厂移动版/车规产品手册与 EU552/EU752 产品简介提供逐系列 + 容量尺寸。规则只按系列 + 容量局部组合输出封装，不按完整 PN 查表；`HDL6` 沿用同一 11.5x13 占板尺寸与已确认的 WDC UFS BGA-153 系列布局。
  <https://www.dediprog.com/product/3361>
- EU551 产品简介明确 `FEO2-256G` 为 4-die 配置；原厂 2022 移动版矩阵同时列出 `FDO2-256G` 为 4-die。两者共同否证第四编码段是电压或可全局等同 die 数。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/product-brief/product-brief-inand-mc-eu551-embedded-flash-drive.pdf>
- Sandisk 当前保修系列清单新增 `HFR4/EU721`；Sandisk/MemoryS 资料确认 EU721 为 UFS 4.1、BiCS8 218L QLC。该组合支持 `H:R` 规格，但精确商业级后缀仍待确认。
  <https://www.sandisk.com/support/store/warranty-policy/commercial-products>
  <https://www.memorys.com/2026/a/99>
- Sandisk/MemoryS EU711 资料确认 BiCS6 162L TLC，支持第三编码段 `T` 映射。
  <https://www.memorys.com/2025/a/60>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/sandisk-inand-managed-token.json`
- `vendor.sndk.inand.managed.v1`（现代四编码段 eMMC/UFS 共用）

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + 系列 + `-` + 容量 + 可选后缀 | SanDisk iNAND UFS |
| 系列的第 1 位 | 接口世代：`D`=UFS 2.1、`E`=UFS 3.0、`F`=UFS 3.1、`H`=UFS 4.x；系列资料再精化为 HFT2=4.0、HFT4/HDL6=4.1。`L` 按用户提供的编码线索归入 UFS，但公开原厂 PN 仍未找到，因此只输出 `UFS` |
| 系列的第 2 位 | 封装/布局编码段；`D`=BGA-153，`F` 在 HFT2/HFT4 上确认 BGA-153/9x13；`E` 只确认 11.5x13x1.0，不能机械补引脚数 |
| 系列的第 3 位 | NAND 技术编码段：`H`=BiCS3/64L TLC、`K/O`=BiCS4/96L TLC、`Q`=BiCS5/112L TLC、`T`=BiCS6/162L TLC、`L`=BiCS8/218L TLC、`H:R`=BiCS8/218L QLC。字母必须写作 `O`，不是数字 `0` |
| 系列的第 4 位 | 配置编码段；`FEO2-256G` 官方明确为 4-die 配置，证明该位不是电压，但现有资料不足以把 `2/4/6` 泛化为固定 die 数 |
| 系列 `DDH4` | iNAND MC EU311, UFS 2.1 |
| 系列 `DDH6` | iNAND AT EU312, UFS 2.1 |
| 系列 `EDK4` | iNAND MC EU511, UFS 3.0 |
| 系列 `FDK4` | iNAND MC EU521, UFS 3.1 |
| 系列 `FDO2/FDO4/FEO2` | iNAND MC EU551, UFS 3.1, 96L/BiCS4 TLC；官方产品简介明列 `FEO2` 为 256GB 4-die 配置 |
| 系列 `FEO4` | iNAND MC EU561, UFS 3.1, BiCS4 TLC；128GB/256GB/512GB 精确外部表确认 |
| 系列 `FDQ6` | iNAND AT EU552, UFS 3.1, 112L 3D NAND |
| 系列 `HDL6` | iNAND AT EU752, UFS 4.1, BiCS8 218L |
| 系列 `HFT2/HFT4` | iNAND MC EU711, BiCS6 162L TLC；精确分销资料把 HFT2 标为 UFS 4.0，原厂产品手册把 HFT4 标为 UFS 4.1。当前完整 PN 为 HFT2 256GB/512GB 与 HFT4 128GB/256GB/1TB |
| 系列 `HFR4` | iNAND MC EU721, UFS 4.1, BiCS8 218L QLC；目前只落系列/编码段，未把样品海关字符串当正式完整 PN |
| 系列 `HFT4` 封装 | Falcon `BG153C` 与 Mouser 9x13 交叉确认，输出 `BGA-153, 9x13`，不猜具体 BGA 子类型 |
| `DDH4/EDK4/FDK4/FDO4` 封装推断 | 已确认容量组合输出 `BGA-153, 11.5x13x1.0` |
| `DDH6/FDQ6/HDL6` 封装推断 | 已确认容量组合输出 `BGA-153, 11.5x13x1.2` |
| 后缀 `XA1/XA2` | 车规, -40°C 至 85°C |
| 后缀 `ZA/ZA1/ZA2` | 车规, -40°C 至 105°C |

共用编码段表见 [sandisk_emmc](sandisk_emmc.md#规则状态)；本文仅列该产品线的差异。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `SDINFDK4-128G`
- `SDINFEO2-256G`
- `SDINDDH6-128G-ZA2`
- `SDINHFT4-256G`
- `SDINFDQ6-512G-ZA1`
- `SDINHDL6-1T00-ZA`

## 注意

四编码段处理链与未知系列的行为见 [iNAND eMMC](sandisk_emmc.md#注意)；`SDINFD04` 可降级识别接口/封装，但不会把数字 `0` 当成已知 `O` 规格。

合并仅限解析骨架；NAND 语义不能全局单键化。例如 `8:R` 是旧 eMMC 的 A19nm TLC，而 `H:R` 是 UFS EU721 的 BiCS8 QLC，规则必须使用限定范围的编码段或系列覆盖规则。
