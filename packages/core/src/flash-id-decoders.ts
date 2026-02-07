import type { FlashIdDecoder, FlashIdInfo } from "./types.js";

type RuleSet = Record<
  number,
  Record<
    string,
    {
      dq: number[];
      def: Record<number, unknown>;
    }
  >
>;

const INTEL_MICRON_DEF: RuleSet = {
  2: {
    voltage: {
      dq: [2, 1, 0],
      def: {
        0b011: "Vcc: 2.5V/3.3V",
        0b100: "Vcc: 3.3V"
      }
    },
    density: {
      dq: [7, 6, 5, 4, 3],
      def: {
        0b01001: 32 * 1024,
        0b10001: 64 * 1024,
        0b10000: 128 * 1024,
        0b10100: 256 * 1024,
        0b10110: 384 * 1024,
        0b11000: 512 * 1024,
        0b11010: 1024 * 1024,
        0b11100: 2 * 1024 * 1024,
        0b11110: 4 * 1024 * 1024,
        0b00101: 8 * 1024 * 1024
      }
    }
  },
  3: {
    die: {
      dq: [1, 0],
      def: {
        0b00: 1,
        0b01: 2,
        0b10: 4,
        0b11: 8
      }
    },
    cellLevel: {
      dq: [3, 2],
      def: {
        0b00: 1,
        0b01: 2,
        0b10: 3,
        0b11: 4
      }
    },
    "ext:pagesPerBlock": {
      dq: [6, 5, 4],
      def: {
        0b110: "512/1024/1536",
        0b010: "9216"
      }
    }
  },
  4: {
    pageSize: {
      dq: [2, 1, 0],
      def: {
        0b110: 4,
        0b111: 8,
        0b011: 8,
        0b010: 16,
        0b100: 16
      }
    }
  },
  5: {
    plane: {
      dq: [1, 0],
      def: {
        0b00: 1,
        0b01: 2,
        0b10: 4
      }
    },
    "ext:blocksPerLun": {
      dq: [4, 3, 2],
      def: {
        0b000: "1024",
        0b001: "1025~2048",
        0b010: "2049~4096"
      }
    },
    "ext:timingModeAsync": {
      dq: [7, 6, 5],
      def: {
        0b000: "0 (100ns)",
        0b001: "1 (50ns)",
        0b010: "2 (35ns)",
        0b011: "3 (30ns)",
        0b100: "4 (25ns)",
        0b101: "5 (20ns)",
        0b110: "Default"
      }
    }
  },
  6: {
    "ext:revision": {
      dq: [3, 2],
      def: {
        0b00: 1,
        0b01: 2,
        0b10: 3,
        0b11: 4
      }
    },
    "ext:enterprise": {
      dq: [1, 0],
      def: {
        0b00: false,
        0b01: true
      }
    }
  }
};

function byteAt(id: string, offset: number): number {
  const idx = (offset - 1) * 2;
  return Number.parseInt(id.slice(idx, idx + 2), 16);
}

function decodeByDefinition(id: string, def: RuleSet): Partial<FlashIdInfo> {
  const out: Partial<FlashIdInfo> = {};
  const ext: Record<string, unknown> = {};

  for (const [offsetKey, rules] of Object.entries(def)) {
    const byte = byteAt(id, Number(offsetKey));
    for (const [name, rule] of Object.entries(rules)) {
      let data = 0;
      for (const bit of rule.dq) {
        data = (data << 1) + ((byte >> bit) & 0b1);
      }
      if (!(data in rule.def)) {
        continue;
      }
      const resolved = rule.def[data];
      if (name.startsWith("ext:")) {
        ext[name.slice(4)] = resolved;
      } else {
        (out as Record<string, unknown>)[name] = resolved;
      }
    }
  }

  if (Object.keys(ext).length > 0) {
    out.ext = ext;
  }
  return out;
}

export function buildDefaultFlashIdDecoders(): FlashIdDecoder[] {
  return [
    {
      id: "flashid.micron.inteldef",
      priority: 400,
      check: (id) => id.length === 12 && id.startsWith("2C"),
      decode: (id) => ({
        vendor: "micron",
        ...decodeByDefinition(id, INTEL_MICRON_DEF)
      })
    }
  ];
}
