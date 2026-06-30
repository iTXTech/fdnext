import assert from "node:assert/strict";
import {
  assertDecodedField,
  assertDecodedFieldAbsent,
  assertDecodedPartNumber,
  assertDram,
  assertFieldBlock,
  assertSearchMarkingRelation,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSpectekSearchMarkingRelation,
  assertStackedDram,
  assertUnknown,
  detect,
  dramPnJson,
  mdbJson,
  micronDramFbgaEntries,
  micronFbgaCodesJson,
  resourceEntries,
  searchFbgaParts
} from "./_helpers";

assertDram("MT40A1G8SA-075-E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 7.5x11",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A1G4HX-062Y:A", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9x11.5",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "HX",
    "Config Code": "1G4",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A512M8RH-093:B", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9x10.5",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "RH",
    "Config Code": "512M8",
    "DRAM Speed": "DDR4-2133 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A512M8WE-107E:E", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 8x12",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "WE",
    "Config Code": "512M8",
    "DRAM Speed": "DDR4-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A1G8WE-083EAAT:B", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 8x12",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "WE",
    "Config Code": "1G8",
    "DRAM Speed": "DDR4-2400 CL16",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A1G16GE-068:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "GE",
    "Config Code": "1G16",
    "DRAM Speed": "DDR4-2933 CL21",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A4G4VA-062E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 10x11",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "VA",
    "Config Code": "4G4",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A2G8JC-068:E", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9x11",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "JC",
    "Config Code": "2G8",
    "DRAM Speed": "DDR4-2933 CL21",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A1G16KD-068:E", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 9x13",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "KD",
    "Config Code": "1G16",
    "DRAM Speed": "DDR4-2933 CL21",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A512M8AG-075EAUT:F", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 7.5x11",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "AG",
    "Config Code": "512M8",
    "DRAM Speed": "DDR4-2666 CL18",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Ultra-high (-40°C ~ 125°C)",
    "Die Revision": "Rev F"
  }
});

assertDram("MT40A256M16AD-083EAIT:F", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "AD",
    "Config Code": "256M16",
    "DRAM Speed": "DDR4-2400 CL16",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Die Revision": "Rev F"
  }
});

assertDram("MT40A2G4PM-062E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9x13.2",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "PM",
    "Config Code": "2G4",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A512M16JY-075E:B", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 8x14",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "JY",
    "Config Code": "512M16",
    "DRAM Speed": "DDR4-2666 CL18",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A512M16TD-062EAUT:R", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "TD",
    "Config Code": "512M16",
    "DRAM Speed": "DDR4-3200 CL22",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Ultra-high (-40°C ~ 125°C)",
    "Die Revision": "Rev R"
  }
});

assertDram("MT40A2G4TRF-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9.5x11.5x1.2",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "TRF",
    "Config Code": "2G4",
    "DRAM Speed": "DDR4-2133 CL15",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A4G4FSE-093:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 9.5x13x1.2",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "FSE",
    "Config Code": "4G4",
    "DRAM Speed": "DDR4-2133 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A2G8NRE-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 8x12x1.2",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "NRE",
    "Config Code": "2G8",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A4G8NEA-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 7.5x11x1.2",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "NEA",
    "Config Code": "4G8",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

assertDram("MT40A4G4HPR-075H:G", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 8x12x1.2",
  extra: {
    "DRAM Type": "DDR4",
    "Series": "3DS 2H",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "HPR",
    "Config Code": "4G4",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev G"
  }
});

assertDram("MT40A8G4KVA-075H:G", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78, 8x12x1.2",
  extra: {
    "DRAM Type": "DDR4",
    "Series": "3DS 4H",
    "DRAM Die Count": 4,
    "CS Count": 1,
    "Package Code": "KVA",
    "Config Code": "8G4",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev G"
  }
});

