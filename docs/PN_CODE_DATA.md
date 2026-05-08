# eMMC / UFS PN 编码资料采集

采集日期：2026-05-08

这份资料先覆盖公开页面或公开 product brief 能直接验证的 managed NAND 料号编码。部分厂商没有公开完整逐位编码手册，因此规则库只记录能从公开 PN 表稳定归纳出的字段含义：厂商、类型、容量、产品族、接口版本、温度/等级后缀。更细的封装高度、controller revision、NAND die 代际需要继续补 datasheet 或厂商资料。

## 通用约定

- DSL 中 `density` 继续使用项目现有单位：Mbit。例：8GB = `65536`，128GB = `1048576`。
- eMMC / UFS 这类带控制器产品的 `type` 使用 `emmc` / `ufs`，补充信息放入 `extraInfo`。
- 公开资料主要是订购型号表，不等价于厂商正式 PN decoder。实现上禁止以完整 PN 白名单做匹配，只允许按 PN 结构切 token，再用规则库解释已知 token；未知 token 应尽量保留已能解析的字段。

## SanDisk / WD iNAND

来源：

- SanDisk Industrial e.MMC 页面列出 `SDINBDA6` / `SDINBDG4` 订购型号、e.MMC 5.1 HS400 和 -25~85 / -40~85 温度后缀。
  <https://www.sandisk.com/products/embedded-flash/industrial-inand-emmc-drives?sku=SDINBDA6-64G-I1>
- SanDisk Connected Home e.MMC 页面列出 `SDINBDG4` / `SDINBDA6` 的 `-H` 型号，接口为 e.MMC 5.1，工作温度 -25~95。
  <https://www.sandisk.com/products/embedded-flash/connected-home-inand-emmc-drives?sku=SDINBDG4-32G-H>
- iNAND IX EM132 product brief 给出 `SDINBDA6-16G/32G/64G/128G/256G`，接口 eMMC 5.1 HS400，BiCS3 64L 3D NAND。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-ix-em132-industrial-embedded-flash-devices.pdf>
- SanDisk Commercial UFS 页面列出 `SDINFDO4-128G/256G/512G`，接口 UFS 3.1，并说明 EU551 是 UFS 3.1 Gear 4 / 2-Lane。
  <https://shop.sandisk.com/products/embedded-flash/mobile-inand-ufs-drives?sku=SDINEDK4-256G>
- Western Digital Mobile and Compute brochure 汇总了 MC EU551/EU521/EU511/EU311 与 MC EM141/EM131/EM122/EM111 的接口、容量和订购信息。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- iNAND AT EU552 product brief 给出 `SDINFDQ6-64G/128G/256G/512G-XA1|ZA1`，UFS 3.1，112L 3D NAND。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu552.pdf>
- iNAND AT EU752 product brief 给出 `SDINHDL6-256G/512G/1T00-ZA`，UFS 4.1，BiCS8 218L。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu752.pdf>

已采集编码：

| PN 结构 | 字段 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | iNAND managed NAND |
| family token | `SDIN` 后 4 位，规则库解释为 eMMC/UFS 及产品族；未知 family 不阻断容量/后缀解析 |
| `ADF4` / `BDA4` / `BDA6` / `BDG4` / `BDV4` | eMMC 族；规则库分别补 EM111 / EM131 / IX EM132 / EM122-class / EM141 等公开资料字段 |
| `DDH4` / `EDK4` / `FDK4` / `FDO2` / `FDO4` / `FDQ6` / `HDL6` | UFS 族；规则库分别补 EU311 / EU511 / EU521 / EU551 / EU552 / EU752 等公开资料字段 |
| `4G/8G/16G/32G/64G/128G/256G/512G/1T00` | 容量；兼容 `004G/008G/...` |
| `H` | Connected Home, -25~95°C |
| `I1/I2` | Industrial Wide Temperature, -25~85°C |
| `XI1/XI2` | Industrial Extended Temperature, -40~85°C |
| `XA1` | Automotive, -40~85°C |
| `ZA/ZA1` | Automotive, -40~105°C |

## KIOXIA e-MMC / UFS

来源：

