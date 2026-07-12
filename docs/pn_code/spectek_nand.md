# SpecTek NAND PN 编码

采集日期：2026-05-11

## 外部资料

- SpecTek NAND Flash Part Numbering System PDF mirror: 覆盖 `FN/FT/FB/FX` 与 `CB` 前缀、cell technology、density、configuration、package、grade，以及 2018 old numbering。
  <https://borecraft.com/PDF/Datasheets%2C%20WP%2C%20Specs/Spectek_NAND_Numbering.pdf>
- PDF4Pro transcription mirror: 同一份 SpecTek NAND part-numbering guide 的文本转写，便于检索 old numbering token。
  <https://pdf4pro.com/view/spectek-nand-flash-part-numbering-system-568b94.html>
- SpecTek Marketing Part Number Decoder: 官方 MPN 拆解入口，`NandComponent` 可确认 `FXMM2XANAK3BAAWP` 的 `FX = SpecTek` 与 SLC / package token 结构。
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=NandComponent>
- SpecTek Laser Mark to Marketing Part Number Decoder: 官方 5 位 mark code 到 marketing PN 的查询入口。实测 `PX001` 返回 `FXMM2XANAK3BAAWP`，因此 `PX` 作为新的 NAND mark code crawl 段接入。
  <https://www.spectek.com/menus/mark_code.aspx>
- SpecTek NAND Flash Component Wafer/Die Part Numbering Guide（`spectek-pns-flash.pdf`）: 覆盖 2024 版当前 component PN、旧版 marketing PN 和 2025 wafer/die PN；用于确认 `PF580` -> `FBMM84C81KDMABH7` 的新版 density / package configuration token 拆分。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/spectek-raw-token.json`
- `vendor.spectek.token.v1`
- `vendor.spectek.parent-density-token.v1`
- `vendor.spectek.old-numbering.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FN/FT/FB/FX/CB` + token sequence | 当前 SpecTek NAND numbering |
| `F` + product family + marking + cell + design generation + density + grade + configuration + voltage + package + functionality + optional grade suffix | old SpecTek NAND numbering |
| `PX***` mark code | 官方 decoder 返回 `FX...` NAND PN；当前作为 `mdb.spectek` NAND mark code 段接入 |
| `PF***` mark code | 官方 decoder 返回当前 `FB...` 或 old `F...` NAND PN；`PF285` 当前返回 `FBMM84CNAKDMABH7`，`PF580` 当前返回 `FBMM84C81KDMABH7` |
| cell `M/L` | SLC / MLC |
| current parent-density token `0-9/A/B/N` under process-node family `6/7/8/9/B/D/E` | 严格新版 PN 中只用于对齐后续 grade / configuration / package-configuration token；公开容量优先由 die profile 与 package configuration 推导，例如 PF285 / PF580 都输出 4 die、4 CE、32GB |
| old density `0-9/A/B/N` plus selected legacy two-character density tokens | functional density |
| configuration `K/L/H` | x8 / x16 / x1 |
| package code `B/C/D/G/H/J/L/P/T/V/W` | old package family |

当前 component PN 的封装 token 后可跟 `-[速度档][产品等级]` suffix。速度档来自官方 2022 numbering guide：

| Token | 接口与最高速率 |
| --- | --- |
| `15` / `12` / `10` | NV-DDR TM3 133MT/s / TM4 166MT/s / TM5 200MT/s |
| `75` / `6` / `5` / `37` | NV-DDR2 TM5 266MT/s / TM6 333MT/s / TM7 400MT/s / TM8 533MT/s |
| `3` / `25` / `18` / `16` | NV-DDR3 TM9 666MT/s / TM10 800MT/s / TM11 1066MT/s / TM12 1200MT/s |

产品等级 token `AS/AL/AF/AR/ES/MB/PG/UT/S7/S9` 结构化输出为 Production Status；`ES` 只通过该字段公开为 `Engineering Sample`。suffix 缺少速度 token 时仅保留可确认的产品等级。`WP/WC` 封装按同一指南补齐为 `TSOP-I-48, 12x20x1.2`，并区分 Center / Off-center leads。

## 输出字段

- `density`
- `cell_level`
- `die_codename`
- `device_width`
- `voltage`
- `package`
- `speed_grade`
- `prod_status`
- `density_grade`
- `package_functionality_partial_type`
- `product_family`

## 测试样例

- `FNNL63A51K3WG-AF`
- `PF285`
- `PF580`
- `PX001`

## 注意

旧版 SpecTek 规则不再报告 unsupported。当前实现按公开 numbering guide 的 token 位置解析，并只输出规则能确定的字段；design generation 会先组成 `nand.die_profile` key，例如 `M60A`、`L74A`，再由 profile 表统一补齐公开制程与 `process_alias`。IMFT 2D `5x/6x/7x` 系列分别公开为 `50nm/34nm/25nm`，原始 die code 保留在 `process_alias`，摘要优先展示该 alias；Micron RG / Solidigm FG 的 3D die codename 则直接保留 profile key，例如 `B57T`、`B78R`、`N38B`、`N4PA`。`M16A` / `M26A` 是 SpecTek 专属 pSLC 降级 profile，分别对应 `N18A` / `N28A` 的 pSLC 形态；`PX001` 对应的 `M2XA` 已作为 SpecTek / Micron SLC legacy profile 记录。SpecTek NAND PN 不再保留宽松 catch-all fallback；不符合 old numbering 或严格新版 component PN 的短尾候选应保持 not found，避免错位 token 输出。
