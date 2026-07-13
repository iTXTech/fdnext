# Macronix 并行 NAND Flash ID

采集日期：2026-07-13

## 范围与来源

本页只记录 Macronix `MX30` / `MX60` 并行 SLC NAND，不包含 `MX35` SPI NAND。

- MX30LF1G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8458/MX30LF1G18AC%2C%203V%2C%201Gb%2C%20v1.2.pdf>
- MX30LF2G18AC / MX30LF4G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8461/MX30LF2G18AC%2C%203V%2C%202Gb%2C%20v1.4.pdf>
- MX60LF8G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8473/MX60LF8G18AC%2C%203V%2C%208Gb%2C%20v1.1.pdf>
- MX30LF1G28AD / MX30LF2G28AD / MX30LF4G28AD datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8864/MX30LF4G28AD%2C%203V%2C%204Gb%2C%20v1.3.pdf>
- MX60LF8G18AC 到 MX60LF8G28AD 官方迁移说明：<https://www.macronix.com/Lists/ApplicationNote/Attachments/2071/AN0739V1-MGRT-MX60LF8G18AC%20to%20MX60LF8G28AD.pdf>
- MX30UF1G28AD / MX30UF2G28AD / MX30UF4G28AD datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8859/MX30UF1G28AD%2C%201.8V%2C%201Gb%2C%20v1.2.pdf>
- MX60UF8G28AD datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8862/MX60UF8G28AD%2C%201.8V%2C%208Gb%2C%20v1.2.pdf>
- MX30UF1G16/18AC、MX30UF2G16/18AC、MX30UF4G16/18AC 与 MX60UF8G18AC datasheet：
  <https://www.macronix.com/Lists/Datasheet/Attachments/8457/MX30UF1G18AC%2C%201.8V%2C%201Gb%2C%20v1.2.pdf>
  <https://www.macronix.com/Lists/Datasheet/Attachments/8479/MX30UF2G18AC%2C%201.8V%2C%202Gb%2C%20v1.4.pdf>
  <https://www.macronix.com/Lists/Datasheet/Attachments/8475/MX30UF4G18AC%2C%201.8V%2C%204Gb%2C%20v1.0.pdf>
  <https://www.macronix.com/Lists/Datasheet/Attachments/8477/MX60UF8G18AC%2C%201.8V%2C%208Gb%2C%20v1.0.pdf>
- MX30UF4G28AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8476/MX30UF4G28AC%2C%201.8V%2C%204Gb%2C%20v1.0.pdf>
- MX30UF4G16/18AB datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8453/MX30UF4G18AB%2C%201.8V%2C%204Gb%2C%20v1.2.pdf>
- MX30LF1/2/4GE8AB datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8449/MX30LF1GE8AB%2C%203V%2C%201Gb%2C%20v1.3.pdf>
- MX30LF1208AA / MX30LF1G08AA 官方 migration / comparison notes：
  <https://www.macronix.com/Lists/ApplicationNote/Attachments/1943/AN163V3-Comparing_TC58NVM9S3E_with_MX30LF1208AA.pdf>
  <https://www.macronix.com/Lists/ApplicationNote/Attachments/2055/AN-0351V2-MGRT_MX30LF1G08AA_to_MX30LF1G18AC_REV2.pdf>
- MX30LF1G28AC datasheet：<https://www.mxic.com.tw/Lists/Datasheet/Attachments/8463/MX30LF1G28AC%2C%203V%2C%201Gb%2C%20v1.1.pdf>
- MX30LF2G28AB / MX30LF4G28AB 官方 migration note：<https://www.macronix.com/Lists/ApplicationNote/Attachments/1923/AN-0306V3-MGRT_MX30LF2G%284G%2928AB_to_MX30LF2G%284G%2918AC.pdf>
- MX60LF8G28AB datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8464/MX60LF8G28AB%2C%203V%2C%208Gb%2C%20v1.1.pdf>
- MX30UF2G26/28AB / MX30UF4G26/28AB Macronix PM2031 datasheet 镜像：<https://media.digikey.com/pdf/Data%20Sheets/Macronix/MX30UFxG26%2828%29AB.pdf>
- MX30UF2GE8AB / MX30UF4GE8AB datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8454/MX30UF2GE8AB%2C%201.8V%2C%202Gb%2C%20v1.1.pdf>
- Macronix 官方 NAND product naming guide：<https://www.macronix.com/en-us/products/Documents/Macronix%2520NOR%2520and%2520NAND%2520Flash%2520Cross%2520Reference%2520Guide.pdf>
- Macronix 官方 parallel SLC NAND 产品清单：<https://www.macronix.com/en-us/products/NAND-Flash/SLC-NAND-Flash/Pages/default.aspx>

