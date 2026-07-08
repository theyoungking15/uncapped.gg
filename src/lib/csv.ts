import { slugify } from "@/lib/format";
import {
  compactDataBag,
  normalizeListValue,
  normalizeProductCategory,
  parseOptionalBoolean,
  parseOptionalNumber
} from "@/lib/product-foundation";
import { normalizeProductAvailability, type ProductAvailabilityStatus } from "@/lib/product-availability";
import { normalizeProductCondition, type ProductCondition } from "@/lib/product-conditions";
import type { ProductDataBag } from "@/lib/types";
import type { ImportErrorRow } from "@/lib/types";

export type ParsedProductRow = {
  handle: string;
  title: string;
  category: string;
  condition: ProductCondition | null;
  price: number;
  compare_at_price: number | null;
  brand: string;
  sku: string;
  model: string;
  stock_status: string;
  inventory_quantity: number;
  availability_status: ProductAvailabilityStatus | null;
  show_inventory_quantity: boolean;
  image_url: string;
  image_urls: string[];
  product_url: string;
  description: string;
  quick_description: string;
  availability_tier: number | null;
  lead_time_label: string;
  pc_builder_enabled: boolean;
  is_active: boolean;
  specs: ProductDataBag;
  compat: ProductDataBag;
  source_metadata: ProductDataBag;
};

export type ParsedImport = {
  rows: ParsedProductRow[];
  errors: ImportErrorRow[];
  totalRows: number;
  sourceType: "generic_csv" | "shopify_product_csv";
};

type CsvRecord = Record<string, string>;

const GENERIC_SPEC_COLUMNS = [
  "socket",
  "chipset",
  "gpu_chipset",
  "memory_type",
  "watts",
  "form_factor",
  "motherboard_form_factor",
  "supported_motherboard",
  "gpu_clearance_mm",
  "cooler_height_mm",
  "cpu_core_count",
  "cpu_thread_count",
  "tdp",
  "ram_capacity",
  "ram_speed",
  "ram_cas_latency",
  "gpu_vram",
  "gpu_length",
  "minimum_psu",
  "psu_certification",
  "psu_modularity",
  "cpu_cooler_type",
  "ssd_device_interface",
  "read_mbps",
  "write_mbps"
];

export function parseProductCsv(csvText: string): ParsedImport {
  const records = parseCsv(csvText);
  if (records.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, reason: "CSV must include a header row and at least one product row." }],
      totalRows: 0,
      sourceType: "generic_csv"
    };
  }

  const headers = records[0].map((header) => header.trim());
  if (isShopifyExport(headers)) return parseShopifyProductCsv(headers, records.slice(1));
  return parseGenericProductCsv(headers, records.slice(1));
}

