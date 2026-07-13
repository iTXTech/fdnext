# SK hynix DRAM PN 规则

采集日期：2026-05-18

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
- SK hynix DDR4 产品表列出 32Gb `H5ANBG6NAMR-XNC` (x16) 与 `H5ANBG8NABR-XNC` (x8)，均为 DDR4-3200 / 1.2V。产品表只写 FBGA，未给出 package-token decoder；因此新规则不依据完整 PN 行反推 package。来源：https://www.skhynix.glochip.com/h-pd-2.html
- `H5GQ2H24AFR-R0C` datasheet: 2Gb (64Mx32) GDDR5 SGRAM，170 ball BGA，VDD/VDDQ 支持 1.6V/1.5V/1.35V；`R0/T2/T0` ordering rows分别对应 6.0/5.0/4.0Gbps/pin。来源：https://datasheet4u.com/pdf/1550045/H5GQ2H24AFR.pdf
- `H5CG48AGBD-X018` DDR5: TechInsights 确认该 BGA package 内含单颗 16Gb DDR5 die；TechPowerUp 拆解也把 `H5CG48AGBD-X018` 标为 SK hynix A-Die DDR5 IC。来源：https://www.techinsights.com/ko/node/51799 和 https://www.techpowerup.com/review/patriot-viper-xtreme-5-rgb-ddr5-8000-cl38-2x-16-gb/3.html
- `H5CG48MEBD-X014` TechInsights 资料确认来自 SK hynix DDR5 package；公开 DDR5 列表还列出 `H5CG48AGBDX018N`、`H5CG48MEBDX014N`、`H5CG46AGBDX017N`、`H5CG46MEBDX015N` 的 16Gb x8/x16 4800/5600Mbps 组合。来源：https://www.techinsights.com/products/mfr-2112-803、https://www.skhynix.glochip.com/h-pd-3.html
- `H5CG48AGBDX018` 分销/Findchips 资料确认 `DDR5-5600 2Gx8 (16Gb)`。来源：https://www.absunshine.com/zh-CN/parts/H5CG48AGBDX018-SK-HYNIX-5928148 和 https://www.findchips.com/search/h5cg48agbdx018
- `H5CGD8MHBD-X021` DDR5: TechInsights 确认该 24Gb DDR5 die/package，分销页交叉确认 `DDR5-6400 3Gx8 (24Gb)`。来源：https://www.techinsights.com/blog/sk-hynix-h5cgd8mhbd-x021-d1a-euv-24gb-ddr5-dram-memory-floorplan-analysis 和 https://nxelectronics.com/home/productdetail/?item_id=331166981&partno=H5CGD8MHBDX021N
- 本轮用户提供的 SK hynix DDR5 Component Product ordering / decoder / serial-code 表补充确认 `H5C` 结构：density token `G3/G4/GD/G5/G6` = 8Gb/16Gb/24Gb/32Gb/64Gb，organization `4/8/6` = x4/x8/x16，generation `M/A/B/C/D/E/J`，speed `EB/EE/GB/GE/HB/KB/MB`，temperature `D/J/T`，reserved `X` + 3 位 serial code；serial `012/013/014/015/017/018/021/022/023/024/051/052` 可确认 die density、ball count、die count 与 TSV 标记。`xxx` serial placeholder 不进入 exact PN 资源，资源中保留不带 `Xxxx` 的前缀形态。
- `H9HCNNN8KUMLHR-NME` LPDDR4: datasheet / LCSC 资料确认 8Gb LPDDR4、x16、2 Channel、1 CS、DDP、200ball FBGA、3733Mbps、1.8V/1.1V 电源域。来源：https://datasheet.lcsc.com/lcsc/2410121844_SK-HYNIX-H9HCNNN8KUMLHR-NME_C2912103.pdf 和 https://lcsc.com/product-detail/ddr-sdram_sk-hynix-h9hcnnn8kumlhr-nme_C2912103.html
- `H9HCNNNCPUMLXR-NEE` / `H9HCNNNCPMMLXR-NEE` 资料确认 32Gb、QDP、2Ch 2CS，分别为 LPDDR4 / LPDDR4X 4266Mbps、200ball FBGA。来源：https://dl.xkwy2018.com/downloads/RK3588S/03_Product%20Line%20Branch_Tablet/02_Key%20Device%20Specifications/H9HCNNNCPUMLXR.pdf 和 https://www.uttc.com.tw/wp-content/uploads/2025/12/Consumer_H9HCNNNCPMMLXR1.0-LPDDR4X-32Gb_1ynm.pdf
- SK hynix LPDDR4X 产品表补充 H54、modern H9HK 与 432-ball H9HC line-up：H54 容量 0.5GB~12GB、4266Mbps、200/556 ball，`H9HKNNN(CR/EB/FB)M*VAR-NEH` 为 4GB/6GB/8GB、4266Mbps、556 ball，`H9HCNNN(CR/FB)M*LPR-NEE` 为 4GB/8GB、4266Mbps、432 ball。H54 `BYY:Q` 在公开表的不同容量行出现 200/556 ball 冲突，因此规则不从该冲突组合输出 package；其余 package 只由外部表确认的 package-position token（必要时连同局部 feature token）输出。来源：https://www.skhynix.glochip.com/h-pd-5.html
- 同一产品表还直接列出此前搜索资源缺失的 12 条 legacy H9HC LPDDR4/4X PN：`H9HCNNNFAMALTR-NME`、`H9HCNNNCPMALHR-NEE`、`H9HCNNNBKMMLHR-NM[E/I/N/O]`、`H9HCNNNCPMMLHR-NM[N/O]`、`H9HCNNN4KMMLHR-NM[E/N/O/P]`。这些 exact PN 只进入搜索资源；其中 `H9HCNNNFAMALTR-NME` 行直接确认 8GB、3733Mbps、200Ball，因此 package-position token `T` 可增量映射为 `FBGA-200`。采集时发现页面链接 `title` 与表格可见 PN 存在错配，资源只采用表格实际显示文本，不采用错配属性。
- 对公开产品表的 DDR3/DDR4、DDR5、LPDDR4、LPDDR5、LPDDR5X、GDDR7、GDDR6、HBM 页面做可见行全量审计后，`dram-pn.json` 新增 153 条 SK hynix exact PN，产品表当前 225 条非模组/非 SSD 可见 PN 均有搜索种子。LPDDR5 页面直接确认 H58 `G4/G5/G6/GG/GU` 容量、K6=6400Mbps 与 serial `024/026/032/033/037/042` 的 441/315/496-ball；LPDDR5X 页面确认 `GD/GE`=24/48Gb 与 serial `091/103/104/105/106/107/108/114/168/169/170/171` 的 315/441/561-ball。来源：https://www.skhynix.glochip.com/h-pd-1.html、https://www.skhynix.glochip.com/h-pd-3.html、https://www.skhynix.glochip.com/h-pd-4.html、https://www.skhynix.glochip.com/h-pd-6.html、https://www.skhynix.glochip.com/h-pd-7.html、https://www.skhynix.glochip.com/h-pd-8.html、https://www.skhynix.glochip.com/h-pd-11.html、https://www.skhynix.glochip.com/h-pd-12.html
- `HY57V561620FTP-H` datasheet / 公开分销资料确认 256Mb SDRAM、16M x16、54-pin TSOP-II。来源：https://datasheet4u.com/datasheet/Hynix-Semiconductor/HY57V561620FTP-H-952232 和 https://www.etei.com/product/hy57v561620ftp-h
- `HY5DU121622DTP-D43` / `HY5PS121621CFP-Y5` 资料确认 512Mb DDR / DDR2 SDRAM、x16、TSOP-II/FBGA 与 speed bin。来源：https://datasheet4u.com/pdf-down/H/Y/5/HY5DU121622DTP_HynixSemiconductor.pdf 和 https://www.alldatasheet.com/datasheet-pdf/pdf/333866/HYNIX/HY5PS121621CFP-Y5.html
- Lenovo T14s Gen 2 schematic LPDDR5 source table 记录 `H9JCNNNBK3MLYR-N6E` = DDP 8Gb 1 Rank，`H9JCNNNCP3MLYR-N6E` = QDP 8Gb 2 Rank，`H9JCNNNFA5MLYR-N6E` = ODP 8Gb 2 Rank。来源：https://www.scribd.com/document/1011608984/Lenovo-ThinkPad-T14s-Gen-2-NM-E091-R1-0-Schemtic-1
- `H58G56CK8BX146` / `H58G66CK8BX147` LPDDR5X 315ball specs 的功能框图分别确认 32Gb DDP 1CS、64Gb QDP 2CS；本轮用户提供的 ordering / decoder 截图进一步确认 `H58` = LPDDR5X、density `G5/G6` = 32Gb/64Gb、organization `6` = x16、generation `C` = Gen4、speed `K8` = 8533、temperature `B` = -25~85C、reserved `X`，以及 serial `146/147`。来源：https://uttc.com.tw/wp-content/uploads/2026/02/H58G56CK8BX146_Rev1.0-3.pdf 和 https://uttc.com.tw/wp-content/uploads/2026/02/H58G66CK8BX147_Rev1.0-3.pdf
- ChromiumOS coreboot SPD 资源确认 `H58G56DK9BX068` 为 32Gb LPDDR5X-9600，由 2 颗 16Gb die 组成、每通道 x16、1 rank；外部库存表与之同向确认 `H58G56DK9BX068` / `H58G66DK9BX067` 分别为 32Gb / 64Gb、9600Mbps、315-ball LPDDR5X。TechInsights 对同代 `H58G76DKBH-X202` 的拆解确认 D1b 为 16Gb die；因此 64Gb `G6:067` 按同代 die 密度与已有 SK hynix 64Gb LPDDR5X 组织推定为 4 die / 2 CS / 2 channel，该拓扑属多源一致推断。规则按 `D` generation、`K9` speed 与 `067/068` serial token 解析。来源：https://chromium.googlesource.com/chromiumos/third_party/coreboot/+/c2a5fbcf5c3357caaa48652fb319ef730dd56815%5E%21/ 、https://adachi-denshi.co.jp/?p=5336 和 https://www.techinsights.com/blog/sk-hynix-mdhd5822036-d1b-16-gb-lpddr5x-transistor-characterization
- `H9JCNNNCP3MLYR-N6E` LPDDR5 与 `H58G66CK8BX147` LPDDR5X 的公开分销资料确认 6400Mbps / 8533Mbps、315ball FBGA、电压域与容量。来源：https://www.fusionww.com/shop/product/4263986/H9JCNNNCP3MLYR-N6E 和 https://www.ipros.com/en/product/detail/2001536936/
- SK hynix 2021 LPDDR 产品表列出 `H9JKNNNFB3AECR-N6H` / `H9JKNNNFB3MVJR-N6H` / `H9JKNNNHA3MVJR-N6H`：64Gb/96Gb LPDDR5-6400，1.8V/1.05V/0.5V，496/436 ball；MWC 2021 corporate overview 另确认 `H9JKNNNFB3AECR-N6H` 的 -30~105°C 温区。规则按 density token `FB3/HA3`、package token 组合 `E:C` / `V:J` 和 suffix `N6H` 解析。来源：https://atta.szlcsc.com/upload/public/pdf/source/20231116/D92B33AE61674A6C958A29DF0AE19494.pdf 和 https://gsma.my.site.com/mwcoem/servlet/servlet.FileDownload?file=00P6900002qXdyXEAS
- `H56C8H24MJR-S2C` GDDR6 资料确认 8Gb、x32、FBGA-180、1.35V 与 GDDR6 speed bin。来源：https://www.digchip.com/datasheets/parts/datasheet/2/202/H56C8H24MJR.php 和 https://www.absunshine.com/en/parts/H56C8H24MJR-S2C-SK-HYNIX-5126627
- SK hynix 的 GDDR7 产品页与 Newsroom 确认 H57G 产品族为 GDDR7、1.2V，并已进入量产；产品页列出 `H57G42MP4AX004N`，外部分销矩阵另列出同一 `H57G42` family 的 `H57G42MP2AX004` / `H57G42MP2AX006` 为 512Mx32 (16Gb)、28Gbps。结构规则确认 `H57G42` family 的 GDDR7、16Gb、x32 与 1.2V，并只对两个不同 serial 共同确认的 `MP2` 输出 28Gbps；不从 `MP4`、`AX` 或 serial 推断其他 speed/package。来源：https://www.directindustry.com/prod/hynix/product-34497-2575602.html、https://news.skhynix.com/sk-hynix-strengthens-graphics-memory-leadership-with-industrys-best-gddr7/ 和 https://www.sbit.com.tw/en/all_products.aspx?_id=330955286&_type=class
- SK hynix HBM 产品表列出 HBM3 `H5UG7HME03X020R` / `H5UG7HMD83X020R`：16Gb die、128Gb KGSD、8Hi、6.0/5.6Gbps；HBM2E `H5WRAGESM8W-N8L` / `-N6L` 与 `H5WR64ESM4W-N8L` / `-N6L`：16Gb die、128Gb/64Gb KGSD、8Hi/4Hi、3.6/3.2Gbps；另列 Automotive `H5WG6HMN6QX038R` 为 64Gb、4Hi、3.2Gbps。该公开产品表按 `external_table_confirmed` 使用；规则不把 `8Hi/4Hi` 错写成物理 package，也不解释 serial token。来源：https://www.skhynix.glochip.com/h-pd-12.html
- 本轮用户提供的 `H56G42AXXXX014` SK hynix 16Gb GDDR6 SGRAM datasheet 截图确认 Lead-Free / Halogen-Free / RoHS、2 independent channels、VPP/VDD/VDDQ operating points、180-ball BGA package with 0.75mm pitch，以及 ordering PN `H56G42AS8DX014` / `H56G42AS6DX014` / `H56G42AS4DX014` / `H56G42AS2DX014` 的 WCK frequency 与 max data rate。
- 本轮用户提供的 `H9CCNNNBLTBLAR-NxD` SK hynix 16Gb LPDDR3 datasheet 截图确认 178-ball FBGA、16Gb `(x32, 2CS)`、QDP / 1Ch 2CS、VDD1 1.8V、VDD2/VDDCA/VDDQ 1.2V、HSUL_12 interface、Commercial 0~85C、Lead & Halogen Free，以及 ordering PN `H9CCNNNBLTBLAR-NTD` = LPDDR3-1600、`H9CCNNNBLTBLAR-NUD` = LPDDR3-1866。
- 本轮用户提供的 `H9HCNNN*` / `H9HKNNNBTUMUBR` SK hynix LPDDR4/LPDDR4X datasheet 截图补充确认 8Gb / 16Gb / 32Gb / 64Gb token、DDP/QDP/ODP stack、2Ch/4Ch、200Ball FBGA / 366Ball FBGA、Gen1、Lead & Halogen Free，以及 suffix `L/M/E` = 3200/3733/4266、temperature `E/I/H` = -25~85C / -40~95C / -25~105C。

