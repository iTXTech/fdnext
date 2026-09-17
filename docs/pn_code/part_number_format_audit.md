# PN 分隔符审计与展示约定落地

审计日期：2026-09-17。先完成以下基线审计，再实施展示优化。

## 审计范围与基线

- 静态检查全部 210 条 PN 规则，覆盖 normalization、match、token steps、草稿身份与投影。53 条规则移除分隔符；91 条包含显式分隔符消费步骤。
- 动态枚举 managed-nand-pn、dram-pn、有效 Micron / SpecTek MDB 和 FDB 厂商 PN，按厂商与原 PN 去重：32 个资源厂商、25,659 个组合，其中 19,022 个含 `-` 或 `:`。资源厂商数包含只有 FDB 记录而没有专用解码规则的厂商。
- 每个组合比较原输入和省略分隔符输入的直接规则、字段、默认引擎结果与精确搜索结果；MDB 排除 DO NOT USE 并拆分多值。
- 发现 573 个资源 PN 在规则解码后丢失已有分隔符，且解码身份与搜索展示不一致。没有将无资源命中或零样本规则记为已通过动态验证。

| 厂商 | 去重 PN | 含分隔符 | 解码丢失分隔符 |
| --- | ---: | ---: | ---: |
| biwin | 90 | 46 | 46 |
| issi | 434 | 326 | 0 |
| kingston | 35 | 34 | 34 |
| kioxia | 676 | 9 | 0 |
| longsys | 66 | 66 | 60 |
| micron | 16047 | 15465 | 0 |
| samsung | 872 | 483 | 112 |
| skhynix | 741 | 164 | 19 |
| sndk | 807 | 772 | 0 |
| spectek | 2956 | 21 | 0 |
| siliconmotion | 64 | 64 | 64 |
| ymtc | 88 | 0 | 0 |
| esmt | 271 | 242 | 238 |
| nanya | 492 | 492 | 0 |
| elpida | 7 | 7 | 0 |
| cxmt | 62 | 62 | 0 |
| winbond | 801 | 483 | 0 |
| etron | 314 | 225 | 0 |
| gigadevice | 54 | 54 | 0 |
| ato | 5 | 0 | 0 |
| fidelix | 10 | 0 | 0 |
| infineon | 4 | 0 | 0 |
| intel | 228 | 0 | 0 |
| memoright | 2 | 0 | 0 |
| mxic | 15 | 2 | 0 |
| pfc | 5 | 3 | 0 |
| phison | 381 | 0 | 0 |
| powerchip | 15 | 2 | 0 |
| renesas | 3 | 0 | 0 |
| smic | 2 | 0 | 0 |
| spansion | 15 | 0 | 0 |
| st | 97 | 0 | 0 |

## 审计结论与实施范围

1. 全局 normalizePartNumber 保留常规连字符；部分规则为容错删除连字符，并把解析串直接赋给 device.partNumber，造成已有连字符丢失。匹配串和展示串必须独立。
2. Samsung KLU / MCP、SK hynix MCP，以及 ESMT、BIWIN、Kingston、Longsys、Silicon Motion 的受影响规则已有主体/后缀编码段，可在现有解析位置声明展示分隔符。不得用完整 PN 白名单或全厂商统一位数恢复。
3. Samsung KLM / K9、SK hynix H27 等规则已消费可选连字符，字段解析成功后仍直接输出输入；补充相同的展示边界能力。
4. Micron、Samsung DRAM、Nanya、CXMT 等部分省略分隔符输入依靠精确目录别名恢复。保留已有目录能力，不把格式优化扩展为所有产品线的新语法。标记边界前必须确认主体解析成功；未知尾部保留全部字符。
5. 解码、投影、explain、搜索项、候选身份和后续操作应共用规则生成的展示 PN；匹配键继续保留原有 token 等价关系和部分搜索分隔符语义。
6. H25 -X 形式已有显式全局别名政策：规范 PN 为无分隔 X 封装形式。Micron Japan 规则已有订购 PN 重构并移除分销商 TR 包装别名；不得被通用保留机制覆盖。
7. 没有已确认分隔边界的规则只保留用户给出的分隔符，不从字符串长度猜测，也不改变原本连续书写的 HN8 / H26 / YMTC 标签等型号。

