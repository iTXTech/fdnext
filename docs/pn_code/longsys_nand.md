# Longsys / FORESEE SPI NAND PN 编码

采集日期：2026-07-12

## 外部资料

- Longsys FORESEE SPI NAND 官方产品页：列出 512Mbit、1Gbit、2Gbit、4Gbit 的 F35 系列，确认 SLC、SPI、电压、WSON-8 尺寸、温区和当前 PN。
  <https://www.longsys.com/products/embedded-storage/micro-storage/spi-nand-flash.html>
- FORESEE `F35SQA002G` 官方数据手册，图 1 给出 F35 销售料号编码图表，并确认 `F35SQA002G-WWT` / `-WAT`、2Gbit、2.7V~3.6V、x1/x2/x4、WSON-8 8x6、温区和包装。
  <https://www.longsys.com/uploads/LM-00006FORESEEF35SQA002GDatasheet_1650183701.pdf>
- FORESEE `F35UQA001G` 官方数据手册，补充 1.7V~1.95V 的 `U` 编码段，以及 `T=Tray`、`R=Tape & Reel`。
  <https://www.longsys.com/uploads/LM-00001FORESEEF35UQA001GDatasheet_1650183657.pdf>
- FORESEE `FS35ND01G-S1Y2QWFI000` 官方数据手册，给出新版 FS35 销售 PN 图表：容量、接口、封装、环保材料、温度、追溯/保留编码段。
  <https://www.longsys.com/uploads/M-00137FORESEE_SPINAND_FS35ND01G-S1Y2_Datasheet_1650183637.pdf>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/longsys-spi-nand-token.json`
- `vendor.longsys.foresee.spi-nand.f35.v1`
- `vendor.longsys.foresee.spi-nand.fs35.v1`

两套订购编码的编码段位置不同，分别解析；不会用完整 PN 查表，也不会让 `F35` 的版本编码段错位解释到 `FS35ND`。

## F35 订购编码

结构：

```text
F 35 [voltage] Q [version] [density] - [package] [temperature/grade] [packing]
```

| 编码段 | 含义 |
| --- | --- |
| `F` | FORESEE |
| `35` | 串行 SLC NAND |
| 电压 `S` | Vcc 2.7V~3.6V |
| 电压 `U` | Vcc 1.7V~1.95V |
| 接口 `Q` | SPI x1/x2/x4 |
| 版本 `A/B` | 内部版本编码段，不公开 |
| 容量 `512M/001G/002G/004G` | 512Mbit / 1Gbit / 2Gbit / 4Gbit |
| 封装 `W` | WSON-8, 8x6 |
| 封装 `V` | WSON-8, 6x5 |
| 温度 `W` | -40°C~+85°C |
| 温度 `A` | -40°C~+105°C |
| 等级 `3/2` | AEC-Q100 等级 3 / 等级 2；只输出资料明确的等级，等级 2 同时可确认 -40°C~+105°C |
| 包装 `T/R` | 托盘 / 卷带 |

封装只由 PN 中的 `W/V` 编码段输出；缺封装编码段的短基础 PN 不命中本规则，也不会从同族数据手册反推封装。

## FS35 订购编码

结构：

```text
FS 35 ND [density] - [product version:2] [flash type:2] [interface] [package] F [temperature] [tracking] [reserved:2]
```

| 编码段 | 含义 |
| --- | --- |
| `FS` | FORESEE |
| `35` | SPI NAND 系列, 2.7V~3.6V |
| `ND` | SLC NAND |
| 容量 `01G/02G/04G` | 1Gbit / 2Gbit / 4Gbit |
| 接口 `S/D/Q` | x1 / x1+x2 / x1+x2+x4 |
| 封装 `L` | LGA-8；资料未给尺寸，因此不猜尺寸 |
| 封装 `W` | WSON-8, 8x6 |
| 材料 `F` | 环保封装材料，公开为无铅 |
| 温度 `I/C` | 工业级 -40°C~+85°C / 商业级 0°C~+70°C |

产品版本、闪存类型、追溯和保留编码段只用于结构对齐，不进入公开字段。

## 示例

| PN | 关键输出 |
| --- | --- |
| `F35SQA512M-VWT` | Longsys / FORESEE, SPI SLC NAND, 512Mbit, 2.7V~3.6V, WSON-8 6x5, 工业级, 托盘 |
| `F35UQA001G-WWR` | SPI SLC NAND, 1Gbit, 1.7V~1.95V, WSON-8 8x6, 卷带 |
| `F35UQB004G-W2R` | SPI SLC NAND, 4Gbit, AEC-Q100 等级 2, WSON-8 8x6 |
| `FS35ND01G-S1Y2QWFI000` | SPI SLC NAND, 1Gbit, x1/x2/x4, WSON-8 8x6, 工业级 |