## H5U / H5W HBM 颗粒

当前 HBM 规则独立于普通 `H5C/H5T/H56` DRAM，并按局部 token 组合解码；完整 PN 只进入搜索资源和 testcase：

| PN 结构 / token | 字段 | 说明 |
| --- | --- | --- |
| `H5U` + `G7H` + speed + `X` + serial + optional revision | `dram_type` | HBM3 |
| HBM3 stack `G7H` | `dram_density` / `dram_die_density` / `dram_die_count` | 128Gb KGSD，16Gb die，8Hi |
| HBM3 speed `ME03/MD83` | `dram_speed` | 6.0 / 5.6Gbps per pin |
| `H5WR` + density + `ESM` + stack + `W` + speed + `L` | `dram_type` | HBM2E server/networking family |
| HBM2E density `AG/64` | `dram_density` / `dram_die_density` | 128Gb / 64Gb KGSD，均为 16Gb die |
| HBM2E stack `8/4` | `dram_die_count` | 8Hi / 4Hi |
| HBM2E speed `N8/N6` | `dram_speed` | 3.6 / 3.2Gbps per pin |

`8Hi/4Hi` 是 stack height，不是足以确认 ball count、尺寸或封装类型的 package token，因此公开结果只输出 `dram_die_count`，不输出 `package`。`X020/X038` 等 serial 只作结构位，不驱动规格字段；未知 serial 仍可保留其余 token 已确认字段。