- KIOXIA Memory Selector 官方页面列出 e-MMC 4GB~256GB 和 UFS 32GB~1TB 型号、接口版本、温度等级和封装尺寸。
  <https://americas.kioxia.com/en-us/business/memory/selector.html>
- KIOXIA UFS 4.0/4.1 页面说明 UFS 4.x 面向 256GB/512GB/1TB，使用 BiCS FLASH managed NAND。
  <https://americas.kioxia.com/en-us/business/memory/mlc-nand/ufs4.html>

已采集编码：

| PN 结构 | 字段 |
| --- | --- |
| `THG` + series(3) + density(2) + package/revision/class | KIOXIA managed NAND；按 series/density/class token 解析 |
| `BM*` / `AM*` series | eMMC |
| `AF*` / `JF*` series | UFS |
| `G5/G6/G7/G8/G9/T0/T1/T2/T3` | 4GB/8GB/16GB/32GB/64GB/128GB/256GB/512GB/1TB |
| eMMC `BMN:G5` / `BMT:G5` | eMMC 5.0 |
| eMMC `BMU/BMJ/AMV/AMS` | eMMC 5.1 |
| UFS `AFB/AFE` | UFS 2.1 |
| UFS `JFG/JFP` | UFS 3.1 |
| UFS `JFM/JFJ` | UFS 4.0 |
| UFS `JFR` | UFS 4.1 |
| class `BAI` | Consumer / Industrial, -25~85°C |
| class `BAU` | Industrial, -40~105°C |
| class `BAB/BAC` | Automotive AEC-Q100 Grade 2, -40~105°C |
| class `BAA` | Automotive AEC-Q100 Grade 3, -40~85°C |

示例：`THGJFMT1E45BATV` -> KIOXIA UFS, 256GB, UFS 4.0, Consumer / Industrial。

## Micron e.MMC / UFS

来源：

- Micron 官方 e.MMC Standalone Part Numbering System 给出新版 `MT FC 2G AA AA M2 - xx xx ES` 结构、容量、温区、NAND component、controller revision、package code 和 special option 表。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A2e014e65-e44b-4558-931b-e5ebc6b7de00/renditions/original/as/numnextgenemmc.pdf>
- Micron 官方 Flash + Controller Part Numbering System 给出旧版 e-MMC/custom card `MT FC 2G A A M2 - xx ES` 结构。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac81e5b7e-6c40-4314-afc8-067c0034c12e/original/as/numemmc.pdf>
- Micron UFS v2.1 datasheet mirror 给出 `MTFC32GASAONS-IT` / `MTFC64GASAONS-IT` / `MTFC128GASAONS-IT` / `MTFC256GASAONS-IT`，并标注 UFS part numbering、32GB~256GB 和 package code `NS`。
  <https://datasheet.lcsc.com/lcsc/2411201017_Micron-Tech-MTFC256GASAONS-IT_C5128485.pdf>
- Micron eMMC software / technical note 页面列出 e.MMC 5.1 TLC Pearl 相关 `MTFC64GBCAQTC` / `MTFC128GBCAQTC` / `MTFC256GBCAQTC` / `MTFC64GBCAQDQ` 型号。
  <https://sg.micron.com/sales-support/downloads/software-drivers/emmc-software>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口；多个 part detail 页面确认 `MTFC...` 位于 Universal Flash Storage 目录。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbcavtc-aat>

已采集编码：

| PN 结构 | 字段 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | 新版 Flash + Controller / e.MMC / UFS |
| `MTFC` + density + component(1) + controller(1) + package(2) + optional suffix | 旧版 e.MMC/custom card |
| `MTFC` | Micron Technology + Flash Controller |
| density `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` | 512MB / 1GB / 2GB / 4GB / 8GB / 16GB / 32GB / 64GB / 128GB / 256GB / 512GB / 1TB，落库为 Mbit |
| component `AA..AP` | 新版 e.MMC NAND component 表，含 width / component density / generation |
| component `A..R` | 旧版 e.MMC NAND component 表 |
| controller `AA..AN` / `A..Z` | controller revision 表 |
| package `AM/CN/DM/EA/.../NS` | package code；`NS` 来自 UFS v2.1 datasheet |
| special option `0F/0M/1M/.../O1` | boot/enhanced area / firmware option |
| temp `CT/WT/IT/AIT/AAT/AITI` | Commercial / Standard / Extended / Industrial 温区 |
| family key `component:controller` | 用规则库判断具体 managed family：如 `AC:AJ` -> eMMC 5.0，`BC:AQ` -> eMMC 5.1 TLC Pearl，`AS:AO` -> UFS 2.1，`BC:AV` -> UFS 3.1，`BE:AX` / `AY:AX` -> UFS 4.0 |

