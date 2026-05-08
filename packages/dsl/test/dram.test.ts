import assert from "node:assert/strict";
import type { FlashInfo } from "../../core/src/index";
import { createEngine } from "../../core/src/index";
import dramPnJson from "../../resources/resources/dram-pn.json" with { type: "json" };
import micronDramFbgaJson from "../../resources/resources/micron-dram-fbga.json" with { type: "json" };
import { embeddedResources } from "../../resources/index";
import { compileRulesToDecoders, defaultDslRules } from "../src/index";

const engine = createEngine({
  resources: embeddedResources,
  decoders: compileRulesToDecoders(defaultDslRules)
});

const redundantStandaloneExtra = [
  "Product Family",
  "Product Version",
  "DRAM Density",
  "DRAM Width",
  "Reference Status",
  "Inference Source",
  "source",
  "status"
];

const standaloneDramExtraKeys = new Set([
  "Config Code",
  "DRAM Type",
  "DRAM Die Stack",
  "Package Code",
  "DRAM Speed",
  "Operation Temperature",
  "Production Status",
  "Die Revision",
  "Micron Part Number"
]);

const standardDramTypes = new Set([
  "SDR SDRAM",
  "LPSDR SDRAM",
  "DDR SDRAM",
  "DDR2 SDRAM",
  "DDR3 SDRAM",
  "DDR4 SDRAM",
  "DDR5 SDRAM",
  "LPDDR SDRAM",
  "LPDDR2 SDRAM",
  "LPDDR3 SDRAM",
  "LPDDR4 SDRAM",
  "LPDDR4X SDRAM",
  "LPDDR5 SDRAM",
  "LPDDR5X SDRAM",
  "GDDR SGRAM",
  "GDDR2 SGRAM",
  "GDDR3 SGRAM",
  "GDDR4 SGRAM",
  "GDDR5 SGRAM",
  "GDDR5X SGRAM",
  "GDDR6 SGRAM",
  "GDDR6X SGRAM",
  "GDDR7 SGRAM",
  "RLDRAM",
  "RLDRAM 3"
]);

function detect(partNumber: string): FlashInfo {
  return engine.detect(partNumber, { lang: "eng", combineFdb: false });
}

function extra(info: FlashInfo): Record<string, unknown> {
  assert.equal(typeof info.extraInfo, "object", `${info.partNumber} should expose extraInfo`);
  assert.ok(!Array.isArray(info.extraInfo), `${info.partNumber} extraInfo should be a keyed object`);
  return info.extraInfo as Record<string, unknown>;
}

