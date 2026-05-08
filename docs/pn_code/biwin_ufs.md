# BIWIN UFS PN 编码

采集日期：2026-05-08

## 外部资料

- BIWIN UFS 2.2 页面给出 UFS 2.2、64GB~512GB、顺序读写 1000/800 MB/s、FBGA153 和 ordering table。
  <https://www.biwintechnology.com/product/ufs-2-2/>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/biwin-ufs-token.json`
- `vendor.biwin.ufs.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `BWU2A` + config + density | BIWIN UFS 2.2 |
| config `0516B/0526B/0546B/NY46B` | 官方 ordering table config token |
| density `064G/128G/256G/512G` | 64GB~512GB，落库为 Mbit |

## 输出字段

- `storage_density`
- `storage_interface`
- `speed_grade`
- `product_class`
- `operation_temperature`

## 测试样例

- `BWU2A0526B128G`
