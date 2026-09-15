# SK hynix UFS PN 编码资料

采集日期：2026-05-11

本文档记录 SK hynix UFS 料号的公开资料、规则库抽象和测试用例覆盖点。规则维护遵循 [PN 编写规范](authoring.md)；未知编码段应保留已能解析的字段。

## 来源

- SK hynix UFS3.1 3D V7 数据手册镜像给出 `HN8Tx5DxHKX07x` 结构、`HN8`=UFS、`5`=UFS3.1、`K`=移动版 -25~85°C、`T0/T1/T2/T3`=128GB/256GB/512GB/1TB，以及 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079` 产品系列。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS3.1-3D-V7-Datasheet-128GB-1TB-V1.1.pdf>
- SK hynix 车规 UFS3.1 3D V7 数据手册镜像给出 `HN8Tx5DxHxXxxx` 订购信息、153 球 JEDEC FBGA、封装尺寸 `11.5 x 13.0 x 1.2`，并区分 `Q`=AAT -40~105°C、`V`=AIT -40~95°C。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-Automotive-UFS3.1-3D-V7-Datasheet_Ver1.1.pdf>
- SK hynix UFS2.2 3D V6 数据手册镜像给出 `HN8xx61ZGKX0xx` 产品系列：`HN8G961ZGKX031` / `HN8T061ZGKX012` / `HN8T161ZGKX013` / `HN8T261ZGKX014`，封装类型 `153FBGA`，PKG 大小 `11.5 x 13.0 x 1.0`，Vcc `2.7V - 3.6V`，Vccq2 `1.7V - 1.95V`。
  <https://www.uttc.com.tw/wp-content/uploads/2025/12/SK-hynix-UFS2.2-3D-V6-Datasheet-64-512GB-V1.0.pdf>
- SK hynix UD310/UD220 电子目录镜像给出 176 层 V7 UFS 产品系列：UD310 UFS3.1 `HN8T05DEHKX073` / `HN8T15DEHKX075` / `HN8T25DEHKX077` / `HN8T35DZHKX079`，UD220 UFS2.2 `HN8G962EHKX037` / `HN8T062EHKX039` / `HN8T162EHKX041`。
  <https://dfsimg1.hqewimg.com/group6/M00/01/65/wKhk6WfNRF2AFcUlAB1op25VokQ315.pdf>
- 上述产品系列中此前搜索资源只保留了 `HN8T25DEHKX077N` / `HN8G962EHKX037N`；本轮补入数据手册 / 电子目录直接列出的无后缀完整 PN `HN8T25DEHKX077` / `HN8G962EHKX037`。两种后缀形态均保留，不覆盖既有量产后缀记录。
- SK hynix 2021 移动版 NAND 目录确认 UC310 是 128 层 V6 UFS3.1，容量为 128GB / 256GB / 512GB，封装尺寸 `11.5 x 13 x 1.0`；公开产品表进一步给出对应 `HN8T05BZGKX015N` / `HN8T15BZGKX016N` / `HN8T25BZGKX017N`、512Gb 单片-容量、FBGA 和 2.5V / 1.2V。Linux GS101 UFS 支持补丁也实机枚举了无 `N` 后缀的 `HN8T05BZGKX015`。精确 PN 产品系列按 `external_table_confirmed` 处理。
  <https://gsma.my.site.com/mwcoem/servlet/servlet.FileDownload?file=00P6900002qWJkkEAG>
  <https://www.skhynix.glochip.com/h-pd-15.html>
  <https://patchew.org/linux/20240404122559.898930-1-peter.griffin%40linaro.org/>
- 上述产品表的可见行还确认 12 条此前缺失的精确搜索 PN：UC220 的 `HN8G961ZGKX031N` / `HN8T061ZGKX012N` / `HN8T161ZGKX013N`，UD220 的 `HN8T062EHKX039N` / `HN8T162EHKX041N`，UD310 的 `HN8T05DEHKX073N` / `HN8T15DEHKX075N` / `HN8T35DZHKX079N`，UD310A 的 `HN8T15DJHQX109N`，UC210 的 `H28S8D301DMR` / `H28S9Q301CMR`，以及 UD210A `HN8T039JHQX099N`。带 `N` 与不带 `N` 的既有记录同时保留；`HN8T039JHQX099N` 只有单一订购编码主体，故仅作为精确搜索种子，不新增等价完整 PN 解码器。
- SK hynix ZUFS 4.1 官方新闻稿确认 ZUFS 4.1 已开始供应；新闻图正面丝印为 `HN8T274EJKX130`，背面球映射可确认 `153FBGA`。
  <https://news.skhynix.com/sk-hynix-begins-supplying-mobile-nand-solution-zufs-4-1/>
- SK hynix UFS 2.1 分销页给出 `H28SAO301MMR`，类型 UFS、子类型 UFS 2.1、FBGA、512GB；同页相关型号列出 `H28S6D302BMR` 32GB / `H28S8Q302CMR` 128GB。
  <https://www.preduo.com/product/ufs/ufs-2-1/h28sao301mmr>
- SK hynix NAND Flash Databook Q1'2016 镜像给出 H28U UFS2.0 产品系列：32GB / 64GB / 128GB、1xnm / 3D-V2、基础芯片容量、堆叠、1 & 2Lane 和封装尺寸。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>
- SK hynix UFS 产品手册当前公开页只适合确认 UFS 4.0 / 车规 UFS 3.1/2.1 产品定位，不能单独作为 PN 解析规则来源。
  <https://pdf.directindustry.com/pdf/sk-hynix/ufs/34497-1045448.html>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/skhynix-ufs-token.json`
