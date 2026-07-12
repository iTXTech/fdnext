import {
  assertNotFound,
  assertRuleDecode
} from "./_helpers";

assertRuleDecode("W29N01GV", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  extra: {
    "Product Family": "Winbond ONFI NAND",
    "Interface Type": "ONFI parallel NAND"
  },
  absentExtra: ["Package"]
});

assertRuleDecode("W29N02GVSIAA", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  widthField: "x8",
  voltage: "2.7V~3.6V",
  package: "TSOP-I-48",
  extra: {
    "Operation Temperature": "-40°C ~ 85°C"
  }
});

assertRuleDecode("W29N02GVBJAA", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 2048,
  package: "VFBGA-63",
  extra: {
    "Operation Temperature": "-40°C ~ 105°C"
  }
});

assertRuleDecode("W29N02GW", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 2048,
  widthField: "x16",
  voltage: "1.7V~1.95V"
});

assertRuleDecode("W25N01GV", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  voltage: "2.7V~3.6V",
  extra: {
    "Product Family": "Winbond QspiNAND",
    "Interface Type": "SPI / Dual SPI / Quad SPI"
  },
  absentExtra: ["Package"]
});

assertRuleDecode("W25N01GVZEIG", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 1024,
  package: "WSON-8, 8x6",
  extra: {
    "Operation Temperature": "-40°C ~ 85°C"
  }
});

assertRuleDecode("W35N04JW", {
  vendor: "winbond",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  voltage: "1.7V~1.95V",
  extra: {
    "Product Family": "Winbond High Performance QspiNAND"
  }
});

assertNotFound("W29N03GV");
