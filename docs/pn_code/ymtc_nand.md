# YMTC 裸 NAND PN 和 Flash ID 解码

采集日期：2026-05-15

## 外部资料

- `YMTC NAND Flash Features.pdf`，标题日期 `2024.07.31`，给出 `X1-9050` 到 `X4-9060` 的 xLC、ONFI、页/块组织结构、器件容量、平面数、时钟频率、电压和耐久信息。
- YMTC 官方 `X4-6080` 产品页明确该 die 为首款 2Tb、8-平面 QLC，并采用 Xtacking 4.0 / 3600MT/s；因此 `PTS` 规格可直接输出 8 平面。<https://www.ymtc.com/en/products/51.html?cat=35>
- YMTC Gen2 256Gb TLC 数据手册 Read ID 表：确认 `9B` 制造商 ID，以及容量、LUN、单元、电压、页、块、平面、技术的字节/位定义。公开镜像：<https://borecraft.com/PDF/Datasheets%2C%20WP%2C%20Specs/YMTC_Gen2_256Gb_TLC_Datasheet_Client_rev0.2.pdf>。
- 无忧启动的公开 Flash ID / 制程对照表与本地控制器数据同向确认 6 个既有规格的精确 ID 变体：JGS `9B C4 49 25 10` / `9B C5 4A 25 10` / `9B C3 18 25 10`，TAS `9B C6 2A 49 20`，WYS `9B C4 28 49 40`，EMS `9B C6 5D 55 30`。它们只追加到精确-子序列查找，不据此泛化位域或覆盖既有映射。
  <https://bbs.wuyou.net/forum.php?mod=viewthread&tid=449091>