- 规则 ID：
  - `vendor.skhynix.ufs.hn8.automotive-ufs31.v1`
  - `vendor.skhynix.ufs.hn8.uc310-v6.v1`
  - `vendor.skhynix.ufs.hn8.mobile-ufs31.v1`
  - `vendor.skhynix.ufs.hn8.ufs22-v7.v1`
  - `vendor.skhynix.ufs.hn8.ufs22-v6.v1`
  - `vendor.skhynix.ufs.hn8.zufs41.v1`
  - `vendor.skhynix.ufs.h28u.v1`
  - `vendor.skhynix.ufs.h28s.v1`
- 测试用例：`packages/core/test/decodepack/part-number/skhynix-managed.test.ts`

Preduo 等灰市 / 分销页可信度低于原厂新闻图、原厂数据手册和实机同一完整料号证据；不能用近似料号或分销页字段覆盖同一完整料号的更高权重证据。

## HN8 UFS / ZUFS 结构

| PN 结构 | 字段 |
| --- | --- |
| UD310: `HN8` + 容量(2) + 接口(1) + NAND 信息(1) + 封装类型(1) + 代际(1) + 温度(1) + 特性(1) + 序列号(3) + 可选后缀 | SK hynix UFS3.1 |
| UC310: `HN8` + 容量(2) + 接口(1) + NAND 信息(1) + 封装类型(1) + 代际(1) + 温度(1) + 特性(1) + 序列号(3) + 可选后缀 | SK hynix 128 层 V6 UFS3.1 |
| 车规 UFS3.1: `HN8` + 容量(2) + 接口(1) + NAND 信息(1) + 封装类型(1) + 控制器代际(1) + 温度等级(1) + 特性(1) + 序列号(3) + 可选后缀 | SK hynix 车规 UFS3.1 |
| UD220 / UC220 / ZUFS: `HN8` + 容量(3) + 接口(1) + 封装类型(1) + 代际(1) + 温度(1) + 特性(1) + 序列号(3) + 可选后缀 | SK hynix UFS |
| 前缀 `HN8` | UFS |
| UD310 容量 `T0/T1/T2/T3` | 128GB / 256GB / 512GB / 1TB |
| UC310 容量 `T0/T1/T2` | 128GB / 256GB / 512GB；512Gb x2 / x4 / x8 |
| 车规容量 `G9/T0/T1/T2` | 64GB / 128GB / 256GB / 512GB |
| UFS2.2 容量 `G96/T06/T16/T26` | 64GB / 128GB / 256GB / 512GB |
| ZUFS 容量 `T27/T37` | 512GB / 1TB |
| 接口 `5` | UFS 3.1 |
| 接口 `2` | UFS 2.2 UD220 |
| 接口 `1` | UFS 2.2 UC220 |
| 接口 `4` | ZUFS 4.1 |
| NAND 信息 `D` | UFS3.1 V7 NAND 信息 |
| NAND 信息 `B` + 代际 `G` | UC310 V6 NAND 信息 / 代际 |
| 封装类型 `E/Z` | 订购表确认时输出 WFBGA / VFBGA，否则仅保留为内部编码段 |
| UC310 封装类型 `Z` | FBGA-153, 11.5x13.0x1.0 |
| 封装类型 `J` | 车规 UFS3.1 TFBGA |
| 代际 `H` | UFS3.1 订购编码表中表示 Gen4；UD220 按产品系列映射为 176 层 V7 |
| 代际 `G` | UC220 代际编码段，仅在内部保留 |
| 代际 `J` | ZUFS 4.1 代际编码段 |
| 温度 `K` | 移动版, -25~85°C |
| 温度 `Q/V` | 车规 AAT -40~105°C / 车规 AIT -40~95°C |
| 特性 `X` | 保留 |
| 序列号 `130/141/...` | 产品序列号 / 修订版，按结构保留，不作解码 |
| 后缀 `N` | 量产 |

