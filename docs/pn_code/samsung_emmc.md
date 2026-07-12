# Samsung eMMC PN 编码资料

采集日期：2026-05-08；更新日期：2026-07-12

## 来源

- Samsung eMMC 官方页面说明 eMMC 5.1、HS400、153 FBGA、8GB 到 256GB 容量，以及 automotive eMMC 5.1 产品线。
  <https://semiconductor.samsung.com/estorage/emmc/>
- Samsung 官方 2013 eMMC brochure 的 PN matrix 确认早期 `W/Y` NAND token、eMMC 4.5 / 5.0 尾缀版本、HS200 / HS400、BGA 封装、die density 与 die count。规则只按 `W/Y`、尾缀 version 和 package 等局部 token 泛化；表中 exact PN 仅用于 testcase 与后续搜索资源候选。
  <https://download.semiconductor.samsung.com/resources/brochure/Samsung_eMMC_2013-0.pdf>
- Samsung eMMC 5.1 `KLMAG1JETD-B041` 官方页面/目录入口用于确认 `KLM` eMMC/moviNAND 系列。
  <https://semiconductor.samsung.com/us/estorage/emmc/emmc-5-1/klmag1jetd-b041/>
- Samsung 官方型号页确认 `KLMCG8GESD-B04Q`、`KLMBG4GESD-B04Q`、`KLMBG4GEUF-B04Q`、`KLMDG8JEUD-B04P`、`KLMCG1RCTE-B041` 均为 eMMC 5.1 / HS400 / 153 FBGA，容量覆盖 32GB~128GB，package size 覆盖 11.5x13x0.8 / 1.0 / 1.2。规则按 controller + generation + package token 的局部组合输出尺寸，不按完整 PN 或 base PN 匹配封装。
  <https://semiconductor.samsung.com/estorage/emmc/emmc-5-1/klmcg8gesd-b04q/>
  <https://semiconductor.samsung.com/emea/estorage/emmc/emmc-5-1/klmbg4gesd-b04q/>
  <https://semiconductor.samsung.com/emea/estorage/emmc/emmc-5-1/klmbg4geuf-b04q/>
  <https://semiconductor.samsung.com/kr/estorage/emmc/emmc-5-1/klmdg8jeud-b04p/>
  <https://semiconductor.samsung.com/kr/estorage/emmc/emmc-5-1/klmcg1rcte-b041/>
  <https://semiconductor.samsung.com/estorage/emmc/>
- Samsung 官方历史型号页确认 `KLMCG8GEND-B041` 为 64GB、eMMC 5.1 / HS400、11.5x13x1.0、-25C~85C。其 `controller N + generation D + package B` 局部 token 组合加入 package 表，exact PN 只进入搜索资源和 testcase。来源：<https://semiconductor.samsung.com/emea/estorage/emmc/emmc-5-1/klmcg8gend-b041/>

## 规则入口

- `packages/core/src/decodepack/rules/packs/samsung-emmc-token.json`
  - 规则 ID：`vendor.samsung.emmc.token.v1`

## 编码结构

| PN 结构 | 字段 |
| --- | --- |
| `KLM` + density(2) + die count(1) + die type(1) + voltage(1) + controller(1) + generation(1) + optional package/version/temp | Samsung eMMC / moviNAND |
| density `4G/8G/AG/BG/CG/DG/EG/FG` | 4GB / 8GB / 16GB / 32GB / 64GB / 128GB / 256GB / 512GB |
| die count `1/2/4/8/A/I` | 1 / 2 / 4 / 8 / 16 die |
| die type `G/J/K/V/U/R/N/L` | cell level 与 die density |
| legacy die type `W/Y` | 官方 2013 matrix 分别确认 64Gb / 32Gb die；因 brochure 未逐 PN 区分 2-bit / 3-bit，本规则不猜 cell level |
| generation key `die type + generation` | 推定 `fields.die_codename` |
| suffix version `0/3/4` | eMMC 4.5 / 5.0 / 5.1；同时分别确认 HS200 / HS400 / HS400 |

## 统一输出字段

Samsung eMMC 输出：

- `density`：封装总容量，例如 `16GB`
- `die_density`：单 die 容量，例如 `128Gb`
- `die_count`：封装内 NAND die 数，例如 `1`
- `die_codename`：NAND die profile key，例如 `SS14` / `SS16`

可信度 metadata 只在 iTXTech fdnext DecodePack `tables.reference` 内维护，不进入 `fields`。

## 示例

| PN | 解析重点 |
| --- | --- |
| `KLM4G1YEMD-C031` | eMMC 5.0, 4GB, 1 x 32Gb die, HS400；suffix package `C` 尚不泛化封装 |
| `KLMAG2WEMB-B031` | eMMC 5.0, 16GB, 2 x 64Gb die, HS400 |
| `KLMDGAGEAC-B001` | eMMC 4.5, 128GB, 16 x 64Gb die, HS200 |
| `KLMAG1JETD-B041` | eMMC 5.1, 16GB, SDP, 128Gb die, 14nm |
| `KLM8G1GETF-B041` | eMMC 5.1, 8GB, SDP, 64Gb die, 14nm |
| `KLMBG2JETD-B041` | eMMC 5.1, 32GB, DDP, 128Gb die, 14nm |
