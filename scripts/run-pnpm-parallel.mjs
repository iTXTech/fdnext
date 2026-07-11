import { spawn } from "node:child_process";

const scripts = process.argv.slice(2);
if (scripts.length === 0) {
  process.stderr.write("Usage: node scripts/run-pnpm-parallel.mjs <script> [...script]\n");
  process.exit(1);
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const children = new Set();

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpm, ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });
    children.add(child);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      children.delete(child);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} failed (${signal ?? `exit ${String(code)}`})`));
      }
    });
  });
}

function stopChildren(signal = "SIGTERM") {
  for (const child of children) {
    child.kill(signal);
  }
}

process.once("SIGINT", () => stopChildren("SIGINT"));
process.once("SIGTERM", () => stopChildren("SIGTERM"));

try {
  await Promise.all(scripts.map(run));
} catch (error) {
  stopChildren();
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
