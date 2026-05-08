# SK hynix NAND PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix raw NAND 料号在现有规则库中的覆盖范围。eMMC / UFS managed NAND 已拆分到独立文档：

- [SK hynix eMMC / e-NAND](skhynix_emmc.md)
- [SK hynix UFS](skhynix_ufs.md)
- [SK hynix eMCP / uMCP](skhynix_emcp.md)

## 来源

- SK hynix Newsroom 说明 4D NAND 的技术路线：96-layer 4D NAND 基于 CTF + PUC，后续覆盖 128-layer、176-layer、238-layer 和 321-layer 产品。
  <https://news.skhynix.com/sk-hynix-inc-launches-the-worlds-first-ctf-based-4d-nand-flash-96-layer-512gb-tlc/>
  <https://news.skhynix.com/fms-2022-reflections-sk-hynix-poised-to-become-next-generation-4d-nand-leader/>
  <https://news.skhynix.com/sk-hynix-begins-mass-production-of-industrys-highest-238-layer-4d-nand/>
  <https://news.skhynix.com/sk-hynix-starts-mass-production-of-world-first-321-high-nand/>
- TechInsights teardown 摘要确认 `H25T1TD48C-X630` 包含 `H25FTD0` NAND die，die 为 238L 512Gb TLC，且每个 package 内有 4 个 die。
  <https://www.techinsights.com/blog/sk-hynix-h25ftd0-238l-512-gb-tlc-3d-nand-internal-waveform-analysis>
- SK hynix NAND Flash catalog mirror 列出 SLC/MLC/TLC/eMMC/E2NAND3.0/SSD 分类，其中 E2NAND3.0 页面使用 `PRODUCT` / `BLOCK SIZE` 维度。
  <https://pdf.directindustry.com/pdf/sk-hynix/nand-flash/34497-603624.html>
- `H27UCG8T2E` datasheet mirror 标注 64Gb (8192M x 8bit) MLC NAND，并将资料归到 SK hynix NAND Flash / E2NAND3.0 相关目录。
  <https://app2.alldatasheet.com/datasheet-pdf/pdf/1425049/HYNIX/H27UCG8T2E.html>

## 规则入口

- 新式 raw NAND：`packages/dsl/src/rules/packs/skhynix-raw-token.json`
  - 规则 ID：`vendor.skhynix.token.v1`
- legacy raw NAND：`packages/dsl/src/rules/packs/skhynix-legacy-token.json`
  - 规则 ID：`vendor.skhynix.legacy.token.v1`
- 4D NAND package：`packages/dsl/src/rules/packs/skhynix-4d-token.json`
  - 规则 ID：`vendor.skhynix.4d.package.h25t.v1`
- 3D NAND：`packages/dsl/src/rules/packs/skhynix-3d-token.json`
  - 规则 ID：`vendor.skhynix.3d.token.mlc`
  - 规则 ID：`vendor.skhynix.3d.token.tlc`
- E2NAND3.0 catalog family：`packages/dsl/src/rules/packs/skhynix-e2nand-token.json`
  - 规则 ID：`vendor.skhynix.e2nand.h27.t2.v1`

## 覆盖范围

| 前缀 / 结构 | 规则 | 说明 |
| --- | --- | --- |
| `HY27...` | legacy raw NAND | 旧式 Hynix/SK hynix NAND PN |
| `H2...` | raw NAND | 新式 SK hynix raw NAND PN |
| `H27[U/Q/T][B/C/D]G8T2...` | E2NAND3.0 catalog family | H27 T2 legacy MLC NAND / E2NAND3.0 目录族 |
| `H25T...` | 4D NAND package | H25T 开头的 SSD/mobile NAND package 型号 |
| `H25..M...` | 3D NAND MLC | Toggle DDR 3D MLC |
| `H25..T...` | 3D NAND TLC | Toggle DDR 3D TLC |
| `H26...` | 不属于 raw NAND 文档 | 已由 eMMC / e-NAND 文档覆盖 |
| `HN8...` / `H28S...` | 不属于 raw NAND 文档 | 已由 UFS 文档覆盖 |
| `H9...` | 不属于 raw NAND 文档 | 已由 eMCP / uMCP 文档覆盖 |

## HY27 legacy raw NAND

| PN 结构 | 字段 |
| --- | --- |
| `HY27` + voltage + classification + width(2) + density(2) + mode + generation + reserved + package + optional tail | legacy raw NAND |
| voltage `U/L/S/J/Q/T` | 电压 / VccQ 组合 |
| classification | cell level 与 die count |
| width `08/16/32` | device width |
| density | 64Mb 到 4Tb，按规则表映射 |
| mode | CE / RB / channel |
| generation | generation code |
| package | TSOP / WSOP / FBGA / LGA / wafer / KGD 等 |
| optional tail | package material、operation temperature、bad block policy |

