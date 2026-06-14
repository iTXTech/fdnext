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

assertDram("MT62F1G64D4EK-023 WT:B", {
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "TFBGA-441",
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
    package: "TFBGA-441",
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
  package: "TFBGA-441",
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
