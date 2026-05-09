import type { FieldValue, FdnextBlockId, FdnextFieldImportance, FdnextFieldValueData } from "./result";

export const fdnextFieldValueKinds = [
  "string",
  "number",
  "boolean",
  "string_list",
  "number_list",
  "object"
] as const;

export type FdnextFieldValueKind = (typeof fdnextFieldValueKinds)[number];

export interface FdnextFieldDefinition {
  key: string;
  valueKind: FdnextFieldValueKind;
  defaultLabel: string;
  defaultUnit?: string;
  units?: readonly string[];
  recommendedBlock: FdnextBlockId;
  importance: FdnextFieldImportance;
  format?: (value: FdnextFieldValueData, unit?: string) => string | undefined;
}

function formatMbit(value: FdnextFieldValueData, unit?: string): string | undefined {
  if (typeof value !== "number" || unit !== "Mbit") {
    return undefined;
  }

  const units = ["Mb", "Gb", "Tb"] as const;
  let numeric = value;
  let index = 0;
  while (numeric >= 1024 && units[index + 1]) {
    numeric /= 1024;
    index += 1;
  }
  return `${numeric}${units[index]}`;
}

function formatBytes(value: FdnextFieldValueData, unit?: string): string | undefined {
  if (typeof value !== "number" || unit !== "byte") {
    return undefined;
  }

  const units = ["B", "KiB", "MiB", "GiB"] as const;
  let numeric = value;
  let index = 0;
  while (numeric >= 1024 && units[index + 1]) {
    numeric /= 1024;
    index += 1;
  }
  return `${numeric}${units[index]}`;
}

