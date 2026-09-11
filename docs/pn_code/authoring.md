# PN 规则编写规范

适用于 PN DecodePack、PN 搜索资源和厂商编码资料维护。命令及代码路径以仓库根目录为基准。厂商与模组扩展范围遵循根目录 [AGENTS.md](../../AGENTS.md)；具体产品线资料从 [PN 索引](README.md) 定位。

## 结构化解析

- 使用前缀、固定长度 token、最长前缀表或局部组合 key；JSON pack 保持可读的表驱动结构，不为单个案例新增一次性特判。
- `partSpecs.match` 识别厂商、产品线和已知头部结构。非定长或有可扩展尾缀的 PN 不用完整已知后缀排除未知 token；官方 ordering 明确定长时，可以约束 token 长度、总长度和字符类别。
- 禁止用完整 PN 数组、`match.value` 完整料号字面量或等价白名单匹配；decoder 中也不得直接查完整 PN、base PN 或等价 body。外部确认的 exact PN 可进入搜索资源、资料和 testcase，公开字段仍须由实际存在的 token 或可泛化局部组合推导。
- 后续未知 token 通过 `default`、`takeLongest`、`map`、剩余 `rest` 自然降级，保留 vendor、type、density 等已知字段。eMMC / UFS / MCP 类型须结合后续 token，不能仅靠厂商前缀。
- `tokenDecoder.assign` 只输出 native draft 路径：`device.*`、`fields.*`、`identifiers.*`、`controllers`、`components`、`meta.*`。公开字段用 canonical snake_case key，不用展示文本。
- 一个 pack 按厂商和芯片/产品线拆分，例如 `samsung-ufs-token.json`、`skhynix-emcp-token.json`；新增 pack 在 `packages/core/src/decodepack/rules/default-rules.ts` 导入并加入 `defaultPartDecodeSpecs`。

## 输出与证据

字段含义和公开格式以 [术语规范](terminology.md) 为准；调整字段时查阅对应章节。核心边界是容量数值使用 Mbit（8GB = `65536`）、原始 code 留在内部、同一语义只公开一次、未知值省略。新增/重命名字段直接迁移源规则、共享表、field registry、语言包和测试，把旧 key 加入 metadata audit 禁止列表，不加运行时归一或 alias 兼容层。

`package` 只能由 PN 实际包含的封装 token 和可泛化的外部映射推导：

- 优先使用厂商 part-numbering / ordering table。不要把 exact body 拆成 density + config/stack/material 等近似完整料号组合（例如 `C:CDM`、`6:CDM`）伪装成泛化规则；没有更强 ordering 依据时，组合 key 最多使用实际存在的 family + package 两个 token。
- PN 缺少封装 token 时，不从同族完整 ordering PN、exact datasheet 或拆解结果反推封装。例如 `H27UCG8T2E` 是短 marking，不能借完整订购 PN 的封装补 `package`。
- exact 实物尺寸只记入 evidence，不参与 decode。封装类型、脚位或尺寸证据不足时，只输出已确认部分，具体格式见术语规范。

DRAM 默认 die/CS 取决于厂商是否识别封装 / topology token，不能用“公开 package 缺失”替代判断。公开 package 与 die/CS token 来源不同时，显式设置内部 `meta.dramTopologyTokenRecognized`：已知 token 但无公开封装信息可设 `true`；未知 token 即使其他位置仍能输出 package 也必须设 `false`，不得补默认 `dram_die_count` / `cs_count`。完整规则见 [DRAM 术语](terminology.md#dram)。

新增 mapping 或迁移来源时查阅 [证据准入策略](reference_policy.md)。官方 PDF、datasheet、ordering information、part catalog、selection guide 暴露的 token 结构可作为依据；本地 `fdb` / `fdfdb` 或 MPTool 只能辅助推断。没有外部确认的候选不删除，保留在 evidence 或待确认文档中，不进入 DecodePack。证据迁移不改变既有 decode mapping。

## 搜索资源

Micron PN 优先使用 `packages/core/resources/mdb.json`。有效 MDB mapping 已包含同一 PN，或在该 PN 后通过 `-`、`:`、空格等 suffix 边界给出更详细的 speed / temperature / status / revision 时，不再向 `dram-pn.json` / `managed-nand-pn.json` 添加较短或等价 PN。带 `DO NOT USE` 的 MDB 值不算有效覆盖。相关修改保持 DRAM 与 managed NAND 的 MDB 去重审计通过。

## 完成条件

- 新增或扩展规则同步对应 `docs/pn_code/<vendor>_<product>.md`、PN 索引摘要和 `evidence/decodepack-references.json`；新产品线使用独立文档。只有术语或准入策略变化时才调整对应共享规范。
- 行为测试放在对应产品线：DRAM 使用 `packages/core/test/decodepack/dram/`，PN / part decode 使用 `packages/core/test/decodepack/part-number/`。按改动覆盖正常 token、未知 token 和相关回归，不复制同义测试。
- 断言相关 `device.vendor` / `chipKind` / `productType`、容量、制程、cell level、位宽、package 和关键 canonical fields；涉及公开输出时检查 code/token、维护 metadata 不泄漏，`speed_grade` 不重复 `dram_speed`。通用禁止项继续由 `packages/core/test/decodepack/metadata-audit.test.ts` 审计。
- 按 [验证指南](../TESTING.md) 运行本次影响范围内的检查并修复引入的问题；完成后报告已确定字段和仍待外部资料确认的部分。
