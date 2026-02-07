# fdnext

`FlashDetector` 的 TypeScript 重写版本，目标是：

- 模块化：核心引擎、HTTP 服务、CLI、DSL 解码规则分层清晰
- 低耦合：`@fdnext/core` 不内置厂商解析逻辑
- 高内聚：厂商解析逻辑以 DSL 规则包形式沉淀在 `@fdnext/dsl`
- 可集成：核心引擎可在浏览器/Node.js 环境使用（无运行时网络依赖）

## 运行环境

- Node.js: `>= 24`
- 包管理器: `pnpm`

## 开发（仓库内）

```bash
pnpm install
pnpm sync:resources
pnpm -r build
```

## 快速入口

- 服务端：见 `/Users/peratx/dev/fdnext/docs/INTEGRATION_SERVER.md`
- 浏览器：见 `/Users/peratx/dev/fdnext/docs/INTEGRATION_BROWSER.md`

## 主要包

- `@fdnext/core`：纯解码/搜索引擎（可在浏览器运行）
- `@fdnext/dsl`：DSL schema + 编译器（把规则编译为 core 可用的 decoder）
- `@fdnext/server`：HTTP 服务（兼容原 FDWebServer 的接口形状）
- `@fdnext/cli`：命令行工具
- `@fdnext/compat-test`：兼容性测试夹具与 diff 工具

## 兼容性回归

该仓库内置 “PHP vs TS” 夹具对比（用于迁移/重构时的行为回归控制）：

```bash
pnpm compat:ci
```

可通过环境变量指定依赖路径：

- `SF_HOME=/Users/peratx/dev/SimpleFramework`
- `FDNEXT_FLASHDETECTOR=/Users/peratx/dev/FlashDetector`

## 相关文档

- 设计分层：`/Users/peratx/dev/fdnext/docs/ARCHITECTURE.md`
- DSL 说明：`/Users/peratx/dev/fdnext/docs/DSL_SPEC.md`
- 迁移说明：`/Users/peratx/dev/fdnext/docs/MIGRATION.md`
- 实现计划：`/Users/peratx/dev/fdnext/docs/PLAN.md`
