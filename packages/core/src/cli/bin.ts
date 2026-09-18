#!/usr/bin/env node

import { parseCliArgs } from "./commands";
import { errorOutput, informationText } from "./output";

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  // A downstream reader such as head may close a successful pipeline early.
  if (error.code === "EPIPE") { process.exitCode = 0; return; }
  const output = errorOutput(error);
  process.stderr.write(output.text);
  process.exitCode = output.code;
});

try {
  // Parse before loading the engine so help, version and invalid arguments stay lightweight.
  const args = process.argv.slice(2);
  const request = parseCliArgs(args);
  if (request.kind !== "command") {
    process.stdout.write(informationText(request));
  } else {
    const { runCliCommand } = await import("./index");
    process.exitCode = runCliCommand(args, { stdoutIsTTY: Boolean(process.stdout.isTTY), stderrIsTTY: Boolean(process.stderr.isTTY) });
  }
} catch (error) {
  const output = errorOutput(error);
  process.stderr.write(output.text);
  process.exitCode = output.code;
}
