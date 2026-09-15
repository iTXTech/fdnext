# CXMT DRAM PN 规则

采集日期：2026-05-12；更新日期：2026-07-13

本页记录 CXMT 独立 DRAM 颗粒与可识别 die/封装标记的 PN 结构。DDR4 与 LPDDR4X 主要来自数据手册；DDR5 与先进制程字段允许使用“外部料号表 + 官方产品线 + 拆解/行业制程资料”的规则推断。推断依据写在文档中，公开字段只输出规范化后的节点和值，不写入来源或可信度状态。

## 外部资料

- CXMT 官方产品页确认公开产品线包含 DDR5/DDR5 模组、LPDDR5/5X、DDR4/DDR4 模组、LPDDR4X，但页面没有给出可直接落 iTXTech fdnext DecodePack 的订购编码表 / PN 分项解析。来源：<https://www.cxmt.com/en/product.html>
- CXMT 官方 2025-11-23 新闻确认 DDR5 产品线最高 8000Mbps、单 die 容量最高 24Gb，LPDDR5X 最高 10667Mbps、封装容量 12GB/16GB/24GB；但新闻仍没有公开独立 PN 分项解析，因此只作为 DDR5 / LPDDR5X 能力背景，不单独作为编码段准入依据。来源：<https://www.cxmt.com/en/news/info_20.html>
- CXMT 官方新闻确认 LPDDR5 产品线含 12Gb die、6GB/12GB 移动版 DRAM 与 POP 已封装芯片；LPDDR5X 产品线含 12Gb/16Gb die、12GB/16GB/24GB 已封装芯片与 8533/9600/10667Mbps，但新闻没有公开具体独立 PN 分项解析。来源：<https://www.cxmt.com/en/news/info_15.html>、<https://www.cxmt.com/en/news/info_19.html>
- TechInsights `CDTQ` LPDDR5 拆解页确认 `CDTQ` 封装来自 Huawei Nova 13 Pro，含 8 颗 12Gb LPDDR5 die，采用 CXMT G3 制程；这里作为封装/die 标记别名进入规则，不等同于完整订购 PN。来源：<https://www.techinsights.com/blog/cxmt-cdtq-g3-12-gb-lpddr5-dram-memory-floorplan-analysis>
- 多个行业资料把 CXMT DDR5 与 G4 / 16nm-类别关联；CXMT 官方产品页确认 DDR5 die 容量 16Gb/24Gb 与最高 8000Mbps，但未公开 `CXDR` 订购编码表。因此 `CXDR4E8BM-*` 只作为 PN 结构推断进入规则，`process_node` 输出 `CXMT G4 / 16nm-class`。来源：<https://www.tomshardware.com/pc-components/dram/chinas-cxmt-reportedly-delays-mass-production-of-ddr5-chips-to-late-2025-state-backed-manufacturer-could-still-be-disruptive-market-force>、<https://www.scmp.com/tech/tech-war/article/3296794/chinas-top-memory-chip-maker-cxmt-narrows-tech-gap-leaders-samsung-hynix-micron>、<https://www.cxmt.com/en/product.html>
- TrendForce / Meritz 等行业资料把 CXMT G3 与 18nm-类别、DDR4/LPDDR4X 主力量产关联；LPDDR4X 与 DDR4 M-die/16Gb 规则据此输出 `CXMT G3 / 18nm-class`。来源：<https://files.futurememorystorage.com/proceedings/2025/20250805_BMKT-101-1_Avril-Wu.pdf>、<https://consensus.hankyung.com/analysis/downpdf?report_idx=647999>
- CXMT `CXDQ3BFAM-CQ-A` 数据手册镜像确认 8Gb x16 DDR4 SDRAM、512M x16、96 球 FBGA、1.2V，并在料号解码中列出 `CX D Q 3 B F A M C Q A` 字段：`3=8Gb`、`B=96-ball FBGA SDP`、`F=x16`、`A=1.2V`、`C=Commercial`、`Q=2666Mbps 19-19-19`、最终 `A=A-die`。来源：<https://datasheet.lcsc.com/lcsc/2410121538_CXMT-CXDQ3BFAM-CQ-A_C7463070.pdf>
- EDN 对 Walmart onn. FHD 流媒体电视棒的拆解确认 `CXDQ2BFAM-CG` 为 4Gb x16 DDR4、1200MHz（DDR4-2400）；多份 ALINX 开发板手册另以 `256M x16` 交叉确认容量与位宽。因此新增 `2=4Gb` 和组合速率 `2:G=DDR4-2400`；既有 8Gb `G=DDR4-2666 18-18-18` 映射保持不变。来源：<https://www.edn.com/walmarts-onn-fhd-streaming-stick-still-android-tv-but-less-thick/>、<https://www.alinx.com/public/upload/file/ACU2CG_User_Manual.pdf>
- LCSC `CXDQ3BFAM-CJ-A` 页面确认 CXMT、8Gbit DDR4、FBGA-96、1.14V~1.26V、1.6GHz。来源：<https://www.lcsc.com/product-detail/C7543662.html>
- LCSC CXMT 品牌/产品列表补充列出 `CXDQ3A8AM-CJ-A`、`CXDQ3A8AM-WQ-A`、`CXDQ3BFAM-IJ-A`、`CXDQ3BFAM-WQ-A`、`CXDB4CBAM-ML-A`、`CXDB5CCAM-ML`、`CXDB6CCBM-MA-A` 等完整 PN，本轮只作为当前规则可解析 PN 的补全资源，不单独提高来源档位。来源：<https://www.lcsc.com/brand/1288-15160.html>
- CXMT `CXDQ3A8AM-CQ-A` / `CXDQ3A8AM-IJ-A` 数据手册镜像确认 8Gb x8 DDR4 SDRAM、1G x8、78 球 FBGA、1.2V；料号解码中 `A` 封装类型与 `8` 位组织对应 78 球 x8 结构，`Q` 为 2666Mbps 19-19-19，`J` 为 3200Mbps 22-22-22，`C/I/W` 分别为商业级 / 工业级 / 宽温度。来源：<https://lcsc.com/datasheet/lcsc_datasheet_2409300536_CXMT-CXDQ3A8AM-CQ-A_C20598560.pdf>、<https://doc.chipmall.com/datasheet/rev_2412141843_cxmt-cxdq3a8am-ij-a_c67024723.pdf>
- CXMT `CXDQ3A8AM-WG` / `CXDQ3BFAM-WG` 数据手册镜像与用户提供截图确认 `W` 为宽温度，`G` 为 2666Mbps 18-18-18；无最终 die 版本后缀时不输出 `die_revision`。来源：<https://datasheet.lcsc.com/datasheet/pdf/15ea4d2ab141ea7bfb785ee5612473a9.pdf?productCode=C20598563>
- CXMT `CXDB5CCAM-MK` LPDDR4X 数据手册镜像确认 `CXDB4ABAM-MK` 为 16Gb、`CXDB5CCAM-MK` 为 32Gb、2CH x32、3733Mbps、200 球独立封装，并在料号解码中列出 `4=16Gb`、`5=32Gb`、`B=x32,2CH,1CS`、`C=x32,2CH,2CS`、`A=200ball FBGA 10x15 DDP`、`C=200ball FBGA 10x15 QDP`。来源：<https://datasheet4u.com/pdf/1550200/CXDB5CCAM-MK.pdf>
- Synaptics SL1680 QVL 另将 `CXDB4ABAM-MK` 列为 16Gb x32 LPDDR4X-3733 合格器件，与上述数据手册编码段表一致；因此补入 PN 搜索资源，解码器仍只使用既有编码段规则。来源：<https://cp.synaptics.com/cognidox/download/NR-154842-TC-APPROVED.pdf>
- Puris/Preduo 产品页一致列出 `CXDBBCCAM-MK` 为 24Gbit、200 球 LPDDR4X；`B` 因而进入封装-容量编码段表，后续 `CCAM-MK` 仍由既有配置、堆叠、温度与速度编码段解析。来源：<https://www.puris.net/archives/11269>、<https://www.preduo.com/product/lpddr/lpddr4x/200ball_4x-lpddr4x/cxdbbccam-mk>
- CXMT `CXDB5CBAM-MA-B` 数据手册镜像补充确认 4GB LPDDR4X、2CH x32、4266Mbps、200 球独立封装，并给出 `B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`、后缀 `M=mobile/commercial temp`、`A=4266Mbps`、最终 `B=Gen3` 这类后续版本编码段。来源：<https://www.dzjie.com/wp-content/uploads/2025/03/LPDDR4X_CXDB5CBAM-MA-B.pdf>
- CXMT `CXDB4CBAM-MK-A` 数据手册镜像确认 2GB LPDDR4X、2CH x32、3733Mbps、200 球独立封装；料号解码中 `4=2GB`、`B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`。来源：<https://pdf.elecfans.com/p/11175344.html>
- CXMT `CXDB5CCBM-MK-A` / `CXDB5CCBM-MA-A` 数据手册镜像确认 4GB LPDDR4X、2CH x32、200 球独立封装；`MK` 为 3733Mbps，`MA` 为 4266Mbps，`CBM` 对应 x32 2CH 2CS / QDP / 200 球组合。来源：<https://atta.szlcsc.com/upload/public/pdf/source/20240112/0697417D4456C9B7A65E123D9285D203.pdf>、<https://atta.szlcsc.com/upload/public/pdf/source/20251128/2A0FA1E64CE1EFDC7BC81ECF2706B35F.pdf>
- Rockchip DDR SDRAM Support List 2.61 将 `CXDCCDCBM-MT-M` 列为 48Gbit、1536M x32、LPDDR5/LPDDR5X、315 球，将 `CXDCDJEDM-MT-M` 列为 96Gbit、1536M x64、LPDDR5、496 球；这里按外部料号表档位建立 `CXDC` 的系列/容量/布局局部编码段，不把完整 PN 写入规则查表。来源：<https://lo01.g77k.com/aeb/docs/cn/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>
- CSEKER 料号页将 `CXDD7JEDM-MX-M` 列为 LPDDR5X、16GB、BGA315；与前述 `CXD*...JEDM` 结构同向，可补 `D` 系列与 `7=128Gb` 容量编码段。来源：<https://cseker.com/en/product/cxdd7jedm-mx-m/5000005000.html>
- LCSC 的 `CXDB6CCBM-MA-A` 8GB LPDDR4X 数据手册与 TechInsights G4 16Gb die 分析同向确认 `6=64Gb package`、`CBM=4 dies/2CS`、200 球；该组合输出 `CXMT G4`，不沿用旧容量的 G3 制程。来源：<https://datasheet.lcsc.com/datasheet/pdf/11cd39d31199147ab8bf6030d2abf67c.pdf?productCode=C41416113>、<https://www.techinsights.com/blog/cxmt-cxdb6ccbm-maadie-g4-16-gb-lpddr4x-memory-floorplan-analysis>
- `CXDB6CCDM-MA-M` 原厂数据手册镜像的订购编码表明确 `6=8GB`、`C=200-ball`、配置 `C=x32 2CH 2CS`、堆叠 `D=8DP`、移动版温度 `M=-25°C~85°C` 与速度 `A=4266Mbps`；TechInsights 又确认同一 `CXDB6CCDM-MA` 主体为 200 球、10x15x0.78、内部八颗 8Gb LPDDR4X die。实物主体进入搜索资源；尺寸只记入证据，不以 `density + config/stack/material` 组合写入解码器。来源：<https://pdf.elecfans.com/p/10972587.html>、<https://www.techinsights.com/blog/cxmt-cxdb6ccdm-ma-g3-8gb-lpddr4x-memory-floorplan-analysis>
- Rockchip DDR Support List 2.61 将 `CXDB3ABAM-MK` 列为 8Gbit、256M x32、LPDDR4/LPDDR4X、200 球，将 `CXDBCCCDM-MA-M` 列为 48Gbit、1536M x32、LPDDR4/LPDDR4X、200 球；FCC 物料表另确认 `CXDBCCCDM-MK-M` 为 6GB LPDDR4X。由此补入容量 `3=8Gb`、`C=48Gb`；`CDM` 的八 die 物理堆叠仍由上述原厂订购编码表支撑。来源：<https://lo01.g77k.com/aeb/docs/en/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>、<https://fccid.io/HLZA24005/Test-Report/FR471715D-TR-NII-WLAN-5G-B1-3-r1-1-7680147.pdf>
- TechInsights 对 `CXDBCCCDM-MA` 的实物分析确认 200 球、约 10x15x0.68、内部八颗 6Gb LPDDR4X die、CXMT G3。它与 `CXDB6CCDM-MA` 的 0.78 高度不同，而两者订购编码的封装编码段都是 `C`；因此尺寸只进入证据，公开封装仍只按系列 + 封装编码段输出 `FBGA-200`，不新增 `C:CDM` 或其他近似完整主体的组合映射。来源：<https://www.techinsights.com/ko/node/54538>
- 小米公开的 FCC 设计差异表把 `CXDBDCCCM-MA-M` 明确列为 12GB CXMT RAM；外部器件目录进一步给出 LPDDR4X、200 球、4266Mbps、G4。结合 `DCCCM` 中已知 x32/2CH/2CS 配置与 G4 16Gb die，局部组合 `CCM` 输出 6 die/2CS，容量 `D` 输出 96Gb。来源：<https://device.report/m/2e59e2c04080d19aafdc0d2c004e301eabe9c6e86478c653e64408fef57298a0.pdf>、<https://www.gys.cn/jichengdianluic/5510051569.html>
- CXMT LPDDR4X 外部料号表一致列出 `CXDB4CBAM-EA-A`、`CXDB5CCBM-EA-A`、`CXDBCCCDM-EA-M`、`CXDB6CCDM-EA-M`，并注明 `EA` 为 4266Mbps 车规 `-40°C~105°C`；唯样、JLCPCB 与公开库存页交叉确认这些完整 PN 和 200 球封装。新增 `E` 温度编码段与精确搜索资源，不建立汽车模组规则。来源：<https://gigadevice.net/h-nd-1141.html>、<https://www.oneyac.net/product/34916350.html>、<https://jlcpcb.com/partdetail/JLCPCBAssembly-CXDB4CBAM_EAA/C9900160598>
- `CXDR4E4BM-CR-A` 外部器件页明确给出 16Gb、82 球、x4、4800，实物颗粒分析则交叉确认 `CXDR4E4BM-CS-A` 为 16Gb x4、5600；因此只新增组织结构 `E4=x4` 与 `E4:BM=FBGA-82`，不纳入承载这些颗粒的 RDIMM/UDIMM 解码器或搜索资源。来源：<https://www.gys.cn/jichengdianluic/5510051679.html>、<https://unikoshardware.com/2025/11/cxmt-ddr5-dies.html>
- CSEKER 2025-11-20 汇总表列出更多 CXMT DDR4 / LPDDR4X / DDR5 料号，例如 `CXDQ4A8AM-CJ-M`、`CXDQ4BFAM-CJ-M`、`CXDR4E8BM-CS-A`、`CXDR4E8BM-CR-A`；这些进入规则时按结构编码段推断，可信度低于数据手册已确认的编码段。来源：<https://cseker.com/zh-cn/newDetail/42>
- CSEKER 汇总表、Rockchip DDR QVL、ChromeOS 无 SPD 存储器表与 FCC 物料表进一步确认 `CXDB4CBAM-MJ-A`、`CXDB4ABAM-MJ`、`CXDB4CCAM-MJ`、`CXDBBCCBM-MK-B`、`CXDB5CCBM-ML-A`、`CXDB4CBAM-EA-M`、`CXDB5CCBM-EA-M`。这些完整 PN 只补搜索资源，容量、布局、温度与速度继续由已有局部编码段表解码。来源：<https://cseker.com/zh-cn/newDetail/42>、<https://lo01.g77k.com/aeb/docs/en/Common/AVL/Rockchip_Support_List_DDR_Ver2.61.pdf>、<https://chromium.googlesource.com/chromiumos/platform/mosys/+/refs/heads/firmware-ec-R141-16404.2.B/lib/spd/nonspd_modules.c>、<https://fcc.report/FCC-ID/2ah25t1721/6974008.pdf>
- 野火 LubanCat 官方原理图以单颗 `CXDB5CCAM-MJ` 配置 LPDDR4X，确认该完整 PN 的实际板载使用。本轮只补搜索资源，容量、布局、温度与速度继续由已有局部编码段表解码，不改解码器映射。来源：<https://doc.embedfire.com/lubancat-rk/hardware/ebf_lubancat_rk_hardware/zh/latest/_downloads/a58afcdee76740520e7156083e972833/LubanCat2N_EBF410076V1_SCH_20221213.pdf>
- 供应商公开颗粒表进一步列出 `CXDB5CBAM-DA-B`、`CXDB5CBAM-EA-B`、`CXDB6CCBM-DA-A`、`CXDR4FFBM-CS-A`、`CXDQ4A8AM-EG-M`、`CXDB4ABAM-MJ-A`。这些完整独立 PN 只进入搜索资源；类型、容量、位宽等字段仍由既有局部编码段规则解析，`CXDR4FFBM-CS-A` 的首位 `4` 仍输出 16Gb，但未知 `FF` 组织结构/封装组合不推测。页面同时列出的 RDIMM/SODIMM/UDIMM 继续排除。来源：<https://m.gys.cn/jichengdianluic/5510051764.html>
- CSEKER、Alibaba 器件页和公开出货记录共同确认 `CXDBBCCAM-MK-A` 为 3GB LPDDR4X、3733Mbps、FBGA-200；该完整 PN 只补搜索资源，现有 `B` 容量与 `CAM` 布局编码段继续负责解码。来源：<https://cseker.com/en/productDetail/5000004910>、<https://www.alibaba.com/pla/CXDBBCCAM-MK-A-LPDDR4X-3GB-3733Mbps-200FBGA-DDR_1601276093004.html>
- 小米 Product Equality Declaration 将 `CXDBCCCBM-MA-A` 列为 ChangXin 6GB RAM；Puris/Preduo 又一致确认 `CXDB4ABAM-ML` 为 16Gbit、200 球 LPDDR4X，coreboot 的实际板载清单包含同一 PN。两者只新增精确搜索种子，解码字段继续由既有局部编码段表生成。来源：<https://device.report/m/2e59e2c04080d19aafdc0d2c004e301eabe9c6e86478c653e64408fef57298a0.pdf>、<https://www.preduo.com/product/lpddr/lpddr4x/200ball_4x-lpddr4x/cxdb4abam-ml>、<https://www.puris.net/archives/8393>、<https://fossies.org/linux/coreboot/src/mainboard/google/dedede/variants/boxy/memory/mem_parts_used.txt>
- `CXDB7CCDM-MA-M` 仍不准入：CSEKER 表将其列为 16GB/4266，外部供应商产品文案却写成 8Gb/3733，库存页只能确认 PN 存在，无法消除容量与速度冲突。`CXDQ2BFAM-CE-B` 同样存在 4Gb/4GB 与 BGA96/BGA78 冲突；两者继续等待原厂数据手册或权威 QVL，不进入规则、资源或测试用例。
- 上海证券交易所披露的资产评估说明以库存抽盘案例明确列出 `CXDR4E8BM-UP-A`，并给出 CXMT A-die DDR5、`2Gx8x1`、4800、9x11mm。这里把实际存在的 `UP` 后缀作为 DDR5-4800 编码段补入结构化规则，将 `E8:BM` 封装组合补全为 `FBGA-82, 9x11`，并将完整 PN 加入搜索资源；不从单一料号进一步猜测 `U` 的温度等级或 `P` 的独立含义。来源：<https://static.sse.com.cn/stock/disclosure/announcement/c/202605/605178_20260514_1Z6P.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/cxmt-dram-token.json`
- 规则 ID：`vendor.cxmt.dram.ddr4.component.v1`、`vendor.cxmt.dram.ddr5.component.v1`、`vendor.cxmt.dram.lpddr4x.component.v1`、`vendor.cxmt.dram.lpddr5.component.v1`、`vendor.cxmt.dram.lpddr5.cdtq-process-alias.v1`
- 当前覆盖：
  - DDR4：`CXDQ3BFAM-*`、`CXDQ3A8AM-*`、`CXDQ4A8AM-*`、`CXDQ4BFAM-*` 同类编码段结构
  - DDR5：`CXDR4E4BM-*`、`CXDR4E8BM-*`，按 `CXDR + density + organization + package + -speed/temp + optional revision` 推断
  - LPDDR4X：`CXDB3ABAM-*`、`CXDB4ABAM-*`、`CXDB4CBAM-*`、`CXDB5CBAM-*`、`CXDB5CCAM-*`、`CXDB5CCBM-*`、`CXDBCCCDM-*`、`CXDB6CCDM-*`、`CXDBDCCCM-*` 同类编码段结构
  - LPDDR5/LPDDR5X：`CXDC/CXDD + density + layout + suffix` 局部编码段；`CDTQ` 封装/die 标记别名用于输出 G3 / 12Gb die 信息

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

