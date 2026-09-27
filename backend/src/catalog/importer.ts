import fs from 'fs';
import path from 'path';
import { Product, ProductSource, PriceType, AvailabilityStatus, StockType, DeliveryType, ProductSpecifications } from '../database/schema.js';
import { db } from '../database/db.js';

export interface ImportReport {
  totalRows: number;
  created: number;
  updated: number;
  duplicates: number;
  skipped: number;
  invalid: number;
  errors: { row: number; identifier?: string; message: string }[];
  durationMs: number;
}

export interface RawProductInput {
  id?: string;
  sku?: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  priceType?: string;
  priceUpdatedAt?: string;
  availabilityStatus?: string;
  stock?: number | string;
  stockUpdatedAt?: string;
  stockType?: string;
  rating?: number | string;
  reviewsCount?: number | string;
  reviewCount?: number | string;
  deliveryDays?: number | string;
  deliveryType?: string;
  warrantyYears?: number | string;
  warranty?: number | string;
  color?: string;
  imageUrl?: string;
  additionalImages?: string[] | string;
  productUrl?: string;
  source?: string;
  sourceProductId?: string;
  lastVerifiedAt?: string;
  specifications?: Partial<ProductSpecifications> | string;
  cpu?: string;
  cpuBrand?: string;
  cpuModel?: string;
  cpuGeneration?: string;
  cpuCores?: number | string;
  cpuThreads?: number | string;
  ram?: string;
  ramGb?: number | string;
  ramType?: string;
  storage?: string;
  storageGb?: number | string;
  storageType?: string;
  gpu?: string;
  gpuMemoryGb?: number | string;
  display?: string;
  displaySize?: number | string;
  displayResolution?: string;
  displayRefreshRate?: number | string;
  displayPanel?: string;
  batteryWh?: number | string;
  batteryHours?: number | string;
  weightKg?: number | string;
  os?: string;
  tags?: string[] | string;
}

/**
 * Normalization Utilities
 */
export function normalizeRamGb(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return Math.round(raw);
  if (!raw) return 16;
  const str = String(raw).trim().toLowerCase();
  const match = str.match(/(\d+)\s*(?:gb|g)?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? 16 : val;
  }
  return 16;
}

export function normalizeStorageGb(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return Math.round(raw);
  if (!raw) return 512;
  const str = String(raw).trim().toLowerCase();
  if (str.includes('tb') || str.includes('t')) {
    const match = str.match(/(\d+(?:\.\d+)?)\s*(?:tb|t)/i);
    if (match) {
      const tb = parseFloat(match[1]);
      return isNaN(tb) ? 1024 : Math.round(tb * 1024);
    }
  }
  const matchGb = str.match(/(\d+)\s*(?:gb|g)?/i);
  if (matchGb) {
    const val = parseInt(matchGb[1], 10);
    return isNaN(val) ? 512 : val;
  }
  return 512;
}

export function normalizeDisplaySize(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (!raw) return 14.0;
  const str = String(raw).trim().replace(/[\\"]/g, '');
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 14.0 : val;
  }
  return 14.0;
}

export function normalizeWeightKg(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (!raw) return 1.5;
  const str = String(raw).trim().toLowerCase();
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 1.5 : val;
  }
  return 1.5;
}

export function normalizeNumber(raw: any, fallback: number): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (raw === undefined || raw === null || raw === '') return fallback;
  const clean = String(raw).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? fallback : num;
}

export function normalizeSource(raw: any): ProductSource {
  if (!raw) return 'IMPORTED_CATALOG';
  const upper = String(raw).trim().toUpperCase();
  if (upper === 'MANUFACTURER' || upper === 'OEM') return 'MANUFACTURER';
  if (upper === 'RETAILER_API' || upper === 'RETAILER' || upper === 'API') return 'RETAILER_API';
  if (upper === 'MOCK' || upper === 'DEMO') return 'MOCK';
  return 'IMPORTED_CATALOG';
}

