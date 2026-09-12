import type { FieldValue, FdnextFieldImportance, FdnextFieldValueData } from "./result";
import { formatNandInterface } from "./nand-interface";

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

function formatDensityOptions(value: FdnextFieldValueData, unit?: string): string | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "number")) {
    return undefined;
  }
  const options = value.map((item) => formatMbitAsBytes(item, unit));
  return options.every((item) => item !== undefined) ? options.join(" / ") : undefined;
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
    importance: "primary"
  },
  vendor: {
    key: "vendor",
    valueKind: "string",
    defaultLabel: "Vendor",
    importance: "primary"
  },
  original_vendor: {
    key: "original_vendor",
    valueKind: "string",
    defaultLabel: "Original Vendor",
    importance: "detail"
  },
  chip_kind: {
    key: "chip_kind",
    valueKind: "string",
    defaultLabel: "Chip Kind",
    importance: "primary"
  },
  product_type: {
    key: "product_type",
    valueKind: "string",
    defaultLabel: "Product Type",
    importance: "primary"
  },
  identifier: {
    key: "identifier",
    valueKind: "string",
    defaultLabel: "Identifier",
    importance: "primary"
  },
  id_scheme: {
    key: "id_scheme",
    valueKind: "string",
    defaultLabel: "Identifier Scheme",
    importance: "secondary"
  },
  marking_code: {
    key: "marking_code",
    valueKind: "string",
    defaultLabel: "Marking Code",
    importance: "primary"
  },
  density: {
    key: "density",
    valueKind: "number",
    defaultLabel: "Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "primary",
    format: formatMbitAsBytes
  },
  sector_size: {
    key: "sector_size",
    valueKind: "number",
    defaultLabel: "Sector Size",
    defaultUnit: "byte",
    units: ["byte"],
    importance: "detail",
    format: formatBytes
  },
  die_density: {
    key: "die_density",
    valueKind: "number",
    defaultLabel: "Die Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "secondary",
    format: formatMbitAsBytes
  },
  die_codename: {
    key: "die_codename",
    valueKind: "string",
    defaultLabel: "Process",
    importance: "primary"
  },
  process_alias: {
    key: "process_alias",
    valueKind: "string",
    defaultLabel: "Process Alias",
    importance: "secondary"
  },
  component_density: {
    key: "component_density",
    valueKind: "number",
    defaultLabel: "Component Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "secondary",
    format: formatMbitAsBytes
  },
  component_density_options: {
    key: "component_density_options",
    valueKind: "number_list",
    defaultLabel: "Component Density Options",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "detail",
    format: formatDensityOptions
  },
  storage_density: {
    key: "storage_density",
    valueKind: "number",
    defaultLabel: "Storage Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "primary",
    format: formatMbitAsBytes
  },
  dram_density: {
    key: "dram_density",
    valueKind: "number",
    defaultLabel: "DRAM Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "primary",
    format: formatMbit
  },
  dram_configuration: {
    key: "dram_configuration",
    valueKind: "string",
    defaultLabel: "DRAM Configuration",
    importance: "detail"
  },
  cell_level: {
    key: "cell_level",
    valueKind: "string",
    defaultLabel: "Cell Level",
    importance: "primary"
  },
  process_node: {
    key: "process_node",
    valueKind: "string",
    defaultLabel: "Process Node",
    importance: "secondary"
  },
  layer_count: {
    key: "layer_count",
    valueKind: "number",
    defaultLabel: "Layer Count",
    importance: "secondary"
  },
  device_width: {
    key: "device_width",
    valueKind: "number",
    defaultLabel: "Device Width",
    defaultUnit: "bit",
    units: ["bit"],
    importance: "secondary",
    format: formatBitWidth
  },
  voltage: {
    key: "voltage",
    valueKind: "string",
    defaultLabel: "Voltage",
    importance: "secondary"
  },
  package: {
    key: "package",
    valueKind: "string",
    defaultLabel: "Package",
    importance: "secondary"
  },
  form_factor: {
    key: "form_factor",
    valueKind: "string",
    defaultLabel: "Form Factor",
    importance: "secondary"
  },
  packing_type: {
    key: "packing_type",
    valueKind: "string",
    defaultLabel: "Packing Type",
    importance: "detail"
  },
  assembly: {
    key: "assembly",
    valueKind: "string",
    defaultLabel: "Assembly",
    importance: "detail"
  },
  segment: {
    key: "segment",
    valueKind: "string",
    defaultLabel: "Segment",
    importance: "detail"
  },
  lead_free: {
    key: "lead_free",
    valueKind: "boolean",
    defaultLabel: "Lead free",
    importance: "detail"
  },
  halogen_free: {
    key: "halogen_free",
    valueKind: "boolean",
    defaultLabel: "Halogen free",
    importance: "detail"
  },
  wafer: {
    key: "wafer",
    valueKind: "boolean",
    defaultLabel: "Wafer",
    importance: "detail"
  },
  bad_block: {
    key: "bad_block",
    valueKind: "string",
    defaultLabel: "Bad block",
    importance: "detail"
  },
  sku: {
    key: "sku",
    valueKind: "string",
    defaultLabel: "SKU",
    importance: "detail"
  },
  multi_chip: {
    key: "multi_chip",
    valueKind: "boolean",
    defaultLabel: "Multi chip",
    importance: "detail"
  },
  cu: {
    key: "cu",
    valueKind: "boolean",
    defaultLabel: "CU",
    importance: "detail"
  },
  storage_interface: {
    key: "storage_interface",
    valueKind: "string",
    defaultLabel: "Storage Interface",
    importance: "primary"
  },
  generation_info: {
    key: "generation_info",
    valueKind: "string",
    defaultLabel: "Generation",
    importance: "secondary"
  },
  die_stack: {
    key: "die_stack",
    valueKind: "number",
    defaultLabel: "Die Stack",
    importance: "secondary"
  },
  dram_type: {
    key: "dram_type",
    valueKind: "string",
    defaultLabel: "DRAM Type",
    importance: "primary"
  },
  dram_speed: {
    key: "dram_speed",
    valueKind: "string",
    defaultLabel: "DRAM Speed",
    importance: "secondary"
  },
  cas_latency: {
    key: "cas_latency",
    valueKind: "number",
    defaultLabel: "CAS Latency",
    importance: "secondary"
  },
  read_latency: {
    key: "read_latency",
    valueKind: "number",
    defaultLabel: "Read Latency",
    importance: "secondary"
  },
  dram_width: {
    key: "dram_width",
    valueKind: "number",
    defaultLabel: "DRAM Width",
    defaultUnit: "bit",
    units: ["bit"],
    importance: "secondary",
    format: formatBitWidth
  },
  dram_voltage: {
    key: "dram_voltage",
    valueKind: "string",
    defaultLabel: "DRAM Voltage",
    importance: "secondary"
  },
  page_size: {
    key: "page_size",
    valueKind: "number",
    defaultLabel: "Page Size",
    defaultUnit: "byte",
    units: ["byte"],
    importance: "secondary",
    format: formatBytes
  },
  block_size: {
    key: "block_size",
    valueKind: "number",
    defaultLabel: "Block Size",
    defaultUnit: "byte",
    units: ["byte"],
    importance: "secondary",
    format: formatBytes
  },
  blocks_per_lun: {
    key: "blocks_per_lun",
    valueKind: "string",
    defaultLabel: "Blocks per LUN",
    importance: "detail"
  },
  pages_per_block: {
    key: "pages_per_block",
    valueKind: "string",
    defaultLabel: "Pages Per Block",
    importance: "detail"
  },
  simultaneously_programmed_pages: {
    key: "simultaneously_programmed_pages",
    valueKind: "number",
    defaultLabel: "Simultaneously Programmed Pages",
    importance: "detail"
  },
  redundant_area_size: {
    key: "redundant_area_size",
    valueKind: "string",
    defaultLabel: "Redundant Area Size",
    importance: "detail"
  },
  half_page_and_size: {
    key: "half_page_and_size",
    valueKind: "boolean",
    defaultLabel: "Half page and size",
    importance: "detail"
  },
  die_count: {
    key: "die_count",
    valueKind: "number",
    defaultLabel: "Die Count",
    importance: "secondary"
  },
  ce_count: {
    key: "ce_count",
    valueKind: "number",
    defaultLabel: "CE Count",
    importance: "secondary"
  },
  cs_count: {
    key: "cs_count",
    valueKind: "number",
    defaultLabel: "CS Count",
    importance: "secondary"
  },
  rb_count: {
    key: "rb_count",
    valueKind: "number",
    defaultLabel: "R/B Count",
    importance: "secondary"
  },
  bank_count: {
    key: "bank_count",
    valueKind: "number",
    defaultLabel: "Bank Count",
    importance: "secondary"
  },
  channel_count: {
    key: "channel_count",
    valueKind: "number",
    defaultLabel: "Channel Count",
    importance: "secondary"
  },
  plane_count: {
    key: "plane_count",
    valueKind: "number",
    defaultLabel: "Plane Count",
    importance: "secondary"
  },
  controller: {
    key: "controller",
    valueKind: "string_list",
    defaultLabel: "Controller",
    importance: "secondary"
  },
  controller_code: {
    key: "controller_code",
    valueKind: "string",
    defaultLabel: "Controller Code",
    importance: "detail"
  },
  controller_revision: {
    key: "controller_revision",
    valueKind: "string",
    defaultLabel: "Controller Revision",
    importance: "detail"
  },
  config_code: {
    key: "config_code",
    valueKind: "string",
    defaultLabel: "Config Code",
    importance: "detail"
  },
  package_code: {
    key: "package_code",
    valueKind: "string",
    defaultLabel: "Package Code",
    importance: "detail"
  },
  solder_type: {
    key: "solder_type",
    valueKind: "string",
    defaultLabel: "Solder Type",
    importance: "detail"
  },
  package_configuration: {
    key: "package_configuration",
    valueKind: "string",
    defaultLabel: "Package Configuration",
    importance: "detail"
  },
  die_revision: {
    key: "die_revision",
    valueKind: "string",
    defaultLabel: "Die Revision",
    importance: "detail"
  },
  product_family: {
    key: "product_family",
    valueKind: "string",
    defaultLabel: "Product Family",
    importance: "secondary"
  },
  product_version: {
    key: "product_version",
    valueKind: "string",
    defaultLabel: "Product Version",
    importance: "secondary"
  },
  product_mode: {
    key: "product_mode",
    valueKind: "string",
    defaultLabel: "Product Mode",
    importance: "secondary"
  },
  product_class: {
    key: "product_class",
    valueKind: "string",
    defaultLabel: "Product Class",
    importance: "secondary"
  },
  product_generation: {
    key: "product_generation",
    valueKind: "string",
    defaultLabel: "Product Generation",
    importance: "secondary"
  },
  managed_family: {
    key: "managed_family",
    valueKind: "string",
    defaultLabel: "Managed Family",
    importance: "secondary"
  },
  nand_technology: {
    key: "nand_technology",
    valueKind: "string",
    defaultLabel: "NAND Technology",
    importance: "secondary"
  },
  series_info: {
    key: "series_info",
    valueKind: "string",
    defaultLabel: "Series",
    importance: "detail"
  },
  speed_grade: {
    key: "speed_grade",
    valueKind: "string",
    defaultLabel: "Speed Grade",
    importance: "secondary"
  },
  timing_mode_async: {
    key: "timing_mode_async",
    valueKind: "string",
    defaultLabel: "Async Timing Mode",
    importance: "detail"
  },
  edo: {
    key: "edo",
    valueKind: "boolean",
    defaultLabel: "EDO",
    importance: "detail"
  },
  interleave: {
    key: "interleave",
    valueKind: "boolean",
    defaultLabel: "Interleave",
    importance: "detail"
  },
  cache: {
    key: "cache",
    valueKind: "boolean",
    defaultLabel: "Cache",
    importance: "detail"
  },
  component_width: {
    key: "component_width",
    valueKind: "number",
    defaultLabel: "Component Width",
    defaultUnit: "bit",
    units: ["bit"],
    importance: "detail",
    format: formatBitWidth
  },
  nand_component: {
    key: "nand_component",
    valueKind: "string",
    defaultLabel: "NAND Component",
    importance: "detail"
  },
  component_voltage: {
    key: "component_voltage",
    valueKind: "string",
    defaultLabel: "Component Voltage",
    importance: "detail"
  },
  dram_die_density: {
    key: "dram_die_density",
    valueKind: "number",
    defaultLabel: "DRAM Die Density",
    defaultUnit: "Mbit",
    units: ["Mbit"],
    importance: "secondary",
    format: formatMbit
  },
  dram_die_count: {
    key: "dram_die_count",
    valueKind: "number",
    defaultLabel: "DRAM Die Count",
    importance: "secondary"
  },
  dram_generation: {
    key: "dram_generation",
    valueKind: "string",
    defaultLabel: "DRAM Generation",
    importance: "secondary"
  },
  die_code: {
    key: "die_code",
    valueKind: "string",
    defaultLabel: "Die Code",
    importance: "detail"
  },
  interface_type: {
    key: "interface_type",
    valueKind: "string",
    defaultLabel: "Interface Type",
    importance: "secondary"
  },
  nand_interface: {
    key: "nand_interface",
    valueKind: "object",
    defaultLabel: "NAND Interface",
    format: formatNandInterface,
    importance: "secondary"
  },
  interface_note: {
    key: "interface_note",
    valueKind: "string",
    defaultLabel: "Interface Note",
    importance: "detail"
  },
  toggle: {
    key: "toggle",
    valueKind: "string",
    defaultLabel: "Toggle DDR",
    importance: "detail"
  },
  ecc_level: {
    key: "ecc_level",
    valueKind: "string",
    defaultLabel: "ECC Level",
    importance: "detail"
  },
  ecc_enabled: {
    key: "ecc_enabled",
    valueKind: "boolean",
    defaultLabel: "ECC enabled",
    importance: "detail"
  },
  marking_year_digit: {
    key: "marking_year_digit",
    valueKind: "string",
    defaultLabel: "Year code",
    importance: "detail"
  },
  marking_week: {
    key: "marking_week",
    valueKind: "number",
    defaultLabel: "Week",
    importance: "detail",
    format: (value: FdnextFieldValueData) => typeof value === "number" ? String(value).padStart(2, "0") : undefined
  },
  marking_die_revision: {
    key: "marking_die_revision",
    valueKind: "string",
    defaultLabel: "Die revision",
    importance: "detail"
  },
  diffusion_loc: {
    key: "diffusion_loc",
    valueKind: "string",
    defaultLabel: "Wafer origin",
    importance: "detail"
  },
  encapsulation_loc: {
    key: "encapsulation_loc",
    valueKind: "string",
    defaultLabel: "Package origin",
    importance: "detail"
  },
  prod_status: {
    key: "prod_status",
    valueKind: "string",
    defaultLabel: "Production Status",
    importance: "detail"
  },
  feature_code: {
    key: "feature_code",
    valueKind: "string",
    defaultLabel: "Feature Code",
    importance: "detail"
  },
  special_option: {
    key: "special_option",
    valueKind: "string",
    defaultLabel: "Special Option",
    importance: "detail"
  },
  enterprise: {
    key: "enterprise",
    valueKind: "boolean",
    defaultLabel: "Enterprise",
    importance: "detail"
  },
  revision: {
    key: "revision",
    valueKind: "number",
    defaultLabel: "Revision",
    importance: "detail"
  },
  package_functionality_partial_type: {
    key: "package_functionality_partial_type",
    valueKind: "string",
    defaultLabel: "Package functionality partial type",
    importance: "detail"
  },
  density_grade: {
    key: "density_grade",
    valueKind: "string",
    defaultLabel: "Density grade",
    importance: "detail"
  },
  operation_temperature: {
    key: "operation_temperature",
    valueKind: "string",
    defaultLabel: "Operation Temperature",
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
  const numeric = typeof value === "number" ||
    (definition.valueKind === "number_list" && Array.isArray(value) && value.every((item) => typeof item === "number"));
  const unit = options.unit ?? (numeric ? definition.defaultUnit : undefined);
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
