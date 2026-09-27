import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/database/db.js';
import { searchProducts } from '../src/agent/tools/search-products.tool.js';
import { getProductDetails } from '../src/agent/tools/product-details.tool.js';
import { checkAvailability } from '../src/agent/tools/check-availability.tool.js';
import { estimateDelivery } from '../src/agent/tools/estimate-delivery.tool.js';

describe('AI Purchasing Agent Tools', () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  it('searchProducts should filter products by category and maxPrice', async () => {
    const res = await searchProducts({
      category: 'Laptops',
      maxPrice: 80000
    });

    expect(res.totalMatches).toBeGreaterThan(0);
    res.products.forEach((p) => {
      expect(p.price).toBeLessThanOrEqual(80000);
      expect(p.category.toLowerCase()).toBe('laptops');
    });
  });

  it('searchProducts should filter products by minimum RAM', async () => {
    const res = await searchProducts({
      minRamGb: 16
    });

    expect(res.totalMatches).toBeGreaterThan(0);
    res.products.forEach((p) => {
      expect(p.specifications.ramGb).toBeGreaterThanOrEqual(16);
    });
  });

  it('getProductDetails should return complete specs for valid ID', async () => {
    const res = await getProductDetails({ productId: 'PROD-LEN-E14' });
    expect(res.found).toBe(true);
    expect(res.product?.name).toContain('ThinkPad');
    expect(res.specSummary).toContain('16GB DDR5');
  });

  it('checkAvailability should report correct stock and detect out of stock', async () => {
    const inStock = await checkAvailability({ productId: 'PROD-LEN-E14', quantity: 2 });
    expect(inStock.available).toBe(true);
    expect(inStock.status).toBe('IN_STOCK');

    const outOfStock = await checkAvailability({ productId: 'PROD-ASUS-TUF-A15', quantity: 1 });
    expect(outOfStock.available).toBe(false);
    expect(outOfStock.status).toBe('OUT_OF_STOCK');
  });

  it('estimateDelivery should calculate delivery date and handle express priority', async () => {
    const std = await estimateDelivery({ productId: 'PROD-LEN-E14', priority: 'STANDARD' });
    expect(std.deliveryDays).toBe(2);
    expect(std.estimatedDeliveryDate).toBeDefined();

    const express = await estimateDelivery({ productId: 'PROD-LEN-E14', priority: 'EXPRESS' });
    expect(express.deliveryDays).toBe(1);
  });
});
