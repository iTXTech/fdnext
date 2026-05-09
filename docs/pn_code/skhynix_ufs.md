# SK hynix UFS PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix UFS 料号的公开资料、规则库抽象和 testcase 覆盖点。实现禁止按完整 PN 白名单匹配，应按结构切 token，再用规则库解释已知 token；未知 token 应保留已能解析的字段。

## 来源

- SK hynix UFS3.1 3D V7 datasheet mirror 给出 `HN8Tx5DxHKX07x` 结构、`HN8`=UFS、`5`=UFS3.1、`K`=Mobile -25~85°C、`T0/T1/T2/T3`=128GB/256GB/512GB/1TB，以及 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079` line-up。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS3.1-3D-V7-Datasheet-128GB-1TB-V1.1.pdf>
- SK hynix UFS 2.1 分销页给出 `H28SAO301MMR`，类型 UFS、Sub-Type UFS 2.1、FBGA、512GB；同页相关型号列出 `H28S6D302BMR` 32GB / `H28S8Q302CMR` 128GB。
  <https://www.preduo.com/product/ufs/ufs-2-1/h28sao301mmr>
- SK hynix UFS brochure 当前公开页只适合确认 UFS 4.0 / automotive UFS 3.1/2.1 产品定位，不能单独作为 PN 解析规则来源。
  <https://pdf.directindustry.com/pdf/sk-hynix/ufs/34497-1045448.html>

## 规则入口

- 规则文件：`packages/dsl/src/rules/packs/skhynix-ufs-token.json`
- 规则 ID：
  - `vendor.skhynix.ufs.hn8.v1`
  - `vendor.skhynix.ufs.h28s.v1`
- testcase：`packages/dsl/test/managed-nand.test.ts`

## HN8 UFS 3.1 结构

| PN 结构 | 字段 |
| --- | --- |
| `HN8` + density token + series(2) + package(1) + temp(1) + feature(1) + serial(3) + optional suffix | SK hynix UFS |
| prefix `HN8` | UFS |
| density `G96` | 64GB |
| density `T05/T06` | 128GB |
| density `T15/T16` | 256GB |
| density `T25` | 512GB |
| density `T35` | 1TB |
| series `2E/DE/DZ` | UFS 3.1, 176-layer 4D NAND (V7) |
| package `H` | 153FBGA |
| temp `K` | Mobile, -25~85°C |
| feature `X` | Reserved |
| suffix `N` | Mass Production |

## H28S UFS 2.1 结构

| PN 结构 | 字段 |
| --- | --- |
| `H28S` + density(1) + product serial(7) | SK hynix older UFS 2.1 |
| density `6` | 32GB |
| density `7` | 64GB |
| density `8` | 128GB |
| density `9` | 256GB |
| density `A` | 512GB |
| package | 当前规则输出 `FBGA` |

## 输出字段

| 输出字段 | HN8 | H28S |
| --- | --- | --- |
| `vendor` | `skhynix` | `skhynix` |
| `type` | `ufs` | `ufs` |
| `density` | 按 density token 映射为 Mbit | 按 density token 映射为 Mbit |
| `voltage` | `Vcc: 2.5V, VccQ: 1.2V` | 未确认，输出 `Unknown` |
| `package` | `153FBGA` | `FBGA` |
| `fields.group` | `UFS` | `UFS` |
| `fields.product_version` | `UFS 3.1` | `UFS 2.1` |
| `fields.generation_info` | `176-layer 4D NAND (V7)` | 未确认 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `HN8T25DEHKX077N` | UFS, 512GB, UFS 3.1, V7, Mobile, Mass Production |
| `HN8T35DZHKX079` | UFS, 1TB, UFS 3.1, V7, Mobile |
| `HN8G962EHKX037N` | UFS, 64GB, UFS 3.1, V7 |
| `H28SAO301MMR` | UFS 2.1, 512GB, FBGA |
| `H28S8Q302CMR` | UFS 2.1, 128GB, FBGA |

## 已知缺口

- HN8 的 product serial 暂不解释，只作为结构位保留。
- H28S 当前只根据公开分销资料确认 UFS 2.1 和容量映射，电压、温区、package variant 仍需原厂 ordering table。
- 灰市/分销页常见 `H9HQ...` 多为 uMCP (UFS + LPDDR)，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不能直接当作纯 UFS parser。
