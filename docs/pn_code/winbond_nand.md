# Winbond NAND PN 编码

采集日期：2026-07-12；更新日期：2026-07-13

## 外部资料

- Winbond 官方 SLC NAND Flash Product Brief 给出当前 ONFI NAND 与 QspiNAND marketing PN 表，覆盖 `W29N`、`W25N`、`W35N` 的容量、电压、I/O 和可选封装范围。
  <https://www.winbond.com/productResource-files/Winbond%20SLC%20NAND%20Flash%20Product%20Brief_EN_2024Q3_v1.pdf>
- Winbond `W29N02GV` datasheet 的 ordering information 确认 `V/W/Z` 电压与位宽、`S/B` 封装、`I/J` 温区；正式 ordering PN 如 `W29N02GVSIAA`、`W29N02GVBJAA`。
  <https://www.mouser.com/datasheet/2/949/w29n02gvxiaa_revc-1489819.pdf>
- Winbond `W25N01GV` datasheet 的 ordering information 确认 Serial SLC NAND 结构、`SF/ZE/TB/TC` package token 和 `I/J` 温区。
  <https://www.digikey.com/en/htmldatasheets/production/1853910/0/0/1/w25n01gv.html>
- Winbond 官方 ONFI NAND 产品页确认当前 `W29N08/04/02/01` 系列。
  <https://www.winbond.com/hq/product/code-storage-flash/onfi-nand/?__locale=en>
- Winbond 官方 `W29N01HV`、`W29N02GV`、`W29N04GV`、`W29N08GV` datasheet 的 Read ID、memory organization 与 feature 表确认四组并行 NAND ID 和 geometry。
  <https://www.winbond.com/resource-files/W29N01HVxxNA_RevD.pdf>
  <https://www.winbond.com/resource-files/W29N02GVxxAA_RevD.pdf>
  <https://www.winbond.com/resource-files/W29N04GVxxAA_RevE.pdf>
  <https://www.winbond.com/resource-files/W29N08GVxxAA_RevE.pdf>
- Winbond `W29N01HZ/HW`、`W29N02KZ/KW/KV`、`W29N04GZ/GW` datasheet 补齐 1.8V x8/x16、K 系 128B spare、WLCSP/VFBGA ordering token 与完整 Read ID。
  <https://www.winbond.com/resource-files/W29N01HZWxxNA_RevG.pdf>
  <https://www.winbond.com/resource-files/W29N02KWZxxBE_RevC.pdf>
  <https://www.winbond.com/resource-files/W29N02KVxxAE_RevC.pdf>
  <https://www.winbond.com/resource-files/W29N04GWZxxBF_RevC.pdf>
- Winbond W29N04/08LW/LZ datasheet 确认 L 系 4Gb/8Gb、1.8V x8/x16、4KB page、256KB block、256B spare 与 ordering token。原厂文档由 DigiKey 镜像公开。
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/8919/W29N04_08LWZxxxG.pdf>
- Winbond W29N04KZ/KW 的 BF/BG datasheet 确认 2KB/4KB 两套 geometry 与各自 Read ID。
  <https://media.digikey.com/pdf/Data%20Sheets/Winbond%20PDFs/W29N04KW_ZxxBF_RevB_5-11-22.pdf>
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/5020/W29N04KW_ZxxBG_RevB_5-11-22.pdf>

## 规则入口

- `packages/core/src/decodepack/rules/packs/winbond-nand-token.json`
  - `vendor.winbond.raw.w29n.v1`
  - `vendor.winbond.raw.w25n.v1`
  - `vendor.winbond.raw.w35n.v1`
- `packages/core/src/decodepack/identifier/packs/winbond.json`
  - `flashid.winbond.w29n.v1`

## W29N 并行 NAND Read ID

规则以 Winbond manufacturer ID `EF` 命中，再用第 2~5 byte 的完整配置条件解释官方 datasheet 已确认的 23 组 W29N profile。未确认的 `EF` 配置仍只识别厂商，不借用这些 profile 的 geometry。

