import assert from "node:assert/strict";
import { assertDecodedField, assertDecodedFieldAbsent, detect } from "./_helpers";

// Micron JFA is a recognized package token even though its public package
// dimensions are not known. It therefore keeps the legacy single-die/single-CS
// default. EGN is consumed only as an unknown body token and must not inherit it.
assertDecodedField("MT60B6G4JFA-72B:C", "dram_die_count", 1);
assertDecodedField("MT60B6G4JFA-72B:C", "cs_count", 1);
assertDecodedFieldAbsent("MT60B32G4EGN-88H:E", "dram_die_count");
assertDecodedFieldAbsent("MT60B32G4EGN-88H:E", "cs_count");

// Samsung DDR5 exposes the physical package from density/width independently
// of the suffix topology token. An unknown suffix token must therefore suppress
// topology even when the public package remains known.
assertDecodedField("K4RAH086VB-BCQK", "dram_die_count", 1);
assertDecodedField("K4RAH086VB-BCQK", "cs_count", 1);
assertDecodedField("K4RAH086VB", "dram_die_count", 1);
assertDecodedField("K4RAH086VB", "cs_count", 1);
const samsungUnknownTopology = detect("K4RAH086VB-ZCQK");
assert.equal(samsungUnknownTopology.package, "FBGA-82");
assertDecodedFieldAbsent("K4RAH086VB-ZCQK", "dram_die_count");
assertDecodedFieldAbsent("K4RAH086VB-ZCQK", "cs_count");

// The same rule applies to Samsung's DDR4 suffix package/stack token and
// legacy LPDDR bit-organization token: unknown tokens must not inherit the
// source rule's former catch-all single-die topology.
assertDecodedField("K4A8G085WB", "dram_die_count", 1);
assertDecodedField("K4A8G085WB", "cs_count", 1);
const samsungDdr4UnknownTopology = detect("K4A8G085WB-ZCRC");
assert.equal(samsungDdr4UnknownTopology.package, "FBGA-78");
assertDecodedFieldAbsent("K4A8G085WB-ZCRC", "dram_die_count");
assertDecodedFieldAbsent("K4A8G085WB-ZCRC", "cs_count");
const samsungLpddrUnknownTopology = detect("K4X51993PC-FGC3");
assert.equal(samsungLpddrUnknownTopology.package, "FBGA-60");
assertDecodedFieldAbsent("K4X51993PC-FGC3", "dram_die_count");
assertDecodedFieldAbsent("K4X51993PC-FGC3", "cs_count");
assertDecodedFieldAbsent("K4J52324Z", "dram_die_count");
assertDecodedFieldAbsent("K4J52324Z", "cs_count");
const samsungModernGddrUnknownTopology = detect("K4ZAF325XX-HC14");
assert.equal(samsungModernGddrUnknownTopology.package, "FBGA-180");
assertDecodedFieldAbsent("K4ZAF325XX-HC14", "dram_die_count");
assertDecodedFieldAbsent("K4ZAF325XX-HC14", "cs_count");

// SK hynix DDR5 serials carry the die-count semantics. A known serial may expose
// its confirmed die count; an unknown serial keeps the width-derived package but
// must not be normalized to a synthetic single die / single CS.
assertDecodedField("H5CG48AGBD-X018", "dram_die_count", 1);
assertDecodedFieldAbsent("H5CG48AGBD-X018", "cs_count");
assertDecodedField("H5CG44AEBD", "dram_die_count", 1);
assertDecodedField("H5CG44AEBD", "cs_count", 1);
const skhynixUnknownTopology = detect("H5CG48AGBD-X999");
assert.equal(skhynixUnknownTopology.package, "FBGA-82");
assertDecodedFieldAbsent("H5CG48AGBD-X999", "dram_die_count");
assertDecodedFieldAbsent("H5CG48AGBD-X999", "cs_count");

// Nanya uses the M/T/F stack token itself as topology evidence. An unknown token
// must not receive the DDR default merely because the family is recognizable.
assertDecodedField("NT5CB128M16JR-DI", "dram_die_count", 1);
assertDecodedField("NT5CB128M16JR-DI", "cs_count", 1);
assertDecodedFieldAbsent("NT5CB128X16JR-DI", "dram_die_count");
assertDecodedFieldAbsent("NT5CB128X16JR-DI", "cs_count");

