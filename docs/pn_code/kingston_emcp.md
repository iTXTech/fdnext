# Kingston eMCP PN 编码

采集日期：2026-05-08

## 外部资料

- Kingston eMCP 官方表列出 LPDDR3 eMCP：`08EM08-N3GMV36`、`16EM16-N3GMW8E`。
  <https://www.kingston.com/en/embedded/emcp-embedded-flash>
- Kingston eMCP 官方表列出 LPDDR4x eMCP：`32EM16-M4JTQ0A`、`32EM32-M4KTQ0A`、`64EM32-M4GTY9B`、`128EM32-M4GTY9B`、`128EM64-M4HTY9B`。
  <https://www.kingston.com/en/embedded/emcp-embedded-flash>
- Kingston eMCP flyer 交叉确认 `64EM32-M4GTY9B` 为 `11.5x13.0x1.0` / FBGA254，`128EM64-M4HTY9B` 为 `11.5x13.0x1.1` / FBGA254。
  <https://media.kingston.com/pdfs/emmc/eMCP_en.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kingston-emcp-token.json`
- `vendor.kingston.emcp.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| storage + `EM` + DRAM + `-` + DRAM type + config | Kingston eMCP |
| storage `08/16/32/64/128` | 8GB~128GB eMMC，落库为 Mbit |
| DRAM `08/16/32/64` | 8Gb~64Gb DRAM |
| DRAM type `N3` | LPDDR3 |
| DRAM type `M4` | LPDDR4X |

## Reference check

- eMCP 的 top-level `package` 不能只输出 FBGA ball count；同为 M4/FBGA254 时，`HTY9B` 是 `x1.1`，其他公开 M4 config 为 `x1.0`。
- 规则使用 `configCode` 二级 package 表解析厚度，不按完整 PN 白名单匹配。

## 输出字段

- `storage_density`
- `storage_interface`
- `dram_density`
- `dram_type`
- `product_family`
- `package_code`
- `operation_temperature`

## 测试样例

- `64EM32-M4GTY9B`