assertDram("MT40A1G16WBU-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 8x14",
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "WBU",
    "Config Code": "1G16",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A2G16TBB-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR4",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "TBB",
    "Config Code": "2G16",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

const crucialDdr4Expected = {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78, 7.5x11",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "Crucial DDR4-62M",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
};

assertDram("CT40A1G8SA-62M:E", crucialDdr4Expected);
assertDram("CT40A1G8SA-062M:E", crucialDdr4Expected);
assertDram("C9BJZ", {
  ...crucialDdr4Expected,
  extra: {
    ...crucialDdr4Expected.extra,
    "Marking Code": "C9BJZ"
  }
});
assert.deepEqual(searchFbgaParts("C9BJZ"), ["CT40A1G8SA-62M:E"]);
assert.deepEqual(searchFbgaParts("FX454"), []);
assertDram("EDY4016AABG-JD-F-D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD/VDDQ; 2.5V VPP",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 24-24-24",
    "Bank Count": 8,
    "Interface Type": "POD (1.2V pseudo open-drain I/O)",
    "Operation Temperature": "Commercial (0°C ~ 95°C)",
    "Die Revision": "Rev A",
    "Solder Type": "Lead-free (RoHS-compliant) and halogen-free",
    "Packing Type": "Dry pack (tray)"
  }
});
assertDram("EDY4016AABG-GX-F-R", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD/VDDQ; 2.5V VPP",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Bank Count": 8,
    "Interface Type": "POD (1.2V pseudo open-drain I/O)",
    "Operation Temperature": "Commercial (0°C ~ 95°C)",
    "Die Revision": "Rev A",
    "Solder Type": "Lead-free (RoHS-compliant) and halogen-free",
    "Packing Type": "Tape and Reel"
  }
});
assertDram("EDY4016AABG-DR-F-D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD/VDDQ; 2.5V VPP",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2400 16-16-16",
    "Bank Count": 8,
    "Interface Type": "POD (1.2V pseudo open-drain I/O)",
    "Operation Temperature": "Commercial (0°C ~ 95°C)",
    "Die Revision": "Rev A",
    "Solder Type": "Lead-free (RoHS-compliant) and halogen-free",
    "Packing Type": "Dry pack (tray)"
  }
});
assertDecodedPartNumber("EDY4016AABG-JD-F-R TR", "EDY4016AABG-JD-F-R");
assertSearchPnIncludes("EDY4016", "Micron EDY4016AABG-JD-F-D");
assertDram("EDB2432B4MA-1DAAT-F-D", {
  vendor: "elpida",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B4MA",
    "Config Code": "2432",
    "DRAM Speed": "LPDDR2-1066"
  }
});
assertDram("EE40A512M16HA-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR4",
    "Config Code": "512M16",
    "DRAM Speed": "DDR4-2133 CL15",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});
assertDram("EE51K256M32HF-60:B", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-170, 12x14",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "Operation Temperature": "Commercial"
  }
});
assert.deepEqual(searchFbgaParts("B9DHG"), ["MT47H32M16BT-3E"]);
const ddr3KnownPackageExpected = {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
};
assertDram("MT41K512M16HA-125:A", ddr3KnownPackageExpected);
assertDram("D9STQ", {
  ...ddr3KnownPackageExpected,
  extra: {
    ...ddr3KnownPackageExpected.extra,
    "Marking Code": "D9STQ"
  }
});
assertDecodedPartNumber("D9STQ", "MT41K512M16HA-125:A");
assertDram("D9XLQ", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 8x14",
  extra: {
    "DRAM Type": "DDR3",
    "Series": "TwinDie",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Solder Type": "Pb-free SAC302",
    "Die Revision": "Rev P",
    "Marking Code": "D9XLQ"
  }
});
assertDecodedPartNumber("D9XLQ", "MT41K512M16VRN-107IT:P");
assertDram("CT41K1024M8RH-125:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});
assertDram("MT41K1G4RA-107:D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 10.5x12",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev D"
  }
});
assertDram("MT41K512M8RH-107IT:E", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Die Revision": "Rev E"
  }
});
assertDram("MT41K256M16RE-125:A", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 10x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});
assertDram("MT41K512M8HX-125AAT:D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9x11.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev D"
  }
});
assertDram("MT41K512M16HA-125AAT:D", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev D"
  }
});
assertDram("MT41J512M4DA-093AAT:K", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x4",
  voltage: "1.5V VDD",
  package: "FBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2133 CL14",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev K"
  }
});
assertDram("MT41J128M16JT-093AAT:K", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96, 8x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2133 CL14",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev K"
  }
});
assertDram("MT41J256M8HX-107AAT:D", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-78, 9x11.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev D"
  }
});
assertDram("MT41J128M16HA-107AAT:D", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Special Option": "Automotive certified",
    "Die Revision": "Rev D"
  }
});
for (const partNumber of [
  "MT41K1G4RA-107:D",
  "MT41K512M8RH-107IT:E",
  "MT41K256M16RE-125:A",
  "MT41J512M4DA-093AAT:K",
  "MT41J128M16JT-093AAT:K",
  "MT41J256M8HX-107AAT:D",
  "MT41J128M16HA-107AAT:D"
]) {
  const packageValue = detect(partNumber).package;
  assert.ok(packageValue, `${partNumber} should expose confirmed package`);
  assert.match(packageValue, /^FBGA-\d+, [0-9.x]+$/, `${partNumber} should expose package as type-pin, dim`);
  assert.doesNotMatch(packageValue, /Rev|ball|mm|pin|Unknown/i, `${partNumber} should not leak package notes`);
}
assertUnknown("AMD41J128M16HA-107G:D");
assertDram("79JMM", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.55V VDD",
  extra: {
    "DRAM Type": "DDR2",
    "Config Code": "64M16",
    "DRAM Speed": "DDR2-666 CL5",
    "Operation Temperature": "Commercial",
    "Production Status": "Engineering Sample",
    "Die Revision": "Rev E",
    "Marking Code": "79JMM"
  }
});

