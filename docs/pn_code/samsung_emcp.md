# Samsung eMCP / uMCP PN 编码资料

采集日期：2026-05-08

## 来源

- Samsung eMCP 官方页面确认 LPDDR4X eMCP 产品线：eMMC 5.1、LPDDR4X、16GB/32GB/64GB storage、16Gb/24Gb/32Gb DRAM、144/254 FBGA、4266 Mbps。
  <https://semiconductor.samsung.com/mcp/emcp/>
- Samsung MCP 官方页面确认 MCP 同时覆盖 uMCP 与 eMCP，组合 mobile DRAM 与 NAND/eStorage。
  <https://semiconductor.samsung.com/mcp/>
- Samsung Newsroom 说明 uMCP 是 UFS-based multichip package，并使用 LPDDR4X DRAM。
  <https://news.samsung.com/global/samsung-electronics-begins-mass-production-of-industrys-first-12gb-lpddr4x-based-umcp>
- Samsung `KMGD6001BM-B421` datasheet mirror 给出 32GB e.MMC + 24Gb LPDDR3、221FBGA、eMMC 5.1。
  <https://14469692.s21i.faiusr.com/61/ABUIABA9GAAg5e-MqgYo9fmgzQE.pdf>
- CBM209X Flash Support List 与本地 `fdfdb` 都记录 `KMGE6001BM` 对应 Samsung 16GB MLC flash id；第三方 eMCP 页面同时确认 `KMGE6001BM-B421` 是 Samsung 16+24 eMCP、eMMC+LPDDR3、221ball。
  <https://f-hauri.ch/vrac/SSD-16Tb/CB/209x/CBM209X%20Flash%20Support%20List%282020-8-21%29.pdf>
  <https://www.preduo.com/product/emcp/emmc-lpddr3/221ball_emmc-lpd3/kmge6001bm-b421>
  <https://www.cpuprocessorchip.com/sale-11104010-kmge6001bm-b421-16-24-emcp-d3-lpddr3-1866mhz-memory-chip-16gb-storage-bga221.html>
  <https://nxelectronics.com/home/productdetail/?item_id=330113078&partno=KMGE6001BM-B421>

## 当前规则状态

DSL:

- `packages/dsl/src/rules/packs/samsung-emcp-token.json`
  - `vendor.samsung.emcp.kmg-6001bm.v1`

当前只加入两个窄 product-key：

| product key | 已确认信息 | 规则处理 |
| --- | --- | --- |
| `KMGD6001BM` | Samsung datasheet mirror 确认 32GB e.MMC + 24Gb LPDDR3、221FBGA、eMMC 5.1 | 进入 DSL |
| `KMGE6001BM` | CBM/fdfdb flash id 与多处 eMCP 页面同向，确认 Samsung 16+24、eMMC+LPDDR3、221ball | 进入 DSL |

没有新增通用 Samsung eMCP/uMCP decoder。原因：

- 官方页面确认产品线和容量范围，但没有公开逐位 ordering table。
- 当前只有 `KMGD6001BM` / `KMGE6001BM` 能满足外部资料或多源同向要求。
- 不能仅凭 `KM*` 前缀硬编码为 eMCP/uMCP；需要先确认 storage interface、DRAM type、storage density、DRAM density token。
- uMCP 仍没有可公开验证的 ordering table 或可规则化 PN 样本。

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

可信度 metadata 必须留在 DSL `tables.reference`，不得输出到 `fields`。

## 待确认

- Samsung MCP PN 前缀集合：旧资料常见 `KMS*`，部分分销页面可见 `KMQ*`，项目现有 vendor 识别还有 `KMD/KMF/KMN/KMV`。
- 这些前缀是否分别对应 eMCP、uMCP、ePoP 或旧 MCP，需要外部 ordering table 或多个高置信样本确认后再进规则。
