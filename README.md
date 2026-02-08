# fdnext

`FlashDetector` 的 TypeScript 重写版本（上游：<https://github.com/iTXTech/FlashDetector>），目标是：

- 模块化：核心引擎、HTTP 服务、CLI、DSL 解码规则分层清晰
- 低耦合：`@fdnext/core` 不内置厂商解析逻辑
- 高内聚：厂商解析逻辑以 DSL 规则包形式沉淀在 `@fdnext/dsl`
- 可集成：核心引擎可在浏览器/Node.js 环境使用（无运行时网络依赖）

## 上游与数据来源

- 上游项目：<https://github.com/iTXTech/FlashDetector>
- Flash 数据库（RAW fdfdb）：<https://github.com/iTXTech/fdfdb>
- 说明：本仓库的 `resources/` 与解码行为以 FlashDetector 为兼容基准，并通过 `pnpm compat:ci` 做回归对齐。

## 运行环境

- Node.js: `>= 24`
- 包管理器: `pnpm`

## 开发（仓库内）

```bash
pnpm install
pnpm sync:resources
pnpm build
```

## 快速入口

- 集成（Node/浏览器/服务端）：见 `docs/INTEGRATION.md`
- DSL 规范（PN + FlashId）：见 `docs/DSL_SPEC.md`

## 主要包

- `@fdnext/core`：纯解码/搜索引擎（可在浏览器运行，支持请求级 Processor 管线与扩展 SDK）
- `@fdnext/dsl`：DSL schema + 编译器（把规则编译为 core 可用的 decoder）
- `@fdnext/server`：HTTP 服务（兼容原 FDWebServer 的接口形状）
- `@fdnext/cli`：命令行工具
- `@fdnext/compat-test`：兼容性测试夹具与 diff 工具

## 支持范围（对齐上游）

- Flash Vendors：Intel/Solidigm、Micron、Samsung、SK hynix、Kioxia/Toshiba、Western Digital/SanDisk、YMTC、SpecTek
- Controller Vendors：Silicon Motion、ASolid、JMicron、Maxio、SandForce/Seagate、Chipsbank、Alcor Micro、Phison

## 兼容性回归

该仓库内置 “PHP vs TS” 夹具对比（用于迁移/重构时的行为回归控制）：

```bash
pnpm compat:ci
```

可通过环境变量指定依赖路径：

- `SF_HOME=/path/to/SimpleFramework`
- `FDNEXT_FLASHDETECTOR=/path/to/FlashDetector`

## 许可证与声明（重要）

- 上游 FlashDetector 自版本 69 起采用 `AGPL-3.0-or-later` 开源；衍生项目（包括以网络服务形式提供）需遵循 AGPL 的开源义务。
- 本仓库同样以 `AGPL-3.0-or-later` 发布，详情以 `LICENSE` 为准。
