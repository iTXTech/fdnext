import type { PartNumberPayload } from "./types";

export const AUTHORITATIVE_PART_PAYLOAD_KEYS = ["id", "f", "a", "l", "c", "m", "pkg", "sg", "pc", "vol", "so", "d", "e", "r", "n", "pl"] as const;
const PART_PAYLOAD_KEYS = [...AUTHORITATIVE_PART_PAYLOAD_KEYS, "t"] as const;

export function hasPartPayloadValue(payload: PartNumberPayload, key: keyof PartNumberPayload): boolean {
  const value = payload[key];
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== undefined && value !== null && value !== "";
}

export function hasAnyPartPayloadValue(payload: PartNumberPayload, keys: readonly (keyof PartNumberPayload)[]): boolean {
  return keys.some((key) => hasPartPayloadValue(payload, key));
}

export function isControllerOnlyPartPayload(payload: PartNumberPayload): boolean {
  return hasPartPayloadValue(payload, "t") && !hasAnyPartPayloadValue(payload, AUTHORITATIVE_PART_PAYLOAD_KEYS);
}

export function isEmptyPartPayload(payload: PartNumberPayload): boolean {
  return !hasAnyPartPayloadValue(payload, PART_PAYLOAD_KEYS);
}

export function isLowInformationPartPayload(payload: PartNumberPayload): boolean {
  return isControllerOnlyPartPayload(payload) || isEmptyPartPayload(payload);
}
