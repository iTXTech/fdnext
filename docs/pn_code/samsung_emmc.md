# Samsung eMMC PN 编码资料

采集日期：2026-05-08

## 来源

- Samsung eMMC 官方页面说明 eMMC 5.1、HS400、153 FBGA、8GB 到 256GB 容量，以及 automotive eMMC 5.1 产品线。
  <https://semiconductor.samsung.com/estorage/emmc/>
- Samsung eMMC 5.1 `KLMAG1JETD-B041` 官方页面/目录入口用于确认 `KLM` eMMC/moviNAND 系列。
  <https://semiconductor.samsung.com/us/estorage/emmc/emmc-5-1/klmag1jetd-b041/>

## 规则入口

- `packages/dsl/src/rules/packs/samsung-emmc-token.json`
  - 规则 ID：`vendor.samsung.emmc.token.v1`

## 编码结构

| PN 结构 | 字段 |
| --- | --- |
| `KLM` + density(2) + die stack(1) + die type(1) + voltage(1) + controller(1) + generation(1) + optional package/version/temp | Samsung eMMC / moviNAND |
| density `4G/8G/AG/BG/CG/DG/EG/FG` | 4GB / 8GB / 16GB / 32GB / 64GB / 128GB / 256GB / 512GB |
| die stack `1/2/4/8/A/I` | SDP / DDP / QDP / ODP / HDP |
| die type `G/J/K/V/U/R/N/L` | cell level 与 die density |
| generation key `die type + generation` | 推定顶层 `processNode` |
| version `4` | eMMC 5.1 |

## 统一输出字段

Samsung eMMC 现在与 SK hynix 共用：

- `component_density`：封装总容量，例如 `16GB package`
- `die_density`：单 die 容量，例如 `128Gb`
- `die_stack`：封装堆叠，例如 `SDP (1-die)`
- `processNode`：NAND 代际/制程，例如 `14nm`；不在 `fields` 里重复输出相同的 `generation_info`

可信度 metadata 只在 DSL `tables.reference` 内维护，不进入 `fields`。

## 示例

| PN | 解析重点 |
| --- | --- |
| `KLMAG1JETD-B041` | eMMC 5.1, 16GB package, SDP, 128Gb die, 14nm |
| `KLM8G1GETF-B041` | eMMC 5.1, 8GB package, SDP, 64Gb die, 14nm |
| `KLMBG2JETD-B041` | eMMC 5.1, 32GB package, DDP, 128Gb die, 14nm |
