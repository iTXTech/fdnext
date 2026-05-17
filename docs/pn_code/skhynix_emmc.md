# SK hynix eMMC / e-NAND PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix managed NAND 中 eMMC / e-NAND 料号的公开资料、规则库抽象和 testcase 覆盖点。实现禁止按完整 PN 白名单匹配，应按结构切 token，再用规则库解释已知 token；未知 revision/config token 不应阻断 vendor/type/density 等已知字段解析。

## 来源

- SK hynix eMMC brochure / catalog mirror 给出 eMMC 5.1 line-up，可归纳出 `H26M/H26T` 托管 NAND 结构、容量位和 automotive grade 后缀。
  <https://netlist.com/wp-content/uploads/2023/06/SK-Hynix_Managed-NAND_eMMC.pdf>
- SK hynix e-NAND H26M Series datasheet mirror 给出 8GB/16GB/32GB/64GB eMMC 5.1、VCC 3.3V / VCCQ 1.8V、HS400+CMDQ、153FBGA 以及 automotive grade 示例。
  <https://media.digikey.com/pdf/Data%20Sheets/Netlist%20Inc%20PDF/H26M%20Series.pdf>
- SK hynix NAND Flash Databook Q1'2016 mirror 给出 H26M eMMC line-up：4GB MMC4.5、8GB~128GB MMC5.1、1xnm / 3D-V2、base component density、stack 和 package size。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/skhynix-emmc-token.json`
- 规则 ID：`vendor.skhynix.emmc.managed.v1`
- 优先级：`1005`
- testcase：`packages/core/test/decodepack/managed-nand.test.ts`

## PN 结构

| PN 结构 | 字段 |
| --- | --- |
| `H26` + media(1) + density(1) + component(4) + package/config(3) + optional grade | SK hynix e-NAND / eMMC |
| media `M` / `T` | managed e-NAND / eMMC 族 |
| density `3/4/5/6/7/8` | 4GB / 8GB / 16GB / 32GB / 64GB / 128GB |
| component `1001` | 1xnm, 32Gb die, 1-die, eMMC 4.5 |
| component `1204/1208/2208/4208/8208` | 1xnm, 64Gb die, 1/1/2/4/8-die |
| component `1002/2002/4002/8002` | 3D-V2, 128Gb die, 1/2/4/8-die |
| package/config `HPR/FPR/GPR` | 153FBGA 11.5x13x0.8mm |
| package/config `AMR/CMR/EMR` | 153FBGA 11.5x13x1.0mm |
| grade `N/A` | Commercial / Mobile, -25~85°C |
| grade `I` | Industrial, -40~85°C |
| grade `X` | Automotive Grade 2/3, -40~105°C |
| grade `Q` | Automotive Grade 2, -40~105°C |

## 输出字段

| 输出字段 | 值 |
| --- | --- |
| `vendor` | `skhynix` |
| `type` | `emmc` |
| `density` | 按 density token 映射为 Mbit |
| `voltage` | `VCC: 3.3V, VCCQ: 1.8V` |
| `package` | 按 package/config token 输出 153FBGA 与尺寸 |
| `fields.system` | `SK hynix e-NAND` |
| `fields.group` | `eMMC` |
| `fields.storage_interface` | `eMMC 4.5` / `eMMC 5.1` |
| `fields.interface_type` | `HS400+CMD Q` |
| `fields.managed_family` | `e-NAND` |
| `fields.generation_info` | `1xnm NAND` / `3D-V2 NAND` |
| `fields.die_density` | `32Gb` / `64Gb` / `128Gb` |
| `fields.die_stack` / `fields.die_count` | 1/2/4/8-die |

## 示例

| PN | 解析重点 |
| --- | --- |
| `H26M78208CMRX` | eMMC, 64GB, automotive grade token `X` |
| `H26M78208CMRN` | eMMC, 64GB, Commercial / Mobile token `N` |
| `H26M31001HPR` | eMMC 4.5, 4GB, 1xnm, 32Gb x1, 153FBGA 11.5x13x0.8mm |
| `H26M88002AMR` | eMMC 5.1, 128GB, 3D-V2, 128Gb x8, 153FBGA 11.5x13x1.0mm |
| `H26M91208HPRX` | eMMC, unknown density token `9`，仍保留 vendor/type/package/grade |

## 已知缺口

- component token 已按 Q1'2016 databook line-up 拆出 die density / die stack / package size；更细的 controller revision、product serial 仍不解释。
- `X/Q` grade 语义已按公开资料先收敛到 automotive，但仍需要更多原厂 ordering table 做细分复核。
- `H9*` 常见于 eMCP / uMCP，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不应直接并入 eMMC parser。