产品表还列出单一 Automotive 样本 `H5WG6HMN6QX038R`（64Gb、4Hi、3.2Gbps）。exact PN 已进入搜索资源；由于目前只有一个公开 body，尚不足以证明 `G6H` / `MN6Q` 的跨 serial token 语义，因此仍不新增 decoder。

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

32Gb `H5ANBG*` 由独立规则处理：`BG` = 32Gb，`6/8` = x16/x8，`XN` = DDR4-3200 CL22，`C` = Commercial。公开表没有证明 `M/B` 中哪个 token 对应何种 ball count，因此即使 exact 行标为 FBGA，公开结果仍不输出 package。

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
| `M/A/B/C/D/E/J` | `dram_generation` / `die_revision` | Gen1 / Gen2 / Gen3 / Gen4 / Gen5 / Gen6 / Gen10-or-special，同时保留 `M-die` / `A-die` 等简短 die revision |
| `EB/EE/GB/GE/HB/KB/MB` | `dram_speed` | DDR5-4800 / 5600 / 6400 / 7200 / 8000 及对应 timing；`EE` / `GE` 标注 3DS speed bin |
| `D/J/T` | `operation_temperature` | Commercial 0 to 95C；Industrial -40 to 95C |
| `X012` 等 | serial token | 只作内部解析；公开输出 `dram_die_density`、`dram_die_count`、`package`，TSV 通过 `special_option` 输出 |

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

