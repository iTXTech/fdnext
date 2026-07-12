# YMTC eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- YMTC EC000 / EC110 eMMC flyer 给出 `YMEC6A2TB1A2C3`、`YMEC7A2TB2A2C3`、`YMEC8A2TB3A2C3` 样本，确认 eMMC 5.1、BGA-153 11.5x13x1.0、32GB/64GB/128GB 容量。
  <https://xcc2.oss-cn-shenzhen.aliyuncs.com/wareDetailPdf/1450014708439912450.pdf>
- 同一 flyer 的 EC000 ordering 表另给出 8GB `YMEC4A1MA1A2C1` 与 16GB `YMEC5A1MA2A2C1`，确认 `A1/M/A/A2/C1` token family；两枚 PN 补入搜索资源。
- YMTC EC150 官方页确认 eMMC 5.1、64GB/128GB/256GB、BGA-153 11.5x13 封装和 Xtacking 4.0 产品线。
  <https://www.ymtc.com/en/products/46.html?cat=38>
- EC150 64GB 实物评测确认 `YMEC7C0TG1A2C3`；外部料号表列出同结构的 128GB `YMEC8C0TG2A2C3` 和 256GB `YMEC9C0TG3A2C3`，与官方容量矩阵一致，用于建立 `C0/G` token family。exact PN 只进入搜索资源和 testcase。
  <https://inf.news/en/digital/e6c5d7543d875b550ba31c8fe31ecab0.html>
  <https://gloneo.com/h-nd-1169.html>
- EC230 datasheet 页面确认 64/128/256GB、eMMC 5.1 与 BGA-153 11.5x13x1.0；QVL/JLC/设备资料分别确认 `YMEC7B0TE1A2C3`、`YMEC8B0TE2A2C3`、`YMEC9B0TE3A2C3`。现有 `B0/E/A2` token 已能解析，仅补完整搜索矩阵和 `product_family` 语义。
  <https://bbs.16rd.com/misc.php?id=48054&mod=citiao&type=data_download>
  <https://cp.synaptics.com/cognidox/download/NR-154842-TC-APPROVED.pdf>
  <https://jlcpcb.com/partdetail/JLCPCBAssembly-YMEC8B0TE2A2C3/C9900054816>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/ymtc-emmc-token.json`
  - `vendor.ymtc.emmc-label.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `YMEC` + density(1) + controller(2) + cell(1) + generation(1) + die stack(1) + package(2) + class/temp(2) | YMTC eMMC label |
| density `4..A` | 8GB 到 512GB，输出 `density` |
| controller `A1/A2/B0/C0` | EC000 / EC110 / EC230 / EC150 controller token |
| cell `M/T` | MLC / TLC |
| generation `A/B/C/E/G` | generation token；`G` 对应 EC150 Xtacking 4.0 family |
| package `A2` | BGA-153 11.5x13x1.0 |
| suffix `C1/C3` | Commercial product class + operating temperature |

## 输出字段

- `controller`
- `density`
- `storage_interface`
- `product_family`
- `die_count`
- `product_class`
- `operation_temperature`

## 测试样例

- `YMEC6A1TC1A2C1`
- `YMEC8A2TB3A2C3`
- `YMEC9C0TG3A2C3`
- `YMEC9B0TE3A2C3`

## 注意

EC000 / EC110 flyer 中出现的样本进入 testcase。EC150 的具体 PN 由官方产品矩阵、实物 marking 与外部料号表多源确认；decoder 仍只按 token 解析。
可信度、来源和外部确认状态只保留在 `evidence/decodepack-references.json` 与本文档中，不得放入 iTXTech fdnext DecodePack 或输出到 `fields`。