export function normalizePriceType(raw: any, source: ProductSource): PriceType {
  if (raw) {
    const upper = String(raw).trim().toUpperCase();
    if (upper === 'RETAILER_LISTING' || upper === 'MANUFACTURER_MSRP' || upper === 'IMPORTED_ESTIMATE' || upper === 'MOCK') {
      return upper as PriceType;
    }
  }
  if (source === 'MANUFACTURER') return 'MANUFACTURER_MSRP';
  if (source === 'RETAILER_API') return 'RETAILER_LISTING';
  if (source === 'MOCK') return 'MOCK';
  return 'IMPORTED_ESTIMATE';
}

export function normalizeStockType(raw: any, source: ProductSource): StockType {
  if (raw) {
    const upper = String(raw).trim().toUpperCase();
    if (upper === 'VERIFIED_LIVE' || upper === 'ESTIMATED_INVENTORY' || upper === 'IMPORTED') {
      return upper as StockType;
    }
  }
  if (source === 'RETAILER_API') return 'VERIFIED_LIVE';
  if (source === 'MANUFACTURER') return 'VERIFIED_LIVE';
  return 'IMPORTED';
}

export function normalizeDeliveryType(raw: any): DeliveryType {
  if (raw) {
    const upper = String(raw).trim().toUpperCase();
    if (upper === 'EXPRESS_SLA' || upper === 'STANDARD_LOGISTICS' || upper === 'ESTIMATED') {
      return upper as DeliveryType;
    }
  }
  return 'ESTIMATED';
}

export function normalizeAvailabilityStatus(stock: number, raw?: any): AvailabilityStatus {
  if (raw) {
    const upper = String(raw).trim().toUpperCase();
    if (['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED', 'PRE_ORDER'].includes(upper)) {
      return upper as AvailabilityStatus;
    }
  }
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock < 5) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function parseStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (!raw) return [];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // continue
      }
    }
    return trimmed.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Standard CSV Parser (handles quotes, commas, escapes, CRLF)
 */
export function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++; // skip \n
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const tokens: string[] = [];
    let token = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          token += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        tokens.push(token.trim());
        token = '';
      } else {
        token += c;
      }
    }
    tokens.push(token.trim());
    return tokens;
  };

  const headerTokens = parseLine(lines[0]).map((h) => h.trim());
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = parseLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headerTokens.length; j++) {
      const header = headerTokens[j];
      const val = tokens[j] !== undefined ? tokens[j].trim() : '';
      row[header] = val;
    }
    results.push(row);
  }

  return results;
}

/**
 * Product Ingestion Engine
 */
