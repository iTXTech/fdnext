# SpecTek NAND PN 编码

采集日期：2026-05-11

## 外部资料

- SpecTek NAND Flash Part Numbering System PDF 镜像: 覆盖 `FN/FT/FB/FX` 与 `CB` 前缀、单元技术、容量、配置、封装、等级，以及 2018 旧版编码。
  <https://borecraft.com/PDF/Datasheets%2C%20WP%2C%20Specs/Spectek_NAND_Numbering.pdf>
- PDF4Pro 转写镜像: 同一份 SpecTek NAND 料号编码指南的文本转写，便于检索旧版编码段。
  <https://pdf4pro.com/view/spectek-nand-flash-part-numbering-system-568b94.html>
- SpecTek Marketing Part Number Decoder: 官方 MPN 拆解入口，`NandComponent` 可确认 `FXMM2XANAK3BAAWP` 的 `FX = SpecTek` 与 SLC / 封装编码段结构。
  <https://www.spectek.com/menus/mpn_decoder.aspx?MpnCategory=NandComponent>
- SpecTek Laser Mark to Marketing Part Number Decoder: 官方 5 位标记编码到销售 PN 的查询入口。实测 `PX001` 返回 `FXMM2XANAK3BAAWP`，因此 `PX` 作为新的 NAND 标记编码抓取段接入。
  <https://www.spectek.com/menus/mark_code.aspx>
- 《SpecTek NAND Flash Component Wafer/Die Part Numbering Guide》（`spectek-pns-flash.pdf`）: 覆盖 2024 版当前芯片 PN、旧版销售 PN 和 2025 晶圆/die PN；用于确认 `PF580` -> `FBMM84C81KDMABH7` 的新版容量 / 封装配置编码段拆分。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/spectek-raw-token.json`
- `vendor.spectek.token.v1`
- `vendor.spectek.parent-density-token.v1`
- `vendor.spectek.old-numbering.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `FN/FT/FB/FX/CB` + 编码段序列 | 当前 SpecTek NAND 编码 |
| `F` + 产品系列 + 丝印 + 单元 + 设计代际 + 容量 + 等级 + 配置 + 电压 + 封装 + 功能 + 可选等级后缀 | 旧版 SpecTek NAND 编码 |
| `PX***` 标记编码 | 官方解码器返回 `FX...` NAND PN；当前作为 `mdb.spectek` NAND 标记编码段接入 |
| `PF***` 标记编码 | 官方解码器返回当前 `FB...` 或旧版 `F...` NAND PN；`PF285` 当前返回 `FBMM84CNAKDMABH7`，`PF580` 当前返回 `FBMM84C81KDMABH7` |
| 单元 `M/L` | SLC / MLC |
| 当前版制程节点系列 `6/7/8/9/B/D/E` 下的上级容量编码段 `0-9/A/B/N` | 严格新版 PN 中只用于对齐后续等级 / 配置 / 封装配置编码段；公开容量优先由 die 规格与封装配置推导，例如 PF285 / PF580 都输出 4 die、4 CE、32GB |
| 旧版容量 `0-9/A/B/N`，以及部分已确认的旧版双字符容量编码段 | 功能性容量 |
| 配置 `K/L/H` | x8 / x16 / x1 |
| 封装编码 `B/C/D/G/H/J/L/P/T/V/W` | 旧版封装系列 |

当前芯片 PN 的封装编码段后可跟 `-[速度档][产品等级]` 后缀。速度档来自官方 2022 编码指南：

| 编码段 | 接口与最高速率 |
| --- | --- |
| `15` / `12` / `10` | NV-DDR TM3 133MT/s / TM4 166MT/s / TM5 200MT/s |
| `75` / `6` / `5` / `37` | NV-DDR2 TM5 266MT/s / TM6 333MT/s / TM7 400MT/s / TM8 533MT/s |
| `3` / `25` / `18` / `16` | NV-DDR3 TM9 666MT/s / TM10 800MT/s / TM11 1066MT/s / TM12 1200MT/s |

产品等级编码段 `AS/AL/AF/AR/ES/MB/PG/UT/S7/S9` 结构化输出为生产状态；`ES` 只通过该字段公开为 `Engineering Sample`。后缀缺少速度编码段时仅保留可确认的产品等级。`WP/WC` 封装按同一指南补齐为 `TSOP-I-48, 12x20x1.2`，并区分中心 / 偏心引线。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `FNNL63A51K3WG-AF`
- `PF285`
- `PF580`
- `PX001`

## 注意

旧版 SpecTek 规则不再报告不支持。当前实现按公开编码指南的编码段位置解析，并只输出规则能确定的字段；设计代际会先组成 `nand.die_profile` 键，例如 `M60A`、`L74A`，再由规格表统一补齐公开制程与 `process_alias`。共享 die 命名与显示见 [NAND 规格](nand_die_profile.md) 和 [术语](terminology.md#nand--managed-nand)。SpecTek NAND PN 不再保留宽松全匹配回退；不符合旧版编码或严格新版芯片 PN 的短尾候选应保持未找到，避免错位编码段输出。

## 分级与原生 die

`M16A` / `M26A` 是 SpecTek 专属 pSLC 降级规格，分别对应 `N18A` / `N28A` 的 pSLC 形态；`PX001` 对应的 `M2XA` 已作为 SpecTek / Micron SLC 旧版规格记录。

PFPT A 表示全部 CE 可用。分级、半页与其他部分可用标记的关联处理见 [FDBGen](../FDBGEN.md#process-native-density-and-topology)。
