# CXMT DRAM PN 规则

采集日期：2026-05-12；更新日期：2026-07-12

本页记录 CXMT standalone DRAM 颗粒与可识别 die/package 标记的 PN 结构。DDR4 与 LPDDR4X 主要来自 datasheet；DDR5 与先进制程字段允许使用“外部料号表 + 官方产品线 + 拆解/行业制程资料”的规则推断。推断依据写在文档中，public fields 只输出规范化后的节点和值，不写入来源或可信度状态。

## 外部资料

- CXMT 官方产品页确认公开产品线包含 DDR5/DDR5 module、LPDDR5/5X、DDR4/DDR4 module、LPDDR4X，但页面没有给出可直接落 iTXTech fdnext DecodePack 的 ordering table / PN breakdown。来源：<https://www.cxmt.com/en/product.html>
- CXMT 官方 2025-11-23 新闻确认 DDR5 产品线最高 8000Mbps、die density up to 24Gb，LPDDR5X 最高 10667Mbps、封装容量 12GB/16GB/24GB；但新闻仍没有公开 standalone PN breakdown，因此只作为 DDR5 / LPDDR5X 能力背景，不单独作为 token 准入依据。来源：<https://www.cxmt.com/en/news/info_20.html>
- CXMT 官方新闻确认 LPDDR5 产品线含 12Gb die、6GB/12GB mobile DRAM 与 POP packaged chip；LPDDR5X 产品线含 12Gb/16Gb die、12GB/16GB/24GB packaged chip 与 8533/9600/10667Mbps，但新闻没有公开具体 standalone PN breakdown。来源：<https://www.cxmt.com/en/news/info_15.html>、<https://www.cxmt.com/en/news/info_19.html>
- TechInsights `CDTQ` LPDDR5 拆解页确认 `CDTQ` package 来自 Huawei Nova 13 Pro，含 8 颗 12Gb LPDDR5 die，采用 CXMT G3 process；这里作为 package/die 标记别名进入规则，不等同于完整 ordering PN。来源：<https://www.techinsights.com/blog/cxmt-cdtq-g3-12-gb-lpddr5-dram-memory-floorplan-analysis>
- 多个行业资料把 CXMT DDR5 与 G4 / 16nm-class 关联；CXMT 官方产品页确认 DDR5 die capacity 16Gb/24Gb 与最高 8000Mbps，但未公开 `CXDR` ordering table。因此 `CXDR4E8BM-*` 只作为 PN 结构推断进入规则，`process_node` 输出 `CXMT G4 / 16nm-class`。来源：<https://www.tomshardware.com/pc-components/dram/chinas-cxmt-reportedly-delays-mass-production-of-ddr5-chips-to-late-2025-state-backed-manufacturer-could-still-be-disruptive-market-force>、<https://www.scmp.com/tech/tech-war/article/3296794/chinas-top-memory-chip-maker-cxmt-narrows-tech-gap-leaders-samsung-hynix-micron>、<https://www.cxmt.com/en/product.html>
- TrendForce / Meritz 等行业资料把 CXMT G3 与 18nm-class、DDR4/LPDDR4X 主力量产关联；LPDDR4X 与 DDR4 M-die/16Gb 规则据此输出 `CXMT G3 / 18nm-class`。来源：<https://files.futurememorystorage.com/proceedings/2025/20250805_BMKT-101-1_Avril-Wu.pdf>、<https://consensus.hankyung.com/analysis/downpdf?report_idx=647999>
- CXMT `CXDQ3BFAM-CQ-A` datasheet 镜像确认 8Gb x16 DDR4 SDRAM、512M x16、96-ball FBGA、1.2V，并在 part-number decoding 中列出 `CX D Q 3 B F A M C Q A` 字段：`3=8Gb`、`B=96-ball FBGA SDP`、`F=x16`、`A=1.2V`、`C=Commercial`、`Q=2666Mbps 19-19-19`、final `A=A-die`。来源：<https://datasheet.lcsc.com/lcsc/2410121538_CXMT-CXDQ3BFAM-CQ-A_C7463070.pdf>
- LCSC `CXDQ3BFAM-CJ-A` 页面确认 CXMT、8Gbit DDR4、FBGA-96、1.14V~1.26V、1.6GHz。来源：<https://www.lcsc.com/product-detail/C7543662.html>
- LCSC CXMT brand/product list 补充列出 `CXDQ3A8AM-CJ-A`、`CXDQ3A8AM-WQ-A`、`CXDQ3BFAM-IJ-A`、`CXDQ3BFAM-WQ-A`、`CXDB4CBAM-ML-A`、`CXDB5CCAM-ML`、`CXDB6CCBM-MA-A` 等 exact PN，本轮只作为当前规则可解析 PN 的补全资源，不单独提高来源档位。来源：<https://www.lcsc.com/brand/1288-15160.html>
- CXMT `CXDQ3A8AM-CQ-A` / `CXDQ3A8AM-IJ-A` datasheet 镜像确认 8Gb x8 DDR4 SDRAM、1G x8、78-ball FBGA、1.2V；part-number decoding 中 `A` package type 与 `8` bit organization 对应 78-ball x8 结构，`Q` 为 2666Mbps 19-19-19，`J` 为 3200Mbps 22-22-22，`C/I/W` 分别为 commercial / industrial / wide temperature。来源：<https://lcsc.com/datasheet/lcsc_datasheet_2409300536_CXMT-CXDQ3A8AM-CQ-A_C20598560.pdf>、<https://doc.chipmall.com/datasheet/rev_2412141843_cxmt-cxdq3a8am-ij-a_c67024723.pdf>
- CXMT `CXDQ3A8AM-WG` / `CXDQ3BFAM-WG` datasheet 镜像与用户提供截图确认 `W` 为 wide temperature，`G` 为 2666Mbps 18-18-18；无 final die-version suffix 时不输出 `die_revision`。来源：<https://datasheet.lcsc.com/datasheet/pdf/15ea4d2ab141ea7bfb785ee5612473a9.pdf?productCode=C20598563>
- CXMT `CXDB5CCAM-MK` LPDDR4X datasheet 镜像确认 `CXDB4ABAM-MK` 为 16Gb、`CXDB5CCAM-MK` 为 32Gb、2CH x32、3733Mbps、200 Ball Discrete，并在 part-number decoding 中列出 `4=16Gb`、`5=32Gb`、`B=x32,2CH,1CS`、`C=x32,2CH,2CS`、`A=200ball FBGA 10x15 DDP`、`C=200ball FBGA 10x15 QDP`。来源：<https://datasheet4u.com/pdf/1550200/CXDB5CCAM-MK.pdf>
- Synaptics SL1680 QVL 另将 `CXDB4ABAM-MK` 列为 16Gb x32 LPDDR4X-3733 合格器件，与上述 datasheet token 表一致；因此补入 PN 搜索资源，decoder 仍只使用既有 token 规则。来源：<https://cp.synaptics.com/cognidox/download/NR-154842-TC-APPROVED.pdf>
- Puris/Preduo 产品页一致列出 `CXDBBCCAM-MK` 为 24Gbit、200-ball LPDDR4X；`B` 因而进入 package-density token 表，后续 `CCAM-MK` 仍由既有 configuration、stack、temperature 与 speed token 解析。来源：<https://www.puris.net/archives/11269>、<https://www.preduo.com/product/lpddr/lpddr4x/200ball_4x-lpddr4x/cxdbbccam-mk>
- CXMT `CXDB5CBAM-MA-B` datasheet 镜像补充确认 4GB LPDDR4X、2CH x32、4266Mbps、200 Ball Discrete，并给出 `B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`、suffix `M=mobile/commercial temp`、`A=4266Mbps`、final `B=3rd generation` 这类后续版本 token。来源：<https://www.dzjie.com/wp-content/uploads/2025/03/LPDDR4X_CXDB5CBAM-MA-B.pdf>
- CXMT `CXDB4CBAM-MK-A` datasheet 镜像确认 2GB LPDDR4X、2CH x32、3733Mbps、200 Ball Discrete；part-number decoding 中 `4=2GB`、`B=x32 2CH 1CS`、`A=DDP`、`C=200-ball`。来源：<https://pdf.elecfans.com/p/11175344.html>
- CXMT `CXDB5CCBM-MK-A` / `CXDB5CCBM-MA-A` datasheet 镜像确认 4GB LPDDR4X、2CH x32、200 Ball Discrete；`MK` 为 3733Mbps，`MA` 为 4266Mbps，`CBM` 对应 x32 2CH 2CS / QDP / 200-ball 组合。来源：<https://atta.szlcsc.com/upload/public/pdf/source/20240112/0697417D4456C9B7A65E123D9285D203.pdf>、<https://atta.szlcsc.com/upload/public/pdf/source/20251128/2A0FA1E64CE1EFDC7BC81ECF2706B35F.pdf>
- LCSC 的 `CXDB6CCBM-MA-A` 8GB LPDDR4X datasheet 与 TechInsights G4 16Gb die 分析同向确认 `6=64Gb package`、`CBM=4 dies/2CS`、200-ball；该组合输出 `CXMT G4`，不沿用旧容量的 G3 process。来源：<https://datasheet.lcsc.com/datasheet/pdf/11cd39d31199147ab8bf6030d2abf67c.pdf?productCode=C41416113>、<https://www.techinsights.com/blog/cxmt-cxdb6ccbm-maadie-g4-16-gb-lpddr4x-memory-floorplan-analysis>
- CSEKER 2025-11-20 汇总表列出更多 CXMT DDR4 / LPDDR4X / DDR5 料号，例如 `CXDQ4A8AM-CJ-M`、`CXDQ4BFAM-CJ-M`、`CXDR4E8BM-CS-A`、`CXDR4E8BM-CR-A`；这些进入规则时按结构 token 推断，可信度低于 datasheet-confirmed token。来源：<https://cseker.com/zh-cn/newDetail/42>
- 上海证券交易所披露的资产评估说明以库存抽盘案例明确列出 `CXDR4E8BM-UP-A`，并给出 CXMT A-die DDR5、`2Gx8x1`、4800、9x11mm。这里把实际存在的 `UP` 后缀作为 DDR5-4800 token 补入结构化规则，将 `E8:BM` 封装组合补全为 `FBGA-82, 9x11`，并将 exact PN 加入搜索资源；不从单一料号进一步猜测 `U` 的温度等级或 `P` 的独立含义。来源：<https://static.sse.com.cn/stock/disclosure/announcement/c/202605/605178_20260514_1Z6P.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/cxmt-dram-token.json`
- 规则 ID：`vendor.cxmt.dram.ddr4.component.v1`、`vendor.cxmt.dram.ddr5.component.v1`、`vendor.cxmt.dram.lpddr4x.component.v1`、`vendor.cxmt.dram.lpddr5.cdtq-process-alias.v1`
- 当前覆盖：
  - DDR4：`CXDQ3BFAM-*`、`CXDQ3A8AM-*`、`CXDQ4A8AM-*`、`CXDQ4BFAM-*` 同类 token 结构
  - DDR5：`CXDR4E8BM-*`，按 `CXDR + density + organization + package + -speed/temp + optional revision` 推断
  - LPDDR4X：`CXDB4ABAM-*`、`CXDB4CBAM-*`、`CXDB5CBAM-*`、`CXDB5CCAM-*`、`CXDB5CCBM-*` 同类 token 结构
  - LPDDR5：`CDTQ` package/die 标记别名，用于输出 G3 / 12Gb die 信息

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

