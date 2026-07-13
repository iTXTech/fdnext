# ESMT parallel SLC NAND PN 规则

本页只记录 ESMT `F59` parallel SLC NAND。`F50` SPI NAND 不在本轮范围，也不会由本规则命中。

## 外部资料

- ESMT 当前 Automotive Grade SLC NAND 表列出 `F59L1G81MB`、`F59L2G81KA`、`F59D2G81KA`、`F59D4G81XB`、`F59L4G81KA`、`F59L8G81KSA`、`F59D8G81KSA`，确认 1Gb/2Gb/4Gb/8Gb、SLC、x8、1.8V/3.3V、25ns/45ns 与 TSOP/BGA 封装范围。来源：<https://www.esmt.com.tw/zh-tw/Products/Automotive%20Grade/SLC%20NAND-5-51>
- `F59L2G81XA (2B)` 原厂 datasheet 确认 2Gb、SLC、x8、3.3V、ONFI 1.0、25ns；ordering table 的 `-25TG2B` / `-25BG2B` 分别为 48-pin TSOP-I / 63-ball BGA。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L2G81XA%282B%29.pdf>
- `F59L8G81KSA (2R)` 原厂 datasheet 确认 8Gb（4Gb x2 die）、SLC、x8、3.3V、25ns；ordering table 的 `-25TG2R` / `-25BG2R` 分别为 48-pin TSOP-I / 63-ball BGA。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L8G81KSA%282R%29.pdf>
- `F59D1G81MB / F59D1G161MB (2M)` 原厂 datasheet 的 ordering table 同时确认 `81=x8`、`161=x16`，以及 `T=TSOP-48`、`BU=BGA-48, 6.5x5`、`B=BGA-63`、`BC=BGA-67`。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D1G81MB%26F59D1G161MB%282M%29_operation%20temperature%20condition%20-40~85%E2%84%83.pdf>
- `F59L4G161KA (2R)` 原厂 datasheet 进一步确认 x16 ordering 与 `BC` 67-ball BGA。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L4G161KA%282R%29.pdf>
- 当前可信分销资料补充确认 `F59D4G81XB-45BG2X`、`F59D4G81XB-45TIAG2X`、`F59D8G81KSA-45BG2R`、`F59D1G81MB-45BCG2M` 等 ordering suffix；其中 `BC` 与 67-ball BGA 同向，`B` 与 63-ball BGA、`T` 与 TSOP-48 同向。exact PN 只用于资料和 testcase，不进入 decoder 查表。示例：<https://suntsu.com/product/integrated-circuits/memory/f59d4g81xb-45bg2x/>、<https://suntsu.com/product/integrated-circuits/memory/f59d1g81mb-45bcg2m/>

## PN 结构

```text
F59 + voltage + density + width + design + [-speed + package + option/revision]
```

- voltage `L/D`：3.3V / 1.8V。
- density `1G/2G/4G/8G`：1Gb / 2Gb / 4Gb / 8Gb。
- width `81/161`：x8 / x16。
- speed `25/45`：25ns / 45ns。
- package `T/BU/B/BC`：TSOP-48 / BGA-48, 6.5x5 / BGA-63 / BGA-67；解析时按最长 token 取 `BU` / `BC`，不回退成 `B`。
- 中间 design token 与 ordering 尾部剩余 option/revision 只用于保持结构，不公开、不查完整 body，也不推断 die stack、ECC 或温区。

## 封装边界

只有 ordering PN 中实际出现 `T`、`BU`、`B` 或 `BC` package token 时才公开 `package`。缺少后缀的 family PN 仍输出容量、电压、SLC、width 与 parallel NAND，但不输出封装或速度。

## Parallel SLC Read ID

