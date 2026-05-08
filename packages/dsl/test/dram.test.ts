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
