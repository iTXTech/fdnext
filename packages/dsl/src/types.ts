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

export interface DslRule {
  id: string;
  priority?: number;
  normalize?: NormalizeStep[];
  match: DslMatch;
  set?: Record<string, string | number | boolean>;
}
