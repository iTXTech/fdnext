# @itxtech/fdnext-contract-test

用于验证 fdnext 结果约定与数据结构的测试套件。

## 概览

`packages/contract-test` 验证 fdnext 引擎输出是否符合公开的结果结构定义（`fdnext.result.v2` 和 `fdnext.capabilities.v2`），提供以下功能：

- **结构验证器：** `validateSchema` 按声明的 JSON Schema 检查 fdnext 结果，无需外部依赖。
- **约定检查：** `runContractChecks()` 覆盖全部核心操作（料号解码、料号搜索、标识符解码、标识符搜索和能力查询），按结构定义验证每项响应。
- **测试引擎：** `createContractEngine()` 使用默认 DecodePack 和内置资源组装完整引擎，供测试使用。

当前仓库构建仅为此包生成类型声明。在补充发布用的打包产物前，包元数据不声明运行时 `main` / `exports` 入口。

## 使用方法

### 运行约定检查

检查命令与构建复用条件见[验证指南](../../docs/TESTING.md)。

### 源码 API

```ts
import { runContractChecks, validateSchema, createContractEngine } from "./src/index";

// 运行全部约定检查
const summary = runContractChecks();
console.log(`Checked ${summary.checked} operations: ${summary.operations.join(", ")}`);

// 按结构定义验证单个结果
import { fdnextResultJsonSchema } from "@itxtech/fdnext-core";
const errors = validateSchema(fdnextResultJsonSchema, someResult);
```

## 基准数据

`fixtures/` 目录存放约定测试使用的响应基准快照。

## 文档

- [服务 API](../../docs/SERVER_API.md)：响应结构与约定说明。

[许可证](../../LICENSE)
