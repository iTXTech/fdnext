import { readFileSync, writeFileSync } from "node:fs";
import { createEngine } from "../../core/src/index";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "../../dsl/src/index";
import { embeddedResources } from "../../resources/index";

export type BaselineEndpoint = "decode" | "decodeId" | "searchPn" | "searchId" | "summary" | "summaryId";

export interface BaselineParams {
  pn?: string;
  id?: string;
  lang?: string | null;
  limit?: number;
}

export interface BaselineFixture {
  name: string;
  endpoint: BaselineEndpoint;
  params: BaselineParams;
  expected: unknown;
}

export interface BaselineBundle {
  schemaVersion: 1;
  generatedBy: string;
  fixtures: BaselineFixture[];
}

export interface BaselineSummary {
  checked: number;
  endpointCounts: Record<BaselineEndpoint, number>;
}

export interface BaselineEngine {
  dispatch(endpoint: BaselineEndpoint, context?: BaselineParams): Record<string, unknown>;
}

const BASELINE_ENDPOINTS: BaselineEndpoint[] = ["decode", "decodeId", "searchPn", "searchId", "summary", "summaryId"];
const BASELINE_ENDPOINT_SET = new Set<string>(BASELINE_ENDPOINTS);
const BASELINE_GENERATOR = "fdnext unified dispatch baseline";

