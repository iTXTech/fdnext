import type { FlashIdPayload } from "./types";

function hasStringArray(value: string[] | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function hasFlashPayloadControllers(payload: FlashIdPayload): boolean {
  return hasStringArray(payload.t);
}

export function hasFlashPayloadPartReferences(payload: FlashIdPayload): boolean {
  return hasStringArray(payload.n);
}

export function isLowConfidenceFlashPayload(payload: FlashIdPayload): boolean {
  return !hasFlashPayloadControllers(payload) || !hasFlashPayloadPartReferences(payload);
}
