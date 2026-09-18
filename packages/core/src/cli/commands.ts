import { fdnextControllerGroupIds, fdnextIdSchemes, type ControllerGroupSelection, type FdnextIdScheme } from "../result";

export type CliFormat = "auto" | "text" | "json";
type OptionName = "lang" | "limit" | "id-scheme" | "spec-id" | "controller-group";

const optionDefinitions = {
  lang: { value: "language", description: "Field language (for example eng or chs); defaults to the engine language" },
  limit: { value: "count", description: "Positive integer search limit; omitted means all matches" },
  "id-scheme": { value: "scheme", description: `Identifier scheme: ${fdnextIdSchemes.join(", ")}` },
  "spec-id": { value: "id", description: "Explain a specific DecodePack specification" },
  "controller-group": { value: "group", description: `Repeatable or comma-separated: ${fdnextControllerGroupIds.join(", ")}; all must stand alone` }
} as const;

const commands = [
  { path: "part decode", query: "part-number", description: "Decode a part number or marking", options: ["lang", "controller-group"], legacy: ["lang"], example: "MT62F1G64D4EK-023 --lang eng" },
  { path: "part search", query: "query", description: "Search part numbers and markings", options: ["lang", "limit"], legacy: ["lang", "limit"], example: "MT62 --lang eng --limit 5" },
  { path: "id decode", query: "identifier", description: "Decode a NAND Flash ID", options: ["lang", "id-scheme", "controller-group"], legacy: ["lang", "id-scheme"], example: "2C64444BA900 --lang eng" },
  { path: "id search", query: "query", description: "Search NAND Flash IDs", options: ["lang", "limit", "id-scheme"], legacy: ["lang", "limit", "id-scheme"], example: "2C64 --limit 5" },
  { path: "capabilities", query: null, description: "List version, resources, decoders, and supported operations", options: ["lang"], legacy: ["lang"], example: "--lang eng" },
  { path: "decodepack check", query: null, description: "Validate bundled DecodePack rules", options: [], legacy: [], example: "" },
  { path: "decodepack explain part", query: "part-number", description: "Explain part-number decoding", options: ["spec-id"], legacy: ["spec-id"], example: "BWCA2KZC-64G" },
  { path: "decodepack explain id", query: "identifier", description: "Explain identifier decoding", options: ["id-scheme"], legacy: ["id-scheme"], example: "2C64444BA900" }
] as const satisfies readonly { path: string; query: string | null; description: string; options: readonly OptionName[]; legacy: readonly OptionName[]; example: string }[];

export interface CliExecution {
  kind: "command";
  command: typeof commands[number]["path"];
  query: string;
  lang?: string;
  limit?: number;
  idScheme?: FdnextIdScheme;
  specId?: string;
  controllerGroup?: ControllerGroupSelection;
  format: CliFormat;
  noBanner: boolean;
}

export type CliRequest = CliExecution | { kind: "help"; path: string; noBanner: boolean } | { kind: "version" };

export class CliInputError extends Error {
  constructor(message: string, readonly helpPath = "") { super(message); }
}

export function helpText(path: string): string {
  const exact = commands.find((command) => command.path === path);
  const children = commands.filter((command) => !path || command.path.startsWith(`${path} `));
  const lines = exact
    ? [`Usage: fdnext ${exact.path}${exact.query ? ` <${exact.query}>` : ""} [options]`, "", exact.description]
    : [`Usage: fdnext${path ? ` ${path}` : ""} <command> [options]`, "", "Commands:", ...children.map((command) => `  ${command.path.padEnd(25)} ${command.description}`)];
  lines.push("", "Options:");
  if (exact) {
    for (const name of exact.options) {
      const option = optionDefinitions[name];
      lines.push(`  --${name} <${option.value}>`, `      ${option.description}`);
    }
  }
  lines.push("  --format <auto|text|json>  Default: text on a terminal, JSON otherwise", "  --no-banner              Suppress the project banner", "  -h, --help               Show help for this command");
  if (!path) lines.push("  -V, --version            Print only the version");
  lines.push("", "Examples:", ...(exact ? [exact] : children.slice(0, 3)).map((command) => `  fdnext ${command.path}${command.example ? ` ${command.example}` : ""}`));
  if (exact && exact.legacy.length) lines.push("", `Existing positional options remain supported, in order: ${exact.legacy.map((name) => `[${name}]`).join(" ")}.`, "Do not supply the same option both positionally and by name.");
  lines.push("", "stdout: requested result; stderr: diagnostics and terminal banner.", "Exit codes: 0 = completed query/help, 1 = runtime or rule-check failure, 2 = invalid CLI arguments.", "Query statuses (including not_found and invalid_input) are reported in the result.");
  return `${lines.join("\n")}\n`;
}

