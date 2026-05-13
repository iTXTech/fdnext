import type { FdbInfoPayload, FlashIdPayload, PartNumberPayload } from "../types";
import type { FdbProvenanceSource } from "../trace";

export interface ControllerRawFile {
  directory: string;
  filename: string;
  data: string;
}

export interface ControllerMergeContext {
  info: FdbInfoPayload;
  addInfoController(controller: string | string[]): void;
  mergePartPayload(vendor: string, partNumber: string, payload: PartNumberPayload): PartNumberPayload | null;
  mergeFlashPayload(id: string, payload: FlashIdPayload): FlashIdPayload | null;
  addPartId(vendor: string, partNumber: string, id: string, controllers?: string[]): void;
  vendorExists(vendor: string): boolean;
  findPartReferencesByFlashId(id: string, options?: { excludeVendor?: string }): string[];
  addControllersToMatchingFlashId(vendor: string, flashIdPrefix: string, controllers: string[], patch?: FlashIdPayload): boolean;
  lines(data: string): string[];
  cleanHexByte(value: string | undefined): string;
  parseIni(data: string): Record<string, Record<string, string>>;
  normalizeKnownPackage(vendor: string, partNumber: string): string;
  withSource<T>(source: FdbProvenanceSource, callback: () => T): T;
}

export interface ControllerGenerator {
  id: string;
  directories: readonly string[];
  mergeFile(context: ControllerMergeContext, file: ControllerRawFile): void;
}
