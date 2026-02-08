export function flashIdByteAt(id: string, offset: number): number {
  const idx = (offset - 1) * 2;
  return Number.parseInt(id.slice(idx, idx + 2), 16);
}

