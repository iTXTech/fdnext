# DecodePack 外部资料覆盖审计

审计日期：2026-07-13

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
| DRAM 搜索资源 | `dram-pn.json` 共 3149 条，重复 PN 为 0；vendor 缺失为 0。`H5WG6HMN6QX038R` 仍只有单一公开 body，作为 exact 搜索种子保留但不据此建立 decoder，因此 type / numeric density 均缺失；`CXDR4FFBM-CS-A` 可确认 16Gb DDR5，但未知 organization/package token 不推测 |
| Managed NAND 搜索资源 | `managed-nand-pn.json` 共 891 条，重复 PN 为 0；vendor 缺失为 0。`HN8T039JHQX099N` 只有单一公开 body，作为 exact 搜索种子保留，不据此建立 decoder，因此 type / numeric density 明确缺失 1 条 |
| Micron 去重 | MDB exact / suffix-boundary 审计通过；有效 MDB 已覆盖的 Micron PN 不重复加入 DRAM / managed PN 资源 |
| Controller | FDB / IDDB 中 165 个 controller 全部包含在 `controller-groups.json`；`all` 另保留 2 个外部已知 controller，167 个均已分类 |
| 规则约束 | 资源 PN 对所有 `partSpecs.match.value` 的逐项扫描未发现完整 PN 命中；DecodePack checker 与 metadata audit 通过 |

## 本轮新增资料已落地

