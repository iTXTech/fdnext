import type { FdnextBlockId, FdnextChipKind, FdnextFieldImportance, FdnextIdScheme } from "./result";
import type { FdnextFieldKey } from "./field-registry";

export interface FdnextFieldProfileBlock {
  id: FdnextBlockId;
  label: string;
  importance: FdnextFieldImportance;
  fields: readonly FdnextFieldKey[];
}

export interface FdnextFieldProfile {
  id: FdnextChipKind | FdnextIdScheme;
  blocks: readonly FdnextFieldProfileBlock[];
}

// Device identity is carried by result.device; only the original manufacturer is a detail field.
const identityBlock = {
  id: "identity", label: "Identity", importance: "primary", fields: ["original_vendor"]
} as const satisfies FdnextFieldProfileBlock;

const nandGeometryFields = [
  "die_density", "die_stack", "die_count", "ce_count", "rb_count", "channel_count", "plane_count",
  "page_size", "block_size", "pages_per_block", "blocks_per_lun", "redundant_area_size",
  "simultaneously_programmed_pages", "half_page_and_size"
] as const satisfies readonly FdnextFieldKey[];

const packageBlock = {
  id: "package",
  label: "Package",
  importance: "detail",
  fields: [
    "package", "form_factor", "package_configuration", "packing_type", "solder_type",
    "operation_temperature", "product_class", "prod_status", "enterprise", "assembly", "segment",
    "lead_free", "halogen_free", "wafer", "bad_block", "sku", "multi_chip", "cu",
    "package_functionality_partial_type", "revision", "special_option"
  ]
} as const satisfies FdnextFieldProfileBlock;

const markingBlock = {
  id: "marking", label: "Marking details", importance: "detail",
  fields: ["marking_year_digit", "marking_week", "marking_die_revision", "diffusion_loc", "encapsulation_loc"]
} as const satisfies FdnextFieldProfileBlock;

const controllersBlock = {
  id: "controllers", label: "Controllers", importance: "detail", fields: ["controller", "controller_revision"]
} as const satisfies FdnextFieldProfileBlock;

// Profiles own placement and ordering. Fields not assigned here remain in additional.
export const fdnextFieldProfiles = {
  raw_nand: {
    id: "raw_nand",
    blocks: [
      identityBlock,
      {
        id: "storage", label: "Storage", importance: "primary",
        fields: [
          "density", "cell_level", "die_codename", "process_alias", "layer_count", "generation_info",
          "series_info", "nand_technology", "product_family", "product_version", "product_generation",
          "product_mode", "managed_family", "density_grade"
        ]
      },
      { id: "geometry", label: "Geometry", importance: "secondary", fields: nandGeometryFields },
      {
        id: "interface", label: "Interface", importance: "secondary",
        fields: [
          "device_width", "voltage", "storage_interface", "interface_type", "nand_interface",
          "speed_grade", "interface_note", "toggle", "ecc_level", "ecc_enabled"
        ]
      },
      packageBlock,
      markingBlock,
      controllersBlock
    ]
  },
  managed_nand: {
    id: "managed_nand",
    blocks: [
      identityBlock,
      {
        id: "storage", label: "Storage", importance: "primary",
        fields: [
          "storage_density", "density", "storage_interface", "sector_size", "cell_level", "nand_technology",
          "die_codename", "process_alias", "generation_info", "layer_count", "product_generation",
          "product_version", "product_family", "product_mode", "managed_family", "series_info", "density_grade"
        ]
      },
      {
        id: "components", label: "Components", importance: "secondary",
        fields: [
          "component_density", "component_density_options", "component_width", "component_voltage", "nand_component", "process_node",
          ...nandGeometryFields, "nand_interface"
        ]
      },
      {
        id: "dram", label: "DRAM", importance: "secondary",
        fields: [
          "dram_density", "dram_configuration", "dram_type", "dram_width", "dram_die_density",
          "dram_die_count", "cs_count", "bank_count", "dram_voltage", "dram_speed", "cas_latency", "read_latency", "dram_generation"
        ]
      },
      {
        id: "interface", label: "Interface", importance: "secondary",
        fields: ["device_width", "voltage", "interface_type", "speed_grade", "interface_note", "ecc_level", "ecc_enabled"]
      },
      { ...packageBlock, fields: [...packageBlock.fields, "die_revision"] },
      markingBlock,
      controllersBlock
    ]
  },
  "3d_xpoint": {
    id: "3d_xpoint",
    blocks: [
      identityBlock,
      {
        id: "storage", label: "Storage", importance: "primary",
        fields: ["density", "die_stack", "die_codename", "layer_count", "generation_info", "series_info"]
      },
      {
        id: "geometry", label: "Geometry", importance: "secondary",
        fields: ["die_density", "die_count", "ce_count", "rb_count", "channel_count"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["voltage", "storage_interface", "interface_type", "speed_grade"] },
      packageBlock,
      markingBlock,
      controllersBlock
    ]
  },
  dram: {
    id: "dram",
    blocks: [
      identityBlock,
      {
        id: "dram", label: "DRAM", importance: "primary",
        fields: [
          "dram_type", "dram_density", "dram_configuration", "dram_width", "dram_voltage", "dram_speed",
          "dram_generation", "process_node", "die_revision", "series_info"
        ]
      },
      {
        id: "geometry", label: "Geometry", importance: "secondary",
        fields: ["dram_die_density", "dram_die_count", "cs_count", "bank_count", "channel_count"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["interface_type", "interface_note", "ecc_enabled", "ecc_level"] },
      { id: "timing", label: "Timing", importance: "secondary", fields: ["cas_latency", "read_latency", "speed_grade"] },
      packageBlock,
      markingBlock
    ]
  },
  "nand.flash_id": {
    id: "nand.flash_id",
    blocks: [
      identityBlock,
      {
        id: "geometry", label: "Geometry", importance: "primary",
        fields: ["density", "cell_level", "die_codename", "process_alias", "layer_count", "generation_info", ...nandGeometryFields]
      },
      {
        id: "interface", label: "Interface", importance: "secondary",
        fields: ["device_width", "voltage", "interface_type", "nand_interface", "speed_grade", "ecc_level", "ecc_enabled"]
      },
      { id: "timing", label: "Timing", importance: "detail", fields: ["timing_mode_async", "edo", "interleave", "cache", "revision"] },
      controllersBlock
    ]
  },
  nor: {
    id: "nor",
    blocks: [
      identityBlock,
      { id: "storage", label: "Storage", importance: "primary", fields: ["density", "device_width", "voltage"] },
      packageBlock,
      markingBlock
    ]
  },
  pmic: {
    id: "pmic",
    blocks: [identityBlock, packageBlock, markingBlock]
  },
  controller: {
    id: "controller",
    blocks: [identityBlock, { ...controllersBlock, importance: "primary" }, packageBlock, markingBlock]
  },
  unknown: {
    id: "unknown",
    blocks: [identityBlock]
  }
} as const satisfies Record<FdnextChipKind | FdnextIdScheme, FdnextFieldProfile>;

export function getFdnextFieldProfile(id: FdnextChipKind | FdnextIdScheme): FdnextFieldProfile {
  return fdnextFieldProfiles[id] ?? fdnextFieldProfiles.unknown;
}
