# Micron SSD PN 编码

采集日期：2026-05-15

本文档记录 Micron 2100AI / 2100AT PCIe NVMe NAND Flash SSD 的 PN ordering 结构。本次规则只使用用户提供的 Micron 官方 datasheet 截图信息，不引入第三方网页或外部检索资料。

## 外部资料

- Micron 官方 2100AI SSD datasheet 截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK128`、`MTFDHBK256`、`MTFDHBK512`、`MTFDHBK1T0`；feature/options 页给出 form factor、density、product family、BOM、operating temperature 与 customer designator marking；ordering 图给出 `MT FD H XX XXX T XX - X AT 1 2 XX YY ES` 结构和完整 base PN 表。
- Micron 官方 2100AT SSD datasheet 截图：标题页列出 `MTFDHBL064`、`MTFDHBL128`、`MTFDHBL256`、`MTFDHBL512`、`MTFDHBM1T0`、`MTFDHBK1T0`；ordering 图给出同一结构，其中 `DQ = 2100AT`，公开 PN 表列出 `MTFDHBL064TDQ-1AT12ATYY`、`MTFDHBL128TDQ-1AT12ATYY`、`MTFDHBL256TDQ-1AT12ATYY`、`MTFDHBL512TDQ-1AT12ATYY`、`MTFDHBM1T0TDQ-1AT12ATYY`、`MTFDHBK1T0TDQ-1AT12ATYY`。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-ssd-token.json`
- `vendor.micron.ssd.2100ai-at.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT` | Micron Technology |
| `FD` | Flash drive (SSD) |
| `H` | PCIe Gen3 drive interface |
| form factor `BL/BM/BK` | `BL/BM` 为 BGA291 type 1620，`BK` 为 M.2 Type 2230 M-key |
| density `064/128/256/512/1T0` | 64GB / 128GB / 256GB / 512GB / 1TB，落库为 Mbit |
| NAND type `T` | TLC |
| product family `DP/DQ` | `DP = 2100AI`，`DQ = 2100AT` |
| BOM `1/A` | `1 = 1st Generation`，`A = Engineering samples` |
| NAND component `AT` | 512Gb TLC x8 3.3V (3D) |
| sector size `1` | 512 bytes |
| extended firmware `2` | Self-encrypting drive (SED) |
| operating temperature `AI/AT` | `AI = Automotive support, Industrial (-40°C to +95°C)`；`AT = Automotive (-40°C to +105°C)` |
| customer designator `YY` | Standard，规则内部识别，不输出为公开字段 |
| production status `ES` | Engineering samples |

温区说明：feature/options 页把 Grade 3 extended `-40°C to +95°C` 的 marking 写为 `IT`，ordering 图和完整 base PN 表在 part number 温区位置使用 `AI`。当前 DecodePack 只把 ordering 图中的 `AI` / `AT` 当作 PN token 解析，`IT` 暂不作为 PN 温区 token。

## 输出字段

- `density`
- `product_family`
- `product_version`
- `storage_interface`
- `cell_level`
- `nand_technology`
- `nand_component`
- `component_density`
- `component_width`
- `component_voltage`
- `sector_size`
- `generation_info`
- `product_class`
- `special_option`
- `operation_temperature`
- `prod_status`
- `package`

`form factor`、`product family`、`BOM`、`NAND component`、`sector size`、`firmware`、`temperature` 和 `customer designator` 的原始 code 只用于规则内部解析，不进入公开 fields。

## 测试样例

- `MTFDHBL064TDP-1AT12AIYY`
- `MTFDHBM1T0TDP-1AT12AIYY`
- `MTFDHBK1T0TDP-1AT12AIYY`
- `MTFDHBL064TDQ-1AT12ATYY`
- `MTFDHBK128TDQ-1AT12ATYY`
- `MTFDHBK1T0TDQ-1AT12ATYY`
- `MTFDHBL128TDP-AAT12AIYYES`

## 注意

2100AI / 2100AT 是 PCIe NVMe SSD 封装，归入 `device.chipKind = "managed_nand"` 与 `device.productType = "nvme"`；不要只根据 `MTFD` 前缀把它归入 raw NAND。