const ddr5Expected = {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4800B CL40",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Die Revision": "Rev A"
  }
};

assertDram("MT60B2G8HB-48B-IT-A", ddr5Expected);
assertDram("MT60B2G8HB-48B IT:A", ddr5Expected);

assertDram("MT60B2G8HB-32B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-3200B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B2G8HB-44B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B3G8RW-64B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-78, 8x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RW",
    "Config Code": "3G8",
    "DRAM Speed": "DDR5-6400B CL52",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B1536M16RV-56B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 8x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RV",
    "Config Code": "1536M16",
    "DRAM Speed": "DDR5-5600B CL46",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B4G8AT-64B:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-78, 7.5x11.5",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "AT",
    "Config Code": "4G8",
    "DRAM Speed": "DDR5-6400B CL52",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B2G8HB-56B:G", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-5600B CL46",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev G"
  }
});

assertDram("MT60B4G4HB-48B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "4G4",
    "DRAM Speed": "DDR5-4800B CL40",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B2G8HB-48BAT:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4800B CL40",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B1G16HC-52B IT:G", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 9x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HC",
    "Config Code": "1G16",
    "DRAM Speed": "DDR5-5200B CL42",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Die Revision": "Rev G"
  }
});

assertDram("MT60B4G4RZ-92B:H", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-78, 7.5x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RZ",
    "Config Code": "4G4",
    "DRAM Speed": "DDR5-9200B CL74",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H"
  }
});

assertDram("MT60B1G16HD-72BAAT:H", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 7.5x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HD",
    "Config Code": "1G16",
    "DRAM Speed": "DDR5-7200B CL58",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Die Revision": "Rev H"
  }
});

assertDram("MT60B2G8RZ-64BAAT:D", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-78, 7.5x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RZ",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-6400B CL52",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Die Revision": "Rev D"
  }
});

assertDram("MT60B1G16HD-56BAAT:D", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 7.5x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HD",
    "Config Code": "1G16",
    "DRAM Speed": "DDR5-5600B CL46",
    "Special Option": "Automotive certified",
    "Operation Temperature": "Automotive (-40°C ~ 105°C)",
    "Die Revision": "Rev D"
  }
});

assertDecodedField("MT60B4G4RZ-80B:H", "dram_speed", "DDR5-8000B CL64");
assertDecodedField("MT60B2G8RZ-88B:H", "dram_speed", "DDR5-8800B CL72");

assertDram("MT60B6G4RW-48B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-78, 8x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RW",
    "Config Code": "6G4",
    "DRAM Speed": "DDR5-4800B CL40",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B6G4JF-64B:C", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9.5x11",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "JF",
    "Config Code": "6G4",
    "DRAM Speed": "DDR5-6400B CL52",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT60B1536M16HZ-80B:C", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 9.5x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HZ",
    "Config Code": "1536M16",
    "DRAM Speed": "DDR5-8000B CL64",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDecodedField("MT60B3G8JF-72B:C", "dram_speed", "DDR5-7200B CL58");
assertDecodedField("MT60B6G4JFA-72B:C", "dram_speed", "DDR5-7200B CL58");
assertDecodedFieldAbsent("MT60B6G4JFA-72B:C", "package");

assertDram("MT60B1536M16RV-64B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 8x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RV",
    "Config Code": "1536M16",
    "DRAM Speed": "DDR5-6400B CL52",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B8G4AT-72B:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-78, 7.5x11.5",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "AT",
    "Config Code": "8G4",
    "DRAM Speed": "DDR5-7200B CL58",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B2G16HD-64B IT:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-102, 7.5x14",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HD",
    "Config Code": "2G16",
    "DRAM Speed": "DDR5-6400B CL52",
    "Operation Temperature": "Industrial (-40°C ~ 95°C)",
    "Die Revision": "Rev B"
  }
});
