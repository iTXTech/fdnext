# Samsung UFS PN 编码资料

采集日期：2026-05-08；更新日期：2026-07-12

## 来源

- Samsung UFS 3.1 `KLUEG8UHDB-C2E1` 官方页面确认 256GB、UFS 3.1、G4 2Lane、BGA 信息。
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-3-1/klueg8uhdb-c2e1/>
- Samsung 官方历史产品页确认 `KLUEG8U1YB-B0CP` 为 256GB UFS 2.1、G3 2Lane、11.5x13x1.2、-40°C~95°C；`KLUFG8RHDA-B2D1` 为 512GB UFS 3.0、G4 2Lane、11.5x13x1.0、-25°C~85°C。规则用 `voltage + controller` 局部组合区分 `1:Y` 的 UFS 2.1 G3 与 `H:Y` 的 UFS 3.1 G4，并仅使用 PN 中实际存在的控制器 + 代际 + 封装编码段局部组合选择封装；两个完整 PN 只进入搜索资源与测试。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-2-1/klueg8u1yb-b0cp/>
  <https://semiconductor.samsung.com/estorage/ufs/ufs-3-0/klufg8rhda-b2d1/>
- Samsung UFS 4.0 官方页面确认 G5 2Lane、9x13 封装、128GB 到 1TB 容量范围。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-4-0/>
- Samsung UFS 4.1 官方页面确认 UFS 4.1 产品线、G5 2Lane 和 153 FBGA。
  <https://semiconductor.samsung.com/jp/estorage/ufs/>
- Samsung 当前 UFS 总览与 UFS 5.0 专页确认 UFS 5.0 为 G6 2Lane、153 FBGA、
  `7.5x13x0.9`、512GB/1TB、1.2V、-25°C~85°C；协议层使用 UniPro 3.0 与
  M-PHY 6.0。官网截至 2026-07-12 尚未公开可解析的订购 PN 或型号页，
  因此这里只记录产品线规格，不把 UFS 5.0 营销规格写入现有 `KLU*` 编码段表。
  <https://semiconductor.samsung.com/estorage/ufs/>
  <https://semiconductor.samsung.com/estorage/ufs/ufs-5-0/>
- Samsung UFS 2.1 `KLUGGAR1FA-B2C1` 官方页面确认 1TB、G3 2Lane、11.5x13x1.4 和 -25°C~85°C；Puris 产品页交叉确认 153 球 BGA，因此规则按控制器 + 代际 + 封装编码段的局部组合输出 `BGA-153, 11.5x13x1.4`。
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-2-1/kluggar1fa-b2c1/>
  <https://www.puris.net/dir/product/flash/ufs>
- Samsung 车规 UFS 4.1 官方页面确认 `KLUGGARHUF-F0HQ` 为 1TB、G5 2Lane、153-FBGA 11.5x13x1.2、-40°C~105°C。该主体使用控制器编码段 `U`，封装 `F` 按控制器 + 代际 + 封装编码段组合解析，不能套用其他 UFS 4.x 的 9x13 全局值。
  <https://semiconductor.samsung.com/emea/estorage/ufs/ufs-4-1/kluggarhuf-f0hq/>
- Samsung 官方型号页补充确认 `KLUGGARHUF-F0HP`、`KLUCG1RHVF-B0EP`、`KLUEG8UHYB-B0EP`、`KLUDG4UHDB-B2E1`、`KLUFG4LHGC-B0E1`。这些型号覆盖 UFS 4.1 / UFS 3.1、64GB~1TB、移动与车规温度档，以及 11x13 / 11.5x13 的不同厚度；UFS 总览确认这些产品线使用 153 FBGA。规则只按控制器 + 代际 + 封装编码段的局部组合选择尺寸，不按完整 PN 或基础 PN 匹配封装。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-4-1/kluggarhuf-f0hp/>
  <https://semiconductor.samsung.com/emea/estorage/ufs/ufs-3-1/klucg1rhvf-b0ep/>
  <https://semiconductor.samsung.cn/estorage/ufs/ufs-3-1/klueg8uhyb-b0ep/>
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-3-1/kludg4uhdb-b2e1/>
  <https://semiconductor.samsung.com/us/estorage/ufs/ufs-3-1/klufg4lhgc-b0e1/>
  <https://semiconductor.samsung.com/estorage/ufs/>
- 外部现货/系统清单共同确认 `KLUGGGRHKF-F0H1` 为 1TB、G5 2Lane、BGA-153。该 PN 使用新堆叠编码段 `G`；规则只把 `G` 纳入结构识别，不从它推断 die 数，容量、UFS 4.1、V8 规格与封装仍分别来自既有容量/控制器/代际/封装编码段。
  <https://www.mbsystems.com.mx/listap65.html>
  <https://www.accio.com/plp/ufs-storage-chip-smartphone-motherboard-close-up>
