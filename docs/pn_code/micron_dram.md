# Micron DRAM PN 编码资料

采集日期：2026-05-15；更新日期：2026-07-12

## 资料来源

- Micron 官方 `numdram.xlsx`（`DRAM Component Part Numbering System`，Rev: May 4, 2023）覆盖 DDR5/4/3/2/DDR/SDRAM、LPDDR5/4/3/2/LPDDR/LPSDR、RLDRAM2/3 与 GDDR7/6X/6/5X；本轮用于补齐 product family / voltage、mobile device version 与 marketing speed token。
- Micron 官方 Packaging and shipping information 页面列出 `DRAM Component Part Numbering System` 下载入口；入口当前可能需要 Micron 登录/NDA。
  <https://www.micron.com/sales-support/sales/packaging-and-shipping-information>
- Micron 官方 FBGA and component marking decoder 会返回 Micron `MT...` 或 Crucial namespace `CT...` 的完整 PN；例如 `C9BJZ` 反查为 `CT40A1G8SA-62M:E`。
  <https://www.micron.com/sales-support/design-tools/fbga-parts-decoder>
- Micron 官方 part detail / part catalog 页面可直接确认样例 PN 属于对应 DRAM 产品线。
  - DDR4 `MT40A1G8SA-075-E`: <https://www.micron.com/products/memory/dram-components/ddr4-sdram/part-catalog/part-detail/mt40a1g8sa-075-e>
  - DDR5 `MT60B2G8HB-48B-IT-A`: <https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b2g8hb-48b-it-a>
  - DDR5 high-capacity configs `MT60B6G4RW-56B:B` / `MT60B3G8RW-64B:B` / `MT60B1536M16RV-56B:B` and `MT60B4G8AT-64B:B` confirm 24Gb / 32Gb component configuration forms. 16Gb/24Gb/32Gb DDR5 addendum screenshots confirm package dimensions and CL-bearing speed bins through `-92B`. Sources: <https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b3g8rw-64b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b6g4rw-56b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b1536m16rv-56b-b>、<https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b4g8at-64b-b>
  - DDR3 `MT41K512M8DA-107`: <https://www.micron.com/products/memory/dram-components/ddr3-sdram/part-catalog/part-detail/mt41k512m8da-107>
  - DDR2 `MT47H128M16RT-25E-IT`: <https://www.micron.com/products/memory/dram-components/ddr2-sdram/part-catalog/part-detail/mt47h128m16rt-25e-it>
  - LPDDR4 `MT53E1G32D2FW-046-AIT-A`: <https://www.micron.com/products/memory/dram-components/lpddr4/part-catalog/part-detail/mt53e1g32d2fw-046-ait-a>
  - LPDDR5 `MT62F1G32D4DS-031-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr5/part-catalog/part-detail/mt62f1g32d4ds-031-wt-b>
  - Micron LPDDR5 live catalog confirms package tokens `CZ/DV/K2/ZU` as `TFBGA-561, 8x12.4x1.2`、`LFBGA-315, 12.4x15x1.3`、`UFBGA-496, 14x12.4x0.58`、`UFBGA-496, 14x12.4x0.65`; it also confirms `EK = TFBGA-441, 14x14x1.1`。这些映射只按 PN 中实际 package token 输出。<https://www.micron.com/products/memory/dram-components/lpddr5/part-catalog>
  - Micron 官方 LPDDR4/4X、LPDDR5/5X current 与 obsolete catalog JSON 进一步确认 MT53 package token `AL/BA/BD/BE/BF/BP/CY/DE/DS/DT/EG/FW/GS/HG/HJ/HK/JL/KS/NH/NK/NP/NQ/NW/NY/NZ/QD/RN/RQ/RR/SQ/SU/SY/TN/TT/WW/ZW`，以及 MT62 token `AE/BG/CH/CL/CZ/DL/DR/DS/DV/EJ/EK/EP/FH/FK/FL/K2/ZA/ZU/ZV/ZX`。同一 token 的 type 或厚度跨 catalog row 不一致时只保留共同可确认部分；`FW` 的 556-ball 变体必须由实际 `voltage + config + package` token 组合确认。官方 obsolete catalog 同时确认 `3072M32 = 96Gb x32` 与 `DR = TFBGA-315, 12.4x15x1.1`。来源：<https://www.micron.com/content/micron/us/en/products/memory/lpddr-components/lpddr4/part-catalog/_jcr_content.products.json/getpartcatalog/memory/lpddr4/-/en_US>、<https://www.micron.com/content/micron/us/en/products/memory/lpddr-components/lpddr5/part-catalog/_jcr_content.products.json/getpartcatalog/memory/lpddr5/-/en_US>、<https://www.micron.com/content/micron/us/en/products/memory/lpddr-components/lpddr5x/part-catalog/_jcr_content.products.json/getpartcatalog/memory/lpddr5x/-/en_US>、<https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-lpddr4/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-lpddr4/-/en_US>、<https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-lpddr5x/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-lpddr5x/-/en_US>
  - LPDDR5X `MT62F1G64D4EK-023 WT:B`: <https://www.micron.com/products/memory/dram-components/lpddr5x/part-catalog>、分销页交叉确认 `LPDDR5X SDRAM` / `8533 Mbps` / `TFBGA-441`: <https://www.absunshine.com/en/parts/MT62F1G64D4EK-023-WT-B-MICRON-5778871>
  - 441b x64 Automotive LPDDR5 ordering chart confirms `MT62F512M64D4EK-031 AIT:B` / `AAT:B` / `AUT:B` / `FAAT:B` and `MT62F1G64D8EK-031 AIT:B` / `AAT:B` / `AUT:B` / `FAAT:B`: `512M64` = 32Gb x64, `1G64` = 64Gb x64, `D4` / `D8` = 4 / 8 die, `EK` = TFBGA-441, `-031` = 313ps tWCK / 6400 Mb/s, optional `F` = functional safety features, optional `A` = automotive grade, and `:B` = second generation.
  - LPDDR3 `MT52L512M32D2PF-107-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr-components/part-catalog/part-detail/mt52l512m32d2pf-107-wt-b>
  - LPDDR2 2Gb-family datasheet confirms the structural `64M64` / `96M64` / `128M64` configuration tokens as 4Gb / 6Gb / 8Gb x64 devices with `D2` / `D3` / `D4` die counts. The same ordering table maps actual package tokens `MH/MG` to FBGA-134, `KL/LE/KP` to FBGA-168, `KH/KJ/KU` to FBGA-216, and `MP/LD` to FBGA-220. These mappings are applied only when the corresponding package token is present in the PN. Source: <https://datasheet.octopart.com/MT42L128M16D1KL-25-IT%3AA-Micron-datasheet-11551085.pdf>
  - Micron's official obsolete LPDDR catalog further confirms token-specific package details used by the decoder: `AC = VFBGA-134, 10x11.5x1.0`, `LG = WFBGA-168, 12x12x0.8`, `LK/LL = WFBGA-216, 12x12x0.8`, `LM = VFBGA-216, 12x12x1.0`, `MC = WFBGA-240, 14x14x0.8`; `EU` confirms VFBGA and `14x14x0.8` but does not expose a reliable pin count, so the decoder intentionally omits it. <https://www.micron.com/products/obsolete/obsolete-lpddr/part-catalog>
  - GDDR6X `MT61K512M32KPA-24-U`: <https://www.micron.com/products/memory/graphics-memory/gddr6x/part-catalog/part-detail/mt61k512m32kpa-24-u>
  - GDDR7 `MT68A512M32DF-32:A`: Micron GDDR7 product brief 明确 `68 = GDDR7 SGRAM`、`A = 1.2V`、`512M32`、`DF = FBGA-266, 12x14x1.1`、`-28/-32 = 28/32Gbps`。
