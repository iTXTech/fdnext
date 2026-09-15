# YMTC eMMC PN 编码

采集日期：2026-05-08；更新日期：2026-07-12

## 外部资料

- YMTC EC000 / EC110 eMMC 产品单页给出 `YMEC6A2TB1A2C3`、`YMEC7A2TB2A2C3`、`YMEC8A2TB3A2C3` 样本，确认 eMMC 5.1、BGA-153 11.5x13x1.0、32GB/64GB/128GB 容量。
  <https://xcc2.oss-cn-shenzhen.aliyuncs.com/wareDetailPdf/1450014708439912450.pdf>
- 同一产品单页的 EC000 订购编码表另给出 8GB `YMEC4A1MA1A2C1` 与 16GB `YMEC5A1MA2A2C1`，确认 `A1/M/A/A2/C1` 编码段系列；两枚 PN 补入搜索资源。
- DediProg eMMC BGA-153 支持表列出 EC110 的 `YMEC6A2TB1A2C3C`、`YMEC7A2TB2A2C3C`、`YMEC8A2TB3A2C3C`，并同时列出无尾缀 `C` 的对应 PN；开发板拆解也确认 32GB `YMEC6A2TB1A2C3C`。规则因此在完整已知头部之后容许扩展尾缀，三枚 `C` 变体进入搜索资源，不建立完整 PN 查表。
  <https://www.dediprog.com/product/1897>
  <https://www.ws-dc.com/jishu_2393238_1_1.html>
- YMTC EC150 官方页确认 eMMC 5.1、64GB/128GB/256GB、BGA-153 11.5x13 封装和 Xtacking 4.0 产品线。
  <https://www.ymtc.com/en/products/46.html?cat=38>
- EC150 官方产品单页进一步明确产品采用 X4-9060 3D NAND，因此 `generation G` 结构化映射到共享 `WTS` die 规格；不从完整 PN 反推。
  <https://website-cdn.ymtc.com/en/resources/file/20250829/452f1532fb47a9c02d91d3353291957d.pdf>
- YMTC 官方技术支持页面已列出 EC150 eMMC 5.1 英文产品单页；下载仍要求登录，因此这里只把它作为官方资料入口，不从未读取内容扩展订购编码段。
  <https://www.ymtc.com/en/techsupport.html>
- EC150 64GB 实物评测确认 `YMEC7C0TG1A2C3`；外部料号表列出同结构的 128GB `YMEC8C0TG2A2C3` 和 256GB `YMEC9C0TG3A2C3`，与官方容量矩阵一致，用于建立 `C0/G` 编码段系列。完整 PN 只进入搜索资源和测试用例。
  <https://inf.news/en/digital/e6c5d7543d875b550ba31c8fe31ecab0.html>
  <https://gloneo.com/h-nd-1169.html>
- EC230 数据手册页面确认 64/128/256GB、eMMC 5.1 与 BGA-153 11.5x13x1.0；QVL/JLC/设备资料分别确认 `YMEC7B0TE1A2C3`、`YMEC8B0TE2A2C3`、`YMEC9B0TE3A2C3`。现有 `B0/E/A2` 编码段已能解析，仅补完整搜索矩阵和 `product_family` 语义。
  <https://bbs.16rd.com/misc.php?id=48054&mod=citiao&type=data_download>
  <https://cp.synaptics.com/cognidox/download/NR-154842-TC-APPROVED.pdf>
  <https://jlcpcb.com/partdetail/JLCPCBAssembly-YMEC8B0TE2A2C3/C9900054816>

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/ymtc-emmc-token.json`
  - `vendor.ymtc.emmc-label.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `YMEC` + 容量(1) + 控制器(2) + 单元(1) + 代际(1) + die 堆叠(1) + 封装(2) + 类别/温度(2) + 可选后缀 | YMTC eMMC 标签；已知头部之后允许扩展尾缀 |
| 容量 `4..A` | 8GB 到 512GB，输出 `density` |
| 控制器 `A1/A2/B0/C0` | EC000 / EC110 / EC230 / EC150 控制器编码段 |
| 单元 `M/T` | MLC / TLC |
| 代际 `A/B/C/E/G` | 代际编码段；`G` 由 EC150 官方产品单页映射到 X4-9060 / `WTS` |
| 封装 `A2` | BGA-153 11.5x13x1.0 |
| 后缀 `C1/C3` | 商业级产品类别 + 工作温度 |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
## 测试样例

- `YMEC6A1TC1A2C1`
- `YMEC8A2TB3A2C3`
- `YMEC6A2TB1A2C3C`
- `YMEC9C0TG3A2C3`
- `YMEC9B0TE3A2C3`

## 注意

EC000 / EC110 产品单页中出现的样本进入测试用例。EC150 的具体 PN 由官方产品矩阵、实物丝印与外部料号表多源确认；解码器仍只按编码段解析。
来源维护遵循 [可信度策略](reference_policy.md)。
