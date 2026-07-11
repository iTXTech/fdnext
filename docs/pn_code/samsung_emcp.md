# Samsung eMCP / uMCP PN 编码资料

采集日期：2026-05-08

## 来源

- Samsung eMCP 官方页面确认 LPDDR4X eMCP 产品线：eMMC 5.1、LPDDR4X、16GB/32GB/64GB storage、16Gb/24Gb/32Gb DRAM、144/254 FBGA、4266 Mbps。
  <https://semiconductor.samsung.com/mcp/emcp/>
- Samsung uMCP 官方页面确认 LPDDR5 uMCP 产品线：UFS 3.1、LPDDR5、128GB/256GB storage、64Gb/96Gb DRAM、297 FBGA、6400 Mbps。
  <https://semiconductor.samsung.com/mcp/umcp/>
- Samsung 官方 obsolete uMCP 型号页与官网 sitemap 补充确认 `KM2*` LPDDR4X family。`2` 是可规则化的 UFS + LPDDR4X type token；`B/F/H/L/P/V` package token 与 `1C` capacity token 的局部组合分别覆盖 64/128/256GB UFS，RAM token `M` 为 48Gb，封装均为 254 FBGA。`700/800` family 为 UFS 2.1，`900` family 为 UFS 2.2；`2:B` / `2:V` 为 LPDDR4X-3733，其余已确认组合为 LPDDR4X-4266。规则不按这些 exact PN 查表。
  <https://semiconductor.samsung.cn/mcp/model/lpddr5-umcp/km2f8001cm-b707/>
  <https://semiconductor.samsung.com/jp/mcp/model/lpddr5-umcp/km2p8001cm-b518/>
  <https://semiconductor.samsung.com/mcp/umcp/lpddr5-umcp/km2l9001cm-b518/>
- Samsung MCP 官方页面确认 MCP 同时覆盖 uMCP 与 eMCP，组合 mobile DRAM 与 NAND/eStorage。
  <https://semiconductor.samsung.com/mcp/>
- Samsung Newsroom 说明 uMCP 是 UFS-based multichip package，并使用 LPDDR4X DRAM。
  <https://news.samsung.com/global/samsung-electronics-begins-mass-production-of-industrys-first-12gb-lpddr4x-based-umcp>
- Samsung 官方型号页确认多组 eMMC + LPDDR3/LPDDR4X eMCP 组合：
  - `KMFN60012B-B214` / `KMFN60012M-B214`: 8GB eMMC 5.1 + 8Gb LPDDR3、221 FBGA、1866 Mbps。
    <https://semiconductor.samsung.com/mcp/umcp/lpddr5-umcp/kmfn60012b-b214/>
    <https://semiconductor.samsung.com/us/mcp/model/lpddr5-umcp/kmfn60012m-b214/>
  - `KMGP6001BA-B514`: 32GB eMMC 5.1 + 16Gb LPDDR3、221 FBGA、1866 Mbps。
    <https://semiconductor.samsung.com/us/mcp/model/lpddr5-umcp/kmgp6001ba-b514/>
  - `KMDT6001ZM-A625`: 16GB eMMC 5.1 + 16Gb LPDDR4X、144 FBGA、4266 Mbps。
    <https://semiconductor.samsung.com/mcp/model/lpddr5-umcp/kmdt6001zm-a625/>
  - `KMDT6000HM-A625`: 16GB eMMC 5.1 + 24Gb LPDDR4X、144 FBGA、4266 Mbps。
    <https://semiconductor.samsung.com/mcp/umcp/lpddr5-umcp/kmdt6000hm-a625/>
  - `KM4X6001KM-B321`: 32GB eMMC 5.1 + 16Gb LPDDR4X、254 FBGA、4266 Mbps。
    <https://semiconductor.samsung.com/mcp/model/lpddr5-umcp/km4x6001km-b321/>
  - `KMDP6001DA-B425` / `KMDP60018M-B425` / `KMDH6001DA-B425`: 64GB eMMC 5.1 + 32Gb/24Gb/32Gb LPDDR4X、254 FBGA、3733/4266 Mbps。
    <https://semiconductor.samsung.com/us/mcp/model/lpddr5-umcp/kmdp6001da-b425/>
    <https://semiconductor.samsung.com/us/mcp/model/lpddr5-umcp/kmdp60018m-b425/>
    <https://semiconductor.samsung.com/us/mcp/model/lpddr5-umcp/kmdh6001da-b425/>
- Samsung 官方型号页确认多组 UFS + LPDDR4X/LPDDR5 uMCP 组合：
  - `KM8F8001JA-B813`: UFS 2.1 256GB + LPDDR4X 64Gb、254 FBGA、4266 Mbps。规则按 `type 8 + speed 800`、`type 8 + package F + capacity 1J`、`capacity 1J + DRAM token A` 等实际局部 token 组合补齐，不按完整 PN 查表。
    <https://semiconductor.samsung.com/emea/mcp/model/lpddr5-umcp/km8f8001ja-b813/>
  - `KM5L9000CM-B424`: 128GB UFS 2.2 + 48Gb LPDDR4X、254 FBGA、4266 Mbps。
    <https://semiconductor.samsung.com/mcp/model/lpddr5-umcp/km5l9000cm-b424/>
  - `KM8V9001JM-B813`: 128GB UFS 2.2 + 64Gb LPDDR4X、254 FBGA、4266 Mbps。
    <https://semiconductor.samsung.com/mcp/model/lpddr5-umcp/km8v9001jm-b813/>
  - `KMJS9001RM-BG01`: 256GB UFS 3.1 + 96Gb LPDDR5、297 FBGA、6400 Mbps。
    <https://semiconductor.samsung.com/mcp/model/lpddr5-umcp/kmjs9001rm-bg01/>
