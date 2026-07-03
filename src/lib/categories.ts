export const CATEGORY_OPTIONS = [
  { key: "processor", label: "CPU" },
  { key: "motherboard", label: "Motherboard" },
  { key: "memory", label: "RAM" },
  { key: "gpu", label: "GPU" },
  { key: "ssd", label: "SSD" },
  { key: "cpucooler", label: "CPU Cooler" },
  { key: "powersupply", label: "Power Supply" },
  { key: "case", label: "Case" },
  { key: "casefans", label: "Case Fans" },
  { key: "other", label: "Other" }
] as const;

export type CategoryKey = (typeof CATEGORY_OPTIONS)[number]["key"];

const CATEGORY_ALIASES: Record<string, CategoryKey> = {
  cpu: "processor",
  processor: "processor",
  processors: "processor",
  motherboard: "motherboard",
  motherboards: "motherboard",
  mobo: "motherboard",
  ram: "memory",
  memory: "memory",
  gpu: "gpu",
  graphics: "gpu",
  "graphics card": "gpu",
  ssd: "ssd",
  storage: "ssd",
  cooler: "cpucooler",
  "cpu cooler": "cpucooler",
  cpucooler: "cpucooler",
  psu: "powersupply",
  powersupply: "powersupply",
  "power supply": "powersupply",
  case: "case",
  chassis: "case",
  fans: "casefans",
  "case fans": "casefans",
  casefans: "casefans",
  other: "other"
};

export function normalizeCategory(value: string): CategoryKey | null {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return CATEGORY_ALIASES[normalized] || null;
}

export function categoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((item) => item.key === value)?.label || "Other";
}

