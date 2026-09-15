# Micron UFS PN 编码

采集日期：2026-05-20；更新日期：2026-07-12

## 外部资料

- Micron UFS v2.1 数据手册镜像给出 `MTFC32GASAONS-IT` / `MTFC64GASAONS-IT` / `MTFC128GASAONS-IT` / `MTFC256GASAONS-IT`，并标注 UFS 料号编码、32GB~256GB 和封装编码 `NS`。
  <https://datasheet.lcsc.com/lcsc/2411201017_Micron-Tech-MTFC256GASAONS-IT_C5128485.pdf>
- Micron Universal Flash Storage官方页说明 UFS 相对 e.MMC 5.1 的定位，并给出 UFS 4.1 / UFS 3.1 公开产品族入口。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage>
- Micron UFS 料号细节页面确认 `MTFC...` 位于 Universal Flash Storage目录。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbcavtc-aat>
- Micron `TN-29-85: UFS Memory Health Report for Mobile Devices` (`tn2985_accessing_ufs_health_report.pdf`) 表 1 给出 UFS Health Report 适用 PN，包括 `MTFC64GASAOEA-WT`、`MTFC128GASAOEA-WT`、`MTFC256GASAOAM-WT`、`MTFC128GARATEK-WT`、`MTFC256GARATEK-WT`、`MTFC512GARATAM-WT`、`MTFC128GAXATEA-WT`、`MTFC256GAXATEA-WT`、`MTFC512GAXATAM-WT`、`MTFC64GAXAUEA-WT`、`MTFC128GAXAUEA-WT` 和 `MTFC256GAXAUEA-WT`，并给出 `B16C` / `B27B` / `B47R` NAND die 组成与封装编码。
- Micron `128GB, 256GB, 512GB UFS Features` 页面截图确认 `MTFC128GAXATHF-WT`、`MTFC256GAXATHF-WT`、`MTFC512GAXATHJ-WT` 与 `EA/HF/AM/HJ` 封装编码对应关系。
- Micron 官方 UFS 目录 / 料号-细节页面确认 `MTFC128/256/512GBGAZHF-WT` 与 `MTFC1TBGBBAF-WT` 属于 UFS；前一组由可信分销目录交叉确认 `BG:AZ = UFS 4.0`，后一组协议的后续确认见 [扩展分支](#扩展分支与协议确认)。官方目录与 Mouser/DigiKey 同时确认 `AF` 编码段对应 153 球 VFBGA、9x13x0.85。四组完整 PN 均已由 MDB 覆盖，不重复写入 `managed-nand-pn.json`。
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog>
  <https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc512gbgazhf-wt>
  <https://www.mouser.com/ProductDetail/Micron/MTFC1TBGBBAF-WT>
- Micron 官方料号-细节与授权分销页确认 `MTFC128/256GBGBCTD-AIT/AAT` 同属 UFS，`TD` 为 153 球封装；协议的后续确认见 [扩展分支](#扩展分支与协议确认)。MDB 尚未覆盖的 128GB / 256GB `-AIT` 完整 PN 进入搜索资源，但解码器仍只依赖 `BG:BC` 局部编码段组合。<https://www.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog/part-detail/mtfc256gbgbctd-aat>、<https://www.digikey.com/en/products/detail/micron-technology-inc/MTFC256GBGBCTD-AIT/26231423>
- Micron 官方 UFS 目录确认 `MTFC512GAYAZHF-WT` 为 UFS 3.1，授权分销页同样确认 `MTFC256GBEAZHF-WT` 为 UFS 3.1；因此补齐 `AY:AZ` / `BE:AZ` 局部组合。两条完整 PN 已由 MDB 覆盖，不重复进入搜索资源。<https://tw.micron.com/products/storage/managed-nand/universal-flash-storage/part-catalog>、<https://www.digikey.tw/zh/products/detail/micron-technology-inc/MTFC256GBEAZHF-WT/22040998>
- Micron 官方料号-细节与授权 Mouser/DigiKey 页面确认 `MTFC512GAYAXAP-WT`、`MTFC256/512GBGBBAP-WT` 的 `AP` 封装编码段是 WFBGA-153；公开页未稳定给出尺寸，因此只输出 `WFBGA-153`，不把 9x13 或厚度补猜。相关完整 PN 已由 MDB 覆盖。<https://www.micron.com/products/multichip-packages/ufs-based-mcp/part-catalog/part-detail/mtfc512gayaxap-wt>、<https://www.mouser.com/ProductDetail/Micron/MTFC512GAYAXAP-WT>
- Micron 官方已停产 UFS 目录 JSON 的 69 条记录用于做 `component:controller` 全量差分，补齐此前会回退为 eMMC 的 `AM:AK`、`AO:AM`、`AR:AM`、`AR:AP`、`AV:AU`、`AW:AT`、`AX:AV`、`AY:AY`、`BA:AV`、`BC:AX`。目录明确给协议时分别输出 UFS 2.1 / 3.0 / 3.1 / 4.0；`AX:AV`、`AY:AY`、`BA:AV` 的协议栏为空，只识别 UFS。`HL` 编码段由同一目录确认为 `VFBGA-237, 11x13x0.9`。<https://www.micron.com/content/micron/us/en/products/obsolete/obsolete-universal-flash-storage/part-catalog/_jcr_content.products.json/getpartcatalog/obsolete/obsolete-universal-flash-storage/-/en_US>
- 2026-07-12 重新审计官方当前版 21 条、已停产 69 条 UFS 目录记录。在排除 ES、已有搜索资源和有效 MDB 精确 / 后缀边界覆盖后，18 条非样品完整 PN 进入 `managed-nand-pn.json`；每条均以既有结构化规则验证为 Micron UFS，且数值容量与目录一致。新增 PN 为：`MTFC64GBCAVAL-AAT`、`MTFC256GBCAVTC-AIT`、`MTFC128GBCAVTC-AIT`、`MTFC512GBCAVTC-AAT`、`MTFC128GBCAVTC-AAT`、`MTFC512GBCAVTC-AIT`、`MTFC128GAVATTC-IT`、`MTFC256GBAAVHF-WT`、`MTFC256GARATEA-WT`、`MTFC128GAVAUTC-IT`、`MTFC128GAVATTC-AIT`、`MTFC256GAVATTC-IT`、`MTFC128GARATEA-WT`、`MTFC512GAVATTC-AAT`、`MTFC256GAVATTC-AIT`、`MTFC128GBAAVHF-WT`、`MTFC512GAVATTC-IT`、`MTFC256GAZAOTD-AAT`。目录中的 `MTFC513GBAAVHJ-WT`、`MTFC51GBCAXHE-WT` 主体容量结构异常，未进入资源；已有映射不因目录差异被覆盖或删除。

## 规则状态

共享规则入口与 MTFC 语法见 [Micron 受管理 NAND](micron_managed.md#规则状态)。

PN 结构：

| 结构 | 含义 |
| --- | --- |
| 封装 `NS` | UFS v2.1 数据手册中确认的封装编码 |
| 系列键 `component:controller` | `AS:AO` -> UFS 2.1，`AX:AU` -> UFS 2.2，`AV:AT` / `BC:AV` -> UFS 3.1，`AR:AT` / `AZ:AO` -> UFS，`AX:AT` -> UFS 3.1，`BE:AX` / `AY:AX` -> UFS 4.0 |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
`nand_component`、`controller_code`、`package_code` 等 Micron 编码段只用于内部解析，不进入公开字段。UFS 不额外公开 `product_family`；品牌、UFS 类型和版本已经分别由设备身份、产品类型与 `storage_interface` 表达。

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

MTFC 产品线判定与未知组合见 [共享边界](micron_managed.md#注意)。

TN-29-85 的 Health Report 适用表能确认 PN、封装和 NAND die 组成，但没有单独给出所有控制器编码段的接口代际；因此 `AR:AT` / `AZ:AO` 当前只按 UFS 类型识别，不强行补具体代际。Micron 官网目录的同系列多容量样本确认 `AX:AU` 为 UFS 2.2、`AV:AT` 为 UFS 3.1；`AZ:AO` 也明确属于 UFS，修正规则不再让它回退为 eMMC。

官网目录直接确认封装编码 `AL` / `HE` / `TD` 均为 153 球，尺寸分别为 `11.5x13x1.0`、`11x13x0.9`、`11.5x13x1.2`。未确认 VFBGA/WFBGA/LFBGA 子类型时统一输出 `BGA-153, DIM`。

## 扩展分支与协议确认

2026-08-27 的仓库资料更新确认：`BG` 芯片为 `x8, 1Tb, B68S`，`BG:BB/BC` 为 UFS 4.1；取代早期仅能确认 UFS 类型的记录。未知组合保留在 [受管理 NAND](micron_managed.md#注意)。

官方已停产 UFS 目录确认 `AX:AT` 为 UFS 3.1，且 `EAAA/AMAA` 为四字符封装。分支按 `(MT/EE)FC + density + AXAT + package(4) + - + suffix` 解析；未知封装不影响已确认容量、协议和温区。

`EAAA` 在 128GB/256GB 行出现 VFBGA/WFBGA 和不同厚度，只公开共同确认的 `BGA-153, 11.5x13`；`AMAA` 为 `VFBGA-153, 11.5x13x1.0`。样例：`EEFC128GAXATEAAA-WT`、`EEFC512GAXATAMAA-WT`。

来源：[Micron obsolete UFS catalog](https://www.micron.com/products/obsolete/obsolete-universal-flash-storage/part-catalog)。
