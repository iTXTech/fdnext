import assert from "node:assert/strict";
import { assertPartClassification, engine } from "./_part-search";

assertPartClassification("MT29F4G08ABAEA", "raw_nand");
assertPartClassification("AFND1208S1", "raw_nand");
assertPartClassification("HY33DS1G800CT1", "raw_nand");
// A Micron prefix without recognized product grammar preserves identity only.
for (const query of ["MT29FBG08ABACA", "MT63GFFFF"]) {
  assertPartClassification(query, "unknown");
  const result = engine.decodePart({ query, lang: "eng" });
  assert.equal(result.device.vendor?.id, "micron", query);
  assert.equal(result.device.productType, undefined, query);
  assert.equal(result.blocks.flatMap((block) => block.fields).length, 0, query);
}
assertPartClassification("MTFC8GAKAJCN-4M", "managed_nand", "emmc");
assertPartClassification("KLUEG8UHDC-B0E1", "managed_nand", "ufs");
assertPartClassification("BWCA2KZC-64G", "managed_nand", "emcp");
assertPartClassification("H9QT0GECN6X145", "managed_nand", "umcp");
assertPartClassification("MT62F1G64D4EK-023 WT:B", "dram", "lpddr5x");
