# GigaDevice / 兆易创新 DRAM PN 规则

采集日期：2026-05-18

本页记录 GigaDevice / 兆易创新 `GDP` DDR3L、`GDQ` DDR4 与 `GDB` LPDDR4X standalone DRAM 颗粒的 PN 结构。GigaDevice 官网确认同系列产品和 exact PN；用户提供的 ordering 截图与 XCMemory datasheet / 产品页补足 token 位含义。iTXTech fdnext DecodePack 仅输出结构化语义字段，不把来源状态、产品状态或原始 code 字段写入 public fields。

## 外部资料

- GigaDevice 官方 DDR3L 产品页列出 `GDP0BFLM-CB`、`GDP1BFLA-CB/CA/WB`、`GDP2A8LM-CB`、`GDP2BFLM-CB/CA/WB`、`GDP3BELM-CB/WB`，确认 1Gb / 2Gb / 4Gb / 8Gb、x8 / x16、1866 / 2133Mbps、1.35 / 1.5V、0C~95C / -40C~95C、78-FBGA / 96-FBGA。来源：<https://www.gigadevice.com.cn/product/dram/ddr3l>
- XCMemory DDR3L 产品页同向列出 `GDP0BFLM`、`GDP1BFLA`、`GDP2A8LM`、`GDP2BFLM`、`GDP3BELM` exact PN，确认电压、速率、温度和封装。来源：<https://www.xcmemory.com/ddr3l/>
- XCMemory `GDP0BFLM` / `GDP2A8LM` / `GDP2BFLM` datasheet 镜像和用户截图确认 `GDP` DDR3L token：`P=DDR3(L)`、`L=1.35V/1.5V`、`C/W` 温度档、`A/B` 速度档；`GDP2A8LM` valid PN 包含 `CB/CA/WB/WA`，`GDP2BFLM` valid PN 包含 `CB/CA/WB/WA`。来源：<https://www.xcmemory.com/datasheet/DS-01221-GDP0BFLM-Rev1.0xc.pdf>、<https://www.xcmemory.com/datasheet/DS-01226-GDP2A8LM-Rev1.0xc.pdf>、<https://www.xcmemory.com/datasheet/DS-01223-GDP2BFLM-Rev1.0xc.pdf>
- GigaDevice 官方 DDR4 产品页列出 4Gb / 8Gb、x8 / x16、78-FBGA / 96-FBGA、1.2V、0C~95C / -40C~95C 的 `GDQ2...` 与 `GDQ3...` exact PN。来源：<https://www.gigadevice.com.cn/product/dram/ddr4>
- GigaDevice 官方 LPDDR4X 产品页列出 `GDB4CBQN-*` 与 `GDB5CBQN-*`，确认 16Gb / 32Gb、x32、3200 / 3733 / 4266Mbps、1.8 / 1.1 / 1.1&0.6V、-25C~85C、200-FBGA。来源：<https://www.gigadevice.com.cn/product/dram/lpddr4x>
- GigaDevice 官方新闻确认首款自有品牌 4Gb DDR4 `GDQ2BFAA` 已量产，作为 `GDQ2BFAA-*` 系列归属和产品线背景。来源：<https://www.gigadevice.com.cn/about/news-and-event/news/gd-ddr4-available-now>
- XCMemory `GDQ3BFAM` datasheet 镜像列出 `GDQ3BFAM` part-number decoding：`G D Q 3 B F A M - xx`，其中 `Q=DDR4`、`3=8Gb`、`B=96-Ball FBGA`、`F=x16`、`A=1.2V`、`C/W/I` 为温度档，`Q/J` 为 2666 / 3200Mbps timing，并列出 `GDQ3BFAM-CQ/CJ/WQ/WJ/IQ/IJ`。来源：<https://www.xcmemory.com/datasheet/DS-01112-GDQ3BFAM-Rev1.2xc.pdf>
- XCMemory `GDQ2BFAC` datasheet 镜像和用户截图确认 `GDQ2BFAC` 同一 DDR4 token 结构，`2=4Gb`、`C` product version，valid PN 包含 `C/W/I` 温度档与 `Q/J` 速度档。来源：<https://www.xcmemory.com/datasheet/DS-01250-GDQ2BFAC-Rev1.2xc.pdf>
- XCMemory `GDB5CBQN` datasheet 镜像确认 `GDB5CBQN` part-number decoding：`G D B 5 C B Q N - Mx`，其中 `B=LPDDR4x`、`5=32Gb`、`C=200-Ball FBGA`、`B=x32 2CH 1CS DDP`、`Q=1.8V/1.1V/1.1V&0.6V`、`M=-25C~85C`、`J/K/L` 为 3200 / 3733 / 4266Mbps。来源：<https://www.xcmemory.com/datasheet/DS-01314-GDB5CBQN-Rev1.1xc.pdf>
- XCMemory LPDDR4X 产品页补充列出 `GDB4CBQA-*`、`GDB5CCQA-*`、`GDB4CBQN-*`、`GDB5CBQN-*` exact PN；`GDB5CCQN-*` 的 QDP 结构来自用户截图与外部 datasheet 镜像。来源：<https://www.xcmemory.com/lpddr4x/>、<https://uttc.com.tw/wp-content/uploads/2025/12/DS-01241-GDB5CCQN-Rev1.1xc.pdf>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/gigadevice-dram-token.json`
- 规则 ID：`vendor.gigadevice.dram.ddr3l.component.v1`、`vendor.gigadevice.dram.ddr4.component.v1`、`vendor.gigadevice.dram.lpddr4x.component.v1`
- 当前覆盖：
  - DDR3L：`GDP0BFLM-*`、`GDP1BFLA-*`、`GDP2A8LM-*`、`GDP2BFLM-*`、`GDP3BELM-*` 同类 token 结构
  - DDR4：`GDQ2A8AA-*`、`GDQ2BFAA-*`、`GDQ2BFAC-*`、`GDQ3A8AM-*`、`GDQ3BFAM-*` 同类 token 结构
  - LPDDR4X：`GDB4CBQA-*`、`GDB4CBQN-*`、`GDB5CBQN-*`、`GDB5CCQA-*`、`GDB5CCQN-*` 同类 token 结构