- Samsung：官方 DRAM/UFS/MCP 型号资源补齐；LPDDR4/4X、LPDDR5/5X、raw NAND 局部 token 完善；补入 legacy eMMC `W/Y` die token、eMMC 4.5/5.0 version 与 11 条官方搜索 PN；按官方 Class 100 brochure 补入 `5U000` legacy eMCP 结构规则与 6 条搜索 PN；本轮再补入 HBM2/HBM2E/HBM3/HBM3E 的 4 条结构化规则与 22 条颗粒级搜索 PN，并按 Samsung datasheet 为 `EC D3 10 A6 64`、`EC D3 14 A5 64`、`EC D5 14 B6 74` 建立独立 legacy large-page geometry profile，不猜电压或多芯片封装总容量。
- SK hynix：HBM2E/HBM3、32Gb DDR4、modern LPDDR4X、eMCP 独立 storage/DRAM token；按 byte3 条件化补入 legacy SLC Read ID geometry，并用 H27 2Gbit datasheet 锁定四种电压/位宽回归；从公开产品表补入 standalone DRAM 与 UFS exact 搜索 PN，新增结构化 H58 LPDDR5、H56G32 8Gb GDDR6 与 H57G42 16Gb x32 GDDR7 规则，扩展 LPDDR5X `GD/GE` density 与 315/441/561-ball serial package，并确认 H9HC `BP/T`、H54 `AYR:B/J`、H28S package 语义。GDDR7 新增两条 external component-matrix exact PN，只对两行共同确认的 `MP2` 输出 28Gbps，不猜 `MP4`、`AX`、serial 或 package；产品表中的模组与 SSD 页面明确排除。
- Micron：HBM3E、MTFC UFS family token、uMCP package/speed、GDDR6 18Gbps；补入 eMMC 4.51/5.0/5.1 的 12 组 `component:controller` family 与 `DW` package；从官方 current / obsolete eMMC、UFS catalog 补入 42 条未被有效 MDB 覆盖的非样品 exact PN，排除 2 条容量结构异常记录，MDB 去重保持。继续审计 15 条 current eMMC-based MCP、14 条 UFS-based MCP、519 条 current DRAM 与 1238 条 obsolete DRAM catalog 记录，新增 6 条 managed NAND 与 67 条 DRAM 非 MDB exact 搜索 PN，并补齐 `MT29GZ...` density `9`、package `ET`、speed `046`、temperature `AUT` token；本轮再审计 96 条 current/obsolete NAND MCP catalog，补 `PB/PL/SK/SP/TB/KB` package token，并按 TN-29-19 为 legacy 2Gb READ ID 增加 64B spare-area 解析，搜索资源缺口为 0。继续按官方 catalog 补齐 HBM2E `AC/BF` package、16 条非样品 exact 搜索 PN，以及 LPDDR5 `1DA` config 边界与两个 `Y62P` exact PN；ESMT datasheet 中 ONFI manufacturer 为 Micron 的两个完整 Read ID 仅作 exact geometry override，不泛化相邻 `2C` profile。
- YMTC：UC023/UC310/UC260 UFS token family 与搜索矩阵已覆盖；本轮用器件表和 Pandora 实机容量日志补入 `YMUS8A1TE2D1C1` / `YMUSAA1TE4D2C1`，并按 UC260/UC341 官方页为 `B5:H` / `B4:F` 组合补齐 Xtacking 4.0 / 3.0 代际；冲突的 `YMUS9A1TE3D1C1` 保持排除。
- CXMT：按 Rockchip/CSEKER 外部料号表补入 `CXDC/CXDD` LPDDR5/LPDDR5X family、density、layout/package 局部 token 与搜索 PN；按 EDN 实物拆解与开发板手册补入 `CXDQ2BFAM-CG` 的 4Gb x16 / DDR4-2400 组合 token；由 CSEKER、Rockchip QVL、ChromeOS non-SPD table、FCC BOM、官方原理图与公开器件表持续补全 standalone exact 搜索 PN。TechInsights 对 `CXDB6CCDM-MA` / `CXDBCCCDM-MA` 确认的不同实物高度只进入 evidence；public package 仅按 family + package token 输出，不建立 `6:CDM` / `C:CDM` 等近似完整 body 的组合映射。容量或封装相互冲突的 `CXDB7CCDM-MA-M` / `CXDQ2BFAM-CE-B` 继续排除。
- BIWIN：standalone LPDDR4X/LPDDR5X、uMCP5X、TGE408 eMMC、ePoP/eMCP/current eMMC catalog。
- Longsys / FORESEE：DDR3L、current eMMC/UFS/eMCP catalog；已有 SPI NAND 保留但不继续扩展。
- ESMT：FC51 eMMC 5.1 与 F59L/F59D parallel SLC NAND；F50 SPI family 明确不命中。
- KIOXIA：XL-FLASH BA4R/BA8R/BA8S package token 与 legacy identifier 补齐；官方 Automotive UFS 4.1 的 128GB/256GB/512GB/1TB PN 已做全容量定向回归；补入 Automotive eMMC 5.1 Grade 2 / Grade 3 的 32GB~256GB exact PN line-up，新增 7 条搜索资源。
- SanDisk：在确认 PN 没有独立 package token 后，按 family+density 外部表推断 iNAND package；不使用完整 PN 查表。
- Intel / SpecTek：legacy identifier、structured raw NAND suffix/status/package 与 `I29F` 厂商前缀变体。
- Winbond：SDR DRAM 与 16 条官方 4Gb LPDDR4/LPDDR4X 4267 MT/s ordering PN 已覆盖；本轮按官方 datasheet 把既有 W29N01/02/04/08 并行 SLC NAND 扩展到 23 组完整 Read ID profile，并原地补齐 L 系列、D/Y package、独立 option/ECC token；未知 profile 仍只识别厂商。此前加入的 SPI NAND 保留但不再扩展。
- Macronix：按官方 datasheet 覆盖 MX30LF/MX60LF 18AC、28AB/28AC/28AD，MX30UF/MX60UF 16/18AC/28AB/28AD、MX30UF4G28AC 与 MX30LF/MX30UF GE8AB internal-ECC 并行 SLC NAND Read ID；电压、位宽及不同代际/容量的 page/block/spare/ECC geometry 均逐 profile 保留。新增规则严格按官方 naming guide 拆分 MX30/MX60、voltage、density、ECC、width、mode、generation、package 与 temperature token；MX35 SPI family 明确不命中。
- ISSI：按官方 SLC NAND part decoder 建立 IS34/IS35 的结构化 family、voltage、density、width、ECC、package、temperature 与 packing grammar；按 4Gb/8Gb datasheet 补入 6 条完整 `9D` Read ID geometry。归属冲突的 legacy `C8` ID 继续排除，不借厂商前缀泛化。
- Nanya：对 11 个官方 standalone component 页面合计 364 个 PN 做完整矩阵审计，补入此前缺少的 178 条 DDR2/DDR3/DDR3L/DDR4/DDR5 与 LPDDR2/3/4/4X exact 搜索 PN；package、speed、grade token 覆盖缺口均为 0，并新增 `6AT:I/H` 温区。KGD、Elixir 与所有模组产品未纳入。

## 已检索但资料不足，暂不写规则

| 厂商 / 产品 | 缺失证据 |
| --- | --- |
| Samsung HBM4、V9/V10 NAND | 只有产品族容量、速率、层数或营销代际，尚无公开颗粒 PN/token breakdown |
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
