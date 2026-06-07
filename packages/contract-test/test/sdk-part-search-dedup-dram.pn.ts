import { assertNoDuplicatePartSearchItems } from "./_part-search";

for (const query of ["CT40", "C9B", "CT40A1G8SA-62M:E"]) {
  assertNoDuplicatePartSearchItems(query);
}