## PN 结构

DDR3L：

```text
G + D + P + density + package type + bit organization + voltage + product version + -temperature/speed
```

DDR4：

```text
G + D + Q + density + package type + bit organization + voltage + product version + -temperature/speed
```

LPDDR4X：

```text
G + D + B + density + package type + bit organization + voltage + product version + -temperature/speed
```

## 输出约定

- DDR3L `0/1/2/3` 输出 1Gb / 2Gb / 4Gb / 8Gb；package type `A/B` 输出 78-ball / 96-ball FBGA；bit organization `8/F` 输出 x8 / x16，`E` 输出 x16 并标记 `DDP` / `dram_die_count=2`；voltage `L` 输出 1.35V / 1.5V。
- DDR3L suffix 拆为 temperature + speed：`C/W` 输出 commercial / wide temperature，`A/B` 输出 DDR3L-2133 / DDR3L-1866 timing。`dram_type` 仍按跨厂商约定输出 `DDR3`，低电压含义体现在电压和 speed 文本中。
- DDR4 `2` 输出 4Gb，`3` 输出 8Gb；package type `A/B` 输出 78-ball / 96-ball FBGA；bit organization `8/F` 输出 x8 / x16；voltage `A` 输出 1.2V。
- DDR4 suffix 拆为 temperature + speed：`C/W/I` 输出 commercial / industrial I / industrial II，`E/Q/J` 输出 DDR4-2400 / DDR4-2666 / DDR4-3200 timing。
- LPDDR4X `4` 输出 16Gb，`5` 输出 32Gb；package type `C` 输出 200-ball FBGA；bit organization `B` 输出 `dram_die_count=2, cs_count=1`，`C` 输出 `dram_die_count=4, cs_count=2`；width 均为 x32。
- LPDDR4X voltage `Q` 输出 VDD1 / VDD2 / VDDQ 电压；suffix `M` 输出 -25C~85C，`J/K/L` 输出 LPDDR4X-3200 / 3733 / 4266。
- product version `A/C/M/N` 只作为结构 token，不进入 public fields。
- 没有公开 ordering table 的更高容量或 LPDDR5/LPDDR5X GigaDevice PN 暂不进入规则。