- Micron 官方 GDDR7 live catalog 继续确认 `MT68A768M32DF-28:A/-32:A` 为 24Gb x32 GDDR7，并与既有 `MT68A512M32DF-28:A/-32:A` 共用结构；四个 exact PN 均进入搜索资源。来源：<https://www.micron.com/products/memory/graphics-memory/gddr7/part-catalog>
- Micron 官方 GDDR6 live catalog 确认 `MT61M512M32KPA-14 N:C` 的 `M` 电压为 1.25V，并确认 automotive `MT61R512M32KPA-16 AAT:E` 的 `R` 为 1.35V VDD / 1.25V VDDQ；后者必须使用 `family + voltage` 局部组合覆盖，不能把通用 `R = 1.55V` 跨产品线改写。catalog 还确认 `-18` 为 GDDR6-18Gbps。相关 exact PN 已由 MDB 覆盖，因此不重复写入 `dram-pn.json`。<https://www.micron.com/products/memory/graphics-memory/gddr6/part-catalog>
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
  - <https://www.digikey.com/htmldatasheets/production/848961/0/0/1/mt41j1g4-512m8.html>
  - <https://www.digikey.bg/htmldatasheets/production/1004675/0/0/1/mt41k1g4-mt41k512m8.html>
  - <https://www.digikey.com/htmldatasheets/production/1959025/0/0/1/mt41k2g4-mt41k1g8.html>
  - <https://www.digikey.com/en/htmldatasheets/production/1889239/0/0/1/mt41k512m16>
  - <https://www.digikey.com/htmldatasheets/production/1959024/0/0/1/mt41k1g16.html>
  - <https://e-nexty.dxp.nexty-ele.com/en/product_files/download?lc_code=ja&maker_code=MICRONT&product_file_id=4801656&product_id=5843368&product_part_number=MT41J2G4TRF-125%3AE&search_log_id=7616014>
  - <https://pdf.elecfans.com/MICRON/MT41K2G8KJR-125%3AA%20TR.html>
- Micron DDR4 TwinDie datasheet 用于确认 `MT40A` 双 die 规则。`MT40A2G4/MT40A1G8` 和 `MT40A4G4/MT40A2G8` 公开 datasheet 明确 x4/x8 TwinDie 是 two ranks / dual CS；`MT40A1G16` 和 `MT40A2G16` 公开 datasheet 明确 x16 TwinDie 是 two x8 die 组合成 single-rank x16；`MT40A8G4/MT40A4G8` 的公开 datasheet 镜像确认 32Gb x4/x8 TwinDie。来源：<https://www.digikey.ch/htmldatasheets/production/1922660/0/0/1/mt40a2g4-mt40a1g8.html>、<https://www.digikey.com/htmldatasheets/production/1952763/0/0/1/mt40a4g4-mt40a2g8.pdf>、<https://www.alldatasheet.net/datasheet-pdf/pdf/2168610/MICRON/MT40A2G16.html>、<https://en.sekorm.com/doc/2000552.html>
- Micron DDR4 3DS datasheet 用于确认 `MT40A4G4/MT40A2G8` 2H 3DS 与 `MT40A8G4/MT40A4G8` 4H 3DS。2H 3DS 输出 `series_info = 3DS 2H`、`2 dies`、`1 CS`；4H 3DS 输出 `series_info = 3DS 4H`、`4 dies`、`1 CS`。该 `CS Count` 表示外部 chip select，3DS 内部 logical ranks 由 C[2:0] 选择，不按外部 CS 数累加。来源：<https://www.rxelectronics.sg/datasheet/b9/MT40A4G8KVA-083H-G.pdf>
- Micron Memory Japan `EDY4016A` 4Gb x16 DDR4 datasheet 确认 legacy DDR4 `EDY 40 16 A A BG - speed - F - packing` 结构：`40=4Gb`、`16=x16`、`A=1.2V VDD/VDDQ`、`BG=96-ball FBGA (7.5x13.5)`、`JD/GX/DR` 分别为 DDR4-3200/2666/2400 timing、`F=Lead-free RoHS-compliant and halogen-free`、`D/R=tray/tape reel`；features 页确认 VPP=2.5V、POD I/O、8 internal banks 和 commercial `0°C ~ 95°C`。来源：<https://media.digikey.com/pdf/Data%20Sheets/Micron%20Technology%20Inc%20PDFs/EDY4016A.pdf>
- DigiKey / Micron part catalog 页面交叉确认 `EDY4016AABG-DR-F-D`、`EDY4016AABG-GX-F-D`、`EDY4016AABG-JD-F-D` 及 `-R TR` 订货形态属于 Micron DDR4 4Gbit 256M x16 96-FBGA；资源中 canonical PN 只保留 `-R`，不保留分销包装后缀 `TR`。来源：<https://www.digikey.com/en/products/detail/micron-technology-inc/EDY4016AABG-DR-F-D/6024312>、<https://www.digikey.com/en/products/detail/micron-technology-inc/EDY4016AABG-GX-F-D/6024313>、<https://www.digikey.com/en/products/detail/micron-technology-inc/EDY4016AABG-JD-F-D/6024314>、<https://my.micron.com/products/memory/dram-components/ddr4-sdram/part-catalog/part-detail/edy4016aabg-dr-f>
- 公开镜像 `DRAM Component Part Numbering System` 可核对字段顺序、family/voltage/device version/temperature/status/revision/speed 等 token 含义；镜像版本较旧，只用于字段结构交叉验证。
  <https://docslib.org/doc/10329358/dram-component-part-numbering-system>
