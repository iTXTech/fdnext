# Server 接口文档

本文档是 fdnext HTTP 接口的事实源。Hapi server、Cloudflare Workers adapter 和阿里云 FC adapter 都复用 `@itxtech/fdnext-core` 的路由解析与响应 contract；部署文档只说明平台配置，不重复维护接口表。

## 1. 基础约定

- 正式接口只使用 `GET` / `HEAD`；serverless adapter 支持 CORS preflight `OPTIONS`。
- 所有正式接口返回 JSON，并带 `content-type: application/json; charset=utf-8`。
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
| `limit` | search | 正整数，限制搜索结果数量。非法或缺省时使用默认行为。 |
| `controllerGroup` | decode / search | 控制器投影视图。支持单值、逗号分隔或 repeated query，例如 `controllerGroup=if:sata,if:nvme`。 |
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
| `chipKind` | 否 | 约束 chip kind，例如 `raw_nand`、`managed_nand`、`dram`。 |
| `productType` | 否 | 约束产品类型，例如 `emmc`、`ufs`、`emcp`。 |
| `strict` | 否 | `true/false`、`1/0` 或 `yes/no`。开启后约束不满足会返回不匹配结果。 |

`vendor`、`chipKind`、`productType` 和 `strict` 会被映射到 SDK input 的 `constraints`。

### `GET /parts/search`

示例：

```bash
curl 'http://127.0.0.1:8080/parts/search?query=MTFC&lang=eng&limit=10&productType=ufs'
curl 'http://127.0.0.1:8080/parts/search?query=MT29&controllerGroup=if:sata&controllerGroup=if:nvme'
```

参数与 `/parts/decode` 相同，另支持 `limit`。

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
curl 'http://127.0.0.1:8080/identifiers/search?query=2C8464&controllerGroup=if:sata,if:nvme'
```

参数与 `/identifiers/decode` 相同，另支持 `limit`。

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

Hapi server 默认放开所有来源，适合本地服务或由上游网关控制跨域的部署。

Cloudflare Workers 和阿里云 FC adapter 通过环境变量 `FDNEXT_CORS_ORIGINS` 控制 CORS：

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

规则：

- `*` 返回 `Access-Control-Allow-Origin: *`。
- 多个 origin 可用逗号、空格或换行分隔。
- 精确命中 origin 时返回该 origin，并附带 `Vary: Origin`。
- `OPTIONS` preflight 返回 `204`，`Access-Control-Allow-Methods` 为 `GET, HEAD, OPTIONS`，并透传 `Access-Control-Request-Headers`。
