# Micron Managed NAND PN 编码

采集日期：2026-08-27

本文档记录 Micron `MTFC` managed NAND 共享结构和未知组合 fallback。eMMC、UFS 与 MCP / eMCP / uMCP 细节分别见 [micron_emmc.md](micron_emmc.md)、[micron_ufs.md](micron_ufs.md) 和 [micron_emcp.md](micron_emcp.md)。

## 外部资料

- Micron 官方 e.MMC Standalone Part Numbering System 给出新版 `MT FC 2G AA AA M2 - xx xx ES` 结构、容量、温区、NAND component、controller revision、package code 和 special option 表。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A2e014e65-e44b-4558-931b-e5ebc6b7de00/renditions/original/as/numnextgenemmc.pdf>
- Micron 官方 Flash + Controller Part Numbering System 给出旧版 e-MMC/custom card `MT FC 2G A A M2 - xx ES` 结构。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac81e5b7e-6c40-4314-afc8-067c0034c12e/original/as/numemmc.pdf>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) 的 Table 1 给出一批 UFS / uMCP 已知 PN、容量组成、封装和 package code，可用于 `MTFC*GASAO*`、`MTFC*GARAT*`、`MTFC*GAXAT*`、`MTFC*GAXAU*` 与 `MT29V` / `MT30A` uMCP 的资源和规则校验。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-managed-token.json`
- `vendor.micron.managed.mtfc.nextgen.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | 新版 Flash + Controller / e.MMC / UFS |
| `EEFC` + 同一 body grammar | Early Engineering system namespace；只复用已确认的 density / component:controller / package token |
| `(MT/EE)FC` + density + `AXAT` + package(4) + `-` + suffix | UFS 3.1 扩展四字符 package token 分支；未知 token 独立降级 |
| density `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` | 512MB 到 1TB，落库为 Mbit |
| component token | NAND component，包含 width / component density / generation 线索 |
| controller token | controller revision 或 managed family 判定线索 |
| package token | package code |
| temp suffix `CT/WT/IT/AIT/AAT/AITI` | Commercial / Standard / Extended / Industrial 温区 |

## 输出字段

- `nand_component`
- `component_width`
- `component_density`
- `generation_info`
- `controller_revision`
- `product_family`
- `product_version`
- `operation_temperature`

`nand_component`、`controller_code`、`package_code` 等 Micron token 只用于内部解析，不进入公开字段；用户可见结果优先输出 `component_density`、`die_codename`、`controller`、`controller_revision`、`package` 等语义字段。UFS 输出不额外公开 `product_family`；品牌、UFS 类型与接口代际已分别由设备身份和 `product_version` / `storage_interface` 表达。

## 测试样例

- `MTFC256GZZZZZZ-WT`
- `MTFC128GARATEK-WT`
- `MTFC512GAXATHJ-WT`
- `EEFC512GBGAZHF-WT ES`
- `EEFC1TBGAZHE-WT ES`
- `EEFC128GAXATEAAA-WT`
- `EEFC512GAXATAMAA-WT`

## 注意

`MTFC` 同时覆盖 e.MMC 与 UFS，不能只靠前缀判断类型。实现中先按结构切 token，再用 `component:controller` 和 component 表推导 `type`；未知组合只降级为通用 `managed_nand`，不再默认 eMMC。component/controller/package code 只作内部解析线索。

`EEFC` 与 `MTFC` 一样先切成两位 system token + `FC` family token；`EE` 只通过
`prod_status = Early Engineering Samples` 公开一次。当前 `BG:AZ` exact 样本可沿用已确认的
UFS 4.0 family mapping。官方 obsolete UFS catalog 进一步确认 `AX:AT` 为 UFS 3.1，且
`EAAA/AMAA` 是四字符 package token；规则用独立 AX:AT family 分支解析，不全局放宽 MTFC body。
match 使用固定四字符 package 槽位、明确的 `-` 边界及可扩展后缀，不把已知容量/封装/温区组合写成完整 PN 白名单；
未知 package 保留已确认的容量、UFS 版本与后续温区。
`EAAA` 在 128GB/256GB catalog 行出现 VFBGA/WFBGA 和不同厚度，只公开共同确认的
`BGA-153, 11.5x13`；`AMAA` 公开为 `VFBGA-153, 11.5x13x1.0`。
<https://www.micron.com/products/obsolete/obsolete-universal-flash-storage/part-catalog>

`BG` component 已由官方 catalog 确认为 `x8, 1Tb, B68S`，`BG:BB/BC` 确认为
UFS 4.1。`BG:BE` 和 `BF:BA` 仍没有 product-type 绑定，因此只保留可确认的总容量/
component 字段并降级为通用 managed NAND。`EEFC1T5...` 的 exact PN 已由 FBGA decoder
确认，但尚无资料证明 `1T5 = 1.5TB`；规则只输出 `BG` 的 component semantics 和
EE/WT 状态，不公开总容量、接口代际、controller 或 package。

后续 managed backlog 中，`MTFCBA` 必须优先隔离：官方 legacy Flash + Controller numbering
明确 `BA = BGA adapter`，它不是容量 token，不能只凭 `MTFC` 输出 eMMC/managed NAND 或
存储容量。`MT30A` 的 12 条 body 已按官方 catalog/search metadata 接入：
`C = 1TB UFS`、controller `4/5 = 9U2A + UFS 3.1/4.1`、package `AV/AW = uMCP-305`，
并结构化消费 `WN/WD` 后缀。未见公开含义的 die/revision token 仍不猜。
<https://www.micron.com/content/dam/micron/global/public/products/part-numbering-guide/numemmc.pdf>
<https://www.micron.com/products/multichip-packages/ufs-based-mcp/part-catalog>

`MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP / AiO / uMCP 组合封装不属于 `MTFC`，也不能交给 raw NAND parser；raw NAND 边界收窄为 `MT29E...` / `MT29F...`。NOR MCP ordering 暂按来源边界忽略，不进入 managed NAND 规则。
