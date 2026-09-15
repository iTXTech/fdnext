# fdnext fdbgen v1 支持列表格式

`fdnext fdbgen v1` 是给提取工具输出的标准支持列表格式，用于替代控制器厂商私有 JSON 字段名。v1 固化两个版本：

- 紧凑格式：`v = "fdnext.fdbgen.v1c"`，只描述 PN、完整 Flash ID 和支持控制器。
- 完整格式：`v = "fdnext.fdbgen.v1f"`，条目必须沿用紧凑格式的字段语义，并增加可标准化扩展信息、完整主控列表和元数据。

所有结构化字段键使用短缩写。条目字段允许缺损；fdbgen 只消费足够形成有效记录的部分。

结构定义文件：

- [`docs/schemas/fdnext-fdbgen-v1.schema.json`](schemas/fdnext-fdbgen-v1.schema.json)：紧凑格式 / 完整格式的 `oneOf` 总入口。
- [`docs/schemas/fdnext-fdbgen-v1-compact.schema.json`](schemas/fdnext-fdbgen-v1-compact.schema.json)：紧凑格式结构定义。
- [`docs/schemas/fdnext-fdbgen-v1-full.schema.json`](schemas/fdnext-fdbgen-v1-full.schema.json)：完整格式结构定义。

解析器入口为 `@itxtech/fdnext-fdbgen` 导出的 `parseFdnextFdbgenV1` / `parseFdnextFdbgenV1Json`。解析器只负责 v1 文档识别、短键读取、Flash ID / 控制器名称基础校验和完整格式元数据保留。

支持列表导入入口为 `mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry`。PN 清理、厂商前缀准入、控制器名称归一化、可信 PN 写入 PN 表、不可信 PN 回落 `iddb` 的行为都集中在该通用组件里；具体控制器导入只需要把自己的原始字段映射成 `vendor/partNumber/flashId/controllers/cellLevel`，标准 v1 JSON 可直接调用 `mergeFdnextFdbgenV1SupportList`。

## 紧凑格式

紧凑格式只允许顶层 `v/e` 和条目 `pn/id/t`，不允许元数据。

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

紧凑格式条目字段：

- `pn`：PN 候选，可缺损。fdbgen 会继续清理、厂商前缀和 Flash ID 厂商兼容性校验；清理后不可信时不会进入 PN 表。
- `id`：完整 NAND Flash ID，可缺损；进入 FDB 时必须是完整字节数，并且必须使用全大写、无空格、无分隔符的连续十六进制格式。
- `t`：支持控制器数组，可缺损；没有控制器的条目不会产生输出。

## 完整格式

完整格式条目必须包含紧凑格式的 `pn/id/t` 语义，同时可以增加标准扩展字段和元数据。未被结构定义规定的信息由提取工具自行约定后写入 `m`，不要平铺到条目或控制器顶层。

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

完整格式顶层字段：

- `v`：固定为 `fdnext.fdbgen.v1f`。
- `e`：支持项数组，条目是紧凑格式条目的超集。
- `cl`：完整主控列表。fdbgen 只消费 `n` 作为控制器名称；其他字段供提取链路和后续规则使用。
- `m`：顶层元数据，可选。提取来源、工具版本、抓取时间等结构定义未规定信息写这里。

完整格式条目扩展字段：

- `vd`：NAND 厂商提示，只用于 PN 归属候选，不强制覆盖 PN / Flash ID 判断。
- `c`：单元类型，进入 PN 记录的 `c` 字段。
- `cap`：容量文本或提取工具标准化容量。
- `pkg`：封装文本。
- `w`：位宽或总线位宽文本。
- `m`：条目元数据。无法稳定标准化的提取信息写这里。

完整格式控制器 `cl[]` 字段：

- `n`：控制器规范名称。
- `a`：控制器别名数组。
- `mf`：控制器制造商 / 系列所属方。
- `if`：控制器接口或应用接口。
- `fw`：固件系列。
- `rev`：修订版。
- `st`：状态。
- `m`：控制器元数据。结构定义未规定的控制器信息写这里。

## 导入语义

导入后的 PN/ID 清理、厂商准入、控制器黑名单和关系方向见 [FDBGen 合并规则](FDBGEN.md#合并与归一化规则)。紧凑格式不允许元数据；完整格式的 `m` 仅供提取工具和后续规则消费，不写入生成后的 FDB 载荷。

需要对单条条目调整准入时，使用 `mergeFdnextFdbgenV1Document` 的 `mapEntry` 回调，例如清除丝印的 `pn` 后交回标准导入；Phison UFD 的应用见 [控制器模块](FDBGEN.md#控制器厂商模块)。

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

推荐由提取工具转换为紧凑格式：

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

如果提取工具能拿到完整主控列表、原始 FlashName、来源版本等信息，则输出完整格式；无法标准化的信息写入 `m`。控制器黑名单属于 fdbgen 配置，提取工具不需要删除黑名单项；保留原始控制器名能让后续规则变化时重新生成。
