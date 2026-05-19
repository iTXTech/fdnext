# ESMT DRAM PN 规则

采集日期：2026-05-12；订货 PN 形式补充：2026-05-19

本页记录 ESMT standalone DRAM 颗粒的 PN 结构。本轮覆盖官方产品页中可直接确认的 SDR、DDR、DDR2、DDR3/DDR3L、DDR4、LPDDR、LPDDR2、LPDDR3 与 LPDDR4X。2026-05-19 根据用户提供的 datasheet 截图，将 ESMT `dram-pn.json` 条目从页眉里的括号式族内标记整理为订货表中的标准 Product ID 形式，并继续补充 `M13D` LPDDR、`M52D` mobile SDR、`M54D1G1664A-*BKIG`、`M54D2G16128A-*BKG`、`M16U4G16256A-*BIG` / `*BIAG2Z`、`M12L64164A-*TIG2C` / `*BIG2C`、`M13S128168A-*2N`、`M13S2561616A-*2T`、`M15T*BG2S` / `M15T2G16128A-BDBIG2B` 与 `M56Z8G32256A-SMBYIG` 等标准 ordering PN。本轮没有联网抓取 PDF。

## 外部资料

- ESMT SDR SDRAM 产品页列出 `M12L*` / `M52D*` / `M52S*` 系列 PN、容量组织、刷新、速度与 TSOP/BGA/VFBGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/SDRAM>；`M12L128168A-*TIG2S` / `*BIG2S`、`M12L64164A-*TIG2C` / `*BIG2C`、`M12L32321A-*BG2G`、`M12L5121632A-*IG2T`、`M52D2561616A-*BG2F`、`M52D5121632A-*BG` 与 `M52S32321A-*BIG` 的订货形式来自本轮截图。
- ESMT DDR SDRAM 产品页列出 `M13S*` 系列 PN、容量组织、速度与封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR%20SDRAM-1-2>；`M13S128168A-*TIG2N` / `*BIG2N` / automotive `*VG2N` / `*VAG2N` 与 `M13S2561616A-*TG2T` / `*BG2T` 的订货形式来自本轮截图。
- ESMT DDR2 SDRAM 产品页列出 `M14D*` / `M14F*` 系列 PN、容量组织、1.8V / 1.5V、电气速度与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR2%20SDRAM-1-3>
- ESMT DDR3(L) SDRAM 产品页列出 `M15T*` / `M15F*` 系列 PN、容量组织、1.35V / 1.5V、速度与 78/96-ball BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR3(L)%20SDRAM>；`M15T1G1664A-*BG2S`、`M15T2G16128A-BDBIG2B`、`M15T4G16256A-*BG2S` 与 `M15T8G16512A-*BG2S` 的订货形式来自本轮截图。
- ESMT DDR4 SDRAM 产品页列出 `M16U4G16256A(2Z)`、`M16U4G8512A(2Z)` 的 4Gb、x16/x8、1.2V、1333/1600MHz 与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/DDR4%20SDRAM-1-60>
- ESMT LPDDR / LPDDR2 / LPDDR3 / LPDDR4X 产品页列出 `M13D*`、`M53D*`、`M54D*`、`M55D*`、`M56Z*` 系列的容量组织、电压、速度与 BGA 封装。来源：<https://www.esmt.com.tw/en/Products/DRAM/LPDDR2%20SDRAM>、<https://www.esmt.com.tw/en/Products/DRAM/LPDDR3%20SDRAM>、<https://www.esmt.com.tw/en/Products/DRAM/LPDDR4x%20SDRAM>；`M13D64322A-*BG2S`、`M53D256328A-*BG2F`、`M53D2561616A-*BG2F`、`M53D5123216A-*BG`、`M54D1G1664A-*BKIG`、`M54D2G16128A-*BKG`、`M55D4G32128A-*BG2R`、`M56Z8G32256A-TNBYG2H` 与 `M56Z8G32256A-SMBYIG` 的订货形式来自本轮截图。

## iTXTech fdnext DecodePack 范围

