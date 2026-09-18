import { FDNEXT_VERSION } from "../result";
import { CliInputError, helpText, type CliRequest } from "./commands";

export function bannerText(): string {
  return `fdnext v${FDNEXT_VERSION} — Memory chip parsing toolkit\nCopyright (c) 2026 iTX Technologies (https://itxtech.org).\nAuthor: PeratX <peratx@itxtech.org>\nAGPL-3.0 · https://github.com/iTXTech/fdnext\n`;
}

export function informationText(request: Exclude<CliRequest, { kind: "command" }>): string {
  return request.kind === "version" ? `${FDNEXT_VERSION}\n` : `${request.noBanner ? "" : `${bannerText()}\n`}${helpText(request.path)}`;
}

/** Keep data and diagnostics readable without interpreting embedded terminal controls. */
function plain(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function errorOutput(error: unknown): { text: string; code: number } {
  const message = plain(error instanceof Error ? error.message : String(error));
  return error instanceof CliInputError
    ? { text: `Error: ${message}\nRun 'fdnext${error.helpPath ? ` ${error.helpPath}` : ""} --help' for usage.\n`, code: 2 }
    : { text: `Error: ${message}\n`, code: 1 };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function label(key: string): string {
  const text = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return plain(text.charAt(0).toUpperCase() + text.slice(1)).replace(/\bId\b/g, "ID").replace(/\bUrl\b/g, "URL");
}

function scalar(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value === "" ? '""' : plain(value);
  return plain(String(value));
}

function fieldLines(field: Record<string, unknown>, indent: string): string[] {
  const name = `${plain(String(field.label))} [${plain(String(field.key))}]`;
  const unit = typeof field.unit === "string" ? plain(field.unit) : undefined;
  const display = typeof field.display === "string" && field.display ? plain(field.display) : undefined;
  let lines: string[];
  if (record(field.value) || Array.isArray(field.value)) {
    lines = display
      ? [`${indent}${name}: ${display}`, ...valueLines("Value", field.value, `${indent}  `)]
      : valueLines(name, field.value, indent);
    if (unit) lines.push(`${indent}  Unit: ${unit}`);
  } else {
    const rawWithUnit = `${scalar(field.value)}${unit ? ` ${unit}` : ""}`;
    lines = [`${indent}${name}: ${display ?? rawWithUnit}${display && display !== rawWithUnit ? ` (value: ${rawWithUnit})` : ""}`];
  }
  // Label, display and raw value are shown together; importance is only a UI ordering hint.
  for (const [key, value] of Object.entries(field)) {
    if (!["key", "label", "value", "unit", "display", "importance"].includes(key)) lines.push(...valueLines(label(key), value, `${indent}  `));
  }
  return lines;
}

function valueLines(name: string, value: unknown, indent = ""): string[] {
  if (Array.isArray(value)) {
    if (!value.length) return [`${indent}${name}: (none)`];
    return [`${indent}${name} (${value.length}):`, ...value.flatMap((item, index) => {
      if (record(item) && typeof item.key === "string" && typeof item.label === "string" && Object.hasOwn(item, "value")) return fieldLines(item, `${indent}  `);
      return valueLines(`[${index + 1}]`, item, `${indent}  `);
    })];
  }
  if (record(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (!entries.length) return [`${indent}${name}: (none)`];
    if (typeof value.label === "string" && Array.isArray(value.fields) && typeof value.id === "string") {
      return [`${indent}${plain(value.label)} [${plain(value.id)}]:`, ...entries.filter(([key]) => !["label", "id", "importance"].includes(key)).flatMap(([key, item]) => {
        if (key === "fields" && Array.isArray(item) && item.every((field) => record(field) && typeof field.key === "string" && typeof field.label === "string" && Object.hasOwn(field, "value"))) return item.flatMap((field) => fieldLines(field as Record<string, unknown>, `${indent}  `));
        return valueLines(label(key), item, `${indent}  `);
      })];
    }
    return [`${indent}${name}:`, ...entries.flatMap(([key, item]) => valueLines(label(key), item, `${indent}  `))];
  }
  return [`${indent}${name}: ${scalar(value)}`];
}

/** Render every result branch, including future keys, without truncating values or lists. */
export function renderText(value: unknown): string {
  if (!record(value)) return `${valueLines("Result", value).join("\n")}\n`;
  const result = { ...value };
  // The summary aliases fields in blocks. Remove only proven duplicates, not distinct facts.
  if (record(result.summary) && Array.isArray(result.blocks) && Array.isArray(result.summary.brief)
    && JSON.stringify(result.summary.full) === JSON.stringify(result.blocks)
    && result.summary.brief.every((field) => (result.blocks as unknown[]).some((block) => record(block) && Array.isArray(block.fields) && block.fields.some((item) => JSON.stringify(item) === JSON.stringify(field))))
    && Object.keys(result.summary).every((key) => key === "brief" || key === "full")) delete result.summary;
  const order = ["operation", "status", "input", "subtitle", "device", "blocks", "items", "candidates", "relations", "warnings", "links"];
  const keys = [...order.filter((key) => Object.hasOwn(result, key)), ...Object.keys(result).filter((key) => !order.includes(key))];
  return `${keys.filter((key) => result[key] !== undefined).map((key) => valueLines(label(key), result[key]).join("\n")).join("\n\n")}\n`;
}
