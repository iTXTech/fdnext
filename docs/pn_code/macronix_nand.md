# Macronix 并行 NAND Flash ID

采集日期：2026-07-12

## 范围与来源

本页只记录 Macronix `MX30LF` / `MX60LF` 并行 SLC NAND，不包含 SPI NAND。

- MX30LF1G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8458/MX30LF1G18AC%2C%203V%2C%201Gb%2C%20v1.2.pdf>
- MX30LF2G18AC / MX30LF4G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8461/MX30LF2G18AC%2C%203V%2C%202Gb%2C%20v1.4.pdf>
- MX60LF8G18AC datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8473/MX60LF8G18AC%2C%203V%2C%208Gb%2C%20v1.1.pdf>
- MX30LF1G28AD / MX30LF2G28AD / MX30LF4G28AD datasheet：<https://www.macronix.com/Lists/Datasheet/Attachments/8864/MX30LF4G28AD%2C%203V%2C%204Gb%2C%20v1.3.pdf>
- MX60LF8G18AC 到 MX60LF8G28AD 官方迁移说明：<https://www.macronix.com/Lists/ApplicationNote/Attachments/2071/AN0739V1-MGRT-MX60LF8G18AC%20to%20MX60LF8G28AD.pdf>

## 规则入口

- `packages/core/src/decodepack/identifier/packs/macronix.json`
  - `identifier.nand_flash_id.macronix.mx30lf_mx60lf.18ac.v1`
  - `identifier.nand_flash_id.macronix.mx30lf_mx60lf.28ad.v1`

规则只命中下表由官方资料确认的完整 byte profile；其他 `C2` ID 保持原有厂商识别，不借用 geometry。

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

这些型号均为 2.7V~3.6V、x8、SLC。18AC 与 28AD 的 extended ID byte 定义不同，尤其 28AD 的 1/2Gbit 与 4/8Gbit geometry 不同，因此测试逐条覆盖，不用一个统一 geometry 回填。

来源、URL 与外部确认状态只维护在本文档和 `evidence/decodepack-references.json`，不进入运行时 DecodePack。
