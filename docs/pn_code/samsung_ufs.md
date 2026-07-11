# Samsung UFS PN 编码资料

采集日期：2026-05-08；更新日期：2026-07-11

## 来源

- Samsung UFS 3.1 `KLUEG8UHDB-C2E1` 官方页面确认 256GB、UFS 3.1、G4 2Lane、BGA 信息。
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-3-1/klueg8uhdb-c2e1/>
- Samsung UFS 4.0 官方页面确认 G5 2Lane、9x13 封装、128GB 到 1TB 容量范围。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-4-0/>
- Samsung UFS 4.1 官方页面确认 UFS 4.1 产品线、G5 2Lane 和 153 FBGA。
  <https://semiconductor.samsung.com/jp/estorage/ufs/>
- Samsung Automotive UFS 4.1 官方页面确认 `KLUGGARHUF-F0HQ` 为 1TB、G5 2Lane、153-FBGA 11.5x13x1.2、-40°C~105°C。该 body 使用 controller token `U`，package `F` 必须按 base PN 组合覆盖，不能套用其他 UFS 4.x 的 9x13 全局值。
  <https://semiconductor.samsung.com/emea/estorage/ufs/ufs-4-1/kluggarhuf-f0hq/>
- 用户提供的 Samsung UFS 测试点 dump 表确认若干特定基础 PN 的 CE 数、die 数和单 die NAND marking。该表只用于 exact base PN 补充，不从 UFS PN token 泛化推断 CE / die。

## 规则入口

- `packages/core/src/decodepack/rules/packs/samsung-ufs-token.json`
  - 规则 ID：`vendor.samsung.ufs.token.v1`

## 编码结构

| PN 结构 | 字段 |
| --- | --- |
| `KLU` + density(2) + die count(1) + die type(1) + voltage(1) + controller(1) + generation(1) + package/version/temp | Samsung UFS |
| density `AG/BG/CG/DG/EG/FG/GG/HG` | 16GB 到 2TB |
| die count `1/2/4/8/A` | 1 / 2 / 4 / 8 / 16 die |
| controller `D/G/J/H/K/U` | UFS G4/G5 controller family；`U` 为 Automotive UFS 4.1 G5 2Lane |
| version `E/G/H` | UFS 3.1 / 4.0 / 4.1 |
| `dumpedPartObj` exact base PN | 用户测试点 dump 得到的 `ce_count` 与 `nand_component` |

这里的纯堆叠数量输出为 `die_count`；CE 数只来自 dump 表，不从 die-count token 或其他 PN token 推导。

## 统一输出字段

Samsung UFS 输出：

- `density`：封装总容量，例如 `512GB`
- `die_density`：单 die 容量，例如 `512Gb`
- `die_count`：封装内 NAND die 数，例如 `8`
- `nand_component`：特定基础 PN 的单 die NAND marking，例如 `K9AFGD8J0B`
- `ce_count`：仅对 dump 表中列出的特定基础 PN 输出；不按 UFS PN token 泛化推断
- `die_codename`：NAND die profile key，例如 `SSV8`；2D/3D 代际说明如需展示由 `generation_info` 承接

可信度 metadata 只在 iTXTech fdnext DecodePack `tables.reference` 内维护，不进入 `fields`。

## 示例

| PN | 解析重点 |
| --- | --- |
| `KLUCG4J1BB` | UFS 2.0, 64GB, MLC, 4 CE / 4 die, `K9GDGD8U0B` |
| `KLUDGAG1BD` | UFS 2.0, 128GB, MLC, 8 CE / 16 die, `K9GCGD8U0D` |
| `KLUEG8UHDB-C2E1` | UFS 3.1, 256GB, ODP, 256Gb die, V5 92L |
| `KLUFG8RHHF-F0G1` | UFS 4.0, 512GB, ODP, 512Gb die, V8 236L |
| `KLUEG4RHKF-F0H1` | UFS 4.1, 256GB, QDP, 512Gb die, V8 236L |
| `KLUGGARHUF-F0HQ` | Automotive UFS 4.1, 1TB, BGA-153 11.5x13x1.2, -40°C~105°C |
