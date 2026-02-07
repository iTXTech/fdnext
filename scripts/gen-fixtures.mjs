import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_FLASHDETECTOR_ROOT = "/Users/peratx/dev/FlashDetector";
const DEFAULT_SIMPLE_FRAMEWORK_HOME = "/Users/peratx/dev/SimpleFramework";
const FLASHDETECTOR_ROOT = resolve(process.env.FDNEXT_FLASHDETECTOR ?? DEFAULT_FLASHDETECTOR_ROOT);
const SIMPLE_FRAMEWORK_HOME = resolve(process.env.SF_HOME ?? DEFAULT_SIMPLE_FRAMEWORK_HOME);
const OUTPUT_PATH = resolve(process.env.FDNEXT_FIXTURES ?? resolve(ROOT, "packages/compat-test/fixtures/php-baseline.json"));

const CASES = [
  { name: "decode-chs-known", endpoint: "decode", params: { pn: "MT29F64G08CBABA", lang: "chs" } },
  { name: "decode-eng-known", endpoint: "decode", params: { pn: "MT29F64G08CBABA", lang: "eng" } },
  { name: "decode-missing-pn", endpoint: "decode", params: { lang: "eng" } },
  { name: "decode-id-known", endpoint: "decodeId", params: { id: "2C64444BA900", lang: "eng" } },
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

function decodeJsonFromPhpOutput(text) {
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c !== "{" && c !== "[") continue;
    const candidate = text.slice(i).trim();
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  throw new Error(`PHP output does not contain JSON payload:\n${text}`);
}

function phpCode() {
  return `
chdir("${FLASHDETECTOR_ROOT}/Scripts");
require_once "env.php";
$endpoint = getenv("FDNEXT_ENDPOINT");
$params = json_decode(getenv("FDNEXT_PARAMS") ?: "{}", true);
$lang = $params["lang"] ?? null;
$pn = $params["pn"] ?? null;
$id = $params["id"] ?? null;
$limit = intval($params["limit"] ?? 0);

if ($endpoint === "decode") {
  $out = $pn != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::detect($pn)->toArray($lang)] : ["result" => false, "message" => "Missing part number"];
} elseif ($endpoint === "decodeId") {
  $out = $id != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::decodeFlashId($id)->toArray($lang)] : ["result" => false, "message" => "Missing Flash Id"];
} elseif ($endpoint === "searchPn") {
  $out = $pn != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::searchPartNumber($pn, true, $lang, $limit)] : ["result" => false, "message" => "Missing part number"];
} elseif ($endpoint === "searchId") {
  $out = $id != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::searchFlashId($id, true, $lang, $limit)] : ["result" => false, "message" => "Missing Flash Id"];
} elseif ($endpoint === "summary") {
  $out = $pn != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::getSummary($pn, $lang)] : ["result" => false, "message" => "Missing part number"];
} elseif ($endpoint === "summaryId") {
  $out = $id != null ? ["result" => true, "data" => \\iTXTech\\FlashDetector\\FlashDetector::getIdSummary($id, $lang)] : ["result" => false, "message" => "Missing flash Id"];
} else {
  $out = ["result" => false, "message" => "Not found"];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`;
}

function runPhp(caseDef) {
  const stdout = execFileSync(
    "php",
    ["-d", "error_reporting=E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED", "-r", phpCode()],
    {
      cwd: FLASHDETECTOR_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        SF_HOME: SIMPLE_FRAMEWORK_HOME,
        FDNEXT_ENDPOINT: caseDef.endpoint,
        FDNEXT_PARAMS: JSON.stringify(caseDef.params)
      }
    }
  );
  return decodeJsonFromPhpOutput(stdout);
}

const fixtures = CASES.map((caseDef) => ({ ...caseDef, php: runPhp(caseDef) }));
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify({ fixtures }, null, 2)}\n`, "utf8");
process.stdout.write(`Generated ${fixtures.length} fixtures -> ${OUTPUT_PATH}\n`);