- 用户提供的 Samsung UFS 测试点转储表确认若干特定基础 PN 的 CE 数、die 数和单 die NAND 丝印。该表只用于精确基础 PN 补充，不从 UFS PN 编码段泛化推断 CE / die。
- 2026-07-12 重新审计 Samsung 官方站点地图：其中 32 个 `KLU*` 精确 UFS
  型号已全部存在于 `managed-nand-pn.json`，并能由现有结构化规则识别为 Samsung
  UFS；未发现可安全新增的完整 PN。站点地图只有 UFS 5.0 产品线页，没有 UFS 5.0
  型号 PN，因此不推测新控制器/版本编码段。
  <https://semiconductor.samsung.com/sitemap.xml>

## 规则入口

- `packages/core/src/decodepack/rules/packs/samsung-ufs-token.json`
  - 规则 ID：`vendor.samsung.ufs.token.v1`

## 编码结构

| PN 结构 | 字段 |
| --- | --- |
| `KLU` + 容量(2) + die 数(1) + die 类型(1) + 电压(1) + 控制器(1) + 代际(1) + 封装/版本/温度 | Samsung UFS |
| 容量 `AG/BG/CG/DG/EG/FG/GG/HG` | 16GB 到 2TB |
| die 堆叠 `1/2/4/8/A` | 1 / 2 / 4 / 8 / 16 die |
| die 堆叠 `G` | 新一代堆叠编码，已确认存在但无法由公开资料稳定换算 die 数，因此只参与结构匹配 |
| 控制器 `D/G/J/H/K/U` | UFS G4/G5 控制器系列；`U` 为车规 UFS 4.1 G5 2Lane |
| 版本 `E/G/H` | UFS 3.1 / 4.0 / 4.1 |
这里的纯堆叠数量输出为 `die_count`；CE 数和内部 NAND 丝印无法由 UFS PN 的局部编码段稳定推导，因此不进入解码器公开字段。完整 PN 的转储证据仅作为外部资料记录，不做完整 PN 查表。

## 统一输出字段

Samsung UFS 输出：

- `density`：封装总容量，例如 `512GB`
- `die_density`：单 die 容量，例如 `512Gb`
- `die_count`：封装内 NAND die 数，例如 `8`
- `die_codename`：NAND die 规格键，例如 `SSV8`；2D/3D 代际说明如需展示由 `generation_info` 承接

来源维护遵循 [可信度策略](reference_policy.md)。

## 示例

| PN | 解析重点 |
| --- | --- |
| `KLUCG4J1BB` | UFS 2.0, 64GB, MLC, 4 die |
| `KLUDGAG1BD` | UFS 2.0, 128GB, MLC, 16 die |
| `KLUGGAR1FA-B2C1` | UFS 2.1, 1TB, BGA-153 11.5x13x1.4 |
| `KLUEG8UHDB-C2E1` | UFS 3.1, 256GB, ODP, 256Gb die, V5 92L |
| `KLUEG8U1YB-B0CP` | UFS 2.1, 256GB, BGA-153 11.5x13x1.2, -40°C~95°C |
| `KLUFG8RHDA-B2D1` | UFS 3.0, 512GB, BGA-153 11.5x13x1.0, -25°C~85°C |
| `KLUFG8RHHF-F0G1` | UFS 4.0, 512GB, ODP, 512Gb die, V8 236L |
| `KLUEG4RHKF-F0H1` | UFS 4.1, 256GB, QDP, 512Gb die, V8 236L |
| `KLUGGGRHKF-F0H1` | UFS 4.1, 1TB, G5 2Lane, BGA-153；未知堆叠编码段不输出 die 数 |
| `KLUGGARHUF-F0HQ` | 车规 UFS 4.1, 1TB, BGA-153 11.5x13x1.2, -40°C~105°C |
| `KLUGGARHUF-F0HP` | 车规 UFS 4.1, 1TB, BGA-153 11.5x13x1.2, -40°C~95°C |
| `KLUCG1RHVF-B0EP` | 车规 UFS 3.1, 64GB, BGA-153 11.5x13x1.2, -40°C~95°C |
| `KLUEG8UHYB-B0EP` | 车规 UFS 3.1, 256GB, BGA-153 11.5x13x1.2, -40°C~95°C |
| `KLUDG4UHDB-B2E1` | UFS 3.1, 128GB, BGA-153 11.5x13x0.8, -25°C~85°C |
| `KLUFG4LHGC-B0E1` | UFS 3.1, 512GB, BGA-153 11x13x1.0, -25°C~85°C |

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-07-11 品牌×产品线审计补入车规 UFS 4.1。

## PN 展示

KLU 的 10 字符主体与 4 字符订购后缀之间显示 `-`，例如 `KLUEG8UHDB-C2E1`；只有主体时不追加分隔符。
