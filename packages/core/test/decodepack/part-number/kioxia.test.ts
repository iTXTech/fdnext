import { test } from "node:test";
import {
  assertKioxiaManagedRuleMatches,
  assertKioxiaRawSuffixTopology,
  assertSearchPnIncludes,
  testPart
} from "./_helpers";

testPart("TH58NVG7D2FTA00", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "Vcc: 3.30V (2.70V-3.60V)",
  package: "TSOP-48",
  extra: {
    "Interface Type": "Conventional NAND (large block)",
    "Package Code": "TA",
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1
  }
});

test("KIOXIA managed THG samples match only the shared THG rule", () => {
  for (const partNumber of [
    "THGBMNG5D1LBAIT",
    "THGAMVT0T43BAB8",
    "THGVMNG5D1LBAIT",
    "THGVX1G7D2GLA08",
    "TCGVX1G7D2GLA08",
    "THGBX2G7D2JLA01",
    "THGVR1G7D2GLA09"
  ]) {
    assertKioxiaManagedRuleMatches(partNumber, ["vendor.kioxia.managed.thg.v1"]);
  }
});

testPart("TC58NVG7D2FTA00", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "Vcc: 3.30V (2.70V-3.60V)",
  package: "TSOP-48",
  extra: {
    "Interface Type": "Conventional NAND (large block)",
    "Package Code": "TA",
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1
  },
  absentExtra: ["Multi chip"]
});

testPart("TC58TFG8T23TA0D", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70V-3.60V) / 2.50V (2.35V-2.75V), VccQ: 3.30V (2.70V-3.60V) / 1.80V (1.70V-1.95V)",
  package: "TSOP-48",
  extra: {
    "Interface Type": "Toggle DDR 1.0/2.0",
    "Process Alias": "8T23",
    "Layer Count": 64,
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1,
    "Plane Count": 2
  },
  absentExtra: ["Product Generation"]
});

testPart("TH58LKT4X46BAEG", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "BiCS6",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70V-3.60V) / 2.50V (2.35V-2.75V), VccQ: 1.20V (1.14V-1.26V)",
  package: "BGA-272",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Layer Count": 162,
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 4,
    "Plane Count": 4
  }
});

testPart("TH58LKB1F48BAEG", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 1397760,
  dieProfileField: "BiCS8",
  cellField: "QLC",
  package: "BGA-272",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 4
  }
}, "decodes KIOXIA 1.33Tb density-family token");

testPart("TH58LKY1R48BAEG", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "BiCS8",
  cellField: "PLC",
  package: "BGA-272",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 4
  }
}, "decodes KIOXIA PLC density-family token");

testPart("TH58LKG9DA5BA4R", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "BiCS5",
  cellField: "MLC",
  package: "BGA-154, 11.5x13.5",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Layer Count": 112,
    "Die Count": 2,
    "CE Count": 2,
    "Channel Count": 2
  }
}, "decodes the current KIOXIA 64GB XL-FLASH package token");

testPart("TH58LKT0DA5BA8R", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "BiCS5",
  cellField: "MLC",
  package: "BGA-154, 11.5x13.5",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Layer Count": 112,
    "Die Count": 4,
    "CE Count": 4,
    "Channel Count": 2
  }
}, "decodes the current KIOXIA 128GB XL-FLASH package token");

testPart("TH58LKT1DA5BA8S", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 2097152,
  dieProfileField: "BiCS5",
  cellField: "MLC",
  package: "BGA-154, 11.5x13.5",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Layer Count": 112,
    "Die Count": 8,
    "CE Count": 4,
    "Channel Count": 2
  }
}, "decodes the current KIOXIA 256GB XL-FLASH package token");