function parseGenericProductCsv(headers: string[], records: string[][]): ParsedImport {
  const rows: ParsedProductRow[] = [];
  const errors: ImportErrorRow[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.every((value) => !value.trim())) return;

    const source = sourceFromRecord(headers, record);
    const title = pick(source, "title");
    const category = normalizeProductCategory(pick(source, "category"));
    const price = parsePrice(pick(source, "price"));

    if (!title) {
      errors.push({ row: rowNumber, reason: "Missing title." });
      return;
    }

    if (!category) {
      errors.push({ row: rowNumber, reason: "Missing or invalid category." });
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      errors.push({ row: rowNumber, reason: "Price must be greater than zero." });
      return;
    }

    const specs: ProductDataBag = {};
    GENERIC_SPEC_COLUMNS.forEach((key) => setText(specs, key, pick(source, key)));

    const compat = buildCompat({
      processorSockets: pick(source, "socket"),
      memoryTechnology: pick(source, "memory_type"),
      motherboardFormFactor: pick(source, "motherboard_form_factor") || pick(source, "form_factor"),
      supportedMotherboard: pick(source, "supported_motherboard"),
      psuWatts: pick(source, "psu_watts") || pick(source, "watts"),
      minimumPsuWatts: pick(source, "minimum_psu"),
      gpuClearanceMm: pick(source, "gpu_clearance_mm"),
      coolerHeightMm: pick(source, "cooler_height_mm")
    });

    const handle = pick(source, "handle") || slugify(title);
    const imageUrls = unique([pick(source, "image_url")].filter(Boolean));

    const stockStatus = pick(source, "stock_status");

    rows.push({
      handle,
      title,
      category,
      condition: normalizeProductCondition(pick(source, "condition") || pick(source, "product_condition")),
      price,
      compare_at_price: parsePriceOrNull(pick(source, "compare_at_price")),
      brand: pick(source, "brand"),
      sku: pick(source, "sku"),
      model: pick(source, "model"),
      stock_status: stockStatus || "available",
      inventory_quantity: parseInventoryQuantity(pick(source, "inventory_quantity") || pick(source, "quantity")),
      availability_status: normalizeProductAvailability(pick(source, "availability_status") || stockStatus),
      show_inventory_quantity: parseOptionalBoolean(pick(source, "show_inventory_quantity")) ?? false,
      image_url: imageUrls[0] || "",
      image_urls: imageUrls,
      product_url: pick(source, "product_url"),
      description: pick(source, "description"),
      quick_description: pick(source, "quick_description"),
      availability_tier: parseOptionalNumber(pick(source, "availability_tier")),
      lead_time_label: pick(source, "lead_time_label"),
      pc_builder_enabled: parseOptionalBoolean(pick(source, "pc_builder_enabled")) ?? true,
      is_active: true,
      specs: compactDataBag(specs),
      compat,
      source_metadata: { source: "generic_csv" }
    });
  });

  return {
    rows,
    errors,
    totalRows: records.length,
    sourceType: "generic_csv"
  };
}

