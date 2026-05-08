import assert from "node:assert/strict";
import type { FlashInfo } from "../../core/src/index";
import { createEngine } from "../../core/src/index";
import { embeddedResources } from "../../resources/index";
import { compileRulesToDecoders, defaultDslRules } from "../src/index";

const engine = createEngine({
  resources: embeddedResources,
  decoders: compileRulesToDecoders(defaultDslRules)
});

function detect(partNumber: string): FlashInfo {
  return engine.detect(partNumber, { lang: "eng", combineFdb: false });
}

function extra(info: FlashInfo): Record<string, unknown> {
  assert.equal(typeof info.extraInfo, "object", `${info.partNumber} should expose extraInfo`);
  assert.ok(!Array.isArray(info.extraInfo), `${info.partNumber} extraInfo should be a keyed object`);
  return info.extraInfo as Record<string, unknown>;
}

function assertPart(
  partNumber: string,
  expected: {
    rawVendor: string;
    type: string;
    rawDensity?: number;
    density?: string;
    package?: string;
    extra?: Record<string, unknown>;
  }
): void {
  const info = detect(partNumber);
  assert.equal(info.rawVendor, expected.rawVendor, partNumber);
  assert.equal(info.type, expected.type, partNumber);

  if (expected.rawDensity !== undefined) {
    assert.equal(info.rawDensity, expected.rawDensity, partNumber);
  }
  if (expected.density !== undefined) {
    assert.equal(info.density, expected.density, partNumber);
  }
  if (expected.package !== undefined) {
    assert.equal(info.package, expected.package, partNumber);
  }
  if (expected.extra) {
    const extraInfo = extra(info);
    for (const [key, value] of Object.entries(expected.extra)) {
      assert.equal(extraInfo[key], value, `${partNumber} extraInfo.${key}`);
    }
  }
}

assertPart("SDINBDA6-256G-XI1", {
  rawVendor: "sndk",
  type: "eMMC",
  rawDensity: 2097152,
  extra: {
    "Product Family": "iNAND IX EM132",
    "Product Version": "eMMC 5.1",
    "Product Class": "Industrial Extended Temperature"
  }
});

assertPart("SDINFDK4-128G", {
  rawVendor: "sndk",
  type: "UFS",
  rawDensity: 1048576,
  extra: {
    "Product Family": "iNAND MC EU521",
    "Product Version": "UFS 3.1"
  }
});

assertPart("SDINZZZ9-128G-ABC", {
  rawVendor: "sndk",
  type: "iNAND",
  rawDensity: 1048576,
  extra: {
    System: "iNAND"
  }
});

assertPart("THGBMNG5D1LBAIT", {
  rawVendor: "kioxia",
  type: "eMMC",
  rawDensity: 32768,
  extra: {
    "Series Code": "BMN",
    "Product Version": "eMMC 5.0"
  }
});

assertPart("THGJFRT3E88BATW", {
  rawVendor: "kioxia",
  type: "UFS",
  rawDensity: 8388608,
  extra: {
    "Series Code": "JFR",
    "Product Version": "UFS 4.1"
  }
});

assertPart("H26M78208CMRX", {
  rawVendor: "skhynix",
  type: "eMMC",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("H26M78208CMRN", {
  rawVendor: "skhynix",
  type: "eMMC",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Commercial / Mobile"
  }
});

assertPart("H26M91208HPRX", {
  rawVendor: "skhynix",
  type: "eMMC",
  density: "Unknown",
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("HN8T25DEHKX077N", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 4194304,
  package: "153FBGA",
  extra: {
    "Series Code": "DE",
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)",
    "Product Class": "Mobile"
  }
});

assertPart("HN8T35DZHKX079", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 8388608,
  package: "153FBGA",
  extra: {
    "Series Code": "DZ",
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)"
  }
});

assertPart("HN8G962EHKX037N", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Series Code": "2E",
    "Product Version": "UFS 3.1"
  }
});

assertPart("H28SAO301MMR", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 4194304,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H28S8Q302CMR", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 1048576,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H25T2TB88E-X321-N", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 2097152,
  extra: {
    System: "SK hynix 4D NAND",
    "Density Code": "2T",
    "Product Generation": "176-layer 4D NAND (V7)",
    "Product Class": "TLC"
  }
});

assertPart("H25T1TD48C-X630", {
  rawVendor: "skhynix",
  type: "NAND",
  extra: {
    System: "SK hynix 4D NAND",
    "Density Code": "1T",
    "Product Generation": "238-layer 4D NAND (V9 / H25FTD0)",
    "Die Density": "512Gb"
  }
});

assertPart("H27UCG8T2E", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 65536,
  extra: {
    System: "SK hynix E2NAND3.0 catalog family",
    "Product Family": "H27 T2 family",
    "Density Code": "CG"
  }
});

