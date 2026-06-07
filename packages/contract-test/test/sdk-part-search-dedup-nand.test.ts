import { assertNoDuplicatePartSearchItems } from "./_part-search";

for (const query of ["MT29F", "NW8", "MT29F128G08AECABH6-6:A"]) {
  assertNoDuplicatePartSearchItems(query);
}
