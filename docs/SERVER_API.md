# Server 接口文档

本文档是 fdnext HTTP 接口的事实源。原生 Node.js server、Cloudflare Workers adapter 和阿里云 FC adapter 都复用 `@itxtech/fdnext-core` 的路由解析与响应 contract；部署文档只说明平台配置，不重复维护接口表。

## 1. 基础约定

- 正式接口只使用 `GET` / `HEAD`；serverless adapter 支持 CORS preflight `OPTIONS`。
- 所有正式接口返回 JSON，并带 `content-type: application/json; charset=utf-8`。
- Node.js adapter 返回 `Cache-Control: no-cache`；客户端接受 gzip 时，超过 1 KiB 的 JSON 响应会压缩并附带 `Vary: Accept-Encoding`。
- 所有 adapter 都会返回 `X-Powered-By: fdnext/<version>`。
- 未命中的路径或非正式方法当前返回 JSON body：`{ "status": "not_found", "name": "<serverName>" }`。
- 解码 / 搜索操作的业务状态由响应体 `status` 表达；`invalid_input` 和 `unsupported` 会使用 HTTP `400`，其他正常响应使用 HTTP `200`。

旧接口 `/info`、`/decode`、`/decodeId`、`/searchPn`、`/searchId`、`/summary`、`/summaryId` 和 `/health` 不再暴露。

## 2. 接口总览

| Method | Path | Operation | 说明 |
| --- | --- | --- | --- |
| `GET` / `HEAD` | `/` | `index` | 健康检查，返回 server name 和 fdnext version |
| `GET` / `HEAD` | `/capabilities` | `capabilities` | 服务版本、build metadata、资源库存、controller groups、decoder 清单和能力清单 |
| `GET` / `HEAD` | `/parts/decode` | `part.decode` | 解码单个 PN、FBGA / marking code 或可被 part API 识别的查询 |
| `GET` / `HEAD` | `/parts/search` | `part.search` | 搜索 PN / marking code，返回候选列表 |
| `GET` / `HEAD` | `/identifiers/decode` | `identifier.decode` | 解码 typed identifier，当前默认是 NAND Flash ID |
| `GET` / `HEAD` | `/identifiers/search` | `identifier.search` | 搜索 typed identifier，当前默认是 NAND Flash ID |

## 3. 通用参数

| 参数 | 适用接口 | 说明 |
| --- | --- | --- |
| `query` | decode / search | 查询文本。PN 保留原始格式即可；NAND Flash ID 可使用连续 hex，也可包含常见分隔符。 |
| `lang` | 全部正式接口 | 可选语言，例如 `eng`、`chs`。`/capabilities?lang=eng` 会返回英文 controller group 标题。 |
| `limit` | search | 正整数，只能把结果数调低；缺省、非法或高于服务端上限时均使用服务端上限。 |
| `controllerGroup` | decode | 控制器投影视图。支持单值、逗号分隔或 repeated query，例如 `controllerGroup=if:sata,if:nvme`。search 接口会忽略该参数。 |
| `idScheme` | identifiers | typed identifier namespace。当前默认 `nand.flash_id`，通常不需要显式传入。 |

当前公开 controller group：

- `all`
- `selected`
- `if:usb20`
- `if:usb32g1`
- `if:usb32g2`
- `if:sata`
- `if:nvme`
- `era:pre18`
- `era:plus18`

`all` 表示完整控制器清单；`selected` 是精选主控集合；其他 group 是按接口或时代维护的投影视图。多个 group 使用并集语义。

## 4. Part API

### `GET /parts/decode`

示例：

```bash
curl 'http://127.0.0.1:8080/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8080/parts/decode?query=MT62F1G64D4EK-023%20WT:B&lang=chs&chipKind=dram&strict=true'
```

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `query` | 是 | PN、FBGA / marking code 或 part API 可识别的查询文本。 |
| `lang` | 否 | 输出语言。 |
| `controllerGroup` | 否 | 控制器投影视图。 |
| `vendor` | 否 | 约束 vendor key，例如 `micron`、`samsung`。 |
| `chipKind` | 否 | 约束 chip kind，例如 `raw_nand`、`managed_nand`、`3d_xpoint`、`dram`。 |
| `productType` | 否 | 约束产品类型，例如 `emmc`、`ufs`、`emcp`。 |
| `strict` | 否 | `true/false`、`1/0` 或 `yes/no`。开启后约束不满足会返回不匹配结果。 |

`vendor`、`chipKind`、`productType` 和 `strict` 会被映射到 SDK input 的 `constraints`。

### `GET /parts/search`

示例：

```bash
curl 'http://127.0.0.1:8080/parts/search?query=MTFC&lang=eng&limit=10&productType=ufs'
curl 'http://127.0.0.1:8080/parts/search?query=C9BJZ&lang=eng&limit=5'
```

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `query` | 是 | PN、FBGA / marking code 或 part API 可识别的查询文本。 |
| `lang` | 否 | 输出语言。 |
| `limit` | 否 | 正整数，限制搜索结果数量。 |
| `vendor` | 否 | 约束 vendor key，例如 `micron`、`samsung`。 |
| `chipKind` | 否 | 约束 chip kind，例如 `raw_nand`、`managed_nand`、`3d_xpoint`、`dram`。 |
| `productType` | 否 | 约束产品类型，例如 `emmc`、`ufs`、`emcp`。 |
| `strict` | 否 | `true/false`、`1/0` 或 `yes/no`。开启后约束不满足会返回不匹配结果。 |

