# Longsys eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- Longsys 嵌入式存储页面说明 FORESEE 嵌入式存储覆盖 eMMC、UFS、eMCP/uMCP 等产品线，并包含工业级 / 车规产品。
  <https://www.longsys.com/products/embedded-storage/>
- FORESEE Embedded Storage Product Catalogue 2023 给出 eMMC 系列、容量、封装和温区订购表。
  <https://www.longsys.com/uploads/BP_FORESEE_Embedded-Storage-Product-Catalogue_20230423_R_1704768357.pdf>
- FORESEE eMMC 数据手册 / LCSC/JLCPCB 页面交叉确认 `FEMDNN064G-A3A56`、`FEMDNN128G-A3A56` 为 `11.5x13x0.8`，`FEMDNN256G-A3A56` 为 `11.5x13x1.0`。
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/6697/FEMDNN064G-A3A56.pdf>
  <https://www.lcsc.com/product-detail/emmc_foresee_femdnn128g-a3a56_C5117596.html>
- Longsys / Lexar Enterprise 小尺寸 eMMC 资料确认 `FEMKNN004G-58A42`、`FEMKNN008G-58A42` 为 `9x7.5x0.8mm`，`FEMJNM032G-58C29` 为 `9x10x0.8mm`。
  <https://www.longsys.com/embedded-storage/subsize-emmc.html>
  <https://lexarenterprise.com/product/subsize-emmc/>
- 2023 官方 Embedded Storage Catalogue 的 eMMC 产品系列共 31 项，覆盖车规等级 2/3、工业级、工业级宽温、商业级和小尺寸系列；资源已补齐目录内所有完整 PN。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/longsys-emmc-token.json`
- `vendor.longsys.foresee.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FEM` + 系列 + 容量 + 配置 | FORESEE eMMC |
| 系列 `DME` | 车规 eMMC Grade2 |
| 系列 `DRM` | 工业级 eMMC |
| 系列 `DRW` | 工业级宽温 eMMC |
| 系列 `DMW` | 车规 eMMC Grade3 |
| 系列 `DNN` | 商业级 eMMC |
| 系列 `KNN/JNM` | 商业级小尺寸 eMMC |
| 容量 `004G/008G/016G/032G/064G/0128G/128G/256G` | 4GB~256GB，落库为 Mbit |

## 参考资料检查

- 规则匹配已从任意 3 字母系列收窄到已确认的 `DME/DRM/DRW/DMW/DNN/KNN/JNM`，避免未知 `FEMxxx` 被误判。
- `DNN` 标准商规 eMMC 的封装厚度与容量有关：64GB/128GB 为 `11.5x13x0.8`，256GB 为 `11.5x13x1.0`。
- `DME` 车规 Grade2 64GB 样本为 `11.5x13x1.2`，低容量样本为 `11.5x13x1.0`。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `FEMDNN256G-A3A5607-08`
- `FEMDME016G-A8A58`
- `FEMDRW128G-88A19`

## PN 展示

FEM 系列在容量编码后恢复 `-`，包括 `0128G` 等不同长度编码。已输入的额外修订尾部（如 `FEMDNN256G-A3A5607-08`）完整保留；未解析的修订边界不从长度猜测。
