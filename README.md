# iTXTech fdnext

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version](https://img.shields.io/github/v/release/iTXTech/fdnext?include_prereleases)](https://github.com/iTXTech/fdnext/releases)

**fdnext** is a high-performance, one-stop parsing engine for memory chips. It provides comprehensive support for part-number (PN) decoding, NAND Flash ID inspection, and database searches across multiple vendors and storage technologies.

[简体中文](README-zh.md)

---

### 🚀 Try it in Action
**[FlashMaster](https://github.com/iTXTech/FlashMaster)** is the flagship implementation of the `fdnext` engine—a workstation-grade intelligence platform for engineers.

[**👉 Open FlashMaster Web App**](https://fm.itxtech.org)

---

## ✨ Overview

`fdnext` is designed as the backbone for memory chip intelligence. It normalizes complex vendor data into structured, actionable information, enriched with local resources and verified against strict result contracts.

### Core Workflows
- **Part Number Decoding:** Instant decoding of raw NAND, eMMC, UFS, DRAM, and more.
- **Flash ID Decoding:** Deep inspection of NAND Flash IDs through a typed identifier API.
- **Smart Resource Flow:** Bundled `fdb`, `mdb`, and language packs with Micron FBGA code lookup.
- **Universal Dispatch:** Shared runtime layer for native Node.js HTTP, Cloudflare Workers, and Aliyun FC.
- **Data Maintenance:** CLI tools for FDB/MDB generation, crawling, and DecodePack management.

---

## 🏗️ Architecture

`fdnext` is organized as a strict TypeScript monorepo. The main package is now batteries-included, while platform packages stay thin adapters.

- **Core ([`@itxtech/fdnext-core`](packages/core)):** Engine, DecodePack rules/compiler, embedded resources, result contract, and shared runtime.
- **Adapters:** Native support for [Node.js HTTP](packages/server), [Cloudflare Workers](packages/cf-workers), and [Aliyun FC](packages/aliyun-fc).
- **Legacy compatibility:** [`@itxtech/fd-server`](packages/fd-server) exposes the old FlashDetector / FDWebServer HTTP API for FlashMaster Classic migration deployments, with Cloudflare Workers as the preferred deployment path.

---

## 🛠️ Toolchain & Development

This project uses [pnpm](https://pnpm.io/) for workspace management.

### Prerequisites
- Node.js 24+
- pnpm 10+

### Quick Start
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run test suite
pnpm test
```

### Useful Commands
| Command | Description |
| :--- | :--- |
| `pnpm build` | Build all packages in the workspace |
| `pnpm test` | Run all unit and integration tests |
| `pnpm typecheck` | Run TypeScript type checks across the repo |
| `pnpm contract:check` | Validate result schema and behavior contracts |
| `pnpm check:decodepack` | Validate DecodePack structure and maintenance policies |
| `pnpm check:static` | Run TypeScript and DecodePack static checks |
| `pnpm check` | Run the fast static and DecodePack rule gate |
| `pnpm check:pr` | Build once, then run the complete source/package contract gate |
| `pnpm lint` | Alias for `pnpm check:static` |

---

## 📊 Parsing Coverage

| Area | Product Families | Supported Vendors |
| :--- | :--- | :--- |
| **NAND PN** | Raw NAND, eMMC, UFS, eMCP/uMCP, E2NAND | Samsung, SK hynix, SanDisk/WD, KIOXIA, Micron, YMTC, Kingston, Longsys, BIWIN, Silicon Motion |
| **DRAM PN** | DDR, LPDDR (Density, Gen, Package, Speed, etc.) | Micron, Crucial, SK hynix, Samsung, Nanya, Elpida, CXMT, GigaDevice, ISSI, Winbond |

---

## 📖 Documentation

The unified documentation index can be found in [**docs/README.md**](docs/README.md).

- [**Integration Guide**](docs/INTEGRATION.md): SDK, HTTP server, and deployment.
- [**Server API**](docs/SERVER_API.md): Routes, parameters, and response contracts.
- [**FlashDetector Compatibility Server**](packages/fd-server/README.md): `fd-server` deployment for FlashMaster Classic clients, including Cloudflare Workers and Node.js options.
- [**DecodePack Spec**](docs/DECODEPACK.md): Writing PN and identifier rules.
- [**FDBGen Guide**](docs/FDBGEN.md): Database generation and crawling.
- [**Terminology**](docs/pn_code/terminology.md): Canonical field keys and naming conventions.

---

## ⚖️ License

Copyright (c) 2019-2026 iTX Technologies

This project is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](LICENSE) file for details.