- 用户提供的 `常见几种DDR3_DDR3L的命名规则.pdf` 中 Micron `DRAM Component Part Numbering System` 页面确认 DDR3 speed token `187E/15E/125/125E/107/093` 对应 1066/1333/1600/1600/1866/2133 与 CL7/9/11/10/13/14；规则使用 family-scoped `41:*` speed，避免 `093` 落到 LPDDR4 通用含义。
- 用户补充的 Micron DDR3 / DDR3L ordering 截图确认 package code 为 1-3 字符，并确认 `DA/JT/RH/HA/RA/RE/HX/THA/SMA/TNA/SLD` 的实际 FBGA 封装尺寸；输出统一使用 `TYPE-PIN, DIM`，例如 `HA = FBGA-96, 9x14`、`RH = FBGA-78, 9x10.5`、`HX = FBGA-78, 9x11.5`、`THA = FBGA-78, 10x11.5x1.45`、`SMA = FBGA-78, 9.5x11.5x1.45`、`TNA = FBGA-96, 10x14x1.2`、`SLD = FBGA-136, 10x14x1.2`；package 不输出 Rev / ball / mm 等资料注记。同组截图确认 `A` 为 Automotive product certification，`M` 为 TCSR power saving，`IT` 为 `-40°C ~ 95°C`，`AT` 为 `-40°C ~ 105°C`。Die/CS 按 package-only 判断：`THA/SMA = 4 dies, 4 CS`，`TNA = 2 dies, 2 CS`，`SLD = 2 dies, 1 CS`。
- 用户补充的 Micron DDR3L `MT41K512M16` TwinDie 截图确认 `VRN/VRP` 为 `FBGA-96, 8x14`，两个 x8 die 组成一个 x16 device，输出 `2 dies, 1 CS`，`IT` 温度为 Industrial (-40°C ~ 95°C)，`VRN/VRP` 的焊球材料分别为 `Pb-free SAC302` / `Pb-free SACQ`。
- 用户补充的 Micron DDR4 ordering 截图确认 `MT40A` 普通 / automotive DDR4 的 package code 可跨 family 复用，公共 FBGA package 先按 package code 查表，少数冲突再用 `family:package` override；新增确认 `HX/RH/WE/SA/HA/GE/LY/TB/VA/JC/RC/KD/PM/JY/TD/AG/AD`，以及 DDR4 `062Y/062E/068E/068/075E/075/083E/083/093E/093/107E` timing token，其中 `093` 为 `DDR4-2133 CL16`，`107E` 为 `DDR4-1866 CL13`。Automotive DDR4 中 `A` 为 automotive grade，`IT/AT/UT` 分别为 `-40°C ~ 95°C`、`-40°C ~ 105°C`、`-40°C ~ 125°C`。
- 用户补充的 Micron DDR4 TwinDie 截图确认 `TRF/FSE/NRE/NEA` 为 low-profile `x1.2` FBGA，且 TwinDie 必须显式输出 `2 dies, 2 CS`，而不是只输出 package 或只靠名称暗示。
- 本轮继续扫描 Micron DDR3 / DDR3L / DDR4 / DDR5 package 后，公开 datasheet / catalog 直接确认 `JP/BY/LA/JE/EF/RG/TW/SN/SGB/SKL/HS/HT`，并通过外部表 + RDIMM datasheet 交叉确认 `THR`。`SGB` 为 x32 TwinDie `2 dies, 1 CS`；`SKL` 为 x16 TwinDie single-rank `2 dies, 1 CS`；`THR` 为 DDR3 x4 TwinDie `2 dies, 2 CS`。来源：<https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/588/MT41J256M4%2C128M8%2C64M16.pdf>、<https://uttc.com.tw/wp-content/uploads/2025/12/2Gb-x4-x8-x16-DDR3-SDRAM_Rev.N-0111-EN_Data-sheet.pdf>、<https://www.alliancememory.com/wp-content/uploads/Micron_2Gb_DDR3_SDRAM_PartNo.MT41J128M16JT-107.pdf>、<https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/6128/MT41K1G4_MT41K512M8_MT41K256M16_RevR_Sep2018.pdf>、<https://www.ic-components.ru/files/7b/MT41K1G8SN-125-A.pdf>、<https://datasheet.octopart.com/MT41K256M32SLD-125%3AE-Micron-datasheet-180657479.pdf>、<https://www.farnell.com/datasheets/3760671.pdf>、<https://www.micron.com/content/micron/us/en/products/memory/dram-components/ddr5-sdram/part-catalog/_jcr_content.products.json/getpartcatalog/memory/ddr5-sdram/-/en_US>、<https://www.findchips.com/compare/MT41J256M4JP-125EAT%3AF--vs--MT41J512M4THR-15%3AD>、<https://datasheet.octopart.com/MT36JDZS1G72PZ-1G4D1-Micron-datasheet-11776295.pdf>
- 继续扫描 Micron DDR4 package 后，Micron obsolete DDR4 catalog JSON 与公开 Micron/Alliance automotive DDR4 datasheet 交叉确认 `40:JE` / `40:KH`：`JE` 为 x8 `FBGA-78, 9x11x1.2`，`KH` 为 x16 `FBGA-96, 9x13x1.2`，均为普通 1 component / SDP，不进入 TwinDie / QuadDie 规则。来源：<https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-ddr4-sdram/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-ddr4-sdram/-/en_US>、<https://www.alliancememory.com/wp-content/uploads/16gb_auto_ddr4.pdf>
- 公开评测记录了 Crucial/Ballistix 颗粒 `C9BJZ` / `CT40A1G8SA-62M:E` 的实物和 Micron FBGA decoder 结果；该资料只用于确认 `CT40` namespace 形态，不作为完整 PN 白名单。
  <https://aphnetworks.com/reviews/ballistix-elite-pc4-28800-4x8gb/2>
- Micron 官方 `Legacy LPDRAM Part Numbering System / Legacy DDR4, DDR3/L, & DDR2 SDRAM Part Numbering System` PDF 记录了 Micron 收购 Elpida 后的 legacy Elpida PN 命名；Micron FBGA code 反查可能返回 `EDB/EDF...` Elpida LPDRAM PN，也可能返回 `ED/EE + 40/41/47/...` 这类 legacy PN。
  <https://assets.micron.com/adobe/assets/urn:aaid:aem:0b279ea9-4e4c-49fa-98c6-c18ad4c67279/original/as/legacy-elpida-pns.pdf>
- Preduo 公开 `Micron Part Number List`，列出 FBGA code 与 PN 文本；本项目只将其作为一次性 5 位 code 提取来源，不信任页面中的 PN 对应关系。PN 映射必须由 Micron 官方 FBGA decoder API 重新生成。
  <https://www.preduo.com/part-number-list/micron-part-number-list>

## iTXTech fdnext DecodePack 范围

- 主线 DRAM 规则文件：`packages/core/src/decodepack/rules/packs/micron-dram-token.json`
- Stacked / specialty DRAM 规则文件：`packages/core/src/decodepack/rules/packs/micron-hbm-token.json`、`packages/core/src/decodepack/rules/packs/micron-hmc-token.json`
- 规则 ID：`vendor.micron.dram.component.v1`、`vendor.micron.dram.japan.component.v1`
- 首批覆盖：DDR/SDR/LPDDR/GDDR 主线 component PN，包括 Micron catalog `MT40/41/42/46/47/48/51/52/53/58/60/61/62/68`、Crucial namespace `CT40/41/42/46/47/48/51/52/53/58/60/61/62/68`，以及 Micron legacy Elpida namespace `ED/EE + 40/41/42/44/46/47/48/49/51/52/53/58/60/61/62/68`。Micron Memory Japan legacy DDR4 `EDY4016...` 使用独立规则，不混入 `MT40` token 流。
- Stacked / specialty 覆盖见 [micron_hbm.md](micron_hbm.md) 和 [micron_hmc.md](micron_hmc.md)：当前加入 Micron HBM2E `MT54A...` 与 HMC `MT43A...`，用于修正这类 PN 被 fallback 误判为 raw NAND 的问题。
- Micron 官方 SDRAM catalog 确认 `2M32` / `4M16` / `4M32` / `8M16` / `8M32` 为实际 component-configuration token；规则按 `depth x width` 计算容量并输出宽度。`B2` 仅作 device-version token 消耗，`B4` / `B5` / `P` / `TG` 封装仅在 PN 中实际存在对应 token 时输出；其中 x32 `P/TG` 使用 `TSOP-II-86, 10x22x1.2`，x16/x8 `TG` 使用 `TSOP-II-54, 10x22x1.2`。来源：<https://www.micron.com/products/memory/dram-components/sdram/part-catalog>、<https://www.micron.com/products/obsolete/obsolete-sdram/part-catalog>。
- Micron LPDDR2 的 `64M64` / `96M64` / `128M64` configuration token 按 datasheet 结构分别输出 `4Gb` / `6Gb` / `8Gb`、`x64`；package 继续独立按 PN 中实际存在的 package token 解析，不能仅凭 configuration 或 exact PN 反推。
- 不使用完整 PN 白名单；只按 Micron DRAM part-numbering token 解析字段。

