# iTXTech fdnext

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version](https://img.shields.io/github/v/release/iTXTech/fdnext?include_prereleases)](https://github.com/iTXTech/fdnext/releases)

**fdnext** 是一个面向存储芯片的高性能一站式解析引擎。它为料号 (PN) 解码、NAND Flash ID 检查以及跨厂商、跨存储技术的数据库搜索提供全面支持。

[English](README.md)

---

### 🚀 立即体验
**[FlashMaster](https://github.com/iTXTech/FlashMaster)** 是 `fdnext` 引擎的旗舰实现——一个专为工程师设计的存储芯片智能平台。

[**👉 打开 FlashMaster Web 应用**](https://fm.itxtech.org)

---

## ✨ 概览

`fdnext` 被设计为存储芯片智能平台的核心基石。它将复杂的厂商数据归一化为结构化、可操作的信息，并结合本地资源进行丰富，同时通过严格的结果 contract 验证。

### 核心工作流
- **料号解析:** 即时解析 Raw NAND, eMMC, UFS, DRAM 等复杂料号。
- **Flash ID 解析:** 通过 typed identifier API 对 NAND Flash ID 进行深度检查。
- **智能资源流:** 内置 `fdb`、`mdb`、语言包，并支持 Micron FBGA 代码反查。
- **通用调度:** 为 Hapi、Cloudflare Workers 和阿里云 FC 提供共享 runtime 层。
- **数据维护:** 提供用于 FDB/MDB 生成、爬取和 DecodePack 管理的 CLI 工具。

---

## 🏗️ 架构设计

`fdnext` 采用严格的 TypeScript monorepo 组织。主包已经内置规则、资源和共享 runtime，平台包只保留薄适配器。

- **核心 ([`@itxtech/fdnext-core`](packages/core)):** 引擎、DecodePack 规则 / 编译器、内置资源、result contract 和共享 runtime。
- **适配器:** 原生支持 [Hapi](packages/server), [Cloudflare Workers](packages/cf-workers), 和 [阿里云 FC](packages/aliyun-fc)。
- **旧接口兼容:** [`@itxtech/fd-server`](packages/fd-server) 为 FlashMaster Classic 迁移部署提供旧 FlashDetector / FDWebServer HTTP API。

---

## 🛠️ 工具链与开发

本项目使用 [pnpm](https://pnpm.io/) 进行工作区管理。

### 前置条件
- Node.js 24+
- pnpm 10+

### 快速开始
```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试套件
pnpm test
```

### 常用命令
| 命令 | 描述 |
| :--- | :--- |
| `pnpm build` | 构建工作区中的所有包 |
| `pnpm test` | 运行所有单元测试和集成测试 |
| `pnpm typecheck` | 在整个仓库运行 TypeScript 类型检查 |
| `pnpm contract:check` | 验证结果 schema 和行为 contract |
| `pnpm lint` | 在各包提供 lint 脚本时运行对应检查 |

---

## 📊 解析覆盖

| 范围 | 产品族 | 当前覆盖厂商 |
| :--- | :--- | :--- |
| **NAND PN** | Raw NAND, eMMC, UFS, eMCP/uMCP, E2NAND | Samsung, SK hynix, SanDisk/WD, KIOXIA, Micron, YMTC, Kingston, Longsys, BIWIN, Silicon Motion |
| **DRAM PN** | DDR, LPDDR (容量, 代际, 封装, 速度等) | Micron, Crucial, SK hynix, Samsung, Nanya, Elpida, CXMT, GigaDevice, ISSI, Winbond |

---

## 📖 文档

统一文档索引位于 [**docs/README.md**](docs/README.md)。

- [**集成指南**](docs/INTEGRATION.md)：SDK、HTTP 服务和部署说明。
- [**Server 接口文档**](docs/SERVER_API.md)：路由、参数和响应 contract。
- [**FlashDetector 兼容服务**](packages/fd-server/README.md)：面向 FlashMaster Classic 客户端的 `fd-server` 部署说明。
- [**DecodePack 规范**](docs/DECODEPACK.md)：编写 PN 和 identifier 规则。
- [**FDBGen 文档**](docs/FDBGEN.md)：数据库生成和爬取。
- [**术语表**](docs/pn_code/terminology.md)：规范字段 key 和命名约定。

---

## ⚖️ 许可证

版权所有 (c) 2019-2026 iTX Technologies

本项目基于 **GNU Affero General Public License v3.0** 开源。详见 [LICENSE](LICENSE) 文件。