`/parts/search` 返回 summary 候选，不输出 controller 字段；完整 controller 和 FDB 补全信息由 `/parts/decode` 返回。为兼容旧 URL，额外传入 `controllerGroup` 会被忽略。

HTTP search 默认和硬上限均为 300。部署方可通过 `FDNEXT_SEARCH_LIMIT` 修改该上限；query 中显式传入更大的 `limit` 不会绕过上限。该约束只属于 HTTP runtime，不影响 Core SDK 省略 `limit` 时返回完整结果的行为。

## 5. Identifier API

### `GET /identifiers/decode`

示例：

```bash
curl 'http://127.0.0.1:8080/identifiers/decode?query=2C64444BA900&lang=eng'
curl 'http://127.0.0.1:8080/identifiers/decode?query=2C,64,44,4B,A9,00&lang=chs&idScheme=nand.flash_id'
```

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `query` | 是 | typed identifier。当前主要是 NAND Flash ID。 |
| `lang` | 否 | 输出语言。 |
| `controllerGroup` | 否 | 控制器投影视图。 |
| `idScheme` | 否 | 默认 `nand.flash_id`。未来有多个 identifier scheme 时再显式选择。 |

### `GET /identifiers/search`

示例：

```bash
curl 'http://127.0.0.1:8080/identifiers/search?query=2C64&lang=eng&limit=10'
curl 'http://127.0.0.1:8080/identifiers/search?query=2C8464&lang=eng&limit=10'
```

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `query` | 是 | typed identifier。当前主要是 NAND Flash ID。 |
| `lang` | 否 | 输出语言。 |
| `idScheme` | 否 | 默认 `nand.flash_id`。未来有多个 identifier scheme 时再显式选择。 |
| `limit` | 否 | 正整数，限制搜索结果数量。 |

`/identifiers/search` 保留 geometry 和关联 PN 列表，但不输出 controller 字段；完整 controller 投影由 `/identifiers/decode` 返回。为兼容旧 URL，额外传入 `controllerGroup` 会被忽略。

## 6. Capabilities

### `GET /capabilities`

示例：

```bash
curl 'http://127.0.0.1:8080/capabilities'
curl 'http://127.0.0.1:8080/capabilities?lang=eng'
```

响应 schema 为 `fdnext.capabilities.v2`，包含：

- `server.version`
- `server.build.commitHash`
- `server.build.buildTime`
- `fdb` 数据集信息
- `inventory.controllers`、默认 controller groups 和各 group 的 `title` / `description` / `exclusive` / `items`
- `inventory.metrics` 展示用资源统计，由后端按请求语言直接报告 label 和 count
- PN / identifier decoder 清单
- 当前公开能力清单

SDK 的 `engine.getCapabilities({ lang })` 与 HTTP `/capabilities?lang=<lang>` 返回同一份结构。

## 7. 响应结构

Decode 响应使用 `fdnext.result.v1`：

- `schemaVersion`
- `operation`
- `status`
- `input`
- `device`
- `subtitle`
- `blocks[]`
- `relations[]`
- `links[]`
- `warnings[]`
- `candidates[]`

Search 响应同样使用 `fdnext.result.v1`，核心结果放在 `items[]`。调用方应读取结构化字段：

- 设备身份：`device.vendor.id`、`device.chipKind`、`device.productType`、`device.partNumber`、`device.identifier`
- 详情字段：`blocks[].fields[].key/value/display`
- 搜索项字段：`items[].fields[].key/value/display`
- 关联动作：`relations[].action`
- 平台侧外部链接：`links[]` 或 `items[].links[]`

不要从 `label`、`display` 或翻译文本反推业务语义；这些文本只面向展示。

## 8. CORS

标准 Node.js server、Cloudflare Workers 和阿里云 FC adapter 都通过环境变量 `FDNEXT_CORS_ORIGINS` 控制 CORS：

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

规则：

- `*` 返回 `Access-Control-Allow-Origin: *`。
- 多个 origin 可用逗号、空格或换行分隔。
- 精确命中 origin 时返回该 origin，并附带 `Vary: Origin`。
- `OPTIONS` preflight 返回 `204`，`Access-Control-Allow-Methods` 为 `GET, HEAD, OPTIONS`，并透传 `Access-Control-Request-Headers`。
- 未设置时不返回 CORS response header。

FlashDetector 兼容层 `fd-server` 使用同一个变量和匹配规则，但为了保持旧客户端兼容，未设置时默认回退到 `*`。

所有现代 HTTP adapter 使用同一个 search 上限变量：

```text
FDNEXT_SEARCH_LIMIT=300
```

必须是正安全整数；非法值回退到 300。
