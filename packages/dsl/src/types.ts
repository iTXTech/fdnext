export type NormalizeStep = "trim" | "uppercase" | { remove: string[] };

export interface DslMatchPrefix {
  kind: "prefix";
  value: string;
}

export interface DslMatchRegex {
  kind: "regex";
  value: string;
  flags?: string;
}

export type DslMatch = DslMatchPrefix | DslMatchRegex;

export type DslScalar = string | number | boolean | null;
export type DslJson = DslScalar | DslJson[] | { [key: string]: DslJson };

export interface DslExprVar {
  $var: string;
}

export interface DslExprTemplate {
  $tpl: string;
}

export type DslExpr = DslJson | DslExprVar | DslExprTemplate | { [key: string]: DslExpr } | DslExpr[];

export interface DslTokenStepTake {
  op: "take";
  len: number;
  to: string;
}

export interface DslTokenStepTakeRegex {
  op: "takeRegex";
  pattern: string;
  to?: string;
  groups?: Record<string, string | number>;
  default?: DslJson;
}

export interface DslTokenStepStripIfPrefix {
  op: "stripIfPrefix";
  prefix: string;
  to?: string;
}

export interface DslTokenStepTemplate {
  op: "tpl";
  template: string;
  to: string;
}

export interface DslTokenStepFallback {
  op: "fallback";
  primary: string;
  secondary: string;
  to: string;
}

export interface DslTokenStepMul {
  op: "mul";
  a: string;
  b: string;
  to: string;
  default?: number;
}

export interface DslTokenStepSet {
  op: "set";
  to: string;
  value: DslExpr;
}

export interface DslTokenStepMerge {
  op: "merge";
  into: string;
  from: string;
}

export interface DslTokenStepNotEmpty {
  op: "notEmpty";
  from: string;
  to: string;
}

export interface DslTokenStepMergeIf {
  op: "mergeIf";
  into: string;
  from: string;
  if: string;
}

export interface DslTokenStepTakeLongest {
  op: "takeLongest";
  table: string;
  to: string;
  default?: DslJson;
}

export interface DslTokenStepMap {
  op: "map";
  from: string;
  table: string;
  to: string;
  default?: DslJson;
}

export type DslTokenStep =
  | DslTokenStepTake
  | DslTokenStepTakeRegex
  | DslTokenStepStripIfPrefix
  | DslTokenStepTemplate
  | DslTokenStepFallback
  | DslTokenStepMul
  | DslTokenStepSet
  | DslTokenStepMerge
  | DslTokenStepNotEmpty
  | DslTokenStepMergeIf
  | DslTokenStepTakeLongest
  | DslTokenStepMap;

export interface DslTokenDecoder {
  stripPrefixes?: string[];
  tables?: Record<string, Record<string, DslJson>>;
  steps: DslTokenStep[];
  assign: Record<string, DslExpr>;
}

export interface DslRule {
  id: string;
  priority?: number;
  normalize?: NormalizeStep[];
  match: DslMatch;
  set?: Record<string, string | number | boolean>;
  tokenDecoder?: DslTokenDecoder;
}

export interface FlashIdBitRule {
  dq: number[];
  def: Record<string, DslJson>;
}

export type FlashIdDefinition = Record<string, Record<string, FlashIdBitRule>>;

export interface FlashIdDslRule {
  id: string;
  priority?: number;
  match: DslMatch;
  vendor: string;
  definition: FlashIdDefinition;
}
