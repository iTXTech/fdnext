# Winbond DRAM PN 规则

采集日期：2026-05-11

本页记录 Winbond standalone DRAM 颗粒的 PN 结构。本轮覆盖官方 2026 PSG 中可直接确认的 DDR3、DDR4、LPDDR4/LPDDR4X；SDR、DDR、DDR2、LPDDR3 等已在 PSG 中出现，但未在本轮落 iTXTech fdnext DecodePack。

## 外部资料

- Winbond 2026 Customized Memory Solution / Product Selection Guide 列出 mobile DRAM 与 specialty DRAM 产品表。来源：<https://www.winbond.com/export/sites/winbond/product-selection-guide/file/2026-Winbond-Customized-Memory-Solution.pdf?__locale=en_TW>
- DDR3 表确认 `W631/W632/W634/W638` 系列的 1Gb/2Gb/4Gb/8Gb、x8/x16、1.5V / 1.35V、DDR3-1333~2133、VFBGA(78/96) 与温度等级。
- DDR4 表确认 `W664GG6/8RB` 与 `W668GG6/8TB` 系列的 4Gb/8Gb、x8/x16、1.2V、DDR4-2400/2666/3200、VFBGA(78/96) 与温度等级；8Gb DDR4 表中状态列标注 2026。
- LPDDR4/4X 表确认 `W66*` 系列 1Gb/2Gb/4Gb/8Gb、x16/x32、1.8/1.1/1.1 或 1.8/1.1/0.6 电压、3200/3733/4267 MT/s、VFBGA/TFBGA/WFBGA 封装与工业 / 车规等级。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/decodepack/src/rules/packs/winbond-dram-token.json`
- 规则 ID：`vendor.winbond.dram.ddr3.component.v1`、`vendor.winbond.dram.ddr4.component.v1`、`vendor.winbond.dram.lpddr4.component.v1`
- 当前覆盖：
  - `W63[1248]G[GU][68]...`：DDR3 / DDR3L。
  - `W66[48]GG[68]...`：DDR4。
  - `W66[ABCD][PQ][26][NR]...`：LPDDR4 / LPDDR4X。

## PN 结构

DDR3：

```text
W63 + density + G + voltage + width + package + optional dash + speed + optional grade
```

DDR4：

```text
W66 + density + GG + width + package + optional dash + speed + optional grade
```

LPDDR4/4X：

```text
W66 + density + P/Q + width + N/R + package + speed + grade
```

## 输出约定

- DDR3 density token `1/2/4/8` 输出 1Gb/2Gb/4Gb/8Gb；DDR4 density token `4/8` 输出 4Gb/8Gb。
- DDR3 / DDR4 width token `6` 输出 x16、`8` 输出 x8，并分别映射到 VFBGA(96) / VFBGA(78)。
- DDR3 speed token `09/11/12/15` 输出 DDR3-2133/1866/1600/1333；DDR4 speed token `06/07/08` 输出 DDR4-3200/2666/2400。
- LPDDR4/4X 的 `P/Q + N/R` 组合区分 LPDDR4 与 LPDDR4X；`F/G/H` 输出 3200/3733/4267 MT/s。
- 官方 PSG 表未提供可直接落到 die stack / CS 的 Winbond token，本轮不推断 `dram_die_stack`。
- `packages/resources/resources/dram-pn.json` 收录本轮 iTXTech fdnext DecodePack 能解析的官方 Winbond PN 样例，用于搜索补全；解码仍由 token 规则完成。
