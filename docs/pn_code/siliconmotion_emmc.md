# Silicon Motion Ferri-eMMC PN 编码

采集日期：2026-05-11

## 外部资料

- Silicon Motion Ferri-eMMC 官方选购指南列出 `SM662G/P + X/E/A/B + C/D/E/F -BFS` 订购编码表，覆盖 eMMC 5.1、100 球 / 153 球 BGA、64GB~512GB、3D TLC NAND、商业 / 工业 / AEC-Q100 等级 3 / 等级 2 温区，状态为 MP。
  <https://www.siliconmotion.com.cn/products/Ferri-eMMC/detail>
- DigiKey `SM662PEC BFSS` 页面交叉确认 Silicon Motion Ferri-eMMC、eMMC、153-BGA、工业温区；分销页只用于封装和接口交叉检查，不作为完整 PN 白名单。
  <https://www.digikey.com/en/products/detail/silicon-motion-inc/SM662PEC-BFSS/16360709>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/siliconmotion-managed-token.json`
- `vendor.siliconmotion.ferri.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SM662` + 封装 + 温度类别 + 容量 + `-BFS` | Silicon Motion Ferri-eMMC |
| 封装 `G` | eMMC 5.1 100 球 BGA |
| 封装 `P` | eMMC 5.1 153 球 BGA |
| 温度 `X` | 商业级, -25°C ~ +85°C |
| 温度 `E` | 工业级, -40°C ~ +85°C |
| 温度 `A` | 车规 AEC-Q100 等级 3, -40°C ~ +85°C |
| 温度 `B` | 车规 AEC-Q100 等级 2, -40°C ~ +105°C |
| 容量 `C/D/E/F` | 64GB / 128GB / 256GB / 512GB |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
选型-指南编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `SM662GXC-BFS`
- `SM662PBC-BFS`

## 注意

`SM662` 是 Ferri-eMMC 封装存储产品，不是裸 eMMC 控制器。规则按选型指南的结构编码段解码，不按完整 PN 枚举。

## PN 展示

Ferri-eMMC 在容量编码与 BFS 封装尾部之间恢复 `-`，例如 `SM662GXC-BFS`。
