# CXMT DRAM PN 规则

采集日期：2026-05-12；更新日期：2026-07-13

本页记录 CXMT standalone DRAM 颗粒与可识别 die/package 标记的 PN 结构。DDR4 与 LPDDR4X 主要来自 datasheet；DDR5 与先进制程字段允许使用“外部料号表 + 官方产品线 + 拆解/行业制程资料”的规则推断。推断依据写在文档中，public fields 只输出规范化后的节点和值，不写入来源或可信度状态。

## 外部资料

- CXMT 官方产品页确认公开产品线包含 DDR5/DDR5 module、LPDDR5/5X、DDR4/DDR4 module、LPDDR4X，但页面没有给出可直接落 iTXTech fdnext DecodePack 的 ordering table / PN breakdown。来源：<https://www.cxmt.com/en/product.html>
- CXMT 官方 2025-11-23 新闻确认 DDR5 产品线最高 8000Mbps、die density up to 24Gb，LPDDR5X 最高 10667Mbps、封装容量 12GB/16GB/24GB；但新闻仍没有公开 standalone PN breakdown，因此只作为 DDR5 / LPDDR5X 能力背景，不单独作为 token 准入依据。来源：<https://www.cxmt.com/en/news/info_20.html>
- CXMT 官方新闻确认 LPDDR5 产品线含 12Gb die、6GB/12GB mobile DRAM 与 POP packaged chip；LPDDR5X 产品线含 12Gb/16Gb die、12GB/16GB/24GB packaged chip 与 8533/9600/10667Mbps，但新闻没有公开具体 standalone PN breakdown。来源：<https://www.cxmt.com/en/news/info_15.html>、<https://www.cxmt.com/en/news/info_19.html>
- TechInsights `CDTQ` LPDDR5 拆解页确认 `CDTQ` package 来自 Huawei Nova 13 Pro，含 8 颗 12Gb LPDDR5 die，采用 CXMT G3 process；这里作为 package/die 标记别名进入规则，不等同于完整 ordering PN。来源：<https://www.techinsights.com/blog/cxmt-cdtq-g3-12-gb-lpddr5-dram-memory-floorplan-analysis>
- 多个行业资料把 CXMT DDR5 与 G4 / 16nm-class 关联；CXMT 官方产品页确认 DDR5 die capacity 16Gb/24Gb 与最高 8000Mbps，但未公开 `CXDR` ordering table。因此 `CXDR4E8BM-*` 只作为 PN 结构推断进入规则，`process_node` 输出 `CXMT G4 / 16nm-class`。来源：<https://www.tomshardware.com/pc-components/dram/chinas-cxmt-reportedly-delays-mass-production-of-ddr5-chips-to-late-2025-state-backed-manufacturer-could-still-be-disruptive-market-force>、<https://www.scmp.com/tech/tech-war/article/3296794/chinas-top-memory-chip-maker-cxmt-narrows-tech-gap-leaders-samsung-hynix-micron>、<https://www.cxmt.com/en/product.html>
- TrendForce / Meritz 等行业资料把 CXMT G3 与 18nm-class、DDR4/LPDDR4X 主力量产关联；LPDDR4X 与 DDR4 M-die/16Gb 规则据此输出 `CXMT G3 / 18nm-class`。来源：<https://files.futurememorystorage.com/proceedings/2025/20250805_BMKT-101-1_Avril-Wu.pdf>、<https://consensus.hankyung.com/analysis/downpdf?report_idx=647999>
- CXMT `CXDQ3BFAM-CQ-A` datasheet 镜像确认 8Gb x16 DDR4 SDRAM、512M x16、96-ball FBGA、1.2V，并在 part-number decoding 中列出 `CX D Q 3 B F A M C Q A` 字段：`3=8Gb`、`B=96-ball FBGA SDP`、`F=x16`、`A=1.2V`、`C=Commercial`、`Q=2666Mbps 19-19-19`、final `A=A-die`。来源：<https://datasheet.lcsc.com/lcsc/2410121538_CXMT-CXDQ3BFAM-CQ-A_C7463070.pdf>
- EDN 对 Walmart onn. FHD streaming stick 的拆解确认 `CXDQ2BFAM-CG` 为 4Gb x16 DDR4、1200MHz（DDR4-2400）；多份 ALINX 开发板手册另以 `256M x16` 交叉确认容量与位宽。因此新增 `2=4Gb` 和组合速率 `2:G=DDR4-2400`；既有 8Gb `G=DDR4-2666 18-18-18` 映射保持不变。来源：<https://www.edn.com/walmarts-onn-fhd-streaming-stick-still-android-tv-but-less-thick/>、<https://www.alinx.com/public/upload/file/ACU2CG_User_Manual.pdf>
- LCSC `CXDQ3BFAM-CJ-A` 页面确认 CXMT、8Gbit DDR4、FBGA-96、1.14V~1.26V、1.6GHz。来源：<https://www.lcsc.com/product-detail/C7543662.html>
- LCSC CXMT brand/product list 补充列出 `CXDQ3A8AM-CJ-A`、`CXDQ3A8AM-WQ-A`、`CXDQ3BFAM-IJ-A`、`CXDQ3BFAM-WQ-A`、`CXDB4CBAM-ML-A`、`CXDB5CCAM-ML`、`CXDB6CCBM-MA-A` 等 exact PN，本轮只作为当前规则可解析 PN 的补全资源，不单独提高来源档位。来源：<https://www.lcsc.com/brand/1288-15160.html>
- CXMT `CXDQ3A8AM-CQ-A` / `CXDQ3A8AM-IJ-A` datasheet 镜像确认 8Gb x8 DDR4 SDRAM、1G x8、78-ball FBGA、1.2V；part-number decoding 中 `A` package type 与 `8` bit organization 对应 78-ball x8 结构，`Q` 为 2666Mbps 19-19-19，`J` 为 3200Mbps 22-22-22，`C/I/W` 分别为 commercial / industrial / wide temperature。来源：<https://lcsc.com/datasheet/lcsc_datasheet_2409300536_CXMT-CXDQ3A8AM-CQ-A_C20598560.pdf>、<https://doc.chipmall.com/datasheet/rev_2412141843_cxmt-cxdq3a8am-ij-a_c67024723.pdf>
- CXMT `CXDQ3A8AM-WG` / `CXDQ3BFAM-WG` datasheet 镜像与用户提供截图确认 `W` 为 wide temperature，`G` 为 2666Mbps 18-18-18；无 final die-version suffix 时不输出 `die_revision`。来源：<https://datasheet.lcsc.com/datasheet/pdf/15ea4d2ab141ea7bfb785ee5612473a9.pdf?productCode=C20598563>
- CXMT `CXDB5CCAM-MK` LPDDR4X datasheet 镜像确认 `CXDB4ABAM-MK` 为 16Gb、`CXDB5CCAM-MK` 为 32Gb、2CH x32、3733Mbps、200 Ball Discrete，并在 part-number decoding 中列出 `4=16Gb`、`5=32Gb`、`B=x32,2CH,1CS`、`C=x32,2CH,2CS`、`A=200ball FBGA 10x15 DDP`、`C=200ball FBGA 10x15 QDP`。来源：<https://datasheet4u.com/pdf/1550200/CXDB5CCAM-MK.pdf>
- Synaptics SL1680 QVL 另将 `CXDB4ABAM-MK` 列为 16Gb x32 LPDDR4X-3733 合格器件，与上述 datasheet token 表一致；因此补入 PN 搜索资源，decoder 仍只使用既有 token 规则。来源：<https://cp.synaptics.com/cognidox/download/NR-154842-TC-APPROVED.pdf>
- Puris/Preduo 产品页一致列出 `CXDBBCCAM-MK` 为 24Gbit、200-ball LPDDR4X；`B` 因而进入 package-density token 表，后续 `CCAM-MK` 仍由既有 configuration、stack、temperature 与 speed token 解析。来源：<https://www.puris.net/archives/11269>、<https://www.preduo.com/product/lpddr/lpddr4x/200ball_4x-lpddr4x/cxdbbccam-mk>
- CXMT `CXDB5CBAM-MA-B` datasheet 镜像补充确认 4GB LPDDR4X、2CH x32、4266Mbps、200 Ball Discrete，并给出 `B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`、suffix `M=mobile/commercial temp`、`A=4266Mbps`、final `B=Gen3` 这类后续版本 token。来源：<https://www.dzjie.com/wp-content/uploads/2025/03/LPDDR4X_CXDB5CBAM-MA-B.pdf>
- CXMT `CXDB4CBAM-MK-A` datasheet 镜像确认 2GB LPDDR4X、2CH x32、3733Mbps、200 Ball Discrete；part-number decoding 中 `4=2GB`、`B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`。来源：<https://pdf.elecfans.com/p/11175344.html>
- CXMT `CXDB5CCBM-MK-A` / `CXDB5CCBM-MA-A` datasheet 镜像确认 4GB LPDDR4X、2CH x32、200 Ball Discrete；`MK` 为 3733Mbps，`MA` 为 4266Mbps，`CBM` 对应 x32 2CH 2CS / QDP / 200-ball 组合。来源：<https://atta.szlcsc.com/upload/public/pdf/source/20240112/0697417D4456C9B7A65E123D9285D203.pdf>、<https://atta.szlcsc.com/upload/public/pdf/source/20251128/2A0FA1E64CE1EFDC7BC81ECF2706B35F.pdf>
- Rockchip DDR SDRAM Support List 2.61 将 `CXDCCDCBM-MT-M` 列为 48Gbit、1536M x32、LPDDR5/LPDDR5X、315-ball，将 `CXDCDJEDM-MT-M` 列为 96Gbit、1536M x64、LPDDR5、496-ball；这里按外部料号表档位建立 `CXDC` 的 family/density/layout 局部 token，不把完整 PN 写入规则查表。来源：<https://lo01.g77k.com/aeb/docs/cn/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>
- CSEKER 料号页将 `CXDD7JEDM-MX-M` 列为 LPDDR5X、16GB、BGA315；与前述 `CXD*...JEDM` 结构同向，可补 `D` family 与 `7=128Gb` density token。来源：<https://cseker.com/en/product/cxdd7jedm-mx-m/5000005000.html>
- LCSC 的 `CXDB6CCBM-MA-A` 8GB LPDDR4X datasheet 与 TechInsights G4 16Gb die 分析同向确认 `6=64Gb package`、`CBM=4 dies/2CS`、200-ball；该组合输出 `CXMT G4`，不沿用旧容量的 G3 process。来源：<https://datasheet.lcsc.com/datasheet/pdf/11cd39d31199147ab8bf6030d2abf67c.pdf?productCode=C41416113>、<https://www.techinsights.com/blog/cxmt-cxdb6ccbm-maadie-g4-16-gb-lpddr4x-memory-floorplan-analysis>
- `CXDB6CCDM-MA-M` 原厂 datasheet 镜像的 ordering table 明确 `6=8GB`、`C=200-ball`、configuration `C=x32 2CH 2CS`、stack `D=8DP`、mobile temperature `M=-25°C~85°C` 与 speed `A=4266Mbps`；TechInsights 又确认同一 `CXDB6CCDM-MA` body 为 200-ball、10x15x0.78、内部八颗 8Gb LPDDR4X die。实物 body 进入搜索资源；尺寸只记入 evidence，不以 `density + config/stack/material` 组合写入 decoder。来源：<https://pdf.elecfans.com/p/10972587.html>、<https://www.techinsights.com/blog/cxmt-cxdb6ccdm-ma-g3-8gb-lpddr4x-memory-floorplan-analysis>
- Rockchip DDR Support List 2.61 将 `CXDB3ABAM-MK` 列为 8Gbit、256M x32、LPDDR4/LPDDR4X、200-ball，将 `CXDBCCCDM-MA-M` 列为 48Gbit、1536M x32、LPDDR4/LPDDR4X、200-ball；FCC 物料表另确认 `CXDBCCCDM-MK-M` 为 6GB LPDDR4X。由此补入 density `3=8Gb`、`C=48Gb`；`CDM` 的八 die 物理 stack 仍由上述原厂 ordering table 支撑。来源：<https://lo01.g77k.com/aeb/docs/en/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>、<https://fccid.io/HLZA24005/Test-Report/FR471715D-TR-NII-WLAN-5G-B1-3-r1-1-7680147.pdf>
- TechInsights 对 `CXDBCCCDM-MA` 的实物分析确认 200-ball、约 10x15x0.68、内部八颗 6Gb LPDDR4X die、CXMT G3。它与 `CXDB6CCDM-MA` 的 0.78 高度不同，而两者 ordering 的 package token 都是 `C`；因此尺寸只进入 evidence，public package 仍只按 family + package token 输出 `FBGA-200`，不新增 `C:CDM` 或其他近似完整 body 的组合映射。来源：<https://www.techinsights.com/ko/node/54538>
- 小米公开的 FCC 设计差异表把 `CXDBDCCCM-MA-M` 明确列为 12GB CXMT RAM；外部器件目录进一步给出 LPDDR4X、200-ball、4266Mbps、G4。结合 `DCCCM` 中已知 x32/2CH/2CS configuration 与 G4 16Gb die，局部组合 `CCM` 输出 6 dies/2CS，density `D` 输出 96Gb。来源：<https://device.report/m/2e59e2c04080d19aafdc0d2c004e301eabe9c6e86478c653e64408fef57298a0.pdf>、<https://www.gys.cn/jichengdianluic/5510051569.html>
- CXMT LPDDR4X 外部料号表一致列出 `CXDB4CBAM-EA-A`、`CXDB5CCBM-EA-A`、`CXDBCCCDM-EA-M`、`CXDB6CCDM-EA-M`，并注明 `EA` 为 4266Mbps automotive `-40°C~105°C`；唯样、JLCPCB 与公开库存页交叉确认这些 exact PN 和 200-ball package。新增 `E` temperature token 与 exact 搜索资源，不建立汽车模组规则。来源：<https://gigadevice.net/h-nd-1141.html>、<https://www.oneyac.net/product/34916350.html>、<https://jlcpcb.com/partdetail/JLCPCBAssembly-CXDB4CBAM_EAA/C9900160598>
- `CXDR4E4BM-CR-A` 外部器件页明确给出 16Gb、82-ball、x4、4800，实物颗粒分析则交叉确认 `CXDR4E4BM-CS-A` 为 16Gb x4、5600；因此只新增 organization `E4=x4` 与 `E4:BM=FBGA-82`，不纳入承载这些颗粒的 RDIMM/UDIMM decoder 或搜索资源。来源：<https://www.gys.cn/jichengdianluic/5510051679.html>、<https://unikoshardware.com/2025/11/cxmt-ddr5-dies.html>
- CSEKER 2025-11-20 汇总表列出更多 CXMT DDR4 / LPDDR4X / DDR5 料号，例如 `CXDQ4A8AM-CJ-M`、`CXDQ4BFAM-CJ-M`、`CXDR4E8BM-CS-A`、`CXDR4E8BM-CR-A`；这些进入规则时按结构 token 推断，可信度低于 datasheet-confirmed token。来源：<https://cseker.com/zh-cn/newDetail/42>
- CSEKER 汇总表、Rockchip DDR QVL、ChromeOS non-SPD memory table 与 FCC 物料表进一步确认 `CXDB4CBAM-MJ-A`、`CXDB4ABAM-MJ`、`CXDB4CCAM-MJ`、`CXDBBCCBM-MK-B`、`CXDB5CCBM-ML-A`、`CXDB4CBAM-EA-M`、`CXDB5CCBM-EA-M`。这些 exact PN 只补搜索资源，容量、layout、温度与 speed 继续由已有局部 token 表解码。来源：<https://cseker.com/zh-cn/newDetail/42>、<https://lo01.g77k.com/aeb/docs/en/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>、<https://chromium.googlesource.com/chromiumos/platform/mosys/+/refs/heads/firmware-ec-R141-16404.2.B/lib/spd/nonspd_modules.c>、<https://fcc.report/FCC-ID/2ah25t1721/6974008.pdf>
- 野火 LubanCat 官方原理图以单颗 `CXDB5CCAM-MJ` 配置 LPDDR4X，确认该 exact PN 的实际板载使用。本轮只补搜索资源，容量、layout、温度与 speed 继续由已有局部 token 表解码，不改 decoder mapping。来源：<https://doc.embedfire.com/lubancat-rk/hardware/ebf_lubancat_rk_hardware/zh/latest/_downloads/a58afcdee76740520e7156083e972833/LubanCat2N_EBF410076V1_SCH_20221213.pdf>
- 供应商公开颗粒表进一步列出 `CXDB5CBAM-DA-B`、`CXDB5CBAM-EA-B`、`CXDB6CCBM-DA-A`、`CXDR4FFBM-CS-A`、`CXDQ4A8AM-EG-M`、`CXDB4ABAM-MJ-A`。这些完整 standalone PN 只进入搜索资源；类型、容量、位宽等字段仍由既有局部 token 规则解析，`CXDR4FFBM-CS-A` 的首位 `4` 仍输出 16Gb，但未知 `FF` organization/package 组合不推测。页面同时列出的 RDIMM/SODIMM/UDIMM 继续排除。来源：<https://m.gys.cn/jichengdianluic/5510051764.html>
- CSEKER、Alibaba 器件页和公开出货记录共同确认 `CXDBBCCAM-MK-A` 为 3GB LPDDR4X、3733Mbps、FBGA-200；该 exact PN 只补搜索资源，现有 `B` density 与 `CAM` layout token 继续负责解码。来源：<https://cseker.com/en/productDetail/5000004910>、<https://www.alibaba.com/pla/CXDBBCCAM-MK-A-LPDDR4X-3GB-3733Mbps-200FBGA-DDR_1601276093004.html>
- 小米 Product Equality Declaration 将 `CXDBCCCBM-MA-A` 列为 ChangXin 6GB RAM；Puris/Preduo 又一致确认 `CXDB4ABAM-ML` 为 16Gbit、200-ball LPDDR4X，coreboot 的实际板载清单包含同一 PN。两者只新增 exact 搜索种子，decode fields 继续由既有局部 token 表生成。来源：<https://device.report/m/2e59e2c04080d19aafdc0d2c004e301eabe9c6e86478c653e64408fef57298a0.pdf>、<https://www.preduo.com/product/lpddr/lpddr4x/200ball_4x-lpddr4x/cxdb4abam-ml>、<https://www.puris.net/archives/8393>、<https://fossies.org/linux/coreboot/src/mainboard/google/dedede/variants/boxy/memory/mem_parts_used.txt>
- `CXDB7CCDM-MA-M` 仍不准入：CSEKER 表将其列为 16GB/4266，外部供应商产品文案却写成 8Gb/3733，库存页只能确认 PN 存在，无法消除容量与 speed 冲突。`CXDQ2BFAM-CE-B` 同样存在 4Gb/4GB 与 BGA96/BGA78 冲突；两者继续等待原厂 datasheet 或权威 QVL，不进入规则、资源或 testcase。
- 上海证券交易所披露的资产评估说明以库存抽盘案例明确列出 `CXDR4E8BM-UP-A`，并给出 CXMT A-die DDR5、`2Gx8x1`、4800、9x11mm。这里把实际存在的 `UP` 后缀作为 DDR5-4800 token 补入结构化规则，将 `E8:BM` 封装组合补全为 `FBGA-82, 9x11`，并将 exact PN 加入搜索资源；不从单一料号进一步猜测 `U` 的温度等级或 `P` 的独立含义。来源：<https://static.sse.com.cn/stock/disclosure/announcement/c/202605/605178_20260514_1Z6P.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/cxmt-dram-token.json`
- 规则 ID：`vendor.cxmt.dram.ddr4.component.v1`、`vendor.cxmt.dram.ddr5.component.v1`、`vendor.cxmt.dram.lpddr4x.component.v1`、`vendor.cxmt.dram.lpddr5.component.v1`、`vendor.cxmt.dram.lpddr5.cdtq-process-alias.v1`
- 当前覆盖：
  - DDR4：`CXDQ3BFAM-*`、`CXDQ3A8AM-*`、`CXDQ4A8AM-*`、`CXDQ4BFAM-*` 同类 token 结构
  - DDR5：`CXDR4E4BM-*`、`CXDR4E8BM-*`，按 `CXDR + density + organization + package + -speed/temp + optional revision` 推断
  - LPDDR4X：`CXDB3ABAM-*`、`CXDB4ABAM-*`、`CXDB4CBAM-*`、`CXDB5CBAM-*`、`CXDB5CCAM-*`、`CXDB5CCBM-*`、`CXDBCCCDM-*`、`CXDB6CCDM-*`、`CXDBDCCCM-*` 同类 token 结构
  - LPDDR5/LPDDR5X：`CXDC/CXDD + density + layout + suffix` 局部 token；`CDTQ` package/die 标记别名用于输出 G3 / 12Gb die 信息

