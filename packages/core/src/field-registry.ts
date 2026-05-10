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

function formatMbitAsBytes(value: FdnextFieldValueData, unit?: string): string | undefined {
  if (typeof value !== "number" || unit !== "Mbit") {
    return undefined;
  }

  const units = ["MB", "GB", "TB"] as const;
  let numeric = value / 8;
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

function formatBitWidth(value: FdnextFieldValueData, unit?: string): string | undefined {
  if (typeof value !== "number" || unit !== "bit") {
    return undefined;
  }
  return `x${value}`;
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
    format: formatMbitAsBytes
  },
  die_density: {
    key: "die_density",
    valueKind: "number",
    defaultLabel: "Die Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "geometry",
    importance: "secondary",
    format: formatMbitAsBytes
  },
  component_density: {
    key: "component_density",
    valueKind: "number",
    defaultLabel: "Component Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "components",
    importance: "secondary",
    format: formatMbitAsBytes
  },
  storage_density: {
    key: "storage_density",
    valueKind: "number",
    defaultLabel: "Storage Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "storage",
    importance: "primary",
    format: formatMbitAsBytes
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
    importance: "secondary",
    format: formatBitWidth
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
    importance: "secondary",
    format: formatBitWidth
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
  blocks_per_lun: {
    key: "blocks_per_lun",
    valueKind: "string",
    defaultLabel: "Blocks per LUN",
    recommendedBlock: "geometry",
    importance: "detail"
  },
  plane_count: {
    key: "plane_count",
    valueKind: "number",
    defaultLabel: "Plane Count",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  plane: {
    key: "plane",
    valueKind: "number",
    defaultLabel: "Plane",
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
  ce_count: {
    key: "ce_count",
    valueKind: "number",
    defaultLabel: "CE Count",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  rb_count: {
    key: "rb_count",
    valueKind: "number",
    defaultLabel: "R/B Count",
    recommendedBlock: "geometry",
    importance: "secondary"
  },
  channel_count: {
    key: "channel_count",
    valueKind: "number",
    defaultLabel: "Channel Count",
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
  controller_code: {
    key: "controller_code",
    valueKind: "string",
    defaultLabel: "Controller Code",
    recommendedBlock: "controllers",
    importance: "detail"
  },
  controller_revision: {
    key: "controller_revision",
    valueKind: "string",
    defaultLabel: "Controller Revision",
    recommendedBlock: "controllers",
    importance: "detail"
  },
  config_code: {
    key: "config_code",
    valueKind: "string",
    defaultLabel: "Config Code",
    recommendedBlock: "dram",
    importance: "detail"
  },
  package_code: {
    key: "package_code",
    valueKind: "string",
    defaultLabel: "Package Code",
    recommendedBlock: "package",
    importance: "detail"
  },
  die_revision: {
    key: "die_revision",
    valueKind: "string",
    defaultLabel: "Die Revision",
    recommendedBlock: "dram",
    importance: "detail"
  },
  product_family: {
    key: "product_family",
    valueKind: "string",
    defaultLabel: "Product Family",
    recommendedBlock: "identity",
    importance: "secondary"
  },
  product_version: {
    key: "product_version",
    valueKind: "string",
    defaultLabel: "Product Version",
    recommendedBlock: "identity",
    importance: "secondary"
  },
  product_mode: {
    key: "product_mode",
    valueKind: "string",
    defaultLabel: "Product Mode",
    recommendedBlock: "identity",
    importance: "secondary"
  },
  product_class: {
    key: "product_class",
    valueKind: "string",
    defaultLabel: "Product Class",
    recommendedBlock: "package",
    importance: "secondary"
  },
  product_generation: {
    key: "product_generation",
    valueKind: "string",
    defaultLabel: "Product Generation",
    recommendedBlock: "storage",
    importance: "secondary"
  },
  managed_family: {
    key: "managed_family",
    valueKind: "string",
    defaultLabel: "Managed Family",
    recommendedBlock: "identity",
    importance: "secondary"
  },
  nand_technology: {
    key: "nand_technology",
    valueKind: "string",
    defaultLabel: "NAND Technology",
    recommendedBlock: "storage",
    importance: "secondary"
  },
  nand_stack: {
    key: "nand_stack",
    valueKind: "string",
    defaultLabel: "NAND Stack",
    recommendedBlock: "storage",
    importance: "secondary"
  },
  series_code: {
    key: "series_code",
    valueKind: "string",
    defaultLabel: "Series Code",
    recommendedBlock: "identity",
    importance: "detail"
  },
  speed_grade: {
    key: "speed_grade",
    valueKind: "string",
    defaultLabel: "Speed Grade",
    recommendedBlock: "timing",
    importance: "secondary"
  },
  timing_mode_async: {
    key: "timing_mode_async",
    valueKind: "string",
    defaultLabel: "Async Timing Mode",
    recommendedBlock: "timing",
    importance: "detail"
  },
  edo: {
    key: "edo",
    valueKind: "boolean",
    defaultLabel: "EDO",
    recommendedBlock: "timing",
    importance: "detail"
  },
  component_width: {
    key: "component_width",
    valueKind: "number",
    defaultLabel: "Component Width",
    defaultUnit: "bit",
    units: ["bit"],
    recommendedBlock: "components",
    importance: "detail",
    format: formatBitWidth
  },
  nand_component: {
    key: "nand_component",
    valueKind: "string",
    defaultLabel: "NAND Component",
    recommendedBlock: "components",
    importance: "detail"
  },
  component_voltage: {
    key: "component_voltage",
    valueKind: "string",
    defaultLabel: "Component Voltage",
    recommendedBlock: "components",
    importance: "detail"
  },
  dram_die_density: {
    key: "dram_die_density",
    valueKind: "number",
    defaultLabel: "DRAM Die Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    recommendedBlock: "dram",
    importance: "secondary",
    format: formatMbit
  },
  dram_generation: {
    key: "dram_generation",
    valueKind: "string",
    defaultLabel: "DRAM Generation",
    recommendedBlock: "dram",
    importance: "secondary"
  },
  die_code: {
    key: "die_code",
    valueKind: "string",
    defaultLabel: "Die Code",
    recommendedBlock: "geometry",
    importance: "detail"
  },
  density_code: {
    key: "density_code",
    valueKind: "string",
    defaultLabel: "Density Code",
    recommendedBlock: "storage",
    importance: "detail"
  },
  cell_code: {
    key: "cell_code",
    valueKind: "string",
    defaultLabel: "Cell Code",
    recommendedBlock: "storage",
    importance: "detail"
  },
  layout_code: {
    key: "layout_code",
    valueKind: "string",
    defaultLabel: "Layout Code",
    recommendedBlock: "storage",
    importance: "detail"
  },
  stack_code: {
    key: "stack_code",
    valueKind: "string",
    defaultLabel: "Stack Code",
    recommendedBlock: "storage",
    importance: "detail"
  },
  generation_code: {
    key: "generation_code",
    valueKind: "string",
    defaultLabel: "Generation Code",
    recommendedBlock: "storage",
    importance: "detail"
  },
  voltage_io_code: {
    key: "voltage_io_code",
    valueKind: "string",
    defaultLabel: "Voltage/I/O Code",
    recommendedBlock: "interface",
    importance: "detail"
  },
  interface_type: {
    key: "interface_type",
    valueKind: "string",
    defaultLabel: "Interface Type",
    recommendedBlock: "interface",
    importance: "secondary"
  },
  ecc_enabled: {
    key: "ecc_enabled",
    valueKind: "boolean",
    defaultLabel: "ECC enabled",
    recommendedBlock: "interface",
    importance: "detail"
  },
  micron_part_number: {
    key: "micron_part_number",
    valueKind: "string",
    defaultLabel: "Micron Part Number",
    recommendedBlock: "marking",
    importance: "detail"
  },
  prod_status: {
    key: "prod_status",
    valueKind: "string",
    defaultLabel: "Production Status",
    recommendedBlock: "package",
    importance: "detail"
  },
  feature_code: {
    key: "feature_code",
    valueKind: "string",
    defaultLabel: "Feature Code",
    recommendedBlock: "package",
    importance: "detail"
  },
  special_option: {
    key: "special_option",
    valueKind: "string",
    defaultLabel: "Special Option",
    recommendedBlock: "package",
    importance: "detail"
  },
  enterprise: {
    key: "enterprise",
    valueKind: "boolean",
    defaultLabel: "Enterprise",
    recommendedBlock: "package",
    importance: "detail"
  },
  system: {
    key: "system",
    valueKind: "string",
    defaultLabel: "System",
    recommendedBlock: "identity",
    importance: "detail"
  },
  group: {
    key: "group",
    valueKind: "string",
    defaultLabel: "Group",
    recommendedBlock: "identity",
    importance: "detail"
  },
  package_functionality_partial_type: {
    key: "package_functionality_partial_type",
    valueKind: "string",
    defaultLabel: "Package functionality partial type",
    recommendedBlock: "package",
    importance: "detail"
  },
  density_grade: {
    key: "density_grade",
    valueKind: "string",
    defaultLabel: "Density grade",
    recommendedBlock: "storage",
    importance: "detail"
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
  const unit = options.unit ?? (typeof value === "number" ? definition.defaultUnit : undefined);
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