## 搜索资源

- `packages/core/resources/dram-pn.json` 只收录尚未被有效 MDB mapping 覆盖的 Micron / Crucial DRAM PN，用于 `searchParts()` PN 补全，不是解码依据。MDB 已有等价 PN，或通过 suffix 边界给出更完整的 speed / temperature / status / revision 时，以 MDB 为准，不重复加入较短 seed；带 `DO NOT USE` 的 MDB 值不算覆盖。
- `pnpm fdbgen:crawl-mdb` 默认按 Micron FBGA prefix profile 生成候选，通过 Micron 官方 FBGA decoder API 写入统一 `packages/core/resources/mdb.json`。当前默认 profile 包括 `C9/D8/D9/Z8/Z9` 后三位字母网格，以及 `NC/NW/NY/NX/NQ/NV` 数字段；`--codes` 补充输入按前缀路由，命中 Micron profile 的 code 走 Micron API，`P*` code 走 SpecTek。
- `packages/core/resources/mdb.json` 收录官方 API 返回且通过 DRAM family 过滤的 FBGA code 到完整 PN 映射，例如 `C9BJZ -> CT40A1G8SA-62M:E`。它用于 `searchParts()` code 查询，以及 `decodePart({ query: "C9BJZ" })` 这类 code 输入时先反查 PN 再走 iTXTech fdnext DecodePack。
- 资源导入时只保留最小索引字段：DRAM PN 表为 `vendor/pn`，FBGA code 反查统一来自 `mdb.json` 的 code -> PN 映射。真正输出的 `density`、`package`、`dram_type`、`dram_die_count` 等字段仍由 iTXTech fdnext DecodePack token 解析。
- `mdb.json` 中有大量带冒号 revision 的 DRAM PN，例如 `D8BBF -> MT53E128M32D2FW-046 IT:A`、`D9WCR -> MT61K256M32JE-12:A`、`D8FHL -> MT68A512M32DF-28:A`、`D8BCJ -> MT62F512M32D2DS-031 AAT:B`。PN 补全和 decode classification 支持用户省略冒号查询，并回到带冒号的官方 PN 展示。

## PN 结构

典型结构：

```text
(MT|CT) + family + voltage + component configuration + device version + package code + -speed + -temperature + production status + :/ -revision
```

`CT` 前缀来自 Crucial / Ballistix namespace，后续 token 仍沿用 Micron DRAM 结构解析。输出保留原始 `CT...` PN，不强行改写为 `MT...`，因为 Crucial 的 speed/bin token 不一定与公开 `MT...` catalog token 一一对应。

Micron Memory Japan legacy DDR4 `EDY4016...` 使用独立结构：

```text
EDY + density + width + voltage + die revision + package + -speed + -solder + -packing
```

当前外部确认的 `EDY4016A` 表示 4Gb x16 DDR4；`JD/GX/DR` 分别输出 `DDR4-3200 24-24-24`、`DDR4-2666 19-19-19`、`DDR4-2400 16-16-16`。`-R TR` 这类分销订货写法归一为 canonical `-R`。

首批 family token：

| Token | 产品线 | 输出 |
| --- | --- | --- |
| `40` | DDR4 SDRAM | `dram_type=DDR4` |
| `41` | DDR3 SDRAM | `dram_type=DDR3` |
| `42` | Mobile LPDDR2 | `dram_type=LPDDR2` |
| `43A` | HMC / HMC Gen2 | `dram_type=HMC`，详见 [micron_hmc.md](micron_hmc.md) |
| `44` | RLDRAM 3 | `dram_type=RLDRAM 3` |
| `46` | DDR SDRAM / Mobile LPDDR | 默认 `dram_type=DDR`，`H/HC` voltage token 细化为 `LPDDR` |
| `47` | DDR2 SDRAM | `dram_type=DDR2` |
| `48` | SDRAM / Mobile LPSDR | 默认 `dram_type=SDR`，`H` voltage token 细化为 `LPSDR` |
| `49` | RLDRAM 1/2 | `dram_type=RLDRAM` |
| `51` | GDDR5 | `dram_type=GDDR5` |
| `52` | Mobile LPDDR3 / DDR3L Mobile | 默认 `dram_type=LPDDR3`，`K` voltage token 细化为 `DDR3` |
| `53` | Mobile LPDDR4 / LPDDR4X | 默认 `dram_type=LPDDR4`，`D/E` voltage token 细化为 `LPDDR4X` |
| `54` | HBM2E | `dram_type=HBM2E`，详见 [micron_hbm.md](micron_hbm.md) |
| `58` | GDDR5 / GDDR5X | 默认 `dram_type=GDDR5X`，GDDR5 speed bin 可细化为 `GDDR5` |
| `60` | DDR5 SDRAM | `dram_type=DDR5` |
| `61` | GDDR6 / GDDR6X | 默认 `dram_type=GDDR6`，部分 speed bin 细化为 `GDDR6X` |
| `62` | Mobile LPDDR5 / LPDDR5X | 默认 `dram_type=LPDDR5`，`020/020F/023` 等 LPDDR5X speed bin 细化为 `LPDDR5X` |
| `68` | GDDR7 | `dram_type=GDDR7` |

## 输出约定

