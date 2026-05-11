# SanDisk iSSD PN 编码

采集日期：2026-05-11

## 外部资料

- Western Digital / SanDisk RoHS declaration: `SDIS5BK-XXXX` 被列为 SanDisk iSSD 产品。
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/collateral/cert/rohs/SDIS5BK-XXXX%20SanDisk%20RoHS%20DoC.pdf>
- SBIT product listing: `SDIS5BK-032G` 描述为 32GB SSD i100 SATA 6Gb/s。
  <https://www.sbit.com.tw/tw/productsearch.aspx?_searchtext=SDIS5BK-032G>
- SBIT SSD listing: `SDIS6BM-016G` 描述为 16GB SSD ISSD i110 SATA，`SDIS5BK-016G` 描述为 16GB SSD ISSD，`SDIS5BK-008G` 描述为 8GB SSD ISSD。
  <https://www.sbit.com.tw/en/all_products.aspx?_id=330000792&_type=class>
- Jotrin product listing: `SDIS4BH-008G/032G/064G` 描述为 ISSD-SATA / MTR-5 family。
  <https://www.jotrin.com/product/parts/SDIS5BK_016G>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/sandisk-issd-token.json`
- `vendor.sndk.issd.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `SDIS` + family + `-` + capacity + optional suffix | SanDisk iSSD |
| family `4BH` | iSSD SATA / MTR-5 |
| family `5BK` | iSSD i100, SATA 6Gb/s |
| family `6BM` | iSSD i110, SATA |
| capacity `4G/8G/16G/24G/32G/64G/120G/128G` | iSSD 容量，落库为 Mbit |

输出分类：

| 字段 | 输出 |
| --- | --- |
| `device.chipKind` | `managed_nand` |
| `device.productType` | `sata` |
| `system` | `iSSD` |

`iSSD` 只作为 SanDisk 产品线 / system 输出，不作为 `product_type`。同类 SSD 封装按接口归类为 `sata` 或 `nvme`；当前 `SDIS` family 资料均归入 SATA。

## 输出字段

- `product_family`
- `storage_interface`
- `system`

## 测试样例

- `SDIS4BH-008G`
- `SDIS5BK-032G`
- `SDIS6BM-016G`

## 注意

未识别的 `SDIS` family 不会落入 SanDisk raw NAND 的 `SD*` 前缀规则。当前 family 解释主要来自公开合规文件、分销页面和本地 PN 形态推断；新增 family 需要先找到外部 evidence 或明确记录推断范围。
