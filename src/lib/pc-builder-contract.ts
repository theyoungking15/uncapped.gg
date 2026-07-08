import { categoryLabel, type CategoryKey } from "@/lib/categories";
import type { Product, ProductDataValue } from "@/lib/types";

export const BUILDER_TAB_ORDER = [
  "processor",
  "motherboard",
  "memory",
  "gpu",
  "cpucooler",
  "ssd",
  "powersupply",
  "case",
  "casefans",
  "other"
] as const satisfies readonly CategoryKey[];

export type BuilderTab = (typeof BUILDER_TAB_ORDER)[number];

export const BUILDER_TAB_OPTIONS = BUILDER_TAB_ORDER.map((key) => ({
  key,
  label: categoryLabel(key)
}));

export type PriceListFacetKey =
  | "socket"
  | "memory_technology"
  | "motherboard_chipset"
  | "motherboard_form_factor"
  | "gpu_chipset"
  | "gpu_board_partner"
  | "ssd_interface"
  | "pcie_generation"
  | "psu_watts"
  | "psu_certification"
  | "cooler_type"
  | "cooler_radiator"
  | "supported_motherboard";

export type PriceListFacetDefinition = {
  key: PriceListFacetKey;
  label: string;
};

type RequiredBuilderField = {
  label: string;
  anyOf: string[];
};

const FACETS_BY_TAB: Record<BuilderTab, PriceListFacetDefinition[]> = {
  processor: [
    { key: "socket", label: "Socket" },
    { key: "memory_technology", label: "Memory" }
  ],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "memory_technology", label: "Memory" },
    { key: "motherboard_chipset", label: "Chipset" },
    { key: "motherboard_form_factor", label: "Form factor" }
  ],
  memory: [{ key: "memory_technology", label: "Memory" }],
  gpu: [
    { key: "gpu_chipset", label: "Chipset" },
    { key: "gpu_board_partner", label: "Board partner" }
  ],
  cpucooler: [
    { key: "cooler_type", label: "Cooler type" },
    { key: "cooler_radiator", label: "Radiator" }
  ],
  ssd: [
    { key: "ssd_interface", label: "Interface" },
    { key: "pcie_generation", label: "PCIe" }
  ],
  powersupply: [
    { key: "psu_watts", label: "Watts" },
    { key: "psu_certification", label: "Certification" }
  ],
  case: [{ key: "supported_motherboard", label: "Supported motherboard" }],
  casefans: [],
  other: []
};

const REQUIRED_FIELDS_BY_TAB: Record<BuilderTab, RequiredBuilderField[]> = {
  processor: [
    { label: "CPU socket", anyOf: ["compat.processor_sockets"] },
    { label: "Memory technology", anyOf: ["compat.memory_technology"] }
  ],
  motherboard: [
    { label: "CPU socket", anyOf: ["compat.processor_sockets"] },
    { label: "Memory technology", anyOf: ["compat.memory_technology"] },
    { label: "Chipset", anyOf: ["specs.socket_chipset"] },
    { label: "RAM slots", anyOf: ["specs.ram_slots"] },
    { label: "Form factor", anyOf: ["specs.motherboard_form_factor", "compat.motherboard_form_factor"] }
  ],
  memory: [
    { label: "Memory technology", anyOf: ["compat.memory_technology"] },
    { label: "Module capacity", anyOf: ["specs.ram_module_capacity", "specs.ram_capacity"] },
    { label: "Module count", anyOf: ["specs.ram_module_count"] },
    { label: "Speed", anyOf: ["specs.ram_speed"] }
  ],
  gpu: [
    { label: "GPU chipset", anyOf: ["specs.gpu_chipset"] },
    { label: "VRAM", anyOf: ["specs.gpu_vram"] },
    { label: "GPU length", anyOf: ["specs.gpu_length"] }
  ],
  cpucooler: [
    { label: "Cooler type", anyOf: ["specs.cpu_cooler_type", "specs.cpu_cooler_types"] },
    { label: "Cooler height or radiator", anyOf: ["specs.cooler_height", "compat.cooler_height_mm", "specs.cooler_radiator_size"] }
  ],
  ssd: [
    { label: "Interface", anyOf: ["specs.ssd_device_interface", "specs.m_2_form_factor"] },
    { label: "Read speed", anyOf: ["specs.read_mbps"] },
    { label: "Write speed", anyOf: ["specs.write_mbps"] }
  ],
  powersupply: [
    { label: "Watts", anyOf: ["specs.psu_watts", "compat.psu_watts"] },
    { label: "Certification", anyOf: ["specs.psu_certification"] }
  ],
  case: [
    { label: "Supported motherboard", anyOf: ["specs.supported_motherboard", "compat.supported_motherboard"] },
    { label: "GPU support", anyOf: ["specs.gpu_support", "compat.gpu_clearance_mm"] }
  ],
  casefans: [],
  other: []
};