- `fields.density` 使用项目统一 Mbit 单位，由 `component configuration` 的 depth x width 推导，例如 `1G8` 输出 `8192`。
- `fields.device_width` 输出组织位宽，例如 `1G32` 输出 `x32`。
- `fields.voltage` 输出 Micron voltage token 对应说明。
- `fields.package` 输出实际封装，例如 `FBGA-78, 7.5x11`；Micron FBGA package code 优先按 package-only 公共表复用，少数跨产品线冲突保留 `family + package code` override。
- standalone DRAM 的 `fields` 避免重复顶层输出：不再输出 `product_family`、`product_version`、`dram_density`、`dram_width`。
- `fields` 使用跨厂商 DRAM canonical key：`dram_type`、`series_info`、`dram_die_count`、`cs_count`、`bank_count`、`interface_type`、`dram_speed`、`operation_temperature`、`die_revision`、`solder_type`、`packing_type`、`special_option`。
- `device version` 先按 family scope 匹配，避免 `DA/DE/LF` 等 token 与 package code 冲突；`D1/D2/D3/D4/D6/D8/DA/DB/DC/DD/DE/LF/L2/L4` 只标准化为 `dram_die_count`，例如 `D4` 输出 `dram_die_count=4`；`LG` 额外输出 `special_option = Reduced page-size addressing`，`DD/DE` 保留官方 LPDDR4 mixed die stack 描述；没有 CS 资料时不输出 `cs_count`。
- `speed` token 同样优先按 family scope 匹配：DDR5 `32B/36B/40B/44B/48B/52B/56B/64B/72B/80B/88B/92B`、DDR4 `062Y/062E/068E/068/075E/075/083E/083/093E/093/107E`、DDR3 `125E`、DDR2 `3`、DDR `6T`、SDR `7E/10`、GDDR5 `50/60/70`、GDDR5X `110/120/140`、GDDR6 `10/15` 与 GDDR6X `19/20/22/23` 来自官方 2023 PNS 或公开 ordering 截图；`18` 同时出现在 GDDR6/GDDR6X 表中，当前不在 decodepack 中强行判定。
- GDDR6 / GDDR6X 的 `12/13/14/16/21/24` 与 GDDR7 的 `28/32` 仅在 `61` / `68` family scope 下解释；相同数字可出现在 DDR2、DDR3、RLDRAM3 的 speed grade 中，不能跨产品族改写 `dram_type`。
- DDR5 `60:*` speed 对 addendum 明确给出 CL 的 bin 保留 CL 时序：`48B = DDR5-4800B CL40`、`52B = DDR5-5200B CL42`、`56B = DDR5-5600B CL46`、`64B = DDR5-6400B CL52`、`72B = DDR5-7200B CL58`、`80B = DDR5-8000B CL64`、`88B = DDR5-8800B CL72`、`92B = DDR5-9200B CL74`。
- DDR4 `40:*` speed 保留 CL 时序：`062Y/062E = DDR4-3200 CL22`、`068E = DDR4-2933 CL20`、`068 = DDR4-2933 CL21`、`075E = DDR4-2666 CL18`、`075 = DDR4-2666 CL19`、`083E = DDR4-2400 CL16`、`083 = DDR4-2400 CL17`、`093E = DDR4-2133 CL15`、`093 = DDR4-2133 CL16`、`107E = DDR4-1866 CL13`。
- DDR3 `41:*` speed 额外保留 `187E/15E/125/125E/107/093` 的 CL 时序：`DDR3-1066 CL7`、`DDR3-1333 CL9`、`DDR3-1600 CL11/CL10`、`DDR3-1866 CL13`、`DDR3-2133 CL14`。
- DDR3 / DDR3L 与 DDR5 Automotive 截图确认的 automotive certification `A` 在对应 package scope 下输出为 `special_option = Automotive certified`，随后继续解析 `AT/IT` 温度与 revision，例如 `-125AAT:D` 解析为 `DDR3-1600 CL11`、Automotive、`Rev D`，`-64BAAT:D` 解析为 `DDR5-6400B CL52`、Automotive certified、Automotive、`Rev D`；`M` 只在截图确认的 power-saving scope 下输出 `special_option = TCSR power saving`，避免把 `:M` revision 误解为 option。
- 对尚未确认实际封装尺寸的 1-3 字符 package token，规则只结构化消费 package code 以继续解析后续 speed / temperature / revision，不公开 `package` 或 `package_code`。对 legacy / Crucial 中当前尚未结构化建模的主体 token，规则可作为未公开 body 消费到 `-speed`，只保留已确定的 speed / temperature / revision 等后缀字段。
- TFBGA-441 x64 Automotive LPDDR5 (`family=62`, `package=EK`) 的 `-031` 按 6400 Mb/s 输出 `LPDDR5-6400`；该分支的温度 token 使用图中范围：`IT=-40°C~95°C`、`AT=-40°C~105°C`、`UT=-40°C~125°C`，前置 `F` 输出 `special_option=Functional safety features`。
- `-speed`、temperature、revision 后缀不是主结构强制项；缺少尾缀时仍解码 density / width / package / DRAM die count 等已确认字段，只减少 `dram_speed` / `die_revision` 等后缀信息。
- Micron revision token 可带冒号分隔，例如 `FAAT:B`；core PN 查询、FDB lookup 和 `dram-pn.json` 补全按冒号等价匹配，同时保留带冒号的官方 PN 展示。
- `dram_type` 必须使用跨厂商标准名，不带厂商名，不写组合候选。
- Micron 原始 config / package token 只用于内部解析，不进入公开字段；不要把未确认的 token 硬推成封装尺寸或 ball count。
- Micron Memory Japan `EDY4016...` 的 `A/BG/F/D/R/JD/GX/DR` 等 marking token 只作为内部 code；公开输出为 `die_revision`、`package`、`solder_type`、`packing_type` 和 `dram_speed`。
- Crucial namespace 的 `45M` / `55M` / `62M` 这类 speed/bin token 只输出为 `Crucial DDR4-45M` / `55M` / `62M`；没有外部公开表时不推导成 JEDEC CL 或 XMP 时序。
- 维护用来源、外部确认状态或推断来源不得进入 `fields`。

MDB 中的 Micron LPDDR4/LPDDR5 component configuration 继续按 `depth x width` 结构化解析，不按完整 PN 建表。本轮补齐较高密度 / 多通道组织 token，包括 `192M32/64`、`384M16`、`512M128`、`768M16/128`、`1024M32/64`、`1280M64`、`1536M128`、`2048M32`、`1G96/128`、`2G128`、`3G32/64`、`4G64`、`6G32`、`8G32`、`12G32`。例如 `3G64 = 192Gb x64`、`2G128 = 256Gb x128`、`1024M32 = 32Gb x32`；仅输出 token 可直接确定的 density / width，未取得 package-code 资料时不推测封装。

## Die / CS Packages

Micron DDR3 / DDR3L / DDR4 TwinDie / QuadDie die / CS topology 按 package-only 判断；DDR4 3DS 按 `family + config + package` 判断，避免同一 package code 在普通件与 3DS 件之间误用。Package code 在已确认资料中唯一对应 TwinDie / QuadDie 结构；同一 config 若换到普通封装，例如 `DA/HA/RH`，不输出 stacked 系列。

| Package / scope | series | die / CS | notes |
| --- | --- | --- | --- |
| `THA` / `SMA` | QuadDie | `4 dies, 4 CS` | QuadDie |
| `TNA` | TwinDie | `2 dies, 2 CS` | TwinDie |
| `SLD` | TwinDie | `2 dies, 1 CS` | TwinDie |
| `BAF` / `FSE` / `KJR` / `NEA` / `NRE` / `RKB` / `THD` / `THE` / `THR` / `THU` / `THV` / `TRF` / `DGA` | TwinDie | `2 dies, 2 CS` | x4/x8 TwinDie |
| `HBA` / `KNR` / `TBB` / `WBU` / `VRN` / `VRP` | TwinDie | `2 dies, 1 CS` | single-rank x16 TwinDie |
| `41:256M32:SGB` | TwinDie | `2 dies, 1 CS` | DDR3L x32 TwinDie |
| `40:2G16:SKL` | TwinDie | `2 dies, 1 CS` | DDR4 x16 TwinDie |
| `40:2G8:DVN` / `40:2G8:HPR` / `40:4G4:DVN` / `40:4G4:HPR` | 3DS 2H | `2 dies, 1 CS` | DDR4 2H 3DS |
| `40:4G8:CLU` / `40:4G8:KVA` / `40:8G4:CLU` / `40:8G4:KVA` | 3DS 4H | `4 dies, 1 CS` | DDR4 4H 3DS |

## DDR5 大容量 configuration

