# iTXTech fdnext

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Release](https://img.shields.io/github/v/release/iTXTech/fdnext?include_prereleases)](https://github.com/iTXTech/fdnext/releases)

**fdnext** is a memory chip parsing engine for part-number (PN) decoding, NAND Flash ID decoding, and database searches across multiple vendors and memory technologies.

## Try it online

[FlashMaster](https://github.com/iTXTech/FlashMaster) uses fdnext to help engineers look up and analyze memory chips.

[Open the FlashMaster web app](https://fm.itxtech.org)

## Features

fdnext turns vendor data into structured results, enriches fields from local resources, and validates output against a shared result contract.

- **Part-number decoding:** raw NAND, eMMC, UFS, DRAM, and other memory chips.
- **Flash ID decoding:** NAND Flash IDs through the typed identifier API.
- **Resource search:** bundled FDB, MDB, and translations, including Micron FBGA lookup.
- **Request dispatch:** a shared runtime for Node.js HTTP and Cloudflare Workers.
- **Data tools:** FDB/MDB generation, crawling, DecodePack management, and evidence metadata audits.

## Packages

fdnext is a strict TypeScript monorepo. The core includes default rules and resources; adapters provide platform integration.

| Published npm package | Purpose |
| --- | --- |
| [@itxtech/fdnext-core](https://www.npmjs.com/package/@itxtech/fdnext-core) | Engine, rules, compiler, resources, result contracts, CLI, and shared runtime |
| [@itxtech/fdnext-server](https://www.npmjs.com/package/@itxtech/fdnext-server) | Node.js HTTP server |
| [@itxtech/fd-server](https://www.npmjs.com/package/@itxtech/fd-server) | Legacy FlashDetector / FDWebServer API for FlashMaster Classic, with Workers and Node.js deployment |

Repository packages also include the [Workers adapter](packages/cf-workers/README.md), [FDBGen data tools](packages/fdbgen/README.md), and [contract test suite](packages/contract-test/README.md).

## Documentation

- [Documentation index](docs/README.md)
- [Integration guide](docs/INTEGRATION.md)
- [Development and validation (Chinese)](docs/TESTING.md)
- [Vendor and product references (Chinese)](docs/pn_code/README.md)

## License

Copyright (c) 2019–2026 iTX Technologies.

Licensed under the GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).
