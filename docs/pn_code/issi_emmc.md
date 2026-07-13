# ISSI eMMC PN 规则

采集日期：2026-07-11

## 外部资料

- ISSI eMMC Product Guide 给出 4GB~128GB、100/153-ball、Industrial/Automotive 的正式 PN 表：<https://www.issi.com/WW/pdf/emmc.pdf>
- ISSI MLC/pSLC ordering information：<https://www.issi.com/WW/pdf/21-22EF04GP-08GP.pdf>、<https://www.issi.com/WW/pdf/21-22EF08G-16G.pdf>
- ISSI TLC ordering information：<https://www.issi.com/WW/pdf/21-22TF16G-32G-64G-128G.pdf>
- ISSI legacy eMMC 5.0 ordering information：<https://www.issi.com/WW/pdf/IS21_22ES04G.pdf>

## PN 结构

```text
IS + product family(21/22) + technology(E/T) + interface(S/F)
   + density(04G..128G) + optional P/A + -option(J/B)
   + package(Q/C) + L + temperature(I/A1/A2)
```

- `21` 为 Managed NAND；`22` 为 Automotive Managed NAND。
- `E` 为 MLC，`T` 为 TLC；density 尾随 `P` 表示预配置 pSLC。
- `S` 为 eMMC 5.0，`F` 为 eMMC 5.1。
- `Q` 为 FBGA-100，`C` 为 FBGA-153；没有原厂尺寸依据时不补猜厚度。
- `I` 为 -40°C~85°C，`A1` 为 Automotive -40°C~85°C，`A2` 为 Automotive -40°C~105°C。
- density 后的 `A` 为 Gen2；option、package、temperature 原始 code 不进入公开字段。

规则文件：`packages/core/src/decodepack/rules/packs/issi-emmc-token.json`。
