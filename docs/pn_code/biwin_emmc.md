# BIWIN eMMC PN 编码

采集日期：2026-05-08

## 外部资料

- BIWIN eMMC 5.1 页面给出 eMMC 5.1、3D TLC、HS400、4GB~512GB、FBGA153 和 ordering table。
  <https://www.biwintechnology.com/product/emmc-5-1/>
- BIWIN eMMC 5.1 PDF 交叉确认 `BWCMMQ511G08G` 为 `9.00 x 11.00 mm`，其他当前公开 ordering table 样本为 `11.50 x 13.00 mm`。
  <https://www.biwintechnology.com/wp-content/uploads/2026/01/eMMC5.1-specifications.pdf>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/biwin-emmc-token.json`
- `vendor.biwin.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWC` + config + density | BIWIN eMMC |
| config `MAB811G/MMQ511G/TAK611G/TARJ11X/TAKC11X/TAKL11X/TAKL21X/TAKL41X` | 官方 ordering table config token |
| density `04G/08G/16G/32G/64G/128G/256G/512G` | 4GB~512GB，落库为 Mbit |

## Reference check

- `BWC` 不能宽泛匹配到 `BWCA2`，否则 eMCP 会被误判为 eMMC；规则已收窄为 `BWC` + 官方 config token + density。
- 8GB eMMC package 是 `FBGA153 9.00x11.00`，不能沿用 11.50x13.00。

## 输出字段

- `storage_density`
- `product_family`
- `product_version`
- `storage_interface`
- `nand_technology`
- `interfaceInfo`
- `product_class`
- `config_code`

## 测试样例

- `BWCTAKL11X128G`
- `BWCMMQ511G08G`
