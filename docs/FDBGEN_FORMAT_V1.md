# fdnext fdbgen v1 支持列表格式

`fdnext fdbgen v1` 是给提取工具输出的标准支持列表格式，用于替代控制器厂商私有 JSON 字段名。v1 固化两个版本：

- compact：`v = "fdnext.fdbgen.v1c"`，只描述 PN、完整 Flash ID 和支持控制器。
- full：`v = "fdnext.fdbgen.v1f"`，entry 必须沿用 compact 的字段语义，并增加可标准化扩展信息、完整主控列表和 metadata。

所有结构化字段 key 使用短缩写。entry 字段允许缺损；fdbgen 只消费足够形成有效记录的部分。

Schema 文件：

- [`docs/schemas/fdnext-fdbgen-v1.schema.json`](schemas/fdnext-fdbgen-v1.schema.json)：compact / full 的 `oneOf` 总入口。
- [`docs/schemas/fdnext-fdbgen-v1-compact.schema.json`](schemas/fdnext-fdbgen-v1-compact.schema.json)：compact schema。
- [`docs/schemas/fdnext-fdbgen-v1-full.schema.json`](schemas/fdnext-fdbgen-v1-full.schema.json)：full schema。

解析器入口为 `@itxtech/fdnext-fdbgen` 导出的 `parseFdnextFdbgenV1` / `parseFdnextFdbgenV1Json`。解析器只负责 v1 文档识别、短 key 读取、Flash ID / controller name 基础校验和 full metadata 保留。

支持列表导入入口为 `mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry`。PN 清理、厂商前缀准入、controller name 归一化、可信 PN 写入 PN 表、不可信 PN 回落 `iddb` 的行为都集中在该通用组件里；具体 controller import 只需要把自己的原始字段映射成 `vendor/partNumber/flashId/controllers/cellLevel`，标准 v1 JSON 可直接调用 `mergeFdnextFdbgenV1SupportList`。

## Compact

compact 只允许顶层 `v/e` 和 entry `pn/id/t`，不允许 metadata。

```json
{
  "v": "fdnext.fdbgen.v1c",
  "e": [
    {
      "pn": "MT29F128G08CBCEB",
      "id": "2C844432AA04",
      "t": ["ZC3281", "FC3379"]
    },
    {
      "id": "45DE948376D7",
      "t": ["FC1179", "FC2279S"]
    }
  ]
}
```

compact entry 字段：

- `pn`：PN 候选，可缺损。fdbgen 会继续清理、厂商前缀和 Flash ID 厂商兼容性校验；清理后不可信时不会进入 PN 表。
- `id`：完整 NAND Flash ID，可缺损；进入 FDB 时必须是完整字节数，并且必须使用全大写、无空格、无分隔符的连续十六进制格式。
- `t`：支持控制器数组，可缺损；没有 controller 的 entry 不会产生输出。

## Full

full entry 必须包含 compact 的 `pn/id/t` 语义，同时可以增加标准扩展字段和 metadata。未被 schema 规定的信息由提取工具自行约定后写入 `m`，不要平铺到 entry 或 controller 顶层。

```json
{
  "v": "fdnext.fdbgen.v1f",
  "m": {
    "src": "FirstChip U3 support list",
    "ver": "2026-05-13",
    "ts": "2026-05-13T06:00:00Z"
  },
  "cl": [
    {
      "n": "FC3379",
      "a": ["3379FL"],
      "mf": "FirstChip",
      "if": "USB",
      "m": {
        "rawFamily": "U3"
      }
    }
  ],
  "e": [
    {
      "pn": "MT29F128G08CBCEB",
      "id": "2C844432AA04",
      "t": ["ZC3281", "FC3379"],
      "vd": "micron",
      "c": "MLC",
      "m": {
        "rawName": "MT29F128G08CBCEB(L05B)--2C844432AA04"
      }
    }
  ]
}
```

full 顶层字段：

- `v`：固定为 `fdnext.fdbgen.v1f`。
- `e`：支持项数组，entry 是 compact entry 的超集。
- `cl`：完整主控列表。fdbgen 只消费 `n` 作为 controller name；其他字段供提取链路和后续规则使用。
- `m`：顶层 metadata，可选。提取来源、工具版本、抓取时间等 schema 未规定信息写这里。

full entry 扩展字段：

- `vd`：NAND vendor hint，只用于 PN 归属候选，不强制覆盖 PN / Flash ID 判断。
- `c`：cell level，进入 PN 记录的 `c` 字段。
- `cap`：容量文本或提取工具标准化容量。
- `pkg`：封装文本。
- `w`：位宽或 bus width 文本。
- `m`：entry metadata。无法稳定标准化的提取信息写这里。

full controller `cl[]` 字段：

- `n`：controller canonical name。
- `a`：controller alias 数组。
- `mf`：controller maker / family owner。
- `if`：controller interface 或应用接口。
- `fw`：firmware family。
- `rev`：revision。
- `st`：status。
- `m`：controller metadata。schema 未规定的 controller 信息写这里。

## 导入语义

- Flash ID 不完整、非十六进制或长度异常时跳过。
- JSON 输入只合并当前 NAND Flash ID 解码器支持的厂商前缀：Micron / Intel / Samsung / SK hynix / KIOXIA / SanDisk / YMTC / SpecTek。
- 控制器会经过全局控制器黑名单；默认排除 `3281FL` / `3379FL`。
- `pn` 清理后可信时写入 vendor PN 表，并自动反向回填 `iddb.n`。
- `pn` 缺损或不可信时，只写入 `iddb[id].t`。
- compact 不允许 metadata；full 的 `m` 仅是提取工具和后续规则的输入侧信息，不会写入生成后的 FDB payload。

## 与旧 FirstChip JSON 的关系

旧 FirstChip JSON：

```json
[
  {
    "FlashName": "MT29F128G08CBCEB(L05B)--2C844432AA04",
    "FlashID": "2C844432AA04",
    "SupportedControllers": ["ZC3281", "FC3379", "3281FL", "3379FL"]
  }
]
```

推荐由提取工具转换为 compact：

```json
{
  "v": "fdnext.fdbgen.v1c",
  "e": [
    {
      "pn": "MT29F128G08CBCEB",
      "id": "2C844432AA04",
      "t": ["ZC3281", "FC3379", "3281FL", "3379FL"]
    }
  ]
}
```

如果提取工具能拿到完整主控列表、原始 FlashName、来源版本等信息，则输出 full；无法标准化的信息写入 `m`。控制器黑名单属于 fdbgen 配置，提取工具不需要删除黑名单项；保留原始控制器名能让后续规则变化时重新生成。
