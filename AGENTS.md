# AGENTS.md

本文件是给后续编码代理的仓库工作指南。进入本仓库后，请先阅读本文件，再阅读相关源码和文档。

## 项目概览

`fdnext` 是面向存储器芯片的一站式解析方案，使用 `pnpm` 和严格 TypeScript monorepo 组织。核心能力包括 PN / typed identifier 解码、iTXTech fdnext DecodePack JSON 规则编译、资源包、HTTP server、CLI、result contract 检查和 FDB / MDB 维护。

主要目录：

- `packages/core`: 解码引擎、公共 SDK、DecodePack JSON 规则 / 编译器、内置 `fdb` / `mdb` / 多语言资源、平台无关 runtime 和输出转换。
- `packages/fdbgen`: 从本地数据集生成 FDB 的工具。
- `packages/server`: HTTP 服务。
- `docs`: iTXTech fdnext DecodePack、集成、FDBGen 和 PN 编码资料。

常用命令：

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm check
pnpm -C packages/core test
pnpm -C packages/core typecheck
pnpm contract:check
```

Engine 生命周期约束：常规 Node、浏览器、Worker isolate 和服务进程都应创建并长期复用一个 `FdnextEngine`，不要为每次 decode/search 创建新 engine。`PreparedCatalog` 仅用于确实需要多个不同配置 engine 时共享不可变资源准备结果，不能把它描述成推荐的逐请求多实例模式。

## 工作习惯

- 开始前先执行 `git status --short`，确认已有未提交修改。不要回退用户或其他代理的改动。
- 搜索文件和文本优先用 `rg` / `rg --files`。
- 小范围手工改文件用 `apply_patch`。
- 文档、源码、测试和提交信息中不得写入本机绝对路径；引用本地资料时最多写文件名，仓库内文件用相对路径。
- 新增或调整规则后，优先补对应产品线测试；测试位置按芯片类型选择，例如 DRAM 用 `packages/core/test/decodepack/dram/<vendor-or-module>.test.ts`，PN / part decode 用 `packages/core/test/decodepack/part-number/<vendor-or-module>.test.ts`。
- DRAM 搜索建议测试默认不跑；只有新增 / 调整 DRAM PN 资源、FBGA marking 或搜索建议相关行为时，额外运行 `pnpm -C packages/core test:dram:search`。如果改动影响 contract SDK 的 part search 输出，也额外运行 `pnpm -C packages/contract-test test:part-search:dram`。
- Micron PN 搜索资源以 `packages/core/resources/mdb.json` 为优先来源。有效 MDB mapping 已包含同一 PN，或在该 PN 后通过 `-`、`:`、空格等 suffix 边界给出更详细的 speed / temperature / status / revision 时，不得再把较短或等价 PN 加入 `dram-pn.json` / `managed-nand-pn.json`。带 `DO NOT USE` 的 MDB 值不算有效覆盖。修改这些资源时必须保持 DRAM 与 managed NAND 的 MDB 去重审计测试通过。
- 新增 SSD 整盘、DIMM / SODIMM / RDIMM、LPCAMM 等模组 decoder 前必须获得用户明确批准，不能从“所有品类”或一般补全任务推断授权。Micron `MTFC` 等芯片级 BGA SSD / managed NAND 可按既有范围维护；不要据此扩展到其他厂商的盘级 SSD 或内存模组。
- 不新增厂商规则、资源或文档，除非用户明确同意该厂商；默认只完善仓库已有厂商和产品线。
- DecodePack / PN 资料完善优先级：第一优先 SK hynix、Samsung、Micron；第二优先 YMTC、CXMT；其他现有厂商只在前两级没有更高价值缺口或属于顺手修复时处理。
- 新增或重命名 canonical field key 时，同步检查 `packages/core/src/field-registry.ts`、`packages/core/resources/lang/eng.json` 和 `packages/core/resources/lang/chs.json`。
- 对 iTXTech fdnext DecodePack JSON 文件保持可读的表驱动结构。不要为了过测试引入一次性特判。

## PN iTXTech fdnext DecodePack 规则约束

PN 解析必须走结构化 token + 规则库，不允许写死完整 PN 白名单。

推荐做法：

- 按前缀、固定长度 token、最长前缀表、组合 key 表来解析。
- 对未知 token 保留已能确定的字段，不应让整条 PN 直接失效。
- `partSpecs.match` 用于识别厂商 / 产品线 / 已知头部结构；非定长或带可扩展尾缀的 PN，不要用完整已知后缀把未知后续 token 排除掉，头部结构符合时应继续命中对应类型并输出已确定字段。
- 官方 ordering 明确定长的 PN 可以在 `match` 里规定 token 长度 / 总长度，但必须是结构化长度和字符类别，不得退化成完整料号字面量或已知 PN 白名单。
- 后续 token 的未知情况应通过 `tokenDecoder` 的 `default`、`takeLongest`、`map`、剩余 `rest` 等结构化步骤自然降级，不能为了完整料号格式把规则写成完整料号特判。
- 规则文件尽量按厂商和芯片 / 产品类型拆分。一个 JSON pack 中最好只放一种芯片或产品线的解析规则，例如 `samsung-ufs-token.json`、`skhynix-emcp-token.json`。
- 新 pack 需要在 `packages/core/src/decodepack/rules/default-rules.ts` 导入并加入 `defaultPartDecodeSpecs`。
- `fields.density` / `fields.dram_density` 继续使用项目既有单位 Mbit，例如 8GB = `65536`。
- `tokenDecoder.assign` 只输出 native draft 路径：`device.*`、`fields.*`、`identifiers.*`、`controllers`、`components`、`meta.*`。用户可见字段使用 canonical snake_case key，例如 `component_density`、`generation_info`、`storage_interface`，不要直接写展示文本。
- `package_code`、`config_code`、`controller_code`、`die_code`、`feature_code` 以及其他 `*_code` token 只用于规则内部解析，不得进入 `fields.*` 或 public result；package / config / controller 等 token 命中后，应优先输出 `package`、`controller`、`controller_revision`、`die_revision`、`process_node`、`special_option` 等语义字段。
- `nand_component`、design ID、product generation code 等纯编码线索也默认只作内部 token；没有稳定可读语义时不要输出给用户。
- 用户可见字段不应重复表达同一语义。一个 token 同时能推导出 canonical 字段和原始/派生描述时，只保留用户最有价值的字段；例如 `dram_speed` 已经输出 `DDR3L-1333 (667MHz)` 时，不要再输出仅重复 `1333Mbps/pin` 的 `speed_grade`。
- 用户可见的数字代际统一使用紧凑 `GenN` 形式，例如 `Gen1`、`Gen2`、`Gen5 Xtacking 4.0`；不得输出 `1st Gen`、`1st generation`、`Gen 1`、`CXMT G3` 等变体。该约束适用于 `generation_info`、`product_generation`、`dram_generation`、把 maturity 表达成代际的 `prod_status`，以及其他公开代际字段值；内部 `generation_code` / token 变量名、`process_node` 中的厂商工艺别名和 `PCIe Gen4`、`USB 3.2 Gen 1` 等标准或专名不受影响。不要增加运行时归一或兼容转换，直接迁移源规则、共享表、测试和文档。
- `Engineering Sample(s)` / `Early Engineering Sample(s)` 这类样品状态只允许通过 `prod_status` 公开一次，不要重复塞进 `product_class`、`sku`、`special_option` 或其他字段。多个 token 同时推导出样品状态时，最终 public result 也只能有一个 Production Status 字段；公开文案应保留资料中的单复数，不要为了审计机械删 `s`。
- `speed_grade` 是例外但必须有额外用户价值：只在原始 speed / grade token 带有 binning、测试等级、CAS/RL/WL 时序、温度等级等 `dram_speed` 未表达的信息时保留，并可附带可读含义，例如 `046BT Fully Tested`、`PG Partial Good Mixed Bins`。如果只是同一速率的另一种单位或 token 回显，应省略。
- `voltage` / `dram_voltage` 只表达电压本身；不要把 DDR 代际、DRAM 类型、产品线等已在其他字段出现的信息重复塞进电压文本。
- `package` 只在官方资料、datasheet、catalog、拆解或可信分销页能确认封装类型、脚位、尺寸或特殊封装信息时输出；公开格式统一为 `TYPE[-PIN][, DIM][, SPECIAL]`，例如 `FBGA-153, 11.5x13x1.0`、`BGA, 11.0x13.0x0.8`、`WLGA`。缺 pin 时只输出已确认的 TYPE，不得补猜脚位；只有 DIM 被确认而 TYPE 未确认时只保留 DIM；不要输出 `mm`、`ball`、`pin` 等单位词或 `Unknown`。只有厂商 package token 时应省略公开 `package`，不要退回输出 package code。
- PN 本身缺少封装 token 时不得根据同族完整 ordering PN、exact datasheet 或拆解结果反推 `package`；例如短 marking `H27UCG8T2E` 不含封装 token，因此即使完整订购料号的封装已知也保持不输出。
- package 等语义映射应优先来自厂商 part-numbering / ordering table；不得把 exact body 拆成 density + config/stack/material 等近似完整料号组合（例如 `C:CDM`、`6:CDM`）伪装成泛化规则。没有更强 ordering 依据时，组合 key 最多使用实际存在的 family + package 两个 token；exact 实物尺寸只记入 evidence，不参与 decode。
- 不维护历史 metadata alias 或运行时兼容转换。新增或清理字段时，直接迁移 iTXTech fdnext DecodePack 源规则、语言包和 testcase，并把旧 key 加入审计测试的禁止列表。

特别禁止：

- 用完整料号数组做直接匹配。
- 在 PN `match.value` 里写完整料号字面量或等价的完整料号白名单；定长 PN 只能用结构化 token 长度表达。
- 为修复单个或一组 PN，在 decoder 中新增完整 PN、base PN 或等价 body 的直接查表；外部确认的 exact PN 只能进入搜索资源、资料和 testcase，公开字段必须由 PN 中实际存在的 token 或可泛化局部 token 组合推导。
- 把外部引用状态、来源 URL、推断来源等维护信息 merge 到 `fields` 或公开结果。
- 只根据厂商前缀判断 eMMC / UFS / MCP 类型；需要结合后续 token。
- 把 package/config/controller/die/feature 等 code 字段作为“有用细节”展示给用户。

## PN 资料和可信度

PN code 资料放在 `docs/pn_code/`，总览为 `docs/pn_code/README.md`。新增厂商或产品线资料时，优先按厂商 + 产品线拆成独立文档，例如：

- `docs/pn_code/skhynix_nand.md`
- `docs/pn_code/skhynix_emmc.md`
- `docs/pn_code/skhynix_ufs.md`
- `docs/pn_code/skhynix_emcp.md`
- `docs/pn_code/samsung_emmc.md`
- `docs/pn_code/samsung_ufs.md`
- `docs/pn_code/samsung_emcp.md`

可信度策略见 `docs/pn_code/reference_policy.md`。规则准入时按以下原则处理：

- `external_confirmed`: 原厂页面、公开 datasheet、TechInsights、TechPowerUp 等可直接确认 PN、产品线、容量、die 或代际。可进入规则和 testcase；可信度与来源本身只记入 `docs/pn_code/evidence/decodepack-references.json` 和文档。
- `external_table_confirmed`: FlashInfo、论坛 flash-id 表、SSD dump、分销页面等外部网页与本地 `fdb` / `fdfdb` 同向。可进入规则，但来源档位只记入 evidence manifest 和文档。
- `local_pending_external_reference`: 仅本地 `fdb` / `fdfdb` 或 MPTool 数据，暂未找到外部网页。不要删除候选；只保留在 evidence manifest 或工作总结中，不要写成确定结论，也不要放入 DecodePack。

官方 PDF、datasheet、ordering information、part catalog 和 selection guide 如果清楚暴露 token 结构，可直接作为规则和 testcase 依据。本地 `../fdfdb` 可以用于辅助推断，但 MPTool 数据质量不稳定。进入确定规则前必须找外部网页确认；找不到 reference 时，在 evidence manifest 或工作总结中区分哪些字段可确定、哪些仍待确认。

`docs/pn_code/evidence/decodepack-references.json` 是不参与运行时的机器可审计证据清单。manifest v2 使用 `scope: spec` 记录整条规则证据，使用 `scope: table_entry` + `table_key` / `entry_key` 关联实际 decode mapping；不得保留旧 `reference` 伪 table 或兼容读取分支。以下维护字段及其同义信息不得进入 DecodePack、identifier pack、共享 decode table、compiled catalog 或用户可见输出：

- `local_pending_external_reference`
- `external_confirmed`
- `external_table_confirmed`
- `status`
- `source`
- `reference`
- `references`
- `confidence`
- `inference_source`
- 来源 URL、采集日期和不参与 decode 的维护备注

DecodePack table 只保留解码语义数据；编译器当前不会消费的来源、置信度等孤立维护表也必须迁出。暂未接线但属于 decoder mapping 的既有表不在本次证据迁移范围内，不得借迁移删除。测试中应同时防止维护字段回流规则源码和泄漏到 public fields。迁移证据时不得顺带改动、覆盖或删除既有 decode mapping。

## 跨厂商输出术语

跨厂商字段统一见 `docs/pn_code/terminology.md`。新增规则时优先使用以下内部 key：

- NAND / managed NAND: `component_density`、`die_density`、`die_count`、`ce_count`、`rb_count`、`channel_count`、`plane_count`、`generation_info`
- MCP storage: `storage_density`、`storage_interface`
- Controller: `controller`、`controller_revision`
- DRAM / MCP DRAM: `dram_type`、`dram_density`、`dram_die_density`、`dram_die_count`、`cs_count`、`dram_generation`、`dram_speed`、`dram_width`、`dram_voltage`

不要让 Samsung、SK hynix、Micron、KIOXIA 等厂商输出同一概念时使用不同字段风格。
不要新增公开 `*_code` 字段来表达跨厂商概念；如果确实需要保留原始 token，应先判断它是否属于 `speed_grade` 这类用户有直接价值的例外，否则只留在规则内部变量、表 key 或 metadata 中。

## 测试和验证

新增或调整 PN / DecodePack 规则时，默认使用定向验证，不要一上来跑全仓库长流程。常规新规则先运行：

```bash
pnpm cli decodepack check
pnpm -C packages/core exec tsx test/decodepack/<对应测试文件>.test.ts
pnpm -C packages/core typecheck
git diff --check
```

例如 DRAM 规则：

```bash
pnpm cli decodepack check
pnpm -C packages/core test:dram
pnpm -C packages/core typecheck
git diff --check
```

只有在以下情况才升级到 core 全量测试：

- 修改 DecodePack 编译器、engine、搜索索引、输出转换、metadata audit 覆盖范围或共享 runtime。
- 新增 / 重命名 public field、语言包、field registry 或 result contract 相关逻辑。
- 同一改动跨多个产品线测试文件，或定向测试无法覆盖风险面。
- 准备提交前需要额外兜底，且改动已经超出单一规则 pack / 单一资源文件。

core 全量测试命令：

```bash
pnpm -C packages/core test
```

只有改动影响跨包构建、资源打包、server / cf-workers / fdbgen 消费面、或 result contract 夹具时，再运行：

```bash
pnpm test
pnpm typecheck
pnpm contract:check
```

测试期望应检查：

- `device.vendor` / `device.chipKind` / `device.productType`
- canonical fields：`density` / `dram_density` / `process_node` / `cell_level` / `device_width` / `dram_width` / `package`
- 关键 `fields.*` 字段
- public result 不出现 `*_code` 字段或 `Code` 标签；`packages/core/test/decodepack/metadata-audit.test.ts` 应持续防止 code/token 字段泄漏
- `speed_grade` 只在比 `dram_speed` 多表达 binning、测试等级、时序或温度等级等信息时保留；只有重复速率或原始 token 回显时应检查其不存在
- 维护 metadata 没有泄漏到 public fields

## 文档更新要求

新增或扩展 PN 规则时，同步更新：

- 对应 `docs/pn_code/<vendor>_<product>.md`
- `docs/pn_code/README.md` 的索引或摘要
- 需要时更新 `docs/pn_code/terminology.md`
- 如果新增或重命名用户可见字段，更新语言包和审计测试；不要新增 alias 兼容层。
- 如果引用可信度策略变化，更新 `docs/pn_code/reference_policy.md`

文档中要区分“外部资料确认”和“本地数据推测”。没有外部 reference 的内容不要写成确定事实。
