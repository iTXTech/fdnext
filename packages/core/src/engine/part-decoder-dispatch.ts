import type { PartNumberDecoder } from "../types";

interface DispatchTrieNode {
  readonly children: Map<string, DispatchTrieNode>;
  readonly decoderIndexes: number[];
}

function createNode(): DispatchTrieNode {
  return {
    children: new Map(),
    decoderIndexes: []
  };
}

export interface PartDecoderDispatch {
  candidates(input: string): readonly PartNumberDecoder[];
}

export function createPartDecoderDispatch(decoders: readonly PartNumberDecoder[]): PartDecoderDispatch {
  const root = createNode();
  const fallbackIndexes: number[] = [];

  decoders.forEach((decoder, decoderIndex) => {
    const prefixes = [...new Set(decoder.dispatchPrefixes.filter(Boolean).map((prefix) => prefix.toUpperCase()))];
    if (prefixes.length === 0) {
      fallbackIndexes.push(decoderIndex);
      return;
    }
    for (const prefix of prefixes) {
      let node = root;
      for (const char of prefix) {
        let child = node.children.get(char);
        if (!child) {
          child = createNode();
          node.children.set(char, child);
        }
        node = child;
      }
      node.decoderIndexes.push(decoderIndex);
    }
  });

  return Object.freeze({
    candidates(input: string): readonly PartNumberDecoder[] {
      const indexes = new Set(fallbackIndexes);
      let node: DispatchTrieNode | undefined = root;
      for (const char of input) {
        node = node.children.get(char);
        if (!node) {
          break;
        }
        node.decoderIndexes.forEach((index) => indexes.add(index));
      }
      return [...indexes]
        .sort((a, b) => a - b)
        .flatMap((index) => {
          const decoder = decoders[index];
          return decoder ? [decoder] : [];
        });
    }
  });
}
