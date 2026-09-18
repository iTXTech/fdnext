import { createEngine, type FdnextEngine } from "../index";
import { checkDecodePack, defaultDecodePack, explainIdentifierDecode, explainPartDecode } from "../decodepack";
import { parseCliArgs, type CliExecution, type CliFormat } from "./commands";
import { bannerText, errorOutput, informationText, renderText } from "./output";

export interface CliCommandOptions {
  /** Reuse the caller's long-lived engine when executing more than one command in-process. */
  readonly engine?: FdnextEngine;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
  /** Default output format; an explicit --format takes precedence. Defaults to JSON in-process. */
  readonly format?: CliFormat;
  /** Only the executable supplies terminal state; embedded callers default to false. */
  readonly stdoutIsTTY?: boolean;
  readonly stderrIsTTY?: boolean;
}

function execute(request: CliExecution, getEngine: () => FdnextEngine): { value: unknown; code: number } {
  const { query, lang, limit, idScheme, controllerGroup, specId } = request;
  switch (request.command) {
    case "part decode": return { value: getEngine().decodePart({ query, lang, controllerGroup }), code: 0 };
    case "part search": return { value: getEngine().searchParts({ query, lang, limit }), code: 0 };
    case "id decode": return { value: getEngine().decodeIdentifier({ query, lang, idScheme, controllerGroup }), code: 0 };
    case "id search": return { value: getEngine().searchIdentifiers({ query, lang, limit, idScheme }), code: 0 };
    case "capabilities": return { value: getEngine().getCapabilities({ lang }), code: 0 };
    case "decodepack explain part": return { value: explainPartDecode(defaultDecodePack, query, specId ? { specId } : {}), code: 0 };
    case "decodepack explain id": return { value: explainIdentifierDecode(defaultDecodePack, query, idScheme ? { idScheme } : {}), code: 0 };
    case "decodepack check": {
      const value = checkDecodePack(defaultDecodePack);
      return { value, code: value.ok ? 0 : 1 };
    }
  }
}

/** Execute one CLI command without taking ownership of process IO or process lifetime. */
export function runCliCommand(rawArgs: readonly string[], options: CliCommandOptions = {}): number {
  const stdout = options.stdout ?? ((text: string) => { process.stdout.write(text); });
  const stderr = options.stderr ?? ((text: string) => { process.stderr.write(text); });
  let engine = options.engine;
  try {
    const request = parseCliArgs(rawArgs, options.format);
    if (request.kind !== "command") { stdout(informationText(request)); return 0; }
    const format = request.format === "auto" ? (options.stdoutIsTTY ? "text" : "json") : request.format;
    if (format === "text" && options.stdoutIsTTY && options.stderrIsTTY && !request.noBanner) stderr(`${bannerText()}\n`);
    const result = execute(request, () => (engine ??= createEngine()));
    stdout(format === "json" ? `${JSON.stringify(result.value, null, 2)}\n` : renderText(result.value));
    return result.code;
  } catch (error) {
    const output = errorOutput(error);
    stderr(output.text);
    return output.code;
  }
}