test("KIOXIA raw NAND suffix topology resolves package and die layout", () => {
  [
  { partNumber: "TH58NVG7D2FTA00", package: "TSOP-48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58LJG8T24TA0D", package: "TSOP-48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTAI0", package: "TSOP-48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTA1D", package: "TSOP-48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA20", package: "TSOP-48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58TFT0T22TA2D", package: "TSOP-48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA80", package: "TSOP-48", dieCount: 4, ceCount: 4, channelCount: 1 },
  { partNumber: "TC58NVG7T2HBA4C", package: "BGA-132", dieCount: 1, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG8SA4BA4C", package: "BGA-132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT0T25BA4D", package: "BGA-132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG9SA4BA8C", package: "BGA-132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0W23BASC", package: "BGA-132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0SA4BA8H", package: "BGA-132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0DDLBASH", package: "BGA-132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TEG7D2HBA49", package: "BGA-132, 12x18x1.4", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBA89", package: "BGA-132, 12x18x1.4", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBAS9", package: "BGA-132, 12x18x1.4", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG8S2FBA8A", package: "BGA-132, 12x18x1.85", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TAG9D2FBASA", package: "BGA-132, 12x18x1.85", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2T22BA8P", package: "BGA-132", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA4K", package: "BGA-152", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA8K", package: "BGA-152", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT3T25BA8J", package: "BGA-152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2W23BASJ", package: "BGA-152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT1EFKBA8N", package: "BGA-152", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0T24BADE", package: "BGA-272", dieCount: 4, ceCount: 4, channelCount: 4 },
  { partNumber: "TH58LJT1T24BAEF", package: "BGA-272", dieCount: 8, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58TFT1JFLBAEG", package: "BGA-272", dieCount: 16, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58NVG7D2FBA0M", package: "BGA-132", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58LKT4X46BS2K", package: "BGA-152", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58LKT4X46BAXE", package: "BGA-272", dieCount: 4, ceCount: 4, channelCount: 4 },
  { partNumber: "TH58LKT4X46BA8R", package: "BGA-154, 11.5x13.5", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BA8S", package: "BGA-154, 11.5x13.5", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8R", package: "BGA-152", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8T", package: "BGA-154", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8U", package: "BGA-154", dieCount: 32, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0DFKLAVF", package: "LGA-60, SAT", dieCount: 8, ceCount: 8, channelCount: 2 },
  { partNumber: "TH58TFT1DFKLAVH", package: "LGA-60, SAT", dieCount: 16, ceCount: 8, channelCount: 2 }
  ].forEach(assertKioxiaRawSuffixTopology);
});

testPart("THGBMNG5D1LBAIT", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 32768,
  dieProfileField: "15nm",
  cellField: "MLC",
  voltage: "Vcc: 3.3V, VccQ: 3.3V/1.8V",
  package: "BGA-153",
  extra: {
    "Storage Interface": "eMMC 5.0",
    "NAND Technology": "FG NAND",
    "Controller Revision": "N",
    "Die Count": 1,
    "Package Code": "BAIT",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Product Version", "Product Generation", "Die Stack"]
});

testPart("THGBM2G9DBFBAI2", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "Vcc: 3.3V, VccQ: 3.3V/1.8V",
  package: "BGA, 14x18x1.4",
  extra: {
    "Controller Revision": "2",
    "Die Count": 16,
    "Package Code": "BAI2",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Die Stack"]
});

testPart("THGAMVT0T43BAB8", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "BGA, 11.5x13x1.2",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Controller Revision": "V",
    "Die Count": 4,
    "Package Code": "BAB8",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

for (const [partNumber, densityMbit, dieCount, productClass, operationTemperature] of [
  ["THGAMVG8T13BAB7", 262144, 1, "Automotive AEC-Q100 Grade 2", "-40°C ~ 105°C"],
  ["THGAMVG9T23BAB8", 524288, 2, "Automotive AEC-Q100 Grade 2", "-40°C ~ 105°C"],
  ["THGAMVT1T83BAB5", 2097152, 8, "Automotive AEC-Q100 Grade 2", "-40°C ~ 105°C"],
  ["THGAMVG8T13BAA7", 262144, 1, "Automotive AEC-Q100 Grade 3", "-40°C ~ 85°C"],
  ["THGAMVG9T23BAA8", 524288, 2, "Automotive AEC-Q100 Grade 3", "-40°C ~ 85°C"],
  ["THGAMVT0T43BAA8", 1048576, 4, "Automotive AEC-Q100 Grade 3", "-40°C ~ 85°C"],
  ["THGAMVT1T83BAA5", 2097152, 8, "Automotive AEC-Q100 Grade 3", "-40°C ~ 85°C"]
] as const) {
  testPart(partNumber, {
    vendor: "kioxia",
    type: "eMMC",
    densityMbit,
    dieProfileField: "BiCS3",
    cellField: "TLC",
    extra: {
      "Storage Interface": "eMMC 5.1",
      "Die Count": dieCount,
      "Product Class": productClass,
      "Operation Temperature": operationTemperature
    },
    absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
  });
  assertSearchPnIncludes(partNumber, `Kioxia ${partNumber}`);
}

testPart("THGAMSG9T15BAIL", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "BiCS5",
  cellField: "TLC",
  package: "BGA, 11.5x13x0.8",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Controller Revision": "S",
    "Die Count": 1
  }
}, "decodes current KIOXIA eMMC BiCS5 and BAIL package tokens");

testPart("THGJFRT3E88BATW", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "BiCS8",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
  package: "BGA, 9.0x13.0x0.85",
  extra: {
    "Storage Interface": "UFS 4.1",
    "Product Class": "Consumer / Industrial",
    "Controller Revision": "R",
    "Die Count": 8,
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
}, "decodes THGJFRT3E88BATW standalone UFS 4.1 sample");

