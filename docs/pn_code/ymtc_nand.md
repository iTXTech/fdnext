# YMTC raw NAND PN and Flash ID decoding

采集日期：2026-05-15

## 外部资料

- `YMTC NAND Flash Features.pdf`，标题日期 `2024.07.31`，给出 `X1-9050` 到 `X4-9060` 的 xLC、ONFI、page/block organization、device capacity、plane count、clock rate、电压和耐久信息。
- HyperFlashBase `3D NAND MP ROADMAP`，last update `2024-04-21`，可交叉参考 YMTC conventional TCAT / Xtacking CTF 路线、`X0-A030`、`X1-9050`、`X2-9060`、`X2-6070`、`X3-9060`、`X3-9070`、`X3-6070`、`X4-9060`、`X4-9070`、`X4-6080`、`X5-9080` 等代际关系。路线图是第三方资料，未来/est. 项只作弱证据。
- 维护者更新：`X4-9060` codename 为 `WTS`，160L；`X4-9070` codename 为 `SQS`，267L；`X4-6080` codename 为 `PTS`，267L；三者均为 Xtacking 4.0 / ONFI 5.1 / 3600MT/s 资料。
- 维护者补充资料：另有 `X4-9060` TLC / 128L / 512Gbit、`X4-9070` TLC / 267L / 1Tbit / `8Die1TB`、`X4-6080` QLC / 2Tbit / 层数未标明的记录。该补充资料只用于记录新增线索；与现有 profile 层数冲突时，不覆盖主 profile。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/ymtc-process-token.json`
  - `vendor.ymtc.process-alias.v1`
- `packages/decodepack/src/rules/tables/nand-die-profile.json`
  - 统一 die profile 表；YMTC PN DecodePack 以 `TAS` / `HUS` / `WDS` 这类 die profile key cross-reference，统一返回 `die_codename` 以及规则需要公开的 profile 字段
- `packages/decodepack/src/rules/packs/ymtc-nand-token.json`
  - `vendor.ymtc.nand-label.v2`
- `packages/decodepack/src/rules/packs/ymtc-unimos-token.json`
  - `vendor.ymtc.unimos-label.v1`
- `packages/decodepack/src/identifier/packs/ymtc.json`
  - `identifier.nand_flash_id.ymtc.v1`
- `packages/core/src/flashid/postprocess.ts`
  - YMTC Flash ID sequence lookup for exact process alias enrichment

## 输出约定

- `die_codename` 保留 YMTC 具体 die profile key，例如 `TAS`、`HUS`、`WDS`，公开 label 渲染为 `Process` / `制程`。
- `process_alias` 单独输出 `X2-9060` / `X3-9070` 这类工艺 alias；已有 `die_codename` 时不再重复公开 Xtacking `generation_info`。
- `cell_level`、`layer_count`、`die_density`、`plane_count`、`speed_grade` 分别表达 xLC、层数、die 容量、plane 数和 ONFI / max clock，不塞进 `die_codename` 文本。
- raw NAND / UNIMOS pack 可以按 die profile key 合并共享表；eMMC / UFS pack 只使用共享表中不覆盖 PN 自带 `cell_level` 或容量 token 的字段。
- Flash ID DecodePack 的 byte / bit 规则只输出泛化 generation、density、cell、page 等可由位段直接确定的信息；完整或子序列命中后的 die profile、die density、plane、ONFI、redundant area 和 pages-per-block 由 core postprocess 补充。
- `Block Size` 资料在 YMTC feature 表中以 pages 表达；公开输出优先使用 `pages_per_block`。不要把 pages 数直接塞进 byte 语义的 `block_size`。

## 工艺 alias 摘要

| Process | Codename | Generation | Layers | xLC | Die density | Plane | Speed / ONFI | 规则用途 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `X0-A030` | DBS | Gen 1 | 32 | MLC | 64Gb | 1 | 533MT/s | process alias / PN process token |
| `X1-9050` | JGS | Gen 2 Xtacking 1.0 | 64 | TLC | 256Gb | 2 | ONFI 4.0 / 800MT/s | process alias / PN / Flash ID postprocess |
| `X2-9060` | TAS | Gen 3 Xtacking 2.0 | 128 | TLC | 512Gb | 4 | ONFI 4.1 / 1600MT/s | process alias / PN / Flash ID postprocess |
| `X2-6070` | HUS | Gen 3 Xtacking 2.0 | 128 | QLC | 1.33Tb | 6 | ONFI 4.1 / 1200MT/s | process alias / PN / Flash ID postprocess |
| `X3-9060` | WYS | Gen 4 Xtacking 3.0 | 128 | TLC | 512Gb | 4 | ONFI 5.0 / 2400MT/s | process alias / PN / Flash ID postprocess |
| `X3-9070` | WDS | Gen 4 Xtacking 3.0 | 232 | TLC | 1Tb | 6 | ONFI 5.0 / 2400MT/s | process alias / PN / Flash ID postprocess |
| `X3-6070` | EMS | Gen 4 Xtacking 3.0 | 232 | QLC | 1Tb | 4 | ONFI 5.0 / 2400MT/s | process alias / PN / Flash ID postprocess |
| `X4-9060` | WTS | Gen 5 Xtacking 4.0 | 160 | TLC | 512Gb | 4 | ONFI 5.1 / 3600MT/s | process alias / PN process token / MP |
| `X4-9070` | SQS | Gen 5 Xtacking 4.0 | 267 | TLC | 1Tb | 6 | ONFI 5.1 / 3600MT/s; `8Die1TB` package note | process alias / PN process token |
| `X4-6080` | PTS | Gen 5 Xtacking 4.0 | 267 | QLC | 2Tb | - | ONFI 5.1 / 3600MT/s | process alias / PN process token |

## 补充资料记录

| Process | 补充记录 | 处理 |
| --- | --- | --- |
| `X4-9060` | TLC / 128L / 512Gbit / Xtacking 4.0 / ONFI 5.1 3600MT/s | 保留现有 `WTS` profile 的 160L；补充资料不覆盖主表 |
| `X4-9070` | TLC / 267L / 1Tbit / Xtacking 4.0 / ONFI 5.1 3600MT/s / `8Die1TB` | 与主表一致；`8Die1TB` 只记录为封装线索 |
| `X4-6080` | QLC / 2Tbit / Xtacking 4.0 / ONFI 5.1 3600MT/s / 层数未标明 | 保留现有 `PTS` profile 的 267L；补充资料不删除层数 |

## 注意

`X5-9080` 等后续路线来自第三方 roadmap 或 future/est. 信息时，不应直接扩展为完整 Flash ID postprocess 规则。只有拿到稳定 Flash ID 序列或官方 feature/order 信息后，才补 sequence lookup 和 testcase。