## H28S UFS 2.1 结构

| PN 结构 | 字段 |
| --- | --- |
| `H28S` + 容量(1) + 产品序列号(7) | SK hynix 较旧的 UFS 2.1 |
| 容量 `6` | 32GB |
| 容量 `7` | 64GB |
| 容量 `8` | 128GB |
| 容量 `9` | 256GB |
| 容量 `A` | 512GB |
| 封装 | 当前规则输出 `FBGA` |

## H28U UFS 2.0 结构

| PN 结构 | 字段 |
| --- | --- |
| `H28U` + 容量(1) + 芯片(4) + 封装/配置(3) | SK hynix 较旧的 UFS 2.0 |
| 容量 `6/7/8` | 32GB / 64GB / 128GB |
| 芯片 `4222/8222/6222` | 1xnm, 64Gb die, 4/8/16-die |
| 芯片 `4201/8201` | 3D-V2, 128Gb die, 4/8-die |
| 封装/配置 `MMR/AMR` | 11.5x13x1.0mm |
| 封装/配置 `MCR` | 11.5x13x1.2mm |
| 接口 | UFS 2.0, 1-通道 / 2-通道 |

## 输出字段

| 输出字段 | HN8 / H28U | H28S |
| --- | --- | --- |
| `vendor` | `skhynix` | `skhynix` |
| `type` | `ufs` | `ufs` |
| `density` | 按容量编码段映射为 Mbit | 按容量编码段映射为 Mbit |
| `voltage` | UC310: `Vcc: 2.5V, VccQ: 1.2V`; UD310: `Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V`; UD220: `Vcc: 3.3V, VccQ: 1.8V`; UC220: `Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V`; 车规 UFS3.1 暂不输出；ZUFS 回退保留既有资料 | 未确认，输出 `Unknown` |
| `package` | UC310: `FBGA-153, 11.5x13.0x1.0`; UD310: `WFBGA-153, 11.0x13.0x0.8` / `VFBGA-153, 11.0x13.0x1.0`; 车规: `TFBGA-153, 11.5x13.0x1.2, JEDEC FBGA`; UD220: `FBGA-153, 11.5x13.0x0.8`; UC220: `FBGA-153, 11.5x13.0x1.0` | `FBGA` |
| `fields.storage_interface` | `UFS 2.0` / `UFS 2.2` / `UFS 3.1` / `UFS 4.1` | `UFS 2.1` |
| `fields.die_codename` | UD310 / UD220 / 车规 UFS3.1 标准化为 `HYV7`；UC220 暂不输出 die 代号 | 不输出 |
| `fields.layer_count` | `176` | 随 `HYV7` 规格补出 |
| `fields.generation_info` / `fields.die_density` / `fields.die_count` | H28U 输出 `1xnm NAND` / `3D-V2 NAND`、64Gb / 128Gb die 与 4/8/16 die 数 | H28S 暂不输出 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `HN8T05BZGKX015N` | UC310, 128GB, UFS 3.1, `HYV6`, 128L, 512Gb x2, FBGA-153 |
| `HN8T25BZGKX017` | UC310, 512GB, UFS 3.1, `HYV6`, 128L, 512Gb x8, FBGA-153；无 `N` 时不输出量产状态 |
| `HN8G95DJHQX148` | 车规 UFS3.1, 64GB, AAT -40~105°C, `HYV7`, 176L |
| `HN8T25DJHVX111` | 车规 UFS3.1, 512GB, AIT -40~95°C, `HYV7`, 176L |
| `HN8T25DEHKX077N` | UD310, 512GB, UFS 3.1, `HYV7`, 176L, 移动版, 量产 |
| `HN8T35DZHKX079` | UD310, 1TB, UFS 3.1, `HYV7`, 176L, 移动版 |
| `HN8G962EHKX037N` | UD220, 64GB, UFS 2.2, `HYV7`, 176L |
| `HN8T062EHKX039` | UD220, 128GB, UFS 2.2, `HYV7`, 176L |
| `HN8T162EHKX041` | UD220, 256GB, UFS 2.2, `HYV7`, 176L |
| `HN8G961ZGKX031` | UC220, 64GB, UFS 2.2, 153FBGA 11.5x13.0x1.0 |
| `HN8T261ZGKX014` | UC220, 512GB, UFS 2.2, 153FBGA 11.5x13.0x1.0 |
| `HN8T274EJKX130` | ZUFS 4.1, 512GB, 153FBGA, 移动版 |
| `HN8T374ZJKX141` | ZUFS 4.1, 1TB, 153FBGA, 移动版; `141` 只作为序列号保留 |
| `H28SAO301MMR` | UFS 2.1, 512GB, FBGA |
| `H28S8D301DMR` | UFS 2.1, 128GB, FBGA 11.5x13x1.0mm |
| `H28S9Q301CMR` | UFS 2.1, 256GB, FBGA 11.5x13x1.0mm |
| `H28U64222MMR` | UFS 2.0, 32GB, 1xnm, 64Gb x4, 11.5x13x1.0mm |
| `H28U86222MCR` | UFS 2.0, 128GB, 1xnm, 64Gb x16, 11.5x13x1.2mm |
| `H28U88201AMR` | UFS 2.0, 128GB, 3D-V2, 128Gb x8, 11.5x13x1.0mm |

## 已知缺口

- HN8 的产品序列号暂不解释，只作为结构位保留；例如 `037` / `073` / `130` / `141` 不作为完整语义编码段解码。
- H28U 只按 Q1'2016 产品系列输出 UFS2.0、容量、基础芯片、堆叠和尺寸；封装球数、温区与控制器修订版仍未拆出。
- H28S 的公开产品表已确认 UFS 2.1、容量以及 `11.5x13x1.0mm FBGA`；球数、温区与序列号语义仍需原厂订购编码表。
- 灰市/分销页常见 `H9HQ...` 多为 uMCP (UFS + LPDDR)，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不能直接当作纯 UFS 解析器。