function assertSearchPnIncludes(query: string, expected: string): void {
  const result = engine.searchPartNumber(query, { lang: "eng", limit: 50 });
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

function assertSearchPnFirst(query: string, expected: string): void {
  const result = engine.searchPartNumber(query, { lang: "eng", limit: 1 });
  assert.deepEqual(result, [expected], `${query} should prefer known DRAM PN suggestions`);
}

function assertDram(
  partNumber: string,
  expected: {
    rawVendor?: string;
    rawDensity: number;
    density: string;
    deviceWidth: string;
    voltage: string;
    package: string;
    extra: Record<string, unknown>;
    absentExtra?: string[];
  }
): void {
  const info = detect(partNumber);
  assert.equal(info.rawVendor, expected.rawVendor ?? "micron", partNumber);
  assert.equal(info.type, "DRAM", partNumber);
  assert.equal(info.rawDensity, expected.rawDensity, partNumber);
  assert.equal(info.density, expected.density, partNumber);
  assert.equal(info.deviceWidth, expected.deviceWidth, partNumber);
  assert.equal(info.voltage, expected.voltage, partNumber);
  assert.equal(info.package, expected.package, partNumber);

  const extraInfo = extra(info);
  for (const key of Object.keys(extraInfo)) {
    assert.ok(standaloneDramExtraKeys.has(key), `${partNumber} should use standardized DRAM extra key ${key}`);
  }
  assert.equal(typeof extraInfo["DRAM Type"], "string", `${partNumber} should expose standardized DRAM Type`);
  assert.ok(standardDramTypes.has(String(extraInfo["DRAM Type"])), `${partNumber} should use standard DRAM Type`);
  assert.equal(String(extraInfo["DRAM Type"]).includes("/"), false, `${partNumber} DRAM Type should not combine multiple alternatives`);

  for (const [key, value] of Object.entries(expected.extra)) {
    assert.equal(extraInfo[key], value, `${partNumber} extraInfo.${key}`);
  }
  for (const key of [...redundantStandaloneExtra, ...(expected.absentExtra ?? [])]) {
    assert.equal(Object.hasOwn(extraInfo, key), false, `${partNumber} should not expose extraInfo.${key}`);
  }
}

function assertUnknown(partNumber: string): void {
  const info = detect(partNumber);
  assert.equal(info.rawVendor, "Unknown", `${partNumber} should not be decoded as a known vendor`);
  assert.equal(info.type, "Unknown", `${partNumber} should not be decoded as a known type`);
}

const dramPn = dramPnJson as { entries?: unknown[] };
const micronDramFbga = micronDramFbgaJson as { entries?: unknown[] };
const dramPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);
const seenDramPn = new Set<string>();
for (const entry of dramPn.entries ?? []) {
  assert.equal(typeof entry, "object", "DRAM PN entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "DRAM PN entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.pn, "string", "DRAM PN entry should include pn");
  assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
  assert.equal(record.type, "dram", `${String(record.pn)} should be a DRAM catalog entry`);
  assert.equal(typeof record.standard, "string", `${String(record.pn)} should include standard`);
  assert.ok(!seenDramPn.has(String(record.pn)), `${String(record.pn)} should only appear once`);
  seenDramPn.add(String(record.pn));

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((key) => dramPnForbiddenKeys.has(key)),
    [],
    `DRAM PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

const seenMicronDramFbga = new Set<string>();
for (const entry of micronDramFbga.entries ?? []) {
  assert.equal(typeof entry, "object", "Micron DRAM FBGA entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "Micron DRAM FBGA entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.code, "string", "Micron DRAM FBGA entry should include code");
  assert.match(String(record.code), /^[0-9A-Z]{5}$/, `${String(record.code)} should be a five-character FBGA code`);
  assert.equal(typeof record.pn, "string", `${String(record.code)} should include pn`);
  assert.match(
    String(record.pn),
    /^(?:MT|CT|ED|EE)/,
    `${String(record.code)} should map only to Micron MT/Crucial CT or Micron legacy Elpida DRAM PN`
  );
  assert.equal(record.vendor, "micron", `${String(record.code)} should be a Micron/Crucial DRAM FBGA entry`);
  assert.equal(record.type, "dram", `${String(record.code)} should be a DRAM FBGA entry`);
  assert.equal(typeof record.standard, "string", `${String(record.code)} should include standard`);

  const key = `${String(record.code)}\0${String(record.pn)}`;
  assert.ok(!seenMicronDramFbga.has(key), `${String(record.code)} ${String(record.pn)} should only appear once`);
  seenMicronDramFbga.add(key);

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((keyName) => dramPnForbiddenKeys.has(keyName)),
    [],
    `Micron DRAM FBGA entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

assertDram("MT40A1G8SA-075-E", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

const crucialDdr4Expected = {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "Crucial DDR4 speed bin 62M",
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
    "Micron Part Number": "CT40A1G8SA-62M:E"
  }
});
assert.deepEqual(engine.searchMicronFbgaCode("C9BJZ"), ["CT40A1G8SA-62M:E"]);
assertDram("C9BHZ", {
  rawVendor: "elpida",
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR2 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "B4MA",
    "Config Code": "2432",
    "DRAM Speed": "LPDDR2-1066",
    "Micron Part Number": "EDB2432B4MA-1DAAT-F-D"
  }
});
assert.deepEqual(engine.searchMicronFbgaCode("C9BHZ"), ["EDB2432B4MA-1DAAT-F-D"]);
assertDram("CZZZG", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x16",
  voltage: "1.2V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Config Code": "512M16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H",
    "Micron Part Number": "EE40A512M16HA-093E:A"
  }
});
assert.deepEqual(engine.searchMicronFbgaCode("CZZZG"), ["EE40A512M16HA-093E:A"]);
assertDram("D9BCS", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.35V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5 SGRAM",
    "Package Code": "HF",
    "Config Code": "256M32",
    "Operation Temperature": "Commercial",
    "Micron Part Number": "EE51K256M32HF-60:B"
  }
});
assert.deepEqual(engine.searchMicronFbgaCode("D9BCS"), ["EE51K256M32HF-60:B"]);
assertUnknown("AMD41J128M16HA-107G:D");
assertUnknown("79JMM");

