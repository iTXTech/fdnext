# PN 规则证据与可信度策略

采集日期：2026-07-12

规则库可以使用本地 `fdb` / `fdfdb` 辅助推断，但准入需要区分可信度。来源、可信度和推断过程属于规则维护证据，不是 decode 数据；它们统一记录在 [`evidence/decodepack-references.json`](evidence/decodepack-references.json)，不得放入 iTXTech fdnext DecodePack、identifier pack、共享 decode table、compiled catalog 或用户可见输出。

## 可信度等级

| 状态 | 含义 | 可做动作 |
| --- | --- | --- |
| `external_confirmed` | 原厂页面、公开 datasheet、TechInsights、TechPowerUp 等能直接确认 PN、产品线、容量、die 或代际 | 可进入规则和 testcase |
| `external_table_confirmed` | flashinfo.top、论坛 flash-id 表、SSD dump、分销页面等外部网页与本地 fdb/fdfdb 同向 | 可进入规则，但文档需说明来源档位 |
| `local_pending_external_reference` | 仅本地 fdb/fdfdb 或 MPTool 数据，暂未找到外部网页 | 不删除候选；只记入 evidence manifest 和待确认文档，不作为确定结论 |

## 准入原则

- 禁止完整 PN 白名单匹配；规则必须按结构 token 解析。
- 单个 MPTool / fdfdb 条目不能单独提升为确定规则。
- 本地多源一致时可以保留候选，但应标记 `local_pending_external_reference`。
- 外部网页确认前，不应在文档中写成“已确定”。
- `reference`、`references`、`status`、`source`、`confidence`、`inference_source`、来源 URL、采集日期、外部确认状态和维护备注等非 decode 信息不得进入 DecodePack。
- 规则 pack 的 table 只保存解码语义数据；不能用“编译器当前不会消费”为理由保留来源、置信度等孤立维护表。暂未接线但属于 decoder mapping 的既有表不在本次证据迁移范围内，不得借迁移删除。
- evidence manifest 不参与规则导入、编译、运行时匹配或结果投影。删除它不能改变任何 decode 结果。
- `status` 作为编译器内部的 `matched` / `not_matched` 运行状态不属于本策略所说的证据字段，可以保留；禁止的是规则内的来源可信度状态。

## Evidence manifest

`docs/pn_code/evidence/decodepack-references.json` 是 DecodePack 规则证据的单一机器可审计清单。顶层 `entries` 的每条记录按以下稳定标识关联规则：

- `pack`: 仓库相对路径形式的规则 pack 路径；
- `spec_id`: pack 中的 spec `id`；
- `table_key` / `entry_key`: 原维护表及其 entry key，用于无损追溯；
- `evidence`: 从该 spec 剥离的来源、可信度、样例和维护备注。

同一 spec 有多组独立依据时，在顶层 `entries` 中分别记录，避免用一条宽泛来源为整个表背书。token、组合 key 或局部映射需要精确关联时，应通过 `entry_key` 或 evidence 内容保留原维护 key；不要把维护 key 反向加回 DecodePack。

厂商 PN 文档继续负责解释 token 结构和列出可阅读来源；evidence manifest 负责稳定关联“哪个 pack / spec 使用了哪项证据”。两者都不是 runtime resource。

## 迁移与审计

- 从 DecodePack 剥离维护表时，先完整复制到 evidence manifest，再删除原表；不得借迁移修改、覆盖或删除既有 decode mapping。
- 新增或调整规则时，DecodePack、对应 testcase、厂商 PN 文档和 evidence manifest 应在同一轮更新。
- 审计范围包括 `rules/packs/`、`identifier/packs/`、`rules/tables/`、`default-rules.ts`、`default-decodepack.ts`、schema/types 与 compiler/checker。后续不应只检查 `fields` 是否泄漏，还要检查维护字段是否重新进入规则源码。
- `source` 作为编译器局部变量名、`status: matched | not_matched` 作为运行时类型不需要迁移；审计应依据语义和 JSON 位置，不能机械删除同名运行时代码。
