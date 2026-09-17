# FDBGen v1 support-list format

`fdnext fdbgen v1` is a standard output format for extraction tools, replacing controller-specific JSON field names. It defines two variants:

- Compact: `v = "fdnext.fdbgen.v1c"`, containing PNs, full Flash IDs, and supported controllers.
- Full: `v = "fdnext.fdbgen.v1f"`, retaining compact entry semantics and adding standard extensions, a complete controller list, and metadata.

Structured keys use short abbreviations. Entry fields may be missing; fdbgen consumes only enough valid information to form a record.

Schemas:

- [Combined schema](schemas/fdnext-fdbgen-v1.schema.json): `oneOf` entry for compact/full formats.
- [Compact schema](schemas/fdnext-fdbgen-v1-compact.schema.json).
- [Full schema](schemas/fdnext-fdbgen-v1-full.schema.json).

The fdbgen workspace exports `parseFdnextFdbgenV1` / `parseFdnextFdbgenV1Json` for document recognition, short-key reading, basic Flash ID/controller validation, and full-format metadata preservation.

`mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry` centralize PN cleanup, vendor-prefix admission, controller normalization, trusted PN insertion, and untrusted PN fallback to `iddb`. Controller importers map their raw fields to `vendor/partNumber/flashId/controllers/cellLevel`; standard v1 JSON can use `mergeFdnextFdbgenV1SupportList` directly.

## Compact format

Only top-level `v/e` and entry `pn/id/t` are permitted. Metadata is not allowed.

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

- `pn`: optional PN candidate. Further cleanup and vendor-prefix/Flash ID compatibility checks apply. Untrusted candidates do not enter the PN table.
- `id`: optional full NAND Flash ID. IDs admitted to the FDB must contain whole bytes in uppercase contiguous hexadecimal, without whitespace or separators.
- `t`: optional controller array. An entry without controllers produces no output.

## Full format

Entries retain compact `pn/id/t` semantics and may add standard extensions and metadata. Put extractor-defined information in `m`, not in arbitrary entry or controller fields.

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

Top-level fields:

- `v`: fixed to `fdnext.fdbgen.v1f`.
- `e`: support entries, a superset of compact entries.
- `cl`: complete controller list. fdbgen consumes `n` as the controller name; other fields serve extraction and future rules.
- `m`: optional metadata, such as source, tool version, and crawl time.

Entry extensions:

- `vd`: NAND vendor hint for PN ownership; does not override PN/Flash ID evidence.
- `c`: cell type, imported into PN field `c`.
- `cap`: capacity text or extractor-normalized capacity.
- `pkg`: package text.
- `w`: width or bus-width text.
- `m`: entry metadata that cannot be reliably standardized.

Controller fields in `cl[]`:

- `n`: canonical controller name.
- `a`: controller aliases.
- `mf`: controller manufacturer or family owner.
- `if`: controller/application interface.
- `fw`: firmware family.
- `rev`: revision.
- `st`: status.
- `m`: controller metadata outside the standard fields.

## Import semantics

See [FDBGen merge rules](FDBGEN.md#merge-and-normalization) for PN/ID cleanup, vendor admission, controller blacklists, and relation direction. Full-format `m` is retained for extraction tools and future rules, but is not written into the generated FDB payload.

Use the `mapEntry` callback of `mergeFdnextFdbgenV1Document` to adjust individual entries, for example to clear a marking-code `pn` before standard import. See [Controller modules](FDBGEN.md#controller-modules) for Phison UFD handling.

## Legacy FirstChip JSON

Legacy input:

```json
[
  {
    "FlashName": "MT29F128G08CBCEB(L05B)--2C844432AA04",
    "FlashID": "2C844432AA04",
    "SupportedControllers": ["ZC3281", "FC3379", "3281FL", "3379FL"]
  }
]
```

An extractor can convert it to compact format:

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

Use full format when the complete controller list, original FlashName, source version, or similar details are available; put unstandardized information in `m`. Controller blacklisting belongs to fdbgen configuration. Extractors retain original controller names so data can be regenerated when rules change.
