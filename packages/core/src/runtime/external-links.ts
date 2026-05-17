import { fdnextFieldRegistry } from "../field-registry";
import { fdnextExternalLinkCategories, type ExternalLink, type FdnextResult, type FieldValue, type IdentifierSearchResult, type PartSearchResult, type SearchResultItem, type DeviceIdentity } from "../result";
import type { ExternalLinkFacts, ExternalLinkProvider, ExternalLinkContext, FdnextOperationInput, FdnextRuntimeMeta } from "./types";

const externalLinkCategories = new Set<string>(fdnextExternalLinkCategories);

function isSearchResult(result: FdnextResult): result is PartSearchResult | IdentifierSearchResult {
  return result.operation === "part.search" || result.operation === "identifier.search";
}

function collectFieldFacts(fields: FieldValue[] | undefined, facts: ExternalLinkFacts): void {
  for (const field of fields ?? []) {
    facts.fields[field.key] = field.value;
    if (field.key === "controller") {
      const values = Array.isArray(field.value) ? field.value : [field.value];
      for (const value of values) {
        if (typeof value === "string" && value) {
          facts.controllers.push(value);
        }
      }
    }
  }
}

function factsFromDevice(device: DeviceIdentity | undefined): ExternalLinkFacts {
  return {
    partNumber: device?.partNumber,
    identifier: device?.identifier,
    vendor: device?.vendor.id,
    chipKind: device?.chipKind,
    productType: device?.productType,
    controllers: [],
    fields: {}
  };
}

function factsFromResult(result: FdnextResult, item?: SearchResultItem): ExternalLinkFacts {
  const facts = factsFromDevice(item?.device ?? ("device" in result ? result.device : undefined));
  if (item) {
    collectFieldFacts(item.fields, facts);
    for (const relation of item.relations ?? []) {
      collectFieldFacts(relation.fields, facts);
    }
  } else if ("blocks" in result) {
    for (const block of result.blocks) {
      collectFieldFacts(block.fields, facts);
    }
    for (const relation of result.relations) {
      collectFieldFacts(relation.fields, facts);
    }
  } else {
    for (const relation of result.relations ?? []) {
      collectFieldFacts(relation.fields, facts);
    }
  }
  facts.controllers = [...new Set(facts.controllers)];
  return facts;
}

function isAllowedExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeLinks(links: ExternalLink[]): ExternalLink[] {
  const unique = new Map<string, ExternalLink>();
  for (const link of links) {
    if (!link.id || !link.label || !link.url || !isAllowedExternalUrl(link.url)) {
      continue;
    }
    const clean: ExternalLink = {
      id: link.id,
      label: link.label,
      url: link.url,
      ...(link.category && externalLinkCategories.has(link.category) ? { category: link.category } : {}),
      ...(link.image ? { image: link.image } : {}),
      ...(link.hint ? { hint: link.hint } : {}),
      ...(link.fieldKey && Object.hasOwn(fdnextFieldRegistry, link.fieldKey) ? { fieldKey: link.fieldKey } : {}),
      ...(typeof link.priority === "number" && Number.isFinite(link.priority) ? { priority: link.priority } : {})
    };
    unique.set(`${clean.id}\n${clean.url}`, clean);
  }
  return [...unique.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
}

async function collectLinks(
  providers: ExternalLinkProvider[],
  context: ExternalLinkContext
): Promise<ExternalLink[]> {
  const links: ExternalLink[] = [];
  for (const provider of providers) {
    links.push(...(await provider.resolveLinks(context)));
  }
  return sanitizeLinks(links);
}

export async function attachExternalLinks(
  providers: ExternalLinkProvider[],
  result: FdnextResult,
  input: FdnextOperationInput | undefined,
  meta: FdnextRuntimeMeta
): Promise<FdnextResult> {
  if (providers.length === 0) {
    return result;
  }

  const topLevelLinks = await collectLinks(providers, {
    operation: result.operation,
    input,
    result,
    facts: factsFromResult(result),
    meta
  });

  if (!isSearchResult(result)) {
    return topLevelLinks.length > 0 ? { ...result, links: topLevelLinks } : result;
  }

  let changed = topLevelLinks.length > 0;
  const items = await Promise.all(
    result.items.map(async (item) => {
      const links = await collectLinks(providers, {
        operation: result.operation,
        input,
        result,
        item,
        facts: factsFromResult(result, item),
        meta
      });
      if (links.length === 0) {
        return item;
      }
      changed = true;
      return { ...item, links };
    })
  );

  return changed ? { ...result, ...(topLevelLinks.length > 0 ? { links: topLevelLinks } : {}), items } : result;
}
