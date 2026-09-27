import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { AgentSession, AgentActionEntity } from '../database/schema.js';
import { NLPExtractor } from './nlp-extractor.js';
import { searchProducts } from './tools/search-products.tool.js';
import { getProductDetails } from './tools/product-details.tool.js';
import { checkAvailability } from './tools/check-availability.tool.js';
import { estimateDelivery } from './tools/estimate-delivery.tool.js';
import { compareProducts } from './tools/compare-products.tool.js';
import { placeOrder } from './tools/place-order.tool.js';
import { validatePurchase } from './tools/validate-purchase.tool.js';
import { ExtractedRequirements } from './agent.types.js';

export class AgentService {
  /**
   * Helper to log tool actions for auditability & live UI stream
   */
  private static recordAction(
    sessionId: string,
    stepNumber: number,
    toolName: string,
    input: any,
    output: any,
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    executionTimeMs: number,
    explanation: string
  ): AgentActionEntity {
    const action: AgentActionEntity = {
      id: uuidv4(),
      sessionId,
      stepNumber,
      toolName,
      input,
      output,
      status,
      executionTimeMs,
      explanation,
      timestamp: new Date().toISOString()
    };
    return db.actions.create(action);
  }

  /**
   * Create a new agent session from buyer request
   */
  public static createSession(userPrompt: string, userId: string = 'USER-DEV-01'): AgentSession {
    const session: AgentSession = {
      id: `SES-${Math.floor(100000 + Math.random() * 900000)}`,
      userId,
      userPrompt,
      extractedRequirements: null,
      status: 'REQUEST_RECEIVED',
      candidateProductIds: [],
      selectedProductId: null,
      decisionSummary: null,
      orderId: null,
      validationReport: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return db.sessions.create(session);
  }

  /**
   * Run the AI Purchasing Agent analysis, research, and decision-making pipeline.
   */
  public static async runInvestigation(sessionId: string): Promise<AgentSession> {
    const session = db.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    let step = 1;

    try {
      // STEP 1: Understand Buyer Request & Extract Requirements
      const t1 = Date.now();
      session.status = 'REQUIREMENTS_EXTRACTED';
      const requirements: ExtractedRequirements = await NLPExtractor.extract(session.userPrompt);
      session.extractedRequirements = requirements;
      db.sessions.update(session.id, {
        status: 'REQUIREMENTS_EXTRACTED',
        extractedRequirements: requirements
      });

      AgentService.recordAction(
        session.id,
        step++,
        'extractRequirements',
        { prompt: session.userPrompt },
        requirements,
        'SUCCESS',
        Date.now() - t1,
        `Extracted structured criteria: Budget max ₹${requirements.budgetMax?.toLocaleString('en-IN') || 'Unlimited'}, Min RAM: ${requirements.ramMinGb || 'Any'}GB, Storage: ${requirements.storageMinGb || 'Any'}GB, UseCase: ${requirements.useCase || 'General'}`
      );

      // STEP 2: Investigate Available Products in Catalog
      const t2 = Date.now();
      session.status = 'RESEARCHING';
      db.sessions.update(session.id, { status: 'RESEARCHING' });

      const searchResult = await searchProducts({
        category: requirements.category,
        keyword: requirements.useCase?.includes('Machine') ? 'machine-learning' : undefined
      });

      AgentService.recordAction(
        session.id,
        step++,
        'searchProducts',
        { category: requirements.category, broadSearch: true },
        { totalFound: searchResult.totalMatches, productNames: searchResult.products.map((p) => p.name) },
        'SUCCESS',
        Date.now() - t2,
        `Scanned entire product catalog in category '${requirements.category}'. Discovered ${searchResult.totalMatches} prospective models for deep evaluation.`
      );

      if (searchResult.totalMatches === 0) {
        db.sessions.update(session.id, {
          status: 'FAILED',
          errorMessage: 'No matching products found in the catalog for the requested category.'
        });
        return db.sessions.getById(session.id)!;
      }

      session.candidateProductIds = searchResult.products.map((p) => p.id);
      session.status = 'OPTIONS_FOUND';
      db.sessions.update(session.id, {
        candidateProductIds: session.candidateProductIds,
        status: 'OPTIONS_FOUND'
      });

      // STEP 3: Deep Specs & Real-Time Availability Checks
      const t3 = Date.now();
      const availabilityChecks = await Promise.all(
        searchResult.products.map(async (p) => {
          const avail = await checkAvailability({ productId: p.id, quantity: requirements.quantity });
          const delivery = await estimateDelivery({ productId: p.id });
          return { productId: p.id, avail, delivery };
        })
      );

      AgentService.recordAction(
        session.id,
        step++,
        'checkAvailabilityAndDelivery',
        { productCount: searchResult.products.length, requiredQuantity: requirements.quantity },
        availabilityChecks.map((c) => ({
          productId: c.productId,
          stock: c.avail.currentStock,
          deliveryDays: c.delivery.deliveryDays
        })),
        'SUCCESS',
        Date.now() - t3,
        `Audited live inventory and delivery estimates across all ${searchResult.products.length} catalog candidates.`
      );

      // STEP 4: Compare Products & Multi-Criteria Decision Analysis
      const t4 = Date.now();
      session.status = 'OPTIONS_COMPARED';
      db.sessions.update(session.id, { status: 'OPTIONS_COMPARED' });

      const comparison = await compareProducts({
        productIds: session.candidateProductIds,
        requirements
      });

      AgentService.recordAction(
        session.id,
        step++,
        'compareProducts',
        {
          candidatesEvaluated: comparison.evaluatedCount,
          hardConstraints: requirements.hardConstraints
        },
        {
          topPick: comparison.topRecommendation?.productName,
          topScore: comparison.topRecommendation?.totalWeightedScore,
          eliminatedCount: comparison.decisionSummary?.productsEliminatedCount
        },
        'SUCCESS',
        Date.now() - t4,
        `Executed multi-criteria scoring matrix. ${comparison.decisionSummary?.productsEliminatedCount || 0} models eliminated due to budget or spec constraints. Top candidate: '${comparison.topRecommendation?.productName || 'None'}'`
      );

      // STEP 5: Decision & Recommendation Summary
      if (!comparison.topRecommendation || !comparison.decisionSummary) {
        db.sessions.update(session.id, {
          status: 'FAILED',
          decisionSummary: comparison.decisionSummary,
          errorMessage: 'No candidates satisfied all hard constraints (budget/specs/availability).'
        });
        return db.sessions.getById(session.id)!;
      }

      const topProduct = comparison.topRecommendation;
      session.selectedProductId = topProduct.productId;
      session.decisionSummary = comparison.decisionSummary;
      session.status = 'WAITING_APPROVAL';

      db.sessions.update(session.id, {
        selectedProductId: topProduct.productId,
        decisionSummary: comparison.decisionSummary,
        status: 'WAITING_APPROVAL'
      });

      AgentService.recordAction(
        session.id,
        step++,
        'formulateRecommendation',
        { selectedProductId: topProduct.productId, productName: topProduct.productName },
        {
          price: topProduct.price,
          confidence: comparison.decisionSummary.confidenceScore,
          reasons: comparison.decisionSummary.keyReasonsForSelection
        },
        'SUCCESS',
        10,
        `Formulated recommendation: '${topProduct.productName}' at ₹${topProduct.price.toLocaleString('en-IN')}. Pausing for buyer confirmation before placing the order.`
      );

      return db.sessions.getById(session.id)!;
    } catch (err: any) {
      console.error('Agent execution error:', err);
      db.sessions.update(session.id, {
        status: 'FAILED',
        errorMessage: err.message || 'An unexpected error occurred during agent research.'
      });
      return db.sessions.getById(session.id)!;
    }
  }

  /**
   * Execute the purchase action and trigger independent post-purchase validation.
   */
  public static async executePurchaseAndValidate(
    sessionId: string,
    options?: { deliveryAddress?: string; simulateFailure?: boolean }
  ): Promise<AgentSession> {
    const session = db.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.selectedProductId || !session.extractedRequirements) {
      throw new Error('Session is not in a valid state to execute purchase (no product selected)');
    }

    let step = (db.actions.getBySessionId(sessionId).length || 5) + 1;

    // STEP 6: Execute Purchase Action
    const t5 = Date.now();
    db.sessions.update(session.id, { status: 'PURCHASE_INITIATED' });

    const selectedEvaluation = session.decisionSummary?.scoringMatrix?.find(
      (e) => e.productId === session.selectedProductId
    );

    const orderResult = await placeOrder({
      sessionId: session.id,
      userId: session.userId,
      productId: session.selectedProductId,
      quantity: session.extractedRequirements.quantity,
      expectedPrice: selectedEvaluation?.price,
      deliveryAddress: options?.deliveryAddress,
      simulateFailure: options?.simulateFailure
    });

    if (!orderResult.success || !orderResult.orderId) {
      AgentService.recordAction(
        session.id,
        step++,
        'placeOrder',
        { productId: session.selectedProductId, quantity: session.extractedRequirements.quantity },
        { error: orderResult.error },
        'FAILED',
        Date.now() - t5,
        `Order placement failed: ${orderResult.error}`
      );

      db.sessions.update(session.id, {
        status: 'FAILED',
        errorMessage: orderResult.error || 'Failed to place order'
      });
      return db.sessions.getById(session.id)!;
    }

    session.orderId = orderResult.orderId;
    session.status = 'PURCHASE_COMPLETED';
    db.sessions.update(session.id, {
      orderId: orderResult.orderId,
      status: 'PURCHASE_COMPLETED'
    });

    AgentService.recordAction(
      session.id,
      step++,
      'placeOrder',
      {
        productId: session.selectedProductId,
        quantity: session.extractedRequirements.quantity,
        price: orderResult.order?.unitPrice
      },
      { orderId: orderResult.orderId, status: orderResult.order?.status },
      'SUCCESS',
      Date.now() - t5,
      `Successfully created order ${orderResult.orderId} for ₹${orderResult.order?.totalPrice.toLocaleString('en-IN')}. Inventory stock decremented.`
    );

    // STEP 7: Independent Validation Step
    const t6 = Date.now();
    db.sessions.update(session.id, { status: 'VALIDATING' });

    const validation = await validatePurchase({
      orderId: orderResult.orderId,
      expectedProductId: session.selectedProductId,
      requirements: session.extractedRequirements
    });

    session.validationReport = validation.report;
    session.status = validation.valid ? 'VALIDATED' : 'FAILED';
    db.sessions.update(session.id, {
      validationReport: validation.report,
      status: validation.valid ? 'VALIDATED' : 'FAILED',
      errorMessage: validation.valid ? null : 'Post-purchase independent validation failed.'
    });

    AgentService.recordAction(
      session.id,
      step++,
      'validatePurchase',
      { orderId: orderResult.orderId, checksCount: validation.report.items.length },
      validation.report,
      validation.valid ? 'SUCCESS' : 'FAILED',
      Date.now() - t6,
      `Completed post-purchase validation checklist. Result: ${validation.report.overallStatus} (${validation.report.items.filter((i) => i.passed).length}/${validation.report.items.length} checks passed).`
    );

    return db.sessions.getById(session.id)!;
  }
}
