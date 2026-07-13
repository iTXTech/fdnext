import {
  assertRuleDecode,
  assertRuleDoesNotMatch
} from "./_helpers";

assertRuleDecode("MX30LF1G08AA", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  extra: {
    "Interface Type": "Parallel NAND",
    "ECC Level": "1bit (2bit automotive)"
  },
  absentExtra: ["Package", "Operation Temperature", "ECC Code", "Generation Code"]
});

assertRuleDecode("MX60LF8G28AB-TI", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 8192,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  package: "TSOP-48, 12x20",
  extra: {
    "Interface Type": "Parallel NAND",
    "ECC Level": "8bit",
    "Operation Temperature": "-40°C ~ 85°C"
  },
  absentExtra: ["Package Code", "Mode Code", "Reserve Code"]
});

assertRuleDecode("MX30UF2G16AC-XQR", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  widthField: "x16",
  voltage: "1.7V~1.95V",
  package: "VFBGA-48, 6x8",
  extra: {
    "ECC Level": "4bit",
    "Operation Temperature": "-40°C ~ 105°C",
    "Product Class": "Automotive Grade 2"
  }
});

assertRuleDecode("MX30LF4GE8AB", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  extra: {
    "ECC Level": "ECC-free"
  },
  absentExtra: ["Package", "Operation Temperature"]
});

assertRuleDecode("MX30LF1208AA-Z2I", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 512,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  package: "WSON-8, 8x6",
  extra: {
    "ECC Level": "1bit (2bit automotive)",
    "Operation Temperature": "-40°C ~ 85°C"
  }
});

assertRuleDecode("MX30LF1G28SC-XKS", {
  vendor: "mxic",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  package: "VFBGA-63, 9x11",
  extra: {
    "Special Option": "Security Feature",
    "Operation Temperature": "-40°C ~ 85°C",
    "Product Class": "Automotive Grade 3"
  }
});

assertRuleDoesNotMatch("vendor.macronix.raw.mx30_mx60.v1", "MX35LF2GE4AB");
assertRuleDoesNotMatch("vendor.macronix.raw.mx30_mx60.v1", "MX30LF3G28AB");
