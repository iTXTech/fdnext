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
pnpm -C packages/core test
pnpm -C packages/core typecheck
pnpm contract:check
```

## 工作习惯

- 开始前先执行 `git status --short`，确认已有未提交修改。不要回退用户或其他代理的改动。
- 搜索文件和文本优先用 `rg` / `rg --files`。
- 小范围手工改文件用 `apply_patch`。
- 新增或调整规则后，优先补测试；测试位置通常是 `packages/core/test/decodepack/managed-nand.test.ts`。
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
- `speed_grade` 是例外：需要保留原始 speed / grade token，并可附带可读含义，例如 `046BT Fully Tested`、`PG Partial Good Mixed Bins`。
- `voltage` / `dram_voltage` 只表达电压本身；不要把 DDR 代际、DRAM 类型、产品线等已在其他字段出现的信息重复塞进电压文本。
- `package` 只在官方资料、datasheet、catalog、拆解或可信分销页能确认实际封装尺寸 / ball count / pin 信息时输出；只有厂商 package token 时应省略公开 `package`，不要退回输出 package code。
- 不维护历史 metadata alias 或运行时兼容转换。新增或清理字段时，直接迁移 iTXTech fdnext DecodePack 源规则、语言包和 testcase，并把旧 key 加入审计测试的禁止列表。

特别禁止：

- 用完整料号数组做直接匹配。
- 在 PN `match.value` 里写完整料号字面量或等价的完整料号白名单；定长 PN 只能用结构化 token 长度表达。
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

- `external_confirmed`: 原厂页面、公开 datasheet、TechInsights、TechPowerUp 等可直接确认 PN、产品线、容量、die 或代际。可进入规则和 testcase。
- `external_table_confirmed`: FlashInfo、论坛 flash-id 表、SSD dump、分销页面等外部网页与本地 `fdb` / `fdfdb` 同向。可进入规则，但文档应说明来源档位。
- `local_pending_external_reference`: 仅本地 `fdb` / `fdfdb` 或 MPTool 数据，暂未找到外部网页。不要删除候选，可保留在 iTXTech fdnext DecodePack 内部 metadata 或工作总结中，但不要写成确定结论。

官方 PDF、datasheet、ordering information、part catalog 和 selection guide 如果清楚暴露 token 结构，可直接作为规则和 testcase 依据。本地 `../fdfdb` 可以用于辅助推断，但 MPTool 数据质量不稳定。进入确定规则前必须找外部网页确认；找不到 reference 时，总结哪些字段可确定、哪些仍待确认。

可信度字段只允许留在 iTXTech fdnext DecodePack 内部 metadata，例如 `tables.reference`。以下字段不得出现在用户可见输出中：

- `local_pending_external_reference`
- `external_confirmed`
- `external_table_confirmed`
- `status`
- `source`
- `reference`
- `inference_source`

测试中应明确防止这些字段泄漏到 public fields。

## 跨厂商输出术语

跨厂商字段统一见 `docs/pn_code/terminology.md`。新增规则时优先使用以下内部 key：

- NAND / managed NAND: `component_density`、`die_density`、`die_stack`、`generation_info`
- MCP storage: `storage_density`、`storage_interface`
- Controller: `controller`、`controller_revision`
- DRAM / MCP DRAM: `dram_type`、`dram_density`、`dram_die_density`、`dram_die_stack`、`dram_generation`、`dram_speed`、`dram_width`、`dram_voltage`

不要让 Samsung、SK hynix、Micron、KIOXIA 等厂商输出同一概念时使用不同字段风格。
不要新增公开 `*_code` 字段来表达跨厂商概念；如果确实需要保留原始 token，应先判断它是否属于 `speed_grade` 这类用户有直接价值的例外，否则只留在规则内部变量、表 key 或 metadata 中。

## 测试和验证

规则变更建议至少运行：

```bash
pnpm -C packages/core test
pnpm -C packages/core typecheck
git diff --check
```

如果改动影响 core 输出、资源打包或 result contract 夹具，再运行：

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
- `speed_grade` 保留原始 speed / grade token
- 维护 metadata 没有泄漏到 public fields

## 文档更新要求

新增或扩展 PN 规则时，同步更新：

- 对应 `docs/pn_code/<vendor>_<product>.md`
- `docs/pn_code/README.md` 的索引或摘要
- 需要时更新 `docs/pn_code/terminology.md`
- 如果新增或重命名用户可见字段，更新语言包和审计测试；不要新增 alias 兼容层。
- 如果引用可信度策略变化，更新 `docs/pn_code/reference_policy.md`

文档中要区分“外部资料确认”和“本地数据推测”。没有外部 reference 的内容不要写成确定事实。