注意：`MTFC` 同时覆盖 e.MMC 与 UFS，不能只靠前缀判断类型。实现中先按结构切 token，再用 `component:controller` 和 component 表推导 `type`；未知组合返回 `nandcon`，并保留 component/controller/package code 与容量。

示例：

- `MTFC4GACAJCN-1M WT` -> Micron eMMC, 4GB, eMMC 5.0, package `CN`, special option `1M`, Standard temp。
- `MTFC256GASAONS-IT` -> Micron UFS, 256GB, UFS 2.1, package `NS`, Extended temp。
- `MTFC256GZZZZZZ-WT` -> Micron NAND with Controller, 256GB, 未知 family，但保留 `ZZ/ZZ/ZZ` token。

## Samsung eMMC / UFS

来源：

- Samsung eMMC 5.1 `KLMAG1JETD-B041` 官方页面给出 16GB、HS400、1.8/3.3V、-25~85°C 和 BGA 尺寸。
  <https://semiconductor.samsung.com/us/estorage/emmc/emmc-5-1/klmag1jetd-b041/>
- Samsung UFS 3.1 `KLUEG8UHDB-C2E1` 官方页面给出 256GB、G4 2Lane、1.2/2.5V、-25~85°C 和 BGA 尺寸。
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-3-1/klueg8uhdb-c2e1/>
- Samsung UFS 4.0 官方页面说明 G5 2Lane、9x13 封装、1.2V I/O 和 128GB~1TB 容量范围；`KLUFG8RHHF-F0G1` 官方页面/搜索结果给出 512GB UFS 4.0。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-4-0/>
  <https://semiconductor.samsung.com/us/estorage/ufs/ufs-4-0/klufg8rhhf-f0g1/>
- Samsung UFS 4.1 官方页面说明 G5 2Lane、153 FBGA、9x13x0.85mm、128GB~1TB 容量范围；公开页面包含 `KLUEG4RHKF-F0H1` UFS 4.1 型号。
  <https://semiconductor.samsung.com/kr/estorage/ufs/>
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-4-1/klueg4rhkf-f0h1/>

已采集编码：

| PN 结构 | 字段 |
| --- | --- |
| `KLM` + density + stack + die type + voltage/controller/package/version/temp | Samsung eMMC / moviNAND |
| `KLU` + density + stack + die type + voltage/controller/package/version/temp | Samsung UFS |
| UFS controller `H` + version `G` | UFS 4.0 / G5 2Lane |
| UFS controller `K` + version `H` | UFS 4.1 / G5 2Lane |
| `KLMAG1JETD-B041` | eMMC 5.1, 16GB, HS400 |
| `KLM8G1GETF-B041` / `KLMBG2JETD-B041` / `KLMCG4JETD-B041` | eMMC 5.1 line-up samples |
| `KLUEG8UHDB-C2E1` | UFS 3.1, 256GB, G4 2Lane |
| `KLUFG8RHHF-F0G1` | UFS 4.0, 512GB, G5 2Lane |
| `KLUEG4RHKF-F0H1` | UFS 4.1, 256GB, G5 2Lane |

注意：Samsung UFS 4.0/4.1 不能只看 `KLU` 前缀，必须继续按 controller/version token 组合解析。`G` 仍保留为 UFS 4.0，新增 `H` version token 表示 UFS 4.1。

## SK hynix e-NAND / UFS

来源：

- SK hynix eMMC brochure / catalog mirror 给出 eMMC 5.1 line-up，可归纳出 `H26M/H26T` 托管 NAND 结构、容量位和 automotive grade 后缀。
  <https://netlist.com/wp-content/uploads/2023/06/SK-Hynix_Managed-NAND_eMMC.pdf>
