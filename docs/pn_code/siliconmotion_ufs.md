# Silicon Motion Ferri-UFS PN 编码

采集日期：2026-05-11

## 外部资料

- Silicon Motion Ferri-UFS 官方选购指南列出 `SM671P + X/E/A/B + C/D/E/F + optional -L + -BFS` 订购编码表，覆盖 UFS 3.1 / UFS 2.2、153 球 BGA、64GB~512GB、3D TLC NAND、商业 / 工业 / AEC-Q100 等级 3 / 等级 2 温区，状态为 MP。
  <https://www.siliconmotion.com.cn/products/Ferri-UFS_Ferri/detail>
- Silicon Motion `SM2756` UFS 4.x 控制器产品简介仅确认 UFS 4.x 控制器技术路线，不是 Ferri-UFS 封装存储 PN 订购编码表；当前不据此新增 Ferri-UFS 4.x 存储产品规则。
  <https://www.siliconmotion.com/download/DWfp/a/SM2756_PB_EN.pdf>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/siliconmotion-managed-token.json`
- `vendor.siliconmotion.ferri.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SM671` + 封装 + 温度类别 + 容量 + 可选 `-L` + `-BFS` | Silicon Motion Ferri-UFS；`-L` 为 UFS 2.2，无 `-L` 为 UFS 3.1 |
| 封装 `P` | 153 球 BGA |

共用编码段表见 [siliconmotion_emmc](siliconmotion_emmc.md#规则状态)；本文仅列该产品线的差异。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
选型-指南编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `SM671PXC-BFS`
- `SM671PEF-BFS`
- `SM671PBC-L-BFS`

## 注意

Ferri-UFS 当前公开选型指南给出 UFS 3.1 与带 `-L` 编码段的 UFS 2.2 存储产品。SM2756 是 UFS 4.x 控制器，不等同于可解码的 Ferri-UFS PN。

## PN 展示

Ferri-UFS 分别恢复可选 L 版本和 BFS 封装边界：`SM671PXC-BFS`、`SM671PXC-L-BFS`。
