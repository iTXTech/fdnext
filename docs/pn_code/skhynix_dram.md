# SK hynix DRAM PN 规则

采集日期：2026-05-17

本页记录 SK hynix standalone DRAM 颗粒的 PN 结构。规则只按结构化 token 解码，不把完整 PN 作为白名单；无法从外部资料确认的字段只保留厂商 token，不推断为确定规格。

## 外部资料

- `H5TQ4G63AFR-*xxC` / `H5TQ4G83AFR-*xxC` datasheet ordering table: 4Gb DDR3 SDRAM，`4G43` = 1G x4 / 78ball FBGA，`4G83` = 512M x8 / 78ball FBGA，`4G63` = 256M x16 / 96ball FBGA；speed bin `G7/H9/PB/RD/TE` 对应 DDR3-1066/1333/1600/1866/2133。来源：https://www.alldatasheet.com/html-pdf/533438/HYNIX/H5TQ4G63AFR-PBC/650/4/H5TQ4G63AFR-PBC.html
- `H5TC4G83CFR-*xxA` / `H5TC4G63CFR-*xxA` datasheet ordering table: 4Gb DDR3L SDRAM，`4G83` = 512M x8 / 78ball FBGA，`4G63` = 256M x16 / 96ball FBGA；suffix `A/I/L/J` 区分 commercial / industrial 与 low-power IDD6 选项；speed bin `H9/PB/RD` 对应 DDR3L-1333/1600/1866。来源：https://www.alldatasheet.com/html-pdf/1568384/HYNIX/H5TC4G83CFR-XXA/749/4/H5TC4G83CFR-XXA.html
- 用户提供的 `常见几种DDR3_DDR3L的命名规则.pdf` 中 SK hynix Consumer `'H'` Partnumber 页面补充确认 DDR3/DDR3L power-supply token `Q/C`、temperature token `K` = Automotive normal power、package material token `P/R`，以及同一 speed table 下 `G7/H9/PB/RD/TE` 的 DDR3 时序。
- `H5TC8G43AMR-*xxA` / `H5TC8G83AMR-*xxA` / `H5TC8G63AMR-*xxA` datasheet 明确 8Gb DDR3L SDRAM 为 Dual Die Package；ordering table 确认 `8G43` = 2G x4 / 78ball、`8G83` = 1G x8 / 78ball、`8G63` = 512M x16 / 96ball，x16 ballout 也列出 CS0/CS1、ODT0/ODT1、CKE0/CKE1。来源：https://www.alldatasheet.com/html-pdf/533427/HYNIX/H5TC8G63AMR-PBA/158/1/H5TC8G63AMR-PBA.html、https://www.alldatasheet.com/html-pdf/533427/HYNIX/H5TC8G63AMR-PBA/650/4/H5TC8G63AMR-PBA.html 和 https://www.alldatasheet.com/html-pdf/533427/HYNIX/H5TC8G63AMR-PBA/1142/7/H5TC8G63AMR-PBA.html
- `H5AN8G8NAFR-xxC` datasheet: 8Gb DDR4 SDRAM，VDD/VDDQ 1.2V，x4/x8 为 78ball FBGA、x16 为 96ball FBGA；`-UH` speed bin 对应 DDR4-2400T 17-17-17，datasheet 修订记录也确认 `VK` 为 2666Mbps CL19。来源：https://www.alldatasheet.com/datasheet-pdf/pdf/1424933/HYNIX/H5AN8G8NAFR-UHC.html 和 https://www.alldatasheet.com/html-pdf/1424927/HYNIX/H5AN8G4NAFR-TFC/7742/41/H5AN8G4NAFR-TFC.html
- `H5AN8G8NCJR-VKC` 公开分销资料确认 8Gbit DDR4、1.14V~1.26V、FBGA-78。来源：https://www.lcsc.com/product-detail/ddr-sdram_hynix-h5an8g8ncjr-vkc_C2927804.html
- `H5AN8G4NCJR/H5AN8G8NCJR/H5AN8G6NCJR` datasheet ordering table 确认 8Gb DDR4 x4/x8/x16、78/96ball FBGA，以及 `PB/RD/TF/UH/VK/WM/XN` speed bins；本轮展开对应 exact PN 用于搜索补全。来源：https://datasheet.lcsc.com/lcsc/2201121330_SK-HYNIX-H5AN8G8NCJR-VKC_C2927804.pdf
- `H5ANAG4NCJR/H5ANAG8NCJR/H5ANAG6NCJR` datasheet / 分销页确认 16Gb DDR4 系列，`H5ANAG8NCJR-XNC` 为 16Gb x8 DDR4-3200；本轮加入 `H5ANAG*NCJR-XNC` 与 `H5ANAG8NMJR-VKC` exact PN 用于补全。来源：https://datasheet4u.com/pdf/1566393/H5ANAG8NCJR.pdf、https://www.lcsc.com/product-detail/ddr-sdram_sk-hynix-h5anag8ncjr-xnc_C22412254.html
- `H5ANAG8NCMR-xxC` 和 `H5ANAG6NCMR-xxC` datasheet 明确 16Gb DDR4 SDRAM 为 Dual Die Package；x8 为 78ball FBGA 且 ballout 包含 CS1/ODT1/CKE1，x16 为 96ball FBGA。来源：https://4donline.ihs.com/images/VipMasterIC/IC/HYSC/HYSC-S-A0007570070/HYSC-S-A0007570070-1.pdf?hkey=52A5661711E402568146F3353EA87419 和 https://14469692.s21i.faiusr.com/61/ABUIABA9GAAgnfPMqgYo2N-tgAY.pdf
- `H5GQ2H24AFR-R0C` datasheet: 2Gb (64Mx32) GDDR5 SGRAM，170 ball BGA，VDD/VDDQ 支持 1.6V/1.5V/1.35V；`R0/T2/T0` ordering rows分别对应 6.0/5.0/4.0Gbps/pin。来源：https://datasheet4u.com/pdf/1550045/H5GQ2H24AFR.pdf
- `H5CG48AGBD-X018` DDR5: TechInsights 确认该 BGA package 内含单颗 16Gb DDR5 die；TechPowerUp 拆解也把 `H5CG48AGBD-X018` 标为 SK hynix A-Die DDR5 IC。来源：https://www.techinsights.com/ko/node/51799 和 https://www.techpowerup.com/review/patriot-viper-xtreme-5-rgb-ddr5-8000-cl38-2x-16-gb/3.html
- `H5CG48MEBD-X014` TechInsights 资料确认来自 SK hynix DDR5 package；公开 DDR5 列表还列出 `H5CG48AGBDX018N`、`H5CG48MEBDX014N`、`H5CG46AGBDX017N`、`H5CG46MEBDX015N` 的 16Gb x8/x16 4800/5600Mbps 组合。来源：https://www.techinsights.com/products/mfr-2112-803、https://www.skhynix.glochip.com/h-pd-3.html
- `H5CG48AGBDX018` 分销/Findchips 资料确认 `DDR5-5600 2Gx8 (16Gb)`。来源：https://www.absunshine.com/zh-CN/parts/H5CG48AGBDX018-SK-HYNIX-5928148 和 https://www.findchips.com/search/h5cg48agbdx018
- `H5CGD8MHBD-X021` DDR5: TechInsights 确认该 24Gb DDR5 die/package，分销页交叉确认 `DDR5-6400 3Gx8 (24Gb)`。来源：https://www.techinsights.com/blog/sk-hynix-h5cgd8mhbd-x021-d1a-euv-24gb-ddr5-dram-memory-floorplan-analysis 和 https://nxelectronics.com/home/productdetail/?item_id=331166981&partno=H5CGD8MHBDX021N
- 本轮用户提供的 SK hynix DDR5 Component Product ordering / decoder / serial-code 表补充确认 `H5C` 结构：density token `G3/G4/GD/G5/G6` = 8Gb/16Gb/24Gb/32Gb/64Gb，organization `4/8/6` = x4/x8/x16，generation `M/A/B/C/D/E/J`，speed `EB/EE/GB/GE/HB/KB/MB`，temperature `D/J/T`，reserved `X` + 3 位 serial code；serial `012/013/014/015/017/018/021/022/023/024/051/052` 可确认 die density、ball count、die count 与 TSV 标记。`xxx` serial placeholder 不进入 exact PN 资源，资源中保留不带 `Xxxx` 的前缀形态。
- `H9HCNNN8KUMLHR-NME` LPDDR4: datasheet / LCSC 资料确认 8Gb LPDDR4、x16、2 Channel、1 CS、DDP、200ball FBGA、3733Mbps、1.8V/1.1V 电源域。来源：https://datasheet.lcsc.com/lcsc/2410121844_SK-HYNIX-H9HCNNN8KUMLHR-NME_C2912103.pdf 和 https://lcsc.com/product-detail/ddr-sdram_sk-hynix-h9hcnnn8kumlhr-nme_C2912103.html
- `H9HCNNNCPUMLXR-NEE` / `H9HCNNNCPMMLXR-NEE` 资料确认 32Gb、QDP、2Ch 2CS，分别为 LPDDR4 / LPDDR4X 4266Mbps、200ball FBGA。来源：https://dl.xkwy2018.com/downloads/RK3588S/03_Product%20Line%20Branch_Tablet/02_Key%20Device%20Specifications/H9HCNNNCPUMLXR.pdf 和 https://www.uttc.com.tw/wp-content/uploads/2025/12/Consumer_H9HCNNNCPMMLXR1.0-LPDDR4X-32Gb_1ynm.pdf
- `HY57V561620FTP-H` datasheet / 公开分销资料确认 256Mb SDRAM、16M x16、54-pin TSOP-II。来源：https://datasheet4u.com/datasheet/Hynix-Semiconductor/HY57V561620FTP-H-952232 和 https://www.etei.com/product/hy57v561620ftp-h
- `HY5DU121622DTP-D43` / `HY5PS121621CFP-Y5` 资料确认 512Mb DDR / DDR2 SDRAM、x16、TSOP-II/FBGA 与 speed bin。来源：https://datasheet4u.com/pdf-down/H/Y/5/HY5DU121622DTP_HynixSemiconductor.pdf 和 https://www.alldatasheet.com/datasheet-pdf/pdf/333866/HYNIX/HY5PS121621CFP-Y5.html
- Lenovo T14s Gen 2 schematic LPDDR5 source table 记录 `H9JCNNNBK3MLYR-N6E` = DDP 8Gb 1 Rank，`H9JCNNNCP3MLYR-N6E` = QDP 8Gb 2 Rank，`H9JCNNNFA5MLYR-N6E` = ODP 8Gb 2 Rank。来源：https://www.scribd.com/document/1011608984/Lenovo-ThinkPad-T14s-Gen-2-NM-E091-R1-0-Schemtic-1
- `H58G56CK8BX146` / `H58G66CK8BX147` LPDDR5X 315ball specs 的功能框图分别确认 32Gb DDP 1CS、64Gb QDP 2CS；分销页确认 `H58G66CK8BX147` 为 64Gb、8533Mbps、315ball。来源：https://uttc.com.tw/wp-content/uploads/2026/02/H58G56CK8BX146_Rev1.0-3.pdf 和 https://uttc.com.tw/wp-content/uploads/2026/02/H58G66CK8BX147_Rev1.0-3.pdf
- `H9JCNNNCP3MLYR-N6E` LPDDR5 与 `H58G66CK8BX147` LPDDR5X 的公开分销资料确认 6400Mbps / 8533Mbps、315ball FBGA、电压域与容量。来源：https://www.fusionww.com/shop/product/4263986/H9JCNNNCP3MLYR-N6E 和 https://www.ipros.com/en/product/detail/2001536936/
- `H56C8H24MJR-S2C` GDDR6 资料确认 8Gb、x32、FBGA-180、1.35V 与 GDDR6 speed bin。来源：https://www.digchip.com/datasheets/parts/datasheet/2/202/H56C8H24MJR.php 和 https://www.absunshine.com/en/parts/H56C8H24MJR-S2C-SK-HYNIX-5126627

