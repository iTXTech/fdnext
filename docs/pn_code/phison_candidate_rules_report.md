# Phison 编码段候选规则报告

本报告记录从 Phison 官方支持列表 JSON（`ps.json`）中抽出的候选规则，以及这些候选没有加入 `packages/core/src/decodepack/rules/packs/phison-token.json` 的原因。

## 范围

Phison NAND 标签只由下面的定长结构化 10 位编码段规则识别。旧的通用 `PH` 厂商-前缀
回退无法证明输入是 NAND 标签或 Phison 控制器，且会把任意 `PH...` 字符串误标为
Phison；本轮已删除该回退。Phison 控制器的 `PS...` 名称仅存在于 FDB 控制器
分组，不作为存储器 PN 解码器的厂商-前缀。

当前 Phison 10 位编码段按如下位置观察：

```text
V P C D D F CELL O NODE
1 2 3 4 5 6 7    8 9
```

- `densityCode`：第 4-5 位。
- `classCode`：第 3 位。
- `cellCode`：第 7 位。
- 统计基准编码段形态为 `^[A-Z][A-Z][0-9A-Z][0-9A-Z][GE][0-9A-Z]{5}$`。
- “可解原厂 PN 数”只统计从 `rawNames` / `aliasPns` 中抽到的原厂 PN，并且能被现有结构化 PN 解码器解码成功的唯一 PN 数；不把完整 Phison 编码段自身当作证据。
- 支持列表的 `c` 字段只作为候选观察值；如果缺少原厂 PN 解码证据，或支持列表内部不一致，则不进入 DecodePack 公开规则。

## 已进入 DecodePack 的补充规则

`T27HGA5A1V` 是 Phison 侧 NAND 标签，原始 NAND 厂商为 Toshiba/KIOXIA。该样例
补充了两类结构化编码段规则：

- `packageCode=2` 输出 `BGA154`。
- `vendorCode=T`、`densityCode=HG`、`nodeCode/rest=1V` 输出 KIOXIA 专属的
  `KBiCS6`，公开结果显示 `BiCS6`。

该 Flash ID `9848A8037AE5` 的厂商归属仍是 KIOXIA，因此 FDB 源数据只在 Phison PN
记录上使用 `f` 建立单向 Flash ID 关联，不把该 ID 写成 归属于 Phison 的 `id`。

## 容量码候选

这些候选位于 `densityCode`，但没有加入容量表。主要原因是没有可解码的原厂 PN 作为交叉验证；部分样本只能从 Flash ID 或支持列表单元推断，不能作为 PN 规则准入依据。

| 参数 | 行数 | Flash ID 数 | 支持单元 | 可解原厂 PN 数 | 原厂 PN 解码单元 | 原厂 PN 解码容量 Mbit | 示例 | 不加入原因 |
|---|---:|---:|---|---:|---|---|---|---|
| `densityCode=AE` | 1 | 1 | TLC:1 | 0 | - | - | `IA7AE65AVA` | 没有原厂 PN 解码证据，且只有单行样本。 |
| `densityCode=BE` | 1 | 1 | TLC:1 | 0 | - | - | `IABBE65AVA` | 没有原厂 PN 解码证据，且只有单行样本。 |
| `densityCode=MG` | 2 | 1 | QLC:2 | 0 | - | - | `TG1MG56AWV`; `TP1MG76AWV` | 没有原厂 PN 解码证据；同一 Flash ID 出现在多个别名下。 |
| `densityCode=NG` | 1 | 1 | QLC:1 | 0 | - | - | `TG5NG56AWV` | 没有原厂 PN 解码证据，且只有单行样本。 |
| `densityCode=XG` | 1 | 1 | pTLC:1 | 0 | - | - | `TP1XG76AWV` | 没有原厂 PN 解码证据；`pTLC` 更像模式或分级信息，不能直接推导容量语义。 |
| `densityCode=NE` | 1 | 1 | QLC:1 | 0 | - | - | `TP5NE76AWV` | 没有原厂 PN 解码证据，且只有单行样本。 |
| `densityCode=OE` | 1 | 1 | QLC:1 | 0 | - | - | `TP7OE76AWV` | 没有原厂 PN 解码证据，且只有单行样本。 |
| `densityCode=XE` | 2 | 1 | pTLC:2 | 0 | - | - | `TP5XE76AWV`; `TP7XE76AWV` | 没有原厂 PN 解码证据；`pTLC` 更像模式或分级信息，不适合映射成普通容量码。 |

## 分类码候选

`classCode` 在当前规则中用于 CE / die 分类。`2` 和 `9` 在官方列表中可见，但两者都没有原厂 PN 解码证据，且支持单元分布混杂，因此暂时不能给出 CE / die 映射。

