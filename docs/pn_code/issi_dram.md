# ISSI DRAM PN 规则

采集日期：2026-05-11；更新日期：2026-05-18

本页记录 ISSI standalone DRAM 颗粒的 PN 结构。本轮覆盖官方 PSG 与 datasheet / ordering 表中可直接确认的 DDR3/DDR3L、DDR4、LPDDR4/LPDDR4X，并按 ISSI DRAM Part Decoder 图扩展 `IS41/IS42/IS43/IS45/IS46` 通用结构；RLDRAM 系列先保留为后续扩展。

## 外部资料

- ISSI 2024 Product Selector Guide 列出 DRAM Part Decoder、DDR3/DDR3L、DDR4、LPDDR4/4X、RLDRAM 等产品表。来源：<https://issi.com.cn/WW/pdf/PSG.pdf>
- DDR4 表确认 `IS43/IS46QR85120B`、`QR16256B`、`QR81024A`、`QR16512A`、`QR8K02S2A` 的容量、组织、1.2V、速度与 BGA(78/96) 封装；`QR8K02S2A` 标注 Dual Rank。
- DDR3/DDR3L 表确认 `IS43/IS46TR*` 系列的容量、组织、电压、速度与 BGA(78/96) 封装；`TR16512S2DL`、`TR16K01S2AL` 等标注 Dual Rank。
- LPDDR4/4X 表确认 `IS43/IS46LQ*` 系列的 2Gb/4Gb/8Gb、single channel `(1 x16)` 或 two channel `(2 x16)`、VDDQ/VDD2/VDD1、3200/3733 MT/s 与 BGA(200) 封装。
- ISSI DRAM Part Decoder 图给出 `41/42/43/45/46` product family、`LV/S/VS/R/DR/TR/QR/SM/RM/VM/LR/LD/LQ` 电压/低功耗 token、bus width、word count、die revision、speed、CAS、package、solder、temperature 与 packing 后缀结构。
- 用户提供的 ISSI `IS43/46LQ32K01B` datasheet / ordering 截图确认 32Gb `(x16 x 2 channel)` LPDDR4/LPDDR4X、`32K01` = `1Gb x32`、`B` = 2nd generation、`-046/-053` = 4266/3733Mbps、200-ball BGA、I/A1/A2/A3 温度档。
- 用户继续提供的 ISSI `IS43/46LQ16512B`、`IS43/46LQ32512A`、`IS43/46LQ32K01S2A`、`IS43/46LQ32K02S2A`、`IS43/46LQ32256A`、`IS43/46LQ32256AL` datasheet / ordering 截图确认 8Gb / 16Gb / 32Gb / 64Gb LPDDR4/LPDDR4X 结构：`16512B` = 512Mb x16、`32512A` = 512Mb x32、`32K01S2A` = 1Gb x32 dual-rank、`32K02S2A` = 2Gb x32 dual-rank、`32256A/AL` = 256Mb x32；`-046/-053/-062` 分别对应 4266/3733/3200Mbps，`B/BH/TB` package suffix、`L` green package、I/A1/A2/A3 温度档按 ordering table 进入规则和 `dram-pn.json`。
- 用户提供的 ISSI DDR4 datasheet / ordering 截图确认 `IS43/46QR85120B`、`QR16256B`、`QR81024B`、`QR16512B` 的 4Gb / 8Gb DDR4 料号、`-083R/-075U` 与 `-083T/-075V/-062AA` speed / CL token、78/96-ball FBGA/BGA 封装和 I/A1/A2/A3 温度档。
- 用户提供的 ISSI DDR3 / DDR3L datasheet / ordering 截图确认 `IS43/46TR16256B(L)`、`TR85120B(L)`、`TR16512B(L)`、`TR81024B(L)` 这批 4Gb / 8Gb DDR3(L) 料号，以及既有 `TR16K01S2AL`、`TR16128D(L)`、`TR82560D(L)` 的 16Gb / 2Gb 料号；`-125K/-107M/-093N` speed / CL token、78/96-ball BGA 封装和 I/A1/A2/A25/A3 温度档均由 ordering 表确认。
- 用户继续提供的 ISSI DDR3 / DDR3L ordering 截图确认 `TR16640C(L)` / `TR81280C(L)` 1Gb、`TR16256DL` / `TR85120DL` 4Gb、`TR16512S2DL` dual-rank 8Gb；`125J` 对应 DDR3-1600J / CL10，`TR16640CL` 的 `B2` 封装后缀对应 96-ball BGA (7.5mm x 13mm)。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/issi-dram-token.json`
- 规则 ID：`vendor.issi.dram.standard.component.v1`、`vendor.issi.dram.lpddr4.component.v1`、`vendor.issi.dram.decoder.component.v1`
- 当前覆盖：
  - `IS41`：Asynchronous DRAM decoder 结构。
  - `IS42` / `IS45`：SDR Commercial/Industrial 与 Automotive decoder 结构。
  - `IS43/IS46TR`：DDR3 / DDR3L。
    - 本轮补充 `TR16256B(L)` / `TR85120B(L)` 4Gb、`TR16512B(L)` / `TR81024B(L)` 8Gb，以及 `C/CL`、`DL`、`S2DL` 变体 ordering PN 到 `dram-pn.json`。
  - `IS43/IS46QR`：DDR4，含 4Gb / 8Gb / 16Gb 与 ordering suffix speed / temperature 样例。
  - `IS43/IS46LQ`：LPDDR4 / LPDDR4X，含 ECC token、`LQ16512B`、`LQ32512A`、`LQ32256A/AL`、`LQ32K01S2A`、`LQ32K02S2A` ordering 样例与 `LQ32K01B` 32Gb 样例。
  - `IS43/IS46DR`、`LR`、`LD`、`SM/RM/VM` 等：按 Part Decoder 通用 token 输出 DDR2、LPDDR、LPDDR2 和 mobile SDR 基础字段。

## PN 结构

Standard DRAM：

```text
IS43/IS46 + family(TR/QR) + organization token + revision + optional L
```

Part Decoder 通用结构：

```text
IS + product family(41/42/43/45/46) + voltage family + bus width + word count + optional S1/S2 + die revision + optional low-voltage L + optional -speed/CAS/package/solder/temp/packing
```

LPDDR4/4X：

```text
IS43/IS46 + LQ + product token
```

## 输出约定

- `IS43` / `IS46` 只作为商业 / 汽车级前缀差异处理，输出厂商统一为短名 `ISSI`。
- DDR3L 通过结尾 `L` 输出 `1.35V or 1.5V VDD`；DDR4 输出 `1.2V VDD`。
- DDR3 ordering 截图明确封装尺寸时，`package` 输出完整封装信息：4Gb `B/BL` x16 为 `96-ball BGA (9mm x 13mm)`，4Gb `DL` x16 为 `96-ball BGA (7.5mm x 13mm)`，1Gb / 4Gb x8 为 `78-ball BGA (8mm x 10.5mm)`，8Gb `B/BL` x16 / x8 分别为 `96-ball BGA (10mm x 14mm)` / `78-ball BGA (10mm x 14mm)`，8Gb `S2DL` dual-rank x16 为 `96-ball BGA (9mm x 13mm)`；DDR4 `QR16256B` / `QR85120B` 输出资料确认的 FBGA 封装。
- 通用 decoder 规则会按图中的 word count 与 bus width 计算 `dram_density`，例如 `8 + 1280` 输出 128M x8 = 1Gb。
- `speed`、`CAS latency`、`solder type`、`operation_temperature` 来自 `-` 后缀；speed 输出直接频率，DDR 类 token 额外标注等效 DDR 速率，例如 `933MHz (DDR-1866)`；`B2` 等 package 后缀只有在 ordering 表确认封装含义时影响 `package`，原始 package / packing code 不输出为公开字段。
- 官方表标注 rank 的 `S1` / `S2` token 只标准化为 `cs_count=1` / `cs_count=2`；rank 不等同于 die，未确认物理 die 数时不输出 `dram_die_stack`。
- LPDDR4X 通过产品 token 的 `L` 输出 `LPDDR4X` 与 `1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ`。
- `LQ32K01B` 同一 ordering 结构可初始化为 LPDDR4 或 LPDDR4X，规则输出 `dram_type=LPDDR4`，并用 `dram_generation=LPDDR4/LPDDR4X` 标注可选 I/O 形态。
- `packages/core/resources/dram-pn.json` 展开收录官方表中可确认的 `IS43` / `IS46` PN 样例与 ordering part number，用于搜索补全；解码仍由 token 规则完成。
