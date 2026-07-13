import {
  assertRuleDecode,
  assertRuleDoesNotMatch
} from "./_helpers";

assertRuleDecode("FC51E08SQP1A-2.5BWGE2A", {
  vendor: "esmt",
  type: "eMMC",
  densityMbit: 65536,
  cellField: "MLC",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.70V-1.95V or 2.7V-3.6V",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Speed Grade": "200MHz",
    "NAND Technology": "2D NAND"
  },
  absentExtra: ["Package Code", "Technology Code", "Density Code"]
});

assertRuleDecode("FC51J32SJTS2A-2.5BWGE2D", {
  vendor: "esmt",
  type: "eMMC",
  densityMbit: 262144,
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Speed Grade": "200MHz",
    "NAND Technology": "3D NAND"
  },
  absentExtra: ["Package Code", "Technology Code", "Density Code"]
});

assertRuleDecode("FC51L08SFY3A-2.5BWGI", {
  vendor: "esmt",
  type: "eMMC",
  densityMbit: 65536,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Speed Grade": "200MHz"
  },
  absentExtra: ["Cell Type", "NAND Technology", "Package Code"]
});

assertRuleDecode("FC51L04SMSA-2.5BWGE", {
  vendor: "esmt",
  type: "eMMC",
  densityMbit: 32768,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Speed Grade": "200MHz"
  },
  absentExtra: ["Cell Type", "NAND Technology", "Package Code"]
});

assertRuleDoesNotMatch("vendor.esmt.emmc.fc51.v1", "FC51J32SJTS2A-3.0BWGE2D");
assertRuleDoesNotMatch("vendor.esmt.emmc.fc51.v1", "M56Z8G32256A-SMBYIG");

assertRuleDecode("FC51J32SJTS2A", {
  vendor: "esmt",
  type: "eMMC",
  densityMbit: 262144,
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1"
  },
  absentExtra: ["Speed Grade"]
});

assertRuleDecode("F59L2G81XA-25TG2B", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  widthField: "x8",
  voltage: "3.3V (2.7V-3.6V)",
  package: "TSOP-48",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "25ns"
  },
  absentExtra: ["Design Code", "Package Code", "Voltage Code"]
});

assertRuleDecode("F59D4G81XB-45BCG2X", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  widthField: "x8",
  voltage: "1.8V (1.7V-1.95V)",
  package: "BGA-67",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "45ns"
  },
  absentExtra: ["Design Code", "Package Code", "Voltage Code"]
});

assertRuleDecode("F59L8G81KSA-25BG2R", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 8192,
  cellField: "SLC",
  widthField: "x8",
  package: "BGA-63",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "25ns"
  }
});

assertRuleDecode("F59D8G81KSA", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 8192,
  cellField: "SLC",
  widthField: "x8",
  voltage: "1.8V (1.7V-1.95V)",
  extra: {
    "Interface Type": "Parallel NAND"
  },
  absentExtra: ["Package", "Speed Grade"]
});

assertRuleDecode("F59D1G161MB-45BIG2M", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  widthField: "x16",
  voltage: "1.8V (1.7V-1.95V)",
  package: "BGA-63",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "45ns"
  }
});

assertRuleDecode("F59D1G81MB-45BUIG2M", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  widthField: "x8",
  voltage: "1.8V (1.7V-1.95V)",
  package: "BGA-48, 6.5x5",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "45ns"
  }
});

assertRuleDecode("F59L4G161KA-25BCAG2R", {
  vendor: "esmt",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  widthField: "x16",
  voltage: "3.3V (2.7V-3.6V)",
  package: "BGA-67",
  extra: {
    "Interface Type": "Parallel NAND",
    "Speed Grade": "25ns"
  }
});

assertRuleDoesNotMatch("vendor.esmt.raw.f59.v1", "F59D1G16MB-45BIG2M");
assertRuleDoesNotMatch("vendor.esmt.raw.f59.v1", "F59D1G161MB-45UCIG2M");
assertRuleDoesNotMatch("vendor.esmt.raw.f59.v1", "F50L2G41XA-104ZG");
