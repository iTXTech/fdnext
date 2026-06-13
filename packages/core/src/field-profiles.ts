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

const identityFields = ["vendor", "original_vendor", "chip_kind", "product_type", "part_number", "identifier", "id_scheme"] as const;

export const fdnextFieldProfiles = {
  raw_nand: {
    id: "raw_nand",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "storage",
        label: "Storage",
        importance: "primary",
        fields: ["density", "cell_level", "die_codename", "process_alias", "layer_count", "generation_info", "series_info"]
      },
      {
        id: "geometry",
        label: "Geometry",
        importance: "secondary",
        fields: ["die_density", "die_stack", "die_count", "ce_count", "rb_count", "channel_count", "plane_count", "plane", "page_size", "block_size", "half_page_and_size"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["device_width", "voltage", "storage_interface", "interface_type", "toggle", "ecc_level"] },
      {
        id: "package",
        label: "Package",
        importance: "detail",
        fields: ["package", "package_code", "product_class", "assembly", "segment", "lead_free", "halogen_free", "wafer", "bad_block", "sku", "multi_chip", "cu", "operation_temperature", "special_option"]
      },
      { id: "controllers", label: "Controllers", importance: "detail", fields: ["controller"] }
    ]
  },
  managed_nand: {
    id: "managed_nand",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "storage",
        label: "Storage",
        importance: "primary",
        fields: ["storage_density", "density", "storage_interface", "sector_size", "cell_level", "die_codename", "process_alias", "generation_info", "layer_count", "product_generation", "series_info"]
      },
      {
        id: "components",
        label: "Components",
        importance: "secondary",
        fields: ["component_density", "component_width", "component_voltage", "nand_component", "dram_density", "dram_configuration", "dram_type", "dram_width"]
      },
      {
        id: "interface",
        label: "Interface",
        importance: "secondary",
        fields: ["storage_interface", "device_width", "voltage"]
      },
      {
        id: "package",
        label: "Package",
        importance: "detail",
        fields: ["package", "package_code", "product_class", "assembly", "segment", "lead_free", "halogen_free", "wafer", "bad_block", "sku", "multi_chip", "cu", "operation_temperature", "special_option"]
      },
      { id: "controllers", label: "Controllers", importance: "detail", fields: ["controller", "controller_code", "controller_revision"] }
    ]
  },
  "3d_xpoint": {
    id: "3d_xpoint",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "storage",
        label: "Storage",
        importance: "primary",
        fields: ["density", "die_stack", "die_codename", "generation_info", "series_info"]
      },
      {
        id: "geometry",
        label: "Geometry",
        importance: "secondary",
        fields: ["die_count", "ce_count", "rb_count", "channel_count"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["voltage", "storage_interface", "interface_type"] },
      {
        id: "package",
        label: "Package",
        importance: "detail",
        fields: ["package", "lead_free", "wafer", "sku", "special_option"]
      }
    ]
  },
  dram: {
    id: "dram",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "dram",
        label: "DRAM",
        importance: "primary",
        fields: ["dram_type", "dram_density", "dram_configuration", "density", "dram_die_density", "dram_width", "device_width", "dram_voltage", "voltage", "dram_speed", "dram_generation"]
      },
      { id: "geometry", label: "Geometry", importance: "secondary", fields: ["dram_die_stack", "die_stack", "die_count", "cs_count", "process_node", "config_code"] },
      { id: "package", label: "Package", importance: "detail", fields: ["package", "package_code", "operation_temperature", "die_revision"] },
      { id: "marking", label: "Marking", importance: "detail", fields: ["marking_code"] }
    ]
  },
  "nand.flash_id": {
    id: "nand.flash_id",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "geometry",
        label: "Geometry",
        importance: "primary",
        fields: ["density", "cell_level", "die_codename", "process_alias", "die_count", "layer_count", "plane_count", "page_size", "block_size", "pages_per_block", "blocks_per_lun", "redundant_area_size", "simultaneously_programmed_pages"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["voltage", "interface_type", "ecc_level"] },
      { id: "timing", label: "Timing", importance: "detail", fields: ["timing_mode_async", "edo", "interleave", "cache", "revision"] },
      { id: "controllers", label: "Controllers", importance: "detail", fields: ["controller"] }
    ]
  },
  nor: {
    id: "nor",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      { id: "storage", label: "Storage", importance: "primary", fields: ["density", "device_width", "voltage"] },
      { id: "package", label: "Package", importance: "detail", fields: ["package", "package_code", "operation_temperature"] }
    ]
  },
  pmic: {
    id: "pmic",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      { id: "package", label: "Package", importance: "detail", fields: ["package", "package_code", "operation_temperature"] }
    ]
  },
  controller: {
    id: "controller",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      { id: "controllers", label: "Controllers", importance: "primary", fields: ["controller", "controller_code", "controller_revision"] }
    ]
  },
  unknown: {
    id: "unknown",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields }
    ]
  }
} as const satisfies Record<FdnextChipKind | FdnextIdScheme, FdnextFieldProfile>;

export function getFdnextFieldProfile(id: FdnextChipKind | FdnextIdScheme): FdnextFieldProfile {
  return fdnextFieldProfiles[id] ?? fdnextFieldProfiles.unknown;
}
