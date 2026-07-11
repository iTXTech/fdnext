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
  assertRuleDecode,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertRuleDraftDieProfileMeta,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertRuleDoesNotMatch("vendor.intel.token.v1", "PF035");
assertRuleDoesNotMatch("vendor.intel.token.v1", "PFE02");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCMG2", "L06B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTG3", "B0KB");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTH1", "B16A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTH2", "B16A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2AMCTH1", "B17A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2AMCTH2", "B17A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F64B2ALCTJ1", "B27A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMF2", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMFS", "L85C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMFP", "L85C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08LCMF1", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08LCMF3", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F16G08AAMD2", "L62A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAMD1", "L63A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAMDB", "L63B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F16G08AAME1", "L72A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAME1", "L73A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08AAME1", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08ACME2", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08ACNE1", "M73A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08AATE1", "B74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F64B08OCME1", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMF1", "L84A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMFH", "L84C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMFS", "L84C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "29F01T2ALCQH1", "N18A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQH2", "N18A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQJ1", "N28A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQJ2", "N28A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQK1", "N38A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQK2", "N38A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQKA", "N38B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2BLCQKM", "N38E");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16P2BWCQKM", "N38E");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQL1", "N4PA");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16P2BWCQL1", "3D5 192L");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29P64G2ALDNF1", "3D-XP G1");
assertRuleDraftDieProfileMeta("vendor.intel.token.v1", "PF29F01T2ANCMG2", "L06B");
assertRuleDraftDieProfileMeta("vendor.intel.token.v1", "PF29F16P2BWCQL1", undefined);
assertRuleDraftDieProfileMeta("vendor.intel.token.v1", "PF29P64G2ALDNF1", undefined);
assertRuleDecode("PF29F01T2ANCMG2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "L06B",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Layer Count": 32
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F01T2ANCTG3", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1572864,
  dieProfileField: "B0KB",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 32
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F01T2ANCTH2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B16A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F01T2AMCTH1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B17A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F64B2ALCTJ1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "B27A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 96
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F01T08OCMF2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85A"
  }
});
assertRuleDecode("PF29F01T08OCMFS", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85C"
  }
});
assertRuleDecode("PF29F01T08OCMFP", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85C"
  }
});
assertRuleDecode("JS29F16G08AAMD2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 16384,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "L62A"
  }
});
assertRuleDecode("JS29F32G08AAMD1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "L63A"
  }
});
assertRuleDecode("JS29F32G08AAMDB", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "L63B"
  }
});
assertRuleDecode("JS29F16G08AAME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 16384,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "L72A"
  }
});
assertRuleDecode("JS29F32G08AAME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "L73A"
  }
});
assertRuleDecode("JS29F64G08AATE1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 65536,
  dieProfileField: "25nm",
  cellField: "TLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "B74A"
  }
});
assertRuleDecode("JS29F32G08ACNE1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "25nm",
  cellField: "SLC",
  package: "TSOP-48",
  extra: {
    "Process Alias": "M73A"
  }
});
assertRuleDecode("PF29F64B08OCME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L74A"
  }
});
assertRuleDecode("PF29F16B08MCMF1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84A"
  }
});
assertRuleDecode("PF29F16B08MCMFH", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84C"
  }
});
assertRuleDecode("PF29F16B08MCMFS", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84C"
  }
});
assertRuleDecode("PF29F01T2ALCQK2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N38A",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Layer Count": 144
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F01T2BLCQKM", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N38E",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Layer Count": 144
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F16P2BWCQKM", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 22413312,
  dieProfileField: "N38E",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Layer Count": 144,
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 2
  },
  absentExtra: ["Product Generation"]
});
assertRuleDecode("PF29F16P2BWCQL1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 22413312,
  dieProfileField: "3D5 192L",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 2
  },
  absentExtra: ["Device Width"]
});
assertRuleDecode("PF29P64G2ALDNF1", {
  vendor: "intel",
  type: "3D XPoint",
  densityMbit: 65536,
  dieProfileField: "3D-XP G1",
  package: "BGA",
  extra: {
    "Die Stack": "2-Deck",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 2
  },
  absentExtra: ["Cell Level", "Voltage"]
});
