# Samsung DRAM PN 规则

采集日期：2026-05-13；更新日期：2026-07-11

本页记录 Samsung standalone DRAM 颗粒的 PN 结构。规则只按结构化 token 解码，不把完整 PN 作为白名单；`-` 后缀缺失时仍保留可由主结构确认的容量、位宽、die/CS 以及主结构内的封装信息，只省略必须依赖 suffix 的封装、速度、温度等字段。

## 外部资料

- Samsung 官方 DDR4 页面确认 `K4A8G085WB-BCRC` 为 8Gb、1G x8、78 FBGA、1.2V、2400Mbps、0C~85C。来源：<https://semiconductor.samsung.com/jp/dram/ddr/ddr4/k4a8g085wb-bcrc/>
- Samsung DDR4 datasheet 镜像确认 `K4A8G085WB-BCRC` ordering table：`1Gx8`、78 FBGA、DDR4-2400，并说明 `K4A8G085WB` 为 8Gb B-die DDR4 SDRAM。来源：<https://www.alldatasheet.com/html-pdf/1179089/SAMSUNG/K4A8G085WB-BCRC/1778/5/K4A8G085WB-BCRC.html>
- Samsung DDR4 Product Guide 确认 DDR4 suffix package type `M` 表示 FBGA DDP，`K4AAG085WB-MCPB/MCRC` 与 `K4AAG165WB-MCPB/MCRC` 是 16Gb B-die DDP；官方 `K4AAG085WB-MCPB` 页面确认 16Gb、2G x8、78 FBGA。Intel 社区设计讨论进一步确认 `K4AAG085WB-MCRC` 是 16Gb x8 dual-die、two ranks / separate chip selects；`K4AAG165WB` datasheet 摘要确认 1Gx16、96 FBGA、DDP。来源：<https://www.alldatasheetcn.com/html-pdf/1643768/SAMSUNG/K4AAG085WB/697/2/K4AAG085WB.html>、<https://semiconductor.samsung.com/dram/ddr/ddr4/k4aag085wb-mcpb/>、<https://community.intel.com/t5/Embedded-Intel-Core-Processors/Xeon-D-1500-CPU-state-of-the-RAS-n-A16-pin-during-Row-Address-RA/td-p/1613915>、<https://www.memory-distributor.com/pub/media/downloads/datasheets/K4AAG165WB.pdf>
- Samsung DDR4 SDRAM Memory Product Guide May 2018 列出 PC/SVR 与 Consumer DDR4 component 表，确认 `K4A8G045WB/085WB/165WB`、`K4A8G045WC/085WC/165WC`、`K4A4G085WD/165WD`、`K4A4G085WE/165WE`、`K4A4G085WF/165WF`、`K4AAG085WA/165WA`、`K4AAG085WB/165WB` 等 base PN 与 `PB/RC/TD/VF/WE` speed、`C/I` temp、78/96-ball FBGA 封装组合；这些 exact PN 进入 `dram-pn.json` 用于补全。来源：<https://image.semiconductor.samsung.com/resources/product-guide/DDR4_Product_guide_May.18.pdf>
- 用户提供的 Samsung Product Selection Guide 1H 2017 补充确认 DDR4 component 表中的 `K4A4G045WE-BCPB/BCRC`、`K4A4G085WE-BCPB`、`K4AAG085WB-MCPB`、`K4AAG165WB-MCPB`，以及 DDR3 component 表中的 `K4B4G0446E-BYMA`、`K4B4G1646E-BCK0/BCMA/BCNB/BYK0/BYMA`、`K4B8G1646Q-MCK0/MCMA`；这些 exact PN 进入 `dram-pn.json` 用于补全。该表把 `K4G8G1646D` 放在 DDR3 component 区域，但 Samsung ordering info 中 `K4G` 属于 GDDR5 family，按表格错误处理，不进入 DDR3 规则或 DDR3 PN 补全。来源：用户提供的 `12psg2017_1h_hr_singles.pdf`
- 用户提供的 Samsung DDR4 numbering diagram 补充确认 `K4A` 主结构：`4G/8G/AG/BG` density、`04/08/16` bit organization、bank token `5` = 16 banks、interface token `W` = POD 1.2V VDD/VDDQ、revision `M/A/B/C/D/E/F/G`，以及 suffix package type `B/M/2/3/4/5` = Flip Chip / DDP / 2H TSV / 2H 3DS / 4H TSV / 4H 3DS。
- 用户提供的 Samsung DDR4 ordering table 截图补充确认 `K4A8G165WB-BCPB/BCRC`、`K4A4G165WE-BCPB/BCRC/BCTD/BIPB/BIRC/BITD`、`K4A4G045WD-BCPB/BCRC`、`K4A4G085WD-BCPB/BCRC` 等 exact PN；其中此前缺失的 exact PN 已加入 `dram-pn.json`。
- Samsung DDR3 SDRAM Memory Product Guide Oct. 2016 component 表确认 `K4B1G0846I/1646I`、`K4B2G0846F/1646F`、`K4B4G0446D/0846D/1646D` 的 DDR3 suffix 组合：`C/Y/M` 温度/电压档与 `H9/K0/MA/NB` speed bin；这些 exact `K4B` PN 进入 `dram-pn.json` 用于补全。该 PDF 中出现的 `K4A...` 行属于 DDR4 family，不作为 DDR3 规则依据。来源：用户提供的 `DDR3_Product_guide_Oct.16[2]-0.pdf`
- 用户提供的 Samsung DDR3 / DDR3L ordering table 截图补充确认 `K4B2G1646F`、`K4B4G0446E/0846E`、`K4B4G1646Q` 等 DDR3 / DDR3L 组合：F/E/Q die、x4/x8/x16 组织、78 / 96 FBGA、`Y` = commercial temp / normal power、`M` = industrial temp / normal power，以及 DDR3L `F8/H9/K0/MA` speed bin；截图中的 exact PN 已加入 `dram-pn.json`。
- 用户提供的 `常见几种DDR3_DDR3L的命名规则.pdf` 中 Samsung DDR3 SDRAM ordering page 补充确认 `AG = 16Gb` density token、`K = Commercial low VDD + Reduced Standby` temp/power token，以及 `F7/F8/H9/K0/MA` speed token 的时序含义。
- Samsung 官方 DDR4 页面确认 `K4ABG085WA-MCWE` / `K4ABG165WB-MCWE` 为 32Gb DDR4，分别是 4G x8 / 78 FBGA 与 2G x16 / 96 FBGA，3200Mbps。来源：<https://semiconductor.samsung.com/dram/ddr/ddr4/k4abg085wa-mcwe/>、<https://semiconductor.samsung.com/us/dram/ddr/ddr4/k4abg165wb-mcwe/>
- Samsung 官方 DDR5 页面确认 `K4RAH086VB-BCQK` 为 16Gb、2G x8、82 FBGA、1.1V、4800Mbps、0C~85C。来源：<https://semiconductor.samsung.com/jp/dram/ddr/ddr5/k4rah086vb-bcqk/>
- Samsung 官方 DDR5 页面确认 high-capacity density code：`K4RHE086VB-BCWM` / `K4RHE165VB-BCWM` 为 24Gb DDR5，`K4RBH046VM-BCWM` 为 32Gb DDR5。来源：<https://semiconductor.samsung.cn/dram/ddr/ddr5/k4rhe086vb-bcwm/>、<https://semiconductor.samsung.cn/dram/ddr/ddr5/k4rhe165vb-bcwm/>、<https://semiconductor.samsung.com/jp/dram/ddr/ddr5/k4rbh046vm-bcwm/>
- 用户提供的 Samsung DDR5 ordering table 截图补充确认 `K4RAH165VB-BCQK/BCWM` 与 `K4RAH046VB-BCQK`：`AH` 为 16Gb，`04/08/16` 分别输出 x4/x8/x16；主结构 `5/6` 分别为 16 / 32 banks，`V` 为 VDD/VDDQ = 1.1V 且 VPP = 1.8V，末位 `B` 为 B-die。后缀 `B/C/QK|WM` 分别为与 DDR3/DDR4 一致的 single-die FBGA/stack token、commercial temp、speed bin。`K4RAH046VB/K4RAH086VB` 为 82 FBGA，`K4RAH165VB` 为 106 FBGA；`QK/WM` speed token 分别输出 `DDR5-4800 40-39-39` 与 `DDR5-5600 46-45-45`。已知 exact PN 已加入 `dram-pn.json`。
- Samsung 2009 Product Selection Guide 确认 legacy `K4S/K4H/K4T/K4B` 组件 PN 的 family、density、bit organization、bank、interface、revision 与 `-package/temp/speed` 结构，并列出 `K4S511632D-UC75`、`K4H510838F-HCCC`、`K4T56163QI-ZCE6`、`K4B1G0846D-HCF7` 等 SDR/DDR/DDR2/DDR3 样例。来源：<https://docs.rs-online.com/644a/0900766b80d16e0c.pdf>
- Samsung 官方 LPDDR4 页面确认 `K4F6E304HB-MGCJ` 为 16Gb、x32、200 FBGA、3733Mbps、1.8/1.1/1.1V、-25C~85C。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr4/k4f6e304hb-mgcj/>
- Samsung 官方 LPDDR4X 页面确认 `K4U6E3S4AA-MGCL` 为 16Gb、x32、200 FBGA、4266Mbps、1.8/1.1/0.6V；datasheet ordering info 确认其标准拆分为 `K4 U 6E 3S 4 A A - M G CL`，其中 `6E` 为 16G refresh、`3S` 为 x32 Mono LPDDR4X、`4` 为 8 banks、`A` 为 LVSTLE_06 电压接口、`A` 为 Gen2、`M/G/CL` 分别对应 200-FBGA / -25C~85C / 0.468ns。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr4x/k4u6e3s4aa-mgcl/>、<https://atta.szlcsc.com/upload/public/pdf/source/20240929/7BB50846226B2390715312BE2DCC442F.pdf>
- Samsung 官方 sitemap 与历史型号页补齐 automotive LPDDR4/4X ordering token：`4E/2E/HE/JE` 分别对应 4/12/24/48Gb，`16` 为 x16，`3S/3D/3Q` 为 x32 mono/DDP/QDP；suffix package token `K/T` 与既有 `M` 均由多个型号页确认是 200 FBGA，温度 token `F/H/U` 分别对应 -40~95/-40~105/-40~125C。该扩展修复了 `K4F4E164HF-*`、`K4FHE3S4HA-*`、`K4U2E3S4AA-*`、`K4UHE3S4AA-*`、`K4UJE3Q4AA-*` 等被旧规则漏掉或误判为 GDDR4 的情况。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr4/k4f4e164hf-kfcl/>、<https://semiconductor.samsung.com/jp/dram/lpddr/lpddr4/k4fhe3s4ha-khcl/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr4x/k4u2e3s4aa-tfcl/>、<https://semiconductor.samsung.com/jp/dram/lpddr/lpddr4x/k4uhe3s4aa-kfcl/>、<https://semiconductor.samsung.com/jp/dram/lpddr/lpddr4x/k4uje3q4aa-tfcl/>
- Samsung 官网型号页与可信产品表确认封装式 `K3U` LPDDR4X 的局部结构：density token `H5/H6/H7/HA/HB/HD` 对应 32/48/64/96/96/128Gb，x64、4266Mbps；suffix package token `A/T/E/J` 分别为 556/556/376/432 FBGA。规则只从这些实际 token 输出容量、位宽、速率和封装，不用中间 body 或完整 PN 查表。来源：<https://semiconductor.samsung.com/kr/dram/lpddr/lpddr4x/k3uh6h60am-tfcl/>、<https://www.bestonn.com/memory/samsung-processor-dram-lpddr>
- Samsung `K4UBE3D4AA-MGCL` 官方页面存档确认 LPDDR4X、32Gb、x32、200 FBGA、4266Mbps、1.8/1.1/0.6V、-25C~85C；datasheet ordering info 进一步确认 token：`BE` 为 32G refresh、`3D` 为 x32 DDP LPDDR4X、`4` 为 8 banks、`A` 为 LVSTLE_06 电压接口、`A` 为 Gen2、`M/G/CL` 分别对应 200-FBGA / -25C~85C / 0.468ns。来源：<https://static6.arrow.com/aropdfconversion/899b75e80d91e9809ccf1ae585751547de913ff4/k4ube3d4aa-mgcl.pdf>、<https://datasheet.lcsc.com/lcsc/2310241557_Samsung-K4UBE3D4AA-MGCL_C2920257.pdf>
- 用户提供的 Samsung LPDDR4 / LPDDR4X ordering diagrams 补充确认 `K4F6E304HB-MGCJ`、`K4F8E3S4HD-MGCL`、`K4F6E3S4HM-MGCJ`、`K4U6E3S4AB-MGCL`、`K4UBE3D4AB-MGCL`、`K4UCE3Q4AB-MGCL` 的 token：`F/U` 分别为 LPDDR4 / LPDDR4X，`6E/8E/BE/CE` 分别为 16G/8G/32G/64G refresh，`30/3S/3D/3Q` 分别表达 x32 2CS+2CKE / Mono / DDP / QDP，`4` 为 8 banks，`H/A` 分别为 LVSTL_11 1.8/1.1/1.1V 与 LVSTLE_06 1.8/1.1/0.6V，`M/A/B/D` 为 Gen1/Gen2/Gen3/Gen5，`M/G/CJ|CL` 为 200-FBGA / -25C~85C / 3733 或 4266Mbps。来源：用户提供的 ordering 截图。
- Samsung 官方 LPDDR5 页面确认 `K3LKBKB0BM-MGCP` 为 32Gb、x32、315 FBGA、6400Mbps、1.8/1.05/0.9/0.5V。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr5/k3lkbkb0bm-mgcp/>
- Samsung 官网 sitemap 与产品表补齐 `K3L` LPDDR5 density token：`K2/K4/K6/K7/K8/KB/KC/KD` 分别覆盖 48/96/128/64/48/32/64/144Gb；suffix package token `B/J/M` 分别确认 x64 496 FBGA、x64 441 FBGA、x32 315 FBGA。已确认 exact 型号进入搜索资源，decoder 只使用 family+density 与 suffix package token。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5/k3lk4k40cm-bgcp/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5/k3lkdkd0cm-bgcp/>、<https://www.glochip.com/h-nd-545.html>
- Samsung 官方 LPDDR5X 页面确认 `K3KL3L30CM-JGCT` / `K3KL3L30CM-BGCU` 为 64Gb high-capacity LPDDR5X，分别输出 x64 / 441 FBGA / 7500Mbps 与 x16 / 496 FBGA / 8533Mbps。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl3l30cm-jgct/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl3l30cm-bgcu/>
- Samsung 官方 LPDDR5X 页面新增确认 `K3KL7L70EM-MUCU` 为 24Gb x32、8533、FBGA-315、-40C~125C，`K3KL3L30DM-EFCU` 为 64Gb x64、8533、FBGA-561、-40C~95C；容量不能用于反推 die count。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl7l70em-mucu/>、<https://semiconductor.samsung.com/us/dram/lpddr/lpddr5x/k3kl3l30dm-efcu/>
- Samsung 官方 LPDDR5X 产品页继续确认 `K3KL7L70EM-MHCU/MFCU`、`K3KL7L70FM-MUCV`、`K3KL7L70DM-MGCT` 为 24Gb x32 / FBGA-315 的不同速度温度档，`K3KL3L30EM-EFCV` 为 64Gb x64 / FBGA-561；这些 exact PN 进入搜索资源，解码仍由现有 token 规则完成。
- Samsung 官方 LPDDR5/5X 页面补充确认 `KJ=24Gb`、`L1=32Gb`、`L5=128Gb` density token。`K3LKJKJ0CM-MFCP/MHCP` 为 24Gb x32 FBGA-315 LPDDR5；`K3KL1L10GM-JGCT/JHCT` 为 32Gb x64 FBGA-441 LPDDR5X；`K3KL5L50*` 为 128Gb x64，按 suffix package 输出 FBGA-441/496/561/563，并覆盖 7500/8533/9600/10667 速率。`3K:L5:B` 使用组合覆盖，不能破坏既有 `3K:L3:B=x16`。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl5l50dm-bgcu/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl1l10gm-jgct/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5/k3lkjkj0cm-mfcp/>
- Samsung 官方 LPDDR5X 页面确认 `L4=96Gb`、`L6=16Gb` density token。`K3KL4L40EM-JUCU` 为 96Gb x64、8533Mbps、FBGA-441、-40C~125C；`K3KL6L60GM-MFCT` 为 16Gb x32、7500Mbps、FBGA-315、-40C~95C。规则只扩展 `family+density` 与既有 suffix package/temp/speed token 表，exact PN 仅进入搜索资源和 testcase。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl4l40em-jucu/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl6l60gm-mfct/>
- Samsung 官方 LPDDR5X 页面继续确认 x32 density token：`L8=32Gb`、`L9=64Gb`、`LD=48Gb`、`LA=128Gb`。`K3KLDLD0EM-TGCT` 同时确认 suffix package token `T=FBGA-245`；`M` 仍为 FBGA-315。规则只扩展 density 与 suffix package token 表，exact PN 仅进入搜索资源和 testcase。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl8l80dm-mucu/>、<https://semiconductor.samsung.com/jp/dram/lpddr/lpddr5x/k3kl9l90qm-mhct/>、<https://semiconductor.samsung.com/jp/dram/lpddr/lpddr5x/k3kldld0em-tgct/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3klala0em-mhcv/>
- Samsung 官网 sitemap 还确认 LPDDR5X `L2=48Gb`，例如 `K3KL2L20DM-JGCT`；`J` package token 继续输出 x64 / 441 FBGA，exact PN 只进入资源与 testcase。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl2l20dm-jgct/>
- Intel LPDDR3 validation table 确认 `K3QF1F10DM-AGCE` 为 8Gb package、4Gb die、DDP、x64；`K3QF2F20DM-AGCE` 为 16Gb package、4Gb die、QDP、x64。来源：<https://www.intel.cn/content/dam/www/public/us/en/documents/platform-memory/lpddr3-low-power-1600-validation-results.pdf>
- Samsung `K4X51163PC` datasheet 镜像确认 32M x16 Mobile-DDR SDRAM、1.8V VDD/VDDQ、4 banks、1 /CS，以及 60-ball FBGA 11.5x10x1.0；无 suffix 的 base PN 也可输出该 family package。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/146538/SAMSUNG/K4X51163PC.html>
- Samsung 2009 Product Selection Guide 确认 `K4X` 为 Mobile DDR SDRAM，density / bit organization / bank / interface / revision token，以及 Mobile DDR suffix package、temp/power、speed token，例如 `F` 为 60-FBGA、`G` 为 extended low-power i-TCSR/PASR/DS、`C3` 为 133MHz CL3。来源：<https://docs.rs-online.com/644a/0900766b80d16e0c.pdf>
- Samsung 官方 GDDR5 页面确认 `K4G80325FB-HC25` 为 8Gb、256M x32、170 FBGA、8.0Gbps。来源：<https://semiconductor.samsung.com/us/dram/gddr/gddr5/k4g80325fb-hc25/>
- Samsung 官方 GDDR6 页面确认 `K4Z80325BC-HC14` 为 8Gb、256M x32、180 FBGA、14.0Gbps。来源：<https://semiconductor.samsung.com/us/dram/gddr/gddr6/k4z80325bc-hc14/>
- Samsung 官方 sitemap 与型号页补齐 16Gb GDDR6 `K4ZAF325BC/BM` family：`AF` 为 16Gb、`325` 为 x32 organization、GDDR6 family 使用 180 FBGA，实际 suffix speed token `14/16/18/20/24` 分别输出 14/16/18/20/24Gbps。6 枚官方 exact PN 进入搜索资源，decoder 仍只解析 suffix 中实际存在的 speed token。来源：<https://semiconductor.samsung.com/dram/gddr/gddr6/k4zaf325bc-sc20/>、<https://semiconductor.samsung.com/dram/gddr/gddr6/k4zaf325bc-sc24/>、<https://semiconductor.samsung.com/dram/gddr/gddr6/k4zaf325bm-hc18/>
- Samsung 官方 GDDR7 页面确认 `K4VAF325ZC-SC32` 为 16Gb、512M x32、266 FBGA、32.0Gbps。来源：<https://semiconductor.samsung.cn/dram/gddr/gddr7/k4vaf325zc-sc32/>
- Samsung 官方 GDDR7 页面确认同 family `K4VAF325ZC-SC28` 为 16Gb、x32、266-FBGA、28Gbps。来源：<https://semiconductor.samsung.com/us/dram/gddr/gddr7/k4vaf325zc-sc28/>
- Samsung `K4D263238E` datasheet 镜像确认 128Mbit GDDR、1M x32 x4 banks、144-ball FBGA、最高 800Mbps/pin。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/37029/SAMSUNG/K4D263238E.html>
- Samsung `K4N56163QF-GC37` datasheet 镜像确认 256Mbit gDDR2、4M x16 x4 banks、84-ball FBGA，`GC25/30/37` 对应 800/667/533Mbps/pin。来源：<https://www.alldatasheet.com/html-pdf/103459/SAMSUNG/K4N56163QF-GC37/918/3/K4N56163QF-GC37.html>
- Samsung `K4J52324QC` datasheet 镜像确认 512Mbit GDDR3、2M x32 x8 banks、136-ball FBGA，`BJ12/BC14/BC16/BC20` 等 speed/voltage bin。来源：<https://www.alldatasheet.com/html-pdf/112724/SAMSUNG/K4J52324QC/1206/4/K4J52324QC.html>
- Samsung `K4U52324QE` GDDR4 的公开 datasheet archive / 分销与板卡拆解资料确认 512Mbit、16M x32、136-ball FBGA，`BC08` 属于 GDDR4 speed bin。来源：<https://www.datasheetarchive.com/?q=512Mbit+>、<https://www.jotrin.com/product/parts/K4U52324QE_BC08_1>、<https://www.techpowerup.com/review/sapphire-hd-3870/4.html>
- Samsung Graphics Memory Selection Guide 表格确认 legacy graphics base PN：`K4U52324Q`、`K4J52324Q`、`K4J55323Q`、`K4N51163Q`、`K4N56163Q`、`K4D551638`、`K4D263238`、`K4D261638` 的 type、density、organization、package、VDD/VDDQ 与可用 speed bin 范围。无尾缀 base PN 只用于补全基础结构，public decode 不输出 `dram_speed`；只有 `-BC08`、`-GC37` 等尾缀存在时才输出速度。来源：用户提供的 Samsung Graphics Memory Selection Guide 页面截图。
- Samsung `K4W1G1646E` datasheet 镜像确认 1Gb gDDR3、64M x16、96 FBGA、1.5V、`HC19/HC15/HC12/HC11/HC1A` 对应 1066/1333/1600/1800/2000Mbps。规则公开输出为 DDR3，并用 `DRAM Generation` 简洁标注 Samsung graphics gDDR3/SDDR3。来源：<https://datasheet4u.com/datasheet/Samsung/K4W1G1646E-1165186>
- Samsung 2014 Product Selection Guide 确认 `W` 为 SDDR3 SDRAM / graphics memory，density token `1G/2G/4G`，并列出 `K4W2G1646Q-BC(12/11/1A)`、`K4W4G1646D-BC(12/11/1A)`、`K4W4G1646E-BC(1A/1B)`、`K4W4G1646D-BY12` 等 96-FCFBGA gDDR3 颗粒及速度/电压档位。来源：<https://www.alldatasheet.com/html-pdf/1425714/SAMSUNG/K4W4G1646D-BC/2478/7/K4W4G1646D-BC.html>、<https://www.alldatasheet.com/html-pdf/1425714/SAMSUNG/K4W4G1646D-BC/3188/9/K4W4G1646D-BC.html>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/samsung-dram-token.json`
- 规则 ID：`vendor.samsung.dram.ddr3.component.v1`、`vendor.samsung.dram.legacy_standard.component.v1`、`vendor.samsung.dram.standard.component.v1`、`vendor.samsung.dram.ddr5.component.v1`、`vendor.samsung.dram.lpddr1.component.v1`、`vendor.samsung.dram.lpddr4_ordering.component.v1`、`vendor.samsung.dram.lpddr.component.v1`、`vendor.samsung.dram.legacy_gddr.component.v1`、`vendor.samsung.dram.gddr.component.v1`
- 当前覆盖：
  - SDR / DDR：`K4S/K4H/K4T/K4B/K4A`，覆盖 SDR、DDR、DDR2、DDR3、DDR4。
  - DDR5：`K4R`，当前落地 `AH/HE/BH` density token。
  - LPDDR：`K4X/K3P/K3Q/K4F/K4U/K3L/K3K`，覆盖 LPDDR、LPDDR2、LPDDR3、LPDDR4、LPDDR4X、LPDDR5/5X 的已确认 token。
  - 封装式 LPDDR4X：`K3U`，覆盖官网/可信产品表确认的 density 与 suffix package token。
  - Graphics DRAM：`K4D/K4N/K4J/K4U/K4W/K4G/K4Z/K4V`，覆盖 GDDR、GDDR2、GDDR3、GDDR4、Samsung graphics gDDR3/SDDR3、GDDR5、GDDR6、GDDR7 的结构化 density/org/package/speed token。

