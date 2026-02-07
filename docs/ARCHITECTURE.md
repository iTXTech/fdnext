# Architecture

## Packages

- `@fdnext/core`: pure decoding/search engine
- `@fdnext/dsl`: JSON DSL schema + compiler to core decoders
- `@fdnext/server`: Node HTTP server with legacy-compatible routes
- `@fdnext/cli`: command tools for local usage
- `@fdnext/compat-test`: fixture and diff helpers

## Layers

1. domain/data: fdb + mdb + language resources
2. decode pipeline: normalize -> match decoder -> merge fdb -> processors -> translate
3. transport: HTTP and CLI wrappers

## Design goals

- browser and node portability for core
- deterministic behavior with no runtime network dependency
- explicit extension points for processors and decoders
