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

assertPart("H26M78208CMRX", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "1xnm NAND",
    "Die Density": "64Gb",
    "Die Count": 8,
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("H26M78208CMRN", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "1xnm NAND",
    "Die Density": "64Gb",
    "Die Count": 8,
    "Product Class": "Commercial / Mobile"
  }
});

assertPart("H26M31001HPR", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 32768,
  package: "153FBGA 11.5x13x0.8mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 4.5",
    "Product Generation": "1xnm NAND",
    "Die Density": "32Gb",
    "Die Count": 1
  }
});

assertPart("H26M88002AMR", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 1048576,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "3D-V2 NAND",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

assertPart("H26M91208HPRX", {
  vendor: "skhynix",
  type: "eMMC",
  density: "Unknown",
  package: "153FBGA 11.5x13x0.8mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertSkhynixHn8RuleMatches("HN8G95DJHQX148", ["vendor.skhynix.ufs.hn8.automotive-ufs31.v1"]);
assertPart("HN8G95DJHQX148", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  package: "153-ball JEDEC FBGA 11.5x13.0x1.2 TFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Automotive AAT",
    "Operation Temperature": "-40°C ~ 105°C"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T25DJHVX111", ["vendor.skhynix.ufs.hn8.automotive-ufs31.v1"]);
assertPart("HN8T25DJHVX111", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  package: "153-ball JEDEC FBGA 11.5x13.0x1.2 TFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Automotive AIT",
    "Operation Temperature": "-40°C ~ 95°C"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T25DEHKX077N", ["vendor.skhynix.ufs.hn8.mobile-ufs31.v1"]);
assertPart("HN8T25DEHKX077N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  voltage: "Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V",
  package: "153FBGA 11.0x13.0x0.8 WFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T35DZHKX079", ["vendor.skhynix.ufs.hn8.mobile-ufs31.v1"]);
assertPart("HN8T35DZHKX079", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "HYV7",
  voltage: "Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V",
  package: "153FBGA 11.0x13.0x1.0 VFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8G962EHKX037N", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8G962EHKX037N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8T062EHKX039", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8T062EHKX039", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8T162EHKX041", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8T162EHKX041", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8G961ZGKX031", ["vendor.skhynix.ufs.hn8.ufs22-v6.v1"]);
assertPart("HN8G961ZGKX031", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  voltage: "Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V",
  package: "153FBGA 11.5x13.0x1.0",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System", "Product Family", "Process", "Layer Count"]
});

assertSkhynixHn8RuleMatches("HN8T261ZGKX014", ["vendor.skhynix.ufs.hn8.ufs22-v6.v1"]);
assertPart("HN8T261ZGKX014", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  voltage: "Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V",
  package: "153FBGA 11.5x13.0x1.0",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System", "Product Family", "Process", "Layer Count"]
});

assertSkhynixHn8RuleMatches("HN8T274EJKX130", ["vendor.skhynix.ufs.hn8.zufs41.v1"]);
assertPart("HN8T274EJKX130", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  package: "153FBGA",
  extra: {
    "Product Family": "SK hynix ZUFS 4.1",
    "Storage Interface": "UFS 4.1",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Group", "Product Version"]
});

assertSkhynixHn8RuleMatches("HN8T374ZJKX141", ["vendor.skhynix.ufs.hn8.zufs41.v1"]);
assertPart("HN8T374ZJKX141", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 8388608,
  package: "153FBGA",
  extra: {
    "Product Family": "SK hynix ZUFS 4.1",
    "Storage Interface": "UFS 4.1",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Group", "Product Version"]
});

assertPart("H28SAO301MMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H28S8Q302CMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H28U64222MMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 262144,
  package: "11.5x13x1.0mm",
  extra: {
    "Storage Interface": "UFS 2.0",
    "Product Generation": "1xnm NAND",
    "Interface Type": "1-lane / 2-lane",
    "Die Density": "64Gb",
    "Die Count": 4
  },
  absentExtra: ["System", "Group", "Package Code", "Component Code"]
});

assertPart("H28U86222MCR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  package: "11.5x13x1.2mm",
  extra: {
    "Storage Interface": "UFS 2.0",
    "Product Generation": "1xnm NAND",
    "Interface Type": "1-lane / 2-lane",
    "Die Density": "64Gb",
    "Die Count": 16
  },
  absentExtra: ["System", "Group", "Package Code", "Component Code"]
});
