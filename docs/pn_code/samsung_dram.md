# Samsung DRAM PN 规则

采集日期：2026-05-08

本页记录 Samsung standalone DRAM 颗粒的 PN 结构。规则只按结构化 token 解码，不把完整 PN 作为白名单；`-` 后缀缺失时仍保留可由主结构确认的容量、位宽、die/CS 以及主结构内的封装信息，只省略必须依赖 suffix 的封装、速度、温度等字段。

## 外部资料

- Samsung 官方 DDR4 页面确认 `K4A8G085WB-BCRC` 为 8Gb、1G x8、78 FBGA、1.2V、2400Mbps、0C~85C。来源：<https://semiconductor.samsung.com/jp/dram/ddr/ddr4/k4a8g085wb-bcrc/>
- Samsung DDR4 datasheet 镜像确认 `K4A8G085WB-BCRC` ordering table：`1Gx8`、78 FBGA、DDR4-2400，并说明 `K4A8G085WB` 为 8Gb B-die DDR4 SDRAM。来源：<https://www.alldatasheet.com/html-pdf/1179089/SAMSUNG/K4A8G085WB-BCRC/1778/5/K4A8G085WB-BCRC.html>
- Samsung DDR4 Product Guide 确认 DDR4 suffix package type `M` 表示 FBGA DDP，`K4AAG085WB-MCPB/MCRC` 与 `K4AAG165WB-MCPB/MCRC` 是 16Gb B-die DDP；官方 `K4AAG085WB-MCPB` 页面确认 16Gb、2G x8、78 FBGA。Intel 社区设计讨论进一步确认 `K4AAG085WB-MCRC` 是 16Gb x8 dual-die、two ranks / separate chip selects；`K4AAG165WB` datasheet 摘要确认 1Gx16、96 FBGA、DDP。来源：<https://www.alldatasheetcn.com/html-pdf/1643768/SAMSUNG/K4AAG085WB/697/2/K4AAG085WB.html>、<https://semiconductor.samsung.com/dram/ddr/ddr4/k4aag085wb-mcpb/>、<https://community.intel.com/t5/Embedded-Intel-Core-Processors/Xeon-D-1500-CPU-state-of-the-RAS-n-A16-pin-during-Row-Address-RA/td-p/1613915>、<https://www.memory-distributor.com/pub/media/downloads/datasheets/K4AAG165WB.pdf>
- Samsung 官方 DDR4 页面确认 `K4ABG085WA-MCWE` / `K4ABG165WB-MCWE` 为 32Gb DDR4，分别是 4G x8 / 78 FBGA 与 2G x16 / 96 FBGA，3200Mbps。来源：<https://semiconductor.samsung.com/dram/ddr/ddr4/k4abg085wa-mcwe/>、<https://semiconductor.samsung.com/us/dram/ddr/ddr4/k4abg165wb-mcwe/>
- Samsung 官方 DDR5 页面确认 `K4RAH086VB-BCQK` 为 16Gb、2G x8、82 FBGA、1.1V、4800Mbps、0C~85C。来源：<https://semiconductor.samsung.com/jp/dram/ddr/ddr5/k4rah086vb-bcqk/>
- Samsung 官方 DDR5 页面确认 high-capacity density code：`K4RHE086VB-BCWM` / `K4RHE165VB-BCWM` 为 24Gb DDR5，`K4RBH046VM-BCWM` 为 32Gb DDR5。来源：<https://semiconductor.samsung.cn/dram/ddr/ddr5/k4rhe086vb-bcwm/>、<https://semiconductor.samsung.cn/dram/ddr/ddr5/k4rhe165vb-bcwm/>、<https://semiconductor.samsung.com/jp/dram/ddr/ddr5/k4rbh046vm-bcwm/>
- Samsung 2009 Product Selection Guide 确认 legacy `K4S/K4H/K4T/K4B` 组件 PN 的 family、density、bit organization、bank、interface、revision 与 `-package/temp/speed` 结构，并列出 `K4S511632D-UC75`、`K4H510838F-HCCC`、`K4T56163QI-ZCE6`、`K4B1G0846D-HCF7` 等 SDR/DDR/DDR2/DDR3 样例。来源：<https://docs.rs-online.com/644a/0900766b80d16e0c.pdf>
- Samsung 官方 LPDDR4 页面确认 `K4F6E304HB-MGCJ` 为 16Gb、x32、200 FBGA、3733Mbps、1.8/1.1/1.1V、-25C~85C。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr4/k4f6e304hb-mgcj/>
- Samsung 官方 LPDDR4X 页面确认 `K4U6E3S4AA-MGCL` 为 16Gb、x32、200 FBGA、4266Mbps、1.8/1.1/0.6V。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr4x/k4u6e3s4aa-mgcl/>
- Samsung 官方 LPDDR5 页面确认 `K3LKBKB0BM-MGCP` 为 32Gb、x32、315 FBGA、6400Mbps、1.8/1.05/0.9/0.5V。来源：<https://semiconductor.samsung.com/us/dram/lpddr/lpddr5/k3lkbkb0bm-mgcp/>
- Samsung 官方 LPDDR5X 页面确认 `K3KL3L30CM-JGCT` / `K3KL3L30CM-BGCU` 为 64Gb high-capacity LPDDR5X，分别输出 x64 / 441 FBGA / 7500Mbps 与 x16 / 496 FBGA / 8533Mbps。来源：<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl3l30cm-jgct/>、<https://semiconductor.samsung.com/dram/lpddr/lpddr5x/k3kl3l30cm-bgcu/>
- Intel LPDDR3 validation table 确认 `K3QF1F10DM-AGCE` 为 8Gb package、4Gb die、DDP、x64；`K3QF2F20DM-AGCE` 为 16Gb package、4Gb die、QDP、x64。来源：<https://www.intel.cn/content/dam/www/public/us/en/documents/platform-memory/lpddr3-low-power-1600-validation-results.pdf>
- Samsung `K4X51163PC` datasheet 镜像确认 32M x16 Mobile-DDR SDRAM、1.8V VDD/VDDQ、4 banks、1 /CS。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/146538/SAMSUNG/K4X51163PC.html>
- Samsung 2009 Product Selection Guide 确认 `K4X` 为 Mobile DDR SDRAM，density / bit organization / bank / interface / revision token，以及 Mobile DDR suffix package、temp/power、speed token，例如 `F` 为 60-FBGA、`G` 为 extended low-power i-TCSR/PASR/DS、`C3` 为 133MHz CL3。来源：<https://docs.rs-online.com/644a/0900766b80d16e0c.pdf>
- Samsung 官方 GDDR5 页面确认 `K4G80325FB-HC25` 为 8Gb、256M x32、170 FBGA、8.0Gbps。来源：<https://semiconductor.samsung.com/us/dram/gddr/gddr5/k4g80325fb-hc25/>
- Samsung 官方 GDDR6 页面确认 `K4Z80325BC-HC14` 为 8Gb、256M x32、180 FBGA、14.0Gbps。来源：<https://semiconductor.samsung.com/us/dram/gddr/gddr6/k4z80325bc-hc14/>
- Samsung 官方 GDDR7 页面确认 `K4VAF325ZC-SC32` 为 16Gb、512M x32、266 FBGA、32.0Gbps。来源：<https://semiconductor.samsung.cn/dram/gddr/gddr7/k4vaf325zc-sc32/>
- Samsung `K4D263238E` datasheet 镜像确认 128Mbit GDDR、1M x32 x4 banks、144-ball FBGA、最高 800Mbps/pin。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/37029/SAMSUNG/K4D263238E.html>
- Samsung `K4N56163QF-GC37` datasheet 镜像确认 256Mbit gDDR2、4M x16 x4 banks、84-ball FBGA，`GC25/30/37` 对应 800/667/533Mbps/pin。来源：<https://www.alldatasheet.com/html-pdf/103459/SAMSUNG/K4N56163QF-GC37/918/3/K4N56163QF-GC37.html>
- Samsung `K4J52324QC` datasheet 镜像确认 512Mbit GDDR3、2M x32 x8 banks、136-ball FBGA，`BJ12/BC14/BC16/BC20` 等 speed/voltage bin。来源：<https://www.alldatasheet.com/html-pdf/112724/SAMSUNG/K4J52324QC/1206/4/K4J52324QC.html>
- Samsung `K4U52324QE` GDDR4 的公开 datasheet archive / 分销与板卡拆解资料确认 512Mbit、16M x32、136-ball FBGA，`BC08` 属于 GDDR4 speed bin。来源：<https://www.datasheetarchive.com/?q=512Mbit+>、<https://www.jotrin.com/product/parts/K4U52324QE_BC08_1>、<https://www.techpowerup.com/review/sapphire-hd-3870/4.html>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/decodepack/src/rules/packs/samsung-dram-token.json`
- 规则 ID：`vendor.samsung.dram.legacy_standard.component.v1`、`vendor.samsung.dram.standard.component.v1`、`vendor.samsung.dram.ddr5.component.v1`、`vendor.samsung.dram.lpddr1.component.v1`、`vendor.samsung.dram.lpddr.component.v1`、`vendor.samsung.dram.legacy_gddr.component.v1`、`vendor.samsung.dram.gddr.component.v1`
- 当前覆盖：
  - SDR / DDR：`K4S/K4H/K4T/K4B/K4A`，覆盖 SDR、DDR、DDR2、DDR3、DDR4。
  - DDR5：`K4R`，当前落地 `AH/HE/BH` density token。
  - LPDDR：`K4X/K3P/K3Q/K4F/K4U/K3L/K3K`，覆盖 LPDDR、LPDDR2、LPDDR3、LPDDR4、LPDDR4X、LPDDR5/5X 的已确认 token。
  - GDDR：`K4D/K4N/K4J/K4U/K4G/K4Z/K4V`，覆盖 GDDR、GDDR2、GDDR3、GDDR4、GDDR5、GDDR6、GDDR7 的结构化 density/org/package/speed token。

