# Etron DRAM PN 规则

采集日期：2026-05-12；本轮补充：2026-05-19

本页记录 Etron 独立 DRAM 颗粒的 PN 结构。当前覆盖官方产品页中可直接确认的车规 SDR，以及专用 DDR、DDR2、DDR3/DDR3L、DDR4、LPDDR2、LPDDR4/LPDDR4X。2026-05-19 根据 Etron 官网专用 DRAM 页面抓取 DDR、DDR2、DDR3/DDR3L、DDR4 的 52 个数据手册，并只解析每份 PDF 前两页的订购信息 / 速度等级 / 封装规格；同日也根据用户提供的 Etron 数据手册 / 订购编码表截图补充 LPDDR2，并将 LPDDR4/LPDDR4X 的补全 PN 从页眉式系列 PN 清理为带速度后缀的标准订货 PN。

## 资料来源

- Etron 车规 DRAM SDRAM 产品页列出 `EM63*` 系列 PN、容量、I/O、速度、电压、温度与 TSOP/FBGA 封装。来源：<https://etron.com/automotive-dram-pl/sdram/>
- Etron 专用 DRAM DDR SDRAM 产品页列出 `EM6A*` 系列 PN、容量、I/O、2.5V、速度与 TSOP/FBGA/BGA 封装。来源：<https://etron.com/specialty-dram-pl/ddr-sdram/>
- Etron 专用 DRAM DDR2 SDRAM 产品页列出 `EM68*` 系列 PN、容量、I/O、1.8V、速度与 FBGA 封装。来源：<https://etron.com/specialty-dram-pl/ddr2-sdram/>
- Etron 专用 DRAM DDR3 SDRAM 产品页列出 `EM6G*` / `EM6H*` 系列 PN；`G` 对应 DDR3 1.5V，`H` 对应 DDR3L 1.35V。来源：<https://etron.com/specialty-dram-pl/ddr3-sdram/>
- Etron 专用 DRAM DDR4 SDRAM 产品页列出 `EM6O*` 系列 PN、4Gb/8Gb/16Gb、x8/x16、1.2V、2400/2666/3200 与 78/96 球 FBGA。来源：<https://etron.com/specialty-dram-pl/ddr4-sdram/>
- 2026-05-19 联网抓取上述 DDR~DDR4 产品页中的所有公开数据手册链接，并从 PDF 前两页确认标准订货后缀：DDR `-4G/-4H` = 500Mbps/引脚，`-5G/-5H` = 400Mbps/引脚；DDR2 `-18H/-25H/-3H` = 1066/800/667Mbps/引脚；DDR3/DDR3L `-09H/-10H/-12H/-15H` = 2133/1866/1600/1333Mbps/引脚，`I/A/B` 分别标记工业级 / 车规 Grade3 / 车规 Grade2，`S` 标记堆叠 die；DDR4 `-62H/-07H/-08H` = 3200/2666/2400Mbps/引脚。
- Etron 专用 DRAM LPDDR4/LPDDR4X 产品页列出 `EM6L*` / `EM6P*` 系列 PN；`L` 对应 LPDDR4，`P` 对应 LPDDR4X。来源：<https://etron.com/specialty-dram-pl/lpddr4-lpddr4x-sdram/>
- 用户提供的 Etron 数据手册 / 订购编码表截图补充确认 `EM6KA32HVAFA-18H/-25H/-3H` LPDDR2，以及 LPDDR4/LPDDR4X 标准订货 PN 后缀：`46` = 4266Mbps/引脚 / 2133MHz、`53` = 3733Mbps/引脚 / 1866MHz、`62` = 3200Mbps/引脚 / 1600MHz、`08` = 2400Mbps/引脚 / 1200MHz；`I` 为工业级，`B` 为车规 A2，`P` 为 ECC 芯片，`S` 为堆叠 / 双 die，`H` 为无铅无卤。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/etron-dram-token.json`
- 规则 ID：`vendor.etron.dram.sdr.component.v1`、`vendor.etron.dram.ddr.component.v1`、`vendor.etron.dram.ddr2.component.v1`、`vendor.etron.dram.ddr3.component.v1`、`vendor.etron.dram.ddr4.component.v1`、`vendor.etron.dram.lpddr2.component.v1`、`vendor.etron.dram.lpddr4.component.v1`
- 当前覆盖：
  - `EM63*`：SDR SDRAM 车规。
  - `EM6A*`：DDR SDRAM。
  - `EM68*`：DDR2 SDRAM。
  - `EM6G*` / `EM6H*`：DDR3 / DDR3L SDRAM。
  - `EM6O*`：DDR4 SDRAM。
  - `EM6K*`：LPDDR2 SDRAM。
  - `EM6L*` / `EM6P*`：LPDDR4 / LPDDR4X SDRAM。

## PN 结构

SDR：

```text
EM63 + density/width token + package token
```

LPDDR2：

```text
EM6K + density/config token + width token + interface token + package token + generation token + "-" + speed/Pb-free suffix
```

DDR / DDR2 / DDR3 / DDR4 / LPDDR4：

```text
EM6 + family/generation token + density token + width token + revision/core token + package/generation token + optional "-" speed/grade suffix
```

## 输出约定

- SDR `EM63` 输出车规温度；专用 DRAM 页面中的 DDR/DDR2/DDR3/DDR4/LPDDR4 默认输出商业级温度。
- DDR3 `G/H` 编码段输出 1.5V / 1.35V；LPDDR4 `L/P` 编码段输出 LPDDR4 / LPDDR4X 与对应 VDDQ。
- DDR4 `E/F/G` 编码段输出 4Gb/8Gb/16Gb，LPDDR4 `D/E/F/G/H` 编码段输出 2Gb/4Gb/8Gb/16Gb/32Gb。
- x8 / x16 DDR3/DDR4 分别输出 78/96 球 FBGA；LPDDR2 `VAF` 输出 134 球 10 x 11.5 x 1.0mm FBGA；LPDDR4/4X `VAJ` 输出 200 球 10 x 14.5 x 0.8mm FBGA，`BAJ` 输出 200 球 10 x 14.5 x 1.1mm FBGA。
- DDR、DDR2、DDR3/DDR3L、DDR4 如果有数据手册速度后缀，只输出后缀对应的具体 `dram_speed`，不再额外输出重复速率含义的 `speed_grade`；未知后缀不回退输出系列级速度范围。缺后缀的产品页 PN 继续保留系列级速度范围。
- DDR3/DDR3L 数据手册后缀中的 `S` 输出 `dram_die_count` / `cs_count`，`I/A/B` 输出对应温度 /车规等级；没有这些后缀编码段时不推断。
- LPDDR4/4X 如果有速度编码段，只输出该编码段对应的具体速率；遇到未知速度编码段时也不回退输出系列级速度范围。没有速度编码段的系列/基础 PN 才保留产品族速度范围。
- LPDDR4/4X 后缀中的 `S` 输出 `dram_die_count` / `cs_count`，`P` 输出 `ecc_enabled`，`I/B` 输出对应温度等级；没有这些后缀编码段时不推断。
- `packages/core/resources/dram-pn.json` 收录标准订购 PN，用于搜索补全；本轮从 DDR~DDR4 数据手册前两页新增 181 个带速度后缀的 Etron 订购 PN。解码仍由编码段规则完成，不把补全表当作白名单。

## 历史资料补全记录

以下为当时的采集/实施记录；具体编码段定义以本页对应章节为准。

- 2026-05-19 根据用户提供的 Etron LPDDR2 / LPDDR4 / LPDDR4X 数据手册截图补齐 `EM6K` LPDDR2 编码段，并把 Etron LPDDR4/4X 补全项从页眉式系列 PN 清理为带速度后缀的标准订购 PN；带速度编码段的 PN 只输出具体速率，不输出系列级速度范围。
- 2026-05-19 从 Etron 官网专用 DRAM 页面抓取 DDR、DDR2、DDR3/DDR3L、DDR4 的 52 个公开数据手册，只解析前两页订购信息 / 规格：补齐 DDR~DDR4 速度后缀、DDR3/DDR3L 工业/车规/堆叠 die 后缀、精确 FBGA/BGA/TSOP 封装尺寸，并把 181 个带速度后缀的订购 PN 加入 `dram-pn.json`。带速度后缀的 PN 只输出具体速率，不重复输出系列速度。
