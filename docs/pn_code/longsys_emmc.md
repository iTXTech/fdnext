# Longsys eMMC PN 编码

采集日期：2026-05-08

## 外部资料

- Longsys embedded storage 页面说明 FORESEE embedded storage 覆盖 eMMC、UFS、eMCP/uMCP 等产品线，并包含 industrial / automotive 产品。
  <https://www.longsys.com/products/embedded-storage/>
- FORESEE Embedded Storage Product Catalogue 2023 给出 eMMC series、容量、封装和温区订购表。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>
- FORESEE eMMC datasheet / LCSC/JLCPCB 页面交叉确认 `FEMDNN064G-A3A56`、`FEMDNN128G-A3A56` 为 `11.5x13x0.8`，`FEMDNN256G-A3A56` 为 `11.5x13x1.0`。
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/6697/FEMDNN064G-A3A56.pdf>
  <https://www.lcsc.com/product-detail/emmc_foresee_femdnn128g-a3a56_C5117596.html>
- Longsys / Lexar Enterprise Subsize eMMC 资料确认 `FEMKNN004G-58A42`、`FEMKNN008G-58A42` 为 `9x7.5x0.8mm`，`FEMJNM032G-58C29` 为 `9x10x0.8mm`。
  <https://www.longsys.com/embedded-storage/subsize-emmc.html>
  <https://lexarenterprise.com/product/subsize-emmc/>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/longsys-emmc-token.json`
- `vendor.longsys.foresee.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEM` + series + density + config | FORESEE eMMC |
| series `DME` | Automotive eMMC Grade2 |
| series `DRM` | Industrial eMMC |
| series `DRW` | Industrial Wide-temperature eMMC |
| series `DMW` | Automotive eMMC Grade3 |
| series `DNN` | Commercial eMMC |
| series `KNN/JNM` | Commercial Subsize eMMC |
| density `004G/008G/016G/032G/064G/0128G/128G/256G` | 4GB~256GB，落库为 Mbit |

## Reference check

- 规则 match 已从任意 3 字母 series 收窄到已确认的 `DME/DRM/DRW/DMW/DNN/KNN/JNM`，避免未知 `FEMxxx` 被误判。
- `DNN` 标准商规 eMMC 的封装厚度与容量有关：64GB/128GB 为 `11.5x13x0.8`，256GB 为 `11.5x13x1.0`。
- `DME` 车规 Grade2 64GB 样本为 `11.5x13x1.2`，低容量样本为 `11.5x13x1.0`。

## 输出字段

- `series_code`
- `storage_density`
- `product_family`
- `product_class`
- `product_version`
- `storage_interface`
- `nand_technology`
- `opTemp`

## 测试样例

- `FEMDNN256G-A3A5607-08`
