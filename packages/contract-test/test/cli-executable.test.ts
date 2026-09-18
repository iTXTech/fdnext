import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";
import { fdnextPackageVersion } from "./_helpers";

const exec = promisify(execFile);
const coreRoot = new URL("../../core/", import.meta.url);
const metadata = JSON.parse(await readFile(new URL("package.json", coreRoot), "utf8")) as { bin: { fdnext: string } };
const executable = fileURLToPath(new URL(metadata.bin.fdnext, coreRoot));

test("published executable supports help, version, named arguments and text output", async () => {
  const version = await exec(process.execPath, [executable, "--version"]);
  assert.equal(version.stdout, `${fdnextPackageVersion}\n`);
  assert.equal(version.stderr, "");
  const help = await exec(process.execPath, [executable, "id", "decode", "--help"]);
  assert.match(help.stdout, /--controller-group/);
  assert.equal(help.stderr, "");
  const args = ["part", "decode", "MT62F1G64D4EK-023", "--lang", "eng"];
  const json = await exec(process.execPath, [executable, ...args]);
  assert.equal(JSON.parse(json.stdout).status, "ok");
  assert.equal(json.stderr, "");
  const text = await exec(process.execPath, [executable, ...args, "--format=text"]);
  assert.match(text.stdout, /DRAM Density.*64Gb.*65536 Mbit/);
  assert.doesNotMatch(text.stdout, /Copyright/);
  assert.equal(text.stderr, "");
  await assert.rejects(exec(process.execPath, [executable, "part", "search", "MT", "--limit=10abc"]), (error: unknown) => {
    const result = error as { code: number; stdout: string; stderr: string };
    assert.equal(result.code, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /positive safe integer/);
    return true;
  });
});

test("package bin works through a package-manager-style symlink", { skip: process.platform === "win32" }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "fdnext-cli-"));
  try {
    const link = join(directory, "fdnext");
    await symlink(executable, link);
    const result = await exec(link, ["--version"]);
    assert.equal(result.stdout, `${fdnextPackageVersion}\n`);
    assert.equal(result.stderr, "");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("closing a result pipe early does not emit an unhandled EPIPE", async () => {
  const child = spawn(process.execPath, [executable, "capabilities"], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.setEncoding("utf8").on("data", (text: string) => { stderr += text; });
  child.stdout.destroy();
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  assert.equal(code, 0, stderr);
  assert.equal(stderr, "");
});
