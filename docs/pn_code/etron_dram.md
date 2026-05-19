# Etron DRAM PN 规则

采集日期：2026-05-12；本轮补充：2026-05-19

本页记录 Etron standalone DRAM 颗粒的 PN 结构。当前覆盖官方产品页中可直接确认的 automotive SDR，以及 specialty DDR、DDR2、DDR3/DDR3L、DDR4、LPDDR2、LPDDR4/LPDDR4X。2026-05-19 根据用户提供的 Etron datasheet / ordering table 截图补充 LPDDR2，并将 LPDDR4/LPDDR4X 的补全 PN 从页眉式 family PN 清理为带 speed suffix 的标准订货 PN。

## 资料来源

- Etron Automotive DRAM SDRAM 产品页列出 `EM63*` 系列 PN、容量、I/O、速度、电压、温度与 TSOP/FBGA 封装。来源：<https://etron.com/automotive-dram-pl/sdram/>
- Etron Specialty DRAM DDR SDRAM 产品页列出 `EM6A*` 系列 PN、容量、I/O、2.5V、速度与 TSOP/FBGA/BGA 封装。来源：<https://etron.com/specialty-dram-pl/ddr-sdram/>
- Etron Specialty DRAM DDR2 SDRAM 产品页列出 `EM68*` 系列 PN、容量、I/O、1.8V、速度与 FBGA 封装。来源：<https://etron.com/specialty-dram-pl/ddr2-sdram/>
- Etron Specialty DRAM DDR3 SDRAM 产品页列出 `EM6G*` / `EM6H*` 系列 PN；`G` 对应 DDR3 1.5V，`H` 对应 DDR3L 1.35V。来源：<https://etron.com/specialty-dram-pl/ddr3-sdram/>
- Etron Specialty DRAM DDR4 SDRAM 产品页列出 `EM6O*` 系列 PN、4Gb/8Gb/16Gb、x8/x16、1.2V、2400/2666/3200 与 78/96-ball FBGA。来源：<https://etron.com/specialty-dram-pl/ddr4-sdram/>
- Etron Specialty DRAM LPDDR4/LPDDR4X 产品页列出 `EM6L*` / `EM6P*` 系列 PN；`L` 对应 LPDDR4，`P` 对应 LPDDR4X。来源：<https://etron.com/specialty-dram-pl/lpddr4-lpddr4x-sdram/>
- 用户提供的 Etron datasheet / ordering table 截图补充确认 `EM6KA32HVAFA-18H/-25H/-3H` LPDDR2，以及 LPDDR4/LPDDR4X 标准订货 PN suffix：`46` = 4266Mbps/pin / 2133MHz、`53` = 3733Mbps/pin / 1866MHz、`62` = 3200Mbps/pin / 1600MHz、`08` = 2400Mbps/pin / 1200MHz；`I` 为 Industrial，`B` 为 Automotive A2，`P` 为 ECC chip，`S` 为 stacked / dual die，`H` 为 Pb and Halogen Free。本轮没有联网抓取 PDF。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/etron-dram-token.json`
- 规则 ID：`vendor.etron.dram.sdr.component.v1`、`vendor.etron.dram.ddr.component.v1`、`vendor.etron.dram.ddr2.component.v1`、`vendor.etron.dram.ddr3.component.v1`、`vendor.etron.dram.ddr4.component.v1`、`vendor.etron.dram.lpddr2.component.v1`、`vendor.etron.dram.lpddr4.component.v1`
- 当前覆盖：
  - `EM63*`：SDR SDRAM automotive。
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

- SDR `EM63` 输出 automotive temperature；specialty DRAM 页面中的 DDR/DDR2/DDR3/DDR4/LPDDR4 默认输出 commercial temperature。
- DDR3 `G/H` token 输出 1.5V / 1.35V；LPDDR4 `L/P` token 输出 LPDDR4 / LPDDR4X 与对应 VDDQ。
- DDR4 `E/F/G` token 输出 4Gb/8Gb/16Gb，LPDDR4 `D/E/F/G/H` token 输出 2Gb/4Gb/8Gb/16Gb/32Gb。
- x8 / x16 DDR3/DDR4 分别输出 78/96-ball FBGA；LPDDR2 `VAF` 输出 134-ball 10 x 11.5 x 1.0mm FBGA；LPDDR4/4X `VAJ` 输出 200-ball 10 x 14.5 x 0.8mm FBGA，`BAJ` 输出 200-ball 10 x 14.5 x 1.1mm FBGA。
- LPDDR4/4X 如果有 speed token，只输出该 token 对应的具体速率；遇到未知 speed token 时也不回退输出 family 级速度范围。没有 speed token 的 family/base PN 才保留产品族速度范围。
- LPDDR4/4X suffix 中的 `S` 输出 `dram_die_stack`，`P` 输出 `ecc_enabled`，`I/B` 输出对应温度等级；没有这些 suffix token 时不推断。
- `packages/core/resources/dram-pn.json` 收录标准 ordering PN，用于搜索补全；解码仍由 token 规则完成，不把补全表当作白名单。
