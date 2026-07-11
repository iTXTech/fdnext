import assert from "node:assert/strict";
import { runCliCommand as runPackagedCliCommand } from "@itxtech/fdnext-core/cli";
import { createContractEngine } from "../src/index";
import { assertCapabilitiesBuildTime, normalizeCapabilitiesForComparison, parseJsonObject, runCli } from "./_helpers";

const cliPartDecodePromise = runCli(["part", "decode", "MT62F1G64D4EK-023", "eng"]);

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();
const runInProcess = (args: string[]): Record<string, unknown> => {
  let stdout = "";
  let stderr = "";
  const status = runPackagedCliCommand(args, {
    engine,
    stdout: (text) => { stdout += text; },
    stderr: (text) => { stderr += text; }
  });
  assert.equal(status, 0, stderr || stdout);
  assert.ok(stdout.trim(), stderr);
  return parseJsonObject(stdout);
};

const cliIdentifierDecode = runInProcess(["id", "decode", "2C64444BA900", "eng", "nand.flash_id"]);
const cliGroupedIdentifierSearch = runInProcess(["id", "search", "2C8464", "eng", "10", "nand.flash_id", "--controller-group", "if:sata", "--controller-group", "if:nvme"]);
const cliCapabilities = runInProcess(["capabilities"]);
const cliEngCapabilities = runInProcess(["capabilities", "eng"]);
const cliPartDecode = await cliPartDecodePromise;

assert.equal(cliPartDecode.operation, "part.decode");
assert.equal((cliPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
assert.equal(cliIdentifierDecode.operation, "identifier.decode");
assert.equal((cliIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
assert.equal(cliGroupedIdentifierSearch.operation, "identifier.search");
assert.equal((cliGroupedIdentifierSearch.input as { controllerGroup?: unknown } | undefined)?.controllerGroup, undefined);
assert.equal(cliCapabilities.schemaVersion, "fdnext.capabilities.v2");
assertCapabilitiesBuildTime(cliCapabilities);
assert.deepEqual(normalizeCapabilitiesForComparison(cliCapabilities), normalizeCapabilitiesForComparison(sdkCapabilities));
assert.equal((cliEngCapabilities.inventory as typeof sdkCapabilities.inventory).controllers.groups[0]?.title, "All controllers");
