# ISSI eMMC PN 规则

采集日期：2026-07-11

## 外部资料

- ISSI eMMC 产品指南给出 4GB~128GB、100/153 球、工业级/车规的正式 PN 表：<https://www.issi.com/WW/pdf/emmc.pdf>
- ISSI MLC/pSLC 订购信息：<https://www.issi.com/WW/pdf/21-22EF04GP-08GP.pdf>、<https://www.issi.com/WW/pdf/21-22EF08G-16G.pdf>
- ISSI TLC 订购信息：<https://www.issi.com/WW/pdf/21-22TF16G-32G-64G-128G.pdf>
- ISSI 旧版 eMMC 5.0 订购信息：<https://www.issi.com/WW/pdf/IS21_22ES04G.pdf>

## PN 结构

```text
IS + product family(21/22) + technology(E/T) + interface(S/F)
   + density(04G..128G) + optional P/A + -option(J/B)
   + package(Q/C) + L + temperature(I/A1/A2)
```

- `21` 为受管理 NAND；`22` 为车规受管理 NAND。
- `E` 为 MLC，`T` 为 TLC；容量尾随 `P` 表示预配置 pSLC。
- `S` 为 eMMC 5.0，`F` 为 eMMC 5.1。
- `Q` 为 FBGA-100，`C` 为 FBGA-153；没有原厂尺寸依据时不补猜厚度。
- `I` 为 -40°C~85°C，`A1` 为车规 -40°C~85°C，`A2` 为车规 -40°C~105°C。
- 容量后的 `A` 为 Gen2；选项、封装、温度原始编码不进入公开字段。

规则文件：`packages/core/src/decodepack/rules/packs/issi-emmc-token.json`。
