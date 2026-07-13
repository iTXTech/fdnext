import {
  assertRuleDecode,
  assertRuleDoesNotMatch
} from "./_helpers";

assertRuleDecode("IS21EF04GP-JQLI", {
  vendor: "issi",
  type: "eMMC",
  densityMbit: 32768,
  cellField: "MLC",
  package: "FBGA-100",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Special Option": "pSLC preconfigured",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Solder Type": "RoHS compliant, Halogen-free"
  },
  absentExtra: ["Package Code", "Option Code", "Technology Code"]
});

assertRuleDecode("IS22TF64G-JCLA2", {
  vendor: "issi",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "FBGA-153",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive Managed NAND",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)"
  }
});

assertRuleDecode("IS21EF16GA-JCLI", {
  vendor: "issi",
  type: "eMMC",
  densityMbit: 131072,
  cellField: "MLC",
  package: "FBGA-153",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "Gen2",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)"
  }
});

assertRuleDecode("IS21ES04G-JQLI", {
  vendor: "issi",
  type: "eMMC",
  densityMbit: 32768,
  cellField: "MLC",
  package: "FBGA-100",
  extra: {
    "Storage Interface": "eMMC 5.0"
  }
});

assertRuleDecode("IS27TH128G31-JCLI", {
  vendor: "issi",
  type: "UFS",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "FBGA-153",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)"
  }
});

assertRuleDecode("IS27TH256G21-JCLA2", {
  vendor: "issi",
  type: "UFS",
  densityMbit: 2097152,
  cellField: "TLC",
  package: "FBGA-153",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)"
  }
});

assertRuleDoesNotMatch("vendor.issi.emmc.token.v1", "IS43QR85120B-075U");
assertRuleDoesNotMatch("vendor.issi.ufs.token.v1", "IS21TF64G-JCLI");

assertRuleDecode("IS34ML04G088-BLI-TR", {
  vendor: "issi",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  package: "VFBGA-63",
  extra: {
    "Product Family": "ISSI SLC NAND",
    "Interface Type": "Parallel NAND",
    "ECC Level": "8bit",
    "Solder Type": "RoHS compliant, Halogen-free, TSCA compliant",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Packing Type": "Tape and Reel"
  },
  absentExtra: ["Package Code", "Die Revision Code", "ECC Code"]
});

assertRuleDecode("IS35MW08G168-TLA2-TY", {
  vendor: "issi",
  type: "NAND",
  densityMbit: 8192,
  cellField: "SLC",
  widthField: "x16",
  voltage: "1.7V~1.95V",
  package: "TSOP-I-48",
  extra: {
    "Product Family": "ISSI Automotive SLC NAND",
    "ECC Level": "8bit",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Packing Type": "Tray"
  }
});

assertRuleDecode("IS34MW02G084", {
  vendor: "issi",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  widthField: "x8",
  voltage: "1.7V~1.95V",
  extra: {
    "ECC Level": "4bit"
  },
  absentExtra: ["Package", "Operation Temperature", "Packing Type"]
});

assertRuleDoesNotMatch("vendor.issi.raw.parallel-slc.v1", "IS37SML08G8A-104NLI");