| Read ID | 产品 | 容量 / 电压 / 位宽 | page / block / spare |
| --- | --- | --- | --- |
| `EF F1 00 95 00` | W29N01HV | 1Gbit, 3V, x8 | 2KB / 128KB / 64B |
| `EF A1 00 95 00` / `EF B1 00 D5 00` | W29N01HZ / HW | 1Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 64B |
| `EF DA 90 95 04` | W29N02GV | 2Gbit, 3V, x8 | 2KB / 128KB / 64B |
| `EF AA 90 15 04` / `EF BA 90 55 04` | W29N02GZ / GW | 2Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 64B |
| `EF DC 90 95 54` | W29N04GV | 4Gbit, 3V, x8 | 2KB / 128KB / 64B |
| `EF AC 90 15 54` / `EF BC 90 55 54` | W29N04GZ / GW | 4Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 64B |
| `EF D3 91 95 58` | W29N08GV | 8Gbit, 3V, x8 | 2KB / 128KB / 64B |
| `EF A3 91 15 58` / `EF B3 91 55 58` | W29N08GZ / GW | 8Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 64B |
| `EF AA 10 15 07` / `EF BA 10 55 07` | W29N02KZ / KW | 2Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 128B |
| `EF DA 10 95 07` | W29N02KV | 2Gbit, 3V, x8 | 2KB / 128KB / 128B |
| `EF AC 10 15 56` / `EF BC 10 55 56` | W29N04KZ / KW BF | 4Gbit, 1.8V, x8 / x16 | 2KB / 128KB / 128B |
| `EF AC 00 26 63` / `EF BC 00 66 63` | W29N04KZ / KW BG | 4Gbit, 1.8V, x8 / x16 | 4KB / 256KB / 256B |
| `EF AC 00 A6 63` / `EF BC 00 E6 63` | W29N04LZ / LW | 4Gbit, 1.8V, x8 / x16 | 4KB / 256KB / 256B |
| `EF A3 01 A6 63` / `EF B3 01 E6 63` | W29N08LZ / LW | 8Gbit, 1.8V, x8 / x16 | 4KB / 256KB / 256B |

`cache` 仅在资料明确的旧 H/GV profile 输出；其他新增 profile 不从相似 ID 借用。来源、URL 与确认状态只维护在本文档和 `evidence/decodepack-references.json`，不进入运行时 DecodePack 字段。

## 结构化 token

### W29N ONFI NAND

`W29N` + density + feature/version + voltage/width + optional package + temperature + option + ECC。

| token | 含义 |
| --- | --- |
| density `01/02/04/08` | 1/2/4/8Gbit |
| feature/version `G/H/K/L` | 产品版本；只参与结构和 option 组合，不直接公开原始 code；`L` 只在 4Gb/8Gb LW/LZ family 命中 |
| `V` | 2.7V~3.6V, x8 |
| `W` | 1.7V~1.95V, x16 |
| `Z` | 1.7V~1.95V, x8 |
| package `S` | TSOP-I-48, 12x20 |
| package `D` | VFBGA-48, 6.5x8 |
| package `B` | VFBGA-63, 9x11 |
| package `Y` | WLCSP-68 |
| temperature `I/J` | -40°C~85°C / -40°C~105°C |
| option `K:A` | OTP Command Supported |
| option `L:B` / `L:C` | Legacy OTP / Legacy OTP and Block Lock |
| ECC `A/F/E/G` | 1bit / 4bit / 8bit / 8bit |

Marketing base PN 没有 package token 时不输出封装。例如 `W29N04LZ` 只输出已确定的容量、电压、位宽与 ONFI/SLC 信息；`W29N02KZDIBE` 才输出 VFBGA-48。未知 package / option / ECC token 仍命中 W29N family，但只省略对应字段；feature、package、option 与 ECC 原始 code 不进入 public fields。

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
- `W29N04LZ`
- `W29N08LWBICG`
- `W29N02KZDIBE`
- `W29N01HZYINA`
- `W25N01GV`
- `W25N01GVZEIG`
- `W35N04JW`
