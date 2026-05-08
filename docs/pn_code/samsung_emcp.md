# Samsung eMCP / uMCP PN 编码资料

采集日期：2026-05-08

## 来源

- Samsung eMCP 官方页面确认 LPDDR4X eMCP 产品线：eMMC 5.1、LPDDR4X、16GB/32GB/64GB storage、16Gb/24Gb/32Gb DRAM、144/254 FBGA、4266 Mbps。
  <https://semiconductor.samsung.com/mcp/emcp/>
- Samsung MCP 官方页面确认 MCP 同时覆盖 uMCP 与 eMCP，组合 mobile DRAM 与 NAND/eStorage。
  <https://semiconductor.samsung.com/mcp/>
- Samsung Newsroom 说明 uMCP 是 UFS-based multichip package，并使用 LPDDR4X DRAM。
  <https://news.samsung.com/global/samsung-electronics-begins-mass-production-of-industrys-first-12gb-lpddr4x-based-umcp>

## 当前规则状态

当前没有 Samsung eMCP/uMCP PN decoder。原因：

- 官方页面确认产品线和容量范围，但没有公开逐位 ordering table。
- 本地 `fdb/fdfdb` 目前没有足够高置信 Samsung MCP PN 样本。
- 不能仅凭 `KM*` 前缀硬编码为 eMCP/uMCP；需要先确认 storage interface、DRAM type、storage density、DRAM density token。

## 预期输出字段

后续补规则时使用跨厂商字段：

| 字段 | 用途 |
| --- | --- |
| `storage_density` | eMMC/UFS storage 总容量 |
| `storage_interface` | `eMMC 5.1` 或 `UFS x.x` |
| `dram_type` | `LPDDR4X` / `LPDDR5` 等 |
| `dram_density` | DRAM 总容量 |
| `dram_speed` | DRAM 速率 |
| `package` | 144 FBGA / 254 FBGA 等 |

可信度 metadata 必须留在 DSL `tables.reference`，不得输出到 `extraInfo`。

## 待确认

- Samsung MCP PN 前缀集合：旧资料常见 `KMS*`，部分分销页面可见 `KMQ*`，项目现有 vendor 识别还有 `KMD/KMF/KMN/KMV`。
- 这些前缀是否分别对应 eMCP、uMCP、ePoP 或旧 MCP，需要外部 ordering table 或多个高置信样本确认后再进规则。