LPDDR5 封装/die 别名：

```text
CDTQ
```

LPDDR5/LPDDR5X 芯片：

```text
CXD + family + density + layout + -suffix
```

## 输出约定

- DDR4 `2` 输出 4Gb，`3` 输出 8Gb，`4` 输出 16Gb；封装类型 `A/B` 输出 78 球 / 96 球 FBGA；位组织 `8/F` 输出 x8 / x16；后缀拆为温度 `C/I/W` 与速度 `Q/J/G`。`2:G` 组合输出 DDR4-2400；其余已确认的 `Q/J/G` 分别输出 2666 19-19-19、3200 22-22-22、2666 18-18-18。
- DDR4 最终修订版 `A/M` 输出 `die_revision`；最终 `M` 或 16Gb DDR4 结构推断 `process_node = CXMT G3 / 18nm-class`。
- DDR5 `CXDR4E4BM-CR/CS-A` 输出 16Gb x4、82 球 FBGA，`CXDR4E8BM-CR/CS-A` 输出 16Gb x8、82 球 FBGA；`CR/CS` 分别输出 DDR5-4800/5600，`process_node = CXMT G4 / 16nm-class`。
- LPDDR4X `3/4/5/6/B/C/D` 分别输出 8/16/32/64/24/48/96Gb；封装类型 `A/C` 当前均输出 200 球 FBGA，不根据精确主体补推尺寸；配置 `A/B/C` 当前均输出 x32；`BAM` 输出 `2 dies, 1 CS`，`CAM` 与 `CBM` 输出 `4 dies, 2 CS`，`CCM` 输出 `6 dies, 2 CS`，`CDM` 输出 `8 dies, 2 CS`。`D:CCM` 组合输出 `CXMT G4`，其余既有组合继续按已确认映射输出。
- LPDDR4X 的封装类型与 `config + stack + material/version` 拓扑组合分别判定；封装类型已知但拓扑组合未知时保留 `FBGA-200`，省略 `dram_die_count` / `cs_count`。
- LPDDR4X 后缀拆为温度 `M/E` 与速度 `J/K/L/A`，其中 `M=-25°C~85°C`、`E=Automotive -40°C~105°C`、`K=3733Mbps`、`L/A=4266Mbps`；最终 `A/B/M` 是产品版本，不进入公开字段。
- `CXDC` 保守输出 LPDDR5，`CXDD` 输出 LPDDR5X；容量 `C/D/7` 分别输出 48Gb/96Gb/128Gb，已确认布局组合输出 x32/x64 与 315/496 球。后缀的速度、温度与 die 拓扑尚未确认，因此不猜测。
- `CDTQ` 输出 LPDDR5、96Gb 封装、12Gb die、`dram_die_count=8`、`process_node = CXMT G3 / 18nm-class`；没有 CS 资料时不输出 `cs_count`。
- 后缀不存在时不输出速度/温度。
- GDDR 当前只作为资料缺口记录，不进入 iTXTech fdnext DecodePack；LPDDR5X 尚未确认的后缀与 die 拓扑继续等待公开 PN 编码段表或更多一致样本。

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-05-18 根据 CXMT DDR4 / LPDDR4X 订购编码截图细化 `CXDQ` 与 `CXDB` 编码段：DDR4 速度输出 2666/3200 时序，LPDDR4X 后缀拆为温度 + 速度，`WG` 无最终 die 版本时不再输出 die 修订版，并把 `CXDQ3A8AM-WG` 加入 `dram-pn.json`。
- 2026-07-11 LPDDR5X 仅更新候选范围；其后实施状态由本文维护。
- 2026-07-12 根据 Rockchip DDR 兼容清单的两个 `CXDC` 样本与 CSEKER 的 `CXDD` 样本，新增 CXMT LPDDR5/LPDDR5X 系列、容量、布局/封装局部编码段；完整 PN 只进入搜索资源和测试用例。
