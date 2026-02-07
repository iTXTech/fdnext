export function startsWith(input: string, prefix: string): boolean {
  return input.startsWith(prefix);
}

export function endsWith(input: string, suffix: string): boolean {
  return input.endsWith(suffix);
}

export function contains(input: string, fragment: string): boolean {
  return input.includes(fragment);
}

export function removeChars(input: string, chars: string[]): string {
  let out = input;
  for (const char of chars) {
    out = out.split(char).join("");
  }
  return out;
}

export function shiftChars(input: string, count: number): [string, string] {
  if (count <= 0) {
    return ["", input];
  }
  if (count > input.length) {
    return ["", input];
  }
  return [input.slice(0, count), input.slice(count)];
}