## H5TQ / H5TC / H5AN DDR3-DDR4 颗粒

结构：

```text
H5 + family + density + width + config + die/package/revision + -speed + temp
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `TQ` | `dram_type` / voltage | DDR3 SDRAM，1.5V VDD |
| `TC` | `dram_type` / voltage | DDR3L SDRAM 系列，输出标准类型仍为 `DDR3`，1.35V VDD |
| `AN` | `dram_type` / voltage | DDR4 SDRAM，1.2V VDD |
| `1G/2G/4G/8G/AG` | density | 1Gb/2Gb/4Gb/8Gb/16Gb |
| `4/8/6` | width | x4 / x8 / x16 |
| `F/J/...` | 内部 package token | 只用于内部解析；`fields.package` 只根据位宽输出 78ball 或 96ball FBGA |
| `AFR/CFR/CJR/...` | `die_revision` | SK hynix 常见 die/revision 三字符标记，直接保留为厂商 token |
| `P/R` | `solder_type` | 只从 die/package/revision 三字符标记末位输出 RoHS / Halogen-free 语义，不作为 package code 展示 |

已确认多 die / CS 组合：

| Key | PN family | die stack / CS | source tier |
| --- | --- | --- | --- |
| `TC:8G:4:3:AMR` | `H5TC8G43AMR` | 2 dies / 2 CS | `external_confirmed` |
| `TC:8G:8:3:AMR` | `H5TC8G83AMR` | 2 dies / 2 CS | `external_confirmed` |
| `TC:8G:6:3:AMR` | `H5TC8G63AMR` | 2 dies / 2 CS | `external_confirmed` |
| `AN:AG:8:N:CMR` | `H5ANAG8NCMR` | 2 dies / 2 CS | `external_confirmed` |
| `AN:AG:6:N:CMR` | `H5ANAG6NCMR` | 2 dies / 1 CS | `external_confirmed` |

## H5C DDR5 颗粒

当前落地 SK hynix DDR5 component decoder 表中的结构：

```text
H5C + density + width + generation + speed + temperature + [X + serial]
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `G3/G4/GD/G5/G6` | `dram_density` 基础容量 | 8Gb / 16Gb / 24Gb / 32Gb / 64Gb；有 serial die stack 时总容量按 die count 放大 |
| `4/8/6` | `dram_width` / `package` fallback | x4 / x8 / x16；x4/x8 为 82-ball FBGA，x16 为 106-ball FBGA |
| `M/A/B/C/D/E/J` | `dram_generation` / `die_revision` | 1st / 2nd / 3rd / 4th / 5th / 6th / 10th-or-special generation，同时保留 `M-die` / `A-die` 等简短 die revision |
| `EB/EE/GB/GE/HB/KB/MB` | `dram_speed` | DDR5-4800 / 5600 / 6400 / 7200 / 8000 及对应 timing；`EE` / `GE` 标注 3DS speed bin |
| `D/J/T` | `operation_temperature` | Commercial 0 to 95C；Industrial -40 to 95C |
| `X012` 等 | serial token | 只作内部解析；公开输出 `dram_die_density`、`die_count`、`package`，TSV 通过 `special_option` 输出 |