## PN 结构

标准 DDR/SDR：

```text
legacy SDR/DDR/DDR2/DDR3: K4 + family + density + width + bank + interface + revision + -package/temp/speed
DDR4: K4 + family + density + optional unit + width + package + revision + -suffix-package/temp/speed
```

DDR5：

```text
K4R + density-code + width + bank + voltage + die-revision + -suffix-package/temp/speed
```

LPDDR：

```text
LPDDR1: K4X + density + bit organization + bank + interface + revision + -package/temp/speed
LPDDR4/4X ordering: K4 + F/U + density/refresh + organization + bank + interface/voltage + generation + -package/temp/speed
LPDDR2+: K + family + density/stack token + package token + -suffix-package/temp/speed
```

GDDR：

```text
legacy: K4 + family + density-code + width + org token + package token + -speed-prefix/temp/speed-grade
modern: K4 + family + density token + 325 organization token + package token + -suffix-prefix/temp/speed-grade
```

## 输出约定

- Samsung 官方 sitemap 现已公开 4 个 HBM3 与 2 个 HBM3E 颗粒级 PN 页面；HBM3
  页面确认 `KHBA84A03C-MC1H` 为 16GB、MPGA、x1024、6.4Gbps，产品矩阵还确认
  `84/C4` 分别是 8Hi 16GB / 12Hi 24GB。HBM3E 官方页确认当前 12-layer
  产品为 36GB、9.2Gbps，exact PN 页面和外部产品表交叉确认 `84/C4` 分别为
  8Hi 24GB / 12Hi 36GB。来源：
  <https://semiconductor.samsung.com/dram/hbm/hbm3/khba84a03c-mc1h/>、
  <https://semiconductor.samsung.com/dram/hbm/hbm3e/>。