// CXMT and Elpida formerly embedded an unconditional single-die topology in
// their source rules. Known package mappings keep that result through the
// shared default; unknown package tokens no longer do.
assertDecodedField("CXDQ3BFAM", "dram_die_count", 1);
assertDecodedField("CXDQ3BFAM", "cs_count", 1);
assertDecodedFieldAbsent("CXDQ3ZFAM", "dram_die_count");
assertDecodedFieldAbsent("CXDQ3ZFAM", "cs_count");
assertDecodedField("EDJ4208BASE-GN", "dram_die_count", 1);
assertDecodedField("EDJ4208BASE-GN", "cs_count", 1);
assertDecodedFieldAbsent("EDJ4208ZZZZ-GN", "dram_die_count");
assertDecodedFieldAbsent("EDJ4208ZZZZ-GN", "cs_count");
assertDecodedField("EDS1216AATA-75", "dram_die_count", 1);
assertDecodedField("EDS1216AATA-75", "cs_count", 1);
assertDecodedFieldAbsent("EDS1216ZZZZ-75", "dram_die_count");
assertDecodedFieldAbsent("EDS1216ZZZZ-75", "cs_count");
assertDecodedField("K4S511632D-UC75", "dram_die_count", 1);
assertDecodedField("K4S511632D-UC75", "cs_count", 1);
assertDecodedFieldAbsent("K4S511632D-ZC75", "dram_die_count");
assertDecodedFieldAbsent("K4S511632D-ZC75", "cs_count");

// Some LPDDR families encode package and topology in separate tokens. A known
// package must not mask an unknown stack/organization token.
const cxmtLpddrUnknownTopology = detect("CXDB5CZAM-MK");
assert.equal(cxmtLpddrUnknownTopology.package, "FBGA-200");
assertDecodedFieldAbsent("CXDB5CZAM-MK", "dram_die_count");
assertDecodedFieldAbsent("CXDB5CZAM-MK", "cs_count");
const elpidaLpddrUnknownTopology = detect("EDB8X64B3PF-8D");
assert.equal(elpidaLpddrUnknownTopology.package, "FBGA-216");
assertDecodedFieldAbsent("EDB8X64B3PF-8D", "dram_die_count");
assertDecodedFieldAbsent("EDB8X64B3PF-8D", "cs_count");
assertDecodedField("EDW2032BBBG-60", "dram_die_count", 1);
assertDecodedField("EDW2032BBBG-60", "cs_count", 1);
const elpidaGddrUnknownTopology = detect("EDW2032XXXX-60");
assert.equal(elpidaGddrUnknownTopology.package, "FBGA-170");
assertDecodedFieldAbsent("EDW2032XXXX-60", "dram_die_count");
assertDecodedFieldAbsent("EDW2032XXXX-60", "cs_count");

// GigaDevice's organization token carries the topology distinction while the
// package is decoded independently. Known ordinary organization values retain
// the default; unknown values suppress it.
assertDecodedField("GDP2BFLM-WB", "dram_die_count", 1);
assertDecodedField("GDP2BFLM-WB", "cs_count", 1);
const gigadeviceDdr3UnknownTopology = detect("GDP2BZLM-WB");
assert.equal(gigadeviceDdr3UnknownTopology.package, "FBGA-96");
assertDecodedFieldAbsent("GDP2BZLM-WB", "dram_die_count");
assertDecodedFieldAbsent("GDP2BZLM-WB", "cs_count");
const gigadeviceLpddrUnknownTopology = detect("GDB5CZQN-MK");
assert.equal(gigadeviceLpddrUnknownTopology.package, "FBGA-200");
assertDecodedFieldAbsent("GDB5CZQN-MK", "dram_die_count");
assertDecodedFieldAbsent("GDB5CZQN-MK", "cs_count");

// Existing vendor rules whose public package is already confirmed retain the
// shared default without needing a metadata override.
assertDecodedField("EM68A16CBQC-18H", "dram_die_count", 1);
assertDecodedField("EM68A16CBQC-18H", "cs_count", 1);
