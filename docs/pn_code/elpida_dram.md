# Elpida DRAM PN 规则

采集日期：2026-05-08；更新日期：2026-08-27

本页记录 Elpida standalone DRAM 颗粒的 PN 结构。Elpida 已被 Micron 收购，旧 PN 资料多来自原厂 datasheet 镜像、Intel validation 表和公开分销/检索页面；规则只纳入能被外部资料交叉确认的 token。

## 外部资料

- Elpida `EDW2032BBBG` datasheet 确认 2G bits GDDR5 SGRAM、64M x32、170-ball FBGA、5.0/6.0/7.0Gbps，并给出 `EDW 20 32 B B BG -60 -F` 的 part-number breakdown。来源：<https://www.alldatasheet.com/html-pdf/458072/ELPIDA/EDW2032BBBG/446/2/EDW2032BBBG.html>
- Elpida `EDD2516AKTA` / `EDD2516AETA` datasheet 镜像确认 256M bits DDR SDRAM、x16、66-pin TSOP-II、DDR400/333/266 speed bin，并给出 `ED D 25 16 A K TA -5B -E` 这类 PN breakdown。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/309034/ELPIDA/EDD2516AKTA-5CLI.html>、<https://datasheet4u.com/datasheet/Elpida-Memory/EDD2516AETA-622479>
- Elpida `EDE1116ACBG-8E-E` datasheet 镜像确认 1G bits DDR2 SDRAM，EDE1104/EDE1108/EDE1116 ACBG 系列，并给出 ordering/package 资料。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/308530/ELPIDA/EDE1116ACBG-8E-E.html>、<https://www.alldatasheet.com/html-pdf/308530/ELPIDA/EDE1116ACBG-8E-E/918/4/EDE1116ACBG-8E-E.html>
- Elpida `EDB8164B3PF` datasheet 页面确认 8G bits LPDDR2 / Mobile RAM。来源：<https://datasheet4u.com/datasheets/ELPIDA/EDB8164B3PF/1202702>
- Intel LPDDR3 validation table 确认 `EDF8164A3MA-GD-F` 为 8Gb、4Gb die、DDP、x64；`EDFA164A2MA-GD-F` 为 16Gb、4Gb die、QDP、x64。来源：<https://www.intel.com/content/dam/www/public/us/en/documents/platform-memory/lpddr3-atom-tablet-processor-system-validation-results.pdf>
- Intel LPDDR3 1600 validation table 再次确认 Elpida `EDFA164A1MA-GD-F` / `EDF8164A1MA-GD-F` 的 DDP/QDP 与 x64 package width。来源：<https://www.intel.cn/content/dam/www/public/us/en/documents/platform-memory/lpddr3-low-power-1600-validation-results.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/elpida-dram-token.json`
- 规则 ID：`vendor.elpida.dram.sdr_ddr.component.v1`、`vendor.elpida.dram.ddr2_ddr3.component.v1`、`vendor.elpida.dram.lpddr2_lpddr3.component.v1`、`vendor.elpida.dram.gddr5.component.v1`、`vendor.elpida.dram.daisy_chain_mobile.v1`
- 当前覆盖：
  - SDR / DDR：`EDS/EDD`
  - DDR2 / DDR3：`EDE/EDJ`
  - LPDDR2 / LPDDR3：`EDB/EDF`
  - Graphics DRAM：`EDW2032...` GDDR5
  - Daisy-chain LPDDR2 / LPDDR3：`EMB` / `EMF`，仅输出编号表已确认的 token 含义

Micron 官方 legacy Elpida guide 第 11/13 页确认第二位 `D=packaged device`、
`M=daisy-chain sample`，二者不是不同 vendor。本轮 `EMBA164B1PH-1D-F-R` /
`EMF8132A3PB-DV-F-D` 沿用仓库已有 Elpida 归属，输出 `special_option = Daisy chain sample`；
`PH/PB` 封装和 LPDDR2 `1D` 速度按表解析，未知 `DV` 不猜速率。
<https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A0b279ea9-4e4c-49fa-98c6-c18ad4c67279/renditions/original/as/legacy-elpida-pns.pdf>

## PN 结构

SDR/DDR/DDR2/DDR3：

```text
ED + family + density-code + width + package + -speed
```

LPDDR：

```text
ED + family + density-code + stack-code + width + package + -speed
```

GDDR5：

```text
EDW + density-code + width + voltage/interface/package tokens + -speed
```

## 输出约定

- `Config Code` 只输出容量/位宽主配置，例如 `1216`、`4208`、`8164`、`2032`。
- SDR / DDR 的 package mapping 已命中时继续输出单 die / 单 CS；未知 package token 不再继承该默认值。
- LPDDR stack 只对 Intel validation table 明确的 DDP/QDP token 输出标准化 `dram_die_count = N` 与 `cs_count = M`。
- LPDDR package token 与 stack token 分别解析；package 已知但 `family:density:stack` 组合未知时保留 package，省略 `dram_die_count` / `cs_count`。
- GDDR5 的 family 可确认 `FBGA-170`，但只有已确认的 `BBBG` package token 输出单 die / 单 CS；未知 package token 保留 family 级封装信息并省略拓扑。
- Elpida 独立品牌的 standard DDR 世代到 DDR3 结束；DDR4 / DDR5 不是待补规则，不用 Micron 后续 PN 体系替代。LPSDR 缺少足够公开 PN breakdown，GDDR6 / GDDR7 也不存在独立 Elpida 产品线。
