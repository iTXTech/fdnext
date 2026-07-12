# Micron UFS PN 编码

采集日期：2026-05-20；更新日期：2026-07-12

## 外部资料

- Micron UFS v2.1 datasheet mirror 给出 `MTFC32GASAONS-IT` / `MTFC64GASAONS-IT` / `MTFC128GASAONS-IT` / `MTFC256GASAONS-IT`，并标注 UFS part numbering、32GB~256GB 和 package code `NS`。
  <https://datasheet.lcsc.com/lcsc/2411201017_Micron-Tech-MTFC256GASAONS-IT_C5128485.pdf>
- Micron Universal Flash Storage 官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
- Micron UFS part detail 页面确认 `MTFC...` 位于 Universal Flash Storage 目录。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbcavtc-aat>
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) Table 1 给出 UFS Health Report 适用 PN，包括 `MTFC64GASAOEA-WT`、`MTFC128GASAOEA-WT`、`MTFC256GASAOAM-WT`、`MTFC128GARATEK-WT`、`MTFC256GARATEK-WT`、`MTFC512GARATAM-WT`、`MTFC128GAXATEA-WT`、`MTFC256GAXATEA-WT`、`MTFC512GAXATAM-WT`、`MTFC64GAXAUEA-WT`、`MTFC128GAXAUEA-WT` 和 `MTFC256GAXAUEA-WT`，并给出 `B16C` / `B27B` / `B47R` NAND die 组成与 package code。
- Micron `128GB, 256GB, 512GB UFS Features` 页面截图确认 `MTFC128GAXATHF-WT`、`MTFC256GAXATHF-WT`、`MTFC512GAXATHJ-WT` 与 `EA/HF/AM/HJ` package code 对应关系。
- Micron 官方 UFS catalog / part-detail 页面确认 `MTFC128/256/512GBGAZHF-WT` 与 `MTFC1TBGBBAF-WT` 属于 UFS；前一组由可信分销 catalog 交叉确认 `BG:AZ = UFS 4.0`，后一组官方 protocol 栏仍为空，因此 `BG:BB` 只识别为 UFS，不推测 UFS 4.1。官方 catalog 与 Mouser/DigiKey 同时确认 `AF` token 对应 153-ball VFBGA、9x13x0.85。四组 exact PN 均已由 MDB 覆盖，不重复写入 `managed-nand-pn.json`。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog>
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc512gbgazhf-wt>
  <https://www.mouser.com/ProductDetail/Micron/MTFC1TBGBBAF-WT>