### 既有解析差异

默认引擎带分隔符与省略分隔符的字段差异共 6 个，全部为 Micron MTFC：`MTFC32GHKSDN-WT`、`MTFC1GBB1DG-WT ES`、`MTFC32GBALAEAM-WT`、`MTFC256GBAOANAM-WT`、`MTFC256GBAOANAM-WT ES`、`MTFC128GAOANAMF1-WT`。原始写法仅命中厂商前缀，紧凑写法却可能被另一结构规则接受。这是既有规则识别/候选排序差异，不能靠插入横线宣称修复；本轮不扩展这些结构的规格映射。

## 全规则清单（实施前）

“移除”表示规则 normalization 删除 `-` / `:`；“消费”表示已有 stripIfPrefix 步骤；“保留”表示不删除这两种分隔符。样本数是所有资源中实际优先命中该规则的数目，不代表规则只支持这些 PN。

| 规则 ID | 解析处理 | 命中资源 | 含分隔符 | 丢失 |
| --- | --- | ---: | ---: | ---: |
| `vendor.micron.xpoint.mtx.v1` | 消费 | 30 | 30 | 0 |
| `vendor.micron.managed.mtfc.extended-package.v1` | 消费 | 9 | 9 | 0 |
| `vendor.micron.managed.mtfc.nextgen.v1` | 消费 | 525 | 525 | 0 |
| `vendor.micron.ssd.modern.v1` | 消费 | 26 | 26 | 0 |
| `vendor.micron.ssd.p420m.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.420-5xx.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.3xx-4xx.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.ek470.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.5400.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.6500-ion.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.datacenter-gen4-gen5.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.4100at.v1` | 消费 | 10 | 10 | 0 |
| `vendor.micron.ssd.4150at.v1` | 消费 | 18 | 18 | 0 |
| `vendor.micron.ssd.client-gen4.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.4600.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.9400.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.ssd.generic.v1` | 保留 | 3 | 3 | 0 |
| `vendor.micron.emmc.mtfc.legacy.v1` | 消费 | 411 | 411 | 0 |
| `vendor.micron.emmc.n2m400.v1` | 保留 | 8 | 0 | 0 |
| `vendor.micron.umcp.mt29v_mt30a.v1` | 消费 | 314 | 314 | 0 |
| `vendor.micron.emcp.nand_mcp.v1` | 消费 | 46 | 46 | 0 |
| `vendor.micron.emcp.aio.v1` | 消费 | 267 | 267 | 0 |
| `vendor.micron.emcp.mt29d.v1` | 消费 | 39 | 39 | 0 |
| `vendor.micron.emcp.mt29c.v1` | 消费 | 708 | 708 | 0 |
| `vendor.micron.emcp.mt29rz.v1` | 消费 | 0 | 0 | 0 |
| `vendor.micron.dram.amd-alias.v1` | 消费 | 9 | 9 | 0 |
| `vendor.micron.dram.component.v1` | 消费 | 9806 | 9772 | 0 |
| `vendor.micron.dram.crucial_component.v1` | 保留 | 4 | 4 | 0 |
| `vendor.micron.dram.japan.component.v1` | 消费 | 6 | 6 | 0 |
| `vendor.micron.hbm2e.mt54.v1` | 保留 | 17 | 17 | 0 |
| `vendor.micron.hbm3e.mt65.v1` | 保留 | 3 | 3 | 0 |
| `vendor.micron.hmc.mt43a.v1` | 消费 | 38 | 38 | 0 |
| `vendor.micron.raw.current.v1` | 消费 | 2985 | 2560 | 0 |
| `vendor.micron.raw.legacy.v1` | 消费 | 143 | 131 | 0 |
| `vendor.micron.clearnand.v1` | 消费 | 21 | 16 | 0 |
| `vendor.micron.hsc.mt29fb.v1` | 消费 | 38 | 38 | 0 |
| `vendor.intel.token.v1` | 保留 | 223 | 0 | 0 |
| `vendor.intel.i29.prefix.v1` | 保留 | 1 | 0 | 0 |
| `vendor.samsung.ufs.token.v1` | 移除 | 41 | 40 | 40 |
| `vendor.samsung.emmc.token.v1` | 消费 | 21 | 21 | 0 |
| `vendor.samsung.emcp.legacy-class100.v1` | 移除 | 6 | 6 | 6 |
| `vendor.samsung.mcp.token.v1` | 移除 | 66 | 66 | 66 |
| `vendor.samsung.hbm2.kha.v1` | 保留 | 16 | 16 | 0 |
| `vendor.samsung.hbm2e.khaa.v1` | 保留 | 0 | 0 | 0 |
| `vendor.samsung.hbm3.khba.v1` | 保留 | 4 | 4 | 0 |
| `vendor.samsung.hbm3e.khbb.v1` | 保留 | 2 | 2 | 0 |
| `vendor.samsung.dram.ddr3.component.v1` | 消费 | 70 | 70 | 0 |
| `vendor.samsung.dram.legacy_standard.component.v1` | 消费 | 3 | 3 | 0 |
| `vendor.samsung.dram.standard.component.v1` | 消费 | 80 | 80 | 0 |
| `vendor.samsung.dram.ddr5.component.v1` | 消费 | 4 | 4 | 0 |
| `vendor.samsung.dram.lpddr1.component.v1` | 消费 | 2 | 1 | 0 |
| `vendor.samsung.dram.lpddr4_ordering.component.v1` | 消费 | 55 | 55 | 0 |
| `vendor.samsung.dram.lpddr.component.v1` | 消费 | 70 | 70 | 0 |
| `vendor.samsung.dram.legacy_gddr.component.v1` | 消费 | 27 | 19 | 0 |
| `vendor.samsung.dram.gddr.component.v1` | 消费 | 10 | 10 | 0 |
| `vendor.samsung.token.v1` | 消费 | 391 | 16 | 0 |
| `vendor.nanya.dram.standard.component.v1` | 消费 | 298 | 298 | 0 |
| `vendor.nanya.dram.low_power.component.v1` | 消费 | 194 | 194 | 0 |
| `vendor.elpida.dram.sdr_ddr.component.v1` | 消费 | 2 | 2 | 0 |
| `vendor.elpida.dram.ddr2_ddr3.component.v1` | 消费 | 2 | 2 | 0 |
| `vendor.elpida.dram.lpddr2_lpddr3.component.v1` | 消费 | 61 | 61 | 0 |
| `vendor.elpida.dram.gddr5.component.v1` | 消费 | 1 | 1 | 0 |
| `vendor.elpida.dram.daisy_chain_mobile.v1` | 消费 | 2 | 2 | 0 |
| `vendor.cxmt.dram.ddr4.component.v1` | 消费 | 15 | 15 | 0 |
| `vendor.cxmt.dram.ddr5.component.v1` | 消费 | 6 | 6 | 0 |
| `vendor.cxmt.dram.lpddr4x.component.v1` | 消费 | 38 | 38 | 0 |
| `vendor.cxmt.dram.lpddr5.component.v1` | 保留 | 3 | 3 | 0 |
| `vendor.cxmt.dram.lpddr5.cdtq-process-alias.v1` | 保留 | 0 | 0 | 0 |
| `vendor.gigadevice.dram.ddr3l.component.v1` | 消费 | 14 | 14 | 0 |
| `vendor.gigadevice.dram.ddr4.component.v1` | 消费 | 25 | 25 | 0 |
| `vendor.gigadevice.dram.lpddr4x.component.v1` | 消费 | 15 | 15 | 0 |
| `vendor.issi.dram.standard.component.v1` | 消费 | 256 | 200 | 0 |
| `vendor.issi.dram.lpddr4.component.v1` | 消费 | 100 | 48 | 0 |
| `vendor.issi.dram.decoder.component.v1` | 消费 | 53 | 53 | 0 |
| `vendor.issi.emmc.token.v1` | 消费 | 7 | 7 | 0 |
| `vendor.issi.ufs.token.v1` | 消费 | 18 | 18 | 0 |
| `vendor.issi.raw.parallel-slc.v1` | 消费 | 0 | 0 | 0 |
| `vendor.winbond.dram.sdr.component.v1` | 保留 | 49 | 45 | 0 |
| `vendor.winbond.dram.ddr.component.v1` | 保留 | 11 | 9 | 0 |
| `vendor.winbond.dram.lpddr.component.v1` | 保留 | 28 | 0 | 0 |
| `vendor.winbond.dram.ddr2.component.v1` | 保留 | 46 | 39 | 0 |
| `vendor.winbond.dram.lpddr2.component.v1` | 保留 | 33 | 0 | 0 |
| `vendor.winbond.dram.ddr3.component.v1` | 保留 | 366 | 364 | 0 |
| `vendor.winbond.dram.lpddr3.component.v1` | 保留 | 18 | 0 | 0 |
| `vendor.winbond.dram.ddr4.component.v1` | 保留 | 28 | 26 | 0 |
| `vendor.winbond.dram.lpddr4.component.v1` | 保留 | 220 | 0 | 0 |
| `vendor.winbond.raw.w29n.v1` | 移除 | 2 | 0 | 0 |
| `vendor.winbond.raw.w25n.v1` | 移除 | 0 | 0 | 0 |
| `vendor.winbond.raw.w35n.v1` | 保留 | 0 | 0 | 0 |
| `vendor.macronix.raw.mx30_mx60.v1` | 保留 | 14 | 2 | 0 |
| `vendor.esmt.dram.component.v1` | 移除 | 267 | 238 | 238 |
| `vendor.esmt.emmc.fc51.v1` | 保留 | 4 | 4 | 0 |
| `vendor.esmt.raw.f59.v1` | 保留 | 0 | 0 | 0 |
| `vendor.etron.dram.sdr.component.v1` | 保留 | 11 | 0 | 0 |
| `vendor.etron.dram.ddr.component.v1` | 保留 | 49 | 32 | 0 |
| `vendor.etron.dram.ddr2.component.v1` | 保留 | 31 | 21 | 0 |
| `vendor.etron.dram.ddr3.component.v1` | 保留 | 152 | 116 | 0 |
| `vendor.etron.dram.ddr4.component.v1` | 保留 | 27 | 12 | 0 |
| `vendor.etron.dram.lpddr2.component.v1` | 保留 | 3 | 3 | 0 |
| `vendor.etron.dram.lpddr4.component.v1` | 保留 | 41 | 41 | 0 |
| `vendor.skhynix.dram.ddr3_ddr4.component.v1` | 消费 | 62 | 61 | 0 |
| `vendor.skhynix.dram.ddr5.component.v1` | 消费 | 35 | 4 | 0 |
| `vendor.skhynix.dram.gddr5.component.v1` | 消费 | 1 | 1 | 0 |
| `vendor.skhynix.dram.lpddr3.component.v1` | 消费 | 2 | 2 | 0 |
| `vendor.skhynix.dram.lpddr4.component.v1` | 消费 | 47 | 47 | 0 |
| `vendor.skhynix.dram.lpddr4.pop.v1` | 消费 | 2 | 2 | 0 |
| `vendor.skhynix.dram.legacy_sdr.component.v1` | 消费 | 1 | 1 | 0 |
| `vendor.skhynix.dram.legacy_ddr.component.v1` | 消费 | 2 | 2 | 0 |
| `vendor.skhynix.dram.lpddr5.h9jk.v1` | 消费 | 3 | 3 | 0 |
| `vendor.skhynix.dram.lpddr5.component.v1` | 消费 | 3 | 3 | 0 |
| `vendor.skhynix.dram.lpddr5.h58.v1` | 保留 | 18 | 0 | 0 |
| `vendor.skhynix.dram.lpddr5x.component.v1` | 保留 | 59 | 0 | 0 |
| `vendor.skhynix.dram.gddr6.component.v1` | 消费 | 1 | 1 | 0 |
| `vendor.skhynix.dram.gddr6.16gb.component.v1` | 保留 | 4 | 0 | 0 |
| `vendor.skhynix.dram.gddr6.8gb.component.v1` | 保留 | 2 | 0 | 0 |
| `vendor.skhynix.dram.gddr7.component.v1` | 保留 | 3 | 0 | 0 |
| `vendor.skhynix.hbm3.h5u.v1` | 保留 | 2 | 0 | 0 |
| `vendor.skhynix.hbm2e.h5wr.v1` | 保留 | 4 | 4 | 0 |
| `vendor.skhynix.dram.lpddr4x.h54.v1` | 保留 | 35 | 0 | 0 |
| `vendor.skhynix.dram.lpddr4x.h9hk-modern.v1` | 保留 | 5 | 5 | 0 |
| `vendor.skhynix.dram.lpddr4x.h9hc-432ball.v1` | 保留 | 4 | 4 | 0 |
| `vendor.skhynix.dram.ddr4-32gb.h5anbg.v1` | 保留 | 2 | 2 | 0 |
| `vendor.skhynix.h25.gt-package.v2` | 移除 | 59 | 0 | 0 |
| `vendor.skhynix.h25.raw.v2` | 消费 | 32 | 0 | 0 |
| `vendor.skhynix.legacy.token.v1` | 保留 | 69 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.automotive-ufs31.v1` | 移除 | 9 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.uc310-v6.v1` | 移除 | 6 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.mobile-ufs31.v1` | 移除 | 8 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.ufs22-v7.v1` | 移除 | 6 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.ufs22-v6.v1` | 移除 | 7 | 0 | 0 |
| `vendor.skhynix.ufs.hn8.zufs41.v1` | 移除 | 2 | 0 | 0 |
| `vendor.skhynix.ufs.h28u.v1` | 移除 | 5 | 0 | 0 |
| `vendor.skhynix.ufs.h28s.v1` | 移除 | 5 | 0 | 0 |
| `vendor.skhynix.emmc.managed.v1` | 保留 | 32 | 0 | 0 |
| `vendor.skhynix.emcp.h9hp-lpddr4x.v1` | 移除 | 8 | 8 | 8 |
| `vendor.skhynix.emcp.h9t_h9h.v1` | 移除 | 4 | 4 | 4 |
| `vendor.skhynix.emcp.h9a.v1` | 移除 | 4 | 0 | 0 |
| `vendor.skhynix.umcp.h9q.v1` | 移除 | 1 | 0 | 0 |
| `vendor.skhynix.umcp.h9hq.v1` | 移除 | 7 | 7 | 7 |
| `vendor.skhynix.umcp.h9hr-lpddr5.v1` | 消费 | 3 | 3 | 0 |
| `vendor.skhynix.e2nand.h2d_h2j.v1` | 消费 | 26 | 0 | 0 |
| `vendor.skhynix.e3nand.h23q.v1` | 移除 | 6 | 0 | 0 |
| `vendor.skhynix.h27.raw.v2` | 消费 | 140 | 0 | 0 |
| `vendor.kioxia.managed.thg.v1` | 保留 | 82 | 0 | 0 |
| `vendor.kioxia.ufs.managed.v1` | 保留 | 21 | 0 | 0 |
| `vendor.kioxia.raw.tc-th.v1` | 保留 | 574 | 7 | 0 |
| `vendor.sndk.inand.mcp.sd7dp26a.v1` | 消费 | 0 | 0 | 0 |
| `vendor.sndk.inand.managed.v1` | 消费 | 189 | 189 | 0 |
| `vendor.sndk.inand.legacy-emmc.v1` | 消费 | 3 | 3 | 0 |
| `vendor.sndk.issd.v1` | 消费 | 7 | 7 | 0 |
| `vendor.sndk.shortcode.v1` | 消费 | 22 | 22 | 0 |
| `vendor.sndk.marking.12digit.v1` | 保留 | 3 | 0 | 0 |
| `vendor.sndk.raw.ecb.current.v1` | 消费 | 0 | 0 | 0 |
| `vendor.sndk.raw.wcs.current.v1` | 消费 | 303 | 298 | 0 |
| `vendor.sndk.token.v1` | 消费 | 237 | 224 | 0 |
| `vendor.siliconmotion.ferri.emmc.v1` | 移除 | 32 | 32 | 32 |
| `vendor.siliconmotion.ferri.ufs.v1` | 移除 | 32 | 32 | 32 |
| `vendor.kingston.emmc.v1` | 移除 | 17 | 17 | 17 |
| `vendor.kingston.emmc.e04.v1` | 移除 | 1 | 0 | 0 |
| `vendor.kingston.ufs.v1` | 移除 | 5 | 5 | 5 |
| `vendor.kingston.emcp.v1` | 移除 | 8 | 8 | 8 |
| `vendor.kingston.epop.v1` | 移除 | 4 | 4 | 4 |
| `vendor.longsys.foresee.emmc.v1` | 移除 | 36 | 36 | 36 |
| `vendor.longsys.foresee.ufs.v1` | 移除 | 16 | 16 | 16 |
| `vendor.longsys.foresee.emcp.v1` | 移除 | 6 | 6 | 6 |
| `vendor.longsys.foresee.umcp.v1` | 移除 | 2 | 2 | 2 |
| `vendor.longsys.foresee.spi-nand.f35.v1` | 移除 | 0 | 0 | 0 |
| `vendor.longsys.foresee.spi-nand.fs35.v1` | 移除 | 0 | 0 | 0 |
| `vendor.longsys.dram.ddr3l.v1` | 消费 | 6 | 6 | 0 |
| `vendor.biwin.emmc.v1` | 移除 | 8 | 0 | 0 |
| `vendor.biwin.emmc.bwefm.v1` | 移除 | 21 | 0 | 0 |
| `vendor.biwin.emmc.bwcmaqb.v1` | 移除 | 2 | 0 | 0 |
| `vendor.biwin.ufs.v1` | 移除 | 4 | 0 | 0 |
| `vendor.biwin.ufs31.v1` | 移除 | 3 | 0 | 0 |
| `vendor.biwin.ufs31.automotive.v1` | 移除 | 0 | 0 | 0 |
| `vendor.biwin.emcp3.v1` | 移除 | 4 | 4 | 4 |
| `vendor.biwin.emcp.v1` | 移除 | 4 | 4 | 4 |
| `vendor.biwin.umcp.v1` | 移除 | 5 | 5 | 5 |
| `vendor.biwin.umcp5x.v1` | 移除 | 3 | 0 | 0 |
| `vendor.biwin.epop3.v1` | 移除 | 3 | 3 | 3 |
| `vendor.biwin.epop4x.v1` | 移除 | 4 | 4 | 4 |
| `vendor.biwin.epop5x.v1` | 移除 | 3 | 3 | 3 |
| `vendor.biwin.dram.lpddr4x.v1` | 移除 | 12 | 12 | 12 |
| `vendor.biwin.dram.lpddr5x.v1` | 移除 | 11 | 11 | 11 |
| `vendor.ymtc.process-alias.v1` | 保留 | 0 | 0 | 0 |
| `vendor.ymtc.nand-label.v2` | 移除 | 49 | 0 | 0 |
| `vendor.ymtc.unimos-label.v1` | 移除 | 1 | 0 | 0 |
| `vendor.ymtc.emmc-label.v1` | 移除 | 15 | 0 | 0 |
| `vendor.ymtc.ufs-label.v1` | 移除 | 19 | 0 | 0 |
| `vendor.phison.token.v1` | 保留 | 366 | 0 | 0 |
| `vendor.spectek.aio.emcp.v1` | 消费 | 1 | 0 | 0 |
| `vendor.spectek.flash-controller.v1` | 保留 | 1 | 1 | 0 |
| `vendor.spectek.nand-mcp.v1` | 消费 | 1 | 1 | 0 |
| `vendor.spectek.mobile-dram.component.v1` | 消费 | 194 | 3 | 0 |
| `vendor.spectek.dram.component.v1` | 消费 | 509 | 66 | 0 |
| `vendor.spectek.old-numbering.v1` | 保留 | 9 | 1 | 0 |
| `vendor.spectek.parent-density-token.v1` | 消费 | 1404 | 9 | 0 |
| `vendor.spectek.token.v1` | 消费 | 728 | 3 | 0 |
| `vendor.micron.prefix.mt` | 保留 | 402 | 314 | 0 |
| `vendor.samsung.prefix.k` | 保留 | 2 | 0 | 0 |
| `vendor.skhynix.prefix.hy` | 保留 | 5 | 0 | 0 |
| `vendor.skhynix.prefix.h` | 保留 | 4 | 0 | 0 |
| `vendor.kioxia.prefix.tc58` | 保留 | 0 | 0 | 0 |
| `vendor.kioxia.prefix.th58` | 保留 | 0 | 0 | 0 |
| `vendor.sandisk.prefix.sd` | 保留 | 0 | 0 | 0 |
| `vendor.sandisk.prefix.s34` | 保留 | 6 | 0 | 0 |
| `vendor.sandisk.prefix.s35` | 保留 | 0 | 0 | 0 |
| `vendor.intel.prefix.js` | 保留 | 0 | 0 | 0 |
| `vendor.intel.prefix.29f` | 保留 | 0 | 0 | 0 |
| `vendor.ymtc.prefix.xt` | 保留 | 0 | 0 | 0 |

## 实施与验证

实施完成日期：2026-09-18。

- 将匹配串与展示串分离，新增规则步骤 `markPartNumberSeparator`，在 30 条已有规则的解析边界声明分隔符。已输入的分隔符保留；省略分隔符且规则已确认边界时恢复规范写法；不完整输入不强行补齐后缀。
- 解码、投影、explain、目录候选、搜索结果以及 FID 关联 PN 和后续解码操作使用相同格式。修正 FDB 查询优先级：完整 PN 的 token 等价记录优先于较短主体记录，避免恢复连字符后误关联其他规格。
- 重跑全部 25,659 个资源组合：原来的 573 个分隔符丢失与展示不一致均降为 0。与基线相比，规则选择、解码状态、直接规则字段及公开规格块没有变化；原输入的公开 PN 更新 576 个，紧凑输入的公开 PN 更新 591 个。上文 6 个既有 MTFC 识别差异仍存在。
- 新增 8 项回归测试，覆盖已有产品线、资源样本、错误或缺失分隔符、未知尾部、多边界、条件标记、投影、搜索去重、FDB 优先级和 FID 关联。核心规则测试 250 项、集成测试 45 项、结果契约测试 1 项通过；PN 覆盖检查通过。
- fdbgen 37 项、fd-server 20 项、构建产物测试 17 项、5 个契约样例及源码/产物 DRAM 搜索专项通过；全仓类型检查、全部包构建和 DecodePack 静态检查通过。
- 同步升级至 pnpm 12.4.2 与最新直接依赖并刷新兼容范围内的间接依赖；`pnpm outdated --recursive --include-workspace-root --json` 返回空对象，离线冻结安装通过。初次组合检查受沙箱端口限制中断，允许本地监听后已分别完成相关测试；未将该次组合命令记录为成功。
