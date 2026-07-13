# Micron HBM PN 编码

采集日期：2026-07-12；更新日期：2026-07-13

本文档记录 Micron HBM / HBM2E / HBM3E stacked DRAM 的公开可解析 PN 结构。当前 iTXTech fdnext DecodePack 覆盖用户提供的 Micron 官方 HBM2E part-numbering 图中暴露的 `MT54A...` 结构，并以 Micron 官方 HBM3E catalog 中可相互校验的 `MT65B...` 条目补充可泛化的容量、通道、堆叠、封装、速率与电压 token。HBM4 官方产品页尚未给出同等级公开 PN token，因此不写成确定规则。

## 外部资料

- Micron HBM 产品页确认 HBM 是当前高带宽内存产品线，覆盖 HBM3E / HBM4 等 AI / HPC 方向。
  <https://www.micron.com/products/memory/hbm>
- Micron HBM4 产品页确认 HBM4 当前公开规格方向，例如 2048-pin bus、>11.0Gb/s、>2.8TB/s。
  <https://www.micron.com/products/memory/hbm/hbm4>
- Micron HBM2E part detail 页面确认 `MT54A16G8080A00AC-32...` 属于 HBM2E 产品线。
  <https://my.micron.com/products/memory/hbm/hbm2e/part-catalog/part-detail/mt54a16g8080a00ac-32a-es-a-smpl>
- Micron HBM2E 官方 catalog 页面与 live catalog JSON 共同确认 `AC = MPGA, 10x11x0.78`；同一官方 catalog 的 `MT54A8G8040A00BF...` 记录确认 `BF = MPGA`，但未公开尺寸，因此 `BF` 只输出封装类型。catalog 中的非样品 exact PN 仅进入搜索资源，Production / Obsolete 状态不从 PN 反推。
  <https://www.micron.com/products/memory/hbm/hbm2e/part-catalog>
  <https://www.micron.com/content/micron/us/en/products/memory/hbm/hbm2e/part-catalog/_jcr_content.products.json/getpartcatalog/memory/hbm2e/-/en_US>
- Micron HBM3E part catalog 同时公开 `MT65B12G16080A00QG-60:A`、`MT65B12G16080A00QG-92:A` 与 `MT65B18G16120A00QH-92:A`；表中确认 24GB / 36GB、9.2GT/s、1.1V、WFPGA、10.98x10.98x0.78 和 -10C 至 +105C。规则只使用这些多条官方记录能够一致支持的局部 token，不把完整 PN 当作 decoder 白名单。
  <https://www.micron.com/products/memory/hbm/hbm3e/part-catalog>
- 用户提供的 Micron 官方 `8GB/16GB HBM2E with ECC Features` part-numbering 图确认 `MT54A16G8080A00AC-32:A` token 顺序、density per channel、channel count、memory die count、package code、data rate、temperature range 和 die revision。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/core/src/decodepack/rules/packs/micron-hbm-token.json`
- `vendor.micron.hbm2e.mt54.v1`
- `vendor.micron.hbm3e.mt65.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT54` + voltage + density per channel + channel count + memory die count + logic die variation + product variation + package + `-` data rate + optional temperature + `:` die revision | Micron HBM2E with ECC |
| voltage `A` | 1.2V |
| density per channel `8G/16G` | 8Gb / 16Gb per channel |
| channel count `8` | 8 channels |
| memory die count `04/08` | 4 / 8 memory die |
| data rate `28/32` | 2.8 / 3.2 Gb/s |
| package `BF` | `MPGA`；官方 catalog 未公开尺寸，不补猜 |
| package `AC` | `MPGA, 10x11x0.78` |
| blank temperature | Commercial |
| die revision `A` | Rev A |

HBM3E `MT65` 结构：

| 结构 | 含义 |
| --- | --- |
| `MT65` + voltage + density per channel + channel count + memory die count + logic/product variation + package + `-` data rate + `:` die revision | Micron HBM3E |
| voltage `B` | 1.1V |
| density per channel `12G/18G` | 12Gb / 18Gb per channel |
| channel count `16` | 16 channels |
| memory die count `08/12` | 8 / 12 memory die |
| data rate `92` | 9.2GT/s；`60` 条目官方 catalog 未公布 MT/s，因此仅识别 token 而不推断速率 |
| package `QG/QH` | WFPGA, 10.98x10.98x0.78；官方 catalog 未确认 ball/pin 数，不补猜 |
| die revision `A` | Rev A |

## 输出字段

- `dram_type = HBM2E / HBM3E`
- `dram_density`：按 density per channel x channel count 计算，单位 Mbit。
- `dram_voltage`
- `channel_count`
- `dram_die_count`
- `dram_speed`
- `operation_temperature`
- `die_revision`
- `ecc_enabled`
- `package`：仅按 PN 中实际存在的 `BF/AC` package token 输出。

`logic_die_code`、`product_variation_code`、`package_code` 等原始 token 只保留在规则内部，不进入公开结果。HBM2E 的 `BF/AC` 与 HBM3E 的 `QG/QH` 都只按 PN 中实际存在的 package token 输出；catalog 未确认 ball/pin 数时不补猜。

## 搜索资源

官方 HBM2E catalog 中排除 `ES` / `SMPL`，并按 MDB exact / suffix-boundary 去重后，新增 16 条 `MT54` exact PN 搜索种子。`AC` 覆盖 `-28/-32`、`A/32A` 与 `B000/B002/B004/B006/BJ90` 等官方后缀；`BF` 覆盖 `-28/-32` 的 `B000/B006`。这些完整 PN 只用于 `searchParts()`，decoder 继续仅按 MT54 token 结构解析。

## 测试样例

- `MT54A16G8080A00AC-28:A-B006`
- `MT54A16G8080A00AC-32:A-B006`
- `MT54A8G8040A00BF-32:A`
- `MT65B12G16080A00QG-60:A`
- `MT65B12G16080A00QG-92:A`
- `MT65B18G16120A00QH-92:A`
