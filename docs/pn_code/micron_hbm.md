# Micron HBM PN 编码

采集日期：2026-05-14

本文档记录 Micron HBM / HBM2E stacked DRAM 的公开可解析 PN 结构。当前 iTXTech fdnext DecodePack 先覆盖用户提供的 Micron 官方 HBM2E part-numbering 图中暴露的 `MT54A...` 结构；HBM3E / HBM4 官方产品页确认产品线仍在活跃演进，但暂未在公开页面给出同等级 PN token breakdown，因此不把 HBM3E / HBM4 token 写成确定规则。

## 外部资料

- Micron HBM 产品页确认 HBM 是当前高带宽内存产品线，覆盖 HBM3E / HBM4 等 AI / HPC 方向。
  <https://www.micron.com/products/memory/hbm>
- Micron HBM4 产品页确认 HBM4 当前公开规格方向，例如 2048-pin bus、>11.0Gb/s、>2.8TB/s。
  <https://www.micron.com/products/memory/hbm/hbm4>
- Micron HBM2E part detail 页面确认 `MT54A16G8080A00AC-32...` 属于 HBM2E 产品线。
  <https://my.micron.com/products/memory/hbm/hbm2e/part-catalog/part-detail/mt54a16g8080a00ac-32a-es-a-smpl>
- 用户提供的 Micron 官方 `8GB/16GB HBM2E with ECC Features` part-numbering 图确认 `MT54A16G8080A00AC-32:A` token 顺序、density per channel、channel count、memory die count、package code、data rate、temperature range 和 die revision。

## 规则状态

iTXTech fdnext DecodePack:

- `packages/decodepack/src/rules/packs/micron-hbm-token.json`
- `vendor.micron.hbm2e.mt54.v1`

PN 结构：

| 结构 | 含义 |
| --- | --- |
| `MT54` + voltage + density per channel + channel count + memory die count + logic die variation + product variation + package + `-` data rate + optional temperature + `:` die revision | Micron HBM2E with ECC |
| voltage `A` | 1.2V |
| density per channel `8G/16G` | 8Gb / 16Gb per channel |
| channel count `8` | 8 channels |
| memory die count `04/08` | 4 / 8 memory die |
| data rate `28/32` | 2.8 / 3.2 Gb/s |
| package `BF/AC` | 4-High / 8-High code，当前不直接输出公开 `package`，以 `die_count` 表达堆叠数量 |
| blank temperature | Commercial |
| die revision `A` | Rev A |

## 输出字段

- `dram_type = HBM2E`
- `dram_density`：按 density per channel x channel count 计算，单位 Mbit。
- `dram_voltage`
- `channel_count`
- `die_count`
- `dram_speed`
- `operation_temperature`
- `die_revision`
- `ecc_enabled`

`logic_die_code`、`product_variation_code`、`package_code` 等原始 token 只保留在规则内部，不进入公开结果。HBM package token 目前只确认 4-High / 8-High 堆叠语义，没有公开 ball count / 尺寸时不输出 `fields.package`。

## 测试样例

- `MT54A16G8080A00AC-28:A-B006`
- `MT54A8G8040ABF-32:A`