## 规则入口

- `packages/core/src/decodepack/identifier/packs/macronix.json`
  - `identifier.nand_flash_id.macronix.mx30lf_mx60lf.18ac.v1`
  - `identifier.nand_flash_id.macronix.mx30lf_mx60lf.28ad.v1`
  - `identifier.nand_flash_id.macronix.mx30uf_mx60uf.28ad.v1`
  - `identifier.nand_flash_id.macronix.mx30uf_mx60uf.16_18ac_ab.v1`
  - `identifier.nand_flash_id.macronix.mx30uf4g28ac.v1`
  - `identifier.nand_flash_id.macronix.mx30lf.ge8ab.v1`
  - `identifier.nand_flash_id.macronix.mx30lf.08aa.v1`
  - `identifier.nand_flash_id.macronix.mx30lf_mx60lf.28ab_ac.v1`
  - `identifier.nand_flash_id.macronix.mx30uf.28ab.v1`
  - `identifier.nand_flash_id.macronix.mx30uf.ge8ab.v1`
- `packages/core/src/decodepack/rules/packs/macronix-nand-token.json`
  - `vendor.macronix.raw.mx30_mx60.v1`

规则只命中下表由官方资料确认的完整 byte profile；其他 `C2` ID 保持原有厂商识别，不借用 geometry。

PN decoder 按官方 ordering grammar 拆分 `30/60` type、`L/U` voltage、density、ECC、bus width、mode、generation 与可选 package / temperature suffix。base PN 不含 package token 时不输出封装；generation tech code 与 reserve token 只用于结构识别，不公开 code 字段，也不写完整 PN 白名单。

## 已确认 Read ID

| Read ID | 产品 | 容量 / die / plane | page / block / spare | ECC |
| --- | --- | --- | --- | --- |
| `C2 F1 80 95 02` | MX30LF1G18AC | 1Gbit / 1 / 1 | 2KB / 128KB / 64B | 4bit/528B |
| `C2 DA 90 95 06` | MX30LF2G18AC | 2Gbit / 1 / 2 | 2KB / 128KB / 64B | 4bit/528B |
| `C2 DC 90 95 56` | MX30LF4G18AC | 4Gbit / 1 / 2 | 2KB / 128KB / 64B | 4bit/528B |
| `C2 D3 D1 95 5A` | MX60LF8G18AC | 8Gbit / 2 / 4 | 2KB / 128KB / 64B | 4bit/528B |
| `C2 F1 80 91 03 03` | MX30LF1G28AD | 1Gbit / 1 / 1 | 2KB / 128KB / 128B | 8bit/544B |
| `C2 DA 90 91 07 03` | MX30LF2G28AD | 2Gbit / 1 / 2 | 2KB / 128KB / 128B | 8bit/544B |
| `C2 DC 90 A2 57 03` | MX30LF4G28AD | 4Gbit / 1 / 2 | 4KB / 256KB / 256B | 8bit/544B |
| `C2 D3 D1 A2 5B 03` | MX60LF8G28AD | 8Gbit / 2 / 4 | 4KB / 256KB / 256B | 8bit/544B |
| `C2 F0 80 1D` | MX30LF1208AA | 512Mbit / 1 / 未编码 | 2KB / 128KB / 64B | 1bit/528B |
| `C2 F1 80 1D` | MX30LF1G08AA | 1Gbit / 1 / 未编码 | 2KB / 128KB / 64B | 1bit/528B |
| `C2 F1 80 95 03` | MX30LF1G28AC | 1Gbit / 1 / 1 | 2KB / 128KB / 112B | 8bit/540B |
| `C2 DA 90 95 07` | MX30LF2G28AB / 28AC | 2Gbit / 1 / 2 | 2KB / 128KB / 112B | 8bit/540B |
| `C2 DC 90 95 57` | MX30LF4G28AB / 28AC | 4Gbit / 1 / 2 | 2KB / 128KB / 112B | 8bit/540B |
| `C2 D3 D1 95 5B` | MX60LF8G28AB / 28AC | 8Gbit / 2 / 4 | 2KB / 128KB / 112B | 8bit/540B |

