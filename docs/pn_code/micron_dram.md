# Micron DRAM PN 编码资料

采集日期：2026-05-08

## 资料来源

- Micron 官方 Packaging and shipping information 页面列出 `DRAM Component Part Numbering System`，版本日期为 2022-07-14，覆盖 DDR4/3/2/DDR/SDRAM、LPDDR5/4/3/2、RLDRAM 与 GDDR 系列；下载入口当前需要 Micron 登录/NDA。
  <https://www.micron.com/sales-support/sales/packaging-and-shipping-information>
- Micron 官方 part detail / part catalog 页面可直接确认样例 PN 属于对应 DRAM 产品线。
  - DDR4 `MT40A1G8SA-075-E`: <https://www.micron.com/products/memory/dram-components/ddr4-sdram/part-catalog/part-detail/mt40a1g8sa-075-e>
  - DDR5 `MT60B2G8HB-48B-IT-A`: <https://www.micron.com/products/memory/dram-components/ddr5-sdram/part-catalog/part-detail/mt60b2g8hb-48b-it-a>
  - DDR3 `MT41K512M8DA-107`: <https://www.micron.com/products/memory/dram-components/ddr3-sdram/part-catalog/part-detail/mt41k512m8da-107>
  - DDR2 `MT47H128M16RT-25E-IT`: <https://www.micron.com/products/memory/dram-components/ddr2-sdram/part-catalog/part-detail/mt47h128m16rt-25e-it>
  - LPDDR4 `MT53E1G32D2FW-046-AIT-A`: <https://www.micron.com/products/memory/dram-components/lpddr4/part-catalog/part-detail/mt53e1g32d2fw-046-ait-a>
  - LPDDR5 `MT62F1G32D4DS-031-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr5/part-catalog/part-detail/mt62f1g32d4ds-031-wt-b>
  - LPDDR3 `MT52L512M32D2PF-107-WT-B`: <https://www.micron.com/products/memory/dram-components/lpddr-components/part-catalog/part-detail/mt52l512m32d2pf-107-wt-b>
  - GDDR6X `MT61K512M32KPA-24-U`: <https://www.micron.com/products/memory/graphics-memory/gddr6x/part-catalog/part-detail/mt61k512m32kpa-24-u>
- 公开分销页面和 datasheet 镜像用于交叉确认实际封装输出，例如 DigiKey `MT40A1G8SA-075:E` / `MT41K512M8DA-107:P` / `MT61K256M32JE-14:A` / `MT61K512M32KPA-24:U`、Microchip USA `MT53E1G32D2FW-046 WT:B`、Allelco `MT62F1G32D4DS-031 WT:B`，以及公开的 Micron GDDR5X datasheet 镜像。
  - <https://www.digikey.kr/ko/products/detail/micron-technology-inc/MT40A1G8SA-075-E/7597774>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT41K512M8DA-107-P-TR/23331051>
  - <https://www.microchipusa.com/product/micron-technology-inc/memory-2/MT53E1G32D2FW-046-WT-B-TR>
  - <https://www.allelcoelec.com/productdetails/Micron-Technology/MT62F1G32D4DS-031%20WT-B.html>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT61K256M32JE-14-A-TR/8510162>
  - <https://www.digikey.com/en/products/detail/micron-technology-inc/MT61K512M32KPA-24-U-TR/17632186>
  - <https://datasheet.octopart.com/MT58K256M32JA-100%3AA-Micron-datasheet-180658177.pdf>
- 公开镜像 `DRAM Component Part Numbering System` 可核对字段顺序、family/voltage/device version/temperature/status/revision/speed 等 token 含义；镜像版本较旧，只用于字段结构交叉验证。
  <https://docslib.org/doc/10329358/dram-component-part-numbering-system>

## DSL 范围

- 规则文件：`packages/dsl/src/rules/packs/micron-dram-token.json`
- 规则 ID：`vendor.micron.dram.component.v1`
- 首批覆盖：DDR/SDR/LPDDR/GDDR 主线 component PN，包括 `MT40/41/42/46/47/48/51/52/53/58/60/61/62`。
- 不使用完整 PN 白名单；只按 Micron DRAM part-numbering token 解析字段。

## PN 结构

典型结构：

```text
MT + family + voltage + component configuration + device version + package code + -speed + -temperature + production status + :/ -revision
```

首批 family token：

| Token | 产品线 | 输出 |
| --- | --- | --- |
| `40` | DDR4 SDRAM | `dram_type=DDR4 SDRAM` |
| `41` | DDR3 SDRAM | `dram_type=DDR3 SDRAM` |
| `42` | Mobile LPDDR2 | `dram_type=LPDDR2 SDRAM` |
| `44` | RLDRAM 3 | `dram_type=RLDRAM 3` |
| `46` | DDR SDRAM / Mobile LPDDR | 默认 `dram_type=DDR SDRAM`，`H/HC` voltage token 细化为 `LPDDR SDRAM` |
| `47` | DDR2 SDRAM | `dram_type=DDR2 SDRAM` |
| `48` | SDRAM / Mobile LPSDR | 默认 `dram_type=SDR SDRAM`，`H` voltage token 细化为 `LPSDR SDRAM` |
| `49` | RLDRAM 1/2 | `dram_type=RLDRAM` |
| `51` | GDDR5 | `dram_type=GDDR5 SGRAM` |
| `52` | Mobile LPDDR3 | `dram_type=LPDDR3 SDRAM` |
| `53` | Mobile LPDDR4 | `dram_type=LPDDR4 SDRAM` |
| `58` | GDDR5X | `dram_type=GDDR5X SGRAM` |
| `60` | DDR5 SDRAM | `dram_type=DDR5 SDRAM` |
| `61` | GDDR6 / GDDR6X | 默认 `dram_type=GDDR6 SGRAM`，部分 speed bin 细化为 `GDDR6X SGRAM` |
| `62` | Mobile LPDDR5 | `dram_type=LPDDR5 SDRAM` |

## 输出约定

- 顶层 `density` 使用项目统一 Mbit 单位，由 `component configuration` 的 depth x width 推导，例如 `1G8` 输出 `8192`。
- 顶层 `deviceWidth` 输出组织位宽，例如 `1G32` 输出 `x32`。
- 顶层 `voltage` 输出 Micron voltage token 对应说明。
- 顶层 `package` 输出实际封装，例如 `78-ball FBGA (7.5x11)`；仅对 part detail、datasheet 或外部分销页可确认的 `family + package code` 组合输出。
- standalone DRAM 的 `extraInfo` 避免重复顶层输出：不再输出 `product_family`、`product_version`、`dram_density`、`dram_width`。
- `extraInfo` 使用跨厂商 DRAM canonical key：`dram_type`、`dram_die_stack`、`dram_speed`、`operation_temperature`、`die_revision`、`config_code`、`package_code`。
- `dram_type` 必须使用跨厂商标准名，不带厂商名，不写组合候选。
- `package_code` 保留 Micron 原始封装 token；不要用它替代顶层 `package`，也不把未确认的 token 硬推成封装尺寸或 ball count。
- 维护用来源、外部确认状态或推断来源不得进入 `extraInfo`。

## 封装映射

封装映射按 `family token + package code` 建表，不按 package code 单独全局复用；同一个封装 code 在不同产品线可能含义不同。首批只纳入公开资料可交叉确认的样例映射。

| Key | 实际封装 |
| --- | --- |
| `40:SA` | `78-ball FBGA (7.5x11)` |
| `41:DA` | `78-ball FBGA (8x10.5)` |
| `42:LF` | `168-ball WFBGA (12x12)` |
| `46:B5` | `90-ball VFBGA (8x13)` |
| `46:P` | `66-pin TSOP` |
| `47:RT` | `84-ball FBGA (9x12.5)` |
| `48:B5` | `90-ball VFBGA (8x13)` |
| `48:P` | `54-pin TSOP II` |
| `51:HF` | `170-ball FBGA (12x14)` |
| `52:PF` | `178-ball FBGA (11.5x11)` |
| `53:FW` | `200-ball TFBGA (10x14.5)` |
| `58:JA` | `190-ball FBGA (10x14)` |
| `60:HB` | `82-ball VFBGA (9x11)` |
| `61:JE` | `180-ball FBGA (12x14)` |
| `61:KPA` | `180-ball FBGA (12x14)` |
| `62:DS` | `200-ball WFBGA (10x14.5)` |

## 首批样例

| PN | 产品线 | 关键输出 |
| --- | --- | --- |
| `MT40A1G8SA-075-E` | DDR4 SDRAM | `8Gb`, `x8`, `78-ball FBGA`, `DDR4-2666 CL19`, `Rev E` |
| `MT60B2G8HB-48B-IT-A` | DDR5 SDRAM | `16Gb`, `x8`, `82-ball VFBGA`, `DDR5-4800B`, `Industrial`, `Rev A` |
| `MT41K512M8DA-107:P` | DDR3 SDRAM | `4Gb`, `x8`, `78-ball FBGA`, `1866 MT/s / 933 MHz`, `Rev P` |
| `MT47H128M16RT-25E:C` | DDR2 SDRAM | `2Gb`, `x16`, `84-ball FBGA`, `DDR2-800`, `Rev C` |
| `MT46V32M16P-5B-IT-J` | DDR SDRAM | `512Mb`, `x16`, `66-pin TSOP`, `DDR-400`, `Industrial`, `Rev J` |
| `MT46H32M32LFB5-5 IT:B` | LPDDR | `1Gb`, `x32`, `90-ball VFBGA`, `Single die`, `200 MHz`, `Rev B` |
| `MT48LC16M8A2P-6A:L` | SDRAM | `128Mb`, `x8`, `54-pin TSOP II`, `166 MHz`, `Rev L` |
| `MT48H16M32LFB5-75:A` | LPSDR | `512Mb`, `x32`, `90-ball VFBGA`, `Single die`, `133 MHz`, `Rev A` |
| `MT42L128M32D1LF-25 WT:A` | LPDDR2 | `4Gb`, `x32`, `168-ball WFBGA`, `Single die`, `Rev A` |
| `MT52L512M32D2PF-107 WT:B` | LPDDR3 | `16Gb`, `x32`, `178-ball FBGA`, `2-die stack`, `Rev B` |
| `MT53E1G32D2FW-046-AIT-A` | LPDDR4 | `32Gb`, `x32`, `200-ball TFBGA`, `2-die stack`, `LPDDR4-4266`, `Rev A` |
| `MT62F1G32D4DS-031-WT-B` | LPDDR5 | `32Gb`, `x32`, `200-ball WFBGA`, `4-die stack`, `LPDDR5-6400`, `Rev B` |
| `MT51J256M32HF-80:A` | GDDR5 | `8Gb`, `x32`, `170-ball FBGA`, `GDDR5-8Gbps`, `Rev A` |
| `MT58K256M32JA-100:A` | GDDR5X | `8Gb`, `x32`, `190-ball FBGA`, `GDDR5X-10Gbps`, `Rev A` |
| `MT61K256M32JE-14:A` | GDDR6 | `8Gb`, `x32`, `180-ball FBGA`, `GDDR6-14Gbps`, `Rev A` |
| `MT61K512M32KPA-24-U` | GDDR6X | `16Gb`, `x32`, `180-ball FBGA`, `GDDR6X-24Gbps`, `Rev U` |