const CASE_SUPPORTED_MOTHERBOARD_ORDER = ["ITX", "ATX", "mATX", "eATX"];

export function getBuilderFacetsForTab(tab: BuilderTab): PriceListFacetDefinition[] {
  return FACETS_BY_TAB[tab] || [];
}

export function getFacetOptionValues(products: Product[], facet: PriceListFacetKey): string[] {
  return uniqSorted(products.flatMap((product) => getProductFacetValues(product, facet)));
}

export function getProductFacetValues(product: Product, facet: PriceListFacetKey): string[] {
  switch (facet) {
    case "socket":
      return readProductList(product, "compat.processor_sockets");
    case "memory_technology":
      return readProductList(product, "compat.memory_technology");
    case "motherboard_chipset":
      return readProductList(product, "specs.socket_chipset");
    case "motherboard_form_factor":
      return uniqSorted([
        ...readProductList(product, "specs.motherboard_form_factor"),
        ...readProductList(product, "compat.motherboard_form_factor")
      ]);
    case "gpu_chipset":
      return readProductList(product, "specs.gpu_chipset");
    case "gpu_board_partner":
      return uniqSorted([...readProductList(product, "specs.gpu_board_partner"), product.brand || ""]);
    case "ssd_interface": {
      const value = ssdInterfaceOf(product);
      return value ? [value] : [];
    }
    case "pcie_generation":
      return readProductList(product, "specs.pcie_generation").map(formatPcieGeneration);
    case "psu_watts":
      return psuWattsOf(product).map((watts) => `${watts}W`);
    case "psu_certification":
      return readProductList(product, "specs.psu_certification");
    case "cooler_type": {
      const value = coolerTypeOf(product);
      return value ? [value] : [];
    }
    case "cooler_radiator":
      return readProductList(product, "specs.cooler_radiator_size").map(formatMm);
    case "supported_motherboard":
      return caseSupportedMotherboardsOf(product);
    default:
      return [];
  }
}

