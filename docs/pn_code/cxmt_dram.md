# CXMT DRAM PN 规则

采集日期：2026-05-08

本页记录 CXMT standalone DRAM 颗粒的 PN 结构。公开资料主要集中在 DDR4 与 LPDDR4X；DDR5、LPDDR5/5X、GDDR 等没有足够公开 PN breakdown 时不写成确定规则。

## 外部资料

- CXMT 官方产品页确认公开产品线包含 DDR5/DDR5 module、LPDDR5/5X、DDR4/DDR4 module、LPDDR4X，但页面没有给出可直接落 DSL 的 ordering table / PN breakdown。来源：<https://www.cxmt.com/en/product.html>
- CXMT 官方新闻确认 LPDDR5 产品线含 12Gb die、6GB/12GB mobile DRAM 与 POP packaged chip；LPDDR5X 产品线含 12Gb/16Gb die、12GB/16GB/24GB packaged chip 与 8533/9600/10667Mbps，但新闻没有公开具体 standalone PN breakdown。来源：<https://www.cxmt.com/en/news/info_15.html>、<https://www.cxmt.com/en/news/info_19.html>
- CXMT `CXDQ3BFAM-CQ-A` datasheet 镜像确认 8Gb x16 DDR4 SDRAM、512M x16、96-ball FBGA、1.2V，并在 part-number decoding 中列出 `CX D Q 3 B F A M C Q A` 字段：`3=8Gb`、`B=96-ball FBGA SDP`、`F=x16`、`A=1.2V`、`C=Commercial`、`Q=2666Mbps`。来源：<https://datasheet.lcsc.com/lcsc/2410121538_CXMT-CXDQ3BFAM-CQ-A_C7463070.pdf>
- LCSC `CXDQ3BFAM-CJ-A` 页面确认 CXMT、8Gbit DDR4、FBGA-96、1.14V~1.26V、1.6GHz。来源：<https://www.lcsc.com/product-detail/C7543662.html>
- CXMT `CXDB5CCAM-MK` LPDDR4X datasheet 镜像确认 `CXDB4ABAM-MK` 为 16Gb、`CXDB5CCAM-MK` 为 32Gb、2CH x32、3733Mbps、200 Ball Discrete，并在 part-number decoding 中列出 `4=16Gb`、`5=32Gb`、`B=x32,2CH,1CS`、`C=x32,2CH,2CS`、`A=200ball FBGA 10x15 DDP`、`C=200ball FBGA 10x15 QDP`。来源：<https://datasheet4u.com/pdf/1550200/CXDB5CCAM-MK.pdf>
- CXMT `CXDB5CBAM-MA-B` datasheet 镜像补充确认 4GB LPDDR4X、2CH x32、4266Mbps、200 Ball Discrete，并给出 `B=x32 2CH 1CS`、`A=DDP`、`C=200-ball` 这类后续版本 token。来源：<https://www.dzjie.com/wp-content/uploads/2025/03/LPDDR4X_CXDB5CBAM-MA-B.pdf>

## DSL 范围

- 规则文件：`packages/dsl/src/rules/packs/cxmt-dram-token.json`
- 规则 ID：`vendor.cxmt.dram.ddr4.component.v1`、`vendor.cxmt.dram.lpddr4x.component.v1`
- 当前覆盖：
  - DDR4：`CXDQ3BFAM-*`
  - LPDDR4X：`CXDB4ABAM-*`、`CXDB4CBAM-*`、`CXDB5CBAM-*`、`CXDB5CCAM-*` 同类 token 结构

## PN 结构

DDR4：

```text
CX + D + Q + density + width + package/material/voltage/revision + -temp/speed + optional revision
```

LPDDR4X：

```text
CX + D + B + density + io/ch/cs + package + -temp/speed + optional grade
```

## 输出约定

- DDR4 `3` 输出 8Gb，`B` 输出 x16，`FAM` 输出 96-ball FBGA，suffix `CJ/IJ/CQ/WQ` 输出 speed/temp。
- LPDDR4X `4` 输出 16Gb，`5` 输出 32Gb；`A/B/C` 位宽/通道 token 当前均输出 x32；`BAM` 输出 DDP/1CS，`CAM` 输出 QDP/2CS，二者顶层均输出 200-ball FBGA。
- suffix 不存在时不输出 speed/temp。
- DDR5、LPDDR5/5X、GDDR 当前只作为资料缺口记录，不进入 DSL。