## 输出约定

- DDR4 `3` 输出 8Gb，`4` 输出 16Gb；package type `A/B` 输出 78-ball / 96-ball FBGA；bit organization `8/F` 输出 x8 / x16；suffix 拆为 temp `C/I/W` 与 speed `Q/J/G`，分别输出 2666 19-19-19、3200 22-22-22、2666 18-18-18。
- DDR4 final revision `A/M` 输出 `die_revision`；final `M` 或 16Gb DDR4 结构推断 `process_node = CXMT G3 / 18nm-class`。
- DDR5 `CXDR4E8BM-CR/CS-A` 输出 16Gb x8、82-ball FBGA、DDR5-4800/5600、`process_node = CXMT G4 / 16nm-class`。
- LPDDR4X `4` 输出 16Gb，`5` 输出 32Gb；package type `A/C` 当前均输出 200-ball FBGA；config `A/B/C` 当前均输出 x32；`BAM` 输出 `2 dies, 1 CS`，`CAM` 与 `CBM` 输出 `4 dies, 2 CS`，并推断 `process_node = CXMT G3 / 18nm-class`。
- LPDDR4X suffix 拆为 temp `M` 与 speed `J/K/L/A`，其中 `K=3733Mbps`、`L/A=4266Mbps`；final `A/B` 是 product version，不进入 public fields。
- `CDTQ` 输出 LPDDR5、96Gb package、12Gb die、`dram_die_count=8`、`process_node = CXMT G3 / 18nm-class`；没有 CS 资料时不输出 `cs_count`。
- suffix 不存在时不输出 speed/temp。
- LPDDR5X、GDDR 当前只作为资料缺口记录，不进入 iTXTech fdnext DecodePack；即使官方新闻已确认 LPDDR5X 24GB package 级别能力，也必须等到公开 PN token 表、die/package 标记或 exact PN 样例后再落规则。
