import type { FdnextFieldKey } from "./field-registry";
import type { DeviceIdentity, FieldValue, ResultBlock, ResultSummary } from "./result";

type SummarySlot = readonly FdnextFieldKey[];

const dramSlots: readonly SummarySlot[] = [
  ["dram_type"], ["dram_density", "density"], ["dram_width", "device_width"],
  ["dram_speed", "speed_grade"], ["dram_voltage", "voltage"]
];

/** Select actual visible fields without changing units or inferring component facts. */
function briefFields(device: DeviceIdentity, blocks: readonly ResultBlock[]): FieldValue[] {
  const fields = new Map(blocks.flatMap((block) => block.fields).map((field) => [field.key, field]));
  let slots: readonly SummarySlot[];
  if (device.idScheme === "nand.flash_id") {
    slots = [["density"], ["cell_level"], ["page_size"], ["block_size"], ["die_count"], ["plane_count"], ["voltage"]];
  } else if (device.chipKind === "dram") {
    slots = dramSlots;
  } else if (device.chipKind === "managed_nand") {
    slots = [
      ["storage_density", "density"], ["storage_interface", "interface_type"], ["product_version", "speed_grade"],
      ["product_family"], ["product_mode"],
      ["component_density"], ["dram_type"], ["dram_density"], ["dram_width"], ["dram_speed"]
    ];
  } else if (device.chipKind === "3d_xpoint") {
    slots = [["density"], ["die_stack"], ["die_codename"], ["generation_info"], ["storage_interface", "interface_type"]];
  } else if (device.chipKind === "raw_nand") {
    slots = [
      ["density"], ["cell_level"], ["process_alias", "die_codename"], ["layer_count"],
      ["storage_interface", "interface_type", "device_width"], ["voltage"], ["ecc_level"]
    ];
  } else {
    return [...fields.values()].filter((field) => field.importance === "primary").slice(0, 6);
  }
  return slots.flatMap((keys) => {
    const field = keys.map((key) => fields.get(key)).find((value) => value !== undefined);
    return field ? [field] : [];
  });
}

export function buildResultSummary(device: DeviceIdentity, blocks: ResultBlock[]): ResultSummary {
  return { brief: briefFields(device, blocks), full: blocks };
}
