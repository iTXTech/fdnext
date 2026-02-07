# fdnext Implementation Plan

This repository implements a TypeScript rewrite of FlashDetector with:

- pnpm workspace monorepo
- modular core engine
- standalone server package
- embeddable browser-safe core package
- JSON DSL compiler for decoder templates
- compatibility testing hooks against PHP outputs

## Baseline

- Node.js 24 LTS
- ESNext language target

## Scope

- keep HTTP API shape and error messages compatible with FDWebServer
- remove online decoder crawlers (Micron/SpecTek web scraping)
- optimize architecture with clear boundaries: domain, decoding pipeline, transport

## Milestones

1. workspace setup and package boundaries
2. core domain + resource loading
3. decoder and flash-id pipeline
4. HTTP compatibility layer
5. CLI + FDB generator migration shell
6. fixture-based compat test and release workflow
