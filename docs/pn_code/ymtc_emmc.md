# YMTC eMMC PN 编码

采集日期：2026-05-08

## 外部资料

- YMTC EC000 / EC110 eMMC flyer 给出 `YMEC6A2TB1A2C3`、`YMEC7A2TB2A2C3`、`YMEC8A2TB3A2C3` 样本，确认 eMMC 5.1、BGA-153 11.5x13x1.0、32GB/64GB/128GB 容量。
  <https://xcc2.oss-cn-shenzhen.aliyuncs.com/wareDetailPdf/1450014708439912450.pdf>
- YMTC EC150 官方页确认 eMMC 5.1、64GB/128GB/256GB、BGA-153 11.5x13 封装和 Xtacking 4.0 产品线。
  <https://www.ymtc.com/en/products/46.html?cat=38>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/ymtc-emmc-token.json`
  - `vendor.ymtc.emmc-label.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `YMEC` + density(1) + controller(2) + cell(1) + generation(1) + die stack(1) + package(2) + class/temp(2) | YMTC eMMC label |
| density `4..A` | 8GB 到 512GB，输出 `storage_density` |
| controller `A1/A2/B0` | EC000 / EC110 / EC230 controller token |
| cell `M/T` | MLC / TLC |
| generation `A/B/C/E` | X0 / X1 / X2 / X3 process token |
| package `A2` | BGA-153 11.5x13x1.0 |
| suffix `C1/C3` | Commercial product class + operating temperature |

## 输出字段

- `controller`
- `storage_density`
- `storage_interface`
- `product_family`
- `die_stack`
- `product_class`
- `operation_temperature`

## 测试样例

- `YMEC6A1TC1A2C1`
- `YMEC8A2TB3A2C3`

## 注意

EC000 / EC110 flyer 中出现的样本进入 testcase。EC150 官方页只确认产品线、接口、容量和封装范围；若后续要扩展 EC150 具体 PN，需要公开 ordering table 或多源一致样本。
可信度 metadata 只保留在 DSL `tables.reference`，不得输出到 `extraInfo`。