## PN 结构

标准 DDR/SDR：

```text
legacy SDR/DDR/DDR2/DDR3: K4 + family + density + width + bank + interface + revision + -package/temp/speed
DDR4: K4 + family + density + optional unit + width + package + -speed/temp
```

DDR5：

```text
K4R + density-code + width + package + -speed/temp
```

LPDDR：

```text
LPDDR1: K4X + density + bit organization + bank + interface + revision + -package/temp/speed
LPDDR2+: K + family + density/stack token + package token + -speed/temp
```

GDDR：

```text
legacy: K4 + family + density-code + width + org token + package token + -speed
modern: K4 + family + density token + 325 organization token + package token + -speed
```

## 输出约定

- `dram_die_stack` 对可确认的 stacked LPDDR token 必须输出 DDP/QDP/ODP 与 CS，例如 `K3QF1...` 输出 `DDP (2-die), 1 CS`。
- `K4X` LPDDR1 从 bit organization 输出 CS/die stack；`-` suffix 缺失时不输出 package/temp/speed，只保留 base PN 可确认的容量、位宽、1 CS 等字段。
- 标准 DDR/GDDR 颗粒在 datasheet 或官方页面确认单颗 die / 单 rank 语义时输出 `Single die, 1 CS`；DDR4 suffix package type `M` 且 density/width 命中已确认组合时覆盖为 DDP。
- `Config Code` 只保留结构主配置，例如 `8G08`、`AH08`、`3QF1`、`263238`、`52324`、`80325`，不把完整 PN 或完整 base code 当配置码。

