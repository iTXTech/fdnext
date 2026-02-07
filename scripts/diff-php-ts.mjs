import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createEngine } from "../packages/core/dist/index.js";
import { loadResourcesFromDir } from "../packages/core/dist/loaders/node.js";
import {
  compileFlashIdRulesToDecoders,
  compileRulesToDecoders,
  defaultDslRules,
  defaultFlashIdRules
} from "../packages/dsl/dist/index.js";

const ROOT = resolve(import.meta.dirname, "..");
const FIXTURE_PATH = resolve(process.env.FDNEXT_FIXTURES ?? resolve(ROOT, "packages/compat-test/fixtures/php-baseline.json"));
const RESOURCE_DIR = resolve(process.env.FDNEXT_RESOURCES ?? resolve(ROOT, "resources"));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = stable(value[key]);
    return result;
  }
  return value;
}

function executeTs(caseDef) {
  const engine = createEngine({
    resources: loadResourcesFromDir(RESOURCE_DIR),
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });

  const lang = caseDef.params.lang ?? null;
  const limit = Number(caseDef.params.limit ?? 0) || 0;

  switch (caseDef.endpoint) {
    case "decode":
      return caseDef.params.pn
        ? { result: true, data: engine.detect(caseDef.params.pn, { lang, combineFdb: true }) }
        : { result: false, message: "Missing part number" };
    case "decodeId":
      return caseDef.params.id
        ? { result: true, data: engine.decodeFlashId(caseDef.params.id, { lang, combineFdb: true }) }
        : { result: false, message: "Missing Flash Id" };
    case "searchPn":
      return caseDef.params.pn
        ? { result: true, data: engine.searchPartNumber(caseDef.params.pn, { lang, partialMatch: true, limit }) }
        : { result: false, message: "Missing part number" };
    case "searchId":
      return caseDef.params.id
        ? { result: true, data: engine.searchFlashId(caseDef.params.id, { lang, partialMatch: true, limit }) }
        : { result: false, message: "Missing Flash Id" };
    case "summary":
      return caseDef.params.pn
        ? { result: true, data: engine.getSummary(caseDef.params.pn, lang) }
        : { result: false, message: "Missing part number" };
    case "summaryId":
      return caseDef.params.id
        ? { result: true, data: engine.getIdSummary(caseDef.params.id, lang) }
        : { result: false, message: "Missing flash Id" };
    default:
      return { result: false, message: "Not found" };
  }
}

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
const failures = [];
for (const item of fixture.fixtures) {
  const tsActual = executeTs(item);
  const same = JSON.stringify(stable(item.php)) === JSON.stringify(stable(tsActual));
  if (!same) failures.push({ name: item.name, endpoint: item.endpoint, params: item.params, php: item.php, ts: tsActual });
}

if (failures.length === 0) {
  process.stdout.write(`Compat diff passed: ${fixture.fixtures.length}/${fixture.fixtures.length}\n`);
} else {
  process.stdout.write(`Compat diff failed: ${fixture.fixtures.length - failures.length}/${fixture.fixtures.length} passed\n`);
  for (const failure of failures) {
    process.stdout.write(`\n[${failure.name}] ${failure.endpoint}\n`);
    process.stdout.write(`params: ${JSON.stringify(failure.params)}\n`);
    process.stdout.write(`php: ${JSON.stringify(failure.php, null, 2)}\n`);
    process.stdout.write(`ts : ${JSON.stringify(failure.ts, null, 2)}\n`);
  }
  process.exitCode = 1;
}
