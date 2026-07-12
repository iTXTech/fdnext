# DecodePack 外部资料覆盖审计

审计日期：2026-07-12

## 本轮范围

本轮按现有厂商审计以下芯片级产品：standalone DRAM（含 HBM/GDDR/LPDDR）、parallel raw NAND、NAND Flash ID、eMMC、UFS、eMCP/uMCP/ePoP、E2NAND/E3NAND、芯片级 BGA managed NAND、controller 分类与 marking。

范围边界：

- 不新增厂商。
- SPI NAND 不再扩展；此前已加入的 Longsys / Winbond 规则保留。
- SSD 整盘与 DIMM / SODIMM / RDIMM / LPCAMM 等模组 decoder 必须另行取得用户批准。Micron `MTFC` 芯片级 BGA managed NAND / UFS 按既有范围维护。
- RLDRAM2 不纳入。
- exact PN 只进入资源、测试和文档；规则只按 prefix、长度/字符类别和局部 token / token 组合解析。

## 当前可验证覆盖

| 面向 | 当前证据 |
| --- | --- |
| DRAM 搜索资源 | `dram-pn.json` 共 2764 条；全量解码审计中 vendor / type / numeric density 缺失均为 0，重复 PN 为 0 |
| Managed NAND 搜索资源 | `managed-nand-pn.json` 共 874 条；全量解码审计中 vendor / type / numeric density 缺失均为 0，重复 PN 为 0 |
| Micron 去重 | MDB exact / suffix-boundary 审计通过；有效 MDB 已覆盖的 Micron PN 不重复加入 DRAM / managed PN 资源 |
| Controller | FDB / IDDB 中 165 个 controller 全部包含在 `controller-groups.json`；`all` 另保留 2 个外部已知 controller，167 个均已分类 |
| 规则约束 | 资源 PN 对所有 `partSpecs.match.value` 的逐项扫描未发现完整 PN 命中；DecodePack checker 与 metadata audit 通过 |

## 本轮新增资料已落地

- Samsung：官方 DRAM/UFS/MCP 型号资源补齐；LPDDR4/4X、LPDDR5/5X、raw NAND 局部 token 完善；补入 legacy eMMC `W/Y` die token、eMMC 4.5/5.0 version 与 11 条官方搜索 PN；按官方 Class 100 brochure 补入 `5U000` legacy eMCP 结构规则与 6 条搜索 PN，不猜资料未给出的 eMMC version / DRAM speed。
- SK hynix：HBM2E/HBM3、32Gb DDR4、modern LPDDR4X、eMCP 独立 storage/DRAM token；按 byte3 条件化补入 legacy SLC Read ID geometry，并用 H27 2Gbit datasheet 锁定四种电压/位宽回归；补入 1 条 E2NAND 与 2 条无后缀 UFS exact 搜索 PN，无 package token 的条目继续不输出封装。
- Micron：HBM3E、MTFC UFS family token、uMCP package/speed、GDDR6 18Gbps；补入 eMMC 4.51/5.0/5.1 的 12 组 `component:controller` family 与 `DW` package；从官方 current / obsolete eMMC、UFS catalog 补入 42 条未被有效 MDB 覆盖的非样品 exact PN，排除 2 条容量结构异常记录，MDB 去重保持。继续审计 15 条 current eMMC-based MCP、14 条 UFS-based MCP、519 条 current DRAM 与 1238 条 obsolete DRAM catalog 记录，新增 6 条 managed NAND 与 67 条 DRAM 非 MDB exact 搜索 PN，并补齐 `MT29GZ...` density `9`、package `ET`、speed `046`、temperature `AUT` token。
- CXMT：按 Rockchip/CSEKER 外部料号表补入 `CXDC/CXDD` LPDDR5/LPDDR5X family、density、layout/package 局部 token 与 3 条搜索 PN；按 EDN 实物拆解与开发板手册补入 `CXDQ2BFAM-CG` 的 4Gb x16 / DDR4-2400 组合 token 与搜索 PN。
- BIWIN：standalone LPDDR4X/LPDDR5X、uMCP5X、TGE408 eMMC、ePoP/eMCP/current eMMC catalog。
- Longsys / FORESEE：DDR3L、current eMMC/UFS/eMCP catalog；已有 SPI NAND 保留但不继续扩展。
- ESMT：FC51 eMMC 5.1 与 F59L/F59D parallel SLC NAND；F50 SPI family 明确不命中。
- KIOXIA：XL-FLASH BA4R/BA8R/BA8S package token 与 legacy identifier 补齐；官方 Automotive UFS 4.1 的 128GB/256GB/512GB/1TB PN 已做全容量定向回归；补入 Automotive eMMC 5.1 Grade 2 / Grade 3 的 32GB~256GB exact PN line-up，新增 7 条搜索资源。
- SanDisk：在确认 PN 没有独立 package token 后，按 family+density 外部表推断 iNAND package；不使用完整 PN 查表。
- Intel / SpecTek：legacy identifier、structured raw NAND suffix/status/package 与 `I29F` 厂商前缀变体。
- Winbond：SDR DRAM 已覆盖；新增 16 条官方 4Gb LPDDR4/LPDDR4X 4267 MT/s ordering PN；此前加入的 SPI NAND 保留，不再扩展。
- Nanya：对当前官方 DDR5 component 表的 32 条 PN 做完整矩阵回归，补入此前遗漏的 16 条 standalone DDR5 exact 搜索 PN；未纳入官网同时列出的模组产品。

## 已检索但资料不足，暂不写规则

| 厂商 / 产品 | 缺失证据 |
| --- | --- |
| Samsung HBM3/HBM3E、V9/V10 NAND | 有容量、速率、层数或营销代际，但无公开可泛化 ordering PN/token breakdown |
| SK hynix HBM3E/HBM4、V9T/V9Q NAND | 无公开 ordering PN/token breakdown；单一 automotive HBM PN 不足以证明 token 语义 |
| Micron HBM4、UFS 4.1 | HBM4 无公开 PN；UFS 4.1 未绑定到公开 MTFC component/controller token，`BG:BE` 也缺可靠产品线绑定 |
| CXMT LPDDR5X speed / temperature / die topology | 已有 `CXDC/CXDD` family、density、layout/package 局部 token；仍缺公开 suffix 与 die topology breakdown |
| YMTC UC341 / 4 个 YMN 异常候选 | UC341 官方 flyer 下载需登录，exact PN 继续使用拆解、设备日志和烧录器表交叉证据；YMN 候选没有外部交叉样本 |
| KIOXIA / SanDisk eMCP | 未找到原厂公开 ordering token 表 |
| Longsys LPDDR | 官方页面只给容量、封装和速率矩阵，不给逐容量 PN |
| GigaDevice LPDDR5/LPDDR5X | 未找到公开 PN token breakdown |
| SanDisk `SDIN7LP4-64G` | 未找到可靠封装来源，保持 package 缺失 |
| SanDisk `SDINFEO2-256G` | 官方资料只确认尺寸，未确认 package type / pin，保持 package 缺失 |

以上条目不是删除候选；后续出现原厂 ordering table、datasheet 或多源一致的局部 token 证据时再补入。
