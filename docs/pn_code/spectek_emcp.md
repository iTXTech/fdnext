# SpecTek NAND MCP / Flash+Controller PN 编码

采集日期：2026-05-14

## 外部资料

- SpecTek NAND MCP Part Numbering System mirror: 覆盖 `S U G NM112 6A 6B P I ET - 046BT` 结构、NAND/LPDRAM density-width code、voltage、chip count、package code 与 speed/grade。
  <https://device.report/m/a61212fa2672663ea5db512aa13ce4685e0684cc9b2f8e80039bb1d4a293a5a8.pdf>
- SpecTek All-in-One Part Numbering System: 官方 2025-02-26 版，覆盖 `S M K J6Z4 ZZ 4 D 4T G F AK - PG` 这类 AIO / eMCP 结构、LPDRAM density-width、eMMC density、controller、voltage、chip count、package code 与 speed grade。
  `/Users/peratx/Downloads/spectek-pns-aio.pdf`
- SpecTek / Micron Flash + Controller decoder image: 只确认 controller revision/vendor 表与 Flash+Controller 方向；当前缺少可验证的 SpecTek Flash+Controller 完整 PN 样本，暂不进入 iTXTech fdnext DecodePack。
- Micron Flash + Controller Part Numbering System: 可用于 `MTFC...` Micron eMMC/UFS，不直接作为 SpecTek `S...` PN 规则。
  <https://assets.micron.com/adobe/assets/urn:aaid:aem:c81e5b7e-6c40-4314-afc8-067c0034c12e/renditions/original/as/numemmc.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/spectek-managed-token.json`
- `vendor.spectek.aio.emcp.v1`
- `vendor.spectek.nand-mcp.v1`

当前接入 NAND MCP 结构，以及官方 All-in-One 表中可由 token 直接解析的 eMCP / AIO 结构。Flash+Controller / UFS 方向需要先找到完整 SpecTek PN 样本和第一屏 part-numbering 结构，再单独接入。

## NAND MCP 结构

| 结构 | 含义 |
| --- | --- |
| `S` | SpecTek memory |
| `M` / `U` | Marked / Unmarked |
| design family `A/B/C/G/R/U/W` | NAND + LPDRAM 组合类型 |
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
- `nand_component`
- `component_width`
- `cell_level`
- `dram_density`
- `dram_type`
- `dram_width`
- `voltage`
- `package`
- `special_option`
- `controller`
- `controller_code`
- `speed_grade`

## 测试样例

- `SUGNM1126A6BPIET-046BT`
- `SMKJ6Z4ZZ4D4TGFAK-PG`

## 注意

SpecTek NAND MCP 是 NAND + LPDRAM 复合封装，不能归入 standalone raw NAND 或 standalone DRAM。当前用 `device.productType = emcp` 承载，storage 子系统输出 `Parallel NAND`。
