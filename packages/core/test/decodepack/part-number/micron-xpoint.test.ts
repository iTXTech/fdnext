import {
  assertRuleDecode,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile
} from "./_helpers";

assertRuleDoesNotMatch("vendor.micron.xpoint.mtx.v1", "MTXP2TN2ARS-125AESX");
assertRuleDraftDieProfile("vendor.micron.xpoint.mtx.v1", "MTXP2TN2ARS-125AES", "S26A");

assertRuleDecode("MTXP2TN2ARS-125AES", {
  vendor: "micron",
  type: "3D XPoint",
  densityMbit: 2097152,
  dieProfileField: "S26A",
  package: "LFBGA-256, 14x18x1.50",
  extra: {
    "Die Stack": "4-Deck",
    "Die Count": 8,
    "CE Count": 8,
    "Channel Count": 2,
    "Production Status": "Engineering samples"
  },
  absentExtra: ["Speed Grade", "Cell Level"]
});

assertRuleDecode("MTXP128GA1BRJ-125", {
  vendor: "micron",
  type: "3D XPoint",
  densityMbit: 131072,
  package: "LFBGA-256, 14x18x1.30",
  extra: {
    "Die Stack": "2-Deck",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1
  },
  absentExtra: ["Process", "Speed Grade", "Production Status", "Cell Level"]
});
