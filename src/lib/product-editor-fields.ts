export type ProductEditorField = {
  path: string;
  label: string;
  kind: "text" | "list" | "number";
  help?: string;
};

export type ProductEditorGroup = {
  title: string;
  description: string;
  fields: ProductEditorField[];
};

export const PRODUCT_EDITOR_GROUPS_BY_CATEGORY: Record<string, ProductEditorGroup[]> = {
  processor: [
    {
      title: "CPU compatibility and specs",
      description: "Only CPU fields needed for catalog identity and future PC Builder compatibility.",
      fields: [
        { path: "compat.processor_sockets", label: "CPU socket", kind: "list", help: "Example: AM4, AM5, LGA1700" },
        { path: "compat.memory_technology", label: "Memory technology", kind: "list", help: "Example: DDR4, DDR5" },
        { path: "specs.cpu_core_count", label: "CPU cores", kind: "number" },
        { path: "specs.cpu_thread_count", label: "CPU threads", kind: "number" },
        { path: "specs.cpu_base_clock", label: "CPU base clock", kind: "text" },
        { path: "specs.cpu_boost_clock", label: "CPU boost clock", kind: "text" },
        { path: "specs.tdp", label: "TDP", kind: "number" },
        { path: "specs.integrated_graphics", label: "Integrated graphics", kind: "text" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  motherboard: [
    {
      title: "Motherboard compatibility and specs",
      description: "Socket, RAM, chipset, and board layout fields.",
      fields: [
        { path: "compat.processor_sockets", label: "CPU socket", kind: "list", help: "Example: AM4, AM5, LGA1700" },
        { path: "compat.memory_technology", label: "Memory technology", kind: "list", help: "Example: DDR4, DDR5" },
        { path: "specs.socket_chipset", label: "Motherboard chipset", kind: "list", help: "Example: B550, B650, X870" },
        { path: "specs.motherboard_form_factor", label: "Motherboard form factor", kind: "list", help: "Example: ATX, mATX, ITX" },
        { path: "compat.motherboard_form_factor", label: "Compatible board form factor", kind: "list", help: "Example: ATX, mATX, ITX" },
        { path: "specs.ram_slots", label: "RAM slots", kind: "number" },
        { path: "specs.motherboard_wifi", label: "Wi-Fi", kind: "text" },
        { path: "specs.m_2_slots", label: "M.2 slots", kind: "number" },
        { path: "specs.pcie_x16_slots", label: "PCIe x16 slots", kind: "number" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  memory: [
    {
      title: "RAM specs",
      description: "Capacity, speed, and module fields used by compatibility checks.",
      fields: [
        { path: "compat.memory_technology", label: "Memory technology", kind: "list", help: "Example: DDR4, DDR5" },
        { path: "specs.ram_capacity", label: "Capacity", kind: "number" },
        { path: "specs.ram_module_capacity", label: "Module capacity", kind: "number" },
        { path: "specs.ram_module_count", label: "Module count", kind: "number" },
        { path: "specs.ram_speed", label: "Speed", kind: "number" },
        { path: "specs.ram_cas_latency", label: "CAS latency", kind: "number" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  gpu: [
    {
      title: "GPU specs",
      description: "GPU chipset, memory, clearance, and power requirement fields.",
      fields: [
        { path: "specs.gpu_chipset", label: "GPU chipset", kind: "list", help: "Example: RTX 4060, RX 7600" },
        { path: "specs.gpu_board_partner", label: "Board partner", kind: "text" },
        { path: "specs.gpu_vram", label: "VRAM", kind: "number" },
        { path: "specs.gpu_memory_type", label: "Memory type", kind: "list", help: "Example: GDDR6, GDDR7" },
        { path: "specs.gpu_core_clock", label: "Core clock", kind: "number" },
        { path: "specs.gpu_boost_clock", label: "Boost clock", kind: "number" },
        { path: "specs.gpu_power_connectors", label: "Power connectors", kind: "text" },
        { path: "compat.minimum_psu_watts", label: "Minimum PSU watts", kind: "number" },
        { path: "specs.gpu_length", label: "Length", kind: "number" },
        { path: "specs.gpu_width", label: "Width", kind: "number" },
        { path: "specs.gpu_height", label: "Height", kind: "number" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  ssd: [
    {
      title: "SSD specs",
      description: "Storage interface, form factor, and speed fields.",
      fields: [
        { path: "specs.ssd_device_interface", label: "SSD interface", kind: "list", help: "Example: M.2, SATA" },
        { path: "specs.m_2_form_factor", label: "M.2 form factor", kind: "text" },
        { path: "specs.pcie_generation", label: "PCIe generation", kind: "text" },
        { path: "specs.read_mbps", label: "Read MB/s", kind: "number" },
        { path: "specs.write_mbps", label: "Write MB/s", kind: "number" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  cpucooler: [
    {
      title: "CPU cooler specs",
      description: "Cooler type, height, and radiator fields.",
      fields: [
        { path: "specs.cpu_cooler_type", label: "Cooler type", kind: "text", help: "Air or AIO" },
        { path: "specs.cooler_height", label: "Cooler height", kind: "number" },
        { path: "compat.cooler_height_mm", label: "Cooler height clearance", kind: "number" },
        { path: "specs.cooler_radiator_size", label: "Radiator size", kind: "number" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  powersupply: [
    {
      title: "Power supply specs",
      description: "Wattage, certification, and modularity fields.",
      fields: [
        { path: "specs.psu_watts", label: "Watts", kind: "number" },
        { path: "compat.psu_watts", label: "Compatible PSU watts", kind: "number" },
        { path: "specs.psu_certification", label: "Certification", kind: "text" },
        { path: "specs.psu_tier", label: "PSU tier", kind: "list" },
        { path: "specs.psu_modularity", label: "Modularity", kind: "text" },
        { path: "specs.pcie_generation", label: "PCIe generation", kind: "text" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  case: [
    {
      title: "Case compatibility and specs",
      description: "Motherboard support, GPU clearance, and cooler support fields.",
      fields: [
        { path: "compat.supported_motherboard", label: "Supported motherboards", kind: "list", help: "Example: ATX, mATX, ITX" },
        { path: "specs.supported_motherboard", label: "Supported motherboard text", kind: "list" },
        { path: "specs.gpu_support", label: "GPU support", kind: "number" },
        { path: "compat.gpu_clearance_mm", label: "GPU clearance", kind: "number" },
        { path: "specs.cooler_height", label: "Air cooler support", kind: "number" },
        { path: "specs.cooler_radiator_size", label: "AIO cooler support", kind: "number" },
        { path: "specs.case_fans_rgb", label: "Case fans RGB", kind: "text" },
        { path: "specs.material", label: "Material", kind: "list" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  casefans: [
    {
      title: "Case fan specs",
      description: "Fan color and RGB fields.",
      fields: [
        { path: "specs.case_fans_rgb", label: "RGB", kind: "text" },
        { path: "specs.color", label: "Color", kind: "list" },
        { path: "specs.part_number", label: "Part number", kind: "text" }
      ]
    }
  ],
  other: [
    {
      title: "Misc specs",
      description: "General details for non-builder products.",
      fields: [
        { path: "specs.part_number", label: "Part number", kind: "text" },
        { path: "specs.color", label: "Color", kind: "list" }
      ]
    }
  ]
};

export function getProductEditorGroupsForCategory(category: string): ProductEditorGroup[] {
  return PRODUCT_EDITOR_GROUPS_BY_CATEGORY[category] || PRODUCT_EDITOR_GROUPS_BY_CATEGORY.other;
}

export const PRODUCT_EDITOR_GROUPS: ProductEditorGroup[] = Object.values(PRODUCT_EDITOR_GROUPS_BY_CATEGORY).flat();

export const PRODUCT_EDITOR_FIELDS = Array.from(
  new Map(PRODUCT_EDITOR_GROUPS.flatMap((group) => group.fields).map((field) => [field.path, field])).values()
);
