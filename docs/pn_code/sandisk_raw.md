# SanDisk 裸 NAND PN 编码

## 资料边界

- 本规则基于 SanDisk NAND Flash Part Numbering Decoder 截图中的当前版 ECB 与 Current WCB/WCS Part Number System。
- ECB 作为企业级裸 NAND，WCS/WCB 作为消费级裸 NAND；已有旧 SanDisk 裸 NAND 编码继续由旧版 DecodePack 规则处理。
- 截图中 WCS 封装 `U` 同时指向 BGA132 / BGA304 信息，公开结果按 `BGA132/BGA304` 输出，避免误判单一球数。

## 当前版 ECB

结构：

```text
SD [package] [die generation] [die type] [die stack] [package material] [package channel] - [density] - E [customization] [D_IN] [customization]
```

确认编码段：

- 封装: `T=TSOP`、`Q=BGA-132`、`X=BGA-132 w/ MUX`、`U=BGA-154`、`Z=BGA-154 w/ MUX`、`Y=BGA-170`、`R=BGA-304`、`S=BGA-272`
- die 代际: `Q=19nm`、`R=A19nm`、`S=15nm`、`A=BiCS2`、`B=BiCS3`、`C=BiCS4`、`D=BiCS5`、`E=BiCS6`、`F=BiCS8`
- die 类型: `F/G/H=MLC 1/2/4-plane`、`C/I/K=TLC 1/2/4-plane`、`J/L=QLC 2/4-plane`
- die 堆叠: `A=SDP`、`B=DDP`、`C=QDP`、`D=ODP`、`E=HDP`、`F=12DP`
- 封装材料: `M=Pb-free (others)`、`P=Pb-free (SAC 105)`、`R=Pb-free (100% tin)`
- 封装通道: `A=1`、`B=2`、`C=4`
- 容量: `016G` 至 `8T00`，以 GB/TB 表示封装总容量
- 产品类别: 固定为 `E=Enterprise`
- `D_IN`: `0=Matched`、`9=Unmatched`

公开输出使用 `density`、`die_codename`、`cell_level`、`plane_count`、`die_count`、`package_configuration`、`channel_count`、`assembly`、`lead_free`、`product_class`。定制编码段不输出；`D_IN=9` 仅作为异常特殊选项输出。

## 当前版 WCB/WCS

结构：

```text
SD [package] N [die generation] [die type] [die stack / ODT] [package material] [configuration] - [density] [mode] [feature] [die maturity]
```

确认编码段：

- 封装: `T=48-pin TSOP`、`X/Y=BGA132 12x18`、`U=BGA132/BGA304`、`Z=BGA132 13x18`、`W=BGA132 13x18x1.40`、`R=BGA304 14x18x1.40`
- die 代际: `Q=19nm`、`R=A19nm`、`S=15nm`、`A=BiCS2`、`B=BiCS3`、`C=BiCS4`、`D=BiCS4.5`、`E=BiCS5`
- die 类型: 同 ECB
- die 堆叠 / ODT: `A/0=SDP`、`B/1=DDP`、`C/2=QDP`、`D/3=ODP`、`E=HDP`
- 封装材料: `M=Pb-free (100% tin)`、`P=Pb-free (SAC 105)`、`R=Pb-free (others)`；`1/2` 暂不输出
- 配置: `A=1CE/1R-B`、`B=2CE/1R-B`、`C=4CE/1R-B`、`G=2CE/2R-B`、`H=4CE/2R-B`、`I=8CE/2R-B`、`M=4CE/4R-B`
- 容量: `008G` 至 `4T00`，兼容已有 FDB 中常见的 `GB`、省略前导零和 `1TB` 写法
- 模式: `U=Toggle Mode DDR1.0/DDR2.0`、`K=Legacy wake, toggle-switchable mode with tR timing`
- 特性: `L=Standard Endurance`、`F=High Endurance`、`C=Standard Commercial`、`I=Industrial`、`W=Industrial Wide Temp`
- die 成熟度: `D=Gen1`、`E=Gen2`、`R=Retail`

WCS/WCB 公开输出 `product_class=Consumer`。配置输出为 `ce_count` 与 `rb_count`，不混用为 `channel_count`。模式、特性、die 成熟度分别落到 `product_mode`、`special_option`、`prod_status`。

## 旧版兼容

旧 SanDisk 裸 NAND 仍保留旧版规则，例如 `SDZNNMDHER-032G` 这类 `SD [package] N ...` 但 die 代际不在当前版 WCS 表内的 PN，不会被当前版 WCS 规则抢占。旧版规则继续只输出可确认字段，例如 `package`、`cell_level`、`die_count`、`segment`，其余字段可由 FDB 关系补充。
