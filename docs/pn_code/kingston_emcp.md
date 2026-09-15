# Kingston eMCP / ePoP PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Kingston eMCP 官方表列出 LPDDR3 eMCP：`08EM08-N3GMV36`、`16EM16-N3GMW8E`。
  <https://www.kingston.com/en/embedded/emcp-embedded-flash>
- Kingston eMCP 官方表列出 LPDDR4x eMCP：`32EM16-M4JTQ0A`、`32EM32-M4KTQ0A`、`64EM32-M4GTY9B`、`128EM32-M4GTY9B`、`128EM64-M4HTY9B`。
  <https://www.kingston.com/en/embedded/emcp-embedded-flash>
- Kingston eMCP 产品单页交叉确认 `64EM32-N3HTX29` 为 64GB eMMC + 32Gb LPDDR3、`11.5x13.0x1.1` / FBGA221；并确认 `64EM32-M4GTY9B` 为 `11.5x13.0x1.0` / FBGA254，`128EM64-M4HTY9B` 为 `11.5x13.0x1.1` / FBGA254。
  <https://media.kingston.com/pdfs/emmc/eMCP_en.pdf>
- Kingston ePoP 官方表给出 LPDDR4X 和 LPDDR5X 各两项 PN，组合 64GB eMMC + 16/32Gb DRAM，并确认 FBGA144 / FBGA201 及逐 PN 厚度。
  <https://www.kingston.com/en/embedded/epop-embedded-flash>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kingston-emcp-token.json`
- `packages/core/src/decodepack/rules/packs/kingston-epop-token.json`
- `vendor.kingston.emcp.v1`
- `vendor.kingston.epop.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| 存储 + `EM` + DRAM + `-` + DRAM 类型 + 配置 | Kingston eMCP |
| 存储 + `EP` + DRAM + `-` + DRAM 类型 + 配置 | Kingston ePoP |
| 存储 `08/16/32/64/128` | 8GB~128GB eMMC，落库为 Mbit |
| DRAM `08/16/32/64` | 8Gb~64Gb DRAM |
| DRAM 类型 `N3` | LPDDR3 |
| DRAM 类型 `M4` | LPDDR4X |

## 参考资料检查

- eMCP 的顶层 `package` 不能只输出 FBGA 球数；同为 M4/FBGA254 时，`HTY9B` 是 `x1.1`，其他公开 M4 配置为 `x1.0`。
- 规则使用 `configCode` 二级封装表解析厚度，不按完整 PN 白名单匹配。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`eMCP LPDDR3/LPDDR4X` 这类组合由 `device.productType`、`storage_interface`、`storage_density` 和 `dram_type` 分别表达，不额外输出 `product_family`。订购编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `64EM32-M4GTY9B`
- `64EM32-N3HTX29`
- `64EP32-M5BTB9M`
