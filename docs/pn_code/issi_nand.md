# ISSI 并行 SLC NAND PN / Flash ID 规则

采集日期：2026-07-13

## 外部资料

- ISSI Product Selector Guide 的 SLC NAND Flash Part Decoder 给出完整订购编码语法：<https://www.issi.com/WW/pdf/psg.pdf>
- ISSI 独立料号解码器交叉确认系列、电压、容量、位宽、ECC、封装、温度与包装编码段：<https://issi.com.cn/ww/pdf/flash-partdecoder.pdf>
- 4Gb x8/x16 3.3V/1.8V SLC 数据手册给出几何参数与 `9D 6C/AC 80 19 30 40` 等 Read ID：<https://www.issi.com/WW/pdf/34-35ML04G088-168.pdf>、<https://www.issi.com/WW/pdf/34-35MW04G088-168.pdf>
- 8Gb x8/x16 3.3V/1.8V SLC 数据手册给出几何参数与 `9D 63/53/A3/93 80 19 30 40` Read ID：<https://www.issi.com/WW/pdf/34-35ML-MW08G088-168.pdf>

## PN 结构

```text
IS + family(34/35) + technology(M) + voltage(L/W)
   + density(01G/02G/04G/08G) + width(08/16) + ECC(1/4/8)
   + optional die revision + -package(T/B) + L + temperature(I/E/A1/A2)
   + optional packing(-TR/-TY)
```

- `34` 为 NAND，`35` 为车规 NAND；两者仍以温度编码段决定公开温度范围。
- `M` 为标准 SLC NAND。
- `L/W` 分别为 2.7V~3.6V / 1.7V~1.95V。
- `01G/02G/04G/08G` 分别为 1/2/4/8Gb；`08/16` 分别为 x8/x16；`1/4/8` 为 ECC 要求。
- 封装 `T/B` 分别为 TSOP-I-48 / VFBGA-63；`L` 表示 RoHS、无卤与 TSCA 合规。
- 温度 `I/E/A1/A2` 分别为工业级 -40°C~85°C、工业级 -40°C~105°C、车规 -40°C~85°C、车规 -40°C~105°C。
- 包装 `TR/TY` 分别为卷带 / 托盘。未知 die 修订版只作为内部编码段消费，不回显编码。

规则文件：`packages/core/src/decodepack/rules/packs/issi-nand-token.json`。

## Flash ID

| Read ID | 容量 | 电压 | 位宽 | Die / 平面 | 页 / 备用区 | 块 | ECC |
| --- | ---: | --- | ---: | --- | --- | --- | --- |
| `9D 6C 80 19 30 40` | 4Gb | 2.7V~3.6V | x8 | 1 / 1 | 4096B / 256B | 256KiB | 8bit/512B |
| `9D AC 80 19 30 40` | 4Gb | 2.7V~3.6V | x16 | 1 / 1 | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 63 80 19 30 40` | 8Gb | 2.7V~3.6V | x8 | 2 / 1 每 die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 53 80 19 30 40` | 8Gb | 1.7V~1.95V | x8 | 2 / 1 每 die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D A3 80 19 30 40` | 8Gb | 2.7V~3.6V | x16 | 2 / 1 每 die | 4096B / 256B | 256KiB | 8bit/512B |
| `9D 93 80 19 30 40` | 8Gb | 1.7V~1.95V | x16 | 2 / 1 每 die | 4096B / 256B | 256KiB | 8bit/512B |

规则文件：`packages/core/src/decodepack/identifier/packs/issi.json`。

旧 `C8` 制造商 ID / 器件 ID 组合与 EON、ESMT 等资料存在归属冲突，本轮不把 `C8` 泛化为 ISSI，也不建立精确归属规则。
