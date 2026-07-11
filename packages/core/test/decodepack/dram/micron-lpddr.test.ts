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

assertDram("MT53E1G32D2FW-046-AIT-A", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 1.1V or 0.6V VDDQ",
  package: "TFBGA-200, 10x14.5",
  topology: { ce: "Unknown", die: 2 },
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "FW",
    "Config Code": "1G32",
    "DRAM Speed": "2133MHz (LPDDR4-4266)",
    "Operation Temperature": "Automotive Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT53E1G32DDFW-046-AIT:A", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 1.1V or 0.6V VDDQ",
  package: "TFBGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "FW",
    "Config Code": "1G32",
    "DRAM Speed": "2133MHz (LPDDR4-4266)",
    "Operation Temperature": "Automotive Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A",
    "Special Option": "LPDDR4 mixed die stack (1x Z42M + 2x Z42N)"
  }
});
assertDecodedField("MT53E1G32DDFW-046-AIT:A", "dram_die_count", 3);

assertDram("MT62F1G32D4DS-031-WT-B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "WFBGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT62F1G32D3DS-031-WT:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "WFBGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});
assertDecodedField("MT62F1G32D3DS-031-WT:B", "dram_die_count", 3);

const micronMdbExtendedOrganizationSamples = [
  ["MT62F3G64DAZA-023 WT:C", "LPDDR5X", 196608, "192Gb", "x64"],
  ["MT62F2G128DAWA-031 XT:A", "LPDDR5", 262144, "256Gb", "x128"],
  ["MT62F768M128D8AK-026 XT:B", "LPDDR5", 98304, "96Gb", "x128"],
  ["MT62F12G32DADV-023S:B", "LPDDR5X", 393216, "384Gb", "x32"],
  ["MT53D1024M32D4NQ-046 WT:D", "LPDDR4X", 32768, "32Gb", "x32"],
  ["MT53D1024M64D8NW-046 WT:D", "LPDDR4X", 65536, "64Gb", "x64"],
  ["MT53D2048M32D8QD-046 WT:D", "LPDDR4X", 65536, "64Gb", "x32"],
  ["MT53E3G32D6CY-046 WT:C", "LPDDR4X", 98304, "96Gb", "x32"]
] as const;

for (const [partNumber, type, densityMbit, density, widthField] of micronMdbExtendedOrganizationSamples) {
  const info = detect(partNumber);
  assert.equal(info.vendor, "micron", partNumber);
  assert.equal(info.type, type, partNumber);
  assert.equal(info.densityMbit, densityMbit, partNumber);
  assert.equal(info.density, density, partNumber);
  assert.equal(info.widthField, widthField, partNumber);
}

assertDram("MT62F1G64D4EK-023 WT:B", {
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "TFBGA-441, 14x14x1.1",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "EK",
    "Config Code": "1G64",
    "DRAM Speed": "4266MHz (LPDDR5X-8533)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT62F2G32D4DS-023 RS WT:C-DNU", {
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "WFBGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "4266MHz (LPDDR5X-8533)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev C"
  }
});
assertDecodedField("MT62F2G32D4DS-023 RS WT:C-DNU", "dram_die_count", 4);

assertDram("MT62F1G64D4AM-031 XT ES:B-DNU", {
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Wide temperature",
    "Production Status": "Engineering Sample",
    "Die Revision": "Rev B"
  }
});
assertDecodedField("MT62F1G64D4AM-031 XT ES:B-DNU", "dram_die_count", 4);

const micronLpddr5Automotive441bSamples = [
  {
    partNumber: "MT62F512M64D4EK-031 AIT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Industrial (-40°C ~ 95°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 AAT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 AUT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Ultra (-40°C ~ 125°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 FAAT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)",
    specialOption: "Functional safety features"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AIT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Industrial (-40°C ~ 95°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AAT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AUT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Ultra (-40°C ~ 125°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 FAAT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)",
    specialOption: "Functional safety features"
  }
] as const;

for (const sample of micronLpddr5Automotive441bSamples) {
  const specialOption = "specialOption" in sample ? sample.specialOption : undefined;
  assertDram(sample.partNumber, {
    densityMbit: sample.densityMbit,
    density: sample.density,
    widthField: "x64",
    voltage: "1.05V VDD / 0.5V VDDQ",
    package: "TFBGA-441, 14x14x1.1",
    extra: {
      "DRAM Type": "LPDDR5",
      "Package Code": "EK",
      "Config Code": sample.configCode,
      "DRAM Speed": "3200MHz (LPDDR5-6400)",
      "Operation Temperature": sample.operationTemperature,
      "Die Revision": "Rev B",
      ...(specialOption ? { "Special Option": specialOption } : {})
    },
    absentExtra: specialOption ? [] : ["Special Option"]
  });
  assertDecodedField(sample.partNumber, "dram_die_count", sample.dieCount);
}

assertDram("MT62F512M64D4EK-031FAATB", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "TFBGA-441, 14x14x1.1",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "EK",
    "Config Code": "512M64",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Automotive Grade (-40°C ~ 105°C)",
    "Die Revision": "Rev B",
    "Special Option": "Functional safety features"
  }
});
assertDecodedField("MT62F512M64D4EK-031FAATB", "dram_die_count", 4);

for (const [partNumber, dramType, packageName] of [
  ["MT62F2G64D8CZ-020FAAT:D", "LPDDR5X", "TFBGA-561, 8x12.4x1.2"],
  ["MT62F4G32D8DV-020AIT:D", "LPDDR5X", "LFBGA-315, 12.4x15x1.3"],
  ["MT62F1G64D4K2-020VWT:D", "LPDDR5X", "UFBGA-496, 14x12.4x0.58"],
  ["MT62F768M64D4ZU-026 WT:B", "LPDDR5", "UFBGA-496, 14x12.4x0.65"]
] as const) {
  assertDecodedField(partNumber, "dram_type", dramType);
  assertDecodedField(partNumber, "package", packageName);
}
