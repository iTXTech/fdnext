# ESMT DRAM PN 规则

采集日期：2026-05-12

本页记录 ESMT standalone DRAM 颗粒的 PN 结构。本轮覆盖官方产品页中可直接确认的 SDR、DDR、DDR2、DDR3/DDR3L、DDR4、LPDDR2、LPDDR3 与 LPDDR4X。

## 外部资料

- ESMT SDR SDRAM 产品页列出 `M12L*` 系列 PN、容量组织、刷新、速度与 TSOP/BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/SDRAM>
- ESMT DDR SDRAM 产品页列出 `M13S*` 系列 PN、容量组织、速度与封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR%20SDRAM-1-2>
- ESMT DDR2 SDRAM 产品页列出 `M14D*` / `M14F*` 系列 PN、容量组织、1.8V / 1.5V、电气速度与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR2%20SDRAM-1-3>
- ESMT DDR3(L) SDRAM 产品页列出 `M15T*` / `M15F*` 系列 PN、容量组织、1.35V / 1.5V、速度与 78/96-ball BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR3(L)%20SDRAM>
- ESMT DDR4 SDRAM 产品页列出 `M16U4G16256A(2Z)`、`M16U4G8512A(2Z)` 的 4Gb、x16/x8、1.2V、1333/1600MHz 与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR4%20SDRAM-1-60>
- ESMT LPDDR2 / LPDDR3 / LPDDR4X 产品页列出 `M54D*`、`M55D*`、`M56Z*` 系列的容量组织、电压、速度与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/LPDDR2%20SDRAM>、<https://www.esmt.com.tw/en/Products/DRAM/LPDDR3%20SDRAM>、<https://www.esmt.com.tw/en/Products/DRAM/LPDDR4x%20SDRAM>

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/esmt-dram-token.json`
- 规则 ID：`vendor.esmt.dram.component.v1`
- 当前覆盖：
  - `M12L`：SDR SDRAM。
  - `M13S`：DDR SDRAM。
  - `M14D` / `M14F`：DDR2 SDRAM。
  - `M15T` / `M15F`：DDR3 / DDR3L SDRAM。
  - `M16U`：DDR4 SDRAM。
  - `M54D`：LPDDR2 SDRAM。
  - `M55D`：LPDDR3 SDRAM。
  - `M56Z`：LPDDR4X SDRAM。

## PN 结构

```text
M + family token + density/organization token + A + optional package token
```

例如：

```text
M16U + 4G16256A + 2Z
M56Z + 8G32256A + 2H
```

## 输出约定

- family token 输出标准 `dram_type`；公开结果折叠为 `SDR`、`DDR3`、`LPDDR4X` 等短世代名。
- organization token 输出 `dram_density` 与 `dram_width`，单位继续使用 Mbit；`config_code` 只用于内部解析，不进入公开字段。
- suffix `2C/2G/2H/2S/2Z` 等只作为封装 / 速度补充，不作为识别 PN 主结构的必要条件。
- 官方产品表只确认容量、组织、电压、速度与封装；没有明确 die stack / CS token，本轮不推断 `dram_die_stack`。
- `packages/core/resources/dram-pn.json` 收录官方产品页 PN，用于搜索补全；解码仍由 token 规则完成。
