import { normalizeCategory } from "@/lib/categories";
import type { ImportErrorRow } from "@/lib/types";

export type ParsedProductRow = {
  title: string;
  category: string;
  price: number;
  brand: string;
  sku: string;
  model: string;
  stock_status: string;
  image_url: string;
  product_url: string;
  description: string;
  specs: Record<string, string>;
};

export type ParsedImport = {
  rows: ParsedProductRow[];
  errors: ImportErrorRow[];
  totalRows: number;
};

const SPEC_COLUMNS = ["socket", "chipset", "gpu_chipset", "memory_type", "watts", "form_factor"];

export function parseProductCsv(csvText: string): ParsedImport {
  const records = parseCsv(csvText);
  if (records.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, reason: "CSV must include a header row and at least one product row." }],
      totalRows: 0
    };
  }

  const headers = records[0].map(normalizeHeader);
  const rows: ParsedProductRow[] = [];
  const errors: ImportErrorRow[] = [];

  records.slice(1).forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.every((value) => !value.trim())) return;

    const source = Object.fromEntries(headers.map((header, headerIndex) => [header, record[headerIndex]?.trim() || ""]));
    const title = source.title || "";
    const category = normalizeCategory(source.category || "");
    const price = parsePrice(source.price || "");

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

    const specs = Object.fromEntries(SPEC_COLUMNS.map((key) => [key, source[key] || ""]).filter(([, value]) => value));

    rows.push({
      title,
      category,
      price,
      brand: source.brand || "",
      sku: source.sku || "",
      model: source.model || "",
      stock_status: source.stock_status || "available",
      image_url: source.image_url || "",
      product_url: source.product_url || "",
      description: source.description || "",
      specs
    });
  });

  return {
    rows,
    errors,
    totalRows: records.length - 1
  };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parsePrice(value: string): number {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

