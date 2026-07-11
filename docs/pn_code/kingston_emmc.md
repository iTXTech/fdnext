# Kingston eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-11

## 外部资料

- Kingston eMMC 官方表列出 `EMMC04G-MT32` 到 `EMMC256-TY29`，接口为 eMMC 5.1 HS400，并给出 package、NAND 类型。
  <https://www.kingston.com/en/embedded/emmc-embedded-flash>
- Kingston I-Temp eMMC 官方表列出 `EMMC04G-WT32`、`EMMC08G-WV28`、`EMMC16G-WW28`、`EMMC64G-IY29`、`EMMC128-IY29`、`EMMC256-IY29`，温区 -40°C~+85°C。
  <https://www.kingston.com/en/embedded/emmc-embedded-flash>
- 同一官方表新增 alternate family `E04GS14DXI`：4GB、eMMC 5.1 HS400、MLC、-40°C~+85°C、9.0x7.5x0.8。Future Electronics 的 Kingston eMMC feature 页确认该小尺寸使用 153-ball FBGA，因此输出 `FBGA-153, 9.0x7.5x0.8`。冲突的 `E04GS14DXI-02DB0` 第三方页不进入资源。来源：<https://www.futureelectronics.com/en/resources/future-picks/kingston-emmc-flash-memory>
- Kingston eMMC flyer / 分销商页面交叉确认 `EMMC64G-TY29` 为 `11.5x13x0.8`，`EMMC256-IY29` 为 `11.5x13x1.0`。
  <https://media.kingston.com/pdfs/emmc/emmc_flyer_fr.pdf>
  <https://media.kingston.com/pdfs/emmc/itemp-emmc_flyer_en.pdf>
  <https://www.futureelectronics.com/p/semiconductors--memory--storage--embedded-storage/emmc256-iy29-5b101-kingston-9176810>

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/kingston-emmc-token.json`
- `vendor.kingston.emmc.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `EMMC` + density + `-` + config | Kingston eMMC |
| density `04G/08G/16G/32G/64G/128/256` | 4GB~256GB，落库为 Mbit |
| config `MT32/CT32/MV28/MW28` | MLC eMMC 5.1 HS400 |
| config `TS0A/TB9F/TY29` | 3D TLC eMMC 5.1 HS400 |
| config `WT32/WV28/WW28/IY29` | I-Temp eMMC，-40°C~+85°C |
| alternate `E04G` + 6-char config | `E04GS14DXI` compact I-Temp eMMC family；未知 config 仅保留 vendor/type/density |

## Reference check

- `TY29` / `IY29` 不能只按 config 输出封装厚度：64GB/128GB 为 `11.5x13.0x0.8`，256GB 为 `11.5x13.0x1.0`。
- 规则使用 `densityCode:configCode` 二级 package 表，不使用完整 PN 白名单。

## 输出字段

- `density`
- `storage_interface`
- `interface_type`
- `nand_technology`
- `product_class`
- `operation_temperature`

`package_code` 等 ordering token 只用于内部解析，不进入公开字段。

## 测试样例

- `EMMC64G-TY29`
- `EMMC128-IY29`