- 规则文件：`packages/core/src/decodepack/rules/packs/esmt-dram-token.json`
- 规则 ID：`vendor.esmt.dram.component.v1`
- 当前覆盖：
  - `M12L`：SDR SDRAM。
  - `M52S`：SDR SDRAM。
  - `M13D`：LPDDR SDRAM。
  - `M13S`：DDR SDRAM。
  - `M14D` / `M14F`：DDR2 SDRAM。
  - `M15T` / `M15F`：DDR3 / DDR3L SDRAM。
  - `M16U`：DDR4 SDRAM。
  - `M52D`：Mobile SDR SDRAM。
  - `M53D`：LPDDR SDRAM。
  - `M54D`：LPDDR2 SDRAM。
  - `M55D`：LPDDR3 SDRAM。
  - `M56Z`：LPDDR4X SDRAM。

## PN 结构

```text
M + family token + density/organization token + A + optional "-speed/package/temperature/solder" ordering suffix
```

例如：

```text
M15T + 1G1664A + -EFBIG2S
M15T + 1G1664A + -DEBG2S
M14D + 5121632A + -1.5BG2A
M13S + 64164A + -4TVAG2Y
M13S + 128168A + -4TVAG2N
M13S + 2561616A + -4BG2T
M13D + 64322A + -4.5BG2S
M13S + 128168A + -4.5BG2S
M12L + 64164A + -5BIG2C
M14D + 1G1664A + -1.5BIG2P
M14D + 5121632A + -1.5BIG2M
M52S + 32321A + -7.5BIG
M52D + 5121632A + -6BG
M53D + 256328A + -5BG2F
M54D + 1G1664A + -1.8BKIG
M54D + 2G16128A + -3BKG
M55D + 4G16256A + -GFBG2R
M16U + 4G16256A + -QLBIAG2Z
M56Z + 8G32256A + -TNBYG2H
M56Z + 8G32256A + -SMBYIG
```

## 输出约定

- family token 输出标准 `dram_type`；公开结果折叠为 `SDR`、`DDR3`、`LPDDR4X` 等短世代名。
- organization token 输出 `dram_density` 与 `dram_width`，单位继续使用 Mbit；`config_code` 只用于内部解析，不进入公开字段。
- 订货后缀中的速度 token（如 `E`、`D`、`B`、`4`、`4.5`、`5`、`6`、`1.5`、`1.8`、`2.5`、`3`、`7.5`）命中时，公开 `dram_speed` 只输出该具体速度 / timing，不再输出 family 级范围速度。
- `M15F` / `M16U` / `M55D` 等系列存在两位速度 token，例如 `GH`、`EF`、`DE`、`QL`、`KJ`、`HH`、`GF`、`EE`、`CD`；同样只输出具体速度 / timing。
- suffix `2C/2F/2G/2H/2M/2N/2P/2S/2T/2Y/2Z` 或 `TIG/BIG/TVG/BVG/BG/BBG/BBIG/BKG/BKIG/BIAG/FBIG/SMBYIG/TNBYG` 等只作为封装、温区、Pb-free 与速度补充，不作为识别 PN 主结构的必要条件。
- datasheet 页眉中的 `M15T1G1664A (2S)`、`M13S64164A (2Y)`、`M13S128168A (2N)`、`M12L128168A (2S)`、`M55D4G16256A (2R)` 等是系列 / 页面标记；`packages/core/resources/dram-pn.json` 收录订货表中的 `M15T1G1664A-EFBG2S`、`M13S64164A-4TVAG2Y`、`M13S128168A-4TVAG2N`、`M12L128168A-5TIG2S`、`M55D4G16256A-GFBG2R` 等 Product ID，不收录括号式页眉标记。
- 官方产品表只确认容量、组织、电压、速度与封装；没有明确 die stack / CS token，本轮不推断 `dram_die_stack`。
- `packages/core/resources/dram-pn.json` 收录官方产品页 PN，用于搜索补全；解码仍由 token 规则完成。