assertPart("H9TQ17ABJTMCUR-KUM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 131072,
  package: "221Ball FBGA",
  extra: {
    System: "SK hynix CI-MCP",
    "Product Mode": "CI-MCP NAND DDR3",
    "Storage Density": "16GB e-NAND",
    "DRAM Density": "16Gb LPDDR3"
  }
});

assertPart("H9TP32A4GDBCPR-KGM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 32768,
  package: "162Ball FBGA",
  extra: {
    System: "SK hynix CI-MCP",
    "Product Mode": "CI-MCP NAND DDR2",
    "Storage Density": "4GB e-NAND"
  }
});

assertPart("H9HP52ACPMADAR-KMM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 524288,
  package: "254Ball FBGA",
  extra: {
    System: "SK hynix eMCP",
    "Product Mode": "eMCP NAND DDR4",
    "Storage Density": "64GB eMMC"
  }
});

assertPart("H9AG9G5ANBX100", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 524288,
  package: "254Ball FBGA",
  extra: {
    System: "SK hynix eMCP",
    "Product Mode": "LPDDR4 eMCP",
    "Storage Interface": "eMMC 5.0"
  }
});

assertPart("H9QT0GECN6X145", {
  rawVendor: "skhynix",
  type: "uMCP",
  rawDensity: 1048576,
  package: "254Ball FBGA",
  extra: {
    System: "SK hynix uMCP",
    "Product Mode": "LPDDR4 uMCP",
    "Storage Interface": "UFS 2.2"
  }
});

assertPart("H9HQ15ACPMADAR-KEM", {
  rawVendor: "skhynix",
  type: "uMCP",
  rawDensity: 1048576,
  package: "254Ball FBGA",
  extra: {
    System: "SK hynix uMCP",
    "Storage Density": "128GB UFS",
    "DRAM Density": "32Gb LPDDR4X"
  }
});

assertPart("MTFC4GACAJCN-1M WT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 32768,
  package: "153-ball VFBGA 11.5x13x1.0 (SAC 302)",
  extra: {
    "NAND Component": "AC",
    "Controller Code": "AJ",
    "Package Code": "CN",
    "Product Version": "eMMC 5.0",
    "Special Option": "2MB MAX boot area / 100% MAX enhanced"
  }
});

assertPart("MTFC8GLTEA-WT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 65536,
  package: "153-ball WFBGA 11.5x13x0.8",
  extra: {
    "NAND Component": "L",
    "Controller Code": "T",
    "Package Code": "EA",
    "Controller Revision": "Rev 19"
  }
});

assertPart("MTFC256GASAONS-IT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 2097152,
  package: "153-ball TFBGA 11.5x13x1.2",
  extra: {
    "NAND Component": "AS",
    "Controller Code": "AO",
    "Package Code": "NS",
    "Product Version": "UFS 2.1"
  }
});

assertPart("MTFC64GBCAVAL-AIT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 524288,
  extra: {
    "NAND Component": "BC",
    "Controller Code": "AV",
    "Package Code": "AL",
    "Product Version": "UFS 3.1"
  }
});

assertPart("MTFC1TAYAXHR-WT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 8388608,
  extra: {
    "NAND Component": "AY",
    "Controller Code": "AX",
    "Package Code": "HR",
    "Product Version": "UFS 4.0"
  }
});

assertPart("MTFC256GZZZZZZ-WT", {
  rawVendor: "micron",
  type: "NAND with Controller",
  rawDensity: 2097152,
  package: "Unknown",
  extra: {
    "NAND Component": "ZZ",
    "Controller Code": "ZZ",
    "Package Code": "ZZ"
  }
});

assertPart("KLMAG1JETD-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 131072,
  extra: {
    "Product Version": "eMMC 5.1",
    "Interface info": "HS400"
  }
});

assertPart("KLM8G1GETF-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 65536,
  extra: {
    "Product Version": "eMMC 5.1",
    "Interface info": "HS400"
  }
});

assertPart("KLMBG2JETD-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 262144,
  extra: {
    "Product Version": "eMMC 5.1",
    "Die Stack": "DDP (2-die)"
  }
});

assertPart("KLUEG8UHDB-C2E1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 2097152,
  extra: {
    "Product Version": "UFS 3.1",
    "Controller": "UFS 3.1/3.0/2.2 G4-2Lane Controller"
  }
});

assertPart("KLUFG8RHHF-F0G1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 4194304,
  package: "BGA-153 9x13",
  extra: {
    "Product Version": "UFS 4.0",
    "Controller": "UFS 4.0 G5-2Lane Controller"
  }
});

assertPart("KLUEG4RHKF-F0H1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 2097152,
  package: "BGA-153 9x13",
  extra: {
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  }
});
