# SanDisk iNAND eMMC PN 编码

采集日期：2026-05-08

## 外部资料

- SanDisk iNAND IX EM132 product brief: `SDINBDA6-16G/32G/64G/128G/256G`，eMMC 5.1 HS400，BiCS3 64L 3D NAND，`I1` / `XI1` 工业温区后缀。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-ix-em132-industrial-embedded-flash-devices.pdf>
- Western Digital Mobile and Compute brochure: 汇总 `SDINBDV4` / `SDINBDA4` / `SDINBDG4` / `SDINADF4` 的 MC/CL eMMC 产品族、容量范围和 eMMC 5.1 HS400 接口。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk automotive eMMC/UFS brochure: `SDINBDA6-##G-ZA1|XA1` 对应 AT EM132，`SDINBDG4-##G-ZA3|XA3` 对应 AT EM122，接口均为 eMMC 5.1 HS400。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/sandisk-inand-emmc-token.json`
- `vendor.sndk.inand.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | SanDisk iNAND eMMC |
| family `ADF4` | iNAND MC EM111, eMMC 5.1 HS400 |
| family `BDA4` | iNAND MC EM131, eMMC 5.1 HS400 |
| family `BDA6` | iNAND IX/AT EM132-class, eMMC 5.1 HS400, BiCS3 64L 3D NAND |
| family `BDG4` | iNAND 7250 / EM122-class, eMMC 5.1 HS400 |
| family `BDV4` | iNAND MC EM141, eMMC 5.1 HS400 |
| capacity `4G/8G/16G/32G/64G/128G/256G` | eMMC 容量，落库为 Mbit |
| suffix `H` | Connected Home, -25°C to 95°C |
| suffix `I1/I2` | Industrial Wide Temperature, -25°C to 85°C |
| suffix `XI1/XI2` | Industrial Extended Temperature, -40°C to 85°C |
| suffix `XA1/XA3` | Automotive, -40°C to 85°C |
| suffix `ZA/ZA1/ZA3` | Automotive, -40°C to 105°C |

## 输出字段

- `product_family`
- `product_version`
- `storage_interface`
- `interface_type`
- `nand_technology`
- `generation_info`
- `component_voltage`
- `product_class`
- `operation_temperature`

## 测试样例

- `SDINBDA6-256G-XI1`
- `SDINBDG4-32G-ZA3`

## 注意

`SDIN` 只是 iNAND 前缀，不能单独判断为 eMMC。规则必须先识别 family token，再决定 `type`。
