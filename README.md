# iTXTech fdnext

[![许可证：AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![版本](https://img.shields.io/github/v/release/iTXTech/fdnext?include_prereleases)](https://github.com/iTXTech/fdnext/releases)

**fdnext** 是存储器芯片解析引擎，支持多个厂商和存储技术的料号（PN）解码、NAND Flash ID 解析及数据库搜索。

## 在线体验

**[FlashMaster](https://github.com/iTXTech/FlashMaster)** 基于 `fdnext` 引擎，为工程师提供芯片信息查询和分析功能。

[打开 FlashMaster 网页应用](https://fm.itxtech.org)

## 功能概览

`fdnext` 将厂商数据整理为结构化信息，结合本地资源补全字段，并按统一的结果约定验证输出。

- **料号解码：** 支持裸 NAND、eMMC、UFS、DRAM 等芯片。
- **Flash ID 解码：** 通过带类型的标识符 API 解析 NAND Flash ID。
- **资源查询：** 内置 `fdb`、`mdb` 和语言包，支持 Micron FBGA 代码查询。
- **请求分发：** Node.js HTTP 与 Cloudflare Workers 共用运行时分发层。
- **数据维护：** 提供 FDB/MDB 生成、抓取、DecodePack 管理和证据元数据审计的命令行工具。

## 仓库结构

`fdnext` 使用严格 TypeScript 多包仓库。主包内置默认规则与资源，平台包负责适配各自的运行环境。

- **核心（[`@itxtech/fdnext-core`](packages/core)）：** 引擎、DecodePack 规则与编译器、内置资源、结果约定和共享运行时。
- **平台适配：** 支持 [Node.js HTTP](packages/server) 和 [Cloudflare Workers](packages/cf-workers)。
- **数据工具（[`@itxtech/fdnext-fdbgen`](packages/fdbgen)）：** 数据库生成、MDB 抓取和资源汇总。
- **约定验证（[`@itxtech/fdnext-contract-test`](packages/contract-test)）：** 验证结果结构和行为是否符合约定。
- **旧版兼容：** [`@itxtech/fd-server`](packages/fd-server) 提供旧版 FlashDetector / FDWebServer HTTP API，用于 FlashMaster Classic 迁移部署，优先部署到 Cloudflare Workers。

## 文档

- [文档索引与职责](docs/README.md)
- [开发与验证](docs/TESTING.md)
- [集成指南](docs/INTEGRATION.md)
- [厂商与产品线资料](docs/pn_code/README.md)

## 许可证

Copyright (c) 2019-2026 iTX 技术

本项目采用 **GNU Affero General 公开 License v3.0** 许可证，详见 [LICENSE](LICENSE)。
