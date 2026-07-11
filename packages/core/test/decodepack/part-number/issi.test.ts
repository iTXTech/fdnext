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
    "Product Generation": "2nd Gen",
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
