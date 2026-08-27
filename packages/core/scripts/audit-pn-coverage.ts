import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createEngine, type FdnextResourceBundle } from "../src/index";
import { compileDecodePack, defaultDecodePack } from "../src/decodepack";
import { embeddedResourceBundle } from "../src/resources";
import dramPnJson from "../resources/dram-pn.json" with { type: "json" };
import managedNandPnJson from "../resources/managed-nand-pn.json" with { type: "json" };
import mdbJson from "../resources/mdb.json" with { type: "json" };
import intentionalJson from "../test/fixtures/pn-coverage-intentional.json" with { type: "json" };

type CoverageSource = "dram-pn" | "managed-nand-pn" | "mdb:micron" | "mdb:spectek";
type CoverageStatus = "semantic" | "identity-only" | "not-found";

interface CoverageSeed {
  source: CoverageSource;
  vendorHint: string;
  pn: string;
}

interface CoverageRecord extends CoverageSeed {
  status: CoverageStatus;
  ruleId: string | null;
  fieldCount: number;
  intentional: boolean;
}

interface BaselineEntry {
  source: CoverageSource;
  pn: string;
  status: Exclude<CoverageStatus, "semantic">;
}

interface BaselineFile {
  version: 1;
  note: string;
  unclassified: string[];
}

interface IntentionalEntry {
  source: CoverageSource;
  pn: string;
  evidenceStatus: string;
  reason: string;
}

const baselineUrl = new URL("../test/fixtures/pn-coverage-baseline.json", import.meta.url);
const compiledPack = compileDecodePack(defaultDecodePack);
const decodeOnlyResources = {
  partIndex: { rawNand: {}, managedNand: [], dram: [] },
  identifierIndex: { nandFlash: {} },
  markingIndex: { packageMarkings: {} },
  vendorIndex: {},
  controllerIndex: embeddedResourceBundle.controllerIndex,
  translationIndex: embeddedResourceBundle.translationIndex
} satisfies FdnextResourceBundle;
const engine = createEngine({
  resources: decodeOnlyResources,
  decoders: compiledPack.partDecoders,
  profileTables: compiledPack.profileTables
});

function normalizedKey(source: CoverageSource, pn: string): string {
  return `${source}\u0000${pn.toUpperCase().replaceAll(/\s+/g, " ").trim()}`;
}

function splitMdbValue(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    if (typeof item !== "string" || /\bDO NOT USE\b/i.test(item)) return [];
    return item.split(/\s*,\s*/).map((pn) => pn.trim()).filter(Boolean);
  });
}

function collectSeeds(): CoverageSeed[] {
  const seeds: CoverageSeed[] = [];
  for (const entry of dramPnJson) {
    seeds.push({ source: "dram-pn", vendorHint: entry.vendor, pn: entry.pn });
  }
  for (const entry of managedNandPnJson) {
    seeds.push({ source: "managed-nand-pn", vendorHint: entry.vendor, pn: entry.pn });
  }
  for (const pn of Object.values(mdbJson.micron).flatMap(splitMdbValue)) {
    seeds.push({ source: "mdb:micron", vendorHint: "micron", pn });
  }
  for (const pn of Object.values(mdbJson.spectek).flatMap(splitMdbValue)) {
    seeds.push({ source: "mdb:spectek", vendorHint: "spectek", pn });
  }

  const unique = new Map<string, CoverageSeed>();
  for (const seed of seeds) unique.set(normalizedKey(seed.source, seed.pn), seed);
  return [...unique.values()].sort((left, right) =>
    left.source.localeCompare(right.source) || left.pn.localeCompare(right.pn)
  );
}

const intentionalEntries = (intentionalJson.entries as IntentionalEntry[]);
const intentionalByKey = new Map(intentionalEntries.map((entry) => [normalizedKey(entry.source, entry.pn), entry]));

function auditSeed(seed: CoverageSeed): CoverageRecord {
  const result = engine.decodePart({ query: seed.pn, lang: "eng" });
  const draft = engine.decodePartDraft({ query: seed.pn, lang: "eng" });
  const fieldCount = result.blocks.reduce((count, block) => count + block.fields.length, 0);
  const status: CoverageStatus = result.status !== "ok" ? "not-found" : fieldCount > 0 ? "semantic" : "identity-only";
  return {
    ...seed,
    status,
    ruleId: typeof draft?.meta?.ruleId === "string" ? draft.meta.ruleId : null,
    fieldCount,
    intentional: intentionalByKey.has(normalizedKey(seed.source, seed.pn))
  };
}

function familyOf(pn: string): string {
  const compact = pn.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
  return /^(?:EEFC|MTFCBA|MTFC)/.exec(compact)?.[0]
    ?? /^(?:EE|MT)29[A-Z]/.exec(compact)?.[0]
    ?? /^MT\d{2}[A-Z]/.exec(compact)?.[0]
    ?? /^[A-Z]{1,5}/.exec(compact)?.[0]
    ?? "other";
}

