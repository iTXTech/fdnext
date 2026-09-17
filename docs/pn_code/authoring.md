# PN 规则编写规范

适用于 PN DecodePack、PN 搜索资源和厂商编码资料维护。命令及代码路径以仓库根目录为基准。厂商与模组扩展范围遵循根目录 [AGENTS.md](../../AGENTS.md)；具体产品线资料从 [PN 索引](README.md) 定位。

## 结构化解析

- 使用前缀、固定长度编码段、最长前缀表或局部组合键；JSON 规则包保持可读的表驱动结构，不为单个案例新增一次性特判。
- `partSpecs.match` 识别厂商、产品线和已知头部结构。非定长或有可扩展尾缀的 PN 不用完整已知后缀排除未知编码段；官方订购编码明确定长时，可以约束编码段长度、总长度和字符类别。
- 禁止用完整 PN 数组、`match.value` 完整料号字面量或等价白名单匹配；解码器中也不得直接查完整 PN、基础 PN 或等价主体。外部确认的完整 PN 可进入搜索资源、资料和测试用例，公开字段仍须由实际存在的编码段或可泛化局部组合推导。
- 后续未知编码段通过 `default`、`takeLongest`、`map`、剩余 `rest` 自然降级，保留厂商、类型、容量等已知字段。eMMC / UFS / MCP 类型须结合后续编码段，不能仅靠厂商前缀。
- `tokenDecoder.assign` 的路径与表达式见 [DecodePack](../DECODEPACK.md#原生草稿输出)。
- 规则包组织与注册见 [DecodePack](../DECODEPACK.md#5-规则包组织方式)。

## 输出与证据

字段含义、单位、公开格式和字段迁移要求以 [术语规范](terminology.md) 为准。

`package` 只能由 PN 实际包含的封装编码段和可泛化的外部映射推导：

- 优先使用厂商料号编码 / 订购编码表。不要把精确主体拆成容量 + 配置/堆叠/材料等近似完整料号组合（例如 `C:CDM`、`6:CDM`）伪装成泛化规则；没有更强订购编码依据时，组合键最多使用实际存在的系列 + 封装两个编码段。
- PN 缺少封装编码段时，不从同族完整订购 PN、精确数据手册或拆解结果反推封装。例如 `H27UCG8T2E` 是短丝印，不能借完整订购 PN 的封装补 `package`。
- 精确实物尺寸只记入证据，不参与解码。封装类型、脚位或尺寸证据不足时，只输出已确认部分，具体格式见术语规范。

DRAM 的默认 die/CS 与内部拓扑元数据见 [DRAM 术语](terminology.md#dram)。新增映射、候选保留和证据迁移遵循 [证据准入策略](reference_policy.md)。

## 搜索资源

`managed-nand-pn.json` / `dram-pn.json` 是顶层数组，只保留 `vendor/pn`，用于补全与搜索；映射与字段推导仍来自 DecodePack。Micron / Crucial / Micron 旧版 Elpida 的 FBGA 反查由 `mdb.json` 承载，爬取流程见 [FDBGen](../FDBGEN.md#cli-用法)。

同一官方 PN 的纯标点等价项只保留一种规范展示形态。文档和 PN 中的 `-` / `:` 是编码段分隔符；用户按原编码段顺序省略 `-` 时，解析与搜索按同一 PN 处理。

解析容错不能抹掉展示用分隔符。已有明确订购编码边界的规则在对应 token 游标处使用
`markPartNumberSeparator`，不要在前端、结果构造器或厂商全局正则中重复推导。
匹配只确认厂商前缀时不能标记边界；主体可能解析失败时用 `if` 引用已成功消费的主体变量。
无可靠边界时保留输入写法，未知尾部不截断，不补造缺失编码。语法见 [DecodePack](../DECODEPACK.md)。

Micron PN 优先使用 `packages/core/resources/mdb.json`。有效 MDB 映射已包含同一 PN，或在该 PN 后通过 `-`、`:`、空格等后缀边界给出更详细的速度 / 温度 / 状态 / 修订版时，不再向 `dram-pn.json` / `managed-nand-pn.json` 添加较短或等价 PN。带 `DO NOT USE` 的 MDB 值不算有效覆盖。相关修改保持 DRAM 与受管理 NAND 的 MDB 去重审计通过。

## 完成条件

- 新增或扩展规则同步对应 `docs/pn_code/<vendor>_<product>.md`、PN 索引链接和 `evidence/decodepack-references.json`；新产品线使用独立文档。只有术语或准入策略变化时才调整对应共享规范。
- 行为测试放在对应产品线：DRAM 使用 `packages/core/test/decodepack/dram/`，PN / 料号解码使用 `packages/core/test/decodepack/part-number/`。按改动覆盖正常编码段、未知编码段和相关回归，不复制同义测试。
- 断言相关 `device.vendor` / `chipKind` / `productType`、容量、制程、单元类型、位宽、封装和关键规范字段；涉及公开输出时检查编码/编码段、维护元数据不泄漏，`speed_grade` 不重复 `dram_speed`。通用禁止项继续由 `packages/core/test/decodepack/metadata-audit.test.ts` 审计。
- 按 [验证指南](../TESTING.md) 运行本次影响范围内的检查并修复引入的问题；完成后报告已确定字段和仍待外部资料确认的部分。