export function productMatchesQuery(product: Product, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    product.title,
    product.brand,
    product.sku,
    product.model,
    product.handle,
    product.stock_status,
    ...Object.values(product.specs || {}).map(labelOf),
    ...Object.values(product.compat || {}).map(labelOf)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function getMissingBuilderFields(product: Product): string[] {
  if (!product.pc_builder_enabled) return ["PC Builder disabled"];
  if (!product.is_active) return ["Not active or priced"];

  const tab = normalizeBuilderTab(product.category);
  const required = REQUIRED_FIELDS_BY_TAB[tab] || [];
  return required.filter((field) => !field.anyOf.some((path) => productPathHasValue(product, path))).map((field) => field.label);
}

export function getBuilderAudit(products: Product[]) {
  const rows = BUILDER_TAB_ORDER.map((tab) => {
    const categoryProducts = products.filter((product) => product.category === tab);
    const enabled = categoryProducts.filter((product) => product.pc_builder_enabled);
    const active = enabled.filter((product) => product.is_active);
    const ready = active.filter((product) => getMissingBuilderFields(product).length === 0);
    const missingCounts = new Map<string, number>();

    active.forEach((product) => {
      getMissingBuilderFields(product).forEach((field) => {
        missingCounts.set(field, (missingCounts.get(field) || 0) + 1);
      });
    });

    const topMissing = Array.from(missingCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([label, count]) => ({ label, count }));

    return {
      key: tab,
      label: categoryLabel(tab),
      total: categoryProducts.length,
      active: active.length,
      ready: ready.length,
      hidden: categoryProducts.length - active.length,
      topMissing
    };
  }).filter((row) => row.total > 0);

  return {
    total: products.length,
    active: rows.reduce((sum, row) => sum + row.active, 0),
    ready: rows.reduce((sum, row) => sum + row.ready, 0),
    rows
  };
}

export function normalizeBuilderTab(value: string): BuilderTab {
  return BUILDER_TAB_ORDER.includes(value as BuilderTab) ? (value as BuilderTab) : "other";
}

function readProductList(product: Product, path: string): string[] {
  const value = readProductValue(product, path);
  return asArray(value).map(labelOf).map(normalizeDisplayLabel).filter(Boolean);
}

function readProductValue(product: Product, path: string): ProductDataValue | undefined {
  const [root, key] = path.split(".");
  if (root === "specs") return product.specs?.[key];
  if (root === "compat") return product.compat?.[key];
  return undefined;
}

function productPathHasValue(product: Product, path: string): boolean {
  return readProductList(product, path).length > 0;
}

function asArray(value: ProductDataValue | undefined): ProductDataValue[] {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function labelOf(value: ProductDataValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(labelOf).filter(Boolean).join(" ");
  if (typeof value === "object") {
    const maybeObject = value as Record<string, ProductDataValue>;
    return (
      labelOf(maybeObject.name) ||
      labelOf(maybeObject.label) ||
      labelOf(maybeObject.title) ||
      labelOf(maybeObject.value) ||
      labelOf(maybeObject.handle)
    );
  }
  return "";
}

function normalizeDisplayLabel(value: string): string {
  const trimmed = value.trim();
  const key = trimmed.toLowerCase().replace(/[_\s]+/g, "-");
  const map: Record<string, string> = {
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
    "micro-atx-1": "mATX",
    itx: "ITX",
    "mini-itx": "ITX",
    eatx: "eATX",
    "e-atx": "eATX"
  };

  return map[key] || trimmed;
}

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

function ssdInterfaceOf(product: Product): string {
  const explicit = readProductList(product, "specs.ssd_device_interface")[0];
  if (explicit) return explicit;

  const formFactor = readProductList(product, "specs.m_2_form_factor")[0];
  if (formFactor) return "M.2";

  const title = product.title.toUpperCase();
  if (title.includes("M.2")) return "M.2";
  if (title.includes("SATA") || title.includes("2.5")) return "SATA";
  return "";
}

function psuWattsOf(product: Product): number[] {
  const values = [...readProductList(product, "specs.psu_watts"), ...readProductList(product, "compat.psu_watts")];
  return uniqSorted(values)
    .map((value) => {
      const matched = value.match(/\d+/);
      return matched ? Number(matched[0]) : null;
    })
    .filter((value): value is number => Number.isFinite(value));
}

function coolerTypeOf(product: Product): string {
  const raw = [...readProductList(product, "specs.cpu_cooler_type"), ...readProductList(product, "specs.cpu_cooler_types")][0] || "";
  const normalized = raw.toUpperCase();
  if (normalized.includes("AIO") || normalized.includes("LIQUID") || normalized.includes("WATER")) return "AIO";
  if (normalized.includes("AIR")) return "Air";

  const radiator = readProductList(product, "specs.cooler_radiator_size").join(" ");
  if (/\b(240|280|360|420)\b/.test(radiator)) return "AIO";

  const title = `${product.handle || ""} ${product.title}`.toUpperCase();
  if (["AIO", "LIQUID", "WATER", "MASTERLIQUID", "KRAKEN", "GALAHAD"].some((token) => title.includes(token))) return "AIO";
  if (/\b(240|280|360|420)\b/.test(title)) return "AIO";

  return product.category === "cpucooler" ? "Air" : "";
}

function caseSupportedMotherboardsOf(product: Product): string[] {
  const raw = uniqSorted([
    ...readProductList(product, "specs.supported_motherboard"),
    ...readProductList(product, "compat.supported_motherboard")
  ]);

  const found = new Set(raw.map(normalizeCaseSupportedMotherboardValue).filter(Boolean));
  return CASE_SUPPORTED_MOTHERBOARD_ORDER.filter((value) => found.has(value));
}

function normalizeCaseSupportedMotherboardValue(raw: string): string {
  const value = raw.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (value === "ITX" || value === "MINIITX") return "ITX";
  if (value === "ATX") return "ATX";
  if (value === "MATX" || value === "MICROATX") return "mATX";
  if (value === "EATX" || value === "EXTENDEDATX") return "eATX";
  return "";
}

function formatPcieGeneration(value: string): string {
  if (!value) return "";
  const number = value.match(/\d+/)?.[0];
  return number ? `Gen ${number}` : value;
}

function formatMm(value: string): string {
  if (!value) return "";
  if (/mm$/i.test(value.trim())) return value;
  const number = value.match(/\d+/)?.[0];
  return number ? `${number} mm` : value;
}
