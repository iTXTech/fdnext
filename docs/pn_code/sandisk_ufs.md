# SanDisk iNAND UFS PN 编码

采集日期：2026-05-08

## 外部资料

- Western Digital Mobile and Compute brochure: 汇总 MC EU551 / EU521 / EU511 / EU311 的容量、接口和订购型号，例如 `SDINFDO4-128G`、`SDINFDK4-128G`、`SDINEDK4-128G`、`SDINDDH4-32G`。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/embedded-flash/brochure/brochure-western-digital-eis-mobile.pdf>
- Sandisk industrial / IoT brochure: UFS 2.1 覆盖 64GB-512GB，UFS 3.1 覆盖 128GB-512GB，UFS 4.1 覆盖 256GB-1TB。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-industrial-iot-storage-solutions.pdf>
- Sandisk automotive eMMC/UFS brochure: AT EU752 / EU552 / EU312 的接口、容量范围、温区和 ordering pattern。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/brochure/brochure-sandisk-automotive-ufs-emmc.pdf>
- iNAND AT EU552 product brief: `SDINFDQ6-64G/128G/256G/512G-XA1|ZA1`，UFS 3.1，112L 3D NAND。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu552.pdf>
- iNAND AT EU752 product brief: `SDINHDL6-256G/512G/1T00-ZA`，UFS 4.1，BiCS8 218L。
  <https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/embedded-flash/product-brief/product-brief-inand-at-eu752.pdf>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/sandisk-inand-ufs-token.json`
- `vendor.sndk.inand.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIN` + family + `-` + capacity + optional suffix | SanDisk iNAND UFS |
| family `DDH4` | iNAND MC EU311, UFS 2.1 |
| family `DDH6` | iNAND AT EU312, UFS 2.1 |
| family `EDK4` | iNAND MC EU511, UFS 3.0 |
| family `FDK4` | iNAND MC EU521, UFS 3.1 |
| family `FDO2/FDO4` | iNAND MC EU551, UFS 3.1 |
| family `FDQ6` | iNAND AT EU552, UFS 3.1, 112L 3D NAND |
| family `HDL6` | iNAND AT EU752, UFS 4.1, BiCS8 218L |
| suffix `XA1/XA2` | Automotive, -40°C to 85°C |
| suffix `ZA/ZA1/ZA2` | Automotive, -40°C to 105°C |

## 输出字段

- `product_family`
- `product_version`
- `storage_interface`
- `interface_type`
- `nand_technology`
- `generation_info`
- `product_class`
- `operation_temperature`

## 测试样例

- `SDINFDK4-128G`
- `SDINDDH6-128G-ZA2`

## 注意

`SDIN` family token 决定 eMMC/UFS 类型。未知 family 由 generic iNAND fallback 保留容量，不输出不确定产品族。
