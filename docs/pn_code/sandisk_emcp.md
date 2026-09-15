# SanDisk eMCP / MCP iNAND PN 记录

采集日期：2026-07-13

## 当前结论

本轮仍未找到 SanDisk 官方公开 eMCP PN 订购编码表。但 Western Digital / SanDisk 官方 RoHS EU Declaration of Conformity 直接将 `SD7DP26A-XXXX` 标识为 `MCP iNAND`，因此可以将固定系列编码段 `SD7DP26A` 归类为受管理 NAND MCP iNAND。

该 DoC 只提供系列占位符，没有给出容量、eMMC 版本、封装或 NAND 代际。规则因此只接受 `SD7DP26A-` 加 4 位大写字母/数字变体编码段的完整结构，只输出 `product_family = MCP iNAND`，不从占位符推导其他属性。

官方资料：

- Western Digital / SanDisk `SD7DP26A-XXXX SanDisk RoHS DoC`
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/collateral/cert/rohs/SD7DP26A-XXXX%20SanDisk%20RoHS%20DoC.pdf>

## 规则状态

已新增最小 iTXTech fdnext DecodePack 系列规则：

- 规则文件：`packages/core/src/decodepack/rules/packs/sandisk-inand-managed-token.json`
- 规则 ID：`vendor.sndk.inand.mcp.sd7dp26a.v1`
- 测试用例：`packages/core/test/decodepack/part-number/sandisk.test.ts`

边界：

- 固定匹配系列 `SD7DP26A`，尾部只允许 4 位字母/数字编码段；不做 `SD7` 或 `SD7DP` 宽前缀匹配。
- 输出只限 SanDisk、`managed_nand` 与 `MCP iNAND` 系列；不输出容量、eMMC 版本、封装、NAND 制程/代际。
- 规则优先级高于现有 SanDisk 裸 NAND 回退，避免 MCP 系列被错分类。
- 没有原厂订购编码表前，不增加更细的编码段语义。

## 后续准入要求

进入规则库至少需要满足以下之一：

- 原厂产品简介 / 数据手册给出 eMCP 订购信息。
- 多个外部表格与本地 `fdb` / `fdfdb` 同向，可标记为 `external_table_confirmed`，并只按编码段结构解析。
