# ISSI Parallel SLC NAND PN / Flash ID 规则

采集日期：2026-07-13

## 外部资料

- ISSI Product Selector Guide 的 SLC NAND Flash Part Decoder 给出完整 ordering grammar：<https://www.issi.com/WW/pdf/psg.pdf>
- ISSI 独立 Part Decoder 交叉确认 family、voltage、density、width、ECC、package、temperature 与 packing token：<https://issi.com.cn/ww/pdf/flash-partdecoder.pdf>
- 4Gb x8/x16 3.3V/1.8V SLC datasheet 给出 geometry 与 `9D 6C/AC 80 19 30 40` 等 Read ID：<https://www.issi.com/WW/pdf/34-35ML04G088-168.pdf>、<https://www.issi.com/WW/pdf/34-35MW04G088-168.pdf>
- 8Gb x8/x16 3.3V/1.8V SLC datasheet 给出 geometry 与 `9D 63/53/A3/93 80 19 30 40` Read ID：<https://www.issi.com/WW/pdf/34-35ML-MW08G088-168.pdf>

## PN 结构

```text
IS + family(34/35) + technology(M) + voltage(L/W)
   + density(01G/02G/04G/08G) + width(08/16) + ECC(1/4/8)
   + optional die revision + -package(T/B) + L + temperature(I/E/A1/A2)
   + optional packing(-TR/-TY)
```

- `34` 为 NAND，`35` 为 Automotive NAND；两者仍以 temperature token 决定公开温度范围。
- `M` 为 standard SLC NAND。
- `L/W` 分别为 2.7V~3.6V / 1.7V~1.95V。
- `01G/02G/04G/08G` 分别为 1/2/4/8Gb；`08/16` 分别为 x8/x16；`1/4/8` 为 ECC requirement。
- package `T/B` 分别为 TSOP-I-48 / VFBGA-63；`L` 表示 RoHS、Halogen-free 与 TSCA compliant。
- temperature `I/E/A1/A2` 分别为 industrial -40°C~85°C、industrial -40°C~105°C、automotive -40°C~85°C、automotive -40°C~105°C。
- packing `TR/TY` 分别为 Tape and Reel / Tray。未知 die revision 只作为内部 token 消费，不回显 code。

规则文件：`packages/core/src/decodepack/rules/packs/issi-nand-token.json`。

## Flash ID

| Read ID | Density | Voltage | Width | Die / Plane | Page / Spare | Block | ECC |
| --- | ---: | --- | ---: | --- | --- | --- | --- |
| `9D 6C 80 19 30 40` | 4Gb | 2.7V~3.6V | x8 | 1 / 1 | 4096B / 256B | 256KiB | 8bit/512B |
| `9D AC 80 19 30 40` | 4Gb | 2.7V~3.6V | x16 | 1 / 1 | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 63 80 19 30 40` | 8Gb | 2.7V~3.6V | x8 | 2 / 1 per die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 53 80 19 30 40` | 8Gb | 1.7V~1.95V | x8 | 2 / 1 per die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D A3 80 19 30 40` | 8Gb | 2.7V~3.6V | x16 | 2 / 1 per die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 93 80 19 30 40` | 8Gb | 1.7V~1.95V | x16 | 2 / 1 per die | 4096B / 256B | 256KiB | 8bit/512B |

规则文件：`packages/core/src/decodepack/identifier/packs/issi.json`。

旧 `C8` manufacturer ID / device ID 组合与 EON、ESMT 等资料存在归属冲突，本轮不把 `C8` 泛化为 ISSI，也不建立 exact 归属规则。
