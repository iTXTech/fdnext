# Micron HBM PN 编码

采集日期：2026-07-12；更新日期：2026-07-13

本文档记录 Micron HBM / HBM2E / HBM3E 堆叠 DRAM 的公开可解析 PN 结构。当前 iTXTech fdnext DecodePack 覆盖用户提供的 Micron 官方 HBM2E 料号编码图中暴露的 `MT54A...` 结构，并以 Micron 官方 HBM3E 目录中可相互校验的 `MT65B...` 条目补充可泛化的容量、通道、堆叠、封装、速率与电压编码段。HBM4 官方产品页尚未给出同等级公开 PN 编码段，因此不写成确定规则。

## 外部资料

- Micron HBM 产品页确认 HBM 是当前高带宽内存产品线，覆盖 HBM3E / HBM4 等 AI / HPC 方向。
  <https://www.micron.com/products/memory/hbm>
- Micron HBM4 产品页确认 HBM4 当前公开规格方向，例如 2048-引脚总线、>11.0Gb/s、>2.8TB/s。
  <https://www.micron.com/products/memory/hbm/hbm4>
- Micron HBM2E 料号细节页面确认 `MT54A16G8080A00AC-32...` 属于 HBM2E 产品线。
  <https://my.micron.com/products/memory/hbm/hbm2e/part-catalog/part-detail/mt54a16g8080a00ac-32a-es-a-smpl>
- Micron HBM2E 官方目录页面与在线目录 JSON 共同确认 `AC = MPGA, 10x11x0.78`；同一官方目录的 `MT54A8G8040A00BF...` 记录确认 `BF = MPGA`，但未公开尺寸，因此 `BF` 只输出封装类型。目录中的非样品完整 PN 仅进入搜索资源，生产 / 已停产状态不从 PN 反推。
  <https://www.micron.com/products/memory/hbm/hbm2e/part-catalog>
  <https://www.micron.com/content/micron/us/en/products/memory/hbm/hbm2e/part-catalog/_jcr_content.products.json/getpartcatalog/memory/hbm2e/-/en_US>
- Micron HBM3E 产品目录同时公开 `MT65B12G16080A00QG-60:A`、`MT65B12G16080A00QG-92:A` 与 `MT65B18G16120A00QH-92:A`；表中确认 24GB / 36GB、9.2GT/s、1.1V、WFPGA、10.98x10.98x0.78 和 -10C 至 +105C。规则只使用这些多条官方记录能够一致支持的局部编码段，不把完整 PN 当作解码器白名单。
  <https://www.micron.com/products/memory/hbm/hbm3e/part-catalog>
- 用户提供的 Micron 官方 `8GB/16GB HBM2E with ECC Features` 料号编码图确认 `MT54A16G8080A00AC-32:A` 编码段顺序、每通道容量、通道数量、存储 die 数、封装编码、数据传输率、温度范围和 die 修订版。

## 规则状态

DecodePack 规则：

- `packages/core/src/decodepack/rules/packs/micron-hbm-token.json`
- `vendor.micron.hbm2e.mt54.v1`
- `vendor.micron.hbm3e.mt65.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT54` + 电压 + 每通道容量 + 通道数量 + 存储 die 数 + 逻辑 die 变体 + 产品变体 + 封装 + `-` 数据传输率 + 可选温度 + `:` die 修订版 | Micron HBM2E 带 ECC |
| 电压 `A` | 1.2V |
| 每通道容量 `8G/16G` | 每通道 8Gb / 16Gb |
| 通道数量 `8` | 8 通道 |
| 存储 die 数 `04/08` | 4 / 8 存储器 die |
| 数据传输率 `28/32` | 2.8 / 3.2 Gb/s |
| 封装 `BF` | `MPGA`；官方目录未公开尺寸，不补猜 |
| 封装 `AC` | `MPGA, 10x11x0.78` |
| 空白温度 | 商业级 |
| die 修订版 `A` | Rev A |

HBM3E `MT65` 结构：

| 结构 | 含义 |
| --- | --- |
| `MT65` + 电压 + 每通道容量 + 通道数量 + 存储 die 数 + 逻辑/产品变体 + 封装 + `-` 数据传输率 + `:` die 修订版 | Micron HBM3E |
| 电压 `B` | 1.1V |
| 每通道容量 `12G/18G` | 每通道 12Gb / 18Gb |
| 通道数量 `16` | 16 通道 |
| 存储 die 数 `08/12` | 8 / 12 存储器 die |
| 数据传输率 `92` | 9.2GT/s；`60` 条目官方目录未公布 MT/s，因此仅识别编码段而不推断速率 |
| 封装 `QG/QH` | WFPGA, 10.98x10.98x0.78；官方目录未确认球/引脚数，不补猜 |
| die 修订版 `A` | Rev A |

## 输出字段

字段名称、单位和通用输出格式见 [术语](terminology.md)。
- `dram_type = HBM2E / HBM3E`
- `dram_density`：按每通道容量 x 通道数量计算，单位 Mbit。
- `package`：仅按 PN 中实际存在的 `BF/AC` 封装编码段输出。

`logic_die_code`、`product_variation_code`、`package_code` 等原始编码段只保留在规则内部，不进入公开结果。HBM2E 的 `BF/AC` 与 HBM3E 的 `QG/QH` 都只按 PN 中实际存在的封装编码段输出；目录未确认球/引脚数时不补猜。

## 搜索资源

官方 HBM2E 目录中排除 `ES` / `SMPL`，并按 MDB 精确 / 后缀边界去重后，新增 16 条 `MT54` 完整 PN 搜索种子。`AC` 覆盖 `-28/-32`、`A/32A` 与 `B000/B002/B004/B006/BJ90` 等官方后缀；`BF` 覆盖 `-28/-32` 的 `B000/B006`。这些完整 PN 只用于 `searchParts()`，解码器继续仅按 MT54 编码段结构解析。

## 测试样例

- `MT54A16G8080A00AC-28:A-B006`
- `MT54A16G8080A00AC-32:A-B006`
- `MT54A8G8040A00BF-32:A`
- `MT65B12G16080A00QG-60:A`
- `MT65B12G16080A00QG-92:A`
- `MT65B18G16120A00QH-92:A`
