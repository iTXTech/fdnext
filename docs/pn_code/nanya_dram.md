# Nanya DRAM PN 规则

采集日期：2026-05-18；更新日期：2026-07-12

本页记录 Nanya standalone DRAM 颗粒的 PN 结构。Nanya 规则按 family、organization、stack、package、suffix token 解析，不维护完整 PN 枚举。

## 外部资料

- Nanya 产品总览列出 Standard DRAM 覆盖 DDR2、DDR3、DDR4、DDR5；Low Power DRAM 覆盖 LPDDR2、LPDDR3、LPDDR4/4X、LPDDR5/5X。来源：<https://www.nanya.com/en/Product/>
- Nanya 官方 `NT5AD1024M8C3-JR/JRT/HRI` 页面确认 DDR4、8Gb、x8、78-ball BGA，速度 2666/3200Mbps 与温度等级。来源：<https://www.nanya.com/en/Product/4464/NT5AD1024M8C3-JR>、<https://www.nanya.com/en/Product/4477/NT5AD1024M8C3-HRI>
- Nanya 官方 `NT5FF1024M16A4-Q5` 页面确认 DDR5、16Gb、x16、106-ball BGA、5600Mbps。来源：<https://www.nanya.com/en/Product/9032/NT5FF1024M16A4-Q5>
- Nanya 官方 `NT5FF2048M8EK-WEU` 页面确认 DDR5、16Gb、x8、78-ball BGA、8000Mbps、-40C~105C；该样例用于补齐 `5FF:EK` 封装和 `U` grade token。来源：<https://www.nanya.com/en/Product/10513/NT5FF2048M8EK-WEU>
- Nanya 官方 Standard DRAM Part Numbering Guide 补充确认 `5AD:IY=DDR4-2933 21-21-21`、`5FF:N2=DDR5-4800 40-39-39`，以及 `R=0C~105C`、`W=-40C~105C` 温度等级。来源：<https://www.nanya.com/Files/220>
- Nanya 官方 Low Power DRAM Part Numbering Guide 统一确认现有 `6BR` LPDDR5/LPDDR5X 的 package、speed 与 stack token。来源：<https://www.nanya.com/Files/1288>
- Nanya 官方产品页补充确认 `NT6BR512M16A3-K1I/K1H`、`NT6BR512T32A3-K1H/K1J/K3I`、`NT6BR1024T32A3-K2H`、`NT6BR2048F32A3-K2J`、`NT6BR1024F64AT-K3` 等 LPDDR5/LPDDR5X stack、speed 与温区组合；规则已有对应 token，本次补 exact PN 搜索资源。示例：<https://www.nanya.com/en/Product/9017/NT6BR512M16A3-K1I>、<https://www.nanya.com/en/Product/10349/NT6BR512T32A3-K3I>、<https://www.nanya.com/en/Product/10325/NT6BR1024F64AT-K3>
- Nanya 当前官方目录补齐 29 个 `6BR:*A3` exact PN：A3 family 均为 BGA-315，覆盖 8Gb~64Gb、x16/x32、K2/K3 speed 和 Commercial/Industrial/Automotive 温区。`NT6BR1024F64AT-K3` 产品页单独确认 64Gb x64、6400Mbps、Commercial -30~105C、BGA-441；官方未给尺寸，因此 `6BR:AT` 只输出 `BGA-441`。
- Nanya 官方产品列表补充确认 DDR4 `E3/E4/F3/F4/C4/H3/H4/A3/A4`、DDR5 `A3/C3/DK/EK/EL`、DDR5 speed `Q5/S8/UB/WE` 与 suffix grade `I/U`，以及 LPDDR4/4X `AC/BN` package 与 LPDDR4 `J2` speed 等 exact PN 组合。2026-07-12 复查当前 DDR5 component 表的 32 条 PN 后，补入此前遗漏的 16 条 A3、C3、DK、EK、EL commercial/industrial 组合；所有条目均由既有结构化 decoder 正确解析，未新增完整 PN 规则。来源：<https://www.nanya.com/en/Product/List/450/2264>、<https://www.nanya.com/en/Product/List/450/2478>、<https://www.nanya.com/en/Product/List/547/2356>、<https://www.nanya.com/en/Product/List/547/2343>、<https://www.nanya.com/en/Product/List/547/6587>
- 2026-07-12 对 Nanya 当前全部 standalone component 表做交叉去重，11 个 DDR2/DDR3/DDR3L/DDR4/DDR5 与 LPDDR2/LPDDR3/LPDDR4/LPDDR4X/LPDDR5(X) 页面合计列出 364 个 exact PN；本轮补入 `dram-pn.json` 中此前缺少的 178 个 PN，不包含 KGD、Elixir 或任何 DIMM/SODIMM/RDIMM 模组。官方表同时确认 `NT5CB512T16EH-FL` 是 8Gb x16 DDR3 双 die、`6TL:B9/BR/CQ/CR`、`6CL:A7/AH/AJ/AQ/D4`、`6AT:AN/AV` 的 package ball/PoP 语义，规则只增加这些可泛化 package token。来源：<https://www.nanya.com/en/Product/List/450/2249>、<https://www.nanya.com/en/Product/List/450/7591>、<https://www.nanya.com/en/Product/List/450/2250>、<https://www.nanya.com/en/Product/List/450/2264>、<https://www.nanya.com/en/Product/List/450/2478>、<https://www.nanya.com/en/Product/List/547/2251>、<https://www.nanya.com/en/Product/List/547/2252>、<https://www.nanya.com/en/Product/List/547/2343>、<https://www.nanya.com/en/Product/List/547/2356>、<https://www.nanya.com/en/Product/List/547/6586>、<https://www.nanya.com/en/Product/List/547/6587>
- 本轮用户提供的 Nanya DDR4-8Gb C-Die 与 DDR4-4Gb E-Die datasheet / ordering 截图确认 `5AD` DDR4 命名：`D = 1.2V / 1.2V / 2.5V`，`C = 3rd version`、`E = 5th version`，`3 = 78-ball TFBGA`、`4 = 96-ball TFBGA`，`HR = 2666-19-19-19`、`JR = 3200-22-22-22`，grade 空 / `I` / `T` / `U` 分别对应 Commercial、Industrial、Quasi Industrial、Industrial wide temp；截图 ordering table 中的 C/E 系 exact PN 已加入 `dram-pn.json`。
- Nanya 官方 `NT5TU32M16FG-ACI` 页面确认 DDR2、512Mb、x16、84-ball BGA、800Mbps、工业温度。来源：<https://www.nanya.com/en/Product/3873/NT5TU32M16FG-ACI>
- Nanya 官方 `NT5CB128M16JR-DI` 页面确认 DDR3、2Gb、x16、96-ball BGA、1600Mbps、0C~95C。来源：<https://www.nanya.com/en/Product/4111/NT5CB128M16JR-DI>
- Nanya 官方 `NT5CC128M16JR-DI` 页面确认 DDR3L、2Gb、x16、96-ball BGA、1600Mbps、0C~95C；规则输出仍使用标准化 `DDR3`，电压区分为 1.35V。来源：<https://www.nanya.com/cn/Product/4114/NT5CC128M16JR-DI>
- 用户提供的 `常见几种DDR3_DDR3L的命名规则.pdf` 和本轮 Nanya DDR3(L) 1Gb / 2Gb / 4Gb 截图确认 `NT5CB(C)128M8GN` / `64M16GP`、`256M8JQ` / `128M16JR`、`256M8IN` / `128M16IP`、`256M8FN` / `128M16FP`、`512M8EQ` / `256M16ER` 等结构，`B/C` 电压 token、`GN/GP` VFBGA、`JQ/JR` / `FN/FP` / `EQ/ER` TFBGA、`IN/IP` VFBGA package token，以及 DDR3 speed token `AC/AD/BE/BF/CF/CG/DG/DH/DI/EJ/EK/FK/FL` 的时序含义。
- Nanya 官方 `NT6TL128M32BA-G0` 页面确认 LPDDR2、4Gb、x32、134-ball BGA、1066Mbps、-25C~85C；`NT6TL128M32BA-G0I/G0H` 分别确认 Industrial / Automotive grade token。来源：<https://www.nanya.com/en/Product/4069/NT6TL128M32BA-G0>、<https://www.nanya.com/en/Product/4072/NT6TL128M32BA-G0I>、<https://www.nanya.com/en/Product/4074/NT6TL128M32BA-G0H>
- Nanya 官方 `NT6CL256M32AM-H0` 页面确认 LPDDR3、8Gb、x32、178-ball BGA、2133Mbps、-30C~105C。来源：<https://www.nanya.com/en/Product/4324/NT6CL256M32AM-H0>
- 本轮用户提供的 Nanya LPDDR3 4Gb / 8Gb / 16Gb / 32Gb datasheet / ordering 截图确认 `NT6CL` 命名：`6C = LPDDR3`、`L = HSUL_12 (1.8V, 1.2V, 1.2V, 1.2V)`；`128M32` / `256M16` 为 4Gb，`256M32` 为 8Gb，`512T32` 为 16Gb DDP，`1024F32` 为 32Gb QDP，`128T64` 为 8Gb DDP 2-channel；`A/B/D` 分别为 1st / 2nd / 4th version；`M/P` 为 178-ball FBGA，`Q` 为 168-ball PoP BGA，`R` 为 216-ball 2-CH PoP-BGA / PoP-FBGA；`H0/H1/H2` 分别为 2133Mbps RL=16、1866Mbps RL=14、1600Mbps RL=12。截图 ordering table 中的 exact PN 已加入 `dram-pn.json`。
- Nanya 官方 `NT6AN512T32AV-J1` / `NT6AP512T32AV-J1` 页面确认 LPDDR4 / LPDDR4X、16Gb、x32、200-ball BGA、4267Mbps。来源：<https://www.nanya.com/en/Product/4330/NT6AN512T32AV-J1>、<https://www.nanya.com/en/Product/4588/NT6AP512T32AV-J1>
- 本轮用户提供的 Nanya LPDDR4 2Gb / 4Gb、4Gb / 8Gb、8Gb / 16Gb / 32Gb datasheet / ordering 截图确认 `NT6AN` 命名：`6A = LPDDR4`、`N = LVSTL (1.8V, 1.1V, 1.1V)`；`128M16` 为 2Gb SDP，`128T32` 为 4Gb DDP，`256M16` 为 4Gb SDP，`256T32` 为 8Gb DDP，`512M16` 为 8Gb SDP，`512T32` 为 16Gb DDP，`1024F32` 为 32Gb QDP；`A = 1st version`，`V = 200-ball FBGA`。截图还确认 128/256 系封装高度 0.83mm、512 系高度 1.00mm、1024F32 QDP 高度 1.20mm，`J1/J2/J3` 分别为 4267Mbps RL=36、3733Mbps RL=32、3200Mbps RL=28，其中 `J3` 只在 2Gb / 4Gb 表中出现。截图 ordering table 中的 exact PN 已加入 `dram-pn.json`。
- Nanya 官方 `NT6BR1024M16A3-K2` 页面确认 LPDDR5/5X 类别、16Gb、x16、315-ball BGA、7500Mbps；`NT6BR1024M16A3-K1` 确认 8533Mbps 与 LPDDR5X speed bin。来源：<https://www.nanya.com/en/Product/10086/NT6BR1024M16A3-K2>、<https://www.nanya.com/en/Product/10082/NT6BR1024M16A3-K1>
- 2026-05-09 复查 `NT5CB/NT5CC/NT5AD/NT5FF + DDP`：公开结果主要仍是 `M` stack-code 的 standard DDR3/DDR4/DDR5 页面，以及已覆盖的 low-power DRAM DDP/QDP 页面；暂未找到可直接加入 testcase 的 standard DDR `T/F` exact PN。检索到的 `NT5CB256M16ER-EKA` / `NT5CC256M16ER-EKA` 等公开 datasheet 仍是 standard DDR3(L) 4Gb `M`/单 die 组合。来源：<https://www.alldatasheet.net/html-marking/1145497/NANYA/NT5CB256M16ER-EKA/7060/37/NT5CB256M16ER-EKA.html>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/nanya-dram-token.json`
- 规则 ID：`vendor.nanya.dram.standard.component.v1`、`vendor.nanya.dram.low_power.component.v1`
- 当前覆盖：
  - Standard DRAM：`NT5DS/NT5TU/NT5CB/NT5CC/NT5AD/NT5FF`，覆盖 DDR、DDR2、DDR3/DDR3L、DDR4、DDR5。
  - Low Power DRAM：`NT6TL/NT6CL/NT6AN/NT6AP/NT6AT/NT6BR`，覆盖 LPDDR2、LPDDR3、LPDDR4、LPDDR4X、LPDDR5/5X。
  - Nanya 官方产品线没有公开 GDDR 类别，Graphics DRAM 维持未覆盖。