function summarize(records: CoverageRecord[]) {
  const bySource = new Map<CoverageSource, { total: number; semantic: number; identityOnly: number; notFound: number; intentional: number; unclassified: number }>();
  for (const record of records) {
    const summary = bySource.get(record.source) ?? { total: 0, semantic: 0, identityOnly: 0, notFound: 0, intentional: 0, unclassified: 0 };
    summary.total += 1;
    if (record.status === "semantic") summary.semantic += 1;
    if (record.status === "identity-only") summary.identityOnly += 1;
    if (record.status === "not-found") summary.notFound += 1;
    if (record.intentional) summary.intentional += 1;
    if (record.status !== "semantic" && !record.intentional) summary.unclassified += 1;
    bySource.set(record.source, summary);
  }

  const gapFamilies = new Map<string, number>();
  for (const record of records) {
    if (record.status === "semantic" || record.intentional) continue;
    const key = `${record.source}:${familyOf(record.pn)}`;
    gapFamilies.set(key, (gapFamilies.get(key) ?? 0) + 1);
  }
  return {
    bySource: Object.fromEntries(bySource),
    topGapFamilies: [...gapFamilies.entries()]
      .map(([family, count]) => ({ family, count }))
      .sort((left, right) => right.count - left.count || left.family.localeCompare(right.family))
      .slice(0, 30)
  };
}

async function readBaseline(): Promise<BaselineFile> {
  return JSON.parse(await readFile(baselineUrl, "utf8")) as BaselineFile;
}

function serializeBaselineEntry(entry: BaselineEntry): string {
  return `${entry.source}\t${entry.status}\t${entry.pn}`;
}

function parseBaselineEntry(value: string): BaselineEntry {
  const [source, status, ...pnParts] = value.split("\t");
  if (!source || !status || pnParts.length === 0) throw new Error(`Invalid PN coverage baseline entry: ${value}`);
  return { source: source as CoverageSource, status: status as BaselineEntry["status"], pn: pnParts.join("\t") };
}

function currentUnclassified(records: CoverageRecord[]): string[] {
  return records.flatMap((record) =>
    record.status !== "semantic" && !record.intentional
      ? [serializeBaselineEntry({ source: record.source, pn: record.pn, status: record.status })]
      : []
  );
}

function checkAgainstBaseline(records: CoverageRecord[], baseline: BaselineFile): string[] {
  const findings: string[] = [];
  const baselineEntries = baseline.unclassified.map(parseBaselineEntry);
  const baselineByKey = new Map(baselineEntries.map((entry) => [normalizedKey(entry.source, entry.pn), entry]));
  const statusRank: Record<CoverageStatus, number> = { semantic: 0, "identity-only": 1, "not-found": 2 };

  for (const record of records) {
    const key = normalizedKey(record.source, record.pn);
    if (record.status === "semantic" || record.intentional) continue;
    const previous = baselineByKey.get(key);
    if (!previous) {
      findings.push(`new unclassified PN: ${record.source} ${record.pn} (${record.status})`);
    } else if (statusRank[record.status] > statusRank[previous.status]) {
      findings.push(`coverage regressed: ${record.source} ${record.pn} (${previous.status} -> ${record.status})`);
    }
  }

  const recordsByKey = new Map(records.map((record) => [normalizedKey(record.source, record.pn), record]));
  for (const entry of intentionalEntries) {
    const record = recordsByKey.get(normalizedKey(entry.source, entry.pn));
    if (!record) findings.push(`stale intentional entry: ${entry.source} ${entry.pn} is no longer present`);
    else if (record.status === "semantic") findings.push(`resolved intentional entry: ${entry.source} ${entry.pn} now decodes semantically`);
  }
  return findings;
}

function renderMarkdown(records: CoverageRecord[], findings: string[]): string {
  const summary = summarize(records);
  const lines = [
    "# PN coverage audit",
    "",
    "Decoder-only results; search/FDB enrichment is intentionally excluded.",
    "",
    "| Source | Unique PN | Semantic | Identity only | Not found | Intentional search-only | Unclassified |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const [source, value] of Object.entries(summary.bySource)) {
    lines.push(`| ${source} | ${value.total} | ${value.semantic} | ${value.identityOnly} | ${value.notFound} | ${value.intentional} | ${value.unclassified} |`);
  }
  lines.push("", "## Top unclassified families", "", "| Source/family | Count |", "| --- | ---: |");
  for (const item of summary.topGapFamilies) lines.push(`| ${item.family} | ${item.count} |`);
  lines.push("", "## Baseline check", "");
  lines.push(findings.length === 0 ? "PASS" : findings.map((finding) => `- ${finding}`).join("\n"));
  return `${lines.join("\n")}\n`;
}

const records = collectSeeds().map(auditSeed);
const args = new Set(process.argv.slice(2));

if (args.has("--update-baseline")) {
  const baseline: BaselineFile = {
    version: 1,
    note: "Existing unclassified decoder-only backlog. New gaps and identity-only to not-found regressions fail the coverage check; resolved entries may disappear.",
    unclassified: currentUnclassified(records)
  };
  await writeFile(fileURLToPath(baselineUrl), `${JSON.stringify(baseline, null, 2)}\n`);
}

const baseline = await readBaseline();
const findings = checkAgainstBaseline(records, baseline);
if (args.has("--format=json")) {
  process.stdout.write(`${JSON.stringify({ summary: summarize(records), findings, records }, null, 2)}\n`);
} else {
  process.stdout.write(renderMarkdown(records, findings));
}
if (args.has("--check") && findings.length > 0) process.exitCode = 1;
