# Micron UFS PN 编码

采集日期：2026-05-20

## 外部资料

- Micron UFS v2.1 datasheet mirror 给出 `MTFC32GASAONS-IT` / `MTFC64GASAONS-IT` / `MTFC128GASAONS-IT` / `MTFC256GASAONS-IT`，并标注 UFS part numbering、32GB~256GB 和 package code `NS`。
  <https://datasheet.lcsc.com/lcsc/2411201017_Micron-Tech-MTFC256GASAONS-IT_C5128485.pdf>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
- Micron UFS part detail 页面确认 `MTFC...` 位于 Universal Flash Storage 目录。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbcavtc-aat>
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) Table 1 给出 UFS Health Report 适用 PN，包括 `MTFC64GASAOEA-WT`、`MTFC128GASAOEA-WT`、`MTFC256GASAOAM-WT`、`MTFC128GARATEK-WT`、`MTFC256GARATEK-WT`、`MTFC512GARATAM-WT`、`MTFC128GAXATEA-WT`、`MTFC256GAXATEA-WT`、`MTFC512GAXATAM-WT`、`MTFC64GAXAUEA-WT`、`MTFC128GAXAUEA-WT` 和 `MTFC256GAXAUEA-WT`，并给出 `B16C` / `B27B` / `B47R` NAND die 组成与 package code。
- Micron `128GB, 256GB, 512GB UFS Features` 页面截图确认 `MTFC128GAXATHF-WT`、`MTFC256GAXATHF-WT`、`MTFC512GAXATHJ-WT` 与 `EA/HF/AM/HJ` package code 对应关系。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-managed-token.json`
- `vendor.micron.managed.mtfc.nextgen.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MTFC` + density + component(2) + controller(2) + package(2) + optional suffix | Micron UFS Flash + Controller |
| package `NS` | UFS v2.1 datasheet 中确认的 package code |
| family key `component:controller` | `AS:AO` -> UFS 2.1，`AX:AU` -> UFS 2.2，`AV:AT` / `BC:AV` -> UFS 3.1，`AR:AT` / `AX:AT` / `AZ:AO` -> UFS，`BE:AX` / `AY:AX` -> UFS 4.0 |
| temp `CT/WT/IT/AIT/AAT/AITI` | Commercial / Standard / Extended / Industrial 温区 |

## 输出字段

- `nand_component`
- `product_version`
- `operation_temperature`

`nand_component`、`controller_code`、`package_code` 等 Micron token 只用于内部解析，不进入公开字段。UFS 不额外公开 `product_family`；品牌、UFS 类型和版本已经分别由设备身份、product type 与 `product_version` / `storage_interface` 表达。

## 测试样例

- `MTFC256GASAONS-IT`
- `MTFC64GASAOEA-WT`
- `MTFC128GARATEK-WT`
- `MTFC512GAXATHJ-WT`
- `MTFC64GBCAVAL-AIT`
- `MTFC1TAYAXHR-WT`

## 注意

UFS 与 eMMC 共用 `MTFC` 前缀，必须通过 component/controller 组合和外部资料确认产品线，不能用完整 PN 白名单匹配。
TN-29-85 的 Health Report 适用表能确认 PN、封装和 NAND die 组成，但没有单独给出所有 controller token 的接口代际；因此 `AR:AT` / `AX:AT` / `AZ:AO` 当前只按 UFS 类型识别，不强行补具体代际。Micron 官网 catalog 的同 family 多容量样本确认 `AX:AU` 为 UFS 2.2、`AV:AT` 为 UFS 3.1；`AZ:AO` 也明确属于 UFS，修正规则不再让它回退为 eMMC。

官网 catalog 直接确认 package code `AL` / `HE` / `TD` 均为 153-ball，尺寸分别为 `11.5x13x1.0`、`11x13x0.9`、`11.5x13x1.2`。未确认 VFBGA/WFBGA/LFBGA subtype 时统一输出 `BGA-153, DIM`。
