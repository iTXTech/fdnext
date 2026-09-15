# KIOXIA E2NAND PN 编码

采集日期：2026-05-13

## 外部资料

- Toshiba SmartNAND 官方新闻说明 24nm SmartNAND 将 NAND 闪存与支持 ECC 的控制芯片集成在 NAND 封装中，并列出 `THGVR1G7D2GLA09` 等 LGA52 产品线。
  <https://www.global.toshiba/ww/news/corporate/2011/04/pr0601.html>
- Toshiba `Part Number Decoder for Toshiba NAND Flash`, Rev.1.3, 2010-09-24: `NAND w/ controller` 表给出 `THG/TCG` 系列中电压、类型、控制器修订版、容量、单元类型、堆叠 die、工艺规则、封装、无铅/无卤和封装尺寸编码段。
- 本地 `fdb` / `fdfdb` 多源记录 `THGVX1G7D2GLA08`、`TCGVX1G7D2GLA08`、`THGBX2G7D2JLA01` 等 E2NAND 条目。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kioxia-managed-token.json`
- `vendor.kioxia.managed.thg.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `THG/TCG` + 电压(1) + 类型(1) + 控制器修订版(1) + 容量(2) + 单元(1) + 堆叠 die(1) + 工艺规则(1) + 封装/类别/大小 | Toshiba/KIOXIA 带控制器的 NAND 共享结构 |
| 电压 `V/Y/A/B/D` | Vcc/VccQ 组合；例如 `THGVX...` 中的 `V` 只表示电压 |
| 类型 `R/X` | E2NAND / SmartNAND |
| 控制器修订版 | 单字符控制芯片修订版 / 代际编码 |
| 精确封装 `LA01/LA08/LA09` | `LGA60` / `LGA52` 精确封装优先 |

共用编码段表见 [kioxia_emmc](kioxia_emmc.md#规则状态)；本文仅列该产品线的差异。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
解码器编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `THGVR1G7D2GLA09`
- `THGVX1G7D2GLA08`
- `TCGVX1G7D2GLA08`
- `THGBX2G7D2JLA01`

## 注意

`THGxR`、`THGxX`、`TCGxX` 这类 PN 属于 E2NAND / SmartNAND，内部带 ECC 控制芯片，不按普通裸 NAND 输出，也不使用泛化 `nandcon` 类型。

E2NAND 与 eMMC 共用 `NAND w/ controller` 尾部编码段表；差异由类型编码决定：`M` 输出 eMMC，`R/X` 输出 E2NAND。`stacked die` 只输出 `die_count`，后续设计/代际编码段才用于制程或 BiCS 规格推断。不要把 `THGV*` 中的 `V` 当成系列，它只表示电压。
