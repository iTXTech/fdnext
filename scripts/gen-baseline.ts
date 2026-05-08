import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createBaselineBundle, writeBaselineBundle } from "../packages/compat-test/src/index";

const thisDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(thisDir, "..");
const outputPath = resolve(process.env.FDNEXT_BASELINE ?? resolve(root, "packages/compat-test/fixtures/baseline.json"));

const bundle = createBaselineBundle();
writeBaselineBundle(outputPath, bundle);

process.stdout.write(`Generated ${bundle.fixtures.length} baseline fixtures\n`);