- SK hynix e-NAND H26M Series datasheet mirror 给出 8GB/16GB/32GB/64GB eMMC 5.1、VCC 3.3V / VCCQ 1.8V、HS400+CMDQ、153FBGA 以及 automotive grade 示例。
  <https://media.digikey.com/pdf/Data%20Sheets/Netlist%20Inc%20PDF/H26M%20Series.pdf>
- SK hynix UFS3.1 3D V7 datasheet mirror 给出 `HN8Tx5DxHKX07x` 结构、`HN8`=UFS、`5`=UFS3.1、`K`=Mobile -25~85°C、`T0/T1/T2/T3`=128GB/256GB/512GB/1TB，以及 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079` line-up。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS3.1-3D-V7-Datasheet-128GB-1TB-V1.1.pdf>
- SK hynix UFS 2.1 分销页给出 `H28SAO301MMR`，类型 UFS、Sub-Type UFS 2.1、FBGA、512GB；同页相关型号列出 `H28S6D302BMR` 32GB / `H28S8Q302CMR` 128GB。
  <https://www.preduo.com/product/ufs/ufs-2-1/h28sao301mmr>

已采集编码：

| PN 结构 | 字段 |
| --- | --- |
| `H26` + media(1) + density(1) + revision/config(7) + optional grade | SK hynix e-NAND / eMMC |
| media `M` / `T` | managed e-NAND / eMMC 族 |
| density `4/5/6/7/8` | 8GB / 16GB / 32GB / 64GB / 128GB |
| eMMC grade `N/A` | Commercial / Mobile, -25~85°C |
| eMMC grade `I` | Industrial, -40~85°C |
| trailing `X` | brochure placeholder：按 grade 变化，当前记录为 Automotive Grade 2/3 |
| trailing `Q` | 已按 automotive grade 2 先收敛，需更多 datasheet 复核 |
| `HN8` + density token + series(2) + package/temp/feature + serial | SK hynix UFS |
| `HN8` density `T0/T1/T2/T3` | 128GB / 256GB / 512GB / 1TB |
| `HN8` density `G96/T06/T16/T25/T35` | 64GB / 128GB / 256GB / 512GB / 1TB，兼容公开 line-up 的完整 density token |
| `HN8` series `2E/DE/DZ` | UFS 3.1, 176-layer 4D NAND (V7) |
| `HN8` temp `K` | Mobile, -25~85°C |
| `H28S` + density(1) + product serial | SK hynix older UFS 2.1 |
| `H28S` density `6/7/8/9/A` | 32GB / 64GB / 128GB / 256GB / 512GB |

示例：`H26M78208CMRX` -> SK hynix eMMC, 64GB, automotive grade token `X`。

示例：`HN8T25DEHKX077N` -> SK hynix UFS, 512GB, UFS 3.1, V7, Mobile。

注意：灰市/分销页常见 `H9HQ...` 多为 uMCP (UFS + LPDDR)，不能直接当作纯 UFS parser；本轮不把 `H9*` 纳入 UFS 规则。

## 本轮落地

- `packages/dsl/src/rules/packs/westerndigital-token.json`
  - `vendor.sndk.inand.managed.v1`
- `packages/dsl/src/rules/packs/kioxia-token.json`
  - `vendor.kioxia.emmc.managed.v1`
  - `vendor.kioxia.ufs.managed.v1`
- `packages/dsl/src/rules/packs/skhynix-token.json`
  - `vendor.skhynix.emmc.managed.v1`
  - `vendor.skhynix.ufs.hn8.v1`
  - `vendor.skhynix.ufs.h28s.v1`
- `packages/dsl/src/rules/packs/samsung-token.json`
  - 扩展 Samsung UFS 4.1 controller/version token
- `packages/dsl/src/rules/packs/micron-token.json`
  - `vendor.micron.managed.mtfc.nextgen.v1`
  - `vendor.micron.emmc.mtfc.legacy.v1`
- `packages/dsl/test/managed-nand.test.ts`
  - 覆盖 SanDisk / KIOXIA / SK hynix / Micron / Samsung 的 eMMC/UFS positive cases，以及 unknown-token fallback cases
- `packages/core/src/fdb-lookup.ts` / `packages/fdbgen/src/vendors/kioxia.ts`
  - KIOXIA managed NAND `THG*` 归属识别
