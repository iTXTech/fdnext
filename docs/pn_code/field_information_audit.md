# 跨字段信息治理

本文保存 2026-09-12 的迁移审计；现行字段语义与信息保全规则统一见 [术语](terminology.md)。

2026-09-12 基线取自 `aed5ecf` 的资源与解析语义，覆盖 25,601 个 PN 和 2,515 个 Flash ID，共 27,950 个成功结果、166 个未识别结果。基线只验证当前解析信息的保全，不把现有规则值重新认证为硬件规格。

## 分阶段实施

1. NAND 接口：将 die 能力和器件等级合入一个有明确作用对象的结构化字段；覆盖同值、不同速率、同速率不同协议、未知等级和 FDB 补充。
2. 源字段整理：修正 ISSI 电压混入类型；拆分重复的单元技术、组件描述、主机协议版本、控制器/产品族以及 MCP 电压/速度；独有信息迁移后才能移除旧描述。
3. 结果生成器：统一源字段归属并移除跨字段抑制；不增加字段内容门禁或条件清空规则，用必要的类型校验和行为回归验证信息保全；完成全资源差异检查与跨包验证。

## NAND 接口迁移

现行接口结构见 [NAND 术语](terminology.md#nand--受管理-nand)。本阶段将共享规格、YMTC PN 与 FDB 等级迁移到明确作用对象；历史样本 `YMN09TC1B1AC6C` 同时保留 PN 的 ONFI 4.2 和 die 的 ONFI 4.1，两侧均为 1600MT/s，差异未被认定为错误。

第一阶段验证：核心的 DecodePack、集成、结果约定共 280 项测试通过；PN 覆盖率基线、核心类型检查和 DecodePack 检查通过。全资源逐字段比较确认 394 项接口/等级信息按上述作用对象迁移，未发现非预期字段变化；未知 `Undefined` 等级不算已知规格，输入编码段保留。

## 源字段整理

首批直接迁移：ISSI 电压表删除类型占位，并去掉已由 DRAM 类型表达的 SDR/移动版修饰；没有数值依据的电压保持未知。NAND 技术中的裸 SLC/MLC/TLC/QLC 移到 `cell_level`，3D 单独保留，`Win-pSLC (TLC NAND)` 等模式与物理单元的区别保持原义。YMTC 控制器字段保留 EC/UC 型号，协议继续由主机接口承载；Longsys 已由产品类别完整表达的通用产品族从规则表移除。

首批提交 `2c037ba` 曾加入针对字段内容的检查；按后续“从源头消除重复”的要求，最终版本撤去这些内容门禁。规则表直接承载正确字段，回归检查规则草稿、中文/英文结果及完整摘要。

后续完成以下迁移：

| 原信息 | 最终归属及保全方式 |
| --- | --- |
| eMMC/UFS `product_version` 与主机接口重复 | 标准及版本直接写入 `storage_interface`；MCP 的 `DC`、`PL_REG` 和版本候选完整保留，并行 NAND 组成在 `product_mode` 中明确标出 |
| 三星 eMMC 的通用控制器描述 | 由源表直接写主机接口版本；独立型号或 UFS 的档位/通道、能力范围不删除 |
| Micron `512Gb TLC x8 3.3V (3D)` 等组件描述 | 分别写入组件容量、位宽、电压、单元类型及 3D 技术或制程节点；裸组件编码段继续仅用于内部解析 |
| SK hynix MCP 的组合速度和电压 | DRAM 类型、电压、速度和 CL 分别归属 DRAM 字段；NVM 位宽独立承载，eMMC Vcc 与 NVM 电压保持作用对象区别 |
| Nanya H0/H1/H2 的重复速率、RL | 速率保留原始 Mbps 单位，等级保留 H0/H1/H2，RL 由 `read_latency` 承载；J1/J2/J3 还保留 ns 周期，CAS 与 RL 不混称 |
| 共享规格重复代际 | 删除与 BiCS 制程名相同的值，以及已完整包含在 HYV/SSV 名称中的代际；HYV 的独立 3D 信息移到 `nand_technology` |
| Kioxia BiCS 泛称与具体代际 | 由规格查询及正常回退直接选择结果，已知代际不再同时输出泛称；未知代际仍保留 `BiCS FLASH` 信息，不使用字段清空或隐藏规则 |

## 结果生成器评估

已删除 `pruneRedundantFields` 和 `suppressDieProfileDuplicateFields`。尤其不再因为存在 `die_codename` 就删除 `generation_info` / `series_info`，也不再一律删除 NAND 的 `process_node`。YMTC Xtacking、Micron FG/RG 以及独立产品代际现在保留在公开结果中。固定字段分组中的重复发射过滤也已移除。

结果生成器的现行分组和显示边界见 [术语](terminology.md#字段分组)。本轮保留了三星 UFS 能力范围、NVMe/PCIe 层次、Winbond 供电模式与 pSLC/物理 TLC 等独立信息。

## 验证结果

- 28,116 个资源结果的状态和设备身份均与基线一致。
- 2,004 处旧字段变化逐项按上述迁移核对：速率与单位、协议候选、RL/CL、ns 周期、组件容量/位宽/电压、附加并行 NAND 组成均有对应承载，未发现无法解释的旧字段信息丢失。
- 新增公开信息包括旧逻辑隐藏的 2,900 处独立代际信息；这些是原有源值的恢复，不是新增硬件规格认定。
- 全资源跨字段完全相同的字符串重复为 0；数值相同但作用对象不同的容量、数量等不按文本去重。
- 完整 `pnpm test` 通过；最后共享表调整后核心的 284 项测试及 PN 覆盖率再次通过；`pnpm typecheck`、DecodePack 检查和 `pnpm contract:check` 的 5 组约定基准数据通过。
- 未修改 FDB 生成文件或其外部数据源；未推送、发布或部署。

## FDB 的速率来源与清单

`sg` 来自外部 FDB 源的 `extra/base.json`，由 `packages/fdbgen/src/extra.ts` 读取、生成器保留，当前共有 31 个 PN，全部属于 SK hynix H25。它不是本次新增的资料；本次仅调整结果中的字段归属，未重新核实这些既有规格的外部来源。

| FDB 原始 `sg` | 数量 | PN |
| --- | ---: | --- |
| `DQ Speed=2400Mbps` | 13 | H25T0TD18CX655、H25T0TD18CX826、H25T1TD28CX656、H25T1TD28CX828、H25T2TD48CX657、H25T2TD48CX659、H25T2TD48CX809、H25T2TD48CX862、H25T3TD88CX658、H25T3TD88CX660、H25T3TD88CX676、H25T3TD88CX811、H25T3TD88CX860 |
| `Max Speed=3600MT/s` | 7 | H25T0TG18GX807、H25T1TG28GX840、H25T2TG48GX842、H25T2TG48GX846、H25T3TG88GX844、H25T3TG88GX848、H25T4TGG8GX848 |
| `Max Speed=3200MT/s` | 7 | H25T1QM18GX834、H25T2QM28GX836、H25T3QM48GX817、H25T3QM48GX822、H25T4QM88GX819、H25T4QM88GX824、H25T5QMG8GX819 |
| `DQ Speed=1600Mbps` | 2 | H25T4TDG8CX658、H25T4TDG8CX660 |
| `DQ Speed=2100Mbps` | 1 | H25T4TDG8CX813 |
| `Max Speed=2280MT/s` | 1 | H25T5QMG8GX830 |

3600/3200 两组共 14 条与相应 die 能力文本相同，但仍保留器件等级和 die 能力两个作用对象。`H25T5QMG8GX830` 的器件等级为 2280MT/s、die 能力为 3200MT/s，差异完整保留，不自动择一。
