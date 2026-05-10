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

const identityFields = ["vendor", "chip_kind", "product_type", "part_number", "identifier", "id_scheme"] as const;

export const fdnextFieldProfiles = {
  raw_nand: {
    id: "raw_nand",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "storage",
        label: "Storage",
        importance: "primary",
        fields: ["density", "cell_level", "generation_info", "process_node"]
      },
      { id: "geometry", label: "Geometry", importance: "secondary", fields: ["die_density", "die_stack", "die_count", "plane_count"] },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["device_width", "voltage", "storage_interface"] },
      { id: "package", label: "Package", importance: "detail", fields: ["package", "package_code", "operation_temperature"] },
      { id: "controllers", label: "Controllers", importance: "detail", fields: ["controller"] }
    ]
  },
  on_die_ecc_nand: {
    id: "on_die_ecc_nand",
    blocks: [
      { id: "identity", label: "Identity", importance: "primary", fields: identityFields },
      {
        id: "storage",
        label: "Storage",
        importance: "primary",
        fields: ["density", "cell_level", "generation_info", "process_node"]
      },
      { id: "geometry", label: "Geometry", importance: "secondary", fields: ["die_density", "die_stack", "die_count"] },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["device_width", "voltage", "storage_interface"] },
      { id: "package", label: "Package", importance: "detail", fields: ["package", "package_code", "operation_temperature"] }
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
        fields: ["storage_density", "density", "storage_interface", "cell_level", "process_node", "generation_info", "product_generation"]
      },
      {
        id: "components",
        label: "Components",
        importance: "secondary",
        fields: ["component_density", "component_width", "nand_component", "dram_density", "dram_type", "dram_width"]
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
        fields: ["package", "package_code", "product_class", "operation_temperature", "special_option"]
      },
      { id: "controllers", label: "Controllers", importance: "detail", fields: ["controller", "controller_code", "controller_revision"] }
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
        fields: ["dram_type", "dram_density", "density", "dram_width", "device_width", "dram_voltage", "voltage", "dram_speed"]
      },
      { id: "geometry", label: "Geometry", importance: "secondary", fields: ["dram_die_stack", "die_stack", "die_count", "config_code"] },
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
        fields: ["density", "cell_level", "die_count", "plane_count", "page_size", "block_size", "blocks_per_lun", "process_node"]
      },
      { id: "interface", label: "Interface", importance: "secondary", fields: ["voltage", "interface_type"] },
      { id: "timing", label: "Timing", importance: "detail", fields: ["timing_mode_async", "edo"] },
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
