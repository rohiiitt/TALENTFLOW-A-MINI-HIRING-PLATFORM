import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/database/db.js';
import { placeOrder } from '../src/agent/tools/place-order.tool.js';
import { validatePurchase } from '../src/agent/tools/validate-purchase.tool.js';
import { ExtractedRequirements } from '../src/agent/agent.types.js';

describe('Order Execution & Independent Validation', () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  const sampleRequirements: ExtractedRequirements = {
    category: 'Laptops',
    budgetMax: 80000,
    currency: 'INR',
    quantity: 1,
    ramMinGb: 16,
    storageMinGb: 512,
    storageTypePreferred: 'SSD',
    hardConstraints: ['Budget ≤ 80k', 'RAM ≥ 16GB'],
    softPreferences: [],
    rawText: 'dev laptop under 80k'
  };

  it('placeOrder should create valid order and decrement product stock', async () => {
    const productBefore = db.products.getById('PROD-LEN-E14');
    const stockBefore = productBefore!.stock;

    const orderRes = await placeOrder({
      sessionId: 'SES-TEST-01',
      userId: 'USER-TEST',
      productId: 'PROD-LEN-E14',
      quantity: 2
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.orderId).toBeDefined();

    const productAfter = db.products.getById('PROD-LEN-E14');
    expect(productAfter!.stock).toBe(stockBefore - 2);

    const storedOrder = db.orders.getById(orderRes.orderId!);
    expect(storedOrder?.quantity).toBe(2);
    expect(storedOrder?.totalPrice).toBe(productBefore!.price * 2);
    expect(storedOrder?.status).toBe('CONFIRMED');
  });

  it('validatePurchase should succeed when order matches requirements', async () => {
    const orderRes = await placeOrder({
      sessionId: 'SES-TEST-02',
      userId: 'USER-TEST',
      productId: 'PROD-LEN-E14',
      quantity: 1
    });

    const validation = await validatePurchase({
      orderId: orderRes.orderId!,
      expectedProductId: 'PROD-LEN-E14',
      requirements: sampleRequirements
    });

    expect(validation.valid).toBe(true);
    expect(validation.report.overallStatus).toBe('PASSED');
    expect(validation.report.items.every((i) => i.passed)).toBe(true);
  });

  it('validatePurchase should fail when order violates budget or product mismatch', async () => {
    const orderRes = await placeOrder({
      sessionId: 'SES-TEST-03',
      userId: 'USER-TEST',
      productId: 'PROD-LEN-E14',
      quantity: 1
    });

    // Case A: Product Mismatch
    const mismatchRes = await validatePurchase({
      orderId: orderRes.orderId!,
      expectedProductId: 'PROD-ASUS-VIVO15', // different product expected
      requirements: sampleRequirements
    });

    expect(mismatchRes.valid).toBe(false);
    expect(mismatchRes.report.overallStatus).toBe('FAILED');
    const productCheck = mismatchRes.report.items.find((i) => i.criterion.includes('Product'));
    expect(productCheck?.passed).toBe(false);

    // Case B: Budget exceeded
    const tightBudget: ExtractedRequirements = {
      ...sampleRequirements,
      budgetMax: 50000 // Thinkpad price is 74,990 > 50,000
    };

    const budgetFailRes = await validatePurchase({
      orderId: orderRes.orderId!,
      expectedProductId: 'PROD-LEN-E14',
      requirements: tightBudget
    });

    expect(budgetFailRes.valid).toBe(false);
    const budgetCheck = budgetFailRes.report.items.find((i) => i.criterion.includes('Budget'));
    expect(budgetCheck?.passed).toBe(false);
  });
});
