# BIWIN eMMC PN 编码

采集日期：2026-07-11；更新日期：2026-07-12

## 外部资料

- BIWIN TGE408 eMMC 5.1 官方规格表给出 `BWEFMI008/016/064/128GN929` ordering、8GB/16GB pSLC、64GB/128GB TLC、FBGA153 11.50x13.00x1.10 和 -40°C~+85°C。规则用 `density + N929` 局部 token 组合区分 pSLC/TLC，不按完整 PN 查表。来源：<https://www.biwintechnology.com/wp-content/uploads/2026/07/BIWIN-TGE408-eMMC-5.1-Specifications.pdf>

`BWC...08G/16GI` 的 TGE218 入口只按 `BWC + 7-character config + density + grade` 结构识别；已知 `MAQB11T` config token 映射到官方封装，未知 config 仍保留厂商、eMMC 与容量，但不输出封装或 NAND 类型。

- BIWIN eMMC 5.1 页面给出 eMMC 5.1、3D TLC、HS400、4GB~512GB、FBGA153 和 ordering table。
  <https://www.biwintechnology.com/product/emmc-5-1/>
- BIWIN eMMC 5.1 PDF 交叉确认 `BWCMMQ511G08G` 为 `9.00 x 11.00 mm`，其他当前公开 ordering table 样本为 `11.50 x 13.00 mm`。
  <https://www.biwintechnology.com/wp-content/uploads/2026/01/eMMC5.1-specifications.pdf>
- BIWIN TAE308 车规 eMMC 5.1 页面给出 `BWEFMA` ordering、64GB/128GB、3D TLC、AEC-Q100 Grade 2、FBGA153 和 11.50 x 13.00 x 1.10 mm。
  <https://www.biwintechnology.com/product/tae308-automotive-emmc-5-1/>
- BIWIN TDE308 工业标准 eMMC 5.1 页面给出 `BWEFMD` ordering、64GB/128GB、3D TLC、FBGA153 和相同尺寸。
  <https://www.biwintechnology.com/product/tde308-emmc-5-1/>
- BIWIN 当前 TAE208/318、TDE208/218、TGE208/218 官方页面补齐了 8GB~128GB 车规、工业标准和工业宽温 ordering PN；它们均为 eMMC 5.1 / FBGA153，后缀 config token 与 NAND 类型和封装结合解析。
  <https://www.biwintechnology.com/product/tae208-automotive-emmc-5-1/>
  <https://www.biwintechnology.com/product/tae318-automotive-emmc-5-1/>
  <https://www.biwintechnology.com/product/tde208-embedded-emmc-5-1/>
  <https://www.biwintechnology.com/product/tde218-emmc-5-1/>
  <https://www.biwintechnology.com/product/tge208-emmc-5-1/>
  <https://www.biwintechnology.com/product/tge218-emmc-5-1/>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/biwin-emmc-token.json`
- `vendor.biwin.emmc.v1`
- `vendor.biwin.emmc.bwefm.v1`
- `vendor.biwin.emmc.bwcmaqb.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWC` + config + density | BIWIN eMMC |
| config `MAB811G/MMQ511G/TAK611G/TARJ11X/TAKC11X/TAKL11X/TAKL21X/TAKL41X` | 官方 ordering table config token |
| density `04G/08G/16G/32G/64G/128G/256G/512G` | 4GB~512GB，落库为 Mbit |
| `BWEFM` + grade + density + config | BIWIN automotive / industrial eMMC；grade `A/D/I` 区分车规、工业标准和工业宽温 |
| `BWCMAQB11T` + density + grade | BIWIN TGE218 industrial wide-temperature eMMC |

## Reference check

- `BWC` 不能宽泛匹配到 `BWCA2`，否则 eMCP 会被误判为 eMMC；规则已收窄为 `BWC` + 官方 config token + density。
- 8GB eMMC package 是 `FBGA153 9.00x11.00`，不能沿用 11.50x13.00。

## 输出字段

- `density`
- `storage_interface`
- `nand_technology`
- `interface_type`
- `product_class`

`config_code` 等 ordering token 只用于内部解析，不进入公开字段。

## 测试样例

- `BWCTAKL11X128G`
- `BWCMMQ511G08G`
- `BWEFMA128GN923`
- `BWEFMD064GN729`
- `BWEFMA016GN9RE`
- `BWEFMI128GN223`
- `BWCMAQB11T16GI`

TDE218 官方页面/PDF 的 ordering 行丢失了厂商前缀 `B`；BIWIN eMMC datasheet 和可信封装表均使用 `BWEFMD008GN8RC`，因此资源保留完整 PN。