export const fdnextFieldRegistry = {
  part_number: {
    key: "part_number",
    valueKind: "string",
    defaultLabel: "Part Number",
    recommendedBlock: "identity",
    importance: "primary"
  },
  vendor: {
    key: "vendor",
    valueKind: "string",
    defaultLabel: "Vendor",
    recommendedBlock: "identity",
    importance: "primary"
  },
  chip_kind: {
    key: "chip_kind",
    valueKind: "string",
    defaultLabel: "Chip Kind",
    recommendedBlock: "identity",
    importance: "primary"
  },
  product_type: {
    key: "product_type",
    valueKind: "string",
    defaultLabel: "Product Type",
    recommendedBlock: "identity",
    importance: "primary"
  },
  identifier: {
    key: "identifier",
    valueKind: "string",
    defaultLabel: "Identifier",
    recommendedBlock: "identity",
    importance: "primary"
  },
  id_scheme: {
    key: "id_scheme",
    valueKind: "string",
    defaultLabel: "Identifier Scheme",
    recommendedBlock: "identity",
    importance: "secondary"
  },
  marking_code: {
    key: "marking_code",
    valueKind: "string",
    defaultLabel: "Marking Code",
    recommendedBlock: "marking",
    importance: "primary"
  },
  density: {
    key: "density",
    valueKind: "number",
    defaultLabel: "Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "storage",
    importance: "primary",
    format: formatMbit
  },
  die_density: {
    key: "die_density",
    valueKind: "number",
    defaultLabel: "Die Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "geometry",
    importance: "secondary",
    format: formatMbit
  },
  component_density: {
    key: "component_density",
    valueKind: "number",
    defaultLabel: "Component Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "components",
    importance: "secondary",
    format: formatMbit
  },
  storage_density: {
    key: "storage_density",
    valueKind: "number",
    defaultLabel: "Storage Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "storage",
    importance: "primary",
    format: formatMbit
  },
  dram_density: {
    key: "dram_density",
    valueKind: "number",
    defaultLabel: "DRAM Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "dram",
    importance: "primary",
    format: formatMbit
  },
  cell_level: {
    key: "cell_level",
    valueKind: "string",
    defaultLabel: "Cell Level",
    recommendedBlock: "geometry",
    importance: "primary"
  },
  process_node: {
    key: "process_node",
    valueKind: "string",
    defaultLabel: "Process Node",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  device_width: {
    key: "device_width",
    valueKind: "number",
    defaultLabel: "Device Width",
    defaultUnit: "bit",
    units: ["bit"],
    recommendedBlock: "interface",
    importance: "secondary"
  },
  voltage: {
    key: "voltage",
    valueKind: "string",
    defaultLabel: "Voltage",
    recommendedBlock: "interface",
    importance: "secondary"
  },
  package: {
    key: "package",
    valueKind: "string",
    defaultLabel: "Package",
    recommendedBlock: "package",
    importance: "secondary"
  },
  storage_interface: {
    key: "storage_interface",
    valueKind: "string",
    defaultLabel: "Storage Interface",
    recommendedBlock: "interface",
    importance: "primary"
  },
  generation_info: {
    key: "generation_info",
    valueKind: "string",
    defaultLabel: "Generation",
    recommendedBlock: "storage",
    importance: "secondary"
  },
  die_stack: {
    key: "die_stack",
    valueKind: "number",
    defaultLabel: "Die Stack",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  dram_type: {
    key: "dram_type",
    valueKind: "string",
    defaultLabel: "DRAM Type",
    recommendedBlock: "dram",
    importance: "primary"
  },
  dram_speed: {
    key: "dram_speed",
    valueKind: "string",
    defaultLabel: "DRAM Speed",
    recommendedBlock: "dram",
    importance: "secondary"
  },
  dram_width: {
    key: "dram_width",
    valueKind: "number",
    defaultLabel: "DRAM Width",
    defaultUnit: "bit",
    units: ["bit"],
    recommendedBlock: "dram",
    importance: "secondary"
  },
  dram_voltage: {
    key: "dram_voltage",
    valueKind: "string",
    defaultLabel: "DRAM Voltage",
    recommendedBlock: "dram",
    importance: "secondary"
  },
  dram_die_stack: {
    key: "dram_die_stack",
    valueKind: "number",
    defaultLabel: "DRAM Die Stack",
    recommendedBlock: "dram",
    importance: "secondary"
  },
  page_size: {
    key: "page_size",
    valueKind: "number",
    defaultLabel: "Page Size",
    defaultUnit: "byte",
    units: ["byte"],
    recommendedBlock: "geometry",
    importance: "secondary",
    format: formatBytes
  },
  block_size: {
    key: "block_size",
    valueKind: "number",
    defaultLabel: "Block Size",
    defaultUnit: "byte",
    units: ["byte"],
    recommendedBlock: "geometry",
    importance: "secondary",
    format: formatBytes
  },
  plane_count: {
    key: "plane_count",
    valueKind: "number",
    defaultLabel: "Plane Count",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  die_count: {
    key: "die_count",
    valueKind: "number",
    defaultLabel: "Die Count",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  controller: {
    key: "controller",
    valueKind: "string",
    defaultLabel: "Controller",
    recommendedBlock: "controllers",
    importance: "secondary"
  },
  operation_temperature: {
    key: "operation_temperature",
    valueKind: "string",
    defaultLabel: "Operation Temperature",
    recommendedBlock: "package",
    importance: "detail"
  }
} as const satisfies Record<string, FdnextFieldDefinition>;

export type FdnextFieldKey = keyof typeof fdnextFieldRegistry;

export const fdnextFieldKeys = Object.keys(fdnextFieldRegistry) as FdnextFieldKey[];

export function formatFdnextFieldValue(key: FdnextFieldKey, value: FdnextFieldValueData, unit?: string): string | undefined {
  const definition = fdnextFieldRegistry[key] as FdnextFieldDefinition;
  return definition.format?.(value, unit);
}

export function createFdnextFieldValue(
  key: FdnextFieldKey,
  value: FdnextFieldValueData,
  options: Partial<Omit<FieldValue, "key" | "value">> = {}
): FieldValue {
  const definition = fdnextFieldRegistry[key] as FdnextFieldDefinition;
  const unit = options.unit ?? definition.defaultUnit;
  const display = options.display ?? formatFdnextFieldValue(key, value, unit);
  return {
    key,
    label: options.label ?? definition.defaultLabel,
    value,
    ...(unit ? { unit } : {}),
    ...(display ? { display } : {}),
    importance: options.importance ?? definition.importance
  };
}
