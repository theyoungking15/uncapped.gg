import { normalizeCategory, type CategoryKey } from "@/lib/categories";
import type { Product, ProductDataBag, ProductDataValue } from "@/lib/types";

type FieldDefinition = {
  label: string;
  path: string;
  unit?: string;
};

const CATEGORY_ALIASES: Record<string, CategoryKey> = {
  cpu: "processor",
  processor: "processor",
  motherboard: "motherboard",
  motherboards: "motherboard",
  ram: "memory",
  "memory (ram)": "memory",
  memory: "memory",
  "graphics card": "gpu",
  "graphics cards": "gpu",
  gpu: "gpu",
  "power supply": "powersupply",
  psu: "powersupply",
  case: "case",
  cases: "case",
  "cpu cooler": "cpucooler",
  ssd: "ssd",
  ssds: "ssd",
  "ssds / storage": "ssd",
  storage: "ssd",
  "case fans": "casefans"
};

const VALUE_LABELS: Record<string, string> = {
  "am-4": "AM4",
  "am-4-1": "AM4",
  am4: "AM4",
  "am-5": "AM5",
  am5: "AM5",
  ddr4: "DDR4",
  "ddr-4": "DDR4",
  ddr5: "DDR5",
  "ddr-5": "DDR5",
  atx: "ATX",
  matx: "mATX",
  "m-atx": "mATX",
  "micro-atx": "mATX",
  "micro atx": "mATX",
  itx: "ITX",
  "mini-itx": "ITX",
  "mini itx": "ITX",
  "m-2": "M.2",
  sata: "SATA",
  "sata-1": "SATA",
  pcie: "PCIe"
};

const HIGHLIGHT_FIELDS: Record<string, FieldDefinition[]> = {
  processor: [
    { label: "Socket", path: "compat.processor_sockets" },
    { label: "Memory", path: "compat.memory_technology" },
    { label: "Cores", path: "specs.cpu_core_count" },
    { label: "Threads", path: "specs.cpu_thread_count" },
    { label: "TDP", path: "specs.tdp" }
  ],
  motherboard: [
    { label: "Socket", path: "compat.processor_sockets" },
    { label: "Memory", path: "compat.memory_technology" },
    { label: "Chipset", path: "specs.socket_chipset" },
    { label: "Form factor", path: "specs.motherboard_form_factor" },
    { label: "RAM slots", path: "specs.ram_slots" }
  ],
  memory: [
    { label: "Memory", path: "compat.memory_technology" },
    { label: "Capacity", path: "specs.ram_capacity", unit: "GB" },
    { label: "Speed", path: "specs.ram_speed", unit: "MT/s" },
    { label: "CAS", path: "specs.ram_cas_latency" },
    { label: "Modules", path: "specs.ram_module_count" }
  ],
  gpu: [
    { label: "Chipset", path: "specs.gpu_chipset" },
    { label: "VRAM", path: "specs.gpu_vram" },
    { label: "Length", path: "specs.gpu_length", unit: "mm" },
    { label: "Minimum PSU", path: "compat.minimum_psu_watts", unit: "W" },
    { label: "Board partner", path: "specs.gpu_board_partner" }
  ],
  powersupply: [
    { label: "Watts", path: "compat.psu_watts", unit: "W" },
    { label: "Certification", path: "specs.psu_certification" },
    { label: "Modularity", path: "specs.psu_modularity" },
    { label: "Tier", path: "specs.psu_tier" }
  ],
  case: [
    { label: "Motherboard", path: "compat.supported_motherboard" },
    { label: "GPU clearance", path: "compat.gpu_clearance_mm", unit: "mm" },
    { label: "Material", path: "specs.material" }
  ],
  cpucooler: [
    { label: "Type", path: "specs.cpu_cooler_type" },
    { label: "Radiator", path: "specs.cooler_radiator_size" },
    { label: "Height", path: "compat.cooler_height_mm", unit: "mm" }
  ],
  ssd: [
    { label: "Interface", path: "specs.ssd_device_interface" },
    { label: "Read", path: "specs.read_mbps", unit: "MB/s" },
    { label: "Write", path: "specs.write_mbps", unit: "MB/s" },
    { label: "Form factor", path: "specs.m_2_form_factor" },
    { label: "PCIe", path: "specs.pcie_generation" }
  ],
  casefans: [
    { label: "RGB", path: "specs.case_fans_rgb" },
    { label: "Color", path: "specs.color" }
  ],
  other: [
    { label: "Color", path: "specs.color" },
    { label: "Part number", path: "specs.part_number" }
  ]
};

export function normalizeProductCategory(value: string): CategoryKey {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized];
  return normalizeCategory(value) || "other";
}

export function splitListValue(value: string): string[] {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeDisplayValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (VALUE_LABELS[key]) return VALUE_LABELS[key];
  if (/^[a-z0-9-]+$/.test(trimmed)) return titleCase(trimmed.replace(/-/g, " "));
  return trimmed;
}

export function normalizeListValue(value: string): string[] {
  const items = splitListValue(value).map(normalizeDisplayValue).filter(Boolean);
  return Array.from(new Set(items));
}

export function parseOptionalNumber(value: string): number | null {
  const matched = value.match(/\d+(\.\d+)?/);
  if (!matched) return null;
  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseOptionalBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1", "enabled"].includes(normalized)) return true;
  if (["false", "no", "0", "disabled"].includes(normalized)) return false;
  return null;
}

export function compactDataBag(input: ProductDataBag): ProductDataBag {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    })
  );
}

export function getProductHighlights(product: Product, limit = 4): Array<{ label: string; value: string }> {
  return getProductSpecRows(product).slice(0, limit);
}

export function getProductSpecRows(product: Product): Array<{ label: string; value: string }> {
  const fields = HIGHLIGHT_FIELDS[product.category] || HIGHLIGHT_FIELDS.other;
  return fields
    .map((field) => {
      const value = readProductValue(product, field.path);
      const formatted = formatProductDataValue(value, field.unit);
      return formatted ? { label: field.label, value: formatted } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
}

export function formatProductDataValue(value: ProductDataValue | undefined, unit?: string): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map((item) => formatProductDataValue(item)).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return unit ? `${value} ${unit}` : String(value);
  if (typeof value === "object") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!unit) return trimmed;
  if (new RegExp(`${unit}$`, "i").test(trimmed)) return trimmed;
  return `${trimmed} ${unit}`;
}

function readProductValue(product: Product, path: string): ProductDataValue | undefined {
  const [root, key] = path.split(".");
  if (root === "specs") return product.specs?.[key];
  if (root === "compat") return product.compat?.[key];
  return undefined;
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