function parseShopifyProductCsv(headers: string[], records: string[][]): ParsedImport {
  const rowObjects = records.map((record) => sourceFromRecord(headers, record));
  const groups = new Map<string, CsvRecord[]>();

  rowObjects.forEach((source) => {
    const handle = pick(source, "Handle") || pick(source, "handle");
    if (!handle) return;
    const group = groups.get(handle) || [];
    group.push(source);
    groups.set(handle, group);
  });

  const rows: ParsedProductRow[] = [];
  const errors: ImportErrorRow[] = [];

  Array.from(groups.entries()).forEach(([handle, group], index) => {
    const productSource = group.find((row) => pick(row, "Title")) || group[0];
    const title = pick(productSource, "Title");

    if (!title) {
      errors.push({ row: index + 2, reason: `Shopify product ${handle} has no titled row.` });
      return;
    }

    const price = parsePrice(pick(productSource, "Variant Price"));
    const hasValidPrice = Number.isFinite(price) && price > 0;

    const status = pick(productSource, "Status").toLowerCase();
    const inventoryQuantity = group.reduce((total, row) => total + parseInventoryQuantity(pick(row, "Variant Inventory Qty")), 0);
    const category = normalizeProductCategory(pick(productSource, "Type") || pick(productSource, "Product Category"));
    const images = unique(
      group
        .flatMap((row) => [pick(row, "Image Src"), pick(row, "Variant Image")])
        .map((url) => url.trim())
        .filter(Boolean)
    );
    const specs = buildShopifySpecs(productSource);
    const compat = buildShopifyCompat(productSource);
    const variants = group
      .filter((row) => pick(row, "Variant Price") || pick(row, "Option1 Value") || pick(row, "Variant SKU"))
      .map((row) =>
        compactDataBag({
          sku: pick(row, "Variant SKU"),
          option1_name: pick(row, "Option1 Name"),
          option1_value: pick(row, "Option1 Value"),
          option2_name: pick(row, "Option2 Name"),
          option2_value: pick(row, "Option2 Value"),
          option3_name: pick(row, "Option3 Name"),
          option3_value: pick(row, "Option3 Value"),
          price: parsePriceOrNull(pick(row, "Variant Price")),
          compare_at_price: parsePriceOrNull(pick(row, "Variant Compare At Price")),
          image: pick(row, "Variant Image")
        })
      );

    rows.push({
      handle,
      title,
      category,
      condition: normalizeProductCondition(
        pick(productSource, "Condition") ||
          pick(productSource, "Product Condition") ||
          pick(productSource, "Condition (product.metafields.custom.condition)") ||
          pick(productSource, "Product Condition (product.metafields.custom.condition)")
      ),
      price,
      compare_at_price: parsePriceOrNull(pick(productSource, "Variant Compare At Price")),
      brand: pick(productSource, "Vendor") || pick(productSource, "Brand (product.metafields.relations.brand)"),
      sku: pick(productSource, "Variant SKU"),
      model: pick(productSource, "Part Number (product.metafields.custom.part_number)"),
      stock_status: hasValidPrice ? (status === "active" || !status ? "available" : status) : "needs_price",
      inventory_quantity: inventoryQuantity,
      availability_status:
        normalizeProductAvailability(
          pick(productSource, "Availability Status") ||
            pick(productSource, "Availability Status (product.metafields.custom.availability_status)") ||
            pick(productSource, "Stock Status (product.metafields.custom.stock_status)")
        ) || (hasValidPrice && status !== "archived" ? "on_hand" : "sold_out"),
      show_inventory_quantity:
        parseOptionalBoolean(
          pick(productSource, "Show Inventory Quantity") ||
            pick(productSource, "Show Inventory Quantity (product.metafields.custom.show_inventory_quantity)")
        ) ?? false,
      image_url: images[0] || "",
      image_urls: images,
      product_url: "",
      description: stripHtml(pick(productSource, "Body (HTML)")),
      quick_description: pick(productSource, "Quick Description (product.metafields.custom.quick_description)"),
      availability_tier: parseOptionalNumber(
        pick(productSource, "Availability Tier Override (product.metafields.custom.availability_tier_override)") ||
          pick(productSource, "Availability Tier (product.metafields.custom.availability_tier)")
      ),
      lead_time_label:
        pick(productSource, "Lead Time Label (product.metafields.custom.lead_time_label)") ||
        pick(productSource, "Lead Time Label Local (product.metafields.custom.lead_time_label_local)") ||
        pick(productSource, "Lead Time Label Overseas (product.metafields.custom.lead_time_label_overseas)"),
      pc_builder_enabled: parseOptionalBoolean(pick(productSource, "PC Builder (product.metafields.custom.pc_builder_enabled)")) ?? true,
      is_active: hasValidPrice && status !== "draft" && status !== "archived",
      specs,
      compat,
      source_metadata: compactDataBag({
        source: "shopify_product_csv",
        shopify_handle: handle,
        product_category: pick(productSource, "Product Category"),
        tags: pick(productSource, "Tags"),
        status: pick(productSource, "Status"),
        missing_price: !hasValidPrice,
        variants
      })
    });
  });

  return {
    rows,
    errors,
    totalRows: groups.size,
    sourceType: "shopify_product_csv"
  };
}

