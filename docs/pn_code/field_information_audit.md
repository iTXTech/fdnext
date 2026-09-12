# 跨字段信息治理

## 完成边界

目标是从规则、共享表和资源接入处消除重复，不以结果生成器隐藏字段代替修复。删除字段前必须证明其全部已知信息已由其他公开字段承载；设备、NAND die、DRAM、接口协议和速度等级的作用对象不可混淆。不同版本、速度、单位、时序和候选范围不得择一覆盖。

2026-09-12 基线覆盖资源中的 25,601 个 PN 和 2,515 个 Flash ID，共 27,950 个成功结果、166 个未识别结果。基线只验证当前解析信息的保全，不把现有规则值重新认证为硬件规格。

## 分阶段实施

1. NAND 接口：将 die 能力和器件等级合入一个有明确作用对象的结构化字段；覆盖同值、不同速率、同速率不同协议、未知等级和 FDB 补充。
2. 源字段整理：修正 ISSI 电压混入类型；拆分重复的 Cell 技术、组件描述、主机协议版本、控制器/产品族以及 MCP 电压/速度；独有信息迁移后才能移除旧描述。
3. 结果生成器：审计现有字段抑制，修复其上游并建立源数据检查；移除已无必要的抑制逻辑，明确保留机制的必要性；完成全资源信息差异检查与跨包验证。

## NAND 接口迁移

`nand_interface.value` 使用 `{ rating?: string, capability?: string }`：

- `rating`：PN 或资源给出的器件接口速度等级，保留完整协议、速率及限定信息。
- `capability`：共享 NAND die profile 的接口能力，不能充当 managed NAND 的主机接口。
- 两个作用对象的规格相同时 `display` 合并文本，但 `value` 保留两者；不同则分别显示。这里是单个结构化值的格式化，不是跨字段删除。
- 旧 NAND profile 字符串直接迁移为 `capability`；YMTC PN 速度表直接输出 `rating`；raw NAND 的 FDB `sg` 在资源接入时补充尚未明确的 `rating`，不能覆盖 PN 等级。FDB 文件本身不手改。
- 未知 token 保留在输入，未知等级不输出占位值。已有 die 能力保持公开。
- DecodePack 检查拒绝无作用对象的接口字面量；公开 schema 拒绝旧字符串、空对象、空规格和未知属性。

例如 `YMN09TC1B1AC6C` 同时保留 PN `ONFI 4.2; Max Speed=1600MT/s` 和 die `ONFI 4.1; Max Speed=1600MT/s`。差异未被认证为错误，不能自动选取版本或速率。

第一阶段验证：core 的 DecodePack、integration、result contract 共 280 项测试通过；PN coverage 基线、core typecheck 和 DecodePack 检查通过。全资源逐字段比较确认 394 项接口/等级信息按上述作用对象迁移，未发现非预期字段变化；未知 `Undefined` 等级不算已知规格，输入 token 保留。

## 源字段整理

首批直接迁移：ISSI 电压表删除类型占位，并去掉已由 DRAM 类型表达的 SDR/mobile 修饰；没有数值依据的电压保持未知。NAND 技术中的裸 SLC/MLC/TLC/QLC 移到 `cell_level`，3D 单独保留，`Win-pSLC (TLC NAND)` 等模式与物理 Cell 的区别保持原义。YMTC 控制器字段保留 EC/UC 型号，协议继续由主机接口承载；Longsys 已由产品类别完整表达的通用产品族从规则表移除。

源检查拒绝将裸 Cell 类型继续写入 NAND 技术，或把 DRAM 类型写入电压字段；回归同时检查规则草稿、中文/英文结果及完整摘要。首批迁移的 core 原有 280 项测试、PN coverage 检查通过，另增加源头信息保全与错误字段职责回归。