const ddr5Expected = {
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5 SDRAM",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4800B",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
};

assertDram("MT60B2G8HB-48B-IT-A", ddr5Expected);
assertDram("MT60B2G8HB-48B IT:A", ddr5Expected);

assertDram("MT53E1G32D2FW-046-AIT-A", {
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.1V VDD / 1.1V or 0.6V VDDQ",
  package: "200-ball TFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR4X SDRAM",
    "DRAM Die Stack": "2-die stack",
    "Package Code": "FW",
    "Config Code": "1G32",
    "DRAM Speed": "LPDDR4-4266 (2133 MHz)",
    "Operation Temperature": "Automotive Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT62F1G32D4DS-031-WT-B", {
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "200-ball WFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "4-die stack",
    "Package Code": "DS",
    "Config Code": "1G32",
    "DRAM Speed": "LPDDR5-6400 (3200 MHz)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT62F1G64D4EK-023 WT:B", {
  rawDensity: 65536,
  density: "64Gb",
  deviceWidth: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "441-ball TFBGA",
  extra: {
    "DRAM Type": "LPDDR5X SDRAM",
    "DRAM Die Stack": "4-die stack",
    "Package Code": "EK",
    "Config Code": "1G64",
    "DRAM Speed": "LPDDR5X-8533 (4266 MHz)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT62F1G32D4DS", {
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "200-ball WFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "4-die stack",
    "Package Code": "DS",
    "Config Code": "1G32",
    "Operation Temperature": "Commercial"
  },
  absentExtra: ["DRAM Speed", "Die Revision"]
});

assertDram("MT41K512M8DA-107:P", {
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x10.5)",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "Package Code": "DA",
    "Config Code": "512M8",
    "DRAM Speed": "1866 MT/s / 933 MHz speed bin",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  }
});

assertDram("MT47H128M16RT-25E:C", {
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA (9x12.5)",
  extra: {
    "DRAM Type": "DDR2 SDRAM",
    "Package Code": "RT",
    "Config Code": "128M16",
    "DRAM Speed": "DDR2-800",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT46V32M16P-5B-IT-J", {
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP",
  extra: {
    "DRAM Type": "DDR SDRAM",
    "Package Code": "P",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev J"
  }
});

assertDram("MT46H32M32LFB5-5 IT:B", {
  rawDensity: 1024,
  density: "1Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD",
  package: "90-ball VFBGA (8x13)",
  extra: {
    "DRAM Type": "LPDDR SDRAM",
    "DRAM Die Stack": "Single die",
    "Package Code": "B5",
    "Config Code": "32M32",
    "DRAM Speed": "200 MHz speed bin",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT48LC16M8A2P-6A:L", {
  rawDensity: 128,
  density: "128Mb",
  deviceWidth: "x8",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR SDRAM",
    "Package Code": "P",
    "Config Code": "16M8",
    "DRAM Speed": "166 MHz speed bin",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev L"
  }
});

assertDram("MT48H16M32LFB5-75:A", {
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x32",
  voltage: "1.8V VDD",
  package: "90-ball VFBGA (8x13)",
  extra: {
    "DRAM Type": "LPSDR SDRAM",
    "DRAM Die Stack": "Single die",
    "Package Code": "B5",
    "Config Code": "16M32",
    "DRAM Speed": "133 MHz speed bin",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT42L128M32D1LF-25 WT:A", {
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x32",
  voltage: "1.2V VDD",
  package: "168-ball WFBGA (12x12)",
  extra: {
    "DRAM Type": "LPDDR2 SDRAM",
    "DRAM Die Stack": "Single die",
    "Package Code": "LF",
    "Config Code": "128M32",
    "DRAM Speed": "400 MHz speed bin",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT52L512M32D2PF-107 WT:B", {
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.2V VDD",
  package: "178-ball FBGA (11.5x11)",
  extra: {
    "DRAM Type": "LPDDR3 SDRAM",
    "DRAM Die Stack": "2-die stack",
    "Package Code": "PF",
    "Config Code": "512M32",
    "DRAM Speed": "1866 MT/s / 933 MHz speed bin",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT51J256M32HF-80:A", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.5V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5 SGRAM",
    "Package Code": "HF",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5-8Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT58K256M32JA-100:A", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.35V VDD",
  package: "190-ball FBGA (10x14)",
  extra: {
    "DRAM Type": "GDDR5X SGRAM",
    "Package Code": "JA",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5X-10Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K256M32JE-14:A", {
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6 SGRAM",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-14Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K512M32KPA-24-U", {
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6X SGRAM",
    "Package Code": "KPA",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR6X-24Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev U"
  }
});

assertDram("MT68A512M32DF-32:A", {
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.2V VDD",
  package: "266-ball FBGA (12x14x1.1)",
  extra: {
    "DRAM Type": "GDDR7 SGRAM",
    "Package Code": "DF",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR7-32Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("H5TQ4G63AFR-TEC", {
  rawVendor: "skhynix",
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x16",
  voltage: "1.5V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "Package Code": "F",
    "Config Code": "4G63",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5TC4G83CFR-PBA", {
  rawVendor: "skhynix",
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "CFR"
  }
});

assertDram("H5AN8G8NAFR-UHC", {
  rawVendor: "skhynix",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Package Code": "F",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-2400T 17-17-17",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5AN8G8NCJR-XNC", {
  rawVendor: "skhynix",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Package Code": "J",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CJR"
  }
});

assertDram("H5CG48AGBD-X018", {
  rawVendor: "skhynix",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x8",
  voltage: "1.1V VDD",
  package: "BGA",
  extra: {
    "DRAM Type": "DDR5 SDRAM",
    "DRAM Die Stack": "Single die",
    "Package Code": "X018",
    "Config Code": "G48",
    "DRAM Speed": "DDR5-5600",
    "Die Revision": "A-die"
  }
});

assertDram("H5AN8G8NAFR", {
  rawVendor: "skhynix",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "Package Code": "F",
    "Config Code": "8G8N",
    "Die Revision": "AFR"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("H5GQ2H24AFR-R0C", {
  rawVendor: "skhynix",
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball BGA",
  extra: {
    "DRAM Type": "GDDR5 SGRAM",
    "Package Code": "F",
    "Config Code": "2H24",
    "DRAM Speed": "GDDR5-6.0Gbps/pin",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H9HCNNN8KUMLHR-NME", {
  rawVendor: "skhynix",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "UMLHR",
    "Config Code": "8K",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9HCNNNCPUMLXR-NEE", {
  rawVendor: "skhynix",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4 SDRAM",
    "DRAM Die Stack": "QDP (4-die), 2 CS",
    "Package Code": "UMLXR",
    "Config Code": "CP",
    "DRAM Speed": "LPDDR4-4266",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9HCNNNCPMMLXR-NEE", {
  rawVendor: "skhynix",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X SDRAM",
    "DRAM Die Stack": "QDP (4-die), 2 CS",
    "Package Code": "MMLXR",
    "Config Code": "CP",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("HY57V561620FTP-H", {
  rawVendor: "skhynix",
  rawDensity: 256,
  density: "256Mb",
  deviceWidth: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR SDRAM",
    "Package Code": "FTP",
    "Config Code": "561620",
    "DRAM Speed": "SDR speed bin H"
  }
});

assertDram("HY5DU121622DTP-D43", {
  rawVendor: "skhynix",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "2.6V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR SDRAM",
    "Package Code": "DTP",
    "Config Code": "121622",
    "DRAM Speed": "DDR-400B (3-3-3)"
  }
});

assertDram("HY5PS121621CFP-Y5", {
  rawVendor: "skhynix",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2 SDRAM",
    "Package Code": "CFP",
    "Config Code": "121621",
    "DRAM Speed": "DDR2 speed bin Y5"
  }
});

assertDram("H9JCNNNCP3MLYR-N6E", {
  rawVendor: "skhynix",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "QDP (4-die), 2 CS",
    "Package Code": "MLYR",
    "Config Code": "CP3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNBK3MLYR-N6E", {
  rawVendor: "skhynix",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "MLYR",
    "Config Code": "BK3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNFA5MLYR-N6E", {
  rawVendor: "skhynix",
  rawDensity: 65536,
  density: "64Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "ODP (8-die), 2 CS",
    "Package Code": "MLYR",
    "Config Code": "FA5",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H58G56CK8BX146", {
  rawVendor: "skhynix",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "CK8BX146",
    "Config Code": "56",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDram("H58G66CK8BX147", {
  rawVendor: "skhynix",
  rawDensity: 65536,
  density: "64Gb",
  deviceWidth: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X SDRAM",
    "DRAM Die Stack": "QDP (4-die), 2 CS",
    "Package Code": "CK8BX147",
    "Config Code": "66",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDram("H58G78CK8BX185", {
  rawVendor: "skhynix",
  rawDensity: 131072,
  density: "128Gb",
  deviceWidth: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X SDRAM",
    "DRAM Die Stack": "2Ch 2CS",
    "Package Code": "CK8BX185",
    "Config Code": "78",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDram("H56C8H24MJR-S2C", {
  rawVendor: "skhynix",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.8V / 1.35V / 1.35V",
  package: "180-ball FBGA",
  extra: {
    "DRAM Type": "GDDR6 SGRAM",
    "Package Code": "FBGA-180",
    "Config Code": "C8H24",
    "DRAM Speed": "GDDR6 speed bin S2",
    "Operation Temperature": "Commercial",
    "Die Revision": "MJR"
  }
});

assertDram("K4A8G085WB-BCRC", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "5WB",
    "Config Code": "8G08",
    "DRAM Speed": "DDR4-2400",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4A8G085WB", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "5WB",
    "Config Code": "8G08"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("K4S511632D-UC75", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "U",
    "Config Code": "5116",
    "DRAM Speed": "SDR-133",
    "Operation Temperature": "Commercial"
  }
});

assertDram("K4H510838F-HCCC", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x8",
  voltage: "2.5V VDD",
  package: "60-ball FBGA",
  extra: {
    "DRAM Type": "DDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "H",
    "Config Code": "5108",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Commercial"
  }
});

assertDram("K4T56163QI-ZCE6", {
  rawVendor: "samsung",
  rawDensity: 256,
  density: "256Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "Z",
    "Config Code": "5616",
    "DRAM Speed": "DDR2-667",
    "Operation Temperature": "Commercial"
  }
});

assertDram("K4B1G0846D-HCF7", {
  rawVendor: "samsung",
  rawDensity: 1024,
  density: "1Gb",
  deviceWidth: "x8",
  voltage: "1.5V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "H",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-800",
    "Operation Temperature": "Commercial"
  }
});

assertDram("K4RAH086VB-BCQK", {
  rawVendor: "samsung",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "6VB",
    "Config Code": "AH08",
    "DRAM Speed": "DDR5-4800",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K3PE7E700M-XGC1", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR2 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 2 CS",
    "Package Code": "E700M",
    "Config Code": "3PE7",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3QF1F10DM-AGCE", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x64",
  voltage: "1.8V / 1.2V / 1.2V",
  package: "253-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR3 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "F10DM",
    "Config Code": "3QF1",
    "DRAM Speed": "LPDDR3-1600",
    "Operation Temperature": "-25C~70C"
  }
});

assertDram("K4F6E304HB-MGCJ", {
  rawVendor: "samsung",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.8V / 1.1V / 1.1V",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "E304HB",
    "Config Code": "4F6",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3LKBKB0BM-MGCP", {
  rawVendor: "samsung",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "KB0BM",
    "Config Code": "3LKB",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K4U6E3S4AA-MGCL", {
  rawVendor: "samsung",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "E3S4AA",
    "Config Code": "4U6",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K4X51163PC", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Config Code": "51163"
  },
  absentExtra: ["Package Code", "DRAM Speed", "Operation Temperature"]
});

assertDram("K4X51163PC-FGC3", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "60-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "F",
    "Config Code": "51163",
    "DRAM Speed": "Mobile DDR-133 CL3",
    "Operation Temperature": "Extended, low power, i-TCSR, PASR, DS"
  }
});

assertDram("K4D263238E-GC33", {
  rawVendor: "samsung",
  rawDensity: 128,
  density: "128Mb",
  deviceWidth: "x32",
  voltage: "2.5V VDD/VDDQ",
  package: "144-ball FBGA",
  extra: {
    "DRAM Type": "GDDR SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "E",
    "Config Code": "263238",
    "DRAM Speed": "GDDR speed bin GC33"
  }
});

assertDram("K4N56163QF-GC37", {
  rawVendor: "samsung",
  rawDensity: 256,
  density: "256Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "GDDR2 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "QF",
    "Config Code": "56163",
    "DRAM Speed": "GDDR2-533Mbps/pin"
  }
});

assertDram("K4J52324QC-BC14", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR3 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "QC",
    "Config Code": "52324",
    "DRAM Speed": "GDDR3-1.4Gbps/pin"
  }
});

assertDram("K4U52324QE-BC08", {
  rawVendor: "samsung",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR4 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "QE",
    "Config Code": "52324",
    "DRAM Speed": "GDDR4 speed bin BC08"
  }
});

assertDram("K4G80325FB-HC25", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball FBGA",
  extra: {
    "DRAM Type": "GDDR5 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "FB",
    "Config Code": "80325",
    "DRAM Speed": "GDDR5-8.0Gbps"
  }
});

assertDram("K4Z80325BC-HC14", {
  rawVendor: "samsung",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA",
  extra: {
    "DRAM Type": "GDDR6 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "BC",
    "Config Code": "80325",
    "DRAM Speed": "GDDR6-14.0Gbps"
  }
});

assertDram("K4VAF325ZC-SC32", {
  rawVendor: "samsung",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.2V VDD",
  package: "266-ball FBGA",
  extra: {
    "DRAM Type": "GDDR7 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "ZC",
    "Config Code": "AF325",
    "DRAM Speed": "GDDR7-32.0Gbps"
  }
});

assertDram("NT5DS32M16CS-5T", {
  rawVendor: "nanya",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "CS",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400"
  }
});

assertDram("NT5TU32M16FG-ACI", {
  rawVendor: "nanya",
  rawDensity: 512,
  density: "512Mb",
  deviceWidth: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "FG",
    "Config Code": "32M16",
    "DRAM Speed": "DDR2-800",
    "Operation Temperature": "Industrial (-40C~95C)"
  }
});

assertDram("NT5CB128M16JR-DI", {
  rawVendor: "nanya",
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600"
  }
});

assertDram("NT5CC128M16JR-DI", {
  rawVendor: "nanya",
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x16",
  voltage: "1.35V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600"
  }
});

