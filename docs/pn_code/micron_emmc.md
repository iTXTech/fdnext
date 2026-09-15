# Micron eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-08-27

## 外部资料

共享编码指南见 [MTFC 通用资料](micron_managed.md#外部资料)。

- Micron eMMC 软件 / 技术说明页面列出 e.MMC 5.1 TLC Pearl 相关 `MTFC64GBCAQTC` / `MTFC128GBCAQTC` / `MTFC256GBCAQTC` / `MTFC64GBCAQDQ` 型号。
  <https://sg.micron.com/sales-support/downloads/software-drivers/emmc-software>
- Micron e.MMC 5.1 车规数据手册镜像给出 `MTFC32GBCAQTC-AIT`、`MTFC128GBCAQTC-AAT`、`MTFC256GBCAQTC-AAT` 等订购信息，并确认芯片 `BC`、控制器 `AQ`、封装 `TC` / `DQ`。
  <https://cdn.promelec.ru/upload/grab/datasheet.lcsc.com/lcsc/2601221102_micron-MTFC32GBCAQTC-AAT_C31550066.pdf>
- Micron 官方当前版 / 已停产 e.MMC 目录与公开 Micron 数据手册确认 `BH`、`HD`、`HT` 封装编码段：`BH = TFBGA-153, 11.5x13x1.1`，`HD = VFBGA-153, 11.5x13x0.9`，`HT = VBGA-100, 14x18x1.0`。官方目录还确认 `DW = LFBGA-100, 14x18x1.5`，并用多条 PN 直接确认 `AC:AA` 为 eMMC 4.51，`AC:AE` / `AJ:AE` / `AK:AE` / `AK:AJ` 为 eMMC 5.0，`AO:AL` / `AS:AQ` 为 eMMC 5.1。两套 MTFC 编码段语法共用已确认的系列/封装语义，避免相同编码段因新版 / 旧版主体长度不同而丢失分类。
  <https://www.micron.com/products/storage/managed-nand/emmc/part-catalog>
  <https://www.micron.com/products/obsolete/obsolete-emmc/part-catalog>
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/8611/emmc-industrial-8-128gb-v5-1.pdf>
  <https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/8611/auto-emmc-8-128gb-1-8v-5-1.pdf>
- 2026-07-12 重新审计官方当前版 40 条、已停产 132 条 e.MMC 目录记录。在排除 ES、已有搜索资源和有效 MDB 精确 / 后缀边界覆盖后，24 条非样品完整 PN 进入 `managed-nand-pn.json`；每条均以既有结构化规则验证为 Micron eMMC，且数值容量与目录一致。新增 PN 为：`MTFC32GBCAQTC-AIT`、`MTFC128GAZAQJP-AAT`、`MTFC128GAZAQJP-AIT`、`MTFC32GAZAQDW-AAT`、`MTFC32GBCAQTC-IT`、`MTFC32GAZAQHD-WT`、`MTFC64GAZAQHD-AIT`、`MTFC128GBCAQTC-WT`、`MTFC32GAZAQHD-IT`、`MTFC64GAZAQHD-IT`、`MTFC32GBCAQDQ-AAT`、`MTFC32GAZAQHD-AAT`、`MTFC32GBCAQTC-WT`、`MTFC32GAZAQHD-AIT`、`MTFC64GBCAQTC-WT`、`MTFC64GAZAQHD-AAT`、`MTFC256GBCAQTC-WT`、`MTFC128GAZAQJP-IT`、`MTFC32GAKAEEF-AIT`、`MTFC64GAZAQHD-WT`、`MTFC16GAKAEEF-AIT`、`MTFC64GAJAEDQ-AIT`、`MTFC32GAKAEDQ-AIT`、`MTFC8GAMALBH-IT`。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-emmc-token.json`
  - `vendor.micron.emmc.mtfc.legacy.v1`
  - `vendor.micron.emmc.n2m400.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| 新版 MTFC 语法 | [通用结构与规则入口](micron_managed.md#规则状态) |
| `MTFC` + 容量 + 芯片(1) + 控制器(1) + 封装(2) + 可选后缀 | 旧版 eMMC/定制卡 |
| 芯片 `AA..AP` | 新版 eMMC NAND 芯片表，含位宽 / 芯片容量 / 代际 |
| 芯片 `BC` | e.MMC 5.1 TLC Pearl，512Gb 芯片 |
| 芯片 `A..R` | 旧版 eMMC NAND 芯片表；本次按原厂解码器补齐 `H=32Gb x8 3.3V`、`N=4Gb x8 3.3V` |
| 控制器 `AA..AN` / `A..Z` | 控制器修订版表 |
| 封装 `AM/BH/CN/DM/DW/EA/HD/HT/TC/...` | 封装编码；`BH/HD/HT` 分别为 153 球 TFBGA、153 球 VFBGA、100 球 VBGA，`DW` 为 100 球 LFBGA |
| 特殊选项 `0F/0M/1M/.../O1` | 启动区/增强区 / 固件选项 |
| 系列键 `component:controller` | `AC:AA` -> eMMC 4.51；`AC:AE`、`AC:AJ`、`AJ:AE`、`AK:AE`、`AK:AJ` -> eMMC 5.0；`AM:AL`、`AO:AL`、`AP:AL`、`AS:AQ`、`AX:AQ`、`AZ:AQ`、`BC:AQ` -> eMMC 5.1 |

`N2M4` 旧型号按原厂数据手册 Figure 2 逐编码段解析：
`N2M | 4 | 00F | D | B | 3 | 1 | 1A3 | C | E`。`4=eMMC 4.41`；
`00F/G/H/J=4/8/16/32GB`；`D=25nm`；`B=Extended (-40°C ~ 85°C)`；`3=3.0V`；
配置 `1/2/4` 输出 die 数；`1A3=LBGA-100, 14x18x1.4`。`D=25nm` 暂仅保留证据，
在无法确定 NAND die 规格前不单独输出制程节点。未知编码段独立降级，
不限制为已知完整 PN 组合，不将 MLC/x8 作为所有未知配置的常量。
固件 C 与介质 E/F 仅作内部编码段。
<https://cdck-file-uploads-global.s3.dualstack.us-west-2.amazonaws.com/digikey/original/2X/0/0c012b26eddf736b043b3cae931df49afb5ee9e9.pdf>

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`controller_code`、`package_code` 等 Micron 编码段只用于内部解析，不进入公开字段；用户可见结果优先输出 `controller_revision`、`package` 等语义字段。
- 新版芯片代际按公共约定输出紧凑 `GenN`，例如 `AM` 输出 `Gen8`，不回显解码器中的 `Eighth`。

## 测试样例

- `MTFC4GACAJCN-1M WT`
- `MTFC8GLTEA-WT`
- `MTFC128GBCAQTC-AIT`
- `MTFC8GAMALBH-AAT`
- `MTFC16GAPALNA-AAT`
- `MTFC128GAXAQEA-WT`
- `MTFC32GAZAQDW-AAT`
- `MTFC4GACAAAM-4M IT`
- `MTFC128GAJAECE-AAT`
- `MTFC64GAOALEA-WT`
- `MTFC128GASAQEA-WT`
- `N2M400FDB311A3CE`
- `N2M400JDB341A3CF`

## 注意

新版与旧版 `MTFC` 结构长度不同，规则需先按编码段位宽区分，再判断系列。
`BC:AQ:TC` / `BC:AQ:DQ` 的参考资料证据进入 `evidence/decodepack-references.json`；iTXTech fdnext DecodePack 和用户可见输出只保留实际参与解析的芯片、控制器、封装、产品线等规范数据。

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-08-27 覆盖审计引用的补充来源：<https://www.micron.com/products/obsolete/obsolete-emmc/part-catalog/part-detail/n2m400gdb321a3ce>。