这些型号均为 2.7V~3.6V、x8、SLC。18AC 与 28AD 的 extended ID byte 定义不同，尤其 28AD 的 1/2Gbit 与 4/8Gbit geometry 不同，因此测试逐条覆盖，不用一个统一 geometry 回填。

## 1.8V UF 与 internal-ECC profile

| Read ID | 产品 | 容量 / 位宽 | page / block / spare | ECC |
| --- | --- | --- | --- | --- |
| `C2 A1 80 11 03 03` | MX30UF1G28AD | 1Gbit / x8 | 2KB / 128KB / 128B | 8bit/544B |
| `C2 AA 90 11 07 03` | MX30UF2G28AD | 2Gbit / x8 | 2KB / 128KB / 128B | 8bit/544B |
| `C2 AC 90 22 57 03` | MX30UF4G28AD | 4Gbit / x8 | 4KB / 256KB / 256B | 8bit/544B |
| `C2 A3 D1 22 5B 03` | MX60UF8G28AD | 8Gbit / x8 | 4KB / 256KB / 256B | 8bit/544B |
| `C2 A1/B1 80 15/55 02` | MX30UF1G18/16AC | 1Gbit / x8/x16 | 2KB / 128KB / 64B | 4bit/512B |
| `C2 AA/BA 90 15/55 06` | MX30UF2G18/16AC | 2Gbit / x8/x16 | 2KB / 128KB / 64B | 4bit/512B |
| `C2 AC/BC 90 15/55 56` | MX30UF4G18/16AC、同 ID 的 16/18AB | 4Gbit / x8/x16 | 2KB / 128KB / 64B | 4bit/512B |
| `C2 A3 D1 15 5A` | MX60UF8G18AC | 8Gbit / x8 | 2KB / 128KB / 64B | 4bit/512B |
| `C2 AC 90 11 57` | MX30UF4G28AC | 4Gbit / x8 | 2KB / 128KB / 128B | 8bit/512B |
| `C2 AA/BA 90 15/55 07` | MX30UF2G28/26AB | 2Gbit / x8/x16 | 2KB / 128KB / 112B | 8bit/540B |
| `C2 AC/BC 90 15/55 57` | MX30UF4G28/26AB | 4Gbit / x8/x16 | 2KB / 128KB / 112B | 8bit/540B |
| `C2 AA 90 15 86` | MX30UF2GE8AB | 2Gbit / x8 | 2KB / 128KB / 64B | Internal 4bit ECC/524B |
| `C2 AC 90 15 D6` | MX30UF4GE8AB | 4Gbit / x8 | 2KB / 128KB / 64B | Internal 4bit ECC/524B |

`MX30LF1/2/4GE8AB` 的 `C2 F1 80 95 82`、`C2 DA 90 95 86`、`C2 DC 90 95 D6` 均为 3V x8 SLC、2KB page、128KB block、64B spare，并由 ID 与 datasheet 确认 internal 4-bit ECC。

## Parallel SLC 系列审计边界

- 已覆盖：官方产品清单中的 LF 08AA、18AC、28AB/28AC/28AD、LF GE8AB、UF 28AB/28AD、UF 16/18AC、UF 4G28AC、UF GE8AB，以及官方公开且 ID 相同的 UF 4G16/18AB。
- 4-byte `08AA` ID 不含 plane byte，因此不根据同族器件猜测 `plane_count`。
- secure `LFxxS` 等未取得 exact Read ID + geometry 的型号继续保持 vendor-only fallback；PN decoder 仅按其公开 token 输出可确定字段，不反推 Flash ID geometry。
- 本文档和 identifier pack 不包含任何 MX25、MX35 或其他 SPI NAND family。

来源、URL 与外部确认状态只维护在本文档和 `evidence/decodepack-references.json`，不进入运行时 DecodePack。
