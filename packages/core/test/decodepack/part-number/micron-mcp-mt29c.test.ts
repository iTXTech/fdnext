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

assertPart("MT29C4G96MAZAPCJA-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-ball TFBGA 13x10.5x1.2",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "4Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AZAPC",
    "Package Code": "JA",
    "DRAM Speed": "LPDDR-400 CL3"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C2G24MAKLAJG-6 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  package: "168-ball PoP VFBGA 12x12x0.9",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "2Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AKLA",
    "Package Code": "JG",
    "DRAM Speed": "LPDDR-333 CL3"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C1G12MAADVAKC-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  package: "107-ball TFBGA 13x10.5x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "512Mb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AADVA",
    "Package Code": "KC",
    "DRAM Speed": "LPDDR-400 CL3"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C1G12MAADAEAKC-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  package: "107-ball TFBGA 13x10.5x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AADAEA",
    "Package Code": "KC",
    "DRAM Speed": "LPDDR-400 CL3"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C2G48MAKLCJI-6 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  package: "168-ball PoP TFBGA 12x12x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "2Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AKLC",
    "Package Code": "JI",
    "DRAM Speed": "LPDDR-333 CL3"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C4G48MAZBBAKS-48 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-ball VFBGA 13x10.5x1.0",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AZBBA",
    "Package Code": "KS",
    "DRAM Speed": "LPDDR-416"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C4G48MAYBBAHK-48 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-VFBGA 13x10.5",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AYBBA",
    "Package Code": "HK",
    "DRAM Speed": "LPDDR-416"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C8G48MAPLDJA-75ITES", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 8192,
  package: "137-ball TFBGA 13x10.5x1.2",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "APLD",
    "Package Code": "JA",
    "DRAM Speed": "LPDDR-266 CL3",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});
