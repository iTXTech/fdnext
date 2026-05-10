# Documentation Index

This directory is the canonical home for fdnext usage, maintenance, and rule-authoring documentation. The root README stays as a product and package overview.

| Document | Scope |
| --- | --- |
| [Integration guide](INTEGRATION.md) | SDK setup, browser resources, server startup, deployment notes, and HTTP endpoints |
| [FDBGen documentation](FDBGEN.md) | FDB generation, MDB crawling, raw input layout, cleanup rules, and crawler behavior |
| [DSL specification](DSL_SPEC.md) | PN and typed identifier DSL authoring, output fields, and validation commands |
| [PN code reference index](pn_code/README.md) | Vendor/product-line PN reference documents and maintenance boundaries |
| [PN reference confidence policy](pn_code/reference_policy.md) | Rule admission tiers and where source-confidence metadata may live |
| [Cross-vendor terminology](pn_code/terminology.md) | Canonical public field keys and display terminology |

Documentation boundaries:

- Keep root `README.md` and `README-zh.md` overview-only.
- Put integration, runtime, and maintenance procedures in this `docs/` directory.
- Put vendor-specific PN structures, source notes, token tables, and examples in `docs/pn_code/<vendor>_<product>.md`.
- Put source-confidence rules in `docs/pn_code/reference_policy.md` and public field naming in `docs/pn_code/terminology.md`.
