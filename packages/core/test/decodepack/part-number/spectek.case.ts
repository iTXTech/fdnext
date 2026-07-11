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
  assertHiddenComponentRelations,
  assertHiddenPublicField,
  assertIdentifierRelation,
  assertKioxiaManagedRuleMatches,
  assertKioxiaRawSuffixTopology,
  assertMicronDecodePackDieProfile,
  assertMicronManagedFbgaMarking,
  assertNotFound,
  assertRuleDecode,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertRuleDecode("FNNL63A51K3WG-AF", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP-I-48, Center Package Leads CPL PB free",
  extra: {
    "Process Alias": "L63A",
    "Product Family": "SpecTek NAND Flash",
    "Density grade": "94-100%",
    "Package functionality partial type": "Single Die Package, CE only"
  }
});
assertRuleDecode("FNNL63A51K3WGAF", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP-I-48, Center Package Leads CPL PB free",
  extra: {
    "Process Alias": "L63A",
    "Product Family": "SpecTek NAND Flash",
    "Density grade": "94-100%",
    "Package functionality partial type": "Single Die Package, CE only"
  }
});
assertNotFound("FBMB17A4T1KDUAN");
assertRuleDecode("FBMM84C81KDMABH7", {
  vendor: "spectek",
  type: "NAND",
  density: "32GB",
  dieProfileField: "20nm",
  cellField: "SLC",
  widthField: "x8",
  voltage: "Vcc: 3.3V, VccQ: 1.8V, VssQ: 0V",
  package: "TBGA-152/221, 14x18x1.2, QDP",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 4,
    "CE Count": 4,
    "Channel Count": 2,
    "Density grade": "94-100%",
    "Package functionality partial type": "All CE(s) are valid and usable",
    "Process Alias": "M84C"
  }
});
assertNotFound("PFA02");
assertRuleDecode("FBML84A61KDBABH1", {
  vendor: "spectek",
  type: "NAND",
  density: "8GB",
  dieProfileField: "20nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 1,
    "Process Alias": "L84A"
  }
});
assertSubtitle("FBML84A61KDBABH1", "NAND Flash · SpecTek · 8GB MLC · L84A");
assertRuleDecode("FBMM60A21G3BAAWP", {
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
assertNotFound("FBNL7BT65KDUAB");
assertNotFound("FNNL06B512G1KDFAB");
assertNotFound("FXXB47R512G1KLXAE");
assertRuleDecode("FBMB68S8T0KLUAHD5", {
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
assertRuleDecode("FBMN69R2T0KLBAHD4", {
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
assertRuleDecode("FBMB78R2T0KLEAHD4", {
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
assertNotFound("FNNN48R1T1KLBAE");
assertNotFound("FNNL84CNAK3BAA");