- Samsung 历史 HBM 产品矩阵还公开 HBM2 Flarebolt/Aquabolt 与 HBM2E Flashbolt
  的颗粒 PN、容量、MPGA、x1024 和 speed bin。规则按 `KHA/KHAA/KHBA/KHBB`
  family、stack/density、product family、package 与 speed token 分段解析：未知的
  stack/product 组合仍保留 Samsung HBM 类型，但不拼接单独已知 token 猜容量。
  22 个已确认 exact PN 只进入 `dram-pn.json` 和 testcase，不作为 decoder lookup。
  产品矩阵镜像：<https://www.samsung.glochip.com/pd.jsp?fromMid=352&id=24&recommendFromPid=0>。

- 可确认的 stacked LPDDR token 拆成 `dram_die_count` 与 `cs_count` 输出，例如 `K3QF1...` 输出 `dram_die_count=2`、`cs_count=1`，不再把 DDP/QDP/ODP 作为公开表述。
- `K4X` LPDDR1 从 bit organization 输出可确认的 CS / layout 信息；物理 die 数输出 `dram_die_count`，CS 输出 `cs_count`，`2 CKE`、JEDEC/Flexframe stack layout 等信息放 `special_option`。
- `K4W` 输出 `DRAM Type = DDR3`，并用 `DRAM Generation = Samsung graphics gDDR3/SDDR3` 标注其不同于普通 `K4B` DDR3 命名线。
- Graphics Selection Guide 的 base PN 行可以确认封装/电压/组织，但 speed bin 不等同于 PN 尾缀；无 `-speed` 尾缀时不得输出 `dram_speed`。表中 `GDDR1` 行在 public `DRAM Type` 中统一输出为 `GDDR`。
- 标准 DDR/GDDR 颗粒在 datasheet 或官方页面确认单颗 die / 单 CS 语义时输出 `dram_die_count=1`、`cs_count=1`；DDR3/DDR4 suffix package type 表达 DDP/QDP 等堆叠封装但没有 CS 信息时只输出 `dram_die_count`，不补 `cs_count`。
- Legacy SDR / DDR / DDR2 / DDR3 只有 suffix package mapping 已命中时才保留单 die / 单 CS 默认值；未知或缺失 package token 不补拓扑。
- Samsung 标准 SDR / DDR / DDR2 / DDR3 / DDR4 主结构里的最后一位 revision token 输出为 `die_revision = "<token>-die"`，例如 `K4B...I` 输出 `I-die`、`K4A...WB` 输出 `B-die`。
- Samsung DDR4 `K4A...5W...` 主结构输出 `bank_count=16`、`interface_type=POD (1.2V VDD/VDDQ)` 与 `solder_type=Lead-Free and Halogen-Free`；这些来自主结构 token，不依赖完整 PN 白名单。
- Samsung DDR3 / DDR3L / DDR4 的 `dram_speed` 按 Product Guide speed token 输出完整 CL / tRCD / tRP 时序，例如 `DDR3-2133 14-14-14`、`DDR3L-1866 13-13-13`、`DDR4-3200 22-22-22`；`RB/TC/WD/YF/AE` 这类 DDR4 alternate timing code 也按 ordering information 保留对应时序。
- Samsung DDR5 完全遵守 Samsung DRAM 主结构拆分：`AH/HE/BH` 是容量，`04/08/16` 是位宽，`5/6` 分别是 16 / 32 banks，`V` 是 VDD/VDDQ = 1.1V 且 VPP = 1.8V，末位 `B/M` 等是 die revision；`-` 后缀中的第一位 `B` 与 DDR3/DDR4 suffix package token 定义一致，输出 single-die 语义。`QK/WM` speed token 按 ordering table 输出完整 CL / tRCD / tRP 时序。
- Samsung DDR3L 仍按标准化 `dram_type=DDR3` 输出，低电压由 `dram_voltage=1.35V VDD` 与 `DDR3L-*` speed label 表达；`Y/M` temp/power token 输出 normal power，`K` token 输出 1.35V 并把 Reduced Standby 放入 `special_option`；不新增公开 `temp_code` / `power_code`。
- Samsung DRAM `-` 后缀按 token 拆解：标准 DDR/DDR5 为 suffix package / temp / speed，LPDDR 为 suffix package / temp / speed，GDDR 为 speed-prefix / temp / speed-grade；规则不以 `BCIF`、`MCRC`、`MGCL`、`SC32` 这类完整尾缀作为整体枚举键。
- 标准 DDR/DDR5 的 suffix package token、LPDDR1 的 bit organization token、legacy GDDR 的 package token 未命中厂商表时，即使主结构还能确认公开封装，也不补 `dram_die_count=1` / `cs_count=1`；已知 token 未指定堆叠时继续使用单 die / 单 CS 默认值。
- 现代 GDDR 的 package token 只对已确认的 `G:FB`、`Z:BC/BM`、`V:ZC` 组合输出单 die / 单 CS；未知组合即使 family 仍能确认 FBGA ball count，也省略拓扑。
- `Config Code` 只保留结构主配置，例如 `8G08`、`AH08`、`3QF1`、`263238`、`52324`、`80325`，不把完整 PN 或完整 base code 当配置码。
- `K4G` family 继续按 GDDR5 规则处理；即使个别 Product Selection Guide 表格把 `K4G...` 行放在 DDR3 component 区域，也不能让 DDR3 规则以更高优先级覆盖 `K4G` 的 family 语义。
- `K4U` 同时存在 LPDDR4X 与 legacy GDDR4 编码线；当 PN 命中 `K4U + density refresh + organization + bank + LVSTLE_06 + generation` ordering 结构时，LPDDR4X 规则优先于 legacy graphics `K4U52324Q` 规则。