/** One command definition owns both argument validation and help. */
export function parseCliArgs(args: readonly string[], defaultFormat: CliFormat = "auto"): CliRequest {
  const positionals: string[] = [];
  const values = new Map<string, string[]>();
  let help = false;
  let version = false;
  let noBanner = false;
  let literal = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (!literal && arg === "--") { literal = true; continue; }
    if (literal || !arg.startsWith("-")) { positionals.push(arg); continue; }
    if (arg === "--help" || arg === "-h") { help = true; continue; }
    if (arg === "--version" || arg === "-V") { version = true; continue; }
    if (arg === "--no-banner") { noBanner = true; continue; }
    const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    const name = match?.[1];
    if (!name || (name !== "format" && !Object.hasOwn(optionDefinitions, name))) throw new CliInputError(`Unknown option: ${arg}`);
    const inline = match?.[2];
    const value = inline ?? args[++index];
    if (!value?.trim() || (inline === undefined && value.startsWith("-"))) throw new CliInputError(`Missing --${name} value`);
    if (values.has(name) && name !== "controller-group") throw new CliInputError(`Duplicate option: --${name}`);
    values.set(name, [...(values.get(name) ?? []), value]);
  }
  const format = values.get("format")?.[0] ?? defaultFormat;
  if (format !== "auto" && format !== "text" && format !== "json") throw new CliInputError(`Invalid format: ${format}. Expected auto, text, or json`);
  if (version) {
    if (positionals.length || values.size || help || noBanner) throw new CliInputError("--version must be used alone");
    return { kind: "version" };
  }
  const definition = commands.find((command) => command.path.split(" ").every((word, index) => positionals[index] === word));
  if (!definition) {
    const path = positionals.join(" ");
    if (path && !commands.some((command) => command.path.startsWith(`${path} `))) {
      const parent = positionals.slice(0, -1).join(" ");
      throw new CliInputError(`Unknown command: ${path}`, commands.some((command) => command.path.startsWith(`${parent} `)) ? parent : "");
    }
    if ([...values.keys()].some((name) => name !== "format")) throw new CliInputError("Choose a command before supplying command options", path);
    return { kind: "help", path, noBanner };
  }
  const fail = (message: string): never => { throw new CliInputError(message, definition.path); };
  const remaining = positionals.slice(definition.path.split(" ").length);
  const query = definition.query ? remaining.shift() : "";
  if (remaining.length > definition.legacy.length) fail("Too many positional arguments");
  remaining.forEach((value, index) => {
    const name = definition.legacy[index]!;
    if (values.has(name)) fail(`Option --${name} was also supplied positionally`);
    if (!value.trim()) fail(`Empty ${name} value`);
    values.set(name, [value]);
  });
  for (const name of values.keys()) {
    if (name !== "format" && !(definition.options as readonly string[]).includes(name)) fail(`Option --${name} is not supported by ${definition.path}`);
  }
  const limitValue = values.get("limit")?.[0];
  const limit = limitValue === undefined ? undefined : Number(limitValue);
  if (limitValue !== undefined && (!/^[1-9]\d*$/.test(limitValue) || !Number.isSafeInteger(limit))) fail("--limit must be a positive safe integer");
  const idScheme = values.get("id-scheme")?.[0];
  if (idScheme !== undefined && !(fdnextIdSchemes as readonly string[]).includes(idScheme)) fail(`Unsupported identifier scheme: ${idScheme}`);
  const groups = (values.get("controller-group") ?? []).flatMap((value) => value.split(",").map((group) => group.trim()));
  for (const group of groups) if (!(fdnextControllerGroupIds as readonly string[]).includes(group)) fail(`Unknown controller group: ${group || "(empty)"}`);
  if (groups.includes("all") && groups.length > 1) fail("--controller-group all cannot be combined with other groups");
  if (help) return { kind: "help", path: definition.path, noBanner };
  if (definition.query && !query?.trim()) fail(`Missing ${definition.query}`);
  return {
    kind: "command", command: definition.path, query: query ?? "", format, noBanner,
    lang: values.get("lang")?.[0], limit, idScheme: idScheme as FdnextIdScheme | undefined,
    specId: values.get("spec-id")?.[0],
    controllerGroup: groups.length ? (groups[0] === "all" ? "all" : [...new Set(groups)] as ControllerGroupSelection) : undefined
  };
}
