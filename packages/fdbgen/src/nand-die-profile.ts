import { isNandDieProfileKey, nandDieProfileKeys, nandDieProfileTable } from "@itxtech/fdnext-decodepack";

const profileByCompact = new Map<string, string>();
const profileByAliasCompact = new Map<string, string | null>();
const profileKeysByLength = [...nandDieProfileKeys].sort((left, right) => right.length - left.length || left.localeCompare(right));

for (const key of nandDieProfileKeys) {
  profileByCompact.set(compactToken(key), key);
  const profile = nandDieProfileTable[key];
  const aliases = [
    profile?.process_alias,
    ...(Array.isArray(profile?.firmware_match) ? profile.firmware_match : []),
    ...(Array.isArray(profile?.die_mark) ? profile.die_mark : [])
  ];
  for (const alias of aliases) {
    const compact = compactToken(String(alias ?? ""));
    if (!compact) {
      continue;
    }
    const previous = profileByAliasCompact.get(compact);
    if (previous === undefined) {
      profileByAliasCompact.set(compact, key);
    } else if (previous !== key) {
      profileByAliasCompact.set(compact, null);
    }
  }
}

const profileAliasesByLength = [...profileByAliasCompact.keys()]
  .filter((key) => profileByAliasCompact.get(key))
  .sort((left, right) => right.length - left.length || left.localeCompare(right));

const legacyShortProfileKeys: Record<string, string> = {
  B74: "B74A",
  B95: "B95A",
  L06: "L06B",
  L62: "L62A",
  L74: "L74A",
  M70: "M70M"
};

function compactToken(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function tokens(value: string): string[] {
  return value.toUpperCase().match(/[A-Z0-9]+(?:\.[A-Z0-9]+)?/g) ?? [];
}

function profileKey(value: string | undefined): string | undefined {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }
  if (isNandDieProfileKey(text)) {
    return text;
  }
  return profileByCompact.get(compactToken(text));
}

function legacyShortProfileKey(value: string | undefined): string | undefined {
  const compact = compactToken(value ?? "");
  return profileKey(legacyShortProfileKeys[compact]);
}

function profileAliasKey(value: string | undefined): string | undefined {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }
  return profileByAliasCompact.get(compactToken(text)) ?? undefined;
}

function firstProfile(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    const key = profileKey(candidate);
    if (key) {
      return key;
    }
  }
  return undefined;
}

function cellName(value: string | undefined): "SLC" | "MLC" | "TLC" | "QLC" | undefined {
  const compact = compactToken(value ?? "");
  if (compact === "SLC" || compact === "1") return "SLC";
  if (compact === "MLC" || compact === "2") return "MLC";
  if (compact === "TLC" || compact === "3") return "TLC";
  if (compact === "QLC" || compact === "4") return "QLC";
  return undefined;
}

function profileForCell(base: string, cell: string | undefined): string | undefined {
  const normalized = cellName(cell);
  return firstProfile([
    normalized === "SLC" ? `${base}S` : undefined,
    normalized === "MLC" ? `${base}M` : undefined,
    normalized === "TLC" ? `${base}T` : undefined,
    normalized === "QLC" ? `${base}Q` : undefined,
    base
  ]);
}

function normalizedFallbackProfile(value: string): string | undefined {
  const compact = compactToken(value);
  if (/A19NM/.test(compact)) {
    return profileKey("A19nm");
  }
  const node = /(130|90|72|70|65|60|57|56|51|50|48|43|42|41|34|32|27|26|25|24|21|20|19|16|15|14)NM/.exec(compact)?.[1];
  return node ? profileKey(`${node}nm`) : undefined;
}

function isFallbackProcessText(value: string): boolean {
  const compact = compactToken(value);
  return /A19NM?/.test(compact) || /3DV[0-9]/.test(compact) || /[0-9]{2,3}NM/.test(compact);
}

function matchKioxiaSandiskFullCode(vendor: string, value: string): string | undefined {
  const prefix = vendor === "sndk" ? "S" : vendor === "kioxia" ? "K" : undefined;
  if (!prefix) {
    return undefined;
  }
  for (const token of tokens(value)) {
    const match = /^([0-9][TSF][0-9A-Z]{2})$/.exec(token);
    if (!match?.[1]) {
      continue;
    }
    const key = profileKey(`${prefix}${match[1]}`);
    if (key) {
      return key;
    }
  }
  return undefined;
}

function matchKioxiaSandiskGeneration(vendor: string, value: string): string | undefined {
  const prefix = vendor === "sndk" ? "S" : vendor === "kioxia" ? "K" : undefined;
  if (!prefix) {
    return undefined;
  }
  const compact = compactToken(value);
  if (/BICS45|3DV4P5|3DV45/.test(compact)) {
    return profileKey(`${prefix}BiCS4.5`);
  }
  const generation = /BICS([234568])/.exec(compact)?.[1] ?? /3DV([456])/.exec(compact)?.[1];
  return generation ? profileKey(`${prefix}BiCS${generation}`) : undefined;
}