## DDR4 package stack

Samsung DDR4 component PN 的 suffix 第一位是 package type：`B` 表示 flip-chip FBGA，`M` 表示 FBGA DDP。规则只从 package type 输出 die 数；CS / rank 不再由 package type 自动推断。

| package type | PN family | output | source tier |
| --- | --- | --- | --- |
| `M` | `K4A...-M...` | `dram_die_count = 2`, `special_option = DDP` | Product Guide package token |
| `2` / `3` | standard DDR suffix | `dram_die_count = 2`, `special_option = 2H TSV / 2H 3DS` | package token |
| `4` / `5` | standard DDR suffix | `dram_die_count = 4`, `special_option = 4H TSV / 4H 3DS` | package token |

仍不按 `AG` 或 `K4AAG...` base PN 单独推断 DDP；必须 suffix package type 为 `M`。例如同为 `AG08` 的 `B...` suffix 仍按普通 FBGA 处理。若外部资料只说明 DDP/QDP 而未稳定暴露 CS，public result 保留 `dram_die_count`，省略 `cs_count`。

## 大容量 configuration

高容量 token 只用于 density / width / package / speed 解析；除非 datasheet 或官方资料明确 die/rank/CS，不因为容量高或 suffix 相似就新增 `dram_die_count` 推断。