## PN 结构

```text
NT + family + depth + stack-code + width + package + -speed + optional grade
```

示例：

```text
NT5AD1024M8C3-HR
NT6AP512T32AV-J1
NT6CL128T64DR-H1
NT6AN1024F32AV-J2
```

## 输出约定

- `depth x width` 直接推导 `fields.density`，例如 `1024M8` 输出 `8192` Mbit。
- `M/T/F` stack code 默认分别输出 `dram_die_count=1, cs_count=1`、`dram_die_count=2, cs_count=1`、`dram_die_count=4, cs_count=2`；LPDDR3 / LPDDR4 等 low-power family 根据 ordering table 额外覆盖 CS / channel 语义。
- suffix 不存在时不输出 `dram_speed` / `operation_temperature`；suffix 存在但 grade token 不存在时只输出 speed。
- standard DDR speed token 以 `family + speed` 做组合 key，避免 DDR2 `AC/BE` 与 DDR3 `AC/BE` 冲突；DDR3/DDR3L `AC..FL` 输出 PDF 中给出的 CL-tRCD-tRP 时序。
- DDR3(L) suffix grade `B` 输出 `special_option = Reduced Standby`；`T` 输出 Quasi Industrial，`A/H` 分别输出 Automotive Grade 3 / Grade 2。
- DDR3(L) package 输出使用截图确认的实际封装类型：`GN/GP` 与 `IN/IP` 为 VFBGA，`JQ/JR`、`FN/FP`、`EQ/ER`、`CN/CP` 为 TFBGA。
- DDR4 `5AD` 输出完整 `dram_voltage = 1.2V VDD / 1.2V VDDQ / 2.5V VPP`；`C/E` device version 输出为 `die_revision = C-die (3rd version)` / `E-die (5th version)`；`HR/JR` 输出完整 `DDR4-2666 19-19-19` / `DDR4-3200 22-22-22`。
- DDR4 package code `3/4` 输出 TFBGA 语义；C/E 截图确认了具体尺寸时输出 `7.50x12.00mm`、`7.50x10.50mm` 或 `7.50x13.00mm` 与 `0.80mm pitch`。`5AD` 还输出 `solder_type = Lead-free RoHS compliant and Halogen-free`；C/E density-addressing 表确认 x4/x8 为 16 banks、x16 为 8 banks。
- 低功耗 speed token 以 `family + speed` 做组合 key，避免 LPDDR4 与 LPDDR4X 共用 `J1` 时混淆。
- LPDDR3 `NT6CL` 输出 `interface_type = HSUL_12`、`bank_count = 8`、`solder_type = Lead-free RoHS compliant and Halogen-free`；`A/B/D` device version 以 `die_revision` 表达为 `1st version` / `2nd version` / `4th version`。
- LPDDR3 `M/T/F` 分别输出 `dram_die_count=1, cs_count=1`、`dram_die_count=2, cs_count=2`、`dram_die_count=4, cs_count=2`；`x64` 2-channel PoP 组合额外输出 `channel_count = 2`。
- LPDDR3 `H0/H1/H2` 输出 `dram_speed`、`cas_latency` 与保留原始 token 的 `speed_grade`；`B` version ordering 截图中的 commercial grade 温度为 `-25C~85C`，`A/D` version 截图为 `-30C~105C`。
- LPDDR3 package 输出使用截图确认的实际封装：178-ball FBGA 10.50x11.50mm（SDP/DDP 0.83mm、QDP 1.05mm 高度，0.65/0.80mm mixed pitch）、168-ball PoP BGA 12.00x12.00mm 0.50mm pitch、216-ball 2-CH PoP-BGA / PoP-FBGA 12.00x12.00x0.83mm 0.40mm pitch。
- LPDDR4 `NT6AN` 输出 `interface_type = LVSTL`、`bank_count = 8`、`solder_type = Lead-free RoHS compliant and Halogen-free`；`A` device version 输出为 `die_revision = 1st version`，`x16` / `x32` 分别输出 `channel_count = 1` / `2`。`J1/J2` 输出 `dram_speed`、`cas_latency` 和 `speed_grade`；`J3` 仅对 `128M16` / `128T32` 已确认组合输出 `LPDDR4-3200`。
- LPDDR4 `AV` package 按 config 输出截图确认的实际厚度：`128M16` / `128T32` / `256M16` / `256T32` 为 200-ball FBGA 10.00x15.00x0.83mm，`512M16` / `512T32` 为 10.00x15.00x1.00mm，`1024F32` 为 10.00x15.00x1.20mm，均为 0.65/0.80mm mixed pitch。
- standard DDR 的 `T/F` stack-code 维持结构化解析；官方当前 DDR3 component 表现已确认 `NT5CB512T16EH-FL` 的 `T` 双 die exact PN，并加入搜索资源与 testcase。`F` 仍只保留结构化支持，等待公开 exact ordering PN。
- LPDDR2 / LPDDR3 / LPDDR4X 新补的 package token 只输出官方产品表明确给出的 ball count 与 PoP 类型；没有尺寸依据时不补猜尺寸。`6AT:I/H` 分别按官方表输出 Industrial / Automotive `-40C~105C`，不再因 grade token 未登记而丢失温区。
- standard DDR5 新封装示例仍走算术 config：`NT5FF2048M8EK-WEU` 输出 16Gb / x8、`EK` 78-ball BGA、`WE` DDR5-8000、`U` Industrial (-40C~105C)；`NT5FF2048M8DK-UB` 输出 `DK` 78-ball BGA 与 DDR5-7200。
- 低功耗 PN 中 `NT6AP256F64BN-J1` 这类 PoP 组合输出 `BN` 376-ball PoP，并按 `F64` 输出 `dram_die_count=4, cs_count=2`。
