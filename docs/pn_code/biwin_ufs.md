# BIWIN UFS PN 编码

采集日期：2026-07-11

## 外部资料

- BIWIN UFS 2.2 页面给出 UFS 2.2、64GB~512GB、顺序读写 1000/800 MB/s、FBGA153 和订购编码表。
  <https://www.biwintechnology.com/product/ufs-2-2/>
- BIWIN UFS 3.1 页面和规格表给出 `BWU3A` 订购编码、128GB~512GB、2100/1800 MB/s、FBGA153、11.50 x 13.00 mm。
  <https://www.biwintechnology.com/product/ufs-3-1/>
- BIWIN TAU208 车规 UFS 3.1 页面给出 `TCUFMA` 订购编码、3D TLC、HS-Gear4 2L、AEC-Q100 等级 2、FBGA153 和 11.50 x 13.00 x 1.20 mm。
  <https://www.biwintechnology.com/product/tau208-automotive-ufs-3-1/>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/biwin-ufs-token.json`
- `vendor.biwin.ufs.v1`
- `vendor.biwin.ufs31.v1`
- `vendor.biwin.ufs31.automotive.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWU2A` + 配置 + 容量 | BIWIN UFS 2.2 |
| `BWU3A` + 配置 + 容量 | BIWIN 消费级 UFS 3.1 |
| `TCUFMA` + 容量 + `NAC8` | BIWIN TAU208 车规 UFS 3.1 |
| 配置 `0516B/0526B/0546B/NY46B` | 官方订购编码表配置编码段 |
| 容量 `064G/128G/256G/512G` | 64GB~512GB，落库为 Mbit |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `BWU2A0526B128G`
- `BWU3AKG26D256G`
- `TCUFMA512GNAC8`
