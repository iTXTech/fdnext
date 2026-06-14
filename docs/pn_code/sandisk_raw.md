# SanDisk Raw NAND PN 编码

## 资料边界

- 本规则基于 SanDisk NAND Flash Part Numbering Decoder 截图中的 Current ECB 与 Current WCB/WCS Part Number System。
- ECB 作为企业级 raw NAND，WCS/WCB 作为消费级 raw NAND；已有旧 SanDisk raw NAND 编码继续由 legacy DecodePack 规则处理。
- 截图中 WCS package `U` 同时指向 BGA132 / BGA304 信息，公开结果按 `BGA132/BGA304` 输出，避免误判单一 ball count。

## Current ECB

结构：

```text
SD [package] [die generation] [die type] [die stack] [package material] [package channel] - [density] - E [customization] [D_IN] [customization]
```

确认 token：

- package: `T=TSOP`、`Q=BGA-132`、`X=BGA-132 w/ MUX`、`U=BGA-154`、`Z=BGA-154 w/ MUX`、`Y=BGA-170`、`R=BGA-304`、`S=BGA-272`
- die generation: `Q=19nm`、`R=A19nm`、`S=15nm`、`A=BiCS2`、`B=BiCS3`、`C=BiCS4`、`D=BiCS5`、`E=BiCS6`、`F=BiCS8`
- die type: `F/G/H=MLC 1/2/4-plane`、`C/I/K=TLC 1/2/4-plane`、`J/L=QLC 2/4-plane`
- die stack: `A=SDP`、`B=DDP`、`C=QDP`、`D=ODP`、`E=HDP`、`F=12DP`
- package material: `M=Pb-free (others)`、`P=Pb-free (SAC 105)`、`R=Pb-free (100% tin)`
- package channel: `A=1`、`B=2`、`C=4`
- density: `016G` through `8T00` as package density in GB/TB
- product class: fixed `E=Enterprise`
- `D_IN`: `0=Matched`、`9=Unmatched`

公开输出使用 `density`、`die_codename`、`cell_level`、`plane_count`、`die_count`、`package_configuration`、`channel_count`、`assembly`、`lead_free`、`product_class`。customization token 不输出；`D_IN=9` 仅作为异常特殊选项输出。

## Current WCB/WCS

结构：

```text
SD [package] N [die generation] [die type] [die stack / ODT] [package material] [configuration] - [density] [mode] [feature] [die maturity]
```

确认 token：

- package: `T=48-pin TSOP`、`X/Y=BGA132 12x18`、`U=BGA132/BGA304`、`Z=BGA132 13x18`、`W=BGA132 13x18x1.40`、`R=BGA304 14x18x1.40`
- die generation: `Q=19nm`、`R=A19nm`、`S=15nm`、`A=BiCS2`、`B=BiCS3`、`C=BiCS4`、`D=BiCS4.5`、`E=BiCS5`
- die type: same as ECB
- die stack / ODT: `A/0=SDP`、`B/1=DDP`、`C/2=QDP`、`D/3=ODP`、`E=HDP`
- package material: `M=Pb-free (100% tin)`、`P=Pb-free (SAC 105)`、`R=Pb-free (others)`；`1/2` 暂不输出
- configuration: `A=1CE/1R-B`、`B=2CE/1R-B`、`C=4CE/1R-B`、`G=2CE/2R-B`、`H=4CE/2R-B`、`I=8CE/2R-B`、`M=4CE/4R-B`
- density: `008G` through `4T00`，兼容已有 FDB 中常见的 `GB`、省略前导零和 `1TB` 写法
- mode: `U=Toggle Mode DDR1.0/DDR2.0`、`K=Legacy wake, toggle-switchable mode with tR timing`
- feature: `L=Standard Endurance`、`F=High Endurance`、`C=Standard Commercial`、`I=Industrial`、`W=Industrial Wide Temp`
- die maturity: `D=1st Generation`、`E=2nd Generation`、`R=Retail`

WCS/WCB 公开输出 `product_class=Consumer`。configuration 输出为 `ce_count` 与 `rb_count`，不混用为 `channel_count`。mode、feature、die maturity 分别落到 `product_mode`、`special_option`、`prod_status`。

## Legacy 兼容

旧 SanDisk raw NAND 仍保留 legacy 规则，例如 `SDZNNMDHER-032G` 这类 `SD [package] N ...` 但 die generation 不在 current WCS 表内的 PN，不会被 current WCS 规则抢占。legacy 规则继续只输出可确认字段，例如 `package`、`cell_level`、`die_count`、`segment`，其余字段可由 FDB 关系补充。