| 参数 | 行数 | Flash ID 数 | 支持单元 | 可解原厂 PN 数 | 原厂 PN 解码单元 | 原厂 PN 解码容量 Mbit | 示例 | 不加入原因 |
|---|---:|---:|---|---:|---|---|---|---|
| `classCode=2` | 6 | 6 | TLC:5, MLC:1 | 0 | - | - | `IA2AG65AOA`; `NA2AG65AOA`; `TF27G1JAJA`; `TF27G2JAJA` | 没有原厂 PN 解码证据；支持列表不是单元统一分布，且类别编码更可能表示拓扑而不是单元。 |
| `classCode=9` | 31 | 20 | MLC:18, TLC:13 | 0 | - | - | `IP9AG5SAPH`; `TG9BG55AVV`; `TN9BG53AIV`; `TP99G5LARA` | 没有原厂 PN 解码证据；支持列表混合明显，不能安全推导 CE / die。 |

## 单元码候选

这些候选位于编码段第 7 位。部分候选的可解原厂 PN 子集是统一的，但完整支持列表行仍存在混杂或样本太少。只有支持列表与原厂 PN 解码都一致的单元编码，才适合提升为公开规则。

| 参数 | 行数 | Flash ID 数 | 支持单元 | 可解原厂 PN 数 | 原厂 PN 解码单元 | 原厂 PN 解码容量 Mbit | 原厂 PN 解码制程 | 示例 | 不加入原因 |
|---|---:|---:|---|---:|---|---|---|---|---|
| `cellCode=J` | 66 | 33 | TLC:60, MLC:5, 空白:1 | 8 | TLC | 65536, 131072, 262144, 524288 | 19 nm/1x, 24 nm, 24 nm B-类型, A19 nm/1y | `DF16G1JAHA -> SDTNPNAHEM-008G`; `TF58G2JAJA -> TH58TEG8T2JBA4C` | 可解原厂 PN 子集是 TLC，但支持列表中仍有 MLC 和空白行，不够统一。 |
| `cellCode=P` | 34 | 20 | TLC:31, MLC:3 | 8 | TLC | 131072, 262144, 524288 | 15 nm/1z, 1Znm (15nm), BiCS2, BiCS3 | `DT58G5PARA -> SDTNSIBMA-032G`; `TP58G5PARV -> TH58TEG8THLTA20` | 可解原厂 PN 子集是 TLC，但支持列表中仍有 MLC 行。 |
| `cellCode=H` | 7 | 5 | SLC:6, MLC:1 | 3 | SLC | 4096, 8192, 16384 | 24 nm B-类型, 32 nm | `TF12G1HAHA -> TC58NVG2S0HTA00`; `TF13G2HAFA -> TC58NVG3S0FTA00` | 大多数为 SLC，但支持列表中有 1 条 MLC，不能直接归并为 SLC。 |
| `cellCode=1` | 21 | 9 | TLC:20, SLC:1 | 7 | TLC | 131072, 262144, 524288 | 15 nm/1z, BiCS3 | `DG19G51AIV -> SDZNBIAMA-064G`; `HP58G51APH -> H27QEG8NDM5R` | 大多数为 TLC，但支持列表中有 1 条 SLC，不够统一。 |
| `cellCode=X` | 8 | 6 | TLC:7, MLC:1 | 2 | TLC | 131072 | 1Znm (15nm), BiCS3 | `DT17G2XARV -> SDTNSIAMA-016G`; `TT17G5XAIV -> TC58TFG7T23TA0D` | 原厂 PN 解码证据太少，且支持列表中有 MLC 行。 |
| `cellCode=T` | 19 | 15 | MLC:14, TLC:3, 空白:2 | 1 | TLC | 65536 | A19 nm/1y | `TT16G1TAPA -> TC58TEG6TCKTA00` | 原厂 PN 解码结果与支持列表主流分布冲突，可能不是简单单元的level 编码。 |
| `cellCode=6` | 10 | 3 | QLC:7, pTLC:3 | 0 | - | - | - | `NA1AG66AOA`; `TG1MG56AWV`; `TP1MG76AWV` | 没有原厂 PN 解码证据；`QLC` 与 `pTLC` 混合，可能存在模式或分级歧义。 |
| `cellCode=Z` | 4 | 3 | MLC:4 | 0 | - | - | - | `TA8AG5ZASA`; `TP79G5ZASA`; `TP8AG5ZASA`; `TUABG5ZASA` | 支持列表内部统一，但没有原厂 PN 解码证据，暂时保留为待确认。 |
| `cellCode=Y` | 4 | 1 | MLC:4 | 0 | - | - | - | `TP17G5YAUA`; `TT17G2YAUA`; `TT17G5YAUA`; `TT58G2YAUA` | 支持列表内部统一，但只有 1 个 Flash ID 且没有原厂 PN 解码证据，暂时保留为待确认。 |

## 规则准入标准

候选规则进入 `phison-token.json` 前，需要同时满足：

1. 该编码段参数在支持列表中内部一致；如果存在例外，需要能解释为结构差异，而不是硬凑。
2. 至少有一个代表性原厂 PN 能通过现有结构化 PN 规则解码。
3. 原厂 PN 解码结果在要新增的目标字段上保持一致。
4. 规则可以用编码段位置、前缀、表或最长前缀表表达，不能枚举完整 Phison PN。

按以上策略，本报告中的候选都先保留为待确认，不加入公开 DecodePack 规则。
