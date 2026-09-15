# Micron 受管理 NAND PN 编码

采集日期：2026-08-27

本文档记录 Micron `MTFC` 受管理 NAND 共享结构和未知组合回退。eMMC、UFS 与 MCP / eMCP / uMCP 细节分别见 [micron_emmc.md](micron_emmc.md)、[micron_ufs.md](micron_ufs.md) 和 [micron_emcp.md](micron_emcp.md)。

## 外部资料

- Micron 官方 e.MMC 独立料号编码体系给出新版 `MT FC 2G AA AA M2 - xx xx ES` 结构、容量、温区、NAND 芯片、控制器修订版、封装编码和特殊选项表。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3A2e014e65-e44b-4558-931b-e5ebc6b7de00/renditions/original/as/numnextgenemmc.pdf>
- Micron 官方 Flash + Controller Part Numbering System 给出旧版 e-MMC/定制卡 `MT FC 2G A A M2 - xx ES` 结构。
  <https://assets.micron.com/adobe/assets/urn%3Aaaid%3Aaem%3Ac81e5b7e-6c40-4314-afc8-067c0034c12e/original/as/numemmc.pdf>
UFS 来源见 [UFS 资料](micron_ufs.md#外部资料)，MCP 组成见 [MCP 资料](micron_emcp.md#来源)。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-managed-token.json`
- `vendor.micron.managed.mtfc.nextgen.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + 容量 + 芯片(2) + 控制器(2) + 封装(2) + 可选后缀 | 新版闪存 + 控制器 / e.MMC / UFS |
| `EEFC` + 同一主体语法 | 早期工程样品体系命名空间；只复用已确认的容量 / 芯片:控制器 / 封装编码段 |
| 扩展四字符封装 | [UFS 分支](micron_ufs.md#扩展分支与协议确认) |
| 容量 `12M/1G/2G/4G/8G/16G/32G/64G/128G/256G/512G/1T` | 512MB 到 1TB，落库为 Mbit |
| 芯片编码段 | NAND 芯片，包含位宽 / 芯片容量 / 代际线索 |
| 控制器编码段 | 控制器修订版或受管理系列判定线索 |
| 封装编码段 | 封装编码 |
| 温度后缀 `CT/WT/IT/AIT/AAT/AITI` | 商业级 / 标准 / 扩展 / 工业级温区 |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
通用编码段与公开字段边界见 [术语](terminology.md)。UFS 专用输出见 [UFS](micron_ufs.md#输出字段)。

## 测试样例

- `MTFC256GZZZZZZ-WT`
- `EEFC512GBGAZHF-WT ES`
- `EEFC1TBGAZHE-WT ES`

## 注意

`MTFC` 同时覆盖 e.MMC 与 UFS，不能只靠前缀判断类型。实现中先按结构切编码段，再用 `component:controller` 和芯片表推导 `type`；未知组合只降级为通用 `managed_nand`，不再默认 eMMC。芯片/控制器/封装编码只作内部解析线索。

`EEFC` 与 `MTFC` 一样先切成两位体系编码段 + `FC` 系列编码段；`EE` 通过 `prod_status = Early Engineering Samples` 公开。UFS 四字符封装分支见 [UFS](micron_ufs.md#扩展分支与协议确认)。

已确认 UFS 的芯片/控制器组合见 [UFS](micron_ufs.md#扩展分支与协议确认)。`BG:BE` 和 `BF:BA` 仍没有产品-类型绑定，因此只保留可确认的总容量/
芯片字段并降级为通用受管理 NAND。`EEFC1T5...` 的完整 PN 已由 FBGA 解码器
确认，但尚无资料证明 `1T5 = 1.5TB`；规则只输出 `BG` 的芯片语义和
EE/WT 状态，不公开总容量、接口代际、控制器或封装。

后续受管理待办项中，`MTFCBA` 必须优先隔离：官方旧版闪存 + 控制器编码
明确 `BA = BGA adapter`，它不是容量编码段，不能只凭 `MTFC` 输出 eMMC/受管理 NAND 或
存储容量。MCP 分支见 [Micron MCP](micron_emcp.md#umcp-ufs--lpddr4x--lpddr5--lpddr5x-结构)。
<https://www.micron.com/content/dam/micron/global/public/products/part-numbering-guide/numemmc.pdf>

`MT29A/B/C/D/G/J/K/M/P/Q/R/T/U/V...` MCP / AiO / uMCP 组合封装不属于 `MTFC`，也不能交给裸 NAND 解析器；裸 NAND 边界收窄为 `MT29E...` / `MT29F...`。NOR MCP 订购编码暂按来源边界忽略，不进入受管理 NAND 规则。
