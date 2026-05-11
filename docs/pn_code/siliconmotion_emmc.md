# Silicon Motion Ferri-eMMC PN 编码

采集日期：2026-05-11

## 外部资料

- Silicon Motion Ferri-eMMC 官方选购指南列出 `SM662G/P + X/E/A/B + C/D/E/F -BFS` ordering table，覆盖 eMMC 5.1、100-ball / 153-ball BGA、64GB~512GB、3D TLC NAND、商业 / 工业 / AEC-Q100 Grade 3 / Grade 2 温区，状态为 MP。
  <https://www.siliconmotion.com.cn/products/Ferri-eMMC/detail>
- DigiKey `SM662PEC BFSS` 页面交叉确认 Silicon Motion Ferri-eMMC、eMMC、153-BGA、工业温区；分销页只用于封装和接口交叉检查，不作为完整 PN 白名单。
  <https://www.digikey.com/en/products/detail/silicon-motion-inc/SM662PEC-BFSS/16360709>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/siliconmotion-managed-token.json`
- `vendor.siliconmotion.ferri.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SM662` + package + temperature class + density + `-BFS` | Silicon Motion Ferri-eMMC |
| package `G` | eMMC 5.1 100-ball BGA |
| package `P` | eMMC 5.1 153-ball BGA |
| temperature `X` | Commercial, -25°C ~ +85°C |
| temperature `E` | Industrial, -40°C ~ +85°C |
| temperature `A` | Automotive AEC-Q100 Grade 3, -40°C ~ +85°C |
| temperature `B` | Automotive AEC-Q100 Grade 2, -40°C ~ +105°C |
| density `C/D/E/F` | 64GB / 128GB / 256GB / 512GB |

## 输出字段

- `product_family`
- `storage_density`
- `storage_interface`
- `interface_type`
- `nand_technology`
- `product_class`
- `operation_temperature`
- `package_code`

## 测试样例

- `SM662GXC-BFS`
- `SM662PBC-BFS`

## 注意

`SM662` 是 Ferri-eMMC 封装存储产品，不是裸 eMMC controller。规则按 selection guide 的结构 token 解码，不按完整 PN 枚举。
