# fdnext

TypeScript rewrite of FlashDetector with:

- modular core engine
- independent HTTP server
- embeddable frontend library
- JSON DSL compiler for string decode templates

## Runtime Baseline

- Node.js 24 LTS
- TypeScript target: ESNext

## Workspace

```bash
pnpm install
pnpm sync:resources
pnpm -r build
```

## Packages

- `@fdnext/core`
- `@fdnext/dsl`
- `@fdnext/server`
- `@fdnext/cli`
- `@fdnext/compat-test`
