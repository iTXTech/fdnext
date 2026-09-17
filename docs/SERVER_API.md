# HTTP API reference

This document defines the standard fdnext HTTP API. The Node.js server and Cloudflare Workers adapter share routing and response contracts from `@itxtech/fdnext-core`; deployment guides cover platform configuration.

## 1. Conventions

- API routes accept `GET` / `HEAD`; adapters support CORS preflight through `OPTIONS`.
- Responses are JSON with `content-type: application/json; charset=utf-8`.
- The Node.js adapter sends `Cache-Control: no-cache`. When the client accepts gzip, JSON responses larger than 1 KiB are compressed with `Vary: Accept-Encoding`.
- All adapters send `X-Powered-By: fdnext/<version>`.
- Unmatched paths or unsupported methods return `{ "status": "not_found", "name": "<serverName>" }`.
- Decode/search outcomes are reported by response `status`. `invalid_input` and `unsupported` use HTTP 400; other normal responses use HTTP 200.

The standard API does not expose `/info`, `/decode`, `/decodeId`, `/searchPn`, `/searchId`, `/summary`, `/summaryId`, or `/health`. Legacy routes are provided separately by [fd-server](../packages/fd-server/README.md).

## 2. Route overview

| Method | Path | Operation | Purpose |
| --- | --- | --- | --- |
| `GET` / `HEAD` | `/` | `index` | Health check with server name and fdnext version |
| `GET` / `HEAD` | `/capabilities` | `capabilities` | Version, build metadata, resource inventory, controller groups, decoders, and capabilities |
| `GET` / `HEAD` | `/parts/decode` | `part.decode` | Decode a PN, FBGA/marking code, or another query recognized by the part API |
| `GET` / `HEAD` | `/parts/search` | `part.search` | Search PNs and marking codes for candidates |
| `GET` / `HEAD` | `/identifiers/decode` | `identifier.decode` | Decode a typed identifier; defaults to NAND Flash ID |
| `GET` / `HEAD` | `/identifiers/search` | `identifier.search` | Search typed identifiers; defaults to NAND Flash ID |

## 3. Common parameters

| Parameter | Applies to | Meaning |
| --- | --- | --- |
| `query` | Decode/search | Query text. Preserve PN formatting; NAND Flash IDs accept contiguous hex or common separators. |
| `lang` | All API routes | Optional language, such as `eng` or `chs`. `/capabilities?lang=eng` returns English controller group titles. |
| `limit` | Search | Positive integer that can only lower the server cap. Missing, invalid, or higher values use the cap. |
| `controllerGroup` | Decode | Controller projection. Accepts a single value, comma-separated values, or repeated parameters, e.g. `controllerGroup=if:sata,if:nvme`. Ignored by search. |
| `idScheme` | Identifiers | Identifier namespace; defaults to `nand.flash_id` and normally need not be specified. |

Public controller groups: `all`, `selected`, `if:usb20`, `if:usb32g1`, `if:usb32g2`, `if:sata`, `if:nvme`, `era:pre18`, and `era:plus18`.

`all` is the complete controller list; `selected` is a curated set; the others project by interface or era. Multiple groups form a union.

