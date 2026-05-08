# KIOXIA E2NAND PN 编码

采集日期：2026-05-08

## 外部资料

- Toshiba SmartNAND 官方新闻说明 24nm SmartNAND 将 NAND flash 与支持 ECC 的 control chip 集成在 NAND package 中，并列出 `THGVR1G7D2GLA09` 等 LGA52 产品线。
  <https://www.global.toshiba/ww/news/corporate/2011/04/pr0601.html>
- 本地 `fdb` / `fdfdb` 多源记录 `THGVX1G7D2GLA08`、`TCGVX1G7D2GLA08`、`THGBX2G7D2JLA01` 等 E2NAND 条目。

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/kioxia-e2nand-token.json`
- `vendor.kioxia.e2nand.lga.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `TC/TH` + `GV/GB` + interface + voltage + density + cell + width + process + package | E2NAND |
| prefix `TC` / `TH` | single-chip / multi-chip 族 |
| family `GV` / `GB` | E2NAND LGA family |
| density `G7/G8/G9` | 128Gb / 256Gb / 512Gb |
| process `G/J/K/L` | 24nm / 19nm / A19nm / 15nm |
| package suffix `LA` / exact `LA01` | 顶层 `package` 输出 `LGA` / `LGA60`，精确后缀优先 |

## 输出字段

- `managed_family`
- `controller`
- `generation_info`
- `ecc_enabled`
- `page_size`
- `block_size`
- `plane`
- `multi_chip`
- `lead_free`
- `halogen_free`

## 测试样例

- `THGVX1G7D2GLA08`
- `TCGVX1G7D2GLA08`
- `THGBX2G7D2JLA01`

## 注意

`THGV*`、`TCGV*`、`THGBX*` 这类 LGA PN 属于 E2NAND，内部带 ECC 控制器，不按普通 raw NAND 输出。
