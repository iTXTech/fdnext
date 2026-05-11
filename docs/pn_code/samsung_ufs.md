# Samsung UFS PN 编码资料

采集日期：2026-05-08

## 来源

- Samsung UFS 3.1 `KLUEG8UHDB-C2E1` 官方页面确认 256GB、UFS 3.1、G4 2Lane、BGA 信息。
  <https://semiconductor.samsung.com/jp/estorage/ufs/ufs-3-1/klueg8uhdb-c2e1/>
- Samsung UFS 4.0 官方页面确认 G5 2Lane、9x13 封装、128GB 到 1TB 容量范围。
  <https://semiconductor.samsung.com/estorage/ufs/ufs-4-0/>
- Samsung UFS 4.1 官方页面确认 UFS 4.1 产品线、G5 2Lane 和 153 FBGA。
  <https://semiconductor.samsung.com/jp/estorage/ufs/>

## 规则入口

- `packages/decodepack/src/rules/packs/samsung-ufs-token.json`
  - 规则 ID：`vendor.samsung.ufs.token.v1`

## 编码结构

| PN 结构 | 字段 |
| --- | --- |
| `KLU` + density(2) + die stack(1) + die type(1) + voltage(1) + controller(1) + generation(1) + package/version/temp | Samsung UFS |
| density `AG/BG/CG/DG/EG/FG/GG/HG` | 16GB 到 2TB |
| die stack `1/2/4/8/A` | SDP / DDP / QDP / ODP / HDP |
| controller `D/G/J/H/K` | UFS G4/G5 controller family |
| version `E/G/H` | UFS 3.1 / 4.0 / 4.1 |

## 统一输出字段

Samsung UFS 现在与 SK hynix 共用：

- `component_density`：封装总容量，例如 `512GB package`
- `die_density`：单 die 容量，例如 `512Gb`
- `die_stack`：封装堆叠，例如 `ODP (8-die)`
- `fields.process_node`：NAND 代际，例如 `V8 236L`；不在 `fields` 里重复输出相同的 `generation_info`

可信度 metadata 只在 iTXTech fdnext DecodePack `tables.reference` 内维护，不进入 `fields`。

## 示例

| PN | 解析重点 |
| --- | --- |
| `KLUEG8UHDB-C2E1` | UFS 3.1, 256GB package, ODP, 256Gb die, V5 92L |
| `KLUFG8RHHF-F0G1` | UFS 4.0, 512GB package, ODP, 512Gb die, V8 236L |
| `KLUEG4RHKF-F0H1` | UFS 4.1, 256GB package, QDP, 512Gb die, V8 236L |
