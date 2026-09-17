# 验证范围与命令

所有命令从仓库根目录运行，脚本定义以对应 `package.json` 为准。按改动影响选择以下一档，再叠加实际触发的专项检查；这不是每次任务都要执行的流水线。

## 开发环境与入口

仓库使用 Node.js 24.11+、pnpm 12+ 和严格 TypeScript 多包仓库；版本声明见根目录 `package.json`。

```bash
pnpm install
pnpm build
```

| 命令 | 用途 |
| --- | --- |
| `pnpm build` | 构建工作区所有包 |
| `pnpm test` | 全部源码与发布包测试 |
| `pnpm typecheck` | 全仓库 TypeScript 检查 |
| `pnpm contract:check` | 构建并检查结果约定 |
| `pnpm check:decodepack` | DecodePack 结构与维护规则检查 |
| `pnpm check:static` | TypeScript 与 DecodePack 静态检查 |
| `pnpm check` | 并行执行静态检查与 DecodePack 行为测试 |
| `pnpm check:pr` | 构建一次后执行完整源码与发布包检查 |
| `pnpm lint` | `check:static` 的别名 |

规则诊断命令见 [DecodePack 维护工具](DECODEPACK.md#7-维护工具)，数据维护命令见 [FDBGen](FDBGEN.md#cli-用法)。

## 基础范围

| 改动 | 验证 |
| --- | --- |
| 纯文档、代理指令、排版 | 检查内容、相对链接、引用命令和 `git diff --check`；不运行应用测试或构建 |
| 单一 PN / DecodePack 规则包 | `pnpm cli decodepack check`、对应测试文件、`pnpm -C packages/core typecheck`、`git diff --check` |
| 单一 PN 搜索资源 | 对应资源审计/行为测试、`git diff --check`；按下方条件补搜索专项检查 |
| 编译器、引擎、搜索索引、输出转换、共享运行时、元数据审计覆盖范围 | `pnpm -C packages/core test`、核心类型检查；DecodePack 变化同时做 DecodePack 检查 |
| 新增/重命名公开字段、语言包、字段注册表、结果约定逻辑，或改动跨多个产品线 | 核心全量测试和核心类型检查；涉及 DecodePack 同时检查规则，跨包影响见下一档 |
| 跨包构建、资源打包、服务 / cf-workers / fdbgen 消费面，或结果约定基准数据 | `pnpm test`、`pnpm typecheck`、`pnpm contract:check`；已完成的等价构建/测试不重复执行 |

提交前仍按实际风险选择范围。改动超出单一规则包 / 资源且定向验证不足时，补核心全量；不要仅因“准备提交”就重跑已通过的检查。其他包的局部改动使用该包的相关测试和类型检查。代码或资源修改交付前检查 `git diff --check`。

单文件示例（将路径替换为实际受影响测试）：

```bash
pnpm cli decodepack check
pnpm -C packages/core exec tsx test/decodepack/part-number/samsung.test.ts
pnpm -C packages/core typecheck
git diff --check
```

仅修改单个 DRAM 规则包时同样选对应文件；影响多条 DRAM 产品线时可用 `pnpm -C packages/core test:dram` 验证 DRAM 行为，若达到上表核心全量条件则直接运行核心全量，不再重复 DRAM 子集。

## 专项触发条件

- 新增/调整 DRAM PN 资源、FBGA 丝印或搜索建议行为：额外运行 `pnpm -C packages/core test:dram:search`，默认不跑。
- 同时影响约定 SDK 的 DRAM 料号搜索输出：额外运行 `pnpm -C packages/contract-test test:part-search:dram`。
- Micron MDB 或 PN 搜索资源去重：运行 `packages/core/test/decodepack/dram/resources.test.ts` 和 `packages/core/test/decodepack/part-number/resources.test.ts`；已包含在所选测试范围中时不单独重跑。

## 复用已完成验证

`pnpm test` 的包测试会构建消费端包；`pnpm contract:check` 也包含构建。若当前改动后的相同输入已经完成所需构建，可用 `pnpm -C packages/contract-test check:prepared` 完成约定检查。`test:prepared` 同理只适用于构建产物仍对应当前源码的情况；不确定或源码又有变化时执行带预构建的入口。

检查通过后继续交付，只有新改动、失败或未解决的风险才扩大或重复验证。新增测试应覆盖有价值的行为或回归；纯文档和其他可逆低风险修改不添加复述实现的测试。本地构建、测试或试运行的结果不代表远端部署完成。

## PN 资源覆盖审计

`pnpm -C packages/core audit:pn-coverage`，使用一个长期复用的仅解码器引擎批量检查
`dram-pn.json`、`managed-nand-pn.json` 以及去重后的 Micron / SpecTek MDB PN。审计明确区分：

- `semantic`：至少输出一个语义字段；
- `identity-only`：只识别身份 / 厂商，没有语义字段；
- `not-found`：没有规则命中；
- 有意省略解码、仅供搜索：完整 PN 已确认，但公开编码段语法不足，明确不建立完整 PN 解码器。

`pnpm -C packages/core test:pn-coverage` 会把当前未分类待办项与
`packages/core/test/fixtures/pn-coverage-baseline.json` 比较：新出现的未分类 PN、`identity-only -> not-found`
回退、过期或已经可语义解析但未移除的有意省略条目都会失败；既有待办项被规则覆盖后可以自然减少。
`--format=json` 可输出逐 PN 的来源、厂商提示、状态、规则 ID 和字段数量。只有人工复核完
新增缺口与有意省略清单后，才运行 `--update-baseline` 接受新的待办项。

历史测量值见 [覆盖审计](pn_code/coverage_audit.md)。
