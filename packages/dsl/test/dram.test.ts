import assert from "node:assert/strict";
import type { FlashInfo } from "../../core/src/index";
import { createEngine } from "../../core/src/index";
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
  "Die Revision"
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
  "LPDDR5 SDRAM",
  "GDDR5 SGRAM",
  "GDDR5X SGRAM",
  "GDDR6 SGRAM",
  "GDDR6X SGRAM",
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

function assertDram(
  partNumber: string,
  expected: {
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
  assert.equal(info.rawVendor, "micron", partNumber);
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
    "DRAM Type": "LPDDR4 SDRAM",
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
