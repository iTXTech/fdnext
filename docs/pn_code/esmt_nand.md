# ESMT parallel SLC NAND PN 规则

本页只记录 ESMT `F59` parallel SLC NAND。`F50` SPI NAND 不在本轮范围，也不会由本规则命中。

## 外部资料

- ESMT 当前 Automotive Grade SLC NAND 表列出 `F59L1G81MB`、`F59L2G81KA`、`F59D2G81KA`、`F59D4G81XB`、`F59L4G81KA`、`F59L8G81KSA`、`F59D8G81KSA`，确认 1Gb/2Gb/4Gb/8Gb、SLC、x8、1.8V/3.3V、25ns/45ns 与 TSOP/BGA 封装范围。来源：<https://www.esmt.com.tw/zh-tw/Products/Automotive%20Grade/SLC%20NAND-5-51>
- `F59L2G81XA (2B)` 原厂 datasheet 确认 2Gb、SLC、x8、3.3V、ONFI 1.0、25ns；ordering table 的 `-25TG2B` / `-25BG2B` 分别为 48-pin TSOP-I / 63-ball BGA。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L2G81XA%282B%29.pdf>
- `F59L8G81KSA (2R)` 原厂 datasheet 确认 8Gb（4Gb x2 die）、SLC、x8、3.3V、25ns；ordering table 的 `-25TG2R` / `-25BG2R` 分别为 48-pin TSOP-I / 63-ball BGA。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/F59L8G81KSA%282R%29.pdf>
- 当前可信分销资料补充确认 `F59D4G81XB-45BG2X`、`F59D4G81XB-45TIAG2X`、`F59D8G81KSA-45BG2R`、`F59D1G81MB-45BCG2M` 等 ordering suffix；其中 `BC` 与 67-ball BGA 同向，`B` 与 63-ball BGA、`T` 与 TSOP-48 同向。exact PN 只用于资料和 testcase，不进入 decoder 查表。示例：<https://suntsu.com/product/integrated-circuits/memory/f59d4g81xb-45bg2x/>、<https://suntsu.com/product/integrated-circuits/memory/f59d1g81mb-45bcg2m/>

## PN 结构

```text
F59 + voltage + density + width + design + [-speed + package + option/revision]
```

- voltage `L/D`：3.3V / 1.8V。
- density `1G/2G/4G/8G`：1Gb / 2Gb / 4Gb / 8Gb。
- width `81`：x8。
- speed `25/45`：25ns / 45ns。
- package `T/B/BC`：TSOP-48 / BGA-63 / BGA-67。
- 中间 design token 与 ordering 尾部剩余 option/revision 只用于保持结构，不公开、不查完整 body，也不推断 die stack、ECC 或温区。

## 封装边界

只有 ordering PN 中实际出现 `T`、`B` 或 `BC` package token 时才公开 `package`。缺少后缀的 family PN 仍输出容量、电压、SLC、x8 与 parallel NAND，但不输出封装或速度。

## 测试样例

- `F59L2G81XA-25TG2B`
- `F59D4G81XB-45BCG2X`
- `F59L8G81KSA-25BG2R`
- `F59D8G81KSA`
