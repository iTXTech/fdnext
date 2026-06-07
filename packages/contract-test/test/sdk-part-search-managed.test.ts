import assert from "node:assert/strict";
import { engine } from "./_part-search";

const mtfcSearch = engine.searchParts({ query: "MTFC", lang: "eng", limit: 20 });
assert.ok(mtfcSearch.items.some((item) => item.device.productType === "emmc"), "MTFC search should include eMMC candidates");
assert.ok(
  engine.searchParts({ query: "MTFC", lang: "eng", limit: 20, constraints: { productType: "ufs" } }).items
    .some((item) => item.device.productType === "ufs"),
  "MTFC search with UFS constraint should include UFS candidates"
);

const mt29fbSearch = engine.searchParts({ query: "MT29FB", lang: "eng", limit: 10 });
assert.ok(mt29fbSearch.items.length > 0, "MT29FB search should return raw NAND candidates");
assert.ok(mt29fbSearch.items.every((item) => item.device.chipKind === "raw_nand"), "MT29FB search candidates should use raw NAND chip kind");
const mt29fbMarkingSearch = engine.searchParts({ query: "NC103", lang: "eng", limit: 10 });
assert.deepEqual(
  mt29fbMarkingSearch.items.map((item) => item.device.chipKind),
  ["raw_nand"],
  "Micron MT29FB FBGA marking search should surface raw_nand"
);
