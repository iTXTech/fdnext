# SpecTek NAND MCP / 闪存+控制器 PN 编码

采集日期：2026-05-20

## 外部资料

- SpecTek NAND MCP Part Numbering System: 官方 2022-06-01 版，覆盖 `S U G NM112 6A 6B P I ET - 046BT` 结构、`S/FN/FT/FB` SpecTek 存储器前缀、NAND/LPDRAM 容量-位宽编码、电压、芯片数、封装编码与连字符后速度/等级。
  `spectek-pns-mcppop.pdf`
- SpecTek NAND MCP Part Numbering System 镜像: 同向佐证 NAND MCP 表。
  <https://device.report/m/a61212fa2672663ea5db512aa13ce4685e0684cc9b2f8e80039bb1d4a293a5a8.pdf>
- SpecTek All-in-One Part Numbering System: 官方 2025-02-26 版，覆盖 `S M K J6Z4 ZZ 4 D 4T G F AK - PG` 这类 AIO / eMCP 结构、LPDRAM 容量-位宽、eMMC 容量、控制器、电压、芯片数、封装编码与速度等级。
  `spectek-pns-aio.pdf`
- SpecTek Flash + Controller Part Numbering System: 官方 2025-02-26 版，覆盖 `S U J52A 1G C F DI - BT` 这类 e-MMC / 定制卡结构、NAND 容量、NAND 芯片、控制器 ID、封装编码与连字符后速度等级。
  `spectek-pns-emmc.pdf`
- Micron Flash + Controller Part Numbering System: 可用于 `MTFC...` Micron eMMC/UFS，不直接作为 SpecTek `S...` PN 规则。
  <https://assets.micron.com/adobe/assets/urn:aaid:aem:c81e5b7e-6c40-4314-afc8-067c0034c12e/renditions/original/as/numemmc.pdf>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/spectek-managed-token.json`
- `vendor.spectek.aio.emcp.v1`
- `vendor.spectek.flash-controller.v1`
- `vendor.spectek.nand-mcp.v1`

当前接入 NAND MCP、官方 All-in-One eMCP / AIO，以及闪存 + 控制器 eMMC / UFS 方向。NAND MCP 和闪存 + 控制器规则按官方编码段表解析，不依赖完整 PN 白名单；连字符后 `BT/BU/FT/PG/UT` 等速度等级必须进入公开 `speed_grade` 字段。

## NAND MCP 结构

| 结构 | 含义 |
| --- | --- |
| `S` / `FN` / `FT` / `FB` | SpecTek 存储器 |
| `M` / `U` | 有标记 / 无标记 |
| 设计系列 `A/B/C/G/R/U/W` | NAND + LPDRAM 组合类型；`C` 为 MCP PoP LPDRAM 路径 |
| 设计 ID | 例如 `NM112` |
| NAND 编码 `1..8` + `A/B/C` | NAND 容量 + 位宽 |
| LPDRAM 编码 `1..8` + `A/B/C` | DRAM 容量 + 位宽 |
| 电压 `B/D/E/F/H/M/P/Q` | NAND Vcc + LPDRAM VDD/VDDQ |
| 芯片数 `G/H/I/M` | NAND / LPDRAM 芯片数 |
| 封装编码 | `AD/ET/GA/GM/MF/PB/PL/SK/SQ/TB/TN/WD` |
| 速度/等级 | `18/046/053/062` + `BT/BU/MB/PG/UT` |

## All-in-One 结构

| 结构 | 含义 |
| --- | --- |
| `S` | SpecTek 存储器 |
| `M` / `U` | 有标记 / 无标记 |
| 产品技术 `A/D/J/K/M/P/Q/R/T/U/V` | LPDRAM、NAND、eMMC/UFS 的组合类型 |
| 设计 ID | 例如 `J6Z4` |
| `ZZ` | NAND 占位符 |
| LPDRAM 编码 | 容量 + 位宽 |
| eMMC 编码 | 容量 + 控制器编码 |
| 电压编码 | NAND / LPDRAM / eMMC 工作电压 |
| 芯片数 | NAND 闪存 / LPDRAM / eMMC 数量组合 |
| 封装编码 | 仅作为内部解析编码段；有官方封装表命中时输出 `package`，不单独向用户展示编码段 |
| 速度等级 | `BT/FT/MB/PG/UT`，可带前置速度编码段 |

## 闪存 + 控制器结构

| 结构 | 含义 |
| --- | --- |
| `S` | SpecTek NAND 闪存存储器 |
| `M` / `U` | 有标记 / 无标记 |
| 设计 ID | 例如 `J52A` |
| NAND 容量 | `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` |
| NAND 芯片 | 芯片容量 / 位宽 / 电压 |
| 控制器 ID | 控制器修订版，部分编码可确认控制器厂商 / ASIC / 协议 |
| 封装编码 | 官方封装表命中时输出 `package` |
| 速度等级 | 连字符后 `BT/BU/FT/PG/UT`，例如 `BT B Grade Fully Tested` |

## 设计系列

| 编码 | 产品模式 |
| --- | --- |
| `A` | SLC NAND + LPDDR2 |
| `B` | SLC NAND + LPDDR3 |
| `C` | SLC NAND + 移动版 LPDRAM |
| `G` | SLC NAND + LPDDR4 |
| `R` | SLC NAND + LPDDR2, 旧版 AIO |
| `U` | SLC NAND + LPDDR3, 旧版已有 MPN |
| `W` | TLC NAND + LPDDR4 |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `SUGNM1126A6BPIET-046BT`
- `FNUGNM1126A6BPIET-046BT`
- `SMCNM1126A6BPIET-062UT`
- `SMKJ6Z4ZZ4D4TGFAK-PG`
- `SMKJ6Z4ZZ4D4TGFAK-053BT`
- `SUJ52A1GCFDI-BT`
- `SUJ52A128GASAKDI-FT`

## 注意

SpecTek NAND MCP 是 NAND + LPDRAM 复合封装，不能归入独立裸 NAND 或独立 DRAM。当前用 `device.productType = emcp` 承载，存储子系统输出 `Parallel NAND`。闪存 + 控制器结构根据控制器协议输出 `emmc` 或 `ufs`；旧单字符控制器修订版无协议细节时保守输出 `emmc`。
`product_mode` 只保留 `MCP PoP` 等未被结构化字段覆盖的增量信息；`SLC NAND + LPDDR4` 这类组合已分别由 `cell_level`、`storage_interface` 和 `dram_type` 表达，不重复输出。`package_code`、`controller_code`、`nand_component` 和设计 ID 这类编码只用于内部解析，不进入公开字段；可读信息优先输出为 `package`、`controller`、`component_width` 等字段。`speed_grade` 例外保留原始速度/等级编码段，并附带可读含义。