function matchKioxiaSandisk2d(vendor: string, value: string, cell: string | undefined): string | undefined {
  const prefix = vendor === "sndk" ? "SNK" : vendor === "kioxia" ? "TSB" : undefined;
  if (!prefix) {
    return undefined;
  }
  const compact = compactToken(value);
  if (/A19|1YNM|1Y/.test(compact)) {
    return profileForCell(`${prefix}1Y`, cell);
  }
  const node = /(130|90|70|56|43|32|24|19|15)NM/.exec(compact)?.[1];
  return node ? profileForCell(`${prefix}${node}`, cell) : undefined;
}

function matchSamsung(value: string, cell: string | undefined): string | undefined {
  const compact = compactToken(value);
  const generation = /3DV([0-9])/.exec(compact)?.[1];
  if (generation) {
    return profileForCell(`SSV${generation}`, cell);
  }
  if (/14NM/.test(compact)) return profileKey("SS14");
  if (/16NM/.test(compact)) return profileForCell("SS16", cell);
  if (/19NM/.test(compact)) return profileKey("SS19");
  if (/21NM/.test(compact)) return profileForCell("SS21", cell);
  if (/27NM/.test(compact)) return profileKey("SS27");
  if (/32NM/.test(compact)) return profileKey("SS32");
  if (/4[123]NM/.test(compact)) return profileKey("SS42");
  if (/5[01]NM/.test(compact)) return profileKey("SS51");
  if (/35NM/.test(compact)) return profileKey("SS2D");
  return undefined;
}

function matchSkhynix(value: string, cell: string | undefined): string | undefined {
  const compact = compactToken(value);
  const generation = /3DV([0-9])/.exec(compact)?.[1];
  if (generation) {
    return profileForCell(`HYV${generation}`, cell);
  }
  const node = /(90|60|57|48|41|32|26|20|16|14)NM/.exec(compact)?.[1];
  return node ? profileForCell(`HY${node}`, cell) : undefined;
}

function matchEmbeddedProfile(value: string): string | undefined {
  for (const token of tokens(value)) {
    const key = profileKey(token);
    if (key && normalizedFallbackProfile(token) !== key) {
      return key;
    }
  }
  const compact = compactToken(value);
  for (const key of profileKeysByLength) {
    const compactKey = compactToken(key);
    if (compactKey.length >= 4 && compact.includes(compactKey) && normalizedFallbackProfile(key) !== key) {
      return key;
    }
  }
  return undefined;
}

function matchProfileAlias(value: string): string | undefined {
  for (const token of tokens(value)) {
    const key = profileAliasKey(token);
    if (key) {
      return key;
    }
  }
  const compact = compactToken(value);
  for (const alias of profileAliasesByLength) {
    if (alias.length >= 3 && compact.includes(alias)) {
      return profileByAliasCompact.get(alias) ?? undefined;
    }
  }
  return undefined;
}

export function isGeneratedFdbDieProfile(value: string): boolean {
  return isNandDieProfileKey(value);
}

function profileSpecificity(key: string): number {
  const profile = nandDieProfileTable[key];
  if (!profile) {
    return 0;
  }
  const isFallback = normalizedFallbackProfile(key) === key && !profile.process_alias && !profile.firmware_match?.length && !profile.die_mark?.length;
  return isFallback ? 1 : 2;
}

export function normalizeGeneratedFdbDieProfile(vendor: string, value: string | undefined, cell?: string): string | undefined {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }
  const normalizedVendor = vendor.toLowerCase();
  return (
    legacyShortProfileKey(text) ??
    (!isFallbackProcessText(text) ? profileKey(text) : undefined) ??
    matchKioxiaSandiskFullCode(normalizedVendor, text) ??
    matchKioxiaSandiskGeneration(normalizedVendor, text) ??
    (normalizedVendor === "sndk" || normalizedVendor === "kioxia" ? matchKioxiaSandisk2d(normalizedVendor, text, cell) : undefined) ??
    (normalizedVendor === "samsung" ? matchSamsung(text, cell) : undefined) ??
    (normalizedVendor === "skhynix" ? matchSkhynix(text, cell) : undefined) ??
    matchProfileAlias(text) ??
    matchEmbeddedProfile(text) ??
    (normalizedVendor === "intel" ? undefined : normalizedFallbackProfile(text))
  );
}

export function chooseGeneratedFdbDieProfile(
  vendor: string,
  current: string | undefined,
  candidate: string | undefined,
  cell?: string
): string | undefined {
  const candidateText = candidate?.trim();
  if (!candidateText) {
    return current;
  }
  const currentText = current?.trim();
  if (!currentText) {
    return candidateText;
  }

  const currentKey = normalizeGeneratedFdbDieProfile(vendor, currentText, cell);
  const candidateKey = normalizeGeneratedFdbDieProfile(vendor, candidateText, cell);
  if (!currentKey) {
    return candidateText;
  }
  if (!candidateKey) {
    return currentText;
  }
  return profileSpecificity(candidateKey) >= profileSpecificity(currentKey) ? candidateText : currentText;
}
