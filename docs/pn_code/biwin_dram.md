# BIWIN DRAM PN 编码

采集日期：2026-07-12

## 外部资料

- BIWIN 官方 LPDDR4/4X 页面与规格表给出 8Gb~64Gb、4266Mbps、FBGA200 10.00x14.50 mm 及订购编码表；TGL268 页面补充 `I-X` 宽-温度变体。
  <https://www.biwintechnology.com/product/lpddr4-4x/>
  <https://www.biwintechnology.com/product/tgl268-lpddr4x/>
- BIWIN 官方 LPDDR5X 规格表给出 32Gb~128Gb、8533Mbps、x32/x64、FBGA245/315/496 及订购编码表。
  <https://www.biwintechnology.com/wp-content/uploads/2026/01/LPDDR5X-specifications.pdf>

## 结构化规则

- `BW` + 3-字符系列 + `X32` + 封装编码段 `H2A/N2A` + 容量编码段 + `X/IX`：LPDDR4X。
- `BW` + 3-字符系列 + `X32/X64` + 封装编码段 `P8A/U9A/F9B` + 容量编码段：LPDDR5X。
- LPDDR4/4X 订购编码中 `BWMZFX32H2A-16G-X` 对应 8Gb，而 `BWMZEX32H2A-16G-X` 对应 16Gb，因此容量按 `family + density` 局部编码段组合解析，不把 `16G` 单独当作容量，也不建立完整 PN 白名单。
- 封装只由 `H2A/N2A/P8A/U9A/F9B` 封装编码段输出；未知编码段不输出封装。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `BWMZFX32H2A-16G-X`
- `BWMZCX32H2A-64GI-X`
- `BWMYAX32U9A-64G`
- `BWMYAX64F9B-128G`

## PN 展示

LPDDR4X/5X 在封装与容量之间恢复 `-`；LPDDR4X 的工业级 I 仍附于容量之后，X 前另加 `-`，例如 `BWMZCX32H2A-32GI-X`。
