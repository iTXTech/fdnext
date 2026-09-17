# @itxtech/fdnext-fdbgen

Repository tools for FDB generation, PN–Flash ID association audits, and Micron/SpecTek marking database crawling.

From the repository root, using Node.js 24.11+ and pnpm 12+:

```bash
pnpm install
pnpm fdbgen:generate --input ./dataset --output ./fdb.json --version 1 --pretty
pnpm exec tsx packages/fdbgen/src/cli.ts audit --file ./fdb.json
```

Input can be a structured dataset or raw FlashDB controller directories. Output is sorted `fdnext.fdb.v1` JSON. `pnpm fdbgen:audit` audits the bundled FDB; `pnpm fdbgen:crawl-mdb --file ./mdb.json` crawls marking data.

See the [FDBGen guide](https://github.com/iTXTech/fdnext/blob/master/docs/FDBGEN.md) for input examples, CLI options, and the source API.
