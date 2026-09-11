# 验证范围与命令

所有命令从仓库根目录运行，脚本定义以对应 `package.json` 为准。按改动影响选择以下一档，再叠加实际触发的专项检查；这不是每次任务都要执行的流水线。

## 基础范围

| 改动 | 验证 |
| --- | --- |
| 纯文档、代理指令、排版 | 检查内容、相对链接、引用命令和 `git diff --check`；不运行应用测试或构建 |
| 单一 PN / DecodePack pack | `pnpm cli decodepack check`、对应测试文件、`pnpm -C packages/core typecheck`、`git diff --check` |
| 单一 PN 搜索资源 | 对应资源审计/行为测试、`git diff --check`；按下方条件补搜索专项检查 |
| 编译器、engine、搜索索引、输出转换、共享 runtime、metadata audit 覆盖范围 | `pnpm -C packages/core test`、core typecheck；DecodePack 变化同时做 DecodePack 检查 |
| 新增/重命名公开字段、语言包、field registry、result contract 逻辑，或改动跨多个产品线 | core 全量测试和 core typecheck；涉及 DecodePack 同时检查规则，跨包影响见下一档 |
| 跨包构建、资源打包、server / cf-workers / fdbgen 消费面，或 result contract 夹具 | `pnpm test`、`pnpm typecheck`、`pnpm contract:check`；已完成的等价构建/测试不重复执行 |

提交前仍按实际风险选择范围。改动超出单一 pack / 资源且定向验证不足时，补 core 全量；不要仅因“准备提交”就重跑已通过的检查。其他包的局部改动使用该包的相关测试和 typecheck。代码或资源修改交付前检查 `git diff --check`。

单文件示例（将路径替换为实际受影响测试）：

```bash
pnpm cli decodepack check
pnpm -C packages/core exec tsx test/decodepack/part-number/samsung.test.ts
pnpm -C packages/core typecheck
git diff --check
```

仅修改单个 DRAM pack 时同样选对应文件；影响多条 DRAM 产品线时可用 `pnpm -C packages/core test:dram` 验证 DRAM 行为，若达到上表 core 全量条件则直接运行 core 全量，不再重复 DRAM 子集。

## 专项触发条件

- 新增/调整 DRAM PN 资源、FBGA marking 或搜索建议行为：额外运行 `pnpm -C packages/core test:dram:search`，默认不跑。
- 同时影响 contract SDK 的 DRAM part search 输出：额外运行 `pnpm -C packages/contract-test test:part-search:dram`。
- Micron MDB 或 PN 搜索资源去重：运行 `packages/core/test/decodepack/dram/resources.test.ts` 和 `packages/core/test/decodepack/part-number/resources.test.ts`；已包含在所选测试范围中时不单独重跑。

## 复用已完成验证

`pnpm test` 的 package 测试会构建消费端包；`pnpm contract:check` 也包含构建。若当前改动后的相同输入已经完成所需构建，可用 `pnpm -C packages/contract-test check:prepared` 完成 contract 检查。`test:prepared` 同理只适用于构建产物仍对应当前源码的情况；不确定或源码又有变化时执行带 prepare 的入口。

检查通过后继续交付，只有新改动、失败或未解决的风险才扩大或重复验证。新增测试应覆盖有价值的行为或回归；纯文档和其他可逆低风险修改不添加复述实现的测试。本地构建、测试或 dry-run 的结果不代表远端部署完成。
