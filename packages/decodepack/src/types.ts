export type NormalizeStep = "trim" | "uppercase" | { remove: string[] };

export interface DecodeMatchPrefix {
  kind: "prefix";
  value: string;
}

export interface DecodeMatchRegex {
  kind: "regex";
  value: string;
  flags?: string;
}

export type DecodeMatch = DecodeMatchPrefix | DecodeMatchRegex;

export type DecodeScalar = string | number | boolean | null;
export type DecodeJson = DecodeScalar | DecodeJson[] | { [key: string]: DecodeJson };

export interface DecodeExprVar {
  $var: string;
}

export interface DecodeExprTemplate {
  $tpl: string;
}

export interface DecodeExprPath {
  $path: string | string[];
}

export type DecodeExpr = DecodeJson | DecodeExprVar | DecodeExprTemplate | DecodeExprPath | { [key: string]: DecodeExpr } | DecodeExpr[];

export interface DecodeStepTake {
  op: "take";
  len: number;
  to: string;
}

export interface DecodeStepTakeRegex {
  op: "takeRegex";
  pattern: string;
  to?: string;
  groups?: Record<string, string | number>;
  default?: DecodeJson;
}

export interface DecodeStepStripIfPrefix {
  op: "stripIfPrefix";
  prefix: string;
  to?: string;
  if?: string;
}

export interface DecodeStepTemplate {
  op: "tpl";
  template: string;
  to: string;
}

export interface DecodeStepFallback {
  op: "fallback";
  primary: string;
  secondary: string;
  to: string;
}

export interface DecodeStepMul {
  op: "mul";
  a: string;
  b: string;
  to: string;
  default?: number;
}

export interface DecodeStepSet {
  op: "set";
  to: string;
  value: DecodeExpr;
}

export interface DecodeStepMerge {
  op: "merge";
  into: string;
  from: string;
}

export interface DecodeStepOmit {
  op: "omit";
  from: string;
  keys: string[];
  to?: string;
}

export interface DecodeStepNotEmpty {
  op: "notEmpty";
  from: string;
  to: string;
}

export interface DecodeStepMergeIf {
  op: "mergeIf";
  into: string;
  from: string;
  if: string;
}

export interface DecodeStepTakeLongest {
  op: "takeLongest";
  table: string;
  to: string;
  default?: DecodeJson;
  scope?: string;
  scopeSeparator?: string;
}

export interface DecodeStepMap {
  op: "map";
  from: string;
  table: string;
  to: string;
  default?: DecodeJson;
}

export type DecodeStep =
  | DecodeStepTake
  | DecodeStepTakeRegex
  | DecodeStepStripIfPrefix
  | DecodeStepTemplate
  | DecodeStepFallback
  | DecodeStepMul
  | DecodeStepSet
  | DecodeStepMerge
  | DecodeStepOmit
  | DecodeStepNotEmpty
  | DecodeStepMergeIf
  | DecodeStepTakeLongest
  | DecodeStepMap;

export interface DecodeProgram {
  stripPrefixes?: string[];
  tables?: Record<string, Record<string, DecodeJson>>;
  steps: DecodeStep[];
  assign: Record<string, DecodeExpr>;
}

export interface PartDecodeSpec {
  id: string;
  priority?: number;
  normalize?: NormalizeStep[];
  match: DecodeMatch;
  set?: Record<string, DecodeExpr>;
  tokenDecoder?: DecodeProgram;
}

export interface IdentifierBitRule {
  dq: number[];
  def: Record<string, DecodeJson>;
  when?: Record<string, string | string[]>;
}

export type IdentifierBitRuleSet = IdentifierBitRule | IdentifierBitRule[];

export type IdentifierDefinition = Record<string, Record<string, IdentifierBitRuleSet>>;

export interface IdentifierDecodeSpec {
  id: string;
  idScheme: "nand.flash_id";
  priority?: number;
  match: DecodeMatch;
  vendor: string;
  definition: IdentifierDefinition;
}

export interface DecodePack {
  partSpecs: PartDecodeSpec[];
  identifierSpecs: IdentifierDecodeSpec[];
}

export interface CompileDecodePackResult {
  partDecoders: import("@itxtech/fdnext-core").PartNumberDecoder[];
  identifierDecoders: import("@itxtech/fdnext-core").IdentifierDecoder[];
}

export type DecodePackCheckSeverity = "error" | "warning";

export interface DecodePackCheckFinding {
  severity: DecodePackCheckSeverity;
  code: string;
  specId?: string;
  path: string;
  message: string;
}

export interface DecodePackCheckResult {
  ok: boolean;
  findings: DecodePackCheckFinding[];
}

export interface DecodePackTraceStep {
  op: string;
  path: string;
  matched?: boolean;
  table?: string;
  key?: string;
  target?: string;
  value?: unknown;
  restBefore?: string;
  restAfter?: string;
}

export interface PartDecodeExplainResult {
  kind: "part";
  input: string;
  normalized: string;
  status: "matched" | "not_matched";
  specId?: string;
  priority?: number;
  steps: DecodePackTraceStep[];
  draft: import("@itxtech/fdnext-core").PartDecodeDraft | null;
}

export interface IdentifierDecodeExplainBitfield {
  offset: number;
  byte: number;
  field: string;
  outputKey: string;
  bits: number[];
  data: number;
  value: unknown;
}

export interface IdentifierDecodeExplainResult {
  kind: "identifier";
  input: string;
  normalized: string;
  idScheme: "nand.flash_id";
  status: "matched" | "not_matched";
  specId?: string;
  priority?: number;
  bitfields: IdentifierDecodeExplainBitfield[];
  draft: import("@itxtech/fdnext-core").IdentifierDecodeDraft | null;
}