已确认 serial code:

| Serial | die density | package | die count | special |
| --- | --- | --- | --- | --- |
| `012` | 16Gb | 82-ball FBGA | 2 | TSV |
| `013` | 16Gb | 82-ball FBGA | 4 | TSV |
| `014` | 16Gb | 82-ball FBGA | 1 | - |
| `015` | 16Gb | 106-ball FBGA | 1 | - |
| `017` | 16Gb | 106-ball FBGA | 1 | - |
| `018` | 16Gb | 82-ball FBGA | 1 | - |
| `021` | 24Gb | 82-ball FBGA | 1 | - |
| `022` | 24Gb | 106-ball FBGA | 1 | - |
| `023` | 16Gb | 82-ball FBGA | 4 | TSV |
| `024` | 16Gb | 82-ball FBGA | 2 | TSV |
| `051` | 32Gb | 82-ball FBGA | 1 | - |
| `052` | 32Gb | 106-ball FBGA | 1 | - |

对 `H5CG44AEBDXxxx` 这类 ordering 表中的 placeholder，`dram-pn.json` 只加入 `H5CG44AEBD` 这种去掉 `Xxxx` 的补全种子；对 `H5CG44AGBDX018N`、`H5CG54MGBDX051` 这类已知 serial PN，资源保留完整 `X` + 3 位 serial。