## H56 GDDR6 颗粒

当前规则覆盖两组 SK hynix GDDR6：

```text
H56C8H24 + die/package/revision + -speed + temp
H56G42 + A + speed + D + X + 014
H56G32 + C + speed + D + X + serial
```

`H56G42A...014` 已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `H56G42` | `dram_density` / `dram_width` | 16Gb GDDR6，x32 |
| `A` | `die_revision` | 固定 design / die revision token |
| `S8/S6/S4/S2` | `dram_speed` | max 20 / 18 / 16 / 14Gbps per pin，并附 WCK 10.0 / 9.0 / 8.0 / 7.0GHz |
| `D` | 内部 power / option token | ordering PN 固定 token，不作为公开 code 输出 |
| `X014` | 内部 serial token | 只用于匹配当前 ordering PN，不作为公开 code 输出 |

公开输出固定 `package = 180-ball BGA`、`dram_voltage = 1.8V VPP; 1.35V / 1.25V / 1.20V VDD/VDDQ`、`interface_type = POD_135 / POD_125` 和 `solder_type = Lead-Free and Halogen-Free (RoHS compliant)`。

产品表另确认 `H56G32CS4DX005` / `H56G32CS2DX005` 为 8Gb GDDR6、16/14Gbps per pin、1.35V VDD/VDDQ、FCBGA。独立结构规则按 `H56G32 + die revision + speed + D + X + serial` 解析，未知 speed / serial 自然降级，不把两条完整 PN 写成 whitelist。

