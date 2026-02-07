# DSL Specification (JSON)

A rule maps string patterns to partial decode output.

```json
{
  "id": "vendor.micron.prefix.mt",
  "priority": 10,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "MT" },
  "set": {
    "vendor": "micron",
    "type": "nand"
  }
}
```

Supported `match.kind`:

- `prefix`
- `regex`

The compiler converts rules to `PartNumberDecoder` instances consumed by `@fdnext/core`.

## Advanced Token Decoder

For structured part numbers, use `tokenDecoder` to parse by declarative steps instead of writing per-vendor TS files.

```json
{
  "id": "vendor.micron.token.v1",
  "priority": 1000,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "regex", "value": "^(MT|29)" },
  "tokenDecoder": {
    "stripPrefixes": ["MT", "29"],
    "tables": {
      "density": { "64G": 65536 }
    },
    "steps": [
      { "op": "takeLongest", "table": "density", "to": "density", "default": null }
    ],
    "assign": {
      "vendor": "micron",
      "density": { "$var": "density" }
    }
  }
}
```

Supported `tokenDecoder.steps`:

- `take`: consume fixed-length token from `rest`
- `takeLongest`: consume the longest matching key from a lookup table
- `map`: map a captured token through a lookup table

## FlashId DSL

FlashId decoders can be expressed as bitfield definitions per byte offset (hex string id, 12 chars), compiled to `FlashIdDecoder`.
