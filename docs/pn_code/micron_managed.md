# Micron Managed NAND PN 编码

采集日期：2026-05-08

本文档记录 Micron `MTFC` 共享结构和未知组合 fallback。eMMC 与 UFS 细节分别见 [micron_emmc.md](micron_emmc.md) 和 [micron_ufs.md](micron_ufs.md)。

## 外部资料

- Micron 官方 e.MMC Standalone Part Numbering System 给出新版 `MT FC 2G AA AA M2 - xx xx ES` 结构、容量、温区、NAND component、controller revision、package code 和 special option 表。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A2e014e65-e44b-4558-931b-e5ebc6b7de00/renditions/original/as/numnextgenemmc.pdf>
- Micron 官方 Flash + Controller Part Numbering System 给出旧版 e-MMC/custom card `MT FC 2G A A M2 - xx ES` 结构。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac81e5b7e-6c40-4314-afc8-067c0034c12e/original/as/numemmc.pdf>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>

## 规则状态

DSL:

- `packages/dsl/src/rules/packs/micron-managed-token.json`
- `vendor.micron.managed.mtfc.nextgen.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | 新版 Flash + Controller / e.MMC / UFS |
| density `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` | 512MB 到 1TB，落库为 Mbit |
| component token | NAND component，包含 width / component density / generation 线索 |
| controller token | controller revision 或 managed family 判定线索 |
| package token | package code |
| temp suffix `CT/WT/IT/AIT/AAT/AITI` | Commercial / Standard / Extended / Industrial 温区 |

## 输出字段

- `nand_component`
- `controller_code`
- `package_code`
- `component_width`
- `component_density`
- `generation_info`
- `controller_revision`
- `product_family`
- `product_version`
- `operation_temperature`

## 测试样例

- `MTFC256GZZZZZZ-WT`

## 注意

`MTFC` 同时覆盖 e.MMC 与 UFS，不能只靠前缀判断类型。实现中先按结构切 token，再用 `component:controller` 和 component 表推导 `type`；未知组合返回 `nandcon`，并保留 component/controller/package code 与容量。
