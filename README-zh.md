# fdnext

[English](README.md)

`fdnext` 是面向存储器芯片的一站式解析方案。它覆盖存储器芯片料号解析、通过 typed identifier API 进行的 NAND Flash ID 解析、Managed NAND 和 DRAM PN 解码、内置数据资源、HTTP 与 CLI 接入、结果 contract 检查，以及 FDB / MDB 维护工具。

仓库以严格 TypeScript monorepo 组织，但对外定位是完整的存储器芯片解析工作流：识别芯片、归一化结果、结合本地资源补充信息，通过 SDK / Server / CLI 暴露能力，并让底层数据维护可复现。

## 主要特性

- 通过 `@itxtech/fdnext-core` 提供存储器芯片 PN 和 typed identifier 解析能力
- 通过 `@itxtech/fdnext-dsl` 提供 PN / identifier JSON DSL 规则包和编译器
- 内置 `fdb`、`mdb`、语言包、managed NAND PN 建议、DRAM PN 建议和 Micron FBGA code 资源
- 支持 Managed NAND 和 DRAM PN 解码，并按厂商维护结构化 token 规则
- 通过统一 `mdb.json` 资源流支持 Micron FBGA 反查
- 提供共享 runtime dispatch 层，并支持 Hapi、Cloudflare Workers 和阿里云 FC adapter 入口
- 提供 External Link result contract，用于平台侧补充外部链接
- 提供 part decode/search、identifier decode/search 和 capabilities CLI 工作流
- TypeScript FDB 生成器支持 raw FlashDB 清理、厂商归属校正、控制器聚合和 MDB 爬取辅助命令
- 提供公开 fdnext API 的 result schema 和行为 contract 测试

## 解析覆盖

| 范围 | 产品族 | 当前覆盖厂商 |
| --- | --- | --- |
| NAND PN | Raw NAND、eMMC、UFS、eMCP/uMCP、E2NAND | Samsung、SK hynix、SanDisk / Western Digital、KIOXIA、Micron、YMTC、Kingston、Longsys、BIWIN |
| DRAM PN | 当前规则包覆盖的 DRAM 料号族，可在可推断时输出容量、代际、封装、Die Stack、速度、修订和温度等字段 | Micron、Crucial、SK hynix、Samsung、Nanya、Elpida、CXMT、ISSI、Winbond |

## 包结构

| Package | 作用 |
| --- | --- |
| `@itxtech/fdnext-core` | 解码 / 搜索引擎、公共 SDK 类型、资源加载辅助函数和 operation 管线 |
| `@itxtech/fdnext-dsl` | JSON DSL 规则包和 PN / identifier 编译器 |
| `@itxtech/fdnext-resources` | 可发布的内置数据资源 |
| `@itxtech/fdnext-runtime` | 平台无关 dispatch、HTTP 路由和 External Link provider |
| `@itxtech/fdnext-server` | Hapi HTTP 服务 adapter |
| `@itxtech/fdnext-cf-workers` | Cloudflare Workers adapter |
| `@itxtech/fdnext-aliyun-fc` | 阿里云函数计算 / 自定义运行时 adapter |
| `@itxtech/fdnext-cli` | 命令行工具 |
| `@itxtech/fdnext-fdbgen` | FDB / MDB 生成和爬取工具 |
| `@itxtech/fdnext-contract-test` | result contract 检查工具 |

## 环境要求

- Node.js `>= 24`
- `package.json` 中 `packageManager` 指定的 `pnpm`

## 快速开始

```bash
pnpm install
pnpm build
pnpm test
```

## 使用文档

README 只作为项目概览入口。统一文档索引是 [docs/README.md](docs/README.md)，集成、运行和维护用法放在 `docs/` 目录：

- [集成指南](docs/INTEGRATION.md)：SDK、浏览器、HTTP Server、部署和接口用法
- [Cloudflare Workers 部署](docs/CF_WORKERS.md)：Wrangler 配置、本地开发和部署
- [FDBGen 文档](docs/FDBGEN.md)：FDB 生成、MDB 爬取、输入布局、清理规则和 crawler 行为
- [DSL 规范](docs/DSL_SPEC.md)：PN 和 typed identifier 规则编写
- [PN 编码资料索引](docs/pn_code/README.md)：厂商和产品线资料
- [PN 规则可信度策略](docs/pn_code/reference_policy.md)：规则准入和来源可信度
- [跨厂商输出术语](docs/pn_code/terminology.md)：canonical public field key 约定

## 规则和数据维护

PN 规则必须保持数据驱动。新增解码覆盖时应添加结构化 JSON DSL pack，不要写完整 PN 白名单。

常用位置：

- `packages/dsl/src/rules/packs/`：PN DSL packs
- `packages/dsl/src/identifier/packs/`：typed identifier DSL packs，例如 NAND Flash ID
- `packages/dsl/src/rules/default-rules.ts`：PN pack 注册入口
- `packages/dsl/src/identifier/default-rules.ts`：identifier pack 注册入口
- `packages/dsl/test/managed-nand.test.ts`、`packages/dsl/test/dram.test.ts`、`packages/dsl/test/metadata-audit.test.ts`：规则验证
- `packages/resources/resources/lang/eng.json` 和 `packages/resources/resources/lang/chs.json`：用户可见 field label
- `docs/pn_code/`：PN 资料和可信度策略

新增或重命名公开字段时，需要同步更新 DSL 源规则、语言包、测试和文档。来源可信度等维护 metadata 只能留在 DSL 内部 metadata 或文档中，不能泄漏到公开 result fields。

## 验证

聚焦检查：

```bash
pnpm -C packages/dsl test
pnpm -C packages/dsl typecheck
pnpm -C packages/resources typecheck
git diff --check
```

完整仓库检查：

```bash
pnpm test
pnpm typecheck
pnpm contract:check
```

常规测试会验证 fdnext result schema、operation 行为、DSL 输出、资源、server、CLI 检查和 result contract fixtures。

## 数据参考

- Flash 数据参考：[iTXTech/fdfdb](https://github.com/iTXTech/fdfdb)

## 许可证

`fdnext` 以 `AGPL-3.0-or-later` 发布，详见 [LICENSE](LICENSE)。
