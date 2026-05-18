# Winbond DRAM PN 规则

采集日期：2026-05-18

本页记录 Winbond standalone DRAM 颗粒的 PN 结构。当前覆盖官方资料中可直接确认的 DDR、DDR2、DDR3、DDR4、LPDDR、LPDDR2、LPDDR3、LPDDR4、LPDDR4X；SDR 已在 PSG 中出现，但未在本轮落 iTXTech fdnext DecodePack。

## 外部资料

- Winbond 2026 Customized Memory Solution / Product Selection Guide 列出 mobile DRAM 与 specialty DRAM 产品表。来源：<https://www.winbond.com/export/sites/winbond/product-selection-guide/file/2026-Winbond-Customized-Memory-Solution.pdf?__locale=en_TW>
- DDR 表确认 `W9412G6KH` / `W9425G6KH` 系列的 128Mb/256Mb、x16、2.5V、66-pin TSOP 400mil、DDR400 / DDR333 CL3 与 commercial / industrial / automotive 温度等级。
- DDR2 表确认 `W9712G6KB`、`W971GG6/8NB`、`W9725G6/8KB`、`W972GG6KB`、`W972GG8KS` 系列的 128Mb/256Mb/1Gb/2Gb、x8/x16、1.8V、4-bank / 8-bank、TFBGA(60/84) 8mm x 12.5mm 与 DDR2-667/800/1066 ordering suffix。
- DDR3 表确认 `W631/W632/W634/W638` 系列的 1Gb/2Gb/4Gb/8Gb、x8/x16、1.5V / 1.35V、DDR3-1333~2133、VFBGA(78/96) 与温度等级。`W631GG6NB` / `W631GG8NB` 表行确认 8-bank 结构、x16 7.5mm x 13mm 96-ball VFBGA 与 x8 8mm x 10.5mm 78-ball VFBGA。
- DDR4 表确认 `W664GG6/8RB` 与 `W668GG6/8TB` 系列的 4Gb/8Gb、x8/x16、1.2V、DDR4-2400/2666/3200、VFBGA(78/96) 与温度等级；`W664GG6RB` / `W664GG8RB` 表行确认 x16 7.5mm x 13mm 96-ball VFBGA 与 x8 7.5mm x 11mm 78-ball VFBGA，8Gb DDR4 表中状态列标注 2026。
- 用户提供的 Winbond LPDDR datasheet 确认 `W948D6KBHX` / `W948V6KBHX` 256Mb x16、`W949D6DB` / `W949D2DB` 512Mb x16/x32、`W94AD6KB` / `W94AD2KB` 1Gb x16/x32 Mobile LPDDR：1.8V VDD/VDDQ、4-bank、60-ball / 90-ball VFBGA、200MHz / 166MHz 与 extended / industrial 温度等级。
- 用户提供的 Winbond LPDDR2 datasheet 确认 `W978H6/2KB` 256Mb、`W979H6/2KB` 与 `W979H6RB` 512Mb、`W97AH6/2KB` 1Gb LPDDR2-S4B：x16/x32、4-bank 或 8-bank、1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ、134-ball VFBGA (10mm x 11.5mm)、LPDDR2-800 / 1066 与 extended / industrial 温度等级。
- 用户提供的 Winbond LPDDR3 datasheet 确认 `W639H6RB` 512Mb x16 2-bank 与 `W63AH6/2NB` 1Gb x16/x32 8-bank：1.8V VDD1 / 1.2V VDD2/VDDQ、178-ball VFBGA (11mm x 11.5mm)、LPDDR3-1600 / 1866 / 2133 与 extended / industrial 温度等级。
- LPDDR4 与 LPDDR4X 表确认 `W66*` 系列 1Gb/2Gb/4Gb/8Gb、x16/x32、1.8/1.1/1.1 或 1.8/1.1/0.6 电压、3200/3733/4267 MT/s、VFBGA/TFBGA/WFBGA 封装与工业 / 车规等级。
- 用户提供的 Winbond `W66BP6RB_W66CP2RQ` datasheet 确认 2Gb / 4Gb LPDDR4/4X Combo SDRAM：VDDQ = 1.1V 时工作为 LPDDR4 mode，VDDQ = 0.6V 时工作为 LPDDR4X mode；ordering 表的 `F/G/H` 分别对应 3200/3733/4267。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/winbond-dram-token.json`
- 规则 ID：`vendor.winbond.dram.ddr.component.v1`、`vendor.winbond.dram.lpddr.component.v1`、`vendor.winbond.dram.ddr2.component.v1`、`vendor.winbond.dram.lpddr2.component.v1`、`vendor.winbond.dram.ddr3.component.v1`、`vendor.winbond.dram.lpddr3.component.v1`、`vendor.winbond.dram.ddr4.component.v1`、`vendor.winbond.dram.lpddr4.component.v1`
- 当前覆盖：
  - `W94(12|25)G6KH...`：DDR SDRAM。
  - `W94(8D|8V|9D|AD)(6|2)...`：Mobile LPDDR SDRAM。
  - `W97(12|25|1G|2G)G(6|8)...`：DDR2 SDRAM。
  - `W97(8H|9H|AH)(6|2)...` 与 `W979H6RB...`：LPDDR2-S4B SDRAM。
  - `W63[1248]G[GU][68]...`：DDR3 / DDR3L。
  - `W63(9H6RB|AH[62]NB)...`：LPDDR3 SDRAM。
  - `W66[48]GG[68]...`：DDR4。
  - `W66[ABCD][PQ][26][NR]...`：LPDDR4、LPDDR4X 或 LPDDR4/4X Combo。

## PN 结构

DDR：

```text
W94 + density + G + width + package + optional suffix
suffix = optional dash + speed(1 digit) + optional grade
```

DDR2：

```text
W97 + density + G + width + package + optional suffix
suffix = optional dash + speed(18/25/3) + optional grade
```

LPDDR：

```text
W94 + density family + width + package family + optional package/speed/grade tail
suffix = speed(5/6) + grade(E/I)
```

LPDDR2：

```text
W97 + density family + width + package family + optional package/speed/grade tail
suffix = package(VX/VA) + speed(1/2) + grade(E/I)
```

DDR3：

```text
W63 + density + G + voltage + width + package + optional suffix
suffix = optional dash + speed(2 digits) + optional grade
```

LPDDR3：

```text
W63 + density family + width + package family + optional package/speed/grade tail
suffix = package(VA) + speed(B/C/D) + grade(E/I)
```

DDR4：

```text
W66 + density + GG + width + package + optional suffix
suffix = optional dash + speed(2 digits) + optional grade
```

LPDDR4/4X：

```text
W66 + density + P/Q + width + N/R + package family + optional package/speed/grade tail
```

## 输出约定

- DDR density token `12/25` 输出 128Mb/256Mb，固定 x16、2.5V、4-bank、66-pin TSOP 400mil；缺 suffix 时只输出基础字段。
- DDR2 density token `12/25/1G/2G` 输出 128Mb/256Mb/1Gb/2Gb；`12/25` 为 4-bank，`1G/2G` 为 8-bank；width token `6/8` 输出 x16/x8，并分别映射到 84-ball / 60-ball TFBGA (8mm x 12.5mm)。
- LPDDR family token `8D/8V/9D/AD` 输出 256Mb/256Mb/512Mb/1Gb；width token `6/2` 输出 x16/x32，并分别映射到 60-ball / 90-ball VFBGA；speed token `5/6` 输出 LPDDR 200MHz / 166MHz，grade `E/I` 输出 Extended (-25C~85C) / Industrial (-40C~85C)。
- LPDDR2 family token `8H/9H/AH` 输出 256Mb/512Mb/1Gb；`8H/9H` 为 4-bank，`AH` 为 8-bank；width token `6/2` 输出 x16/x32；speed token `1/2` 输出 LPDDR2-1066 / LPDDR2-800。
- LPDDR3 family token `9H/AH` 输出 512Mb/1Gb；`9H` 为 2-bank，`AH` 为 8-bank；width token `6/2` 输出 x16/x32；speed token `B/C/D` 输出 LPDDR3-1600 / 1866 / 2133。
- DDR3 density token `1/2/4/8` 输出 1Gb/2Gb/4Gb/8Gb；DDR4 density token `4/8` 输出 4Gb/8Gb。
- DDR3 / DDR4 width token `6` 输出 x16、`8` 输出 x8，并分别映射到 VFBGA(96) / VFBGA(78)。
- DDR suffix speed token `5/6` 分别输出 DDR-400 CL3、DDR-333 CL3；suffix grade 空字母输出 Commercial (0C~70C)，`I` 输出 Industrial (-40C~85C)，`K` 输出 Automotive AG2 (-40C~105C)，`A` 输出 Automotive AG3 (-40C~85C)。
- DDR2 suffix speed token `18/25/3` 按 family 输出 DDR2-1066、DDR2-800、DDR2-667 timing；`25` 为 5-5-5 / 6-6-6 双 bin，不输出单一 CAS latency。suffix grade 空字母输出 Commercial (0C~85C)，`I` 输出 Industrial (-40C~95C)，`J` 输出 Industrial Plus (-40C~105C)，车规 `S/K/W/A` 分别输出 AG1/AG2/AG2 Plus/AG3。
- `W631GG6NB`、`W631GG8NB`、`W664GG6RB`、`W664GG8RB` 这类基础 family PN 可输出已确认的容量、位宽、电压、封装；缺 suffix 时不输出速度和温度等级。
- suffix 最后两位数字表示 speed grade：DDR3 `09/11/12/15` 分别输出 DDR3-2133 14-14-14、DDR3-1866 13-13-13、DDR3-1600 11-11-11、DDR3-1333 9-9-9；DDR4 `06/07/08` 分别输出 DDR4-3200 22-22-22、DDR4-2666 19-19-19、DDR4-2400 17-17-17。
- suffix 最后一位字母表示温度档；空字母且有 dash 的 commercial PN 输出 Commercial (0C~95C)，`I` 输出 Industrial (-40C~95C)，`J` 输出 Industrial Plus (-40C~105C)，DDR3 车规 `S/K/W/A` 分别输出 AG1/AG2/AG2 Plus/AG3。
- Winbond DDR/DDR2/DDR3/DDR4 ordering PN 中 dash 与无 dash suffix 写法完全同义；`dram-pn.json` 只保留带 dash 的 canonical 展示项，例如 `W631GG8NB-09J`，不同时保留 `W631GG8NB09J`。
- `W66AP6NB`、`W66AQ6NB`、`W66BP2NQ`、`W66BQ2NQ`、`W66BP6RB`、`W66CP2RQ` 这类基础 family PN 可输出已确认的容量、位宽、电压域、bank/channel 与 LPDDR 类型；缺完整 package/speed/grade tail 时不输出封装、速度和温度等级。
- LPDDR4 与 LPDDR4X 的 `P/Q + N/R` 组合区分 LPDDR4、LPDDR4X 或 combo family；`F/G/H` 输出 3200/3733/4267 MT/s。Combo family 输出 `dram_type=LPDDR4`，并用 `dram_generation=LPDDR4/4X Combo` 与 `special_option` 描述 VDDQ=1.1V 的 LPDDR4 mode、VDDQ=0.6V 的 LPDDR4X mode；速度按 datasheet ordering 表输出 `LPDDR4/4X-3200` 这类形式。
- 官方资料未提供可直接落到 die stack / CS 的 Winbond token，本轮不推断 `dram_die_stack`。
- `packages/core/resources/dram-pn.json` 收录本轮 iTXTech fdnext DecodePack 能解析的官方 Winbond PN 样例与基础 family PN，用于搜索补全；解码仍由 token 规则完成。
