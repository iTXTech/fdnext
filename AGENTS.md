# AGENTS.md

本文件是给后续编码代理的仓库工作指南。进入本仓库后，请先阅读本文件，再阅读相关源码和文档。

## 项目概览

`fdnext` 是 FlashDetector 的 TypeScript monorepo 实现，使用 `pnpm` 和严格 TypeScript。核心能力包括 FlashId / PN 解码、JSON DSL 规则编译、资源包、HTTP server、CLI、兼容性测试和 FDB 生成。

主要目录：

- `packages/core`: 解码引擎、公共 SDK 和输出转换。
- `packages/dsl`: PN / FlashId JSON DSL 规则、编译器和规则测试。
- `packages/resources`: 内置 `fdb` / `mdb` / 多语言资源。
- `packages/fdbgen`: 从本地数据集生成 FDB 的工具。
- `packages/server`: HTTP 服务。
- `packages/cli`: 命令行工具。
- `docs`: DSL、集成、FDBGen 和 PN 编码资料。

常用命令：

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm -C packages/dsl test
pnpm -C packages/dsl typecheck
pnpm -C packages/resources typecheck
pnpm compat:ci
```

## 工作习惯

- 开始前先执行 `git status --short`，确认已有未提交修改。不要回退用户或其他代理的改动。
- 搜索文件和文本优先用 `rg` / `rg --files`。
- 小范围手工改文件用 `apply_patch`。
- 新增或调整规则后，优先补测试；测试位置通常是 `packages/dsl/test/managed-nand.test.ts`。
- 修改 `extraInfo` 字段名时，同步检查 `packages/resources/resources/lang/eng.json` 和 `packages/resources/resources/lang/chs.json`。
- 对 JSON DSL 文件保持可读的表驱动结构。不要为了过测试引入一次性特判。

## PN DSL 规则约束

PN 解析必须走结构化 token + 规则库，不允许写死完整 PN 白名单。

推荐做法：

- 按前缀、固定长度 token、最长前缀表、组合 key 表来解析。
- 对未知 token 保留已能确定的字段，不应让整条 PN 直接失效。
- 规则文件尽量按厂商和芯片 / 产品类型拆分。一个 JSON pack 中最好只放一种芯片或产品线的解析规则，例如 `samsung-ufs-token.json`、`skhynix-emcp-token.json`。
- 新 pack 需要在 `packages/dsl/src/rules/default-rules.ts` 导入并加入 `defaultDslRules`。
- 顶层 `density` 继续使用项目既有单位 Mbit，例如 8GB = `65536`。
- `assign.extraInfo` 使用内部 key，例如 `component_density`、`generation_info`、`storage_interface`，不要直接写展示文本。
- 不维护历史 metadata alias 或运行时兼容转换。新增或清理字段时，直接迁移 DSL 源规则、语言包和 testcase，并把旧 key 加入审计测试的禁止列表。

特别禁止：

- 用完整料号数组做直接匹配。
- 把外部引用状态、来源 URL、推断来源等维护信息 merge 到 `extraInfo`。
- 只根据厂商前缀判断 eMMC / UFS / MCP 类型；需要结合后续 token。

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
- `local_pending_external_reference`: 仅本地 `fdb` / `fdfdb` 或 MPTool 数据，暂未找到外部网页。不要删除候选，可保留在 DSL 内部 metadata 或工作总结中，但不要写成确定结论。

本地 `../fdfdb` 可以用于辅助推断，但 MPTool 数据质量不稳定。进入确定规则前必须找外部网页确认；找不到 reference 时，总结哪些字段可确定、哪些仍待确认。

可信度字段只允许留在 DSL 内部 metadata，例如 `tables.reference`。以下字段不得出现在用户可见输出中：

- `local_pending_external_reference`
- `external_confirmed`
- `external_table_confirmed`
- `status`
- `source`
- `reference`
- `inference_source`

测试中可以用 `absentExtra` 明确防止这些字段泄漏。

## 跨厂商输出术语

跨厂商字段统一见 `docs/pn_code/terminology.md`。新增规则时优先使用以下内部 key：

- NAND / managed NAND: `component_density`、`die_density`、`die_stack`、`generation_info`
- MCP storage: `storage_density`、`storage_interface`
- Controller: `controller`、`controller_code`、`controller_revision`
- DRAM / MCP DRAM: `dram_type`、`dram_density`、`dram_die_density`、`dram_die_stack`、`dram_generation`、`dram_speed`、`dram_width`、`dram_voltage`

不要让 Samsung、SK hynix、Micron、KIOXIA 等厂商输出同一概念时使用不同字段风格。

## 测试和验证

规则变更建议至少运行：

```bash
pnpm -C packages/dsl test
pnpm -C packages/dsl typecheck
pnpm -C packages/resources typecheck
git diff --check
```

如果改动影响 core 输出、资源打包或兼容性夹具，再运行：

```bash
pnpm test
pnpm typecheck
pnpm compat:ci
```

测试期望应检查：

- `rawVendor` / `type` / `rawDensity` / `density`
- `processNode` / `cellLevel` / `package`
- 关键 `extraInfo` 字段
- 维护 metadata 没有泄漏到 `extraInfo`

## 文档更新要求

新增或扩展 PN 规则时，同步更新：

- 对应 `docs/pn_code/<vendor>_<product>.md`
- `docs/pn_code/README.md` 的索引或摘要
- 需要时更新 `docs/pn_code/terminology.md`
- 如果新增或重命名用户可见字段，更新语言包和审计测试；不要新增 alias 兼容层。
- 如果引用可信度策略变化，更新 `docs/pn_code/reference_policy.md`

文档中要区分“外部资料确认”和“本地数据推测”。没有外部 reference 的内容不要写成确定事实。
