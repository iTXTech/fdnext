# KIOXIA E2NAND PN 编码

采集日期：2026-05-13

## 外部资料

- Toshiba SmartNAND 官方新闻说明 24nm SmartNAND 将 NAND flash 与支持 ECC 的 control chip 集成在 NAND package 中，并列出 `THGVR1G7D2GLA09` 等 LGA52 产品线。
  <https://www.global.toshiba/ww/news/corporate/2011/04/pr0601.html>
- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: raw NAND 与 `NAND w/ controller` 表给出 `TC/TH` 单/多芯片、density、cell、width/page/block、design rule、package、lead-free/halogen-free 和 package size token。
- 本地 `fdb` / `fdfdb` 多源记录 `THGVX1G7D2GLA08`、`TCGVX1G7D2GLA08`、`THGBX2G7D2JLA01` 等 E2NAND 条目。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kioxia-e2nand-token.json`
- `vendor.kioxia.e2nand.lga.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC/TH` + `GV/GB` + interface + voltage + density + cell + width + process + package | E2NAND |
| prefix `TC` / `TH` | single-chip / multi-chip 族 |
| family `GV` / `GB` | E2NAND LGA family |
| density `G5/G6/G7/G8/G9/T0/T1` | 32Gb 到 2Tb |
| cell `D/E/J/C/T/U/V/X/F` | MLC / TLC / QLC class |
| width/page/block code `0..9` | x8/x16 plus page/block size |
| process `G/H/J/K/L` | 24nm A/B、19nm/1x、A19nm/1y、15nm/1z |
| package `BA/XL/LA` | BGA/LGA plus lead-free and halogen-free flags |
| package suffix `LA` / exact `LA01` | `fields.package` 输出 `LGA` / `LGA60`，精确后缀优先 |
| classification code | channel / CE count |

## 输出字段

- `managed_family`
- `controller`
- `generation_info`
- `ecc_enabled`
- `page_size`
- `block_size`
- `plane`
- `multi_chip`
- `package_code`
- `lead_free`
- `halogen_free`
- `ce_count`
- `channel_count`

## 测试样例

- `THGVX1G7D2GLA08`
- `TCGVX1G7D2GLA08`
- `THGBX2G7D2JLA01`

## 注意

`THGV*`、`TCGV*`、`THGBX*` 这类 LGA PN 属于 E2NAND / SmartNAND，内部带 ECC control chip，不按普通 raw NAND 输出，也不使用泛化 `nandcon` 类型。