- Micron 官方 part-detail 与授权分销页确认 `MTFC128/256GBGBCTD-AIT/AAT` 同属 UFS，`TD` 为 153-ball package；公开资料未给协议版本，因此 `BG:BC` 只用于 UFS 分类。MDB 尚未覆盖的 128GB / 256GB `-AIT` exact PN 进入搜索资源，但 decoder 仍只依赖 `BG:BC` 局部 token 组合。<https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbgbctd-aat>、<https://www.digikey.com/en/products/detail/micron-technology-inc/MTFC256GBGBCTD-AIT/26231423>
- Micron 官方 UFS catalog 确认 `MTFC512GAYAZHF-WT` 为 UFS 3.1，授权分销页同样确认 `MTFC256GBEAZHF-WT` 为 UFS 3.1；因此补齐 `AY:AZ` / `BE:AZ` 局部组合。两条 exact PN 已由 MDB 覆盖，不重复进入搜索资源。<https://tw.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog>、<https://www.digikey.tw/zh/products/detail/micron-technology-inc/MTFC256GBEAZHF-WT/22040998>
- Micron 官方 part-detail 与授权 Mouser/DigiKey 页面确认 `MTFC512GAYAXAP-WT`、`MTFC256/512GBGBBAP-WT` 的 `AP` package token 是 WFBGA-153；公开页未稳定给出尺寸，因此只输出 `WFBGA-153`，不把 9x13 或厚度补猜。相关 exact PN 已由 MDB 覆盖。<https://www.micron.com/products/multichip-packages/ufs-based-mcp/part-catalog/part-detail/mtfc512gayaxap-wt>、<https://www.mouser.com/ProductDetail/Micron/MTFC512GAYAXAP-WT>
- Micron 官方 obsolete UFS catalog JSON 的 69 条记录用于做 `component:controller` 全量差分，补齐此前会回退为 eMMC 的 `AM:AK`、`AO:AM`、`AR:AM`、`AR:AP`、`AV:AU`、`AW:AT`、`AX:AV`、`AY:AY`、`BA:AV`、`BC:AX`。catalog 明确给 protocol 时分别输出 UFS 2.1 / 3.0 / 3.1 / 4.0；`AX:AV`、`AY:AY`、`BA:AV` 的 protocol 栏为空，只识别 UFS。`HL` token 由同一 catalog 确认为 `VFBGA-237, 11x13x0.9`。<https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-universal-flash-storage/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-universal-flash-storage/-/en_US>
- 2026-07-12 重新审计官方 current 21 条、obsolete 69 条 UFS catalog 记录。在排除 ES、已有搜索资源和有效 MDB exact / suffix-boundary 覆盖后，18 条非样品 exact PN 进入 `managed-nand-pn.json`；每条均以既有结构化规则验证为 Micron UFS，且 numeric density 与 catalog 一致。新增 PN 为：`MTFC64GBCAVAL-AAT`、`MTFC256GBCAVTC-AIT`、`MTFC128GBCAVTC-AIT`、`MTFC512GBCAVTC-AAT`、`MTFC128GBCAVTC-AAT`、`MTFC512GBCAVTC-AIT`、`MTFC128GAVATTC-IT`、`MTFC256GBAAVHF-WT`、`MTFC256GARATEA-WT`、`MTFC128GAVAUTC-IT`、`MTFC128GAVATTC-AIT`、`MTFC256GAVATTC-IT`、`MTFC128GARATEA-WT`、`MTFC512GAVATTC-AAT`、`MTFC256GAVATTC-AIT`、`MTFC128GBAAVHF-WT`、`MTFC512GAVATTC-IT`、`MTFC256GAZAOTD-AAT`。catalog 中的 `MTFC513GBAAVHJ-WT`、`MTFC51GBCAXHE-WT` 主体容量结构异常，未进入资源；已有 mapping 不因 catalog 差异被覆盖或删除。

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
- `MTFC512GBGAZHF-WT`
- `MTFC1TBGBBAF-WT`
- `MTFC256GBGBCTD-AIT`
- `MTFC256GBEAZHF-WT`
- `MTFC512GAYAZHF-WT`
- `MTFC512GAYAXAP-WT`
- `MTFC512GBGBBAP-WT`

## 注意

UFS 与 eMMC 共用 `MTFC` 前缀，必须通过 component/controller 组合和外部资料确认产品线，不能用完整 PN 白名单匹配。`AY:AZ` / `BE:AZ` / `BG:AZ` / `BG:BB` / `BG:BC` 同样由局部 token 组合识别；其中 `AY:AZ` / `BE:AZ` 为 UFS 3.1、`BG:AZ` 为 UFS 4.0，`BG:BB` / `BG:BC` 不输出未确认的协议版本。
Micron 已宣布 automotive UFS 4.1 并说明其 G9 NAND、带宽与温区，但公开 press release / catalog 尚未把 UFS 4.1 版本与某个 `MTFC` component/controller token 组合绑定；因此不能仅凭发布时间把 `BG:BB` 标成 UFS 4.1。<https://investors.micron.com/news-releases/news-release-details/micron-ships-automotive-ufs-41-designed-unlock-intelligent>
TN-29-85 的 Health Report 适用表能确认 PN、封装和 NAND die 组成，但没有单独给出所有 controller token 的接口代际；因此 `AR:AT` / `AX:AT` / `AZ:AO` 当前只按 UFS 类型识别，不强行补具体代际。Micron 官网 catalog 的同 family 多容量样本确认 `AX:AU` 为 UFS 2.2、`AV:AT` 为 UFS 3.1；`AZ:AO` 也明确属于 UFS，修正规则不再让它回退为 eMMC。

官网 catalog 直接确认 package code `AL` / `HE` / `TD` 均为 153-ball，尺寸分别为 `11.5x13x1.0`、`11x13x0.9`、`11.5x13x1.2`。未确认 VFBGA/WFBGA/LFBGA subtype 时统一输出 `BGA-153, DIM`。
