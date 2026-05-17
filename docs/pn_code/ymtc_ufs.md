# YMTC UFS PN 编码

采集日期：2026-05-08

## 外部资料

- YMTC UFS embedded memory 页面列出 UC260 UFS 2.2 与 UC341 UFS 3.1 产品入口。
  <https://www.ymtc.com/en/buslist.html?cat=39>
- YMTC UC260 官方页确认 UFS 2.2、128GB/256GB/512GB、BGA-153 11.5x13.0x0.8。
  <https://www.ymtc.com/en/products/45.html?cat=39>
- 公开搜索可见 UC341 UFS 3.1 flyer 转载资料，但当前未找到可直接下载的官方英文 ordering table；因此不新增 UC341 具体 PN 样本。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/ymtc-ufs-token.json`
  - `vendor.ymtc.ufs-label.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `YMUS` + density(1) + controller(2) + cell(1) + generation(1) + die stack(1) + package(2) + class/temp(2) | YMTC UFS label |
| density `6..A` | 32GB 到 512GB，输出 `storage_density` |
| controller `A1` | UFS 3.1 controller token |
| controller `A4/B2` | UFS 2.2 controller token |
| cell `T/Q` | TLC / QLC |
| generation `B/C/E` | X1 / X2 / X3 process token |
| package `A2/D1/D2` | BGA-153 package variants |
| suffix `C1` | Commercial product class + operating temperature |

## 输出字段

- `controller`
- `storage_density`
- `storage_interface`
- `die_stack`
- `product_class`
- `operation_temperature`

## 测试样例

- `YMUS8A1TC1A2C1`

## 注意

本轮只用 YMTC 官方产品页补强 `storage_interface` 与 `storage_density` 等 canonical 字段，不把 UC341 转载资料中的未验证 ordering 信息扩展成新 iTXTech fdnext DecodePack 样本。
可信度 metadata 只保留在 iTXTech fdnext DecodePack `tables.reference`，不得输出到 `fields`。
