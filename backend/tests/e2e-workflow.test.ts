import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/database/db.js';
import { AgentService } from '../src/agent/agent.service.js';

describe('Complete AI Purchasing Agent End-to-End Workflow', () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  it('should execute full 8-step lifecycle: Prompt -> Extract -> Search -> Compare -> Recommend -> Purchase -> Validate', async () => {
    const userPrompt = 'I need a Lenovo ThinkPad under ₹80,000 for software development, preferably 16GB RAM, 512GB SSD and good battery life.';

    // 1. Initiate Session
    const initialSession = AgentService.createSession(userPrompt, 'USER-DEV-01');
    expect(initialSession.id).toBeDefined();
    expect(initialSession.status).toBe('REQUEST_RECEIVED');

    // 2. Run Investigation & Decision Engine
    const investigatedSession = await AgentService.runInvestigation(initialSession.id);
    expect(investigatedSession.status).toBe('WAITING_APPROVAL');
    expect(investigatedSession.extractedRequirements).not.toBeNull();
    expect(investigatedSession.extractedRequirements?.budgetMax).toBe(80000);
    expect(investigatedSession.selectedProductId).toContain('PROD-LEN-E14');
    expect(investigatedSession.decisionSummary?.productsEliminatedCount).toBeGreaterThan(0);

    // Verify Action Logs were recorded for investigation steps
    const actionsMid = db.actions.getBySessionId(initialSession.id);
    expect(actionsMid.length).toBeGreaterThanOrEqual(4);
    expect(actionsMid.map((a) => a.toolName)).toContain('extractRequirements');
    expect(actionsMid.map((a) => a.toolName)).toContain('searchProducts');
    expect(actionsMid.map((a) => a.toolName)).toContain('compareProducts');

    // 3. User Confirms Purchase
    const stockBefore = db.products.getById(investigatedSession.selectedProductId!)!.stock;
    const finalSession = await AgentService.executePurchaseAndValidate(investigatedSession.id, {
      deliveryAddress: 'Main Engineering Center, Block B, Bangalore'
    });

    // 4. Validate Final Outcomes
    expect(finalSession.status).toBe('VALIDATED');
    expect(finalSession.orderId).toBeDefined();
    expect(finalSession.validationReport).not.toBeNull();
    expect(finalSession.validationReport?.overallStatus).toBe('PASSED');
    expect(finalSession.validationReport?.items.length).toBeGreaterThanOrEqual(6);

    // Verify Database State Mutations
    const finalOrder = db.orders.getById(finalSession.orderId!);
    expect(finalOrder).not.toBeNull();
    expect(finalOrder?.productId).toBe(investigatedSession.selectedProductId);
    expect(finalOrder?.status).toBe('CONFIRMED');

    const stockAfter = db.products.getById(investigatedSession.selectedProductId!)!.stock;
    expect(stockAfter).toBe(stockBefore - 1);

    // Check complete auditable history
    const allActions = db.actions.getBySessionId(initialSession.id);
    expect(allActions.map((a) => a.toolName)).toContain('placeOrder');
    expect(allActions.map((a) => a.toolName)).toContain('validatePurchase');
  });
});