Micron DDR5 仍按 `depth x width` 推导容量。16Gb / 24Gb / 32Gb addendum 覆盖 `4G4` / `2G8` / `1G16`、`6G4` / `3G8` / `1536M16`、`8G4` / `4G8` / `2G16` 这几类结构。这里只扩展 density / width / package / speed，不因为 24Gb 或 32Gb 直接推断 stacked die：

| Config | 示例 | 输出 |
| --- | --- | --- |
| `4G4` | `MT60B4G4RZ-92B:H` | `16Gb`, `x4` |
| `2G8` | `MT60B2G8HB-56B:G` | `16Gb`, `x8` |
| `1G16` | `MT60B1G16HD-72BAAT:H` | `16Gb`, `x16` |
| `6G4` | `MT60B6G4RW-56B:B` | `24Gb`, `x4` |
| `3G8` | `MT60B3G8RW-64B:B` | `24Gb`, `x8` |
| `1536M16` | `MT60B1536M16RV-56B:B` | `24Gb`, `x16` |
| `8G4` | `MT60B8G4AT-72B:B` | `32Gb`, `x4` |
| `4G8` | `MT60B4G8AT-64B:B` | `32Gb`, `x8` |
| `2G16` | `MT60B2G16HD-64B:B` | `32Gb`, `x16` |

本轮未找到 Micron standalone DDR5 component 公开 datasheet 明确使用 TwinDie / DDP。MRDIMM、RDIMM 或 SOCAMM2 模块层面的多 die / 3DS 资料不进入 standalone component PN 的 `dram_die_count` 规则。

## 封装映射

封装映射优先按 package code 共用；同一个 package code 在不同产品线含义冲突时，使用 `family token + package code` scoped override。package code 只用于内部映射，公开结果只在确认后输出实际 `package`。首批只纳入公开资料可交叉确认的样例映射。

| Key / Package | 实际封装 |
| --- | --- |
| `AD` | `FBGA-96, 7.5x13.5` |
| `AG` | `FBGA-78, 7.5x11` |
| `GE` | `FBGA-96, 9x14` |
| `HA` | `FBGA-96, 9x14` |
| `HX` | `FBGA-78, 9x11.5` |
| `JC` | `FBGA-78, 9x11` |
| `JY` | `FBGA-96, 8x14` |
| `KD` | `FBGA-96, 9x13` |
| `LY` | `FBGA-96, 7.5x13.5` |
| `PM` | `FBGA-78, 9x13.2` |
| `RC` | `FBGA-96, 10x13` |
| `RH` | `FBGA-78, 9x10.5` |
| `TB` | `FBGA-96, 7.5x13` |
| `TD` | `FBGA-96, 7.5x13` |
| `VA` | `FBGA-78, 10x11` |
| `WE` | `FBGA-78, 8x12` |
| `40:BAF` | `FBGA-78, 10.5x11` |
| `40:FSE` | `FBGA-78, 9.5x13x1.2` |
| `40:CLU` | `FBGA-78, 7.5x11x1.2` |
| `40:DVN` | `FBGA-78, 7.5x12x1.2` |
| `40:HBA` | `FBGA-96, 9.5x14` |
| `40:HPR` | `FBGA-78, 8x12x1.2` |
| `40:JE` | `FBGA-78, 9x11x1.2` |
| `40:KH` | `FBGA-96, 9x13x1.2` |
| `40:KNR` | `FBGA-96, 7.5x13.5` |
| `40:KVA` | `FBGA-78, 8x12x1.2` |
| `40:NEA` | `FBGA-78, 7.5x11x1.2` |
| `40:NRE` | `FBGA-78, 8x12x1.2` |
| `40:SA` | `FBGA-78, 7.5x11` |
| `40:SKL` | `FBGA-96, 10.5x13x1.2` |
| `40:TBB` | `FBGA-96, 7.5x13` |
| `40:TRF` | `FBGA-78, 9.5x11.5x1.2` |
| `40:WBU` | `FBGA-96, 8x14` |
| `41:BY` | `FBGA-86, 9x15.5` |
| `41:DA` | `FBGA-78, 8x10.5` |
| `41:DGA` | `FBGA-96, 9.5x14` |
| `41:EF` | `FBGA-78, 8x10.5` |
| `41:HA` | `FBGA-96, 9x14` |
| `41:HX` | `FBGA-78, 9x11.5` |
| `41:JE` | `FBGA-82, 12.5x15` |
| `41:JP` | `FBGA-78, 8x11.5` |
| `41:JT` | `FBGA-96, 8x14` |
| `41:KJR` | `FBGA-78, 9.5x13` |
| `41:LA` | `FBGA-96, 9x15.5` |
| `41:RA` | `FBGA-78, 10.5x12` |
| `41:RE` | `FBGA-96, 10x14` |
| `41:RG` | `FBGA-78, 7.5x10.6` |
| `41:RH` | `FBGA-78, 9x10.5` |
| `41:RKB` | `FBGA-78, 8x10.5` |
| `41:SGB` | `FBGA-136, 11x14x1.2` |
| `41:SLD` | `FBGA-136, 10x14x1.2` |
| `41:SMA` | `FBGA-78, 9.5x11.5x1.45` |
| `41:SN` | `FBGA-78, 9x13.2` |
| `41:THA` | `FBGA-78, 10x11.5x1.45` |
| `41:THD` | `FBGA-78, 9x11.5` |
| `41:THE` | `FBGA-78, 10.5x12` |
| `41:THR` | `FBGA-78, 9x11.5` |
| `41:THU` | `FBGA-82, 12.5x15` |
| `41:THV` | `FBGA-78, 8x11.5` |
| `41:TNA` | `FBGA-96, 10x14x1.2` |
| `41:TRF` | `FBGA-78, 9.5x11.5x1.2` |
| `41:TW` | `FBGA-96, 8x14` |
| `42:LF` | `WFBGA-168, 12x12` |
| `46:B5` | `VFBGA-90, 8x13` |
| `46:P` | `TSOP-66` |
| `47:RT` | `FBGA-84, 9x12.5` |
| `48:B5` | `VFBGA-90, 8x13` |
| `48:P` | `TSOP-II-54` |
| `51:HF` | `FBGA-170, 12x14` |
| `52:PF` | `FBGA-178, 11.5x11` |
| `53:FW` | `TFBGA-200, 10x14.5` |
| `58:JA` | `FBGA-190, 10x14` |
| `60:AT` | `FBGA-78, 7.5x11.5` |
| `60:HB` | `FBGA-82, 9x11` |
| `60:HC` | `FBGA-102, 9x14` |
| `60:HD` | `FBGA-102, 7.5x14` |
| `60:HS` | `FBGA-82, 9x11` |
| `60:HT` | `FBGA-102, 9x14` |
| `60:HZ` | `FBGA-102, 9.5x14` |
| `60:JF` | `FBGA-82, 9.5x11` |
| `60:RV` | `FBGA-102, 8x14` |
| `60:RW` | `FBGA-78, 8x11` |
| `60:RZ` | `FBGA-78, 7.5x11` |
| `61:JE` | `FBGA-180, 12x14` |
| `61:KPA` | `FBGA-180, 12x14` |
| `62:CZ` | `TFBGA-561, 8x12.4x1.2` |
| `62:DS` | `WFBGA-200, 10x14.5` |
| `62:DV` | `LFBGA-315, 12.4x15x1.3` |
| `62:EK` | `TFBGA-441, 14x14x1.1` |
| `62:K2` | `UFBGA-496, 14x12.4x0.58` |
| `62:ZU` | `UFBGA-496, 14x12.4x0.65` |
| `68:DF` | `FBGA-266, 12x14x1.1` |

