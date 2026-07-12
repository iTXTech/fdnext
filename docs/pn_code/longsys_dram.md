# Longsys / FORESEE DRAM PN 编码

采集日期：2026-07-12

## 外部资料

- FORESEE 官方 DDR3L 产品页给出 2Gb/4Gb、x16、FBGA96 7.5x13.5 mm、1866/2133Mbps、商业/宽温及六项 P/N 表。
  <https://www.longsys.com/products/embedded-storage/micro-storage/ddr3l.html>
- FORESEE 官方 LPDDR 页面只给容量、封装、速率与电压矩阵，没有公开逐容量 P/N，因此暂不建立 LPDDR decoder。
  <https://www.longsys.com/products/embedded-storage/embedded-storage/lpddr.html>

## 结构化规则

```text
F60C1A + density 0002/0004 + package M6/M7 + speed A/9/K + temperature R/W
```

- `0002/0004`：2Gb/4Gb。
- `M6/M7`：官方 P/N 表对应 FBGA96 7.5x13.5 mm。
- `A/9`：DDR3L-1866；`K`：DDR3L-2133。
- `R/W`：0~95°C / -40~95°C。

公开 `dram_type` 使用标准短类型 `DDR3`；低压属性由 `dram_voltage` 和 `dram_speed=DDR3L-*` 表达。

规则按固定位置局部 token 解析，不匹配完整 P/N，也不把内部 code 公开。

## 测试样例

- `F60C1A0002-M6AR`
- `F60C1A0004-M7KR`
- `F60C1A0004-M79W`
