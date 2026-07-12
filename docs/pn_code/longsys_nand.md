# Longsys / FORESEE SPI NAND PN 编码

采集日期：2026-07-12

## 外部资料

- Longsys FORESEE SPI NAND 官方产品页：列出 512Mbit、1Gbit、2Gbit、4Gbit 的 F35 系列，确认 SLC、SPI、电压、WSON-8 尺寸、温区和当前 PN。  
  <https://www.longsys.com/products/embedded-storage/micro-storage/spi-nand-flash.html>
- FORESEE `F35SQA002G` 官方 datasheet，Figure 1 给出 F35 marketing part numbering chart，并确认 `F35SQA002G-WWT` / `-WAT`、2Gbit、2.7V~3.6V、x1/x2/x4、WSON-8 8x6、温区和 packing。  
  <https://www.longsys.com/uploads/LM-00006FORESEEF35SQA002GDatasheet_1650183701.pdf>
- FORESEE `F35UQA001G` 官方 datasheet，补充 1.7V~1.95V 的 `U` token，以及 `T=Tray`、`R=Tape & Reel`。  
  <https://www.longsys.com/uploads/LM-00001FORESEEF35UQA001GDatasheet_1650183657.pdf>
- FORESEE `FS35ND01G-S1Y2QWFI000` 官方 datasheet，给出新版 FS35 marketing PN chart：density、interface、package、green material、temperature、tracking/reserved token。  
  <https://www.longsys.com/uploads/M-00137FORESEE_SPINAND_FS35ND01G-S1Y2_Datasheet_1650183637.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/longsys-spi-nand-token.json`
- `vendor.longsys.foresee.spi-nand.f35.v1`
- `vendor.longsys.foresee.spi-nand.fs35.v1`

两套 ordering 的 token 位置不同，分别解析；不会用完整 PN 查表，也不会让 `F35` 的 version token 错位解释到 `FS35ND`。

## F35 ordering

结构：

```text
F 35 [voltage] Q [version] [density] - [package] [temperature/grade] [packing]
```

| Token | 含义 |
| --- | --- |
| `F` | FORESEE |
| `35` | Serial SLC NAND |
| voltage `S` | Vcc 2.7V~3.6V |
| voltage `U` | Vcc 1.7V~1.95V |
| interface `Q` | SPI x1/x2/x4 |
| version `A/B` | 内部 version token，不公开 |
| density `512M/001G/002G/004G` | 512Mbit / 1Gbit / 2Gbit / 4Gbit |
| package `W` | WSON-8, 8x6 |
| package `V` | WSON-8, 6x5 |
| temperature `W` | -40°C~+85°C |
| temperature `A` | -40°C~+105°C |
| grade `3/2` | AEC-Q100 Grade 3 / Grade 2；只输出资料明确的等级，Grade 2 同时可确认 -40°C~+105°C |
| packing `T/R` | Tray / Tape and Reel |

package 只由 PN 中的 `W/V` token 输出；缺 package token 的短 base PN 不命中本规则，也不会从同族 datasheet 反推封装。

## FS35 ordering

结构：

```text
FS 35 ND [density] - [product version:2] [flash type:2] [interface] [package] F [temperature] [tracking] [reserved:2]
```

| Token | 含义 |
| --- | --- |
| `FS` | FORESEE |
| `35` | SPI NAND series, 2.7V~3.6V |
| `ND` | SLC NAND |
| density `01G/02G/04G` | 1Gbit / 2Gbit / 4Gbit |
| interface `S/D/Q` | x1 / x1+x2 / x1+x2+x4 |
| package `L` | LGA-8；资料未给尺寸，因此不猜尺寸 |
| package `W` | WSON-8, 8x6 |
| material `F` | Green package material，公开为 lead-free |
| temperature `I/C` | Industrial -40°C~+85°C / Commercial 0°C~+70°C |

product version、flash type、tracking 和 reserved token 只用于结构对齐，不进入 public fields。

## 示例

| PN | 关键输出 |
| --- | --- |
| `F35SQA512M-VWT` | Longsys / FORESEE, SPI SLC NAND, 512Mbit, 2.7V~3.6V, WSON-8 6x5, industrial, tray |
| `F35UQA001G-WWR` | SPI SLC NAND, 1Gbit, 1.7V~1.95V, WSON-8 8x6, tape and reel |
| `F35UQB004G-W2R` | SPI SLC NAND, 4Gbit, AEC-Q100 Grade 2, WSON-8 8x6 |
| `FS35ND01G-S1Y2QWFI000` | SPI SLC NAND, 1Gbit, x1/x2/x4, WSON-8 8x6, industrial |

