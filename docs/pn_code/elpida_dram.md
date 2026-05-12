# Elpida DRAM PN 规则

采集日期：2026-05-08

本页记录 Elpida standalone DRAM 颗粒的 PN 结构。Elpida 已被 Micron 收购，旧 PN 资料多来自原厂 datasheet 镜像、Intel validation 表和公开分销/检索页面；规则只纳入能被外部资料交叉确认的 token。

## 外部资料

- Elpida `EDW2032BBBG` datasheet 确认 2G bits GDDR5 SGRAM、64M x32、170-ball FBGA、5.0/6.0/7.0Gbps，并给出 `EDW 20 32 B B BG -60 -F` 的 part-number breakdown。来源：<https://www.alldatasheet.com/html-pdf/458072/ELPIDA/EDW2032BBBG/446/2/EDW2032BBBG.html>
- Elpida `EDD2516AKTA` / `EDD2516AETA` datasheet 镜像确认 256M bits DDR SDRAM、x16、66-pin TSOP-II、DDR400/333/266 speed bin，并给出 `ED D 25 16 A K TA -5B -E` 这类 PN breakdown。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/309034/ELPIDA/EDD2516AKTA-5CLI.html>、<https://datasheet4u.com/datasheet/Elpida-Memory/EDD2516AETA-622479>
- Elpida `EDE1116ACBG-8E-E` datasheet 镜像确认 1G bits DDR2 SDRAM，EDE1104/EDE1108/EDE1116 ACBG 系列，并给出 ordering/package 资料。来源：<https://www.alldatasheet.com/datasheet-pdf/pdf/308530/ELPIDA/EDE1116ACBG-8E-E.html>、<https://www.alldatasheet.com/html-pdf/308530/ELPIDA/EDE1116ACBG-8E-E/918/4/EDE1116ACBG-8E-E.html>
- Elpida `EDB8164B3PF` datasheet 页面确认 8G bits LPDDR2 / Mobile RAM。来源：<https://datasheet4u.com/datasheets/ELPIDA/EDB8164B3PF/1202702>
- Intel LPDDR3 validation table 确认 `EDF8164A3MA-GD-F` 为 8Gb、4Gb die、DDP、x64；`EDFA164A2MA-GD-F` 为 16Gb、4Gb die、QDP、x64。来源：<https://www.intel.com/content/dam/www/public/us/en/documents/platform-memory/lpddr3-atom-tablet-processor-system-validation-results.pdf>
- Intel LPDDR3 1600 validation table 再次确认 Elpida `EDFA164A1MA-GD-F` / `EDF8164A1MA-GD-F` 的 DDP/QDP 与 x64 package width。来源：<https://www.intel.cn/content/dam/www/public/us/en/documents/platform-memory/lpddr3-low-power-1600-validation-results.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/decodepack/src/rules/packs/elpida-dram-token.json`
- 规则 ID：`vendor.elpida.dram.sdr_ddr.component.v1`、`vendor.elpida.dram.ddr2_ddr3.component.v1`、`vendor.elpida.dram.lpddr2_lpddr3.component.v1`、`vendor.elpida.dram.gddr5.component.v1`
- 当前覆盖：
  - SDR / DDR：`EDS/EDD`
  - DDR2 / DDR3：`EDE/EDJ`
  - LPDDR2 / LPDDR3：`EDB/EDF`
  - Graphics DRAM：`EDW2032...` GDDR5

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
- LPDDR stack 只对 Intel validation table 明确的 DDP/QDP token 输出标准化 `dram_die_stack = N die(s), M CS`。
- Elpida 独立品牌的 standard DDR 世代到 DDR3 结束；DDR4 / DDR5 不是待补规则，不用 Micron 后续 PN 体系替代。LPSDR 缺少足够公开 PN breakdown，GDDR6 / GDDR7 也不存在独立 Elpida 产品线。
