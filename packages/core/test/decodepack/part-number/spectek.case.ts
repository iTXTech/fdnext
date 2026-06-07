import assert from "node:assert/strict";
import {
  compiledPack,
  detect,
  engine,
  firstField,
  partNumberPnJson,
  resourceEntries,
  skhynixH25RawInternalExtra,
  skhynixHn8RuleIds,
  assertDecodePackDieProfile,
  assertDecodedPartNumber,
  assertDieProfileFromFdbProcess,
  assertFdbDoesNotOverrideDecodePackFields,
  assertFieldBlock,
  assertHiddenComponentRelations,
  assertHiddenPublicField,
  assertIdentifierRelation,
  assertKioxiaManagedRuleMatches,
  assertKioxiaRawSuffixTopology,
  assertMicronDecodePackDieProfile,
  assertMicronManagedFbgaMarking,
  assertNotFound,
  assertPart,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertPart("FNNL63A51K3WG-AF", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "48-pin TSOP I Center Package Leads (CPL) PB free",
  extra: {
    "Process Alias": "L63A",
    "Product Family": "SpecTek NAND Flash",
    "Density grade": "94-100%",
    "Package functionality partial type": "Single Die Package, CE only"
  }
});
assertPart("FBMB17A4T1KDUAN", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "B17A",
  cellField: "TLC",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertFieldBlock("FBMB17A4T1KDUAN", "layer_count", "storage");
assertDecodedPartNumber("PFE02", "FBML63BNAKDBAAH1");
assertPart("PFE02", {
  vendor: "spectek",
  markingCode: "PFE02",
  type: "NAND",
  dieProfileField: "34nm",
  cellField: "MLC",
  extra: {
    "Process Alias": "L63B"
  }
});
assertPart("PF232", {
  vendor: "spectek",
  markingCode: "PF232",
  type: "NAND",
  dieProfileField: "34nm",
  cellField: "SLC",
  extra: {
    "Process Alias": "M60A"
  }
});
assertPart("PFA02", {
  vendor: "spectek",
  markingCode: "PFA02",
  type: "NAND",
  density: "128MB",
  dieProfileField: "50nm",
  cellField: "SLC",
  extra: {
    "Process Alias": "M58A"
  }
});
assertPart("PFF21", {
  vendor: "spectek",
  markingCode: "PFF21",
  type: "NAND",
  dieProfileField: "25nm",
  cellField: "MLC",
  extra: {
    "Process Alias": "L74A"
  }
});
assertPart("FBML84A61KDBABH1", {
  vendor: "spectek",
  type: "NAND",
  density: "16GB",
  dieProfileField: "20nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 2,
    "Process Alias": "L84A"
  }
});
assertSubtitle("FBML84A61KDBABH1", "NAND Flash · SpecTek · 16GB MLC · L84A");
assertPart("FBMM60A21G3BAAWP", {
  vendor: "spectek",
  type: "NAND",
  density: "512MB",
  dieProfileField: "34nm",
  cellField: "SLC",
  extra: {
    "Die Density": "4Gb",
    "Die Count": 1,
    "Process Alias": "M60A"
  }
});
assertPart("FBNL7BT65KDUAB", {
  vendor: "spectek",
  type: "NAND",
  density: "10.5GB",
  dieProfileField: "25nm",
  cellField: "MLC",
  extra: {
    "Die Density": "42Gb",
    "Die Count": 2,
    "Process Alias": "L7BT"
  }
});
assertPart("FNNL06B512G1KDFAB", {
  vendor: "spectek",
  type: "NAND",
  density: "64GB",
  dieProfileField: "L06B",
  cellField: "MLC",
  extra: {
    "Die Density": "256Gb",
    "Die Count": 2,
    "Layer Count": 32
  }
});
assertPart("FXXB47R512G1KLXAE", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "B47R",
  cellField: "TLC",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 4,
    "Layer Count": 176
  }
});
assertPart("FBMB68S8T0KLUAHD5", {
  vendor: "spectek",
  type: "NAND",
  density: "1TB",
  dieProfileField: "B68S",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 8,
    "Layer Count": 276
  }
});
assertPart("FBMN69R2T0KLBAHD4", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "N69R",
  cellField: "QLC",
  extra: {
    "Die Density": "2Tb",
    "Die Count": 1,
    "Layer Count": 276
  }
});
assertPart("FBMB78R2T0KLEAHD4", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "B78R",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 2
  },
  absentExtra: ["Layer Count"]
});
assertPart("FNNN48R1T1KLBAE", {
  vendor: "spectek",
  type: "NAND",
  density: "128GB",
  dieProfileField: "N48R",
  cellField: "QLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 1,
    "Layer Count": 176
  }
});
assertPart("FNNL84CNAK3BAA", {
  vendor: "spectek",
  type: "NAND",
  density: "64GB",
  dieProfileField: "20nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 8,
    "Process Alias": "L84C"
  }
});
assertPart("PX001", {
  vendor: "spectek",
  markingCode: "PX001",
  type: "NAND",
  dieProfileField: "M2XA",
  cellField: "SLC",
  extra: {
    "Package functionality partial type": "CE1 Valid, CE2 not guaranteed"
  }
});
assertDieProfileFromFdbProcess("FNNL29F256G08EBHAFES", "B16A");
assertDieProfileFromFdbProcess("FBMB17A4T1KDUAN", "B17A", 64);
