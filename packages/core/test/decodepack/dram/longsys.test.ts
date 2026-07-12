import { assertDram } from "./_helpers";

assertDram("F60C1A0002-M6AR", {
  vendor: "longsys",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1866",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("F60C1A0004-M7KR", {
  vendor: "longsys",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-2133",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("F60C1A0004-M79W", {
  vendor: "longsys",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "FBGA-96, 7.5x13.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1866",
    "Operation Temperature": "Wide (-40C~95C)"
  }
});
