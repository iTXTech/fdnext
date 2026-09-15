# Kingston eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-11

## 外部资料

- Kingston eMMC 官方表列出 `EMMC04G-MT32` 到 `EMMC256-TY29`，接口为 eMMC 5.1 HS400，并给出封装、NAND 类型。
  <https://www.kingston.com/en/embedded/emmc-embedded-flash>
- Kingston I-温度 eMMC 官方表列出 `EMMC04G-WT32`、`EMMC08G-WV28`、`EMMC16G-WW28`、`EMMC64G-IY29`、`EMMC128-IY29`、`EMMC256-IY29`，温区 -40°C~+85°C。
  <https://www.kingston.com/en/embedded/emmc-embedded-flash>
- 同一官方表新增替代系列 `E04GS14DXI`：4GB、eMMC 5.1 HS400、MLC、-40°C~+85°C、9.0x7.5x0.8。Future Electronics 的 Kingston eMMC 特性页确认该小尺寸使用 153 球 FBGA，因此输出 `FBGA-153, 9.0x7.5x0.8`。冲突的 `E04GS14DXI-02DB0` 第三方页不进入资源。来源：<https://www.futureelectronics.com/en/resources/future-picks/kingston-emmc-flash-memory>
- Kingston eMMC 产品单页 / 分销商页面交叉确认 `EMMC64G-TY29` 为 `11.5x13x0.8`，`EMMC256-IY29` 为 `11.5x13x1.0`。
  <https://media.kingston.com/pdfs/emmc/emmc_flyer_fr.pdf>
  <https://media.kingston.com/pdfs/emmc/itemp-emmc_flyer_en.pdf>
  <https://www.futureelectronics.com/p/semiconductors--memory--storage--embedded-storage/emmc256-iy29-5b101-kingston-9176810>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/kingston-emmc-token.json`
- `vendor.kingston.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `EMMC` + 容量 + `-` + 配置 | Kingston eMMC |
| 容量 `04G/08G/16G/32G/64G/128/256` | 4GB~256GB，落库为 Mbit |
| 配置 `MT32/CT32/MV28/MW28` | MLC eMMC 5.1 HS400 |
| 配置 `TS0A/TB9F/TY29` | 3D TLC eMMC 5.1 HS400 |
| 配置 `WT32/WV28/WW28/IY29` | I-温度 eMMC，-40°C~+85°C |
| 替代 `E04G` + 6 字符配置 | `E04GS14DXI` 小尺寸工业温度 eMMC 系列；未知配置仅保留厂商/类型/容量 |

## 参考资料检查

- `TY29` / `IY29` 不能只按配置输出封装厚度：64GB/128GB 为 `11.5x13.0x0.8`，256GB 为 `11.5x13.0x1.0`。
- 规则使用 `densityCode:configCode` 二级封装表，不使用完整 PN 白名单。

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
订购编码段的公开边界见 [术语](terminology.md)。

## 测试样例

- `EMMC64G-TY29`
- `EMMC128-IY29`
