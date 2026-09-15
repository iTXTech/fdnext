# Micron HMC PN 编码

采集日期：2026-05-14

本文档记录 Micron 混合存储立方体（Hybrid Memory Cube，HMC） / HMC Gen2 的旧版专用 DRAM 解析规则。HMC 是包含堆叠 DRAM die 与逻辑 die 的封装，不属于 NAND，也不应被 `MT` 前缀回退误判为裸 NAND。

## 外部资料

- Micron / HMCC 官方新闻稿确认 HMC Gen2 规格路线、2GB 商业级实现、160GB/s 带宽，以及 HMC 使用 TSV 将 DRAM die 与高性能逻辑组合。
  <https://investors.micron.com/news-releases/news-release-details/hybrid-memory-cube-consortium-continues-drive-hmc-industry>
- 用户提供的 Micron 官方 HMC Gen2 数据手册图确认 `MT43A4G40200NFA-S15:A` 与 `MT43A4G40100NFA-S15:A` 的 PN 结构、配置、逻辑修订版、产品变体、封装、SerDes 和 DRAM die 修订版。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-hmc-token.json`
- `vendor.micron.hmc.mt43a.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT43A` + 配置 + 逻辑修订版 + 产品变体 + 封装 + `-` SerDes + 可选温度 + `:` DRAM die 修订版 | Micron HMC / HMC Gen2 |
| 配置 `4G4` | 4Gb x 4 DRAM 层，2GB 立方体 |
| 配置 `4G8` | 4Gb x 8 DRAM 层，4GB 立方体 |
| 逻辑修订版 `01/02` | 逻辑设计修订版 1 / 2 |
| 产品变体 `00` | 标准 |
| 封装 `NFA` | BGA, 4 条链路, 896 球 (31x31), 2GB |
| SerDes `S15` | 15 Gb/s SerDes，HMC Gen2 PHY |
| 空白温度 | DRAM 0C 至 105C / 逻辑 0C 至 110C |
| die 修订版 `A` | Rev A |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
- `dram_type = HMC`
- `revision`：用于逻辑设计修订版。

`config_code`、`logic_revision_code`、`product_variation_code`、`package_code` 和 `serdes_code` 只用于规则内部解析，不进入公开结果。对暂未确认尺寸 / 球数的封装编码段只解码已确定字段，不退回输出封装编码。

## 测试样例

- `MT43A4G40100NFA-S15:A`
- `MT43A4G40200NFA-S15:A`