- 上述 13 个官方 exact PN 已加入 managed NAND 搜索资源；解码继续使用 storage type、package、speed/generation、storage capacity、RAM 等结构化 token，不使用完整 PN 匹配。
- Samsung `KMGD6001BM-B421` datasheet mirror 给出 32GB e.MMC + 24Gb LPDDR3、221FBGA、eMMC 5.1。
  <https://14469692.s21i.faiusr.com/61/ABUIABA9GAAg5e-MqgYo9fmgzQE.pdf>
- CBM209X Flash Support List 与本地 `fdfdb` 都记录 `KMGE6001BM` 对应 Samsung 16GB MLC flash id；第三方 eMCP 页面同时确认 `KMGE6001BM-B421` 是 Samsung 16+24 eMCP、eMMC+LPDDR3、221ball。
  <https://f-hauri.ch/vrac/SSD-16Tb/CB/209x/CBM209X%20Flash%20Support%20List%282020-8-21%29.pdf>
  <https://www.preduo.com/product/emcp/emmc-lpddr3/221ball_emmc-lpd3/kmge6001bm-b421>
  <https://www.cpuprocessorchip.com/sale-11104010-kmge6001bm-b421-16-24-emcp-d3-lpddr3-1866mhz-memory-chip-16gb-storage-bga221.html>
  <https://nxelectronics.com/home/productdetail/?item_id=330113078&partno=KMGE6001BM-B421>

## 当前规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/samsung-mcp-token.json`
  - `vendor.samsung.mcp.token.v1`

当前用单一 MCP 规则同时覆盖 eMCP 与 uMCP，按图片中的 Samsung Memory IC Part Number Decode Chart 和已确认型号拆为：

```text
KM + storage type + package + speed/generation + storage capacity + RAM + 4-char tail
```

4 位 tail 仅用于结构匹配，不作为公开字段输出。规则不再以完整 10 位主型号作为 lookup key；容量、DRAM、interface、package 都从对应 token 或短组合 key 表输出。

### token 结构

| Token | 位置 | 已使用信息 |
| --- | --- | --- |
| storage type | 第 3 字符 | 图片确认 `D/3/R/Q/F/M` 为 eMMC，`E/5/A/P` 为 UFS；已知样本补充 `G/4` 为 eMMC，`8/J` 为 UFS |
| storage type `2` | 第 3 字符 | obsolete 官方 `KM2*` family 确认 UFS + LPDDR4X uMCP |
| package | 第 4 字符 | 单独或与 storage type 组合确认 144 / 221 / 254 / 297 FBGA |
| speed/generation | 第 5-7 字符 | 图片确认 `600` = eMMC 5.1、`100` = eMMC 5.0、`200` = UFS 2.0、`800` = UFS 2.1、`500` = UFS 3.0、`900` = UFS 3.1；已知样本补充 `5:900` / `8:900` = UFS 2.2 |
| storage capacity | 第 8-9 字符 | 已知样本确认 `12/1Z/0H/1B/1K/1D/18/0C/1J/1R` 等容量 token；图片补充 `S` = 256GB |
| RAM | 第 10 字符 | 图片给出 RAM code 对照，但旧 eMCP 与新 uMCP 的同一 RAM token 存在复用；当前只对已知 capacity + RAM 组合输出 8Gb / 16Gb / 24Gb / 32Gb / 48Gb / 64Gb / 96Gb |

没有新增泛化到所有 Samsung `KM*` 的 decoder。原因：

- 官方页面可确认具体型号规格，但仍未公开完整逐位 ordering table。
- 不能仅凭 `KM*` 前缀硬编码为 eMCP/uMCP；当前规则需要 storage type、speed/generation、capacity、RAM 和 4 位 tail 符合结构。
- ePoP 已有产品线新闻证据，但还没有可规则化 PN 样本。

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

可信度 metadata 必须留在 iTXTech fdnext DecodePack `tables.reference`，不得输出到 `fields`。

## 待确认

- Samsung MCP PN 前缀集合：旧资料常见 `KMS*`，部分分销页面可见 `KMQ*`，项目现有 vendor 识别还有 `KMD/KMF/KMN/KMV`。
- 这些前缀是否分别对应 eMCP、uMCP、ePoP 或旧 MCP，需要外部 ordering table 或多个高置信样本确认后再进规则。
- Samsung 官网部分历史 eMMC + DRAM MCP 型号仍挂在 `lpddr5-umcp` URL path 下，规则按 `eStorage Version` 和组合规格分类为 eMCP，而不是按 URL path 分类。