- HyperFlashBase `3D NAND MP ROADMAP`，最后更新 `2024-04-21`，可交叉参考 YMTC 常规 TCAT / Xtacking CTF 路线、`X0-A030`、`X1-9050`、`X2-9060`、`X2-6070`、`X3-9060`、`X3-9070`、`X3-6070`、`X4-9060`、`X4-9070`、`X4-6080`、`X5-9080` 等代际关系。路线图是第三方资料，未来/预计项只作弱证据。
- 维护者更新：`X4-9060` 代号为 `WTS`，160L；`X4-9070` 代号为 `SQS`，267L；`X4-6080` 代号为 `PTS`，267L；三者均为 Xtacking 4.0 / ONFI 5.1 / 3600MT/s 资料。
- 维护者补充资料：另有 `X4-9060` TLC / 128L / 512Gbit、`X4-9070` TLC / 267L / 1Tbit / `8Die1TB`、`X4-6080` QLC / 2Tbit / 层数未标明的记录。该补充资料只用于记录新增线索；与现有规格层数冲突时，不覆盖主规格。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/ymtc-process-token.json`
  - `vendor.ymtc.process-alias.v1`
- `packages/core/src/decodepack/rules/tables/nand-die-profile.json`
  - 统一 die 规格表；YMTC PN DecodePack 以 `TAS` / `HUS` / `WDS` 这类 die 规格键交叉引用，统一返回 `die_codename` 以及规则需要公开的规格字段
- `packages/core/src/decodepack/rules/packs/ymtc-nand-token.json`
  - `vendor.ymtc.nand-label.v2`
- `packages/core/src/decodepack/rules/packs/ymtc-unimos-token.json`
  - `vendor.ymtc.unimos-label.v1`
- `packages/core/src/decodepack/identifier/packs/ymtc.json`
  - `flashid.ymtc.v1`
- `packages/core/src/flashid/postprocess.ts`
  - YMTC Flash ID 精确子序列查找，用于补全制程别名；不同 LUN / die / 保留字节变体逐条确认，不用宽泛位域代替

## 输出约定

- `die_codename` 保留 YMTC 具体 die 规格键，例如 `TAS`、`HUS`、`WDS`，公开标签渲染为 `Process` / `制程`。
- `process_alias` 单独输出 `X2-9060` / `X3-9070` 这类工艺别名；Xtacking `generation_info` 提供独立代际信息，与 `die_codename` 同时保留。
- `cell_level`、`layer_count`、`die_density`、`plane_count` 分别表达 xLC、层数、die 容量和平面数。`nand_interface.rating` 保留 PN ONFI / 速度等级，`nand_interface.capability` 保留 die 接口能力；即使同值也保留两个作用对象，不塞进 `die_codename` 文本。
- 裸 NAND / UNIMOS 规则包可以按 die 规格键合并共享表；eMMC / UFS 规则包只使用共享表中不覆盖 PN 自带 `cell_level` 或容量编码段的字段。
- Flash ID DecodePack 的字节 / 位规则只输出泛化代际、容量、单元、页等可由位段直接确定的信息；完整或子序列命中后的 die 规格、单 die 容量、平面、ONFI、冗余区和每块页数由核心后处理补充。
- Flash ID 的公开代际文案统一为 `Gen1`、`Gen2 Xtacking 1.0` 等紧凑 `GenN` 形式；不再输出顺序编号或 `Gen 1` / `Gen 2` 形式。
- `Block Size` 资料在 YMTC 特性表中以页表达；公开输出优先使用 `pages_per_block`。不要把页数直接塞进字节语义的 `block_size`。

## 工艺别名摘要

| 制程 | 代号 | 代际 | 层 | xLC | 单 die 容量 | 平面 | 速度 / ONFI | 规则用途 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `X0-A030` | DBS | Gen1 | 32 | MLC | 64Gb | 1 | 533MT/s | 制程别名 / PN 制程编码段 |
| `X1-9050` | JGS | Gen2 Xtacking 1.0 | 64 | TLC | 256Gb | 2 | ONFI 4.0 / 800MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X2-9060` | TAS | Gen3 Xtacking 2.0 | 128 | TLC | 512Gb | 4 | ONFI 4.1 / 1600MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X2-6070` | HUS | Gen3 Xtacking 2.0 | 128 | QLC | 1.33Tb | 6 | ONFI 4.1 / 1200MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X3-9060` | WYS | Gen4 Xtacking 3.0 | 128 | TLC | 512Gb | 4 | ONFI 5.0 / 2400MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X3-9070` | WDS | Gen4 Xtacking 3.0 | 232 | TLC | 1Tb | 6 | ONFI 5.0 / 2400MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X3-6070` | EMS | Gen4 Xtacking 3.0 | 232 | QLC | 1Tb | 4 | ONFI 5.0 / 2400MT/s | 制程别名 / PN / Flash ID 后处理 |
| `X4-9060` | WTS | Gen5 Xtacking 4.0 | 160 | TLC | 512Gb | 4 | ONFI 5.1 / 3600MT/s | 制程别名 / PN / Flash ID 后处理 / MP |
| `X4-9070` | SQS | Gen5 Xtacking 4.0 | 267 | TLC | 1Tb | 6 | ONFI 5.1 / 3600MT/s; `8Die1TB` 封装说明 | 制程别名 / PN / Flash ID 后处理 |
| `X4-6080` | PTS | Gen5 Xtacking 4.0 | 267 | QLC | 2Tb | 8 | ONFI 5.1 / 3600MT/s | 制程别名 / PN / Flash ID 后处理 |

## 补充资料记录

| 制程 | 补充记录 | 处理 |
| --- | --- | --- |
| `X4-9060` | TLC / 128L / 512Gbit / Xtacking 4.0 / ONFI 5.1 3600MT/s | 保留现有 `WTS` 规格的 160L；补充资料不覆盖主表 |
| `X4-9070` | TLC / 267L / 1Tbit / Xtacking 4.0 / ONFI 5.1 3600MT/s / `8Die1TB` | 与主表一致；`8Die1TB` 只记录为封装线索 |
| `X4-6080` | QLC / 2Tbit / Xtacking 4.0 / ONFI 5.1 3600MT/s / 层数未标明 | 保留现有 `PTS` 规格的 267L；补充资料不删除层数 |

## 注意

`X5-9080` 等后续路线来自第三方路线图或未来/预计信息时，不应直接扩展为完整 Flash ID 后处理规则。只有拿到稳定 Flash ID 序列或官方特性/订购信息后，才补序列查找和测试用例。
