# KIOXIA E2NAND PN 编码

采集日期：2026-05-13

## 外部资料

- Toshiba SmartNAND 官方新闻说明 24nm SmartNAND 将 NAND flash 与支持 ECC 的 control chip 集成在 NAND package 中，并列出 `THGVR1G7D2GLA09` 等 LGA52 产品线。
  <https://www.global.toshiba/ww/news/corporate/2011/04/pr0601.html>
- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: `NAND w/ controller` 表给出 `THG/TCG` 系列中 voltage、type、controller revision、density、cell level、stacked die、design rule、package、lead-free/halogen-free 和 package size token。
- 本地 `fdb` / `fdfdb` 多源记录 `THGVX1G7D2GLA08`、`TCGVX1G7D2GLA08`、`THGBX2G7D2JLA01` 等 E2NAND 条目。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kioxia-managed-token.json`
- `vendor.kioxia.managed.thg.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG/TCG` + voltage(1) + type(1) + controller revision(1) + density(2) + cell(1) + stacked die(1) + design rule(1) + package/class/size | Toshiba/KIOXIA NAND with controller shared form |
| voltage `V/Y/A/B/D` | Vcc/VccQ 组合；例如 `THGVX...` 中的 `V` 只表示电压 |
| type `R/X` | E2NAND / SmartNAND |
| controller revision | one-character control-chip revision / generation code |
| density `M8/M9/G0..G9/GA/GB/GC/GD/GE/GF/T0/T1` | 256Mbit 到 2Tbit |
| cell `S/D/T` | SLC / MLC / TLC |
| stacked die `1..9/A/B` | 1-9 die / 12 die / 16 die |
| FG design rule `A/B/C/D/E/F/G/H/J/K/L` | 130 nm 到 15 nm/1z |
| package `FT/TG/TA/XB/XG/BA/XL/LA` | TSOP / BGA / LGA plus lead-free and halogen-free flags |
| exact package `LA01/LA08/LA09` | `LGA60` / `LGA52` 精确封装优先 |

## 输出字段

- `managed_family`
- `controller`
- `ecc_enabled`
- `controller_revision`
- `die_stack`
- `package_code`
- `lead_free`
- `halogen_free`

## 测试样例

- `THGVR1G7D2GLA09`
- `THGVX1G7D2GLA08`
- `TCGVX1G7D2GLA08`
- `THGBX2G7D2JLA01`

## 注意

`THGxR`、`THGxX`、`TCGxX` 这类 PN 属于 E2NAND / SmartNAND，内部带 ECC control chip，不按普通 raw NAND 输出，也不使用泛化 `nandcon` 类型。

E2NAND 与 eMMC 共用 `NAND w/ controller` 尾部 token 表；差异由 type code 决定：`M` 输出 eMMC，`R/X` 输出 E2NAND。不要把 `THGV*` 中的 `V` 当成 family，它只表示 voltage。
