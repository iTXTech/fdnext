# SanDisk eMCP / MCP iNAND PN 记录

采集日期：2026-07-13

## 当前结论

本轮仍未找到 SanDisk 官方公开 eMCP PN ordering table。但 Western Digital / SanDisk 官方 RoHS EU Declaration of Conformity 直接将 `SD7DP26A-XXXX` 标识为 `MCP iNAND`，因此可以将固定 family token `SD7DP26A` 归类为 managed NAND MCP iNAND。

该 DoC 只提供 family placeholder，没有给出 capacity、eMMC version、package 或 NAND generation。规则因此只接受 `SD7DP26A-` 加 4 位大写字母/数字变体 token 的完整结构，只输出 `product_family = MCP iNAND`，不从 placeholder 推导其他属性。

官方资料：

- Western Digital / SanDisk `SD7DP26A-XXXX SanDisk RoHS DoC`
  <https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/collateral/cert/rohs/SD7DP26A-XXXX%20SanDisk%20RoHS%20DoC.pdf>

## 规则状态

已新增最小 iTXTech fdnext DecodePack family 规则：

- 规则文件：`packages/core/src/decodepack/rules/packs/sandisk-inand-managed-token.json`
- 规则 ID：`vendor.sndk.inand.mcp.sd7dp26a.v1`
- testcase：`packages/core/test/decodepack/part-number/sandisk.test.ts`

边界：

- 固定匹配 family `SD7DP26A`，尾部只允许 4 位字母/数字 token；不做 `SD7` 或 `SD7DP` 宽前缀匹配。
- 输出只限 SanDisk、`managed_nand` 与 `MCP iNAND` family；不输出 capacity、eMMC version、package、NAND process/generation。
- 规则优先级高于现有 SanDisk raw NAND fallback，避免 MCP family 被错分类。
- 没有原厂 ordering table 前，不增加更细的 token 语义。

## 后续准入要求

进入规则库至少需要满足以下之一：

- 原厂 product brief / datasheet 给出 eMCP ordering information。
- 多个外部表格与本地 `fdb` / `fdfdb` 同向，可标记为 `external_table_confirmed`，并只按 token 结构解析。
