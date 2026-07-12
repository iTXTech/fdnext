# Winbond NAND PN 编码

采集日期：2026-07-12

## 外部资料

- Winbond 官方 SLC NAND Flash Product Brief 给出当前 ONFI NAND 与 QspiNAND marketing PN 表，覆盖 `W29N`、`W25N`、`W35N` 的容量、电压、I/O 和可选封装范围。
  <https://www.winbond.com/productResource-files/Winbond%20SLC%20NAND%20Flash%20Product%20Brief_EN_2024Q3_v1.pdf>
- Winbond `W29N02GV` datasheet 的 ordering information 确认 `V/W/Z` 电压与位宽、`S/B` 封装、`I/J` 温区；正式 ordering PN 如 `W29N02GVSIAA`、`W29N02GVBJAA`。
  <https://www.mouser.com/datasheet/2/949/w29n02gvxiaa_revc-1489819.pdf>
- Winbond `W25N01GV` datasheet 的 ordering information 确认 Serial SLC NAND 结构、`SF/ZE/TB/TC` package token 和 `I/J` 温区。
  <https://www.digikey.com/en/htmldatasheets/production/1853910/0/0/1/w25n01gv.html>
- Winbond 官方 ONFI NAND 产品页确认当前 `W29N08/04/02/01` 系列。
  <https://www.winbond.com/hq/product/code-storage-flash/onfi-nand/?__locale=en>

## 规则入口

- `packages/core/src/decodepack/rules/packs/winbond-nand-token.json`
  - `vendor.winbond.raw.w29n.v1`
  - `vendor.winbond.raw.w25n.v1`
  - `vendor.winbond.raw.w35n.v1`

## 结构化 token

### W29N ONFI NAND

`W29N` + density + feature/version + voltage/width + optional package + temperature + option/reserved。

| token | 含义 |
| --- | --- |
| density `01/02/04/08` | 1/2/4/8Gbit |
| `V` | 2.7V~3.6V, x8 |
| `W` | 1.7V~1.95V, x16 |
| `Z` | 1.7V~1.95V, x8 |
| package `S` | TSOP-I-48 |
| package `B` | VFBGA-63 |
| temperature `I/J` | -40°C~85°C / -40°C~105°C |

Marketing base PN 没有 package token 时不输出封装。例如 `W29N02GV` 只输出已确定的容量、电压、位宽与 ONFI/SLC 信息；`W29N02GVSIAA` 才输出 TSOP-I-48。

### W25N / W35N QspiNAND

| 结构 | 含义 |
| --- | --- |
| `W25N` + density + feature + voltage | Serial SLC QspiNAND |
| density `512/01/02/04` | 512Mbit / 1/2/4Gbit |
| package `SF/ZE/TB/TC` | SOIC-16 / WSON-8 / 两种 TFBGA-24 |
| `W35N` + density + `JW` | High Performance QspiNAND，1.8V |

`W35N` 官方 product brief 只公开 marketing base PN；没有实际 package token 的输入不输出封装。

## 测试样例

- `W29N01GV`
- `W29N02GVSIAA`
- `W29N02GVBJAA`
- `W25N01GV`
- `W25N01GVZEIG`
- `W35N04JW`
