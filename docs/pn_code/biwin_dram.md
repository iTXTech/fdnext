# BIWIN DRAM PN 编码

采集日期：2026-07-12

## 外部资料

- BIWIN 官方 LPDDR4/4X 页面与规格表给出 8Gb~64Gb、4266Mbps、FBGA200 10.00x14.50 mm 及 ordering table；TGL268 页面补充 `I-X` wide-temperature 变体。
  <https://www.biwintechnology.com/product/lpddr4-4x/>
  <https://www.biwintechnology.com/product/tgl268-lpddr4x/>
- BIWIN 官方 LPDDR5X 规格表给出 32Gb~128Gb、8533Mbps、x32/x64、FBGA245/315/496 及 ordering table。
  <https://www.biwintechnology.com/wp-content/uploads/2026/01/LPDDR5X-specifications.pdf>

## 结构化规则

- `BW` + 3-character family + `X32` + package token `H2A/N2A` + density token + `X/IX`：LPDDR4X。
- `BW` + 3-character family + `X32/X64` + package token `P8A/U9A/F9B` + density token：LPDDR5X。
- LPDDR4/4X ordering 中 `BWMZFX32H2A-16G-X` 对应 8Gb，而 `BWMZEX32H2A-16G-X` 对应 16Gb，因此容量按 `family + density` 局部 token 组合解析，不把 `16G` 单独当作容量，也不建立完整 PN 白名单。
- 封装只由 `H2A/N2A/P8A/U9A/F9B` package token 输出；未知 token 不输出封装。

## 输出字段

- `dram_type`
- `dram_density`
- `dram_width`
- `dram_speed`
- `dram_voltage`
- `package`
- `operation_temperature`

## 测试样例

- `BWMZFX32H2A-16G-X`
- `BWMZCX32H2A-64GI-X`
- `BWMYAX32U9A-64G`
- `BWMYAX64F9B-128G`
