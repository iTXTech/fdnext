# Kingston UFS PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Kingston UFS 官方表列出 `UFS64G-CY14`、`UFS128-CY14`、`UFS256-CY14`，说明 UFS 3.1、G4 4P TLC、153B package 和 -25°C~+85°C 温区。
  <https://www.kingston.com/en/embedded/ufs-embedded-flash>
- Kingston Design-in UFS 官方 flyer 还列出 `UFS32G-TXA7` 和 `UFS64G-TXA7`，确认 UFS 2.1、G4 2L、153B 及 11.5x13x0.85 封装。
  <https://media.kingston.com/pdfs/emmc/MKF_959-Design-in-UFS_en.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kingston-ufs-token.json`
- `vendor.kingston.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `UFS` + density + `-` + config | Kingston UFS |
| density `32G/64G/128/256` | 32GB~256GB，落库为 Mbit |
| config `CY14` | UFS 3.1, G4 4P TLC |
| config `TXA7` | UFS 2.1, G4 2L；官方未公开 NAND cell level，不推测输出 |
| package | `TXA7` 与 `CY14` 官方表均确认 153B；公开输出统一为 `BGA-153, DIM`，不区分未公开的 VF/WF/LF subtype |

## 输出字段

- `density`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `operation_temperature`

`package_code` 等 ordering token 只用于内部解析，不进入公开字段。

## 测试样例

- `UFS128-CY14`
- `UFS32G-TXA7`
