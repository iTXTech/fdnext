# AGENTS.md

`fdnext` 是存储器芯片解析工具，使用 pnpm 和严格 TypeScript 多包仓库。本文件保留全仓库工作边界；专项规范按任务查阅，无需在每次编辑前通读文档或整个仓库。

## 工作方式与完成条件

- 开始前执行 `git status --short`，保留已有修改。搜索优先使用 `rg` / `rg --files`；小范围手工编辑使用 `apply_patch`。
- 按用户请求完成实现、必要文档和相应验证，修复本次改动引入的问题后交付。常规可逆编辑、本地检查和修复重跑可连续进行，不以初稿代替已授权任务的完成。
- 用户明确指令优先于仓库和技能的流程建议；既有授权持续有效。只调查、给方案、不改代码等范围限制照字面执行。普通 `commit` 只授权本次范围内的本地提交；推送、发布和部署按用户授权执行。
- 对不影响结果的细节作合理假设；只有缺失信息会改变任务范围、正确性或涉及未获授权的不可逆操作时才询问，期间继续不依赖答案的工作。若文档规则导致暂停，指出具体文件、原文和影响。
- 完成时简要说明结果、实际验证和未解决的限制；不要把本地检查表述为已发布或已部署。
- 文档、源码、测试和提交信息中不写本机绝对路径；仓库内引用使用相对路径，仓库外本地资料最多写文件名。

## 项目边界

- 引擎生命周期与 `PreparedCatalog` 用法遵循 [集成指南](docs/INTEGRATION.md#1-nodejs-library)。
- 默认完善已有厂商和产品线。新增厂商规则、资源或文档需要用户明确同意该厂商。
- 新增 SSD 整盘、DIMM / SODIMM / RDIMM、LPCAMM 等模组解码器需要用户明确批准，不能从“所有品类”或一般补全任务推断。Micron `MTFC` 等芯片级 BGA SSD / 受管理 NAND 可按既有范围维护。
- PN 补全优先 SK hynix、Samsung、Micron，其次 YMTC、CXMT；其他现有厂商在没有更高价值缺口或属于顺手修复时处理。
- PN 解析遵循 [编写规范](docs/pn_code/authoring.md)，外部证据准入遵循 [可信度策略](docs/pn_code/reference_policy.md)。

## 按任务查阅

只读取本次任务需要的文档和章节；引用不是要求顺序通读的清单。

| 任务 | 入口 |
| --- | --- |
| PN 规则、搜索资源、厂商资料 | [PN 编写规范](docs/pn_code/authoring.md)；从 [PN 索引](docs/pn_code/README.md) 定位对应产品线 |
| DecodePack 语法、编译器、带类型的标识符 | [DecodePack 规范](docs/DECODEPACK.md)；实现位于 `packages/core/src/decodepack/` |
| 公开字段、翻译、结果约定 | [术语规范](docs/pn_code/terminology.md) |
| 证据准入、来源迁移 | [可信度策略](docs/pn_code/reference_policy.md) |
| 引擎、SDK、运行时接入 | [集成指南](docs/INTEGRATION.md)、`packages/core` |
| HTTP、Worker、旧 FD 接口 | [服务 API](docs/SERVER_API.md)、[Worker 指南](docs/CF_WORKERS.md)、[兼容服务](packages/fd-server/README.md)，按实际消费端选择 |
| FDB / MDB 维护 | [FDBGen](docs/FDBGEN.md)、`packages/fdbgen`；FDB 从 `../fdfdb` 经生成器更新，不手改 `packages/core/resources/fdb.json` |
| 选择测试范围与命令 | [验证指南](docs/TESTING.md) |

## 验证与指令维护

- 按 [验证指南](docs/TESTING.md) 选择检查、判断构建复用和是否重跑。文档职责与单一归属遵循 [文档索引](docs/README.md)。

- 维护 AGENTS / 技能时保留项目事实、业务约束和完成条件，合并重复流程；技能描述只说明具体触发条件，多流程正文按需链接细则。不要为每个目录复制同一套指令或固定模型设置。
