# ISSI UFS PN 规则

采集日期：2026-07-11

## 外部资料

- ISSI UFS 2.1 数据手册与订购信息：<https://www.issi.com/WW/pdf/27TH064G21-128G21-256G21.pdf>
- ISSI UFS 3.1 数据手册与订购信息：<https://www.issi.com/WW/pdf/27TH064G31-128G31-256G31.pdf>

## PN 结构

```text
IS27TH + density(064G/128G/256G) + interface(21/31)
       + -J + C + L + temperature(I/A1/A2)
```

- `TH` 是 TLC UFS 系列；`21/31` 分别输出 UFS 2.1 / UFS 3.1。
- `C` 为 FBGA-153，`L` 为 RoHS 合规。
- `I/A1/A2` 温区共用 [ISSI eMMC 编码段表](issi_emmc.md#pn-结构)。

规则文件：`packages/core/src/decodepack/rules/packs/issi-ufs-token.json`。