export class CatalogImporter {
  /**
   * Normalize and validate a single product input.
   * Returns valid Product object or throws ValidationError.
   */
  public static normalizeAndValidate(input: RawProductInput, rowIndex: number): Product {
    const name = (input.name || '').trim();
    if (!name) {
      throw new Error(`Row ${rowIndex}: Missing required field 'name'`);
    }

    const brand = (input.brand || '').trim() || name.split(' ')[0] || 'Generic';
    const model = (input.model || '').trim() || name.replace(brand, '').trim() || name;
    const category = (input.category || 'Laptops').trim();

    // Price validation
    const price = normalizeNumber(input.price, -1);
    if (price < 0) {
      throw new Error(`Row ${rowIndex} (${name}): Invalid price '${input.price}'. Price must be >= 0`);
    }

    // Stock validation
    const stock = Math.round(normalizeNumber(input.stock, 0));
    if (stock < 0) {
      throw new Error(`Row ${rowIndex} (${name}): Invalid stock '${input.stock}'. Stock must be >= 0`);
    }

    // Rating validation
    const rating = normalizeNumber(input.rating, 4.2);
    if (rating < 0 || rating > 5) {
      throw new Error(`Row ${rowIndex} (${name}): Invalid rating '${input.rating}'. Rating must be between 0 and 5`);
    }

    // Review count
    const reviewsCount = Math.max(0, Math.round(normalizeNumber(input.reviewsCount || input.reviewCount, 100)));

    // Delivery days
    const deliveryDays = Math.max(1, Math.round(normalizeNumber(input.deliveryDays, 3)));

    // Warranty
    const warrantyYears = Math.max(0, Math.round(normalizeNumber(input.warrantyYears || input.warranty, 1)));

    // Source tracking
    const source = normalizeSource(input.source);
    const sourceProductId = (input.sourceProductId || input.sku || `SRC-${Date.now()}-${rowIndex}`).trim();
    const sku = (input.sku || `${brand.toUpperCase().slice(0, 3)}-${sourceProductId}`).trim();
    const id = input.id || `PROD-${brand.toUpperCase().slice(0, 3)}-${model.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12)}`;

    const priceType = normalizePriceType(input.priceType, source);
    const stockType = normalizeStockType(input.stockType, source);
    const deliveryType = normalizeDeliveryType(input.deliveryType);
    const availabilityStatus = normalizeAvailabilityStatus(stock, input.availabilityStatus);

    // Parse specifications
    let specs: any = {};
    if (typeof input.specifications === 'object' && input.specifications !== null) {
      specs = { ...input.specifications };
    } else if (typeof input.specifications === 'string') {
      try {
        specs = JSON.parse(input.specifications);
      } catch {
        // fallback
      }
    }

    const ramGb = normalizeRamGb(specs.ramGb || input.ramGb || input.ram);
    const storageGb = normalizeStorageGb(specs.storageGb || input.storageGb || input.storage);
    const displaySize = normalizeDisplaySize(specs.displaySize || input.displaySize || input.display);
    const weightKg = normalizeWeightKg(specs.weightKg || input.weightKg);
    const batteryHours = normalizeNumber(specs.batteryHours || input.batteryHours, 8.0);

    const fullSpecs: ProductSpecifications = {
      cpu: specs.cpu || input.cpu || 'Intel Core i5 / AMD Ryzen 5',
      cpuBrand: specs.cpuBrand || input.cpuBrand || (specs.cpu?.includes('AMD') ? 'AMD' : specs.cpu?.includes('Apple') ? 'Apple' : 'Intel'),
      cpuModel: specs.cpuModel || input.cpuModel,
      cpuGeneration: specs.cpuGeneration || input.cpuGeneration,
      cpuCores: normalizeNumber(specs.cpuCores || input.cpuCores, 8),
      cpuThreads: normalizeNumber(specs.cpuThreads || input.cpuThreads, 12),
      ram: specs.ram || input.ram || `${ramGb}GB DDR5`,
      ramGb,
      ramType: specs.ramType || input.ramType || 'DDR5',
      storage: specs.storage || input.storage || `${storageGb >= 1024 ? `${storageGb / 1024}TB` : `${storageGb}GB`} NVMe SSD`,
      storageGb,
      storageType: (specs.storageType || input.storageType || 'SSD').toUpperCase() === 'HDD' ? 'HDD' : 'SSD',
      gpu: specs.gpu || input.gpu || 'Integrated Graphics',
      gpuMemoryGb: normalizeNumber(specs.gpuMemoryGb || input.gpuMemoryGb, 0),
      display: specs.display || input.display || `${displaySize}" FHD IPS Display`,
      displaySize,
      displayResolution: specs.displayResolution || input.displayResolution || '1920x1080',
      displayRefreshRate: normalizeNumber(specs.displayRefreshRate || input.displayRefreshRate, 60),
      displayPanel: specs.displayPanel || input.displayPanel || 'IPS',
      batteryWh: normalizeNumber(specs.batteryWh || input.batteryWh, 54),
      batteryHours,
      weightKg,
      os: specs.os || input.os || 'Windows 11 Pro'
    };

    const tags = parseStringArray(input.tags);
    if (tags.length === 0) {
      tags.push(category.toLowerCase(), brand.toLowerCase(), `${ramGb}gb-ram`, `${storageGb}gb-ssd`);
    }

    const now = new Date().toISOString();

    const product: Product = {
      id,
      sku,
      name,
      brand,
      model,
      category,
      subcategory: input.subcategory || `${category} Model`,
      description: input.description || `${brand} ${model} high-performance enterprise hardware.`,
      price,
      currency: input.currency || 'INR',
      priceType,
      priceUpdatedAt: input.priceUpdatedAt || now,
      availabilityStatus,
      stock,
      stockUpdatedAt: input.stockUpdatedAt || now,
      stockType,
      rating,
      reviewsCount,
      deliveryDays,
      deliveryType,
      warrantyYears,
      color: input.color || 'Dark Ash / Silver',
      imageUrl: input.imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      additionalImages: parseStringArray(input.additionalImages),
      productUrl: input.productUrl || `https://www.example.com/products/${sku}`,
      source,
      sourceProductId,
      lastVerifiedAt: input.lastVerifiedAt || now,
      specifications: fullSpecs,
      tags,
      createdAt: now,
      updatedAt: now
    };

    return product;
  }

