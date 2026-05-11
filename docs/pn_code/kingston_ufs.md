# Kingston UFS PN 编码

采集日期：2026-05-08

## 外部资料

- Kingston UFS 官方表列出 `UFS64G-CY14`、`UFS128-CY14`、`UFS256-CY14`，说明 UFS 3.1、G4 4P TLC、153B package 和 -25°C~+85°C 温区。
  <https://www.kingston.com/en/embedded/ufs-embedded-flash>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/kingston-ufs-token.json`
- `vendor.kingston.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `UFS` + density + `-` + config | Kingston UFS |
| density `64G/128/256` | 64GB/128GB/256GB，落库为 Mbit |
| config `CY14` | UFS 3.1, G4 4P TLC |

## 输出字段

- `storage_density`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `package_code`
- `operation_temperature`

## 测试样例

- `UFS128-CY14`
