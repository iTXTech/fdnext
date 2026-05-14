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

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/spectek-raw-token.json`
- `vendor.spectek.token.v1`
- `vendor.spectek.old-numbering.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FN/FT/FB/FX/CB` + token sequence | 当前 SpecTek NAND numbering |
| `F` + product family + marking + cell + design generation + density + grade + configuration + voltage + package + functionality + optional grade suffix | old SpecTek NAND numbering |
| `PX***` mark code | 官方 decoder 返回 `FX...` NAND PN；当前作为 `mdb.spectek` NAND mark code 段接入 |
| cell `M/L` | SLC / MLC |
| old density `0-9/A/B/N` plus selected legacy two-character density tokens | functional density |
| configuration `K/L/H` | x8 / x16 / x1 |
| package code `B/C/D/G/H/J/L/P/T/V/W` | old package family |

## 输出字段

- `density`
- `cell_level`
- `process_node`
- `device_width`
- `voltage`
- `package`
- `density_grade`
- `package_functionality_partial_type`
- `product_family`

## 测试样例

- `FNNL63A51K3WG-AF`
- `PX001`

## 注意

旧版 SpecTek 规则不再报告 unsupported。当前实现按公开 numbering guide 的 token 位置解析，并只输出规则能确定的字段；design generation 仍按原始 token 组合保留为 `process_node`。
