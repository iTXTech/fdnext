# SpecTek NAND MCP / Flash+Controller PN 编码

采集日期：2026-05-20

## 外部资料

- SpecTek NAND MCP Part Numbering System: 官方 2022-06-01 版，覆盖 `S U G NM112 6A 6B P I ET - 046BT` 结构、`S/FN/FT/FB` SpecTek memory prefix、NAND/LPDRAM density-width code、voltage、chip count、package code 与 dash 后 speed/grade。
  `spectek-pns-mcppop.pdf`
- SpecTek NAND MCP Part Numbering System mirror: 同向佐证 NAND MCP 表。
  <https://device.report/m/a61212fa2672663ea5db512aa13ce4685e0684cc9b2f8e80039bb1d4a293a5a8.pdf>
- SpecTek All-in-One Part Numbering System: 官方 2025-02-26 版，覆盖 `S M K J6Z4 ZZ 4 D 4T G F AK - PG` 这类 AIO / eMCP 结构、LPDRAM density-width、eMMC density、controller、voltage、chip count、package code 与 speed grade。
  `spectek-pns-aio.pdf`
- SpecTek Flash + Controller Part Numbering System: 官方 2025-02-26 版，覆盖 `S U J52A 1G C F DI - BT` 这类 e-MMC / custom card 结构、NAND density、NAND component、controller ID、package code 与 dash 后 speed grade。
  `spectek-pns-emmc.pdf`
- Micron Flash + Controller Part Numbering System: 可用于 `MTFC...` Micron eMMC/UFS，不直接作为 SpecTek `S...` PN 规则。
  <https://assets.micron.com/adobe/assets/urn:aaid:aem:c81e5b7e-6c40-4314-afc8-067c0034c12e/renditions/original/as/numemmc.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/spectek-managed-token.json`
- `vendor.spectek.aio.emcp.v1`
- `vendor.spectek.flash-controller.v1`
- `vendor.spectek.nand-mcp.v1`

当前接入 NAND MCP、官方 All-in-One eMCP / AIO，以及 Flash + Controller eMMC / UFS 方向。NAND MCP 和 Flash + Controller 规则按官方 token 表解析，不依赖完整 PN 白名单；dash 后 `BT/BU/FT/PG/UT` 等 speed grade 必须进入公开 `speed_grade` 字段。

## NAND MCP 结构

| 结构 | 含义 |
| --- | --- |
| `S` / `FN` / `FT` / `FB` | SpecTek memory |
| `M` / `U` | Marked / Unmarked |
| design family `A/B/C/G/R/U/W` | NAND + LPDRAM 组合类型；`C` 为 MCP PoP LPDRAM 路径 |
| design ID | 例如 `NM112` |
| NAND code `1..8` + `A/B/C` | NAND density + width |
| LPDRAM code `1..8` + `A/B/C` | DRAM density + width |
| voltage `B/D/E/F/H/M/P/Q` | NAND Vcc + LPDRAM VDD/VDDQ |
| chip count `G/H/I/M` | NAND / LPDRAM chip count |
| package code | `AD/ET/GA/GM/MF/PB/PL/SK/SQ/TB/TN/WD` |
| speed/grade | `18/046/053/062` + `BT/BU/MB/PG/UT` |

## All-in-One 结构

| 结构 | 含义 |
| --- | --- |
| `S` | SpecTek memory |
| `M` / `U` | Marked / Unmarked |
| product technology `A/D/J/K/M/P/Q/R/T/U/V` | LPDRAM、NAND、eMMC/UFS 的组合类型 |
| design ID | 例如 `J6Z4` |
| `ZZ` | NAND placeholder |
| LPDRAM code | density + width |
| eMMC code | density + controller code |
| voltage code | NAND / LPDRAM / eMMC operating voltage |
| chip count | NAND Flash / LPDRAM / eMMC 数量组合 |
| package code | 仅作为内部解析 token；有官方 package 表命中时输出 `package`，不单独向用户展示 token |
| speed grade | `BT/FT/MB/PG/UT`，可带前置 speed token |

## Flash + Controller 结构

| 结构 | 含义 |
| --- | --- |
| `S` | SpecTek NAND Flash Memory |
| `M` / `U` | Marked / Unmarked |
| design ID | 例如 `J52A` |
| NAND density | `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` |
| NAND component | component density / width / voltage |
| controller ID | controller revision，部分 code 可确认 controller vendor / ASIC / protocol |
| package code | 官方 package 表命中时输出 `package` |
| speed grade | dash 后 `BT/BU/FT/PG/UT`，例如 `BT B Grade Fully Tested` |

## Design family

| Code | Product mode |
| --- | --- |
| `A` | SLC NAND + LPDDR2 |
| `B` | SLC NAND + LPDDR3 |
| `C` | SLC NAND + Mobile LPDRAM |
| `G` | SLC NAND + LPDDR4 |
| `R` | SLC NAND + LPDDR2, legacy AIO |
| `U` | SLC NAND + LPDDR3, legacy existing MPN |
| `W` | TLC NAND + LPDDR4 |

## 输出字段

- `product_family`
- `product_mode`
- `storage_density`
- `storage_interface`
- `component_width`
- `component_density`
- `component_voltage`
- `cell_level`
- `dram_density`
- `dram_type`
- `dram_width`
- `voltage`
- `package`
- `special_option`
- `controller`
- `controller_revision`
- `speed_grade`

## 测试样例

- `SUGNM1126A6BPIET-046BT`
- `FNUGNM1126A6BPIET-046BT`
- `SMCNM1126A6BPIET-062UT`
- `SMKJ6Z4ZZ4D4TGFAK-PG`
- `SMKJ6Z4ZZ4D4TGFAK-053BT`
- `SUJ52A1GCFDI-BT`
- `SUJ52A128GASAKDI-FT`

## 注意

SpecTek NAND MCP 是 NAND + LPDRAM 复合封装，不能归入 standalone raw NAND 或 standalone DRAM。当前用 `device.productType = emcp` 承载，storage 子系统输出 `Parallel NAND`。Flash + Controller 结构根据 controller protocol 输出 `emmc` 或 `ufs`；旧单字符 controller revision 无协议细节时保守输出 `emmc`。
`package_code`、`controller_code`、`nand_component` 和 design ID 这类编码只用于内部解析，不进入公开字段；可读信息优先输出为 `package`、`controller`、`component_width` 等字段。`speed_grade` 例外保留原始 speed/grade token，并附带可读含义。
