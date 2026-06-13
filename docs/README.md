# Documentation Index

This directory is the canonical home for fdnext usage, maintenance, and rule-authoring documentation. The root README stays as a product and package overview.

| Document | Scope |
| --- | --- |
| [Integration guide](INTEGRATION.md) | SDK setup, browser runtime data, server startup, and deployment notes |
| [Server API](SERVER_API.md) | Canonical HTTP routes, query parameters, response contract, status behavior, and CORS rules |
| [Cloudflare Workers deployment](CF_WORKERS.md) | Wrangler config, local dev, deployment, and Worker-specific External Link notes |
| [FDBGen documentation](FDBGEN.md) | FDB generation, MDB crawling, runtime data generation, raw input layout, cleanup rules, and crawler behavior |
| [fdnext fdbgen v1 support list](FDBGEN_FORMAT_V1.md) | Standard post-extraction support-list JSON format for fdbgen import tools |
| [DecodePack specification](DECODEPACK.md) | PN and typed identifier iTXTech fdnext DecodePack authoring, output fields, and validation commands |
| [PN code reference index](pn_code/README.md) | Vendor/product-line PN reference documents and maintenance boundaries |
| [PN reference confidence policy](pn_code/reference_policy.md) | Rule admission tiers and where source-confidence metadata may live |
| [Cross-vendor terminology](pn_code/terminology.md) | Canonical public field keys and display terminology |

Documentation boundaries:

- Keep root `README.md` and `README-zh.md` overview-only.
- Put integration, runtime, HTTP API, and maintenance procedures in this `docs/` directory.
- Keep shared server interface facts in `SERVER_API.md`; platform deployment guides should link to it instead of duplicating route tables.
- Put vendor-specific PN structures, source notes, token tables, and examples in `docs/pn_code/<vendor>_<product>.md`.
- Put source-confidence rules in `docs/pn_code/reference_policy.md` and public field naming in `docs/pn_code/terminology.md`.
