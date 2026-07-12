# ESMT eMMC PN 规则

本页记录 ESMT `FC51` eMMC 5.1 芯片的结构化 PN 解码。规则只从 `FC51` family、独立 technology token 和容量 token 输出已确认字段，不用完整 PN 或 PN body 查表。

## 外部资料

- ESMT 当前 eMMC 产品页列出 `FC51E08SQP1A (2A)` 与 `FC51J32SJTS2A (2D)`：前者为 8GB、2D MLC、eMMC 5.1，后者为 32GB、3D TLC、eMMC 5.1；两者均为 200MHz、153-ball BGA。来源：<https://www.esmt.com.tw/zh-tw/Products/eMMC/eMMC>
- `FC51E08SQP1A (2A)` 原厂 datasheet ordering table 给出正式 Product ID `FC51E08SQP1A-2.5BWGE2A`，确认 8GB、eMMC 5.1、200MHz，以及 153-ball BGA 11.5x13x1.0。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/FC51E08SQP1A%282A%29.pdf>
- `FC51J32SJTS2A (2D)` 原厂 datasheet ordering table 给出正式 Product ID `FC51J32SJTS2A-2.5BWGE2D`，确认 32GB、eMMC 5.1、200MHz，以及 153-ball BGA 11.5x13x1.0。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/FC51J32SJTS2A%282D%29.pdf>
- `FC51L08SFY3A` 原厂 datasheet 给出工业温区正式 Product ID `FC51L08SFY3A-2.5BWGI`，确认 8GB、eMMC 5.1 与 200MHz；公开资料没有给出 `L` technology token 的稳定 cell 语义，因此规则不为其推断 MLC/TLC。来源：<https://esmt.com.tw/upload/pdf/ESMT/datasheets/FC51L08SFY3A_operation%20temperature%20condition%20-40_85%C2%B0C.pdf>
- `FC51L04SMSA` 原厂 datasheet ordering table 给出正式 Product ID `FC51L04SMSA-2.5BWGE`，确认 4GB、eMMC 5.1、200MHz 与 153-ball BGA。它与 `FC51L08...` 同属 `L` family，但资料仍未定义 `L` 的 cell token 含义，因此只补容量、接口和速度。来源：<https://www.esmt.com.tw/upload/pdf/ESMT/datasheets/FC51L04SMSA.pdf>

## iTXTech fdnext DecodePack 范围

- `FC51`：识别为 ESMT eMMC 5.1。
- technology token `E`：2D MLC；`J`：3D TLC。
- density token `04/08/16/32/64/128`：分别输出 4GB/8GB/16GB/32GB/64GB/128GB；只有 `08` 与 `32` 已有当前原厂 exact PN 样例，其余容量 token 仅作为结构化降级能力，不加入搜索资源。
- `2.5` ordering speed token：当前资料确认 200MHz。

## 封装推断

原厂资料确认上述 `E:08`、`J:32`、`L:04`、`L:08` family + density 组合均为 153-ball BGA、11.5x13x1.0。规则按这两个局部 token 的组合输出 `BGA-153, 11.5x13x1.0`，不把完整 PN 或 body 作为 lookup key，也不猜 `B/W/G` 的单字符语义。其他尚未有逐容量外部确认的组合不输出封装。

## 测试样例

- `FC51E08SQP1A-2.5BWGE2A`
- `FC51J32SJTS2A-2.5BWGE2D`
- `FC51L08SFY3A-2.5BWGI`
- `FC51L04SMSA-2.5BWGE`
