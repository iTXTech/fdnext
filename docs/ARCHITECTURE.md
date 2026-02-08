# Architecture

## Packages

- `@fdnext/core`: pure decoding/search engine
- `@fdnext/dsl`: JSON DSL schema + compiler to core decoders
- `@fdnext/server`: Node HTTP server (Hapi), standalone deployment via PM2 or direct invocation
- `@fdnext/cli`: command-line decode/search tool (does not depend on server)
- `@fdnext/compat-test`: fixture and diff helpers

## Layers

1. domain/data: fdb + mdb + language resources
2. decode pipeline: normalize -> match decoder -> merge fdb -> processors -> translate
3. transport: HTTP and CLI wrappers

## Design goals

- browser and node portability for core
- deterministic behavior with no runtime network dependency
- explicit extension points for processors and decoders
- low coupling: `@fdnext/core` does not embed vendor decode logic
- high cohesion: vendor parsing lives in `@fdnext/dsl` rule packs
- CLI and server are independent — CLI depends only on core + dsl
