# BIWIN UFS PN 编码

采集日期：2026-07-11

## 外部资料

- BIWIN UFS 2.2 页面给出 UFS 2.2、64GB~512GB、顺序读写 1000/800 MB/s、FBGA153 和 ordering table。
  <https://www.biwintechnology.com/product/ufs-2-2/>
- BIWIN UFS 3.1 页面和规格表给出 `BWU3A` ordering、128GB~512GB、2100/1800 MB/s、FBGA153、11.50 x 13.00 mm。
  <https://www.biwintechnology.com/product/ufs-3-1/>
- BIWIN TAU208 车规 UFS 3.1 页面给出 `TCUFMA` ordering、3D TLC、HS-Gear4 2L、AEC-Q100 Grade 2、FBGA153 和 11.50 x 13.00 x 1.20 mm。
  <https://www.biwintechnology.com/product/tau208-automotive-ufs-3-1/>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/biwin-ufs-token.json`
- `vendor.biwin.ufs.v1`
- `vendor.biwin.ufs31.v1`
- `vendor.biwin.ufs31.automotive.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWU2A` + config + density | BIWIN UFS 2.2 |
| `BWU3A` + config + density | BIWIN 消费级 UFS 3.1 |
| `TCUFMA` + density + `NAC8` | BIWIN TAU208 车规 UFS 3.1 |
| config `0516B/0526B/0546B/NY46B` | 官方 ordering table config token |
| density `064G/128G/256G/512G` | 64GB~512GB，落库为 Mbit |

## 输出字段

- `density`
- `storage_interface`
- `speed_grade`
- `product_class`
- `operation_temperature`

## 测试样例

- `BWU2A0526B128G`
- `BWU3AKG26D256G`
- `TCUFMA512GNAC8`