## H57 GDDR7 颗粒

当前仅解码多条外部产品行共同确认的稳定头部结构：

```text
H57G42 + local configuration / speed / serial tokens
```

| Token | 字段 | 说明 |
| --- | --- | --- |
| `H57G` | `dram_type` | GDDR7 |
| `42` | `dram_density` / `dram_width` | 16Gb，512Mx32 |
| `MP2` | `dram_speed` | 两个不同 serial 产品行均为 GDDR7-28Gbps/pin |

`MP4`、`AX004/AX006` 与末尾 `N` 尚无公开 ordering breakdown，因此只作为结构字符
被消费，不输出 package、revision 或原始 code，也不从营销页反推 `MP4` speed。三条 exact PN 进入
`dram-pn.json`；decoder 仍按 family + 固定长度字符结构匹配，不维护完整 PN 白名单。

## H9CC LPDDR3 颗粒

当前规则覆盖 `H9CCNNNBLTBLAR-NxD`：

```text
H9CCNNN + BLTBLAR + -N + speed + D
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `BLTBLAR` | 主体结构 | LPDDR3-only MCP/PoP 结构；NVM density / speed 均为 none |
| `T/U` | `dram_speed` | LPDDR3-1600 / LPDDR3-1866 |
| `D` | `operation_temperature` | Commercial 0 to 85C |

公开输出固定 `dram_density = 16Gb`、`dram_width = x32`、`dram_die_count = 4`、`cs_count = 2`、`channel_count = 1`、`package = 178-ball FBGA`、`dram_generation = Gen3`、`interface_type = HSUL_12` 和 `solder_type = Lead and Halogen Free`。

## H9HC LPDDR4 颗粒

当前规则覆盖 `H9HCNNN[4K/8K/BK/BP/CP/FA][UM/MM/MA]L[H/X/T]R-*` 形式：

```text
H9HCNNN + density/stack token + package/mode token + -suffix
```

已进入 iTXTech fdnext DecodePack 的 token:

| Token | 字段 | 说明 |
| --- | --- | --- |
| `4K/8K/BK/BP/CP/FA` | density | 4Gb / 8Gb / 16Gb / 16Gb / 32Gb / 64Gb；`BP` 由多条 2GB 产品表行确认 |
| `8K` | `dram_die_count`, `cs_count`, `channel_count` | 2 dies, 1 CS；2 Channel |
| `BK` | `dram_die_count`, `cs_count`, `channel_count` | 2 dies, 1 CS；2 Channel |
| `CP` | `dram_die_count`, `cs_count`, `channel_count` | 4 dies, 2 CS；2 Channel |
| `FA` | `dram_die_count`, `cs_count`, `channel_count` | 8 dies, 2 CS；2 Channel |
| `UM/MM/MA` | DRAM Voltage / I/O / Option | LPDDR4 或 LPDDR4X、电压域与 `dram_width` |
| `L` | `dram_generation` | Gen1 |
| package `H/X/T` | `package` | 200-ball FBGA；`T` 由产品表中的 8GB exact 行直接确认 |
| material `R` | `solder_type` | Lead and Halogen Free |
| suffix speed `L/M/E` | `dram_speed` | LPDDR4/LPDDR4X-3200 / -3733 / -4266 |
| suffix temperature `E/I/H` | `operation_temperature` | -25~85C / -40~95C / -25~105C；只对公开资料可确认的温度范围输出 |

`dram_width` 不由 `H9HC` 前缀、density token 或 package token 单独推断，而由后续 DRAM Voltage / I/O / Option 语义表决定；未知 option 仍保留 density、stack、generation、package、speed、temperature 等已确认字段，只省略 width / voltage / type 中无法确认的部分。

## H54 / modern H9HK / 432-ball H9HC LPDDR4X 颗粒

公开产品表提供了 H54 与 modern H9HK 的多容量 line-up，但没有完整 ordering decoder。规则只落地跨多行重复、可按局部 token 泛化的字段：

| Token | 字段 | 说明 |
| --- | --- | --- |
| H54 density `G2/G3/G4/G5/G6/GE/GG` | `dram_density` | 4/8/16/32/64/48/96Gb |
| H54 family | `dram_type` / `dram_speed` / `dram_voltage` | LPDDR4X、4266Mbps、1.8V/1.1V/0.6V |
| H54 `AYR:H` / `CYR:H` / `AYZ:V/Q` | `package` | FBGA-556 |
| H54 `AYR:P/Q/V` / `BYY:J/P/V` | `package` | FBGA-200 |
| H54 `AYR:B/J` | `package` | FBGA-200 |
| H54 `BYY:Q` | 不输出 package | 产品表对不同 PN 给出冲突 ball count，不能泛化 |
| H9HK density `CR/EB/FB` | `dram_density` | 32/48/64Gb |
| H9HK package token `V` in `*VAR` | `package` | FBGA-556 |
| H9HK suffix `NEH` | `dram_speed` | LPDDR4X-4266 |
| H9HC density `CR/FB` | `dram_density` | 32/64Gb |
| H9HC package-position token `P` in `*LPR` | `package` | FBGA-432 |
| H9HC suffix middle token `E` in `NEE` | `dram_speed` | LPDDR4X-4266 |

`X` 后 3 位仍是 serial 结构位；规则允许未知 serial，证明没有用完整 PN 或 base PN 查表。

## H9HK LPDDR4 PoP 颗粒

当前规则覆盖 `H9HKNNNBTUMUBR-NL[M/H]`：

| Token | 字段 | 说明 |
| --- | --- | --- |
| `BT` | density / stack | 16Gb, DDP, 4Ch 1CS |
| `UM` | DRAM Voltage / I/O / Option | LPDDR4, x16 |
| `U` | `dram_generation` | Gen1 |
| `B` | `package` | 366-ball FBGA (15x15) |
| `R` | `solder_type` | Lead and Halogen Free |
| suffix `L` + `M/H` | speed / temperature | LPDDR4-3200；-25~85C / -25~105C |

## H9JC LPDDR5 颗粒

当前规则覆盖 `H9JCNNN(BK3|CP3|FA5)MLYR-*`。`dram_width` 同样从 DRAM option token `M` 输出，不从 `H9JC` 前缀推断：

| Token | 字段 | 说明 |
| --- | --- | --- |
| `BK3/CP3/FA5` | density / stack | 16Gb / 32Gb / 64Gb；2 dies 1 CS / 4 dies 2 CS / 8 dies 2 CS |
| `M` | DRAM Voltage / I/O / Option | LPDDR5, x32, 1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ |
| `Y` | `package` | 315-ball FBGA |
| `R` | `solder_type` | Lead and Halogen Free |
| suffix `N6E` | speed / temperature | LPDDR5-6400；-25~85C |

## H9JK LPDDR5 颗粒

| Token | 字段 | 说明 |
| --- | --- | --- |
| `FB3/HA3` | `dram_density` | 64Gb / 96Gb |
| DRAM option `A/M` | `dram_type` / `dram_voltage` | LPDDR5，1.8V/1.05V/0.5V |
| package `E:C` / `V:J` | `package` | FBGA-496 / FBGA-436 |
| material `R` | `solder_type` | Lead and Halogen Free |
| suffix `N6H` | speed / temperature | LPDDR5-6400，-30~105°C |

## H58 LPDDR5 / LPDDR5X 颗粒

LPDDR5 产品表按 `H58 + density + organization + generation + K6 + option + X + serial` 列出 6400Mbps 颗粒。新规则只解释多行直接重复的字段：`G4/G5/G6/GG/GU` = 16/32/64/96/144Gb，organization `6/8` = x16/x8，`K6` = LPDDR5-6400，serial `032/033` = FBGA-315、`024/026` = FBGA-441、`037/042` = FBGA-496；generation 和 option 仍作为内部结构 token，不在缺少 ordering decoder 时补猜语义。

外部 datasheet 截图补充确认三组 496-ball PoP LPDDR5X ordering PN：`H58G66BK8HX096`（64Gb、4Ch 1CS）、`H58GG6AK8HX094`（96Gb、4Ch 2CS）和 `H58G76BK8HX095`（128Gb、4Ch 2CS）。三者均为 LPDDR5X-8533、`-25~105°C`、496-ball FBGA；package drawing 给出 `14x12.4`。来源：https://bbs.16rd.com/thread-640363-1-1.html、https://bbs.16rd.com/thread-640473-1-1.html、https://bbs.16rd.com/thread-640476-1-1.html；96Gb 封装尺寸另由分销规格交叉确认：https://www.memorysolution.de/en/sk-hynix/ic-sdram-mobile-lpddr5x-8533-96gbit-sk-hynix-1-05v-fbga-496ball/AH58GG6AK8HX094

当前规则覆盖 `H58 + density + organization + generation + speed + temperature + X + serial`；各字段均按实际 token 解码，serial 只有进入已确认 package 表时才输出封装：

| Token | 字段 | 说明 |
| --- | --- | --- |
| `G5/G6/G7/GD/GE/GG` | density | 32Gb / 64Gb / 128Gb / 24Gb / 48Gb / 96Gb |
| `6/8` | `dram_width` | x16 / x8 |
| `A/B/C/D` | `dram_generation` | Gen2 / Gen3 / Gen4 / Gen5 |
| `K8` | `dram_speed` | LPDDR5X-8533 |
| `B` | `operation_temperature` | -25~85C |
| `H` | `operation_temperature` | -25~105C |
| `X` | reserved | 内部 reserved token，不作为公开 code 字段输出 |
| `067/068/146/147/185` | package | 315-ball FBGA |
| `094/095/096` | package | 496-ball FBGA, 14x12.4, PoP |
| `091/103/104/114` | package | 315-ball FBGA |
| `105/106/107/108` | package | 441-ball FBGA |
| `168/169/170/171` | package | 561-ball FBGA |

其中有功能框图或公开 ordering 资料确认的组合输出 `dram_die_count` / `cs_count`：

| Key | density | topology fields |
| --- | --- | --- |
| `G5:146` | 32Gb | 2 dies, 1 CS；2 Channel |
| `G6:147` | 64Gb | 4 dies, 2 CS；2 Channel |
| `G7:185` | 128Gb | `channel_count=2`, `cs_count=2`（公开资料只确认 2Ch 2CS，不推断 die 数） |
| `G6:096` | 64Gb | `channel_count=4`, `cs_count=1`（不推断 die 数） |
| `GG:094` | 96Gb | `channel_count=4`, `cs_count=2`（不推断 die 数） |
| `G7:095` | 128Gb | `channel_count=4`, `cs_count=2`（不推断 die 数） |

## 尾缀处理

- `-` 后面的 speed / temperature / revision 不作为主结构强制条件。
- 例如 `H5AN8G8NAFR` 没有 `-UHC` 时仍输出 SK hynix、DDR4、8Gb、x8、package code 与 die revision，只是不输出 `dram_speed` / `operation_temperature`。
- 对已有可确认 speed 的完整 PN，`dram_speed` 必须输出频率或明确 speed bin；对可确认物理 die 数和 CS 的 LPDDR PN，必须分别输出 `dram_die_count=N` 与 `cs_count=M`。

## 输出约定

- standalone DRAM `device.productType` 输出短 DRAM 世代名，例如 `DDR3`、`DDR4`、`DDR5`、`LPDDR4`、`GDDR5`。
- 内部 `dram_type` 不带厂商名且不保留冗余后缀，使用 `DDR3`、`DDR4`、`DDR5`、`LPDDR4`、`GDDR5` 这类短标准名。
- package code 只作为内部解析 token；只有 datasheet / 外部拆解能确认实际封装时才写 `fields.package`。
- 资料状态、来源 URL、确认状态等维护信息不得进入用户可见 `fields`。
