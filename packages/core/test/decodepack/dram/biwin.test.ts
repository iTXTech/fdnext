import { assertDram } from "./_helpers";

assertDram("BWMZFX32H2A-16G-X", {
  vendor: "biwin",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "VDD1: 1.8V, VDD2: 1.1V, VDDQ: 0.6V",
  package: "FBGA-200, 10.00x14.50",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25°C ~ +85°C"
  }
});

assertDram("BWMZCX32H2A-64GI-X", {
  vendor: "biwin",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "VDD1: 1.8V, VDD2: 1.1V, VDDQ: 0.6V",
  package: "FBGA-200, 10.00x14.50",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-40°C ~ +95°C"
  }
});

assertDram("BWMYAX32U9A-64G", {
  vendor: "biwin",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "VDD1: 1.8V, VDD2L: 0.9V, VDD2H: 1.05V, VDDQ: 0.3V-0.5V",
  package: "FBGA-245, 8.20x12.40",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533"
  }
});

assertDram("BWMYAX64F9B-128G", {
  vendor: "biwin",
  densityMbit: 131072,
  density: "128Gb",
  widthField: "x64",
  voltage: "VDD1: 1.8V, VDD2L: 0.9V, VDD2H: 1.05V, VDDQ: 0.3V-0.5V",
  package: "FBGA-496, 12.40x14.00",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533"
  }
});