## DDR4 DDP

Samsung DDR4 component PN 的 suffix 第一位是 package type：`B` 表示 flip-chip FBGA，`M` 表示 FBGA DDP。当前只对外部资料确认的 16Gb B-die DDP 组合输出 `dram_die_stack`：

| Key | PN family | die stack / CS | source tier |
| --- | --- | --- | --- |
| `A:AG:08:M` | `K4AAG085WB-M...` | DDP / 2 CS | `external_confirmed` |
| `A:AG:16:M` | `K4AAG165WB-M...` | DDP / 1 CS | `external_table_confirmed` |

仍不按 `AG` 或 `K4AAG...` base PN 单独推断 DDP；必须 suffix package type 为 `M`。例如同为 `AG08` 的 `B...` suffix 仍按普通 FBGA 处理。

## 大容量 configuration

高容量 token 只用于 density / width / package / speed 解析；除非 datasheet 或官方资料明确 die/rank/CS，不因为容量高或 suffix 相似就新增 `dram_die_stack` 推断。

| 产品线 | Token / Key | 示例 | 输出 |
| --- | --- | --- | --- |
| DDR4 | `BG08` | `K4ABG085WA-MCWE` | `32Gb`, `x8`, `78-ball FBGA`, `DDR4-3200` |
| DDR4 | `BG16` | `K4ABG165WB-MCWE` | `32Gb`, `x16`, `96-ball FBGA`, `DDR4-3200` |
| DDR5 | `HE08` / `HE16` | `K4RHE086VB-BCWM` / `K4RHE165VB-BCWM` | `24Gb`, `x8/x16`, `DDR5-5600` |
| DDR5 | `BH04` | `K4RBH046VM-BCWM` | `32Gb`, `x4`, `78-ball FBGA`, `DDR5-5600` |
| LPDDR5X | `3K:L3` + suffix | `K3KL3L30CM-JGCT` / `K3KL3L30CM-BGCU` | `64Gb`, suffix 决定 `x64/441 FBGA/7500` 或 `x16/496 FBGA/8533` |
