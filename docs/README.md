# Documentation index

This index lists document entry points and responsibilities. Keep full specifications in one place; package READMEs retain the short examples needed to get started.

| Document | Scope |
| --- | --- |
| [Validation (Chinese)](TESTING.md) | Repository setup, development commands, check selection, build reuse, and PN coverage audits |
| [Integration](INTEGRATION.md) | SDK, browser resources, server startup, and deployment |
| [HTTP API](SERVER_API.md) | Routes, parameters, responses, status behavior, and CORS |
| [Cloudflare Workers](CF_WORKERS.md) | Wrangler configuration, local development, deployment, and external links |
| [FlashDetector compatibility server](../packages/fd-server/README.md) | Classic migration, legacy routes, and Workers / Node.js deployment |
| [FDBGen](FDBGEN.md) | FDB generation, MDB crawling, input structures, and normalization |
| [FDBGen v1 support-list format](FDBGEN_FORMAT_V1.md) | Standard JSON input for extraction tools |
| [DecodePack](DECODEPACK.md) | JSON syntax, compiler API, rule registration, and diagnostics |
| [PN references (Chinese)](pn_code/README.md) | Vendor/product references and maintenance boundaries |
| [PN authoring (Chinese)](pn_code/authoring.md) | Token structure, package evidence, search resource deduplication, and completion criteria |
| [Reference policy (Chinese)](pn_code/reference_policy.md) | Evidence admission levels and source metadata ownership |
| [Public field terminology](pn_code/terminology.md) | Public field keys and display terms |
| [NAND die profiles (Chinese)](pn_code/nand_die_profile.md) | Shared keys, firmware naming, and fallback normalization |
| [DRAM coverage method (Chinese)](pn_code/dram_coverage.md) | Organization of vendor generation research |
| [Contract tests](../packages/contract-test/README.md) | Source API and package checks |
| [PN coverage audit (Chinese)](pn_code/coverage_audit.md) | Dated coverage measurements and research findings |
| [Field information audit (Chinese)](pn_code/field_information_audit.md) | Dated migration evidence and information preservation |
| [FDB 87 association audit (Chinese)](pn_code/evidence/pn-flash-id-matching-2026-09.md) | Dated PN–ID examples and dataset metrics |

## Document ownership

- The root README introduces the project. Package READMEs cover purpose, setup, and minimal usage. Package-specific content without another owner, such as Classic deployment and the contract-test source API, stays there.
- Integration, runtime, HTTP, and maintenance references live in `docs/`. `SERVER_API.md` owns shared HTTP behavior; deployment guides link to its route table.
- Vendor PN structures, source explanations, code tables, and examples belong in `docs/pn_code/<vendor>_<product>.md`. Source admission belongs in `reference_policy.md`; public naming belongs in `terminology.md`.
- Audits record dates, measurements, methods, and unresolved observations. Current rules belong in specifications and vendor references. Preserve unique facts before consolidating content; historical measurements are not current coverage.
- `AGENTS.md` owns repository work boundaries, `pn_code/authoring.md` owns PN authoring, and `TESTING.md` owns validation. Other documents link to these rather than copying procedures. Read only sections relevant to the task.

## Language and links

- Write the root and package READMEs, this index, integration/deployment guides, HTTP API, DecodePack, FDBGen and its input format, and public field reference in English. Internal instructions, maintenance procedures, vendor research, and audits may use Chinese; label links to them `Chinese`.
- Maintain one primary language version. Keep technical identifiers, official source titles, quotations, license text, and literal localized field labels unchanged. Translation must preserve behavior, field values, evidence strength, and unknown/inferred/confirmed distinctions.
- Package README cross-file links use full GitHub URLs, such as `https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md`; same-page anchors remain local. Root and `docs/` links may be relative. Update incoming anchors when headings change.
