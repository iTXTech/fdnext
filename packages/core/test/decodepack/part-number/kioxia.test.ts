import { test } from "node:test";
import {
  assertKioxiaManagedRuleMatches,
  assertKioxiaRawSuffixTopology,
  testPart
} from "./_helpers";

testPart("TH58NVG7D2FTA00", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "Vcc: 3.30V (2.70V-3.60V)",
  package: "TSOP48",
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
  package: "TSOP48",
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
  package: "TSOP48",
  extra: {
    "Interface Type": "Toggle DDR 1.0/2.0",
    "Process Alias": "8T23",
    "Layer Count": 64,
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1,
    Plane: 2
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
  package: "BGA272",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Layer Count": 162,
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 4,
    Plane: 4
  }
});

testPart("TH58LKB1F48BAEG", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 1397760,
  dieProfileField: "BiCS8",
  cellField: "QLC",
  package: "BGA272",
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
  package: "BGA272",
  extra: {
    "Interface Type": "Very Low Voltage Toggle DDR 3.0/4.0/5.x/6.x",
    "Die Count": 16,
    "CE Count": 8,
    "Channel Count": 4
  }
}, "decodes KIOXIA PLC density-family token");

test("KIOXIA raw NAND suffix topology resolves package and die layout", () => {
  [
  { partNumber: "TH58NVG7D2FTA00", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58LJG8T24TA0D", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTAI0", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTA1D", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA20", package: "TSOP48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58TFT0T22TA2D", package: "TSOP48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA80", package: "TSOP48", dieCount: 4, ceCount: 4, channelCount: 1 },
  { partNumber: "TC58NVG7T2HBA4C", package: "BGA132", dieCount: 1, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG8SA4BA4C", package: "BGA132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT0T25BA4D", package: "BGA132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG9SA4BA8C", package: "BGA132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0W23BASC", package: "BGA132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0SA4BA8H", package: "BGA132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0DDLBASH", package: "BGA132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TEG7D2HBA49", package: "BGA132 (12 x 18 x 1.4)", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBA89", package: "BGA132 (12 x 18 x 1.4)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBAS9", package: "BGA132 (12 x 18 x 1.4)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG8S2FBA8A", package: "BGA132 (12 x 18 x 1.85)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TAG9D2FBASA", package: "BGA132 (12 x 18 x 1.85)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2T22BA8P", package: "BGA132", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA4K", package: "BGA152", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA8K", package: "BGA152", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT3T25BA8J", package: "BGA152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2W23BASJ", package: "BGA152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT1EFKBA8N", package: "BGA152", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0T24BADE", package: "BGA272", dieCount: 4, ceCount: 4, channelCount: 4 },
  { partNumber: "TH58LJT1T24BAEF", package: "BGA272", dieCount: 8, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58TFT1JFLBAEG", package: "BGA272", dieCount: 16, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58NVG7D2FBA0M", package: "BGA132", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58LKT4X46BS2K", package: "BGA152", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58LKT4X46BAXE", package: "BGA272", dieCount: 4, ceCount: 4, channelCount: 4 },
  { partNumber: "TH58LKT4X46BA8R", package: "BGA154", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BA8S", package: "BGA154", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8R", package: "BGA152", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8T", package: "BGA154", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT4X46BB8U", package: "BGA154", dieCount: 32, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0DFKLAVF", package: "LGA60-SAT", dieCount: 8, ceCount: 8, channelCount: 2 },
  { partNumber: "TH58TFT1DFKLAVH", package: "LGA60-SAT", dieCount: 16, ceCount: 8, channelCount: 2 }
  ].forEach(assertKioxiaRawSuffixTopology);
});

testPart("THGBMNG5D1LBAIT", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 32768,
  dieProfileField: "15nm",
  cellField: "MLC",
  voltage: "Vcc: 3.3V, VccQ: 3.3V/1.8V",
  package: "BGA153",
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
  package: "BGA (14 x 18 x 1.4)",
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
  package: "BGA (11.5 x 13 x 1.2)",
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

testPart("THGJFRT3E88BATW", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "BiCS8",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
  package: "BGA (9.0 x 13.0 x 0.85)",
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
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFPT1E28BAIP",
    densityMbit: 2097152,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 2,
    dieProfileField: "BiCS8",
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFPT2E48BAIP",
    densityMbit: 4194304,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT2E46BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS6",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT3E86BATZ",
    densityMbit: 8388608,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 8,
    dieProfileField: "BiCS6",
    package: "BGA (9.0 x 13.0 x 0.9)"
  },
  {
    partNumber: "THGJFRT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFRT2E48BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFRT3E88BATW",
    densityMbit: 8388608,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 8,
    dieProfileField: "BiCS8",
    package: "BGA (9.0 x 13.0 x 0.85)"
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
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 4.0",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Controller Revision": "J",
    "Die Count": 4,
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

testPart("THGAFBT1T83BAA5", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "BGA",
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
  package: "LGA52 (14 x 18 x 1.04)",
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
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

testPart("TCGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA52 (14 x 18 x 1.04)",
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
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

testPart("THGBX2G7D2JLA01", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "LGA60",
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
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

testPart("THGVR1G7D2GLA09", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA52 (14 x 18 x 1.0)",
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
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});
