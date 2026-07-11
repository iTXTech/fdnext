# YMTC UFS PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- YMTC UFS embedded memory 页面列出 UC260 UFS 2.2 与 UC341 UFS 3.1 产品入口。
  <https://www.ymtc.com/en/buslist.html?cat=39>
- YMTC UC260 官方页确认 UFS 2.2、128GB/256GB/512GB、BGA-153 11.5x13.0x0.8。
  <https://www.ymtc.com/en/products/45.html?cat=39>
- YMTC UC114 官方 flyer 给出完整 32/64/128/256GB ordering PN：`YMUS6A4TB1A2C1`、`YMUS7A4TB2A2C1`、`YMUS8A4TB3A2C1`、`YMUS9A4TB4A2C1`。
  <https://www.ymtc.com/en/resources/file/20211206/d1dcb33354659b1f7787eafd8b721224.pdf>
- UC234 datasheet 页面确认 64/128/256GB UFS 2.2；实机日志与器件清单确认 `YMUS7B2TE1A2C1`、`YMUS8B2TE2A2C1`、`YMUS9B2TE3A2C1`，与现有 `B2/E/A2` token 结构一致。
  <https://bbs.16rd.com/misc.php?id=59631&mod=citiao&type=data_download>
  <https://xunfengda.com/product/%E6%89%8B%E6%9C%BA%E5%B9%B3%E6%9D%BF%E5%B8%B8%E7%94%A8%E5%AD%98%E5%82%A8%E5%9E%8B%E5%8F%B7%E5%AE%B9%E9%87%8F%E5%AF%B9%E7%85%A7%E8%A1%A8>
- UC023/早期 UFS 3.1 的 `YMUS8A1TC2A2C1`、`YMUS9A1TC3A2C1`、`YMUSAA1TC4A2C1` 由器件表、分销页及实机 UFS 日志交叉确认，只补入现有 `A1/C/A2` token family 的搜索矩阵。
  <https://www.sbit.com.tw/en/all_products.aspx?_id=330000570&_page=2&_type=class>
  <https://www.martview-forum.com/threads/honor-90-smart-clk-nx3-direct-unlock-network-ok-it%C2%B4s-world-first.135767/>
- UC260 512GB 实物评测确认 marking `YMUSAB5TH3A1C1`；256GB 兼容性评测确认 `YMUS9B5TH2A1C1`；烧录器支持表确认 128GB `YMUS8B5TH1A1C1`。三者与官方容量矩阵一致，用于确认 `B5/H/A1` token family，不作为 decoder 的完整 PN 查表。
  <https://www.chongdiantou.com/archives/1750673967856.html>
  <https://h5.ifeng.com/c/vivo/v0023jyFiTK83fjMj4WvYyyWjWjGX-_TSCgzpRsKUJjBWHgY__?isNews=1&showComments=0>
  <https://falcon-denshi.co.jp/wp/wp-content/uploads/ALL300GU2_20260623.pdf>
- YMTC UC341 官方页确认 UFS 3.1、Xtacking 3.0 TLC 以及 128/256/512GB 容量矩阵；实物拆解、UFS 设备日志与烧录器表分别确认 `YMUSAB4TF3D1C1`、`YMUS9B4TF2D1C1`、`YMUS8B4TF1D1C1`，共同建立 `B4/F/D1` token family。exact PN 仅进入搜索资源和 testcase。
  <https://www.ymtc.com/cn/products/56.html?cat=39>
  <https://post.smzdm.com/p/a2qdz0mn/>
  <https://forum.gsmhosting.com/vbb/f672/update-add-supported-ufs-ymtc-3433914/>
  <https://falcon-denshi.co.jp/wp/wp-content/uploads/ALL300GU2_20260623.pdf>
- 公开搜索可见 UC341 UFS 3.1 flyer 转载资料，但当前未找到可直接下载的官方英文 ordering table；因此不新增 UC341 具体 PN 样本。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/ymtc-ufs-token.json`
  - `vendor.ymtc.ufs-label.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `YMUS` + density(1) + controller(2) + cell(1) + generation(1) + die stack(1) + package(2) + class/temp(2) | YMTC UFS label |
| density `6..A` | 32GB 到 512GB，输出 `density` |
| controller `A1` | UFS 3.1 controller token |
| controller `A4/B2/B5` | UFS 2.2 controller token；`B5` 为 UC260 |
| controller `A1/B4` | UFS 3.1 controller token；`B4` 为 UC341 |
| cell `T/Q` | TLC / QLC |
| generation `B/C/E/F/H` | generation token；只有已确认映射才输出 process alias；`F` 与 UC341 Xtacking 3.0 family 对应 |
| package `A1/A2/D1/D2` | BGA-153 package variants；`A1` 为 11.5x13x0.8 |
| suffix `C1` | Commercial product class + operating temperature |

## 输出字段

- `controller`
- `density`
- `storage_interface`
- `die_count`
- `product_class`
- `operation_temperature`

## 测试样例

- `YMUS8A1TC1A2C1`
- `YMUSAB5TH3A1C1`
- `YMUSAB4TF3D1C1`

## 注意

本轮只用 YMTC 官方产品页补强 `storage_interface` 与 `density` 等 canonical 字段，不把 UC341 转载资料中的未验证 ordering 信息扩展成新 iTXTech fdnext DecodePack 样本。
可信度 metadata 只保留在 iTXTech fdnext DecodePack `tables.reference`，不得输出到 `fields`。