## H5GQ GDDR5 颗粒

结构：

```text
H5GQ + density + 24 + die/package/revision + -speed + temp
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `1H/2H/4H/8H` | density | 1Gb/2Gb/4Gb/8Gb；`2H` 有 datasheet 直接确认 |
| `24` | width | x32 I/O 配置 |
| `R0/T2/T0` | `dram_speed` | 对 `H5GQ2H24AFR` datasheet 分别确认 6.0/5.0/4.0Gbps/pin |

## H9HC LPDDR4 颗粒

当前规则覆盖 `H9HCNNN[4K/8K/CP][UM/MM]L[H/X]R-*` 形式：

```text
H9HCNNN + density/stack token + package/mode token + -suffix
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `4K/8K/CP` | density | 4Gb / 8Gb / 32Gb |
| `8K` | `dram_die_stack`, `channel_count` | 2 dies, 1 CS；2 Channel |
| `CP` | `dram_die_stack`, `channel_count` | 4 dies, 2 CS；2 Channel |
| `UMLHR/UMLXR` | 内部 package token | LPDDR4 200ball FBGA；`UMLXR` 对应 4266Mbps |
| `MMLHR/MMLXR` | 内部 package token | LPDDR4X 200ball FBGA；`MMLXR` 对应 4266Mbps |
| `NEE/NEI/NME/NMI/NMIR/NMOR` | temperature | 只对公开资料可确认的温度范围输出 |
| `H9HCNNN8KUMLHR` | `dram_die_stack` | datasheet 确认 DDP、2 Channel、1 CS，输出 `2 dies, 1 CS` |