## H2 raw NAND

| PN 结构 | 字段 |
| --- | --- |
| `H2` + model(3) + voltage + density(2) + width + classification + mode + generation + package + material + variety + bad block + op temp | raw NAND |
| voltage `U/L/S/J/Q/T` | 电压 / VccQ 组合 |
| density | 64Mb 到 4Tb，按规则表映射 |
| width `8/6/L/I/D` | x8 / x16 等 |
| classification | cell level 与 die count |
| mode | CE / RB / channel |
| generation | generation code |
| package | TSOP / FBGA / WLGA / BGA 等 |
| package material `P/R/L/A` | lead-free / halogen-free / wafer 等 |
| bad block `B/S/P` | bad block policy |
| op temp `C/E/M/I` | commercial / extended / mobile / industrial |

## H27 / E2NAND3.0 catalog family

公开目录把 E2NAND3.0 作为 NAND Flash 产品分类之一，但 `H27UCG8T2E` datasheet 同时明确它是 64Gb x8 MLC NAND。因此规则库先按 raw NAND 输出 `type=nand`，并在 `extraInfo` 里标注 E2NAND3.0 catalog family，避免误判为 eMMC/带控制器产品。

| PN 结构 | 字段 |
| --- | --- |
| `H27` + voltage + density(2) + `8T2` + generation | H27 T2 family |
| voltage `U/Q/T` | 电压 / VccQ 组合 |
| density `BG/CG/DG` | 32Gb / 64Gb / 128Gb |
| width `8` | x8 |
| cell `T` | MLC |
| generation `A/B/C/D/E/F/M` | generation code |

示例：`H27UCG8T2E` -> SK hynix NAND, 64Gb, x8, MLC, E2NAND3.0 catalog family。

## H25 4D / 3D NAND

H25 目前分成两类结构处理：

1. `H25T...`：较新的 4D NAND package 标识，常见于 SSD 拆解和分销页面。该结构的前 3 个 token 可稳定抽出 density code、generation code 和 package config；封装尾码继续保留为未知，不按完整 PN 白名单匹配。
2. `H25..M...` / `H25..T...`：既有 3D NAND component token 结构，继续由旧规则按 toggle/cell/density/generation 表解析。

### H25T 4D NAND package

| PN 结构 | 字段 |
| --- | --- |
| `H25T` + density(2) + generation(1) + config(3) + optional package tail | SK hynix 4D NAND package |
| density code `2T` | 2Tb package；用于已公开的 `H25T2TB...` / `H25T2TC...` family |
| generation `B` | 176-layer 4D NAND (V7) |
| generation `D` | 238-layer 4D NAND package family；`H25T1TD48C-X630` 对应 H25FTD0 238L 512Gb TLC die |
| config | 例如 `88E` / `88C` / `48C`，当前只作为结构 token 输出 |

| 示例 PN | 解析重点 |
| --- | --- |
| `H25T2TB88E-X321-N` | 4D NAND, density code `2T`, generation code `B`, V7 / 176-layer family |
| `H25T2TC88C-X535` | 4D NAND, density code `2T`, generation code `C`, 2Tb package family |
| `H25T1TD48C-X630` | 4D NAND, density code `1T`, generation code `D`, TechInsights teardown 对应 238L 512Gb TLC die |

### H25 legacy 3D NAND token

| PN 结构 | 字段 |
| --- | --- |
| `H25` + toggle + reserved + cell + reserved + density + reserved + generation | SK hynix 3D NAND |
| toggle `B/Q` | Toggle DDR 4.0 / Toggle DDR 2.0 |
| cell `M/T` | MLC / TLC |
| MLC density `A` | 256Gb |
| TLC density `A/B/D/F/G` | 512Gb / 1Tb / 2Tb / 4Tb / 8Tb |
| generation `M/A/B/C/D/E/F/G/H/Y/Z` | generation number |
| voltage | `Vcc: 2.7V~3.6V, VccQ: 1.7V~1.95V/1.14V~1.26V` |
| device width | x8 |

## 已知缺口

- H25T package tail（如 `X321N` / `X535` / `X630`）仍缺原厂 ordering table，目前只保留前段稳定 token。
- H25T 的 cell type 与 generation 关系需要更多原厂资料交叉验证。当前只把公开资料能确认的结论放在 `extraInfo`，不把不确定字段强行提升到全局 `cellLevel`。
- `H2` / `HY27` 的 classification、mode、generation 表来自既有规则表，后续应逐步补对应资料出处。
- `H26`、`HN8`、`H28S` 已被更高优先级 managed NAND 规则拦截，不应在 raw NAND 文档中重复解析。
- `H9` 已拆到 eMCP / uMCP 文档，不能用 raw NAND 规则兜底解释。
