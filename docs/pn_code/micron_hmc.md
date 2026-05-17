# Micron HMC PN 编码

采集日期：2026-05-14

本文档记录 Micron Hybrid Memory Cube (HMC) / HMC Gen2 的 legacy specialty DRAM 解析规则。HMC 是包含 stacked DRAM die 与 logic die 的封装，不属于 NAND，也不应被 `MT` 前缀 fallback 误判为 raw NAND。

## 外部资料

- Micron / HMCC 官方新闻稿确认 HMC Gen2 规格路线、2GB commercial implementation、160GB/s bandwidth，以及 HMC 使用 TSV 将 DRAM die 与 high-performance logic 组合。
  <https://investors.micron.com/news-releases/news-release-details/hybrid-memory-cube-consortium-continues-drive-hmc-industry>
- 用户提供的 Micron 官方 HMC Gen2 datasheet 图确认 `MT43A4G40200NFA-S15:A` 与 `MT43A4G40100NFA-S15:A` 的 PN 结构、configuration、logic revision、product variation、package、SerDes 和 DRAM die revision。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-hmc-token.json`
- `vendor.micron.hmc.mt43a.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT43A` + config + logic revision + product variation + package + `-` SerDes + optional temperature + `:` DRAM die revision | Micron HMC / HMC Gen2 |
| config `4G4` | 4Gb x 4 DRAM layers，2GB cube |
| config `4G8` | 4Gb x 8 DRAM layers，4GB cube |
| logic revision `01/02` | Logic design revision 1 / 2 |
| product variation `00` | Standard |
| package `NFA` | BGA, 4-link, 896-ball (31x31), 2GB |
| SerDes `S15` | 15 Gb/s SerDes，HMC Gen2 PHY |
| blank temperature | DRAM 0C to 105C / Logic 0C to 110C |
| die revision `A` | Rev A |

## 输出字段

- `dram_type = HMC`
- `dram_density`
- `dram_die_density`
- `die_count`
- `dram_voltage`
- `package`
- `revision`：用于 logic design revision。
- `dram_speed`
- `interface_type`
- `operation_temperature`
- `die_revision`

`config_code`、`logic_revision_code`、`product_variation_code`、`package_code` 和 `serdes_code` 只用于规则内部解析，不进入公开结果。对暂未确认尺寸 / ball count 的 package token 只解码已确定字段，不退回输出 package code。

## 测试样例

- `MT43A4G40100NFA-S15:A`
- `MT43A4G40200NFA-S15:A`