export const DEFAULT_BASELINE_CASES: Array<Omit<BaselineFixture, "expected">> = [
  { name: "decode-chs-known", endpoint: "decode", params: { pn: "MT29F64G08CBABA", lang: "chs" } },
  { name: "decode-eng-known", endpoint: "decode", params: { pn: "MT29F64G08CBABA", lang: "eng" } },
  { name: "decode-eng-samsung", endpoint: "decode", params: { pn: "K9OMGY8S7M", lang: "eng" } },
  { name: "decode-eng-skhynix", endpoint: "decode", params: { pn: "H27UCG8V5A", lang: "eng" } },
  { name: "decode-eng-skhynix-3d", endpoint: "decode", params: { pn: "H25QEM8A1B", lang: "eng" } },
  { name: "decode-eng-skhynix-legacy", endpoint: "decode", params: { pn: "HY27UV08BG5M", lang: "eng" } },
  { name: "decode-eng-intel", endpoint: "decode", params: { pn: "JS29F16G08AAND2", lang: "eng" } },
  { name: "decode-eng-kioxia-tc", endpoint: "decode", params: { pn: "TC58NVG3D2ETA00", lang: "eng" } },
  { name: "decode-eng-kioxia-th", endpoint: "decode", params: { pn: "TH58NVG5T2ETA20", lang: "eng" } },
  { name: "decode-eng-kioxia-tc-bga-detail", endpoint: "decode", params: { pn: "TC58NVG3D2EXB01", lang: "eng" } },
  { name: "decode-eng-kioxia-tc-lga-detail", endpoint: "decode", params: { pn: "TC58NVG3D2ELA01", lang: "eng" } },
  { name: "decode-eng-wd-sdtn", endpoint: "decode", params: { pn: "SDTNMNAHEM-002G", lang: "eng" } },
  { name: "decode-eng-wd-shortcode-fdb", endpoint: "decode", params: { pn: "05131-032G", lang: "eng" } },
  { name: "decode-eng-ymtc", endpoint: "decode", params: { pn: "YMN06MB1B1AC1A", lang: "eng" } },
  { name: "decode-eng-phison", endpoint: "decode", params: { pn: "TA17GABCH0", lang: "eng" } },
  { name: "decode-eng-spectek", endpoint: "decode", params: { pn: "FBNL06B256G1KDBAB", lang: "eng" } },
  { name: "decode-eng-micron-fbga", endpoint: "decode", params: { pn: "NW101", lang: "eng" } },
  { name: "decode-eng-micron-fbga-meta", endpoint: "decode", params: { pn: "1A0D1NW101", lang: "eng" } },
  { name: "decode-missing-pn", endpoint: "decode", params: { lang: "eng" } },
  { name: "decode-id-known", endpoint: "decodeId", params: { id: "2C64444BA900", lang: "eng" } },
  { name: "decode-id-intel", endpoint: "decodeId", params: { id: "89480026A900", lang: "eng" } },
  { name: "decode-id-samsung", endpoint: "decodeId", params: { id: "EC1C982F84C9", lang: "eng" } },
  { name: "decode-id-samsung-de-patch", endpoint: "decodeId", params: { id: "ECDE98DE85C5", lang: "eng" } },
  { name: "decode-id-skhynix", endpoint: "decodeId", params: { id: "ADD310A63400", lang: "eng" } },
  { name: "decode-id-skhynix-new", endpoint: "decodeId", params: { id: "ADD314A534AD", lang: "eng" } },
  { name: "decode-id-kioxia", endpoint: "decodeId", params: { id: "98D598B27654", lang: "eng" } },
  { name: "decode-id-westerndigital", endpoint: "decodeId", params: { id: "45C598B27654", lang: "eng" } },
  { name: "decode-id-ymtc", endpoint: "decodeId", params: { id: "9BC318261000", lang: "eng" } },
  { name: "decode-id-spectek", endpoint: "decodeId", params: { id: "B584643CA004", lang: "eng" } },
  { name: "decode-id-missing", endpoint: "decodeId", params: { lang: "chs" } },
  { name: "search-pn-micron", endpoint: "searchPn", params: { pn: "MT29", lang: "eng", limit: 5 } },
  { name: "search-pn-sandisk", endpoint: "searchPn", params: { pn: "SDIN", lang: "chs", limit: 5 } },
  { name: "search-id-micron", endpoint: "searchId", params: { id: "2C64", lang: "eng", limit: 5 } },
  { name: "search-id-missing", endpoint: "searchId", params: { lang: "eng", limit: 5 } },
  { name: "summary-eng-known", endpoint: "summary", params: { pn: "MT29F64G08CBABA", lang: "eng" } },
  { name: "summary-missing-pn", endpoint: "summary", params: { lang: "eng" } },
  { name: "summary-id-eng-known", endpoint: "summaryId", params: { id: "2C64444BA900", lang: "eng" } },
  { name: "summary-id-missing", endpoint: "summaryId", params: { lang: "chs" } }
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stable(item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = stable((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

export function createBaselineEngine(): BaselineEngine {
  return createEngine({
    resources: embeddedResources,
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });
}

export function executeBaselineFixture(engine: BaselineEngine, fixture: Pick<BaselineFixture, "endpoint" | "params">): unknown {
  return engine.dispatch(fixture.endpoint, fixture.params);
}

export function createBaselineBundle(
  cases: Array<Omit<BaselineFixture, "expected">> = DEFAULT_BASELINE_CASES,
  engine: BaselineEngine = createBaselineEngine()
): BaselineBundle {
  return {
    schemaVersion: 1,
    generatedBy: BASELINE_GENERATOR,
    fixtures: cases.map((fixture) => ({
      ...fixture,
      expected: stable(executeBaselineFixture(engine, fixture))
    }))
  };
}

export function validateBaselineBundle(value: unknown): BaselineBundle {
  const bundle = asRecord(value);
  if (bundle.schemaVersion !== 1) {
    throw new Error("Baseline schemaVersion must be 1");
  }
  if (bundle.generatedBy !== BASELINE_GENERATOR) {
    throw new Error(`Baseline generatedBy must be ${BASELINE_GENERATOR}`);
  }
  if (!Array.isArray(bundle.fixtures) || bundle.fixtures.length === 0) {
    throw new Error("Baseline fixtures must be a non-empty array");
  }

  const seenNames = new Set<string>();
  const fixtures: BaselineFixture[] = [];

  for (const [idx, item] of bundle.fixtures.entries()) {
    const fixture = asRecord(item);
    if (typeof fixture.name !== "string" || fixture.name.trim().length === 0) {
      throw new Error(`Fixture ${idx} must have a name`);
    }
    if (seenNames.has(fixture.name)) {
      throw new Error(`Duplicate fixture name: ${fixture.name}`);
    }
    seenNames.add(fixture.name);

    if (typeof fixture.endpoint !== "string" || !BASELINE_ENDPOINT_SET.has(fixture.endpoint)) {
      throw new Error(`Fixture ${fixture.name} has unsupported endpoint: ${String(fixture.endpoint)}`);
    }
    if (!fixture.params || typeof fixture.params !== "object" || Array.isArray(fixture.params)) {
      throw new Error(`Fixture ${fixture.name} must have params object`);
    }
    if (!Object.hasOwn(fixture, "expected")) {
      throw new Error(`Fixture ${fixture.name} must have expected output`);
    }

    fixtures.push({
      name: fixture.name,
      endpoint: fixture.endpoint as BaselineEndpoint,
      params: fixture.params as BaselineParams,
      expected: fixture.expected
    });
  }

  return { schemaVersion: 1, generatedBy: BASELINE_GENERATOR, fixtures };
}

export function loadBaselineBundle(path: string): BaselineBundle {
  return validateBaselineBundle(JSON.parse(readFileSync(path, "utf8")) as unknown);
}

export function serializeBaselineBundle(bundle: BaselineBundle): BaselineBundle {
  return {
    schemaVersion: bundle.schemaVersion,
    generatedBy: bundle.generatedBy,
    fixtures: bundle.fixtures.map((fixture) => ({
      name: fixture.name,
      endpoint: fixture.endpoint,
      params: stable(fixture.params) as BaselineParams,
      expected: stable(fixture.expected)
    }))
  };
}

export function writeBaselineBundle(path: string, bundle: BaselineBundle): void {
  writeFileSync(path, `${JSON.stringify(serializeBaselineBundle(bundle), null, 2)}\n`, "utf8");
}

export function confirmBaseline(path: string, engine: BaselineEngine = createBaselineEngine()): BaselineSummary {
  const bundle = loadBaselineBundle(path);
  const endpointCounts = Object.fromEntries(BASELINE_ENDPOINTS.map((endpoint) => [endpoint, 0])) as Record<BaselineEndpoint, number>;

  for (const fixture of bundle.fixtures) {
    endpointCounts[fixture.endpoint] += 1;
    const actual = stable(executeBaselineFixture(engine, fixture));
    const expected = stable(fixture.expected);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        [
          `Baseline mismatch: ${fixture.name} (${fixture.endpoint})`,
          `params: ${JSON.stringify(fixture.params)}`,
          `expected: ${JSON.stringify(expected, null, 2)}`,
          `actual: ${JSON.stringify(actual, null, 2)}`
        ].join("\n")
      );
    }
  }

  return { checked: bundle.fixtures.length, endpointCounts };
}
