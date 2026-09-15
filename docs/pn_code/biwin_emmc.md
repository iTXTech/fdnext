# BIWIN eMMC PN 编码

采集日期：2026-07-11；更新日期：2026-07-12

## 外部资料

- BIWIN TGE408 eMMC 5.1 官方规格表给出 `BWEFMI008/016/064/128GN929` 订购编码、8GB/16GB pSLC、64GB/128GB TLC、FBGA153 11.50x13.00x1.10 和 -40°C~+85°C。规则用 `density + N929` 局部编码段组合区分 pSLC/TLC，不按完整 PN 查表。来源：<https://www.biwintechnology.com/wp-content/uploads/2026/07/BIWIN-TGE408-eMMC-5.1-Specifications.pdf>

`BWC...08G/16GI` 的 TGE218 入口只按 `BWC + 7-character config + density + grade` 结构识别；已知 `MAQB11T` 配置编码段映射到官方封装，未知配置仍保留厂商、eMMC 与容量，但不输出封装或 NAND 类型。

- BIWIN eMMC 5.1 页面给出 eMMC 5.1、3D TLC、HS400、4GB~512GB、FBGA153 和订购编码表。
  <https://www.biwintechnology.com/product/emmc-5-1/>
- BIWIN eMMC 5.1 PDF 交叉确认 `BWCMMQ511G08G` 为 `9.00 x 11.00 mm`，其他当前公开订购编码表样本为 `11.50 x 13.00 mm`。
  <https://www.biwintechnology.com/wp-content/uploads/2026/01/eMMC5.1-specifications.pdf>
- BIWIN TAE308 车规 eMMC 5.1 页面给出 `BWEFMA` 订购编码、64GB/128GB、3D TLC、AEC-Q100 等级 2、FBGA153 和 11.50 x 13.00 x 1.10 mm。
  <https://www.biwintechnology.com/product/tae308-automotive-emmc-5-1/>
- BIWIN TDE308 工业标准 eMMC 5.1 页面给出 `BWEFMD` 订购编码、64GB/128GB、3D TLC、FBGA153 和相同尺寸。
  <https://www.biwintechnology.com/product/tde308-emmc-5-1/>
- BIWIN 当前 TAE208/318、TDE208/218、TGE208/218 官方页面补齐了 8GB~128GB 车规、工业标准和工业宽温订购 PN；它们均为 eMMC 5.1 / FBGA153，后缀配置编码段与 NAND 类型和封装结合解析。
  <https://www.biwintechnology.com/product/tae208-automotive-emmc-5-1/>
  <https://www.biwintechnology.com/product/tae318-automotive-emmc-5-1/>
  <https://www.biwintechnology.com/product/tde208-embedded-emmc-5-1/>
  <https://www.biwintechnology.com/product/tde218-emmc-5-1/>
  <https://www.biwintechnology.com/product/tge208-emmc-5-1/>
  <https://www.biwintechnology.com/product/tge218-emmc-5-1/>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/biwin-emmc-token.json`
- `vendor.biwin.emmc.v1`
- `vendor.biwin.emmc.bwefm.v1`
- `vendor.biwin.emmc.bwcmaqb.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWC` + 配置 + 容量 | BIWIN eMMC |
| 配置 `MAB811G/MMQ511G/TAK611G/TARJ11X/TAKC11X/TAKL11X/TAKL21X/TAKL41X` | 官方订购编码表配置编码段 |
| 容量 `04G/08G/16G/32G/64G/128G/256G/512G` | 4GB~512GB，落库为 Mbit |
| `BWEFM` + 等级 + 容量 + 配置 | BIWIN 车规 / 工业级 eMMC；等级 `A/D/I` 区分车规、工业标准和工业宽温 |
| `BWCMAQB11T` + 容量 + 等级 | BIWIN TGE218 工业级宽温 eMMC |

## 参考资料检查

- `BWC` 不能宽泛匹配到 `BWCA2`，否则 eMCP 会被误判为 eMMC；规则已收窄为 `BWC` + 官方配置编码段 + 容量。
- 8GB eMMC 封装是 `FBGA153 9.00x11.00`，不能沿用 11.50x13.00。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`config_code` 等订购编码段只用于内部解析，不进入公开字段。

## 测试样例

- `BWCTAKL11X128G`
- `BWCMMQ511G08G`
- `BWEFMA128GN923`
- `BWEFMD064GN729`
- `BWEFMA016GN9RE`
- `BWEFMI128GN223`
- `BWCMAQB11T16GI`

TDE218 官方页面/PDF 的订购编码行丢失了厂商前缀 `B`；BIWIN eMMC 数据手册和可信封装表均使用 `BWEFMD008GN8RC`，因此资源保留完整 PN。
