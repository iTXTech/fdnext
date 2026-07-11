# Silicon Motion Ferri-UFS PN 编码

采集日期：2026-05-11

## 外部资料

- Silicon Motion Ferri-UFS 官方选购指南列出 `SM671P + X/E/A/B + C/D/E/F + optional -L + -BFS` ordering table，覆盖 UFS 3.1 / UFS 2.2、153-ball BGA、64GB~512GB、3D TLC NAND、商业 / 工业 / AEC-Q100 Grade 3 / Grade 2 温区，状态为 MP。
  <https://www.siliconmotion.com.cn/products/Ferri-UFS_Ferri/detail>
- Silicon Motion `SM2756` UFS 4.x controller product brief 仅确认 UFS 4.x controller 技术路线，不是 Ferri-UFS 封装存储 PN ordering table；当前不据此新增 Ferri-UFS 4.x 存储产品规则。
  <https://www.siliconmotion.com/download/DWfp/a/SM2756_PB_EN.pdf>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/siliconmotion-managed-token.json`
- `vendor.siliconmotion.ferri.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SM671` + package + temperature class + density + optional `-L` + `-BFS` | Silicon Motion Ferri-UFS；`-L` 为 UFS 2.2，无 `-L` 为 UFS 3.1 |
| package `P` | 153-ball BGA |
| temperature `X` | Commercial, -25°C ~ +85°C |
| temperature `E` | Industrial, -40°C ~ +85°C |
| temperature `A` | Automotive AEC-Q100 Grade 3, -40°C ~ +85°C |
| temperature `B` | Automotive AEC-Q100 Grade 2, -40°C ~ +105°C |
| density `C/D/E/F` | 64GB / 128GB / 256GB / 512GB |

## 输出字段

- `density`
- `product_family`
- `storage_interface`
- `speed_grade`
- `nand_technology`
- `product_class`
- `operation_temperature`

`package_code` 等 selection-guide token 只用于内部解析，不进入公开字段。

## 测试样例

- `SM671PXC-BFS`
- `SM671PEF-BFS`
- `SM671PBC-L-BFS`

## 注意

Ferri-UFS 当前公开 selection guide 给出 UFS 3.1 与带 `-L` token 的 UFS 2.2 存储产品。SM2756 是 UFS 4.x controller，不等同于可解码的 Ferri-UFS PN。
