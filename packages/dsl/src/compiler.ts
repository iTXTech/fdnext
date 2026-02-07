import type { PartNumberDecoder, FlashInfo } from "@fdnext/core";
import type { DslRule, NormalizeStep } from "./types.js";

function normalize(input: string, steps: NormalizeStep[] = []): string {
  let value = input;
  for (const step of steps) {
    if (step === "trim") {
      value = value.trim();
      continue;
    }
    if (step === "uppercase") {
      value = value.toUpperCase();
      continue;
    }
    if (typeof step === "object" && Array.isArray(step.remove)) {
      for (const token of step.remove) {
        value = value.split(token).join("");
      }
    }
  }
  return value;
}

export function compileRulesToDecoders(rules: DslRule[]): PartNumberDecoder[] {
  return rules.map((rule) => {
    const check = (partNumber: string): boolean => {
      const normalized = normalize(partNumber, rule.normalize);
      if (rule.match.kind === "prefix") {
        return normalized.startsWith(rule.match.value);
      }
      return new RegExp(rule.match.value, rule.match.flags).test(normalized);
    };

    const decode = (partNumber: string): Partial<FlashInfo> | null => {
      const normalized = normalize(partNumber, rule.normalize);
      if (!check(normalized)) {
        return null;
      }
      return {
        partNumber: normalized,
        ...(rule.set ?? {})
      } as Partial<FlashInfo>;
    };

    return {
      id: rule.id,
      priority: rule.priority,
      check,
      decode
    } satisfies PartNumberDecoder;
  });
}