ESMT 原厂 datasheet 已确认以下完整五字节 `C8` Read ID。DecodePack 只对表内 tuple 做 exact match，可接受 runtime 的单字节 `00` padding；四个 1.8V 1Gb tuple 还可接受 datasheet 明确的第六 cycle `7F`。不按 `C8` 前缀归属厂商，也不把相邻、截断或额外非零尾部归为 ESMT。

| PN | Read ID | Density / voltage / width | Die / plane | ECC |
| --- | --- | --- | --- | --- |
| [`F59L1G81LB`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L1G81LB%282M%29.pdf) | `C8 D1 80 95 42` | 1Gb / 3.3V / x8 | 1 / 1 | 1bit/528B |
| [`F59L1G81MB`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L1G81MB%282M%29.pdf) | `C8 D1 80 95 40` | 1Gb / 3.3V / x8 | 1 / 1 | 4bit/528B |
| [`F59D1G81LB`](https://esmt.com.tw/upload/pdf/ESMT/datasheets/F59D1G81LB%26F59D1G161LB%282M%29.pdf) | `C8 61 80 15 42` | 1Gb / 1.8V / x8 | 1 / 1 | 1bit/512B |
| [`F59D1G161LB`](https://esmt.com.tw/upload/pdf/ESMT/datasheets/F59D1G81LB%26F59D1G161LB%282M%29.pdf) | `C8 71 80 55 42` | 1Gb / 1.8V / x16 | 1 / 1 | 1bit/256Word |
| [`F59D1G81MB`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D1G81MB%26F59D1G161MB%282M%29_operation%20temperature%20condition%20-40~85%E2%84%83.pdf) | `C8 61 80 15 40` | 1Gb / 1.8V / x8 | 1 / 1 | 4bit/512B |
| [`F59D1G161MB`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D1G81MB%26F59D1G161MB%282M%29_operation%20temperature%20condition%20-40~85%E2%84%83.pdf) | `C8 71 80 55 40` | 1Gb / 1.8V / x16 | 1 / 1 | 4bit/256Word |
| [`F59L2G81KA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L2G81KA%282N%29.pdf) | `C8 6A 90 04 34` | 2Gb / 3.3V / x8 | 1 / 2 | 8bit/512B |
| [`F59D2G81KA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D2G81KA%282N%29.pdf) | `C8 5A 90 04 34` | 2Gb / 1.8V / x8 | 1 / 2 | 8bit/512B |
| [`F59L4G81KA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L4G81KA%282R%29_operation%20temperature%20condition%20-40~85%E2%84%83.pdf) | `C8 DC 80 19 30` | 4Gb / 3.3V / x8 | 1 / 1 | 8bit/512B |
| [`F59L4G161KA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L4G161KA%282R%29.pdf) | `C8 AC 80 E6 57` | 4Gb / 3.3V / x16 | 1 / 1 | 8bit/256Word |
| [`F59L8G81KSA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L8G81KSA%282R%29.pdf) | `C8 D3 81 19 30` | 8Gb / 3.3V / x8 | 2 / 1 | 8bit/512B |
| [`F59D8G81KSA`](https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59D8G81KSA%282R%29_operation%20temperature%20condition%20-40~85%E2%84%83.pdf) | `C8 A3 81 19 30` | 8Gb / 1.8V / x8 | 2 / 1 | 8bit/512B |

共享 geometry 按 datasheet organization 输出：1Gb 为 2KiB page、128KiB block、64B spare；2Gb 为 2KiB / 128KiB / 128B；4Gb 与 8Gb 为 4KiB / 256KiB / 256B。x16 文档中的 Word 数按字节等价值写入 canonical geometry，ECC 分母仍保留原始 `Word` 单位。

## 测试样例

- `F59L2G81XA-25TG2B`
- `F59D4G81XB-45BCG2X`
- `F59L8G81KSA-25BG2R`
- `F59D8G81KSA`
- `F59D1G161MB-45BIG2M`
- `F59D1G81MB-45BUIG2M`
- `F59L4G161KA-25BCAG2R`