const kioxiaConsumerUfsSamples = [
  {
    partNumber: "THGJFPT0E18BAIP",
    densityMbit: 1048576,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 1,
    dieProfileField: "BiCS8",
    package: "BGA, 11.0x13.0x0.8"
  },
  {
    partNumber: "THGJFPT1E28BAIP",
    densityMbit: 2097152,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 2,
    dieProfileField: "BiCS8",
    package: "BGA, 11.0x13.0x0.8"
  },
  {
    partNumber: "THGJFPT2E48BAIP",
    densityMbit: 4194304,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA, 11.0x13.0x0.8"
  },
  {
    partNumber: "THGJFMT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA, 9.0x13.0x0.8"
  },
  {
    partNumber: "THGJFMT2E46BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS6",
    package: "BGA, 9.0x13.0x0.8"
  },
  {
    partNumber: "THGJFMT3E86BATZ",
    densityMbit: 8388608,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 8,
    dieProfileField: "BiCS6",
    package: "BGA, 9.0x13.0x0.9"
  },
  {
    partNumber: "THGJFRT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA, 9.0x13.0x0.8"
  },
  {
    partNumber: "THGJFRT2E48BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA, 9.0x13.0x0.8"
  },
  {
    partNumber: "THGJFRT3E88BATW",
    densityMbit: 8388608,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 8,
    dieProfileField: "BiCS8",
    package: "BGA, 9.0x13.0x0.85"
  }
];

for (const sample of kioxiaConsumerUfsSamples) {
  testPart(sample.partNumber, {
    vendor: "kioxia",
    type: "UFS",
    densityMbit: sample.densityMbit,
    dieProfileField: sample.dieProfileField,
    voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
    package: sample.package,
    extra: {
      "Storage Interface": sample.storageInterface,
      "Product Class": "Consumer / Industrial",
      "Operation Temperature": "-25°C ~ 85°C",
      "Controller Revision": sample.controllerRevision,
      "Die Count": sample.dieCount,
      "Speed Grade": sample.speedGrade
    },
    absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
  });
}

testPart("THGJFJT1T45BAB8", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS5",
  cellField: "TLC",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
  package: "BGA, 11.5x13.0x1.2",
  extra: {
    "Storage Interface": "UFS 4.0",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Controller Revision": "J",
    "Die Count": 4,
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

const kioxiaAutomotiveUfs41Samples = [
  { partNumber: "THGJFJT0E18BAB8", densityMbit: 1048576, dieCount: 1, package: "BGA, 11.5x13.0x1.2" },
  { partNumber: "THGJFJT1E28BAB8", densityMbit: 2097152, dieCount: 2, package: "BGA, 11.5x13.0x1.2" },
  { partNumber: "THGJFJT2E48BAB8", densityMbit: 4194304, dieCount: 4, package: "BGA, 11.5x13.0x1.2" },
  { partNumber: "THGJFJT3E88BAB5", densityMbit: 8388608, dieCount: 8, package: "BGA, 11.5x13.0x1.3" }
];

for (const sample of kioxiaAutomotiveUfs41Samples) {
  testPart(sample.partNumber, {
    vendor: "kioxia",
    type: "UFS",
    densityMbit: sample.densityMbit,
    dieProfileField: "BiCS8",
    voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
    package: sample.package,
    extra: {
      "Storage Interface": "UFS 4.1",
      "Product Class": "Automotive AEC-Q100 Grade 2",
      "Controller Revision": "J",
      "Die Count": sample.dieCount,
      "Speed Grade": "4640 MB/s"
    },
    absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
  }, `uses JFJ plus the E cell token to decode automotive UFS 4.1 ${sample.partNumber}`);
}

testPart("THGAFBT1T83BAA5", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "BGA, 11.5x13.0x1.3",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive AEC-Q100 Grade 3",
    "Controller Revision": "B",
    "Die Count": 8,
    "Speed Grade": "1160 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

testPart("THGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA-52, 14x18x1.04",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA08",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane Count", "CE Count", "Channel Count", "Die Stack"]
});

testPart("TCGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA-52, 14x18x1.04",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA08",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane Count", "CE Count", "Channel Count", "Die Stack"]
});

testPart("THGBX2G7D2JLA01", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "LGA-60",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "2",
    "Die Count": 2,
    "Package Code": "LA01",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane Count", "CE Count", "Channel Count", "Die Stack"]
});

testPart("THGVR1G7D2GLA09", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA-52, 14x18x1.0",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA09",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane Count", "CE Count", "Channel Count", "Die Stack"]
});
