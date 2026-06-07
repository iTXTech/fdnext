# SK hynix UFS PN 编码资料

采集日期：2026-05-11

本文档记录 SK hynix UFS 料号的公开资料、规则库抽象和 testcase 覆盖点。实现禁止按完整 PN 白名单匹配，应按结构切 token，再用规则库解释已知 token；未知 token 应保留已能解析的字段。

## 来源

- SK hynix UFS3.1 3D V7 datasheet mirror 给出 `HN8Tx5DxHKX07x` 结构、`HN8`=UFS、`5`=UFS3.1、`K`=Mobile -25~85°C、`T0/T1/T2/T3`=128GB/256GB/512GB/1TB，以及 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079` line-up。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS3.1-3D-V7-Datasheet-128GB-1TB-V1.1.pdf>
- SK hynix Automotive UFS3.1 3D V7 datasheet mirror 给出 `HN8Tx5DxHxXxxx` ordering information、153-ball JEDEC FBGA、package size `11.5 x 13.0 x 1.2`，并区分 `Q`=AAT -40~105°C、`V`=AIT -40~95°C。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-Automotive-UFS3.1-3D-V7-Datasheet_Ver1.1.pdf>
- SK hynix UFS2.2 3D V6 datasheet mirror 给出 `HN8xx61ZGKX0xx` line-up：`HN8G961ZGKX031` / `HN8T061ZGKX012` / `HN8T161ZGKX013` / `HN8T261ZGKX014`，Package Type `153FBGA`，PKG size `11.5 x 13.0 x 1.0`，Vcc `2.7V - 3.6V`，Vccq2 `1.7V - 1.95V`。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS2.2-3D-V6-Datasheet-64-512GB-V1.0.pdf>
- SK hynix UD310/UD220 e-catalogue mirror 给出 176-layer V7 UFS line-up：UD310 UFS3.1 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079`，UD220 UFS2.2 `HN8G962EHKX037` / `HN8T062EHKX039` / `HN8T162EHKX041`。
  <https://dfsimg1.hqewimg.com/group6/M00/01/65/wKhk6WfNRF2AFcUlAB1op25VokQ315.pdf>
- SK hynix ZUFS 4.1 官方新闻稿确认 ZUFS 4.1 已开始供应；新闻图正面 marking 为 `HN8T274EJKX130`，背面 ball map 可确认 `153FBGA`。
  <https://news.skhynix.com/sk-hynix-begins-supplying-mobile-nand-solution-zufs-4-1/>
- SK hynix UFS 2.1 分销页给出 `H28SAO301MMR`，类型 UFS、Sub-Type UFS 2.1、FBGA、512GB；同页相关型号列出 `H28S6D302BMR` 32GB / `H28S8Q302CMR` 128GB。
  <https://www.preduo.com/product/ufs/ufs-2-1/h28sao301mmr>
- SK hynix NAND Flash Databook Q1'2016 mirror 给出 H28U UFS2.0 line-up：32GB / 64GB / 128GB、1xnm / 3D-V2、base component density、stack、1 & 2Lane 和 package size。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>
- SK hynix UFS brochure 当前公开页只适合确认 UFS 4.0 / automotive UFS 3.1/2.1 产品定位，不能单独作为 PN 解析规则来源。
  <https://pdf.directindustry.com/pdf/sk-hynix/ufs/34497-1045448.html>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/skhynix-ufs-token.json`
- 规则 ID：
  - `vendor.skhynix.ufs.hn8.automotive-ufs31.v1`
  - `vendor.skhynix.ufs.hn8.mobile-ufs31.v1`
  - `vendor.skhynix.ufs.hn8.ufs22-v7.v1`
  - `vendor.skhynix.ufs.hn8.ufs22-v6.v1`
  - `vendor.skhynix.ufs.hn8.zufs41.v1`
  - `vendor.skhynix.ufs.h28u.v1`
  - `vendor.skhynix.ufs.h28s.v1`
- testcase：`packages/core/test/decodepack/part-number/skhynix.test.ts`

Preduo 等灰市 / 分销页可信度低于原厂新闻图、原厂 datasheet 和实机同一完整料号证据；不能用近似料号或分销页字段覆盖同一完整料号的更高权重证据。

## HN8 UFS / ZUFS 结构

| PN 结构 | 字段 |
| --- | --- |
| UD310: `HN8` + density(2) + interface(1) + NAND info(1) + package type(1) + generation(1) + temp(1) + feature(1) + serial(3) + optional suffix | SK hynix UFS3.1 |
| Automotive UFS3.1: `HN8` + density(2) + interface(1) + NAND info(1) + package type(1) + controller generation(1) + temp grade(1) + feature(1) + serial(3) + optional suffix | SK hynix Automotive UFS3.1 |
| UD220 / UC220 / ZUFS: `HN8` + density(3) + interface(1) + package type(1) + generation(1) + temp(1) + feature(1) + serial(3) + optional suffix | SK hynix UFS |
| prefix `HN8` | UFS |
| UD310 density `T0/T1/T2/T3` | 128GB / 256GB / 512GB / 1TB |
| Automotive density `G9/T0/T1/T2` | 64GB / 128GB / 256GB / 512GB |
| UFS2.2 density `G96/T06/T16/T26` | 64GB / 128GB / 256GB / 512GB |
| ZUFS density `T27/T37` | 512GB / 1TB |
| interface `5` | UFS 3.1 |
| interface `2` | UFS 2.2 UD220 |
| interface `1` | UFS 2.2 UC220 |
| interface `4` | ZUFS 4.1 |
| NAND info `D` | UFS3.1 V7 NAND information |
| package type `E/Z` | WFBGA / VFBGA when confirmed by ordering table; otherwise retained as an internal token |
| package type `J` | Automotive UFS3.1 TFBGA |
| generation `H` | 4th generation in UFS3.1 ordering table; UD220 maps to 176-layer V7 from line-up |
| generation `G` | UC220 generation token, retained internally |
| generation `J` | ZUFS 4.1 generation token |
| temp `K` | Mobile, -25~85°C |
| temp `Q/V` | Automotive AAT -40~105°C / Automotive AIT -40~95°C |
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