function buildShopifySpecs(source: CsvRecord): ProductDataBag {
  const specs: ProductDataBag = {};

  setText(specs, "part_number", pick(source, "Part Number (product.metafields.custom.part_number)"));
  setList(specs, "color", pick(source, "Color (product.metafields.shopify.color-pattern)"));
  setText(specs, "cpu_core_count", pick(source, "CPU Core Count (product.metafields.custom.cpu_core_count)"));
  setText(specs, "cpu_thread_count", pick(source, "CPU Thread Count (product.metafields.custom.cpu_thread_count)"));
  setText(specs, "cpu_base_clock", pick(source, "CPU Base Clock (product.metafields.custom.cpu_base_clock)"));
  setText(specs, "cpu_boost_clock", pick(source, "CPU Boost Clock (product.metafields.custom.cpu_boost_clock)"));
  setText(specs, "tdp", pick(source, "TDP (product.metafields.custom.tdp)"));
  setText(specs, "integrated_graphics", pick(source, "Integrated Graphics (product.metafields.custom.integrated_graphics)"));

  setText(specs, "pcie_x16_slots", pick(source, "PCIe x16 Slots (product.metafields.custom.pcie_x16_slots)"));
  setText(specs, "m_2_slots", pick(source, "M.2 Slots (product.metafields.custom.m_2_slots)"));
  setText(specs, "motherboard_wifi", pick(source, "Motherboard Wifi (product.metafields.custom.motherboard_wifi)"));
  setText(specs, "socket_chipset", pick(source, "Socket Chipset (product.metafields.custom.socket_chipset)"));
  setText(specs, "ram_slots", pick(source, "RAM Slots (product.metafields.custom.ram_slots)"));
  setList(specs, "motherboard_form_factor", pick(source, "Motherboard form factor (product.metafields.shopify.motherboard-form-factor)"));
  setList(specs, "motherboard_chipset_family", pick(source, "Motherboard chipset family (product.metafields.shopify.motherboard-chipset-family)"));

  setText(specs, "ram_capacity", pick(source, "Capacity (product.metafields.ram.capacity)"));
  setText(specs, "ram_cas_latency", pick(source, "CAS Latency (product.metafields.ram.cas_latency)"));
  setText(specs, "ram_module_capacity", pick(source, "Module Capacity (product.metafields.ram.module_capacity)"));
  setText(specs, "ram_module_count", pick(source, "Module Count (product.metafields.ram.module_count)"));
  setText(specs, "ram_speed", pick(source, "Speed (product.metafields.ram.speed)"));

  setText(specs, "read_mbps", pick(source, "Read Mbps (product.metafields.custom.read_mbps)"));
  setText(specs, "write_mbps", pick(source, "Write Mbps (product.metafields.custom.write_mbps)"));
  setList(specs, "ssd_device_interface", pick(source, "Device interface (product.metafields.shopify.device-interface)"));
  setText(specs, "m_2_form_factor", pick(source, "M.2 Form Factor (product.metafields.custom.m_2_form_factor)"));
  setText(specs, "pcie_generation", pick(source, "PCIe Generation (product.metafields.custom.pcie_generation)"));

  setText(specs, "gpu_chipset", pick(source, "Chipset (product.metafields.gpu.chipset)"));
  setText(specs, "gpu_vram", pick(source, "VRAM (product.metafields.gpu.vram)"));
  setText(specs, "gpu_core_clock", pick(source, "Core Clock (product.metafields.gpu.core_clock)"));
  setText(specs, "gpu_boost_clock", pick(source, "Boost Clock (product.metafields.gpu.boost_clock)"));
  setText(specs, "gpu_length", pick(source, "Length (product.metafields.gpu.length)"));
  setText(specs, "gpu_width", pick(source, "Width (product.metafields.gpu.width)"));
  setText(specs, "gpu_height", pick(source, "Height (product.metafields.gpu.height)"));
  setText(specs, "gpu_memory_type", pick(source, "Memory Type (product.metafields.gpu.memory_type)"));
  setText(specs, "gpu_power_connectors", pick(source, "Power Connectors (product.metafields.gpu.power_connectors)"));
  setText(specs, "gpu_board_partner", pick(source, "Board Partner (product.metafields.gpu.board_partner)"));

  setText(specs, "psu_certification", pick(source, "Certification (product.metafields.custom.certification)"));
  setText(specs, "psu_watts", pick(source, "Watts (product.metafields.custom.watts)"));
  setText(specs, "psu_modularity", pick(source, "Modularity (product.metafields.custom.modularity)"));
  setList(specs, "psu_tier", pick(source, "Energy efficiency class (product.metafields.shopify.energy-efficiency-class)"));

  setText(specs, "cpu_cooler_type", pick(source, "CPU Cooler Type (product.metafields.custom.cpu_cooler_type)"));
  setText(specs, "cpu_cooler_types", pick(source, "CPU Cooler Types (product.metafields.custom.cpu_cooler_types)"));
  setText(specs, "cooler_radiator_size", pick(source, "Cooler Radiator Size (product.metafields.custom.cooler_radiator_size)"));
  setText(specs, "cooler_height", pick(source, "Cooler Height (product.metafields.custom.cooler_height)"));

  setList(specs, "supported_motherboard", pick(source, "Supported Motherboard (product.metafields.custom.supported_motherboard)"));
  setText(specs, "gpu_support", pick(source, "GPU Support (product.metafields.custom.gpu_support)"));
  setText(specs, "case_fans_rgb", pick(source, "Case Fans RGB (product.metafields.custom.case_fans_rgb)"));
  setList(specs, "material", pick(source, "Material (product.metafields.shopify.material)"));

  return compactDataBag(specs);
}

