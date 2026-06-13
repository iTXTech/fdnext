import runtimeDataJson from "../runtime-data/fdnext-runtime-data.json" with { type: "json" };
import { assertRuntimeDataHeader } from "./runtime-data";

export const embeddedRuntimeData = assertRuntimeDataHeader(runtimeDataJson);

export function getEmbeddedRuntimeData() {
  return embeddedRuntimeData;
}
