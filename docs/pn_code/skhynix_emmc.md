# SK hynix eMMC / e-NAND PN 编码资料

采集日期：2026-05-08

本文档记录 SK hynix 受管理 NAND 中 eMMC / e-NAND 料号的公开资料、规则库抽象和测试用例覆盖点。规则维护遵循 [PN 编写规范](authoring.md)；未知修订版/配置编码段不应阻断厂商/类型/容量等已知字段解析。

## 来源

- SK hynix eMMC 产品手册 / 目录镜像给出 eMMC 5.1 产品系列，可归纳出 `H26M/H26T` 托管 NAND 结构、容量位和车规等级后缀。
  <https://netlist.com/wp-content/uploads/2023/06/SK-Hynix_Managed-NAND_eMMC.pdf>
- SK hynix EG510 e-NAND 数据手册产品系列确认 `H26M51002KPR` / `H26M62002JPR` / `H26M74002HMR` 分别为 16GB / 32GB / 64GB eMMC 5.1，NAND 堆叠为 128Gb x1 / x2 / x4；`KPR/JPR` 为 `FBGA-153, 11.5x13x0.8`，`HMR` 为 `FBGA-153, 11.5x13x1.0`。
  <https://datasheet.lcsc.com/lcsc/2204261415_SK-HYNIX-H26M62002JPR_C3002776.pdf>
- SK hynix e-NAND H26M 系列数据手册镜像给出 8GB/16GB/32GB/64GB eMMC 5.1、VCC 3.3V / VCCQ 1.8V、HS400+CMDQ、153FBGA 以及车规等级示例。
  <https://media.digikey.com/pdf/Data%20Sheets/Netlist%20Inc%20PDF/H26M%20Series.pdf>
- SK hynix 1ynm 64Gb eMMC 5.1 车规数据手册订购编码表确认 8/16/32/64GB 的 `H26M...HPR/FPR/EMR/CMR` 系列，以及 `N/I/A/Q` 分别表示 CT / IT / AIT / AAT 温度档。
  <https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/791/SK-hynix-1ynm_5F00_64Gb_5F00_eMMC5.1_5F00_Automotive_5F00_ver1.5.pdf>
- SK hynix NAND Flash Databook Q1'2016 镜像给出 H26M eMMC 产品系列：4GB MMC4.5、8GB~128GB MMC5.1、1xnm / 3D-V2、基础芯片容量、堆叠和封装尺寸。
  <https://gzhls.at/blob/ldb/e/8/b/f/32b2d2b37ba8bac84be3202fa5c6425eb300.pdf>

## 规则入口

- 规则文件：`packages/core/src/decodepack/rules/packs/skhynix-emmc-token.json`
- 规则 ID：`vendor.skhynix.emmc.managed.v1`
- 优先级：`1005`
- 测试用例：`packages/core/test/decodepack/part-number/skhynix-managed.test.ts`

## PN 结构

| PN 结构 | 字段 |
| --- | --- |
| `H26` + 介质(1) + 容量(1) + 芯片(4) + 封装/配置(3) + 可选等级 | SK hynix e-NAND / eMMC |
| 介质 `M` / `T` | 受管理 e-NAND / eMMC 族 |
| 容量 `3/4/5/6/7/8` | 4GB / 8GB / 16GB / 32GB / 64GB / 128GB |
| 芯片 `1001` | 1xnm, 32Gb die, 1-die, eMMC 4.5 |
| 芯片 `1204/1208/2208/4208/8208` | 1xnm, 64Gb die, 1/1/2/4/8-die |
| 芯片 `1002/2002/4002/8002` | 3D-V2, 128Gb die, 1/2/4/8-die |
| 封装/配置 `HPR/FPR/GPR/KPR/JPR` | 153FBGA 11.5x13x0.8mm |
| 封装/配置 `AMR/CMR/EMR/HMR` | 153FBGA 11.5x13x1.0mm |
| 等级 `N` | 商业级 CT, -25~85°C |
| 等级 `I` | 工业级, -40~85°C |
| 等级 `A` | 车规 AIT, -40~85°C |
| 等级 `X` | 车规等级 2/3, -40~105°C |
| 等级 `Q` | 车规 AAT, -40~105°C |

## 输出字段

| 输出字段 | 值 |
| --- | --- |
| `vendor` | `skhynix` |
| `type` | `emmc` |
| `density` | 按容量编码段映射为 Mbit |
| `voltage` | `VCC: 3.3V, VCCQ: 1.8V` |
| `package` | 按封装/配置编码段输出 153FBGA 与尺寸 |
| `fields.system` | `SK hynix e-NAND` |
| `fields.group` | `eMMC` |
| `fields.storage_interface` | `eMMC 4.5` / `eMMC 5.1` |
| `fields.interface_type` | `HS400+CMD Q` |
| `fields.managed_family` | `e-NAND` |
| `fields.generation_info` | `1xnm NAND` / `3D-V2 NAND` |
| `fields.die_density` | `32Gb` / `64Gb` / `128Gb` |
| `fields.die_count` | 1/2/4/8 |

## 示例

| PN | 解析重点 |
| --- | --- |
| `H26M78208CMRX` | eMMC, 64GB, 车规等级编码段 `X` |
| `H26M78208CMRN` | eMMC, 64GB, 商业级 CT 编码段 `N` |
| `H26M78208CMRA` / `H26M78208CMRQ` | eMMC, 64GB, 车规 AIT / AAT 编码段 `A/Q` |
| `H26M31001HPR` | eMMC 4.5, 4GB, 1xnm, 32Gb x1, 153FBGA 11.5x13x0.8mm |
| `H26M88002AMR` | eMMC 5.1, 128GB, 3D-V2, 128Gb x8, 153FBGA 11.5x13x1.0mm |
| `H26M51002KPR` / `H26M62002JPR` / `H26M74002HMR` | EG510 eMMC 5.1，16GB / 32GB / 64GB，封装后缀分别输出 0.8 / 0.8 / 1.0mm |
| `H26M91208HPRX` | eMMC, 未知容量编码段 `9`，仍保留厂商/类型/封装/等级 |

## 已知缺口

- 芯片编码段已按 Q1'2016 数据手册产品系列拆出单 die 容量 / die 堆叠 / 封装尺寸；更细的控制器修订版、产品序列号仍不解释。
- `N/I/A/Q` 等级语义已由车规数据手册订购编码表确认；旧代 `X` 仍保持较宽的车规等级 2/3 解释。
- `H9*` 常见于 eMCP / uMCP，已拆分到 [skhynix_emcp.md](skhynix_emcp.md)，不应直接并入 eMMC 解析器。