function buildShopifyCompat(source: CsvRecord): ProductDataBag {
  return buildCompat({
    processorSockets: pick(source, "Processor socket (product.metafields.shopify.processor-socket)"),
    memoryTechnology: pick(source, "Memory technology (product.metafields.shopify.memory-technology)"),
    motherboardFormFactor: pick(source, "Motherboard form factor (product.metafields.shopify.motherboard-form-factor)"),
    supportedMotherboard: pick(source, "Supported Motherboard (product.metafields.custom.supported_motherboard)"),
    psuWatts: pick(source, "Watts (product.metafields.custom.watts)"),
    minimumPsuWatts: pick(source, "Minimum PSU (product.metafields.gpu.minimum_psu)"),
    gpuClearanceMm: pick(source, "GPU Support (product.metafields.custom.gpu_support)"),
    coolerHeightMm: pick(source, "Cooler Height (product.metafields.custom.cooler_height)")
  });
}

function buildCompat(values: {
  processorSockets?: string;
  memoryTechnology?: string;
  motherboardFormFactor?: string;
  supportedMotherboard?: string;
  psuWatts?: string;
  minimumPsuWatts?: string;
  gpuClearanceMm?: string;
  coolerHeightMm?: string;
}): ProductDataBag {
  const compat: ProductDataBag = {};
  setList(compat, "processor_sockets", values.processorSockets || "");
  setList(compat, "memory_technology", values.memoryTechnology || "");
  setList(compat, "motherboard_form_factor", values.motherboardFormFactor || "");
  setList(compat, "supported_motherboard", values.supportedMotherboard || "");
  setNumber(compat, "psu_watts", values.psuWatts || "");
  setNumber(compat, "minimum_psu_watts", values.minimumPsuWatts || "");
  setNumber(compat, "gpu_clearance_mm", values.gpuClearanceMm || "");
  setNumber(compat, "cooler_height_mm", values.coolerHeightMm || "");
  return compactDataBag(compat);
}

function isShopifyExport(headers: string[]): boolean {
  return (
    headers.includes("Handle") &&
    headers.includes("Variant Price") &&
    headers.some((header) => header.includes("product.metafields."))
  );
}

function sourceFromRecord(headers: string[], record: string[]): CsvRecord {
  const source: CsvRecord = {};
  headers.forEach((header, index) => {
    const rawKey = header.trim();
    const normalizedKey = normalizeHeader(rawKey);
    const value = record[index]?.trim() || "";
    source[rawKey] = value;
    if (!source[normalizedKey]) source[normalizedKey] = value;
  });
  return source;
}

function pick(source: CsvRecord, key: string): string {
  return source[key] || source[normalizeHeader(key)] || "";
}

function setText(target: ProductDataBag, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) target[key] = trimmed;
}

function setList(target: ProductDataBag, key: string, value: string) {
  const list = normalizeListValue(value);
  if (list.length) target[key] = list;
}

function setNumber(target: ProductDataBag, key: string, value: string) {
  const number = parseOptionalNumber(value);
  if (number !== null) target[key] = number;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parsePrice(value: string): number {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePriceOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = parsePrice(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseInventoryQuantity(value: string): number {
  const parsed = parseOptionalNumber(value);
  return parsed !== null ? Math.max(0, Math.floor(parsed)) : 0;
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((record) => record.some((value) => value.trim()));
}
