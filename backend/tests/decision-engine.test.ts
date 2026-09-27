import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/database/db.js';
import { DecisionEngine } from '../src/agent/decision-engine.js';
import { ExtractedRequirements } from '../src/agent/agent.types.js';

describe('Decision Engine & Multi-Criteria Scoring', () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  const devRequirements: ExtractedRequirements = {
    category: 'Laptops',
    budgetMax: 80000,
    currency: 'INR',
    quantity: 1,
    ramMinGb: 16,
    storageMinGb: 512,
    storageTypePreferred: 'SSD',
    useCase: 'Software Development',
    preferredBrands: ['Lenovo', 'Dell'],
    maxDeliveryDays: 3,
    minRating: 4.0,
    batteryHoursMin: 8,
    hardConstraints: ['Budget ≤ ₹80,000', 'RAM ≥ 16GB', 'Storage ≥ 512GB SSD'],
    softPreferences: ['Fast compile CPU', 'Long battery life', 'Brand: Lenovo / Dell'],
    rawText: 'I need a laptop under ₹80,000 for software development, preferably 16GB RAM, 512GB SSD and good battery life.'
  };

  it('should eliminate products that violate budget ceiling', () => {
    const products = db.products.getAll();
    const { evaluations } = DecisionEngine.evaluateCandidates(products, devRequirements);

    const overBudgetItems = evaluations.filter((e) => e.price > devRequirements.budgetMax!);
    expect(overBudgetItems.length).toBeGreaterThan(0);
    overBudgetItems.forEach((item) => {
      expect(item.hardConstraintsPass).toBe(false);
      expect(item.eliminationReason).toContain('Budget Ceiling Failed');
    });
  });

  it('should eliminate products that have less than required RAM', () => {
    // Add a model with 8GB RAM to test RAM constraint
    db.products.create({
      id: 'TEST-LOW-RAM',
      sku: 'TEST-RAM-8GB',
      name: 'Budget 8GB Laptop',
      brand: 'Generic',
      model: 'Eco 8',
      category: 'Laptops',
      description: 'Entry level 8GB RAM model',
      price: 45000,
      currency: 'INR',
      priceType: 'IMPORTED_ESTIMATE',
      priceUpdatedAt: new Date().toISOString(),
      availabilityStatus: 'IN_STOCK',
      stock: 10,
      stockUpdatedAt: new Date().toISOString(),
      stockType: 'IMPORTED',
      rating: 4.1,
      reviewsCount: 100,
      deliveryDays: 2,
      deliveryType: 'ESTIMATED',
      warrantyYears: 1,
      imageUrl: 'https://example.com/img.jpg',
      source: 'IMPORTED_CATALOG',
      sourceProductId: 'TEST-RAM-8GB',
      lastVerifiedAt: new Date().toISOString(),
      specifications: {
        cpu: 'Intel Core i3',
        ram: '8GB DDR4',
        ramGb: 8,
        storage: '256GB SSD',
        storageGb: 256,
        storageType: 'SSD',
        gpu: 'Integrated',
        display: '14" FHD',
        batteryHours: 6,
        weightKg: 1.4,
        os: 'Windows 11'
      },
      tags: ['budget'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const products = db.products.getAll();
    const { evaluations } = DecisionEngine.evaluateCandidates(products, devRequirements);

    const lowRamItem = evaluations.find((e) => e.productId === 'TEST-LOW-RAM');
    expect(lowRamItem).toBeDefined();
    expect(lowRamItem?.hardConstraintsPass).toBe(false);
    expect(lowRamItem?.eliminationReason).toContain('Minimum RAM Failed');
  });

  it('should eliminate products that are out of stock', () => {
    // Add an out-of-stock model to test stock constraint
    db.products.create({
      id: 'TEST-OOS-PROD',
      sku: 'TEST-OOS-01',
      name: 'Out of Stock Workstation',
      brand: 'Lenovo',
      model: 'OOS ThinkPad',
      category: 'Laptops',
      description: 'Zero stock laptop model',
      price: 72000,
      currency: 'INR',
      priceType: 'IMPORTED_ESTIMATE',
      priceUpdatedAt: new Date().toISOString(),
      availabilityStatus: 'OUT_OF_STOCK',
      stock: 0,
      stockUpdatedAt: new Date().toISOString(),
      stockType: 'IMPORTED',
      rating: 4.8,
      reviewsCount: 200,
      deliveryDays: 2,
      deliveryType: 'ESTIMATED',
      warrantyYears: 3,
      imageUrl: 'https://example.com/img.jpg',
      source: 'IMPORTED_CATALOG',
      sourceProductId: 'TEST-OOS-01',
      lastVerifiedAt: new Date().toISOString(),
      specifications: {
        cpu: 'Intel Core i5',
        ram: '16GB DDR5',
        ramGb: 16,
        storage: '512GB SSD',
        storageGb: 512,
        storageType: 'SSD',
        gpu: 'Integrated',
        display: '14" FHD',
        batteryHours: 9,
        weightKg: 1.4,
        os: 'Windows 11'
      },
      tags: ['thinkpad'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const products = db.products.getAll();
    const { evaluations } = DecisionEngine.evaluateCandidates(products, devRequirements);

    const outOfStockItem = evaluations.find((e) => e.productId === 'TEST-OOS-PROD');
    expect(outOfStockItem).toBeDefined();
    expect(outOfStockItem?.hardConstraintsPass).toBe(false);
    expect(outOfStockItem?.eliminationReason).toContain('Stock Availability Failed');
  });

  it('should dynamically select the top passing product satisfying all constraints', () => {
    const products = db.products.getAll();
    const { evaluations, decisionSummary } = DecisionEngine.evaluateCandidates(products, devRequirements);

    expect(decisionSummary).not.toBeNull();
    expect(decisionSummary?.selectedProductId).toBeDefined();
    expect(decisionSummary?.keyReasonsForSelection.length).toBeGreaterThan(0);

    const winnerEval = evaluations.find((e) => e.productId === decisionSummary?.selectedProductId);
    expect(winnerEval?.hardConstraintsPass).toBe(true);
    expect(winnerEval?.price).toBeLessThanOrEqual(80000);
    expect(winnerEval?.stock).toBeGreaterThanOrEqual(1);
  });
});