## 首批样例

| PN | 产品线 | 关键输出 |
| --- | --- | --- |
| `MT40A1G8SA-075-E` | DDR4 SDRAM | `8Gb`, `x8`, `FBGA-78, 7.5x11`, `DDR4-2666 CL19`, `Rev E` |
| `MT40A2G4TRF-093E:A` | DDR4 TwinDie SDRAM | `8Gb`, `x4`, `FBGA-78, 9.5x11.5x1.2`, `2 dies, 2 CS`, `DDR4-2133 CL15`, `Rev A` |
| `MT40A4G4FSE-093:A` | DDR4 TwinDie SDRAM | `16Gb`, `x4`, `FBGA-78, 9.5x13x1.2`, `2 dies, 2 CS`, `DDR4-2133 CL16`, `Rev A` |
| `MT40A2G8NRE-083E:B` | DDR4 TwinDie SDRAM | `16Gb`, `x8`, `FBGA-78, 8x12x1.2`, `2 dies, 2 CS`, `DDR4-2400 CL16`, `Rev B` |
| `MT40A4G8NEA-062E:F` | DDR4 TwinDie SDRAM | `32Gb`, `x8`, `FBGA-78, 7.5x11x1.2`, `2 dies, 2 CS`, `DDR4-3200 CL22`, `Rev F` |
| `MT40A4G4HPR-075H:G` | DDR4 3DS SDRAM | `16Gb`, `x4`, `FBGA-78, 8x12x1.2`, `3DS 2H`, `2 dies, 1 CS`, `DDR4-2666 CL19`, `Rev G` |
| `MT40A8G4KVA-075H:G` | DDR4 3DS SDRAM | `32Gb`, `x4`, `FBGA-78, 8x12x1.2`, `3DS 4H`, `4 dies, 1 CS`, `DDR4-2666 CL19`, `Rev G` |
| `MT40A1G16WBU-083E:B` | DDR4 SDRAM | `16Gb`, `x16`, `FBGA-96, 8x14`, `2 dies, 1 CS`, `DDR4-2400 CL16`, `Rev B` |
| `MT40A2G16TBB-062E:F` | DDR4 SDRAM | `32Gb`, `x16`, `FBGA-96, 7.5x13`, `2 dies, 1 CS`, `DDR4-3200 CL22`, `Rev F` |
| `MT40A512M8RH-093:B` | DDR4 SDRAM | `4Gb`, `x8`, `FBGA-78, 9x10.5`, `DDR4-2133 CL16`, `Rev B` |
| `MT40A512M8WE-107E:E` | DDR4 SDRAM | `4Gb`, `x8`, `FBGA-78, 8x12`, `DDR4-1866 CL13`, `Rev E` |
| `MT40A2G4PM-062E:A` | DDR4 SDRAM | `8Gb`, `x4`, `FBGA-78, 9x13.2`, `DDR4-3200 CL22`, `Rev A` |
| `MT40A512M16JY-075E:B` | DDR4 SDRAM | `8Gb`, `x16`, `FBGA-96, 8x14`, `DDR4-2666 CL18`, `Rev B` |
| `MT40A512M8AG-075EAUT:F` | Automotive DDR4 SDRAM | `4Gb`, `x8`, `FBGA-78, 7.5x11`, `DDR4-2666 CL18`, `Automotive certified`, `Ultra-high (-40°C ~ 125°C)`, `Rev F` |
| `MT40A512M16TD-062EAUT:R` | Automotive DDR4 SDRAM | `8Gb`, `x16`, `FBGA-96, 7.5x13`, `DDR4-3200 CL22`, `Automotive certified`, `Ultra-high (-40°C ~ 125°C)`, `Rev R` |
| `CT40A1G8SA-62M:E` | Crucial DDR4 SDRAM | `8Gb`, `x8`, `FBGA-78, 7.5x11`, `Crucial DDR4-62M`, `Rev E` |
| `EDY4016AABG-JD-F-D` | Micron Memory Japan DDR4 SDRAM | `4Gb`, `x16`, `FBGA-96, 7.5x13.5`, `DDR4-3200 24-24-24`, `Rev A`, `Dry pack (tray)` |
| `EDY4016AABG-GX-F-R` | Micron Memory Japan DDR4 SDRAM | `4Gb`, `x16`, `FBGA-96, 7.5x13.5`, `DDR4-2666 19-19-19`, `Rev A`, `Tape and Reel` |
| `MT60B2G8HB-48B-IT-A` | DDR5 SDRAM | `16Gb`, `x8`, `FBGA-82, 9x11`, `DDR5-4800B CL40`, `Industrial`, `Rev A` |
| `MT60B2G8HB-48BAT:A` | DDR5 SDRAM | `16Gb`, `x8`, `FBGA-82, 9x11`, `DDR5-4800B CL40`, `Automotive`, `Rev A` |
| `MT60B2G8HB-56B:G` | DDR5 SDRAM | `16Gb`, `x8`, `FBGA-82, 9x11`, `DDR5-5600B CL46`, `Rev G` |
| `MT60B2G8RZ-64BAAT:D` | Automotive DDR5 SDRAM | `16Gb`, `x8`, `FBGA-78, 7.5x11`, `DDR5-6400B CL52`, `Automotive certified`, `Automotive`, `Rev D` |
| `MT60B1G16HD-72BAAT:H` | DDR5 SDRAM | `16Gb`, `x16`, `FBGA-102, 7.5x14`, `DDR5-7200B CL58`, `Automotive certified`, `Automotive`, `Rev H` |
| `MT60B3G8RW-64B:B` | DDR5 SDRAM | `24Gb`, `x8`, `FBGA-78, 8x11`, `DDR5-6400B CL52`, `Rev B` |
| `MT60B1536M16RV-56B:B` | DDR5 SDRAM | `24Gb`, `x16`, `FBGA-102, 8x14`, `DDR5-5600B CL46`, `Rev B` |
| `MT60B6G4JF-64B:C` | DDR5 SDRAM | `24Gb`, `x4`, `FBGA-82, 9.5x11`, `DDR5-6400B CL52`, `Rev C` |
| `MT60B1536M16HZ-80B:C` | DDR5 SDRAM | `24Gb`, `x16`, `FBGA-102, 9.5x14`, `DDR5-8000B CL64`, `Rev C` |
| `MT60B4G8AT-64B:B` | DDR5 SDRAM | `32Gb`, `x8`, `FBGA-78, 7.5x11.5`, `DDR5-6400B CL52`, `Rev B` |
| `MT60B2G16HD-64B:B` | DDR5 SDRAM | `32Gb`, `x16`, `FBGA-102, 7.5x14`, `DDR5-6400B CL52`, `Rev B` |
| `MT41K512M8DA-107:P` | DDR3 SDRAM | `4Gb`, `x8`, `FBGA-78`, `933MHz (DDR-1866)`, `Rev P` |
| `MT41K512M16HA-125:A` / `D9STQ` | DDR3 SDRAM | `8Gb`, `x16`, `FBGA-96, 9x14`, `DDR3-1600 CL11`, `Rev A` |
| `CT41K1024M8RH-125:A` | DDR3 SDRAM | `8Gb`, `x8`, `FBGA-78, 9x10.5`, `DDR3-1600 CL11`, `Rev A` |
| `MT41K1G4RA-107:D` | DDR3L SDRAM | `4Gb`, `x4`, `FBGA-78, 10.5x12`, `DDR3-1866 CL13`, `Rev D` |
| `MT41K512M8RH-107IT:E` | DDR3L SDRAM | `4Gb`, `x8`, `FBGA-78, 9x10.5`, `DDR3-1866 CL13`, `Industrial`, `Rev E` |
| `MT41K256M16RE-125:A` | DDR3L SDRAM | `4Gb`, `x16`, `FBGA-96, 10x14`, `DDR3-1600 CL11`, `Rev A` |
| `MT41K512M16VRN-107 IT:P` / `D9XLQ` | DDR3L TwinDie SDRAM | `8Gb`, `x16`, `FBGA-96, 8x14`, `2 dies, 1 CS`, `DDR3-1866 CL13`, `Industrial`, `Pb-free SAC302`, `Rev P` |
| `MT41K512M8HX-125AAT:D` | DDR3 SDRAM | `4Gb`, `x8`, `FBGA-78, 9x11.5`, `DDR3-1600 CL11`, `Automotive certified`, `Automotive (-40°C ~ 105°C)`, `Rev D` |
| `MT41J512M4DA-093AAT:K` | Automotive DDR3 SDRAM | `2Gb`, `x4`, `FBGA-78, 8x10.5`, `DDR3-2133 CL14`, `Automotive certified`, `Automotive`, `Rev K` |
| `MT41J128M16JT-093AAT:K` | Automotive DDR3 SDRAM | `2Gb`, `x16`, `FBGA-96, 8x14`, `DDR3-2133 CL14`, `Automotive certified`, `Automotive`, `Rev K` |
| `MT41J256M8HX-107AAT:D` | Automotive DDR3 SDRAM | `2Gb`, `x8`, `FBGA-78, 9x11.5`, `DDR3-1866 CL13`, `Automotive certified`, `Automotive`, `Rev D` |
| `MT41J128M16HA-107AAT:D` | Automotive DDR3 SDRAM | `2Gb`, `x16`, `FBGA-96, 9x14`, `DDR3-1866 CL13`, `Automotive certified`, `Automotive`, `Rev D` |
| `MT41K2G4RKB-107:P` | DDR3 SDRAM | `8Gb`, `x4`, `FBGA-78, 8x10.5`, `2 dies, 2 CS`, `933MHz (DDR-1866)`, `Rev P` |
| `MT41K1G16DGA-125:A` | DDR3 SDRAM | `16Gb`, `x16`, `FBGA-96, 9.5x14`, `2 dies, 2 CS`, `800MHz (DDR-1600)`, `Rev A` |
| `MT41K512M16TNA-125 M:E` | DDR3 SDRAM | `8Gb`, `x16`, `FBGA-96, 10x14x1.2`, `2 dies, 2 CS`, `DDR3-1600 CL11`, `TCSR power saving`, `Rev E` |
| `MT41K4G4SMA-125:E` | DDR3 SDRAM | `16Gb`, `x4`, `FBGA-78, 9.5x11.5x1.45`, `4 dies, 4 CS`, `DDR3-1600 CL11`, `Rev E` |
| `MT41K2G4THA-187E:D` | DDR3 SDRAM | `8Gb`, `x4`, `FBGA-78, 10x11.5x1.45`, `4 dies, 4 CS`, `DDR3-1066 CL7`, `Rev D` |
| `MT41K256M32SLD-125 M:E` | DDR3 SDRAM | `8Gb`, `x32`, `FBGA-136, 10x14x1.2`, `2 dies, 1 CS`, `DDR3-1600 CL11`, `TCSR power saving`, `Rev E` |
| `MT47H128M16RT-25E:C` | DDR2 SDRAM | `2Gb`, `x16`, `FBGA-84, 9x12.5`, `DDR2-800`, `Rev C` |
| `MT46V32M16P-5B-IT-J` | DDR SDRAM | `512Mb`, `x16`, `TSOP-66`, `DDR-400`, `Industrial`, `Rev J` |
| `MT46H32M32LFB5-5 IT:B` | LPDDR | `1Gb`, `x32`, `VFBGA-90`, `dram_die_count=1`, `200MHz`, `Rev B` |
| `MT48LC16M8A2P-6A:L` | SDRAM | `128Mb`, `x8`, `TSOP-II-54`, `166MHz`, `Rev L` |
| `MT48H16M32LFB5-75:A` | LPSDR | `512Mb`, `x32`, `VFBGA-90`, `dram_die_count=1`, `133MHz`, `Rev A` |
| `MT48H16M32LGB5-75:A` | LPSDR | `512Mb`, `x32`, `VFBGA-90`, `dram_die_count=1`, `Reduced page-size addressing`, `133MHz`, `Rev A` |
| `MT42L128M32D1LF-25 WT:A` | LPDDR2 | `4Gb`, `x32`, `WFBGA-168`, `dram_die_count=1`, `Rev A` |
| `MT52L512M32D2PF-107 WT:B` | LPDDR3 | `16Gb`, `x32`, `FBGA-178`, `dram_die_count=2`, `Rev B` |
| `MT53E1G32D2FW-046-AIT-A` | LPDDR4 | `32Gb`, `x32`, `TFBGA-200, 10x14.5x1.1`, `dram_die_count=2`, `2133MHz (LPDDR4-4266)`, `Rev A` |
| `MT62F1G32D4DS-031-WT-B` | LPDDR5 | `32Gb`, `x32`, `TFBGA-315, 12.4x15x1.1`, `dram_die_count=4`, `3200MHz (LPDDR5-6400)`, `Rev B` |
| `MT62F512M64D4EK-031 AIT:B` | LPDDR5 | `32Gb`, `x64`, `TFBGA-441, 14x14x1.1`, `dram_die_count=4`, `3200MHz (LPDDR5-6400)`, `Automotive Industrial (-40°C ~ 95°C)`, `Rev B` |
| `MT62F512M64D4EK-031 FAAT:B` | LPDDR5 | `32Gb`, `x64`, `TFBGA-441, 14x14x1.1`, `dram_die_count=4`, `3200MHz (LPDDR5-6400)`, `Functional safety features`, `Rev B` |
| `MT62F1G64D8EK-031 AUT:B` | LPDDR5 | `64Gb`, `x64`, `TFBGA-441, 14x14x1.1`, `dram_die_count=8`, `3200MHz (LPDDR5-6400)`, `Automotive Ultra (-40°C ~ 125°C)`, `Rev B` |
| `MT51J256M32HF-80:A` | GDDR5 | `8Gb`, `x32`, `FBGA-170`, `GDDR5-8Gbps`, `Rev A` |
| `MT58K256M32JA-100:A` | GDDR5X | `8Gb`, `x32`, `FBGA-190`, `GDDR5X-10Gbps`, `Rev A` |
| `MT61K256M32JE-14:A` | GDDR6 | `8Gb`, `x32`, `FBGA-180`, `GDDR6-14Gbps`, `Rev A` |
| `MT61K512M32KPA-24-U` | GDDR6X | `16Gb`, `x32`, `FBGA-180`, `GDDR6X-24Gbps`, `Rev U` |
