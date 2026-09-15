# ISSI DRAM PN 规则

采集日期：2026-05-11；更新日期：2026-07-11

本页记录 ISSI 独立 DRAM 颗粒的 PN 结构。本轮覆盖官方 PSG 与数据手册 / 订购编码表中可直接确认的 DDR2、DDR3/DDR3L、DDR4、LPDDR4/LPDDR4X，并按 ISSI DRAM Part Decoder 图扩展 `IS41/IS42/IS43/IS45/IS46` 通用结构。RLDRAM 不纳入当前扩展范围。

## 外部资料

- ISSI 2024 Product Selector Guide 列出 DRAM 料号解码器、DDR3/DDR3L、DDR4、LPDDR4/4X、RLDRAM 等产品表。来源：<https://issi.com.cn/WW/pdf/PSG.pdf>
- DDR4 表确认 `IS43/IS46QR85120B`、`QR16256B`、`QR81024A`、`QR16512A`、`QR8K02S2A` 的容量、组织、1.2V、速度与 BGA(78/96) 封装；`QR8K02S2A` 标注双 Rank。
- DDR3/DDR3L 表确认 `IS43/IS46TR*` 系列的容量、组织、电压、速度与 BGA(78/96) 封装；`TR16512S2DL`、`TR16K01S2AL` 等标注双 Rank。
- LPDDR4/4X 表确认 `IS43/IS46LQ*` 系列的 2Gb/4Gb/8Gb、单通道 `(1 x16)` 或两通道 `(2 x16)`、VDDQ/VDD2/VDD1、3200/3733 MT/s 与 BGA(200) 封装。
- ISSI DRAM Part Decoder 图给出 `41/42/43/45/46` 产品系列、`LV/S/VS/R/DR/TR/QR/SM/RM/VM/LR/LD/LQ` 电压/低功耗编码段、总线位宽、字数、die 修订版、速度、CAS、封装、焊料、温度与包装后缀结构。
- ISSI DDR2 订购编码表确认 `IS43DR16160B/32160C/16320E/16640C/81280C/16128C/82560C` 的容量组织和 BGA-60/84/126 封装；规则按 `DR + width + word count` 输出脚位，不再只给泛化 `BGA`。来源：<https://www.issi.com/WW/pdf/DDR2-DRAM.pdf>
- ISSI SDR 数据手册确认 `IS42S81600J` / `IS42S86400F` 仅有 TSOP-54 订购编码；`IS42S83200J` 同时有 TSOP-54 与 `-7BL/-7BLI` 的 TFBGA-54 8x8 订购编码。规则补入 `1600/3200/6400`字数编码段，并按后缀封装类型区分，不能把 x8 SDR 一律推成 BGA。来源：<https://www.issi.com/WW/pdf/42-45S81600J-16800J.pdf>、<https://www.issi.com/WW/pdf/42-45S83200J-16160J.pdf>、<https://www.issi.com/WW/pdf/42-45R-S_86400F-16320F.pdf>
- ISSI LPDDR 订购编码表确认 `IS43LR16640C/16800G/16320D` 的 `BL/BLI` 为 60 球 BGA；LPDDR2 订购编码表确认 `IS43LD16128C/32640C/16320A/32160A` 的 `BL/BLI` 为 FBGA-134。`S/LR/LD` 后缀不含独立 CAS 编码段，规则按系列范围先消费封装与焊料，避免把 `B/L` 错解为 CAS。来源：<https://www.issi.com/WW/pdf/43-46LR16640C-32320C.pdf>、<https://www.issi.com/WW/pdf/43-46LR16800G.pdf>、<https://www.issi.com/WW/pdf/43-46LD16128C-32640C.pdf>、<https://www.issi.com/WW/pdf/43-46LD16320A-32160A.pdf>
- 用户提供的 ISSI `IS43/46LQ32K01B` 数据手册 / 订购编码截图确认 32Gb `(x16 x 2 channel)` LPDDR4/LPDDR4X、`32K01` = `1Gb x32`、`B` = Gen2、`-046/-053` = 4266/3733Mbps、200 球 BGA、I/A1/A2/A3 温度档。
- 用户继续提供的 ISSI `IS43/46LQ16512B`、`IS43/46LQ32512A`、`IS43/46LQ32K01S2A`、`IS43/46LQ32K02S2A`、`IS43/46LQ32256A`、`IS43/46LQ32256AL` 数据手册 / 订购编码截图确认 8Gb / 16Gb / 32Gb / 64Gb LPDDR4/LPDDR4X 结构：`16512B` = 512Mb x16、`32512A` = 512Mb x32、`32K01S2A` = 1Gb x32 双 Rank、`32K02S2A` = 2Gb x32 双 Rank、`32256A/AL` = 256Mb x32；`-046/-053/-062` 分别对应 4266/3733/3200Mbps，`B/BH/TB` 封装后缀、`L` 环保封装、I/A1/A2/A3 温度档按订购编码表进入规则和 `dram-pn.json`。
- 用户提供的 ISSI DDR4 数据手册 / 订购编码截图确认 `IS43/46QR85120B`、`QR16256B`、`QR81024B`、`QR16512B` 的 4Gb / 8Gb DDR4 料号、`-083R/-075U` 与 `-083T/-075V/-062AA` 速度 / CL 编码段、78/96 球 FBGA/BGA 封装和 I/A1/A2/A3 温度档。
- 用户提供的 ISSI DDR3 / DDR3L 数据手册 / 订购编码截图确认 `IS43/46TR16256B(L)`、`TR85120B(L)`、`TR16512B(L)`、`TR81024B(L)` 这批 4Gb / 8Gb DDR3(L) 料号，以及既有 `TR16K01S2AL`、`TR16128D(L)`、`TR82560D(L)` 的 16Gb / 2Gb 料号；`-125K/-107M/-093N` 速度 / CL 编码段、78/96 球 BGA 封装和 I/A1/A2/A25/A3 温度档均由订购编码表确认。
- 用户继续提供的 ISSI DDR3 / DDR3L 订购编码截图确认 `TR16640C(L)` / `TR81280C(L)` 1Gb、`TR16256DL` / `TR85120DL` 4Gb、`TR16512S2DL` 双 Rank 8Gb；`125J` 对应 DDR3-1600J / CL10，`TR16640CL` 的 `B2` 封装后缀对应 96 球 BGA (7.5mm x 13mm)。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/issi-dram-token.json`
- 规则 ID：`vendor.issi.dram.standard.component.v1`、`vendor.issi.dram.lpddr4.component.v1`、`vendor.issi.dram.decoder.component.v1`
- 当前覆盖：
  - `IS41`：Asynchronous DRAM 解码器结构。
  - `IS42` / `IS45`：SDR 商业级/工业级与车规解码器结构。
  - `IS43/IS46TR`：DDR3 / DDR3L。
    - 本轮补充 `TR16256B(L)` / `TR85120B(L)` 4Gb、`TR16512B(L)` / `TR81024B(L)` 8Gb，以及 `C/CL`、`DL`、`S2DL` 变体订购 PN 到 `dram-pn.json`。
  - `IS43/IS46QR`：DDR4，含 4Gb / 8Gb / 16Gb 与订购编码后缀速度 / 温度样例。
  - `IS43/IS46LQ`：LPDDR4 / LPDDR4X，含 ECC 编码段、`LQ16512B`、`LQ32512A`、`LQ32256A/AL`、`LQ32K01S2A`、`LQ32K02S2A` 订购编码样例与 `LQ32K01B` 32Gb 样例。
  - `IS43/IS46DR`、`LR`、`LD`、`SM/RM/VM` 等：按料号解码器通用编码段输出 DDR2、LPDDR、LPDDR2 和移动版 SDR 基础字段。
    - DDR2 已补官方订购 PN 到 `dram-pn.json`，并按组织输出 BGA-60/84/126。
    - SDR 已补 x8 `1600/3200/6400` 订购编码与 TSOP-54 / TFBGA-54 封装分流。
    - LPDDR1 / LPDDR2 已补正式 `BL/BLI` 订购 PN，分别输出 60 球与 FBGA-134，不再产生伪 CAS 延迟。

## PN 结构

标准 DRAM：

```text
IS43/IS46 + family(TR/QR) + organization token + revision + optional L
```

料号解码器通用结构：

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
- DDR3 订购编码截图明确封装尺寸时，`package` 输出完整封装信息：4Gb `B/BL` x16 为 `96-ball BGA (9mm x 13mm)`，4Gb `DL` x16 为 `96-ball BGA (7.5mm x 13mm)`，1Gb / 4Gb x8 为 `78-ball BGA (8mm x 10.5mm)`，8Gb `B/BL` x16 / x8 分别为 `96-ball BGA (10mm x 14mm)` / `78-ball BGA (10mm x 14mm)`，8Gb `S2DL` 双 Rank x16 为 `96-ball BGA (9mm x 13mm)`；DDR4 `QR16256B` / `QR85120B` 输出资料确认的 FBGA 封装。
- 通用解码器规则会按图中的字数与总线位宽计算 `dram_density`，例如 `8 + 1280` 输出 128M x8 = 1Gb。
- `speed`、`CAS latency`、`solder type`、`operation_temperature` 来自 `-` 后缀；速度输出直接频率，DDR 类编码段额外标注等效 DDR 速率，例如 `933MHz (DDR-1866)`；`B2` 等封装后缀只有在订购编码表确认封装含义时影响 `package`，原始封装 / 包装编码不输出为公开字段。
- 官方表标注 rank 的 `S1` / `S2` 编码段只标准化为 `cs_count=1` / `cs_count=2`；rank 不等同于 die，未确认物理 die 数时不输出 `dram_die_count`。
- LPDDR4X 通过产品编码段的 `L` 输出 `LPDDR4X` 与 `1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ`。
- `LQ32K01B` 同一订购编码结构可初始化为 LPDDR4 或 LPDDR4X，规则输出 `dram_type=LPDDR4`，并用 `dram_generation=LPDDR4/LPDDR4X` 标注可选 I/O 形态。
- `packages/core/resources/dram-pn.json` 展开收录官方表中可确认的 `IS43` / `IS46` PN 样例与订购编码料号，用于搜索补全；解码仍由编码段规则完成。
