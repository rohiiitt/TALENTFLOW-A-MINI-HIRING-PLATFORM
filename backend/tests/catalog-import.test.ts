import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/database/db.js';
import { CatalogImporter, parseCSV, normalizeRamGb, normalizeStorageGb } from '../src/catalog/importer.js';
import { searchProducts } from '../src/agent/tools/search-products.tool.js';
import { placeOrder } from '../src/agent/tools/place-order.tool.js';
import { DecisionEngine } from '../src/agent/decision-engine.js';
import { ExtractedRequirements } from '../src/agent/agent.types.js';

describe('Real Scalable Product Catalog & Ingestion Engine', () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  describe('Data Normalization Utilities', () => {
    it('should normalize varied RAM representations into numerical GB', () => {
      expect(normalizeRamGb('16 GB')).toBe(16);
      expect(normalizeRamGb('16GB DDR5 5200MHz')).toBe(16);
      expect(normalizeRamGb('32 gb')).toBe(32);
      expect(normalizeRamGb(64)).toBe(64);
      expect(normalizeRamGb('8GB')).toBe(8);
    });

    it('should normalize varied storage formats into numerical GB', () => {
      expect(normalizeStorageGb('512 GB SSD')).toBe(512);
      expect(normalizeStorageGb('512GB NVMe')).toBe(512);
      expect(normalizeStorageGb('1 TB SSD')).toBe(1024);
      expect(normalizeStorageGb('1TB PCIe 4.0 NVMe')).toBe(1024);
      expect(normalizeStorageGb('2TB NVMe')).toBe(2048);
    });

    it('should parse CSV lines with quoted commas and escapes correctly', () => {
      const csv = `sku,name,price\nTEST-01,"Product with, comma",50000\nTEST-02,"Product ""Quotes""",60000`;
      const rows = parseCSV(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].name).toBe('Product with, comma');
      expect(rows[0].price).toBe('50000');
      expect(rows[1].name).toBe('Product "Quotes"');
    });
  });

  describe('Bulk Product Ingestion & Validation', () => {
    it('should ingest valid product records with source metadata', async () => {
      const sample = [
        {
          sku: 'DELL-LAT-7440',
          name: 'Dell Latitude 7440 Ultralight',
          brand: 'Dell',
          model: 'Latitude 7440',
          category: 'Laptops',
          price: 89990,
          stock: 12,
          source: 'MANUFACTURER',
          sourceProductId: 'LAT7440-UL',
          ramGb: '16GB',
          storageGb: '512GB'
        }
      ];

      const report = await CatalogImporter.ingestRecords(sample);
      expect(report.totalRows).toBe(1);
      expect(report.created + report.updated).toBe(1);
      expect(report.invalid).toBe(0);

      const found = db.products.getById('DELL-LAT-7440');
      expect(found).not.toBeNull();
      expect(found?.source).toBe('MANUFACTURER');
      expect(found?.sourceProductId).toBe('LAT7440-UL');
    });

    it('should reject invalid records with negative prices, stocks, or ratings', async () => {
      const invalidRecords = [
        {
          name: 'Negative Price Laptop',
          price: -50000,
          stock: 10
        },
        {
          name: 'Invalid Rating Laptop',
          price: 50000,
          rating: 15
        },
        {
          name: 'Negative Stock Laptop',
          price: 50000,
          stock: -5
        }
      ];

      const report = await CatalogImporter.ingestRecords(invalidRecords);
      expect(report.invalid).toBe(3);
      expect(report.errors.length).toBe(3);
      expect(report.errors[0].message).toContain('price');
      expect(report.errors[1].message).toContain('rating');
      expect(report.errors[2].message).toContain('stock');
    });

    it('should be idempotent and update existing records on re-import without duplicating', async () => {
      const record = {
        sku: 'TEST-IDEM-01',
        name: 'Idempotency Test Model',
        brand: 'TestBrand',
        model: 'Model Alpha',
        category: 'Laptops',
        price: 55000,
        stock: 5,
        source: 'RETAILER_API',
        sourceProductId: 'SRC-IDEM-01'
      };

      // 1st run: created
      const report1 = await CatalogImporter.ingestRecords([record]);
      expect(report1.created).toBe(1);

      // 2nd run with updated price: updated
      const updatedRecord = { ...record, price: 52000, stock: 8 };
      const report2 = await CatalogImporter.ingestRecords([updatedRecord]);
      expect(report2.updated).toBe(1);
      expect(report2.created).toBe(0);

      // Check DB
      const found = db.products.getById('TEST-IDEM-01');
      expect(found?.price).toBe(52000);
      expect(found?.stock).toBe(8);
    });
  });

  describe('Catalog Search & Filters', () => {
    it('should filter by category, brand, min/max price, RAM, and keyword', async () => {
      const searchRes = await searchProducts({
        category: 'Laptops',
        minRamGb: 16,
        maxPrice: 85000,
        keyword: 'ThinkPad'
      });

      expect(searchRes.totalMatches).toBeGreaterThan(0);
      searchRes.products.forEach((p) => {
        expect(p.category.toLowerCase()).toBe('laptops');
        expect(p.specifications.ramGb).toBeGreaterThanOrEqual(16);
        expect(p.price).toBeLessThanOrEqual(85000);
        expect(p.name.toLowerCase() + p.description.toLowerCase()).toContain('thinkpad');
      });
    });

    it('should support paginated results without full catalog dump', () => {
      const paginated = db.products.searchPaginated({
        category: 'Laptops',
        page: 1,
        limit: 3
      });

      expect(paginated.products.length).toBeLessThanOrEqual(3);
      expect(paginated.page).toBe(1);
      expect(paginated.limit).toBe(3);
      expect(paginated.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Pre-Purchase Safety & Price Change Re-check', () => {
    it('should reject purchase when price changes between recommendation snapshot and order placement', async () => {
      const product = db.products.getAll()[0];
      const snapshotPrice = product.price;

      // Simulate catalog price increase in DB right before order
      db.products.update(product.id, { price: snapshotPrice + 5000 });

      const orderRes = await placeOrder({
        sessionId: 'SES-PRICE-TEST',
        userId: 'USER-TEST',
        productId: product.id,
        quantity: 1,
        expectedPrice: snapshotPrice // Old approved price
      });

      expect(orderRes.success).toBe(false);
      expect(orderRes.priceChanged).toBe(true);
      expect(orderRes.previousPrice).toBe(snapshotPrice);
      expect(orderRes.currentPrice).toBe(snapshotPrice + 5000);
      expect(orderRes.error).toContain('Price changed');
    });

    it('should reject purchase when stock is insufficient', async () => {
      const product = db.products.getAll()[0];
      db.products.update(product.id, { stock: 2 });

      const orderRes = await placeOrder({
        sessionId: 'SES-STOCK-TEST',
        userId: 'USER-TEST',
        productId: product.id,
        quantity: 5 // Requests more than available
      });

      expect(orderRes.success).toBe(false);
      expect(orderRes.error).toContain('Insufficient stock');
    });
  });

  describe('Dynamic DecisionEngine Winner Calculation', () => {
    it('should dynamically calculate winning product based on criteria rather than hardcoding', () => {
      const products = db.products.getAll();

      // High Performance ML usecase with high budget
      const mlRequirements: ExtractedRequirements = {
        category: 'Laptops',
        budgetMax: 180000,
        currency: 'INR',
        quantity: 1,
        ramMinGb: 32,
        storageMinGb: 1024,
        storageTypePreferred: 'SSD',
        useCase: 'Machine Learning & High Compute Workstation',
        hardConstraints: ['Budget ≤ 180k', 'RAM ≥ 32GB', 'Storage ≥ 1TB'],
        softPreferences: ['CUDA GPU', 'Fast CPU'],
        rawText: 'High compute developer workstation with 32GB RAM and 1TB SSD'
      };

      const { evaluations, decisionSummary } = DecisionEngine.evaluateCandidates(products, mlRequirements);
      expect(decisionSummary).not.toBeNull();
      expect(decisionSummary?.selectedProductId).toBeDefined();

      const winner = evaluations.find((e) => e.productId === decisionSummary?.selectedProductId);
      expect(winner?.hardConstraintsPass).toBe(true);
      expect(winner?.totalWeightedScore).toBeGreaterThan(0);
    });
  });
});
