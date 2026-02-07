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