## H9JC LPDDR5 颗粒

当前规则覆盖 `H9JCNNN(BK3|CP3|FA5)MLYR-*`：

| Token | density | `dram_die_stack` |
| --- | --- | --- |
| `BK3` | 16Gb | 2 dies, 1 CS |
| `CP3` | 32Gb | 4 dies, 2 CS |
| `FA5` | 64Gb | 8 dies, 2 CS |

## H58G LPDDR5X 颗粒

当前规则覆盖 `H58G(56|66|76|78)........`，其中有功能框图或公开 ordering 资料确认的组合输出 `dram_die_stack`：

| Key | density | topology fields |
| --- | --- | --- |
| `56:CK8BX146` | 32Gb | 2 dies, 1 CS |
| `66:CK8BX147` | 64Gb | 4 dies, 2 CS |
| `78:CK8BX185` | 128Gb | `channel_count=2`, `ce_count=2`（公开资料只确认 2Ch 2CS，不推断 die 数） |

## 尾缀处理

- `-` 后面的 speed / temperature / revision 不作为主结构强制条件。
- 例如 `H5AN8G8NAFR` 没有 `-UHC` 时仍输出 SK hynix、DDR4、8Gb、x8、package code 与 die revision，只是不输出 `dram_speed` / `operation_temperature`。
- 对已有可确认 speed 的完整 PN，`dram_speed` 必须输出频率或明确 speed bin；对可确认物理 die 数和 CS 的 LPDDR PN，`dram_die_stack` 必须输出 `N die(s), M CS`。

## 输出约定

- standalone DRAM `device.productType` 输出短 DRAM 世代名，例如 `DDR3`、`DDR4`、`DDR5`、`LPDDR4`、`GDDR5`。
- 内部 `dram_type` 不带厂商名且不保留冗余后缀，使用 `DDR3`、`DDR4`、`DDR5`、`LPDDR4`、`GDDR5` 这类短标准名。
- package code 只作为内部解析 token；只有 datasheet / 外部拆解能确认实际封装时才写 `fields.package`。
- 资料状态、来源 URL、确认状态等维护信息不得进入用户可见 `fields`。