| 产品线 | Token / Key | 示例 | 输出 |
| --- | --- | --- | --- |
| DDR4 | `BG08` | `K4ABG085WA-MCWE` | `32Gb`, `x8`, `78-ball FBGA`, `DDR4-3200`, `dram_die_count = 2` |
| DDR4 | `BG16` | `K4ABG165WB-MCWE` | `32Gb`, `x16`, `96-ball FBGA`, `DDR4-3200`, `dram_die_count = 2` |
| DDR5 | `AH04` / `AH08` / `AH16` | `K4RAH046VB-BCQK` / `K4RAH086VB-BCQK` / `K4RAH165VB-BCQK/BCWM` | `16Gb`, `x4/x8/x16`, `AH04/AH08 = 82-ball FBGA`, `AH16 = 106-ball FBGA`, `5/6 = 16/32 banks`, `DDR5-4800/5600` |
| DDR5 | `HE08` / `HE16` | `K4RHE086VB-BCWM` / `K4RHE165VB-BCWM` | `24Gb`, `x8/x16`, `DDR5-5600 46-45-45` |
| DDR5 | `BH04` | `K4RBH046VM-BCWM` | `32Gb`, `x4`, `78-ball FBGA`, `DDR5-5600 46-45-45` |
| LPDDR4X | `4U6E3S4AA` + suffix `MGCL` | `K4U6E3S4AA-MGCL` | `16Gb`, `x32`, `1 die`, `2 channels`, `LVSTLE_06`, `200-ball FBGA`, `LPDDR4X-4266` |
| LPDDR4 | `4F6E30` + suffix `MGCJ` | `K4F6E304HB-MGCJ` | `16Gb`, `x32`, `2 CS`, `2 channels`, `LVSTL_11`, `200-ball FBGA`, `LPDDR4-3733` |
| LPDDR4 | `4F8E3S` + suffix `MGCL` | `K4F8E3S4HD-MGCL` | `8Gb`, `x32`, `1 die`, `2 channels`, `LVSTL_11`, `200-ball FBGA`, `LPDDR4-4266` |
| LPDDR4X | `4U6E3S` + suffix `MGCL` | `K4U6E3S4AB-MGCL` | `16Gb`, `x32`, `1 die`, `2 channels`, `LVSTLE_06`, `200-ball FBGA`, `LPDDR4X-4266` |
| LPDDR4X | `4UBE3D` + suffix `MGCL` | `K4UBE3D4AB-MGCL` | `32Gb`, `x32`, `DDP`, `2 channels`, `LVSTLE_06`, `200-ball FBGA`, `LPDDR4X-4266` |
| LPDDR4X | `4UCE3Q` + suffix `MGCL` | `K4UCE3Q4AB-MGCL` | `64Gb`, `x32`, `QDP`, `2 channels`, `LVSTLE_06`, `200-ball FBGA`, `LPDDR4X-4266` |
| LPDDR5X | `3K:L3` + suffix | `K3KL3L30CM-JGCT` / `K3KL3L30CM-BGCU` | `64Gb`, suffix 决定 `x64/441 FBGA/7500` 或 `x16/496 FBGA/8533` |