## PN 结构

DDR4：

```text
CX + D + Q + density + package type + bit organization + voltage + material/version + -temp/speed + optional die revision
```

LPDDR4X：

```text
CX + D + B + density + package type + io/ch/cs + stack/voltage + material/version + -temp/speed + optional product version
```

DDR5：

```text
CX + D + R + density + organization + package + -temp/speed + optional revision
```

LPDDR5 package/die alias：

```text
CDTQ
```

LPDDR5/LPDDR5X component：

```text
CXD + family + density + layout + -suffix
```

## 输出约定

- DDR4 `2` 输出 4Gb，`3` 输出 8Gb，`4` 输出 16Gb；package type `A/B` 输出 78-ball / 96-ball FBGA；bit organization `8/F` 输出 x8 / x16；suffix 拆为 temp `C/I/W` 与 speed `Q/J/G`。`2:G` 组合输出 DDR4-2400；其余已确认的 `Q/J/G` 分别输出 2666 19-19-19、3200 22-22-22、2666 18-18-18。
- DDR4 final revision `A/M` 输出 `die_revision`；final `M` 或 16Gb DDR4 结构推断 `process_node = CXMT G3 / 18nm-class`。
- DDR5 `CXDR4E4BM-CR/CS-A` 输出 16Gb x4、82-ball FBGA，`CXDR4E8BM-CR/CS-A` 输出 16Gb x8、82-ball FBGA；`CR/CS` 分别输出 DDR5-4800/5600，`process_node = CXMT G4 / 16nm-class`。
- LPDDR4X `3/4/5/6/B/C/D` 分别输出 8/16/32/64/24/48/96Gb；package type `A/C` 当前均输出 200-ball FBGA，不根据 exact body 补推尺寸；config `A/B/C` 当前均输出 x32；`BAM` 输出 `2 dies, 1 CS`，`CAM` 与 `CBM` 输出 `4 dies, 2 CS`，`CCM` 输出 `6 dies, 2 CS`，`CDM` 输出 `8 dies, 2 CS`。`D:CCM` 组合输出 `CXMT G4`，其余既有组合继续按已确认映射输出。
- LPDDR4X 的 package type 与 `config + stack + material/version` 拓扑组合分别判定；package type 已知但拓扑组合未知时保留 `FBGA-200`，省略 `dram_die_count` / `cs_count`。
- LPDDR4X suffix 拆为 temp `M/E` 与 speed `J/K/L/A`，其中 `M=-25°C~85°C`、`E=Automotive -40°C~105°C`、`K=3733Mbps`、`L/A=4266Mbps`；final `A/B/M` 是 product version，不进入 public fields。
- `CXDC` 保守输出 LPDDR5，`CXDD` 输出 LPDDR5X；density `C/D/7` 分别输出 48Gb/96Gb/128Gb，已确认 layout 组合输出 x32/x64 与 315/496-ball。suffix 的 speed、temperature 与 die topology 尚未确认，因此不猜测。
- `CDTQ` 输出 LPDDR5、96Gb package、12Gb die、`dram_die_count=8`、`process_node = CXMT G3 / 18nm-class`；没有 CS 资料时不输出 `cs_count`。
- suffix 不存在时不输出 speed/temp。
- GDDR 当前只作为资料缺口记录，不进入 iTXTech fdnext DecodePack；LPDDR5X 尚未确认的 suffix 与 die topology 继续等待公开 PN token 表或更多一致样本。