## H28U UFS 2.0 结构

| PN 结构 | 字段 |
| --- | --- |
| `H28U` + density(1) + component(4) + package/config(3) | SK hynix older UFS 2.0 |
| density `6/7/8` | 32GB / 64GB / 128GB |
| component `4222/8222/6222` | 1xnm, 64Gb die, 4/8/16-die |
| component `4201/8201` | 3D-V2, 128Gb die, 4/8-die |
| package/config `MMR/AMR` | 11.5x13x1.0mm |
| package/config `MCR` | 11.5x13x1.2mm |
| interface | UFS 2.0, 1-lane / 2-lane |

## 输出字段

| 输出字段 | HN8 / H28U | H28S |
| --- | --- | --- |
| `vendor` | `skhynix` | `skhynix` |
| `type` | `ufs` | `ufs` |
| `density` | 按 density token 映射为 Mbit | 按 density token 映射为 Mbit |
| `voltage` | UD310: `Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V`; UD220: `Vcc: 3.3V, VccQ: 1.8V`; UC220: `Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V`; Automotive UFS3.1 暂不输出；ZUFS fallback 保留既有资料 | 未确认，输出 `Unknown` |
| `package` | UD310: `153FBGA 11.0x13.0x0.8 WFBGA` / `153FBGA 11.0x13.0x1.0 VFBGA`; Automotive: `153-ball JEDEC FBGA 11.5x13.0x1.2 TFBGA`; UD220: `153FBGA 11.5x13.0x0.8`; UC220: `153FBGA 11.5x13.0x1.0` | `FBGA` |
| `fields.product_version` / `fields.storage_interface` | `UFS 2.0` / `UFS 2.2` / `UFS 3.1` / `UFS 4.1` | `UFS 2.1` |
| `fields.die_codename` | UD310 / UD220 / Automotive UFS3.1 标准化为 `HYV7`；UC220 暂不输出 die codename | HN8 series `2E` / `DE` / `DZ` 标准化为 SK hynix 4D V7 |
| `fields.layer_count` | `176` | 随 `HYV7` profile 补出 |
| `fields.generation_info` / `fields.die_density` / `fields.die_count` | H28U 输出 `1xnm NAND` / `3D-V2 NAND`、64Gb / 128Gb die 与 4/8/16 die count | H28S 暂不输出 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `HN8G95DJHQX148` | Automotive UFS3.1, 64GB, AAT -40~105°C, `HYV7`, 176L |
| `HN8T25DJHVX111` | Automotive UFS3.1, 512GB, AIT -40~95°C, `HYV7`, 176L |
| `HN8T25DEHKX077N` | UD310, 512GB, UFS 3.1, `HYV7`, 176L, Mobile, Mass Production |
| `HN8T35DZHKX079` | UD310, 1TB, UFS 3.1, `HYV7`, 176L, Mobile |
| `HN8G962EHKX037N` | UD220, 64GB, UFS 2.2, `HYV7`, 176L |
| `HN8T062EHKX039` | UD220, 128GB, UFS 2.2, `HYV7`, 176L |
| `HN8T162EHKX041` | UD220, 256GB, UFS 2.2, `HYV7`, 176L |
| `HN8G961ZGKX031` | UC220, 64GB, UFS 2.2, 153FBGA 11.5x13.0x1.0 |
| `HN8T261ZGKX014` | UC220, 512GB, UFS 2.2, 153FBGA 11.5x13.0x1.0 |
| `HN8T274EJKX130` | ZUFS 4.1, 512GB, 153FBGA, Mobile |
| `HN8T374ZJKX141` | ZUFS 4.1, 1TB, 153FBGA, Mobile; `141` 只作为 serial 保留 |
| `H28SAO301MMR` | UFS 2.1, 512GB, FBGA |
| `H28S8Q302CMR` | UFS 2.1, 128GB, FBGA |
| `H28U64222MMR` | UFS 2.0, 32GB, 1xnm, 64Gb x4, 11.5x13x1.0mm |
| `H28U86222MCR` | UFS 2.0, 128GB, 1xnm, 64Gb x16, 11.5x13x1.2mm |
| `H28U88201AMR` | UFS 2.0, 128GB, 3D-V2, 128Gb x8, 11.5x13x1.0mm |

## 已知缺口

- HN8 的 product serial 暂不解释，只作为结构位保留；例如 `037` / `073` / `130` / `141` 不作为完整语义 token 解码。
- H28U 只按 Q1'2016 line-up 输出 UFS2.0、容量、base component、stack 和尺寸；package ball count、温区与 controller revision 仍未拆出。
- H28S 当前只根据公开分销资料确认 UFS 2.1 和容量映射，电压、温区、package variant 仍需原厂 ordering table。
- 灰市/分销页常见 `H9HQ...` 多为 uMCP (UFS + LPDDR)，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不能直接当作纯 UFS parser。