  /**
   * Ingest an array of raw product records and upsert them into the database.
   */
  public static async ingestRecords(rawRecords: RawProductInput[]): Promise<ImportReport> {
    const startTime = Date.now();
    const report: ImportReport = {
      totalRows: rawRecords.length,
      created: 0,
      updated: 0,
      duplicates: 0,
      skipped: 0,
      invalid: 0,
      errors: [],
      durationMs: 0
    };

    const seenInBatch = new Set<string>();

    for (let i = 0; i < rawRecords.length; i++) {
      const raw = rawRecords[i];
      const rowNum = i + 1;

      try {
        const validatedProduct = this.normalizeAndValidate(raw, rowNum);

        // Deduplication key
        const uniqueKey = `${validatedProduct.source}:${validatedProduct.sourceProductId}`.toLowerCase();
        const skuKey = validatedProduct.sku.toLowerCase();
        const modelKey = `${validatedProduct.brand}:${validatedProduct.model}`.toLowerCase();

        if (seenInBatch.has(uniqueKey) || seenInBatch.has(skuKey)) {
          report.duplicates++;
          report.skipped++;
          continue;
        }
        seenInBatch.add(uniqueKey);
        seenInBatch.add(skuKey);
        seenInBatch.add(modelKey);

        // Upsert in database
        const existingProducts = db.products.getAll();
        const existing = existingProducts.find(
          (p) =>
            (p.source === validatedProduct.source && p.sourceProductId && p.sourceProductId.toLowerCase() === validatedProduct.sourceProductId.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase() === validatedProduct.sku.toLowerCase()) ||
            (p.id && p.id.toLowerCase() === validatedProduct.id.toLowerCase()) ||
            (p.brand && p.model && p.brand.toLowerCase() === validatedProduct.brand.toLowerCase() && p.model.toLowerCase() === validatedProduct.model.toLowerCase())
        );

        if (existing) {
          // Update existing product
          db.products.update(existing.id, {
            ...validatedProduct,
            id: existing.id, // preserve original ID
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
          });
          report.updated++;
        } else {
          // Create new product
          db.products.create(validatedProduct);
          report.created++;
        }
      } catch (err: any) {
        report.invalid++;
        report.errors.push({
          row: rowNum,
          identifier: raw.name || raw.sku || `Row ${rowNum}`,
          message: err.message || 'Validation failed'
        });
      }
    }

    report.durationMs = Date.now() - startTime;
    return report;
  }

  /**
   * Ingest from file path (JSON or CSV).
   */
  public static async ingestFile(filePath: string): Promise<ImportReport> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Import file not found at: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const ext = path.extname(resolvedPath).toLowerCase();

    let records: RawProductInput[] = [];

    if (ext === '.json') {
      const parsed = JSON.parse(content);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } else if (ext === '.csv') {
      records = parseCSV(content);
    } else {
      throw new Error(`Unsupported file format '${ext}'. Please provide a .csv or .json file.`);
    }

    return this.ingestRecords(records);
  }
}
