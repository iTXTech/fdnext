import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";
import { assertCapabilitiesBuildTime, normalizeCapabilitiesForComparison, runCli } from "./_helpers";

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();

const cliPartDecode = runCli(["part", "decode", "MT62F1G64D4EK-023", "eng"]);
assert.equal(cliPartDecode.operation, "part.decode");
assert.equal((cliPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const cliIdentifierDecode = runCli(["id", "decode", "2C64444BA900", "eng", "nand.flash_id"]);
assert.equal(cliIdentifierDecode.operation, "identifier.decode");
assert.equal((cliIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const cliGroupedIdentifierSearch = runCli(["id", "search", "2C8464", "eng", "10", "nand.flash_id", "--controller-group", "if:sata", "--controller-group", "if:nvme"]);
assert.equal(cliGroupedIdentifierSearch.operation, "identifier.search");
assert.deepEqual(
  ((cliGroupedIdentifierSearch.input as { controllerGroup?: unknown } | undefined)?.controllerGroup),
  ["if:sata", "if:nvme"]
);
const cliCapabilities = runCli(["capabilities"]);
assert.equal(cliCapabilities.schemaVersion, "fdnext.capabilities.v2");
assertCapabilitiesBuildTime(cliCapabilities);
assert.deepEqual(normalizeCapabilitiesForComparison(cliCapabilities), normalizeCapabilitiesForComparison(sdkCapabilities));
const cliEngCapabilities = runCli(["capabilities", "eng"]);
assert.equal((cliEngCapabilities.inventory as typeof sdkCapabilities.inventory).controllers.groups[0]?.title, "All controllers");
