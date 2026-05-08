# Nanya DRAM PN 规则

采集日期：2026-05-08

本页记录 Nanya standalone DRAM 颗粒的 PN 结构。Nanya 规则按 family、organization、stack、package、suffix token 解析，不维护完整 PN 枚举。

## 外部资料

- Nanya 产品总览列出 Standard DRAM 覆盖 DDR2、DDR3、DDR4、DDR5；Low Power DRAM 覆盖 LPDDR2、LPDDR3、LPDDR4/4X、LPDDR5/5X。来源：<https://www.nanya.com/en/Product/>
- Nanya 官方 `NT5AD1024M8C3-JR/JRT/HRI` 页面确认 DDR4、8Gb、x8、78-ball BGA，速度 2666/3200Mbps 与温度等级。来源：<https://www.nanya.com/en/Product/4464/NT5AD1024M8C3-JR>、<https://www.nanya.com/en/Product/4477/NT5AD1024M8C3-HRI>
- Nanya 官方 `NT5FF1024M16A4-Q5` 页面确认 DDR5、16Gb、x16、106-ball BGA、5600Mbps。来源：<https://www.nanya.com/en/Product/9032/NT5FF1024M16A4-Q5>
- Nanya 官方 `NT5TU32M16FG-ACI` 页面确认 DDR2、512Mb、x16、84-ball BGA、800Mbps、工业温度。来源：<https://www.nanya.com/en/Product/3873/NT5TU32M16FG-ACI>
- Nanya 官方 `NT5CB128M16JR-DI` 页面确认 DDR3、2Gb、x16、96-ball BGA、1600Mbps、0C~95C。来源：<https://www.nanya.com/en/Product/4111/NT5CB128M16JR-DI>
- Nanya 官方 `NT5CC128M16JR-DI` 页面确认 DDR3L、2Gb、x16、96-ball BGA、1600Mbps、0C~95C；规则输出仍使用标准化 `DDR3 SDRAM`，电压区分为 1.35V。来源：<https://www.nanya.com/cn/Product/4114/NT5CC128M16JR-DI>
- Nanya 官方 `NT6TL128M32BA-G0` 页面确认 LPDDR2、4Gb、x32、134-ball BGA、1066Mbps、-25C~85C；`NT6TL128M32BA-G0I/G0H` 分别确认 Industrial / Automotive grade token。来源：<https://www.nanya.com/en/Product/4069/NT6TL128M32BA-G0>、<https://www.nanya.com/en/Product/4072/NT6TL128M32BA-G0I>、<https://www.nanya.com/en/Product/4074/NT6TL128M32BA-G0H>
- Nanya 官方 `NT6CL256M32AM-H0` 页面确认 LPDDR3、8Gb、x32、178-ball BGA、2133Mbps、-30C~105C。来源：<https://www.nanya.com/en/Product/4324/NT6CL256M32AM-H0>
- Nanya 官方 `NT6AN512T32AV-J1` / `NT6AP512T32AV-J1` 页面确认 LPDDR4 / LPDDR4X、16Gb、x32、200-ball BGA、4267Mbps。来源：<https://www.nanya.com/en/Product/4330/NT6AN512T32AV-J1>、<https://www.nanya.com/en/Product/4588/NT6AP512T32AV-J1>
- Nanya 官方 `NT6BR1024M16A3-K2` 页面确认 LPDDR5/5X 类别、16Gb、x16、315-ball BGA、7500Mbps；`NT6BR1024M16A3-K1` 确认 8533Mbps 与 LPDDR5X speed bin。来源：<https://www.nanya.com/en/Product/10086/NT6BR1024M16A3-K2>、<https://www.nanya.com/en/Product/10082/NT6BR1024M16A3-K1>

## DSL 范围

- 规则文件：`packages/dsl/src/rules/packs/nanya-dram-token.json`
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
```

## 输出约定

- `depth x width` 直接推导顶层 `density`，例如 `1024M8` 输出 `8192` Mbit。
- `M/T/F` stack code 分别输出 `Single die, 1 CS`、`DDP (2-die), 1 CS`、`QDP (4-die), 2 CS`。
- suffix 不存在时不输出 `dram_speed` / `operation_temperature`；suffix 存在但 grade token 不存在时只输出 speed。
- 低功耗 speed token 以 `family + speed` 做组合 key，避免 LPDDR4 与 LPDDR4X 共用 `J1` 时混淆。
