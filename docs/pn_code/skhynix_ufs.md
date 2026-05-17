# SK hynix UFS PN 编码资料

采集日期：2026-05-11

本文档记录 SK hynix UFS 料号的公开资料、规则库抽象和 testcase 覆盖点。实现禁止按完整 PN 白名单匹配，应按结构切 token，再用规则库解释已知 token；未知 token 应保留已能解析的字段。

## 来源

- SK hynix UFS3.1 3D V7 datasheet mirror 给出 `HN8Tx5DxHKX07x` 结构、`HN8`=UFS、`5`=UFS3.1、`K`=Mobile -25~85°C、`T0/T1/T2/T3`=128GB/256GB/512GB/1TB，以及 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079` line-up。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS3.1-3D-V7-Datasheet-128GB-1TB-V1.1.pdf>
- SK hynix ZUFS 4.1 官方新闻稿确认 ZUFS 4.1 已开始供应；新闻图正面 marking 为 `HN8T274EJKX130`，背面 ball map 可确认 `153FBGA`。
  <https://news.skhynix.com/sk-hynix-begins-supplying-mobile-nand-solution-zufs-4-1/>
- SK hynix UFS 2.1 分销页给出 `H28SAO301MMR`，类型 UFS、Sub-Type UFS 2.1、FBGA、512GB；同页相关型号列出 `H28S6D302BMR` 32GB / `H28S8Q302CMR` 128GB。
  <https://www.preduo.com/product/ufs/ufs-2-1/h28sao301mmr>
- SK hynix UFS brochure 当前公开页只适合确认 UFS 4.0 / automotive UFS 3.1/2.1 产品定位，不能单独作为 PN 解析规则来源。
  <https://pdf.directindustry.com/pdf/sk-hynix/ufs/34497-1045448.html>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/skhynix-ufs-token.json`
- 规则 ID：
  - `vendor.skhynix.ufs.hn8.v1`
  - `vendor.skhynix.ufs.h28s.v1`
- testcase：`packages/core/test/decodepack/managed-nand.test.ts`

Preduo 等灰市 / 分销页可信度低于原厂新闻图、原厂 datasheet 和实机同一完整料号证据；不能用近似料号或分销页字段覆盖同一完整料号的更高权重证据。

## HN8 UFS / ZUFS 结构

| PN 结构 | 字段 |
| --- | --- |
| `HN8` + density token + series(2) + package(1) + temp(1) + feature(1) + serial(3) + optional suffix | SK hynix UFS |
| prefix `HN8` | UFS |
| density `G96` | 64GB |
| density `T05/T06` | 128GB |
| density `T15/T16` | 256GB |
| density `T25/T27` | 512GB |
| density `T35/T37` | 1TB |
| series `2E/DE/DZ` | UFS 3.1, 176-layer 4D NAND (V7) |
| series `4E` | ZUFS 4.1, official image confirmed |
| series `4Z` | ZUFS 4.1 variant, inferred from same-part real-device protocol evidence |
| package `H/J` | 153FBGA |
| temp `K` | Mobile, -25~85°C |
| feature `X` | Reserved |
| serial `130/141/...` | product serial / revision, retained structurally and not decoded |
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
| `fields.product_version` / `fields.storage_interface` | `UFS 3.1` / `UFS 4.1` | `UFS 2.1` |
| `fields.die_codename` | `HYV7` | HN8 series `2E` / `DE` / `DZ` 标准化为 SK hynix 4D V7 |
| `fields.layer_count` | `176` | 随 `HYV7` profile 补出 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `HN8T25DEHKX077N` | UFS, 512GB, UFS 3.1, `HYV7`, 176L, Mobile, Mass Production |
| `HN8T35DZHKX079` | UFS, 1TB, UFS 3.1, `HYV7`, 176L, Mobile |
| `HN8G962EHKX037N` | UFS, 64GB, UFS 3.1, `HYV7`, 176L |
| `HN8T274EJKX130` | ZUFS 4.1, 512GB, 153FBGA, Mobile |
| `HN8T374ZJKX141` | ZUFS 4.1, 1TB, 153FBGA, Mobile; `141` 只作为 serial 保留 |
| `H28SAO301MMR` | UFS 2.1, 512GB, FBGA |
| `H28S8Q302CMR` | UFS 2.1, 128GB, FBGA |

## 已知缺口

- HN8 的 product serial 暂不解释，只作为结构位保留；例如 `X130` / `X141` 不作为完整语义 token 解码。
- H28S 当前只根据公开分销资料确认 UFS 2.1 和容量映射，电压、温区、package variant 仍需原厂 ordering table。
- 灰市/分销页常见 `H9HQ...` 多为 uMCP (UFS + LPDDR)，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不能直接当作纯 UFS parser。