assertDram("NT5AD1024M8C3-HR", {
  rawVendor: "nanya",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "C3",
    "Config Code": "1024M8",
    "DRAM Speed": "DDR4-2666"
  }
});

assertDram("NT5AD1024M8C3", {
  rawVendor: "nanya",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x8",
  voltage: "1.2V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "C3",
    "Config Code": "1024M8"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("NT5FF1024M16A4-Q5", {
  rawVendor: "nanya",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x16",
  voltage: "1.1V VDD",
  package: "106-ball BGA",
  extra: {
    "DRAM Type": "DDR5 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "A4",
    "Config Code": "1024M16",
    "DRAM Speed": "DDR5-5600",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT6TL128M32BA-G0", {
  rawVendor: "nanya",
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "134-ball BGA",
  extra: {
    "DRAM Type": "LPDDR2 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "BA",
    "Config Code": "128M32",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "Commercial (-25C~85C)"
  }
});

assertDram("NT6CL256M32AM-H0", {
  rawVendor: "nanya",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "178-ball BGA",
  extra: {
    "DRAM Type": "LPDDR3 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "AM",
    "Config Code": "256M32",
    "DRAM Speed": "LPDDR3-2133",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6AP512T32AV-J1", {
  rawVendor: "nanya",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball BGA",
  extra: {
    "DRAM Type": "LPDDR4X SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "AV",
    "Config Code": "512T32",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K2", {
  rawVendor: "nanya",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball BGA",
  extra: {
    "DRAM Type": "LPDDR5 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5-7500",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K1", {
  rawVendor: "nanya",
  rawDensity: 16384,
  density: "16Gb",
  deviceWidth: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball BGA",
  extra: {
    "DRAM Type": "LPDDR5X SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("EDS1216AATA-75", {
  rawVendor: "elpida",
  rawDensity: 128,
  density: "128Mb",
  deviceWidth: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "AATA",
    "Config Code": "1216",
    "DRAM Speed": "133 MHz speed bin"
  }
});

assertDram("EDD2516AKTA-5B", {
  rawVendor: "elpida",
  rawDensity: 256,
  density: "256Mb",
  deviceWidth: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "AKTA",
    "Config Code": "2516",
    "DRAM Speed": "DDR-400"
  }
});

assertDram("EDE1116ACBG-8E", {
  rawVendor: "elpida",
  rawDensity: 1024,
  density: "1Gb",
  deviceWidth: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "ACBG",
    "Config Code": "1116",
    "DRAM Speed": "DDR2-800"
  }
});

assertDram("EDJ4208BASE-GN", {
  rawVendor: "elpida",
  rawDensity: 4096,
  density: "4Gb",
  deviceWidth: "x8",
  voltage: "1.5V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "BASE",
    "Config Code": "4208",
    "DRAM Speed": "DDR3-1600K (11-11-11)"
  }
});

assertDram("EDF8164A3MA-GD-F", {
  rawVendor: "elpida",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR3 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 1 CS",
    "Package Code": "A3MA",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR3-1066 validation bin"
  }
});

assertDram("EDB8164B3PF-8D", {
  rawVendor: "elpida",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR2 SDRAM",
    "DRAM Die Stack": "DDP (2-die), 2 CS",
    "Package Code": "B3PF",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR2-1066"
  }
});

assertDram("EDW2032BBBG-60", {
  rawVendor: "elpida",
  rawDensity: 2048,
  density: "2Gb",
  deviceWidth: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball FBGA",
  extra: {
    "DRAM Type": "GDDR5 SGRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "BBBG",
    "Config Code": "2032",
    "DRAM Speed": "GDDR5-6.0Gbps"
  }
});

assertDram("CXDQ3BFAM-CJ", {
  rawVendor: "cxmt",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "FAM",
    "Config Code": "3B",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("CXDQ3BFAM", {
  rawVendor: "cxmt",
  rawDensity: 8192,
  density: "8Gb",
  deviceWidth: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4 SDRAM",
    "DRAM Die Stack": "Single die, 1 CS",
    "Package Code": "FAM",
    "Config Code": "3B"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("CXDB5CCAM-MK", {
  rawVendor: "cxmt",
  rawDensity: 32768,
  density: "32Gb",
  deviceWidth: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X SDRAM",
    "DRAM Die Stack": "QDP (4-die), 2 CS",
    "Package Code": "CAM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-3733"
  }
});

assertSearchPnFirst("K4VAF325", "Samsung K4VAF325ZC-SC32");
assertSearchPnIncludes("NT6BR1024", "Nanya NT6BR1024M16A3-K2");
assertSearchPnIncludes("EDW2032", "Elpida EDW2032BBBG-60");
assertSearchPnIncludes("CXDB5C", "CXMT CXDB5CCAM-MK");
assertSearchPnIncludes("H5CG48", "SKhynix H5CG48AGBD-X018");
assertSearchPnIncludes("MT40A4G4DVN", "Micron MT40A4G4DVN-062H:E");
assertSearchPnIncludes("FX454", "Micron FX454 MT40A4G4DVN-062H:E");
assertSearchPnIncludes("C9BJZ", "Micron C9BJZ CT40A1G8SA-62M:E");
