# 文档索引

本页列出文档入口和职责。同一信息只由一篇文章完整描述，其他文章通过链接引用，避免重复维护规则、表格、示例和命令。

| 文档 | 职责 |
| --- | --- |
| [验证指南](TESTING.md) | 仓库初始化、开发命令、检查范围、构建复用及 PN 覆盖审计流程 |
| [集成指南](INTEGRATION.md) | SDK 接入、浏览器资源、服务启动及部署说明 |
| [服务 API](SERVER_API.md) | HTTP 路由、查询参数、响应约定、状态行为及 CORS 规则 |
| [Cloudflare Workers 部署](CF_WORKERS.md) | Wrangler 配置、本地开发、部署及 Worker 外部链接说明 |
| [FlashDetector 兼容服务](../packages/fd-server/README.md) | FlashMaster Classic 迁移、旧 FD HTTP 路由及 fd-server 的 Workers / Node.js 部署 |
| [FDBGen 文档](FDBGEN.md) | FDB 生成、MDB 抓取、原始输入结构、清洗规则及抓取行为 |
| [FDBGen v1 支持列表格式](FDBGEN_FORMAT_V1.md) | 提取工具向 fdbgen 提供的标准支持列表 JSON 格式 |
| [DecodePack 规范](DECODEPACK.md) | JSON 语法、编译器 API、规则注册及诊断工具 |
| [PN 资料索引](pn_code/README.md) | 厂商与产品线 PN 资料入口及维护边界 |
| [PN 编写规范](pn_code/authoring.md) | 编码段结构、封装证据、PN 资源去重及完成条件 |
| [资料可信度策略](pn_code/reference_policy.md) | 规则准入等级及来源可信度元数据的存放位置 |
| [跨厂商术语规范](pn_code/terminology.md) | 公开字段键及显示术语 |
| [NAND die 规格](pn_code/nand_die_profile.md) | 共享规格键、固件命名及回退归一规则 |
| [DRAM 覆盖方法](pn_code/dram_coverage.md) | 厂商代际调查的组织方法 |
| [约定验证包](../packages/contract-test/README.md) | 源码验证 API 及基准数据位置 |
| [PN 覆盖审计](pn_code/coverage_audit.md) | 带日期的覆盖统计和调查结果 |
| [字段信息审计](pn_code/field_information_audit.md) | 带日期的迁移证据和信息保留结果 |
| [FDB 87 关联审计](pn_code/evidence/pn-flash-id-matching-2026-09.md) | 带日期的 PN–ID 样例及全量数据指标 |

## 文档职责

- 根目录 `README.md` 介绍项目；各包的 README 提供导航。没有其他归属的包专属内容，例如 Classic 兼容服务和约定验证源码 API，保留在对应包的 README 中。
- 集成、运行时、HTTP API 和维护流程放在 `docs/` 目录。
- 共享 HTTP 接口事实归属 `SERVER_API.md`；平台部署指南引用该文档，不复制路由表。
- 厂商专属的 PN 结构、来源说明、编码表和样例放在 `docs/pn_code/<vendor>_<product>.md`。
- 来源可信度规则归属 `docs/pn_code/reference_policy.md`，公开字段命名归属 `docs/pn_code/terminology.md`。
- 审计文章注明日期，记录测量结果、本次审计方法及未解决的观察。当前规则和厂商编码定义归属上表中的规范与厂商资料。
- 删除重复内容前，将独有信息移入其归属文章。历史统计保留为历史事实，不能作为当前覆盖率。仓库内引用使用相对链接和章节锚点。
- 全仓库工作边界归属 `AGENTS.md`，PN 编写规则归属 `docs/pn_code/authoring.md`，验证范围归属 `docs/TESTING.md`；其他文章引用这些入口，不复制流程。每次只阅读当前改动相关的文档和章节。

## 文档语言

- 全仓库文档统一使用中文，包括标题、正文、表头和示例注释；只维护一个语言版本。
- 厂商名称、PN、字段键、函数名、命令、协议名等技术标识保持原样。普通说明使用中文，例如“运行时”“封装”“编码段”“数据手册”。
- 必要术语首次出现时给出中文解释和原文，例如“原生单 die 容量（native die density）”；后文统一使用同一简称。公开字段含义以[术语规范](pn_code/terminology.md)为准。
- 外部资料正式标题、原文引述和许可证原文保留原语言；解释与结论使用中文。
- 翻译不改变字段值、代码行为或证据强度；未知、推断和已确认的边界必须保留。
