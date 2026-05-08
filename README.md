# fdnext

`fdnext` 是 [FlashDetector](https://github.com/iTXTech/FlashDetector) 的 TypeScript 实现，采用多包架构，覆盖核心解码引擎、DSL 规则编译、HTTP 服务、CLI 工具、兼容性回归和独立 FDB 生成能力。

## 主要特性

- ESM 优先的 monorepo，使用严格 TypeScript 配置
- `@itxtech/fdnext-core` 可用于 Node.js 与浏览器环境，无运行时网络依赖
- 基于 JSON DSL 的 PN / FlashId 规则编译与扩展
- 支持请求级 Processor 管线，可在 SDK、Server、CLI 统一接入
- 提供独立的 TypeScript FDB 生成器 `@itxtech/fdnext-fdbgen`

## 包结构

- `@itxtech/fdnext-core`：解码与搜索引擎、SDK 能力
- `@itxtech/fdnext-resources`：可发布的数据资源包（`fdb/mdb/lang`）
- `@itxtech/fdnext-dsl`：DSL 规则与解码器编译器
- `@itxtech/fdnext-server`：基于 Hapi 的 HTTP 服务
- `@itxtech/fdnext-cli`：命令行工具
- `@itxtech/fdnext-fdbgen`：独立 FDB 生成器与 CLI
- `@itxtech/fdnext-compat-test`：兼容性夹具与差异对比工具

## 环境要求

- Node.js `>= 24`
- `pnpm`

## 快速开始

```bash
pnpm install
pnpm build
```

## Docker 运行

在仓库根目录执行：

```bash
docker build -t fdnext-server .
docker run -d --name fdnext -p 8080:8080 fdnext-server
```

## 文档

- [集成指南](docs/INTEGRATION.md)
- [DSL 规范](docs/DSL_SPEC.md)
- [FDBGen 文档](docs/FDBGEN.md)
- [PN 编码资料](docs/pn_code/README.md)

## FDBGen 使用说明

`@itxtech/fdnext-fdbgen` 可从本地数据集生成 `fdb.json`：

```bash
fdnext-fdbgen build --input <dataset-dir> --output <fdb.json> --version <ver> [options]
```

必填参数：

- `--input <dir>`：输入目录
- `--output <file>`：输出文件路径
- `--version <ver>`：写入 `info.version`

可选参数：

- `--meta <file>`：元信息覆盖文件
- `--extra <file>`：额外合并补丁文件
- `--name <name>`：覆盖 `info.name`
- `--website <url>`：覆盖 `info.website`
- `--pretty`：格式化输出 JSON

`info.time` 始终在生成时写入当前 UTC 时间。

输入目录约定（均为可选）：

- `fdb.json`：基础数据
- `vendors/*.json`：按厂商拆分的 PN 记录
- `iddb/*.json` 或 `flashids/*.json`：FlashId 记录
- `meta.json`：默认元信息
- `extra.json`：对 `info/vendors/iddb` 的补丁合并

`mdb` 爬取（Micron + SpecTek）：

```bash
pnpm fdbgen:crawl-mdb -- --file packages/resources/resources/mdb.json
```

## 兼容性回归

仓库内置 PHP 与 TS 的行为对比流程：

```bash
pnpm compat:ci
```

夹具工具依赖的环境变量：

- `SF_HOME=/path/to/SimpleFramework`
- `FDNEXT_FLASHDETECTOR=/path/to/FlashDetector`

## 数据来源

- 上游项目：[iTXTech/FlashDetector](https://github.com/iTXTech/FlashDetector)
- Flash 数据源：[iTXTech/fdfdb](https://github.com/iTXTech/fdfdb)

## 许可证

本项目以 `AGPL-3.0-or-later` 发布，详见 [LICENSE](LICENSE)。