## Graphics Memory Selection Guide

该表只进入 base PN 结构规则，不按 speed bin 范围推导 `dram_speed`：

| Type | Base PN | Density / organization | Package | Voltage | Decode output |
| --- | --- | --- | --- | --- | --- |
| GDDR4 | `K4U52324Q` | 512Mb / 16M x32 | 136 FBGA | 1.8V / 1.8V | `GDDR4`, `512Mb`, `x32`, no speed |
| GDDR3 | `K4J52324Q` | 512Mb / 16M x32 | 136 FBGA | 1.8V / 1.8V | `GDDR3`, `512Mb`, `x32`, no speed |
| GDDR3 | `K4J55323Q` | 256Mb / 8M x32 | 136 FBGA | 1.8V / 1.8V | `GDDR3`, `256Mb`, `x32`, no speed |
| GDDR2 | `K4N51163Q` | 512Mb / 32M x16 | 84 FBGA | 1.8V / 1.8V | `GDDR2`, `512Mb`, `x16`, no speed |
| GDDR2 | `K4N56163Q` | 256Mb / 16M x16 | 84 FBGA | 1.8V / 1.8V | `GDDR2`, `256Mb`, `x16`, no speed |
| GDDR1 | `K4D551638` | 256Mb / 16M x16 | 66 TSOPII | 2.5V / 2.5V | `GDDR`, `256Mb`, `x16`, no speed |
| GDDR1 | `K4D263238` | 128Mb / 4M x32 | 144 FBGA | 2.5V / 2.5V | `GDDR`, `128Mb`, `x32`, no speed |
| GDDR1 | `K4D261638` | 128Mb / 8M x16 | 66 TSOPII | 2.5V / 2.5V | `GDDR`, `128Mb`, `x16`, no speed |