HTTP search defaults to a cap of 300. Set `FDNEXT_SEARCH_LIMIT` to a positive safe integer to change it; invalid values fall back to 300. SDK search has separate [browser integration semantics](INTEGRATION.md#2-browser-integration).

## 4. Part API

### `GET /parts/decode`

```bash
curl 'http://127.0.0.1:8080/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8080/parts/decode?query=MT62F1G64D4EK-023%20WT:B&lang=chs&chipKind=dram&strict=true'
```

| Parameter | Required | Meaning |
| --- | --- | --- |
| `query` | Yes | PN, FBGA/marking code, or another query recognized by the part API |
| `lang` | No | Output language |
| `controllerGroup` | No | Controller projection |
| `vendor` | No | Vendor key constraint, e.g. `micron`, `samsung` |
| `chipKind` | No | Chip-kind constraint, e.g. `raw_nand`, `managed_nand`, `3d_xpoint`, `dram` |
| `productType` | No | Product-type constraint, e.g. `emmc`, `ufs`, `emcp` |
| `strict` | No | `true/false`, `1/0`, or `yes/no`; unmet constraints produce a non-match result when enabled |

`vendor`, `chipKind`, `productType`, and `strict` map to SDK input `constraints`.

### `GET /parts/search`

```bash
curl 'http://127.0.0.1:8080/parts/search?query=MTFC&lang=eng&limit=10&productType=ufs'
curl 'http://127.0.0.1:8080/parts/search?query=C9BJZ&lang=eng&limit=5'
```

Accepts the same required `query` and optional `lang`, `vendor`, `chipKind`, `productType`, and `strict` parameters as part decode. Optional `limit` is a positive integer subject to the server cap. `controllerGroup` is ignored, including in older URLs.

Search returns summary candidates without controller fields. Use `/parts/decode` for full controllers and FDB enrichment.

## 5. Identifier API

### `GET /identifiers/decode`

```bash
curl 'http://127.0.0.1:8080/identifiers/decode?query=2C64444BA900&lang=eng'
curl 'http://127.0.0.1:8080/identifiers/decode?query=2C,64,44,4B,A9,00&lang=chs&idScheme=nand.flash_id'
```

| Parameter | Required | Meaning |
| --- | --- | --- |
| `query` | Yes | Typed identifier, currently primarily a NAND Flash ID |
| `lang` | No | Output language |
| `controllerGroup` | No | Controller projection |
| `idScheme` | No | Defaults to `nand.flash_id`; explicit selection is available for identifier schemes |

### `GET /identifiers/search`

```bash
curl 'http://127.0.0.1:8080/identifiers/search?query=2C64&lang=eng&limit=10'
curl 'http://127.0.0.1:8080/identifiers/search?query=2C8464&lang=eng&limit=10'
```

Requires `query` and accepts optional `lang`, `idScheme`, and positive integer `limit`. `idScheme` defaults to `nand.flash_id`; `limit` is subject to the server cap.

Search retains geometry and related PNs but omits controller fields. Use `/identifiers/decode` for full controller projection. `controllerGroup` is ignored, including in older URLs.

## 6. Capabilities

### `GET /capabilities`

```bash
curl 'http://127.0.0.1:8080/capabilities'
curl 'http://127.0.0.1:8080/capabilities?lang=eng'
```

The `fdnext.capabilities.v2` response includes:

- `server.version`, `server.build.commitHash`, and `server.build.buildTime`
- `fdb` dataset information
- `inventory.controllers`, default controller groups, and each group's `title` / `description` / `exclusive` / `items`
- `inventory.metrics`: display labels and resource counts supplied in the requested language
- PN and identifier decoder lists
- Public capabilities

SDK `engine.getCapabilities({ lang })` returns the same structure as HTTP `/capabilities?lang=<lang>`.

## 7. Response structure

Decode responses use `fdnext.result.v2` with `schemaVersion`, `operation`, `status`, `input`, `device`, `subtitle`, `summary`, `blocks[]`, `relations[]`, `links[]`, `warnings[]`, and `candidates[]`.

`summary.brief[]` contains key parameters ordered by memory type. `summary.full[]` contains complete parameter groups and matches `blocks[]`.

Search responses also use `fdnext.result.v2`, with results in `items[]`. Read structured fields:

- Device identity: `device.vendor.id`, `device.chipKind`, `device.productType`, `device.partNumber`, `device.identifier`
- Detailed fields: `blocks[].fields[].key/value/display`
- Search fields: `items[].fields[].key/value/display`
- Related actions: `relations[].action`
- Platform links: `links[]` or `items[].links[]`

Do not infer business semantics from `label`, `display`, or translated text; those are for presentation.

## 8. CORS

The standard Node.js server and Workers adapter use `FDNEXT_CORS_ORIGINS`:

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

- `*` sends `Access-Control-Allow-Origin: *`.
- Separate origins with commas, spaces, or newlines.
- An exact match sends that origin and `Vary: Origin`.
- `OPTIONS` preflight returns 204 with `Access-Control-Allow-Methods: GET, HEAD, OPTIONS` and echoes `Access-Control-Request-Headers`.
- When unset, no CORS headers are sent.

Classic defaults differ; see [fd-server environment variables](../packages/fd-server/README.md#environment-variables).
