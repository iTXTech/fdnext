# Micron UFS PN 编码

采集日期：2026-05-08

## 外部资料

- Micron UFS v2.1 datasheet mirror 给出 `MTFC32GASAONS-IT` / `MTFC64GASAONS-IT` / `MTFC128GASAONS-IT` / `MTFC256GASAONS-IT`，并标注 UFS part numbering、32GB~256GB 和 package code `NS`。
  <https://datasheet.lcsc.com/lcsc/2411201017_Micron-Tech-MTFC256GASAONS-IT_C5128485.pdf>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
- Micron UFS part detail 页面确认 `MTFC...` 位于 Universal Flash Storage 目录。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbcavtc-aat>
- 2026-05-08 复查 Micron UFS 4.1 公开页和 part catalog 搜索结果：能确认 UFS 4.1 产品线与容量范围，但暂未找到公开 ordering table 或可进入 `MTFC` token 规则的新 part detail。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/micron-managed-token.json`
- `vendor.micron.managed.mtfc.nextgen.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | Micron UFS Flash + Controller |
| package `NS` | UFS v2.1 datasheet 中确认的 package code |
| family key `component:controller` | `AS:AO` -> UFS 2.1，`BC:AV` -> UFS 3.1，`BE:AX` / `AY:AX` -> UFS 4.0 |
| temp `CT/WT/IT/AIT/AAT/AITI` | Commercial / Standard / Extended / Industrial 温区 |

## 输出字段

- `nand_component`
- `product_version`
- `operation_temperature`

`controller_code`、`package_code` 等 Micron token 只用于内部解析，不进入公开字段。

## 测试样例

- `MTFC256GASAONS-IT`
- `MTFC64GBCAVAL-AIT`
- `MTFC1TAYAXHR-WT`

## 注意

UFS 与 eMMC 共用 `MTFC` 前缀，必须通过 component/controller 组合和外部资料确认产品线，不能用完整 PN 白名单匹配。
UFS 4.1 目前只记录为待确认方向，不新增 iTXTech fdnext DecodePack token 映射。
