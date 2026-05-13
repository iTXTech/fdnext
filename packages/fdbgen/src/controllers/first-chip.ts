import { mergeFdnextFdbgenV1SupportList } from "../fdbgen-v1";
import { mergeSupportListEntry } from "../support-list";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

const CONTROLLER_MARK = /^Y$/i;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mergeFirstChipText(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data).filter((line) => line.trim().length > 0);
  const header = dataLines.shift()?.split("\t").map((item) => item.trim()) ?? [];
  const controllerColumns = header
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => /^[A-Z]{2,}\d+[A-Z0-9]*$/.test(name));
  const controllers = controllerColumns.map(({ name }) => name);
  context.addInfoController(controllers);

  for (let index = 0; index < dataLines.length; index += 1) {
    const line = dataLines[index] ?? "";
    const fields = line.split("\t").map((item) => item.trim());
    const rawVendor = fields[0] ?? "";
    const rawPartNumber = fields[1] ?? "";
    const id = fields[2] ?? "";
    const cellLevel = fields[4] ?? "";
    const supported = controllerColumns
      .filter(({ index }) => CONTROLLER_MARK.test(fields[index] ?? ""))
      .map(({ name }) => name);
    context.withSource({ line: index + 2, raw: line }, () => {
      mergeSupportListEntry(context, {
        vendor: rawVendor,
        partNumber: rawPartNumber,
        flashId: id,
        controllers: supported,
        cellLevel,
        requireSupportedFlashIdPrefix: false
      });
    });
  }
}

function mergeSupportEntry(
  context: ControllerMergeContext,
  input: {
    rawVendor?: unknown;
    rawPartNumber?: unknown;
    flashId?: unknown;
    controllers?: unknown;
    cellLevel?: unknown;
  }
): string[] {
  return mergeSupportListEntry(context, {
    vendor: input.rawVendor,
    partNumber: input.rawPartNumber,
    flashId: input.flashId,
    controllers: input.controllers,
    cellLevel: input.cellLevel
  }).controllers;
}

function mergeFdnextFdbgenV1(context: ControllerMergeContext, source: Record<string, unknown>): void {
  mergeFdnextFdbgenV1SupportList(context, source);
}

function mergeLegacyFirstChipJson(context: ControllerMergeContext, source: unknown[]): void {
  const controllers = new Set<string>();
  for (let index = 0; index < source.length; index += 1) {
    const item = source[index];
    const record = asRecord(item);
    const supported = context.withSource({ recordIndex: index + 1, raw: JSON.stringify(item) }, () => {
      return mergeSupportEntry(context, {
        rawPartNumber: record.FlashName,
        flashId: record.FlashID,
        controllers: record.SupportedControllers
      });
    });
    for (const controller of supported) {
      controllers.add(controller);
    }
  }

  if (controllers.size > 0) {
    context.addInfoController([...controllers]);
  }
}

function mergeFirstChipJson(context: ControllerMergeContext, data: string): void {
  const source = JSON.parse(data) as unknown;
  if (Array.isArray(source)) {
    mergeLegacyFirstChipJson(context, source);
    return;
  }
  mergeFdnextFdbgenV1(context, asRecord(source));
}

export const firstChipController: ControllerGenerator = {
  id: "first-chip",
  directories: ["fc"],
  mergeFile(context, file) {
    if (file.filename.toLowerCase().endsWith(".json")) {
      mergeFirstChipJson(context, file.data);
      return;
    }
    mergeFirstChipText(context, file.data);
  }
};
