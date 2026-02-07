export interface FixtureCase {
  name: string;
  input: string;
  endpoint: string;
  expected: unknown;
}

export function compareExpected(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
