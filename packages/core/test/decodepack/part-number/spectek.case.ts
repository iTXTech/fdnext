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
assertPart("FNNL63A51K3WGAF", {
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
assertNotFound("FBMB17A4T1KDUAN");
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
function assertM84CQuadCeMarking(markingCode: string, expectedPartNumber: string): void {
  assertDecodedPartNumber(markingCode, expectedPartNumber);
  assertPart(markingCode, {
    vendor: "spectek",
    markingCode,
    type: "NAND",
    density: "32GB",
    dieProfileField: "20nm",
    cellField: "SLC",
    widthField: "x8",
    voltage: "Vcc: 3.3V, VccQ: 1.8V, VssQ: 0V",
    package: "152/221 ball TBGA, 14 x 18 x 1.2 (QDP)",
    extra: {
      "Die Density": "64Gb",
      "Die Count": 4,
      "CE Count": 4,
      "Channel Count": 2,
      "Package functionality partial type": "All CE(s) are valid and usable",
      "Process Alias": "M84C"
    }
  });
}
assertM84CQuadCeMarking("PF285", "FBMM84CNAKDMABH7");
assertM84CQuadCeMarking("PF580", "FBMM84C81KDMABH7");
assertPart("FBMM84C81KDMABH7", {
  vendor: "spectek",
  type: "NAND",
  density: "32GB",
  dieProfileField: "20nm",
  cellField: "SLC",
  widthField: "x8",
  voltage: "Vcc: 3.3V, VccQ: 1.8V, VssQ: 0V",
  package: "152/221 ball TBGA, 14 x 18 x 1.2 (QDP)",
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
assertDecodedPartNumber("PFA01", "FXM3B8ANAK3BAAH4");
assertPart("PFA01", {
  vendor: "spectek",
  markingCode: "PFA01",
  type: "NAND",
  cellField: "SLC",
  widthField: "x8",
  voltage: "Vcc: 3.3V, VccQ:3.3V",
  package: "63/120 ball VFBGA, 9 x 11 x 1.0",
  extra: {
    "Die Count": 1,
    "CE Count": 1,
    "Package functionality partial type": "All CE(s) are valid and usable"
  }
});
assertNotFound("PFA02");
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
assertNotFound("FBNL7BT65KDUAB");
assertNotFound("FNNL06B512G1KDFAB");
assertNotFound("FXXB47R512G1KLXAE");
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
assertNotFound("FNNN48R1T1KLBAE");
assertNotFound("FNNL84CNAK3BAA");
assertPart("PX001", {
  vendor: "spectek",
  markingCode: "PX001",
  type: "NAND",
  dieProfileField: "M2XA",
  cellField: "SLC",
  extra: {
    "Package functionality partial type": "All CE(s) are valid and usable"
  }
});
assertDieProfileFromFdbProcess("FNNL29F256G08EBHAFES", "B16A");
assertDieProfileFromFdbProcess("FBMB17A4T1KDUAN", "B17A", 64);
