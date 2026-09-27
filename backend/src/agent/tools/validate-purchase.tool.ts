import { db } from '../../database/db.js';
import { ExtractedRequirements, ValidationReport, ValidationItem } from '../agent.types.js';

export interface ValidatePurchaseInput {
  orderId: string;
  expectedProductId: string;
  requirements: ExtractedRequirements;
  prePurchaseStock?: number;
}

export interface ValidatePurchaseOutput {
  valid: boolean;
  report: ValidationReport;
}

export async function validatePurchase(input: ValidatePurchaseInput): Promise<ValidatePurchaseOutput> {
  const order = db.orders.getById(input.orderId);
  const items: ValidationItem[] = [];

  // Check 1: Order Exists
  const orderExists = !!order;
  items.push({
    criterion: 'Order Record Exists in Database',
    passed: orderExists,
    expected: `Valid Order ID (${input.orderId})`,
    actual: orderExists ? `Found order with ID ${order?.id}` : 'Order record NOT found in database',
    details: 'Verified order existence against core database store'
  });

  if (!order) {
    const report: ValidationReport = {
      orderId: input.orderId,
      validatedAt: new Date().toISOString(),
      overallStatus: 'FAILED',
      items,
      summary: 'Validation failed: Order does not exist in database.'
    };
    return { valid: false, report };
  }

  // Check 2: Product ID Match
  const expectedProd = db.products.getById(input.expectedProductId);
  const productMatch = Boolean(order.productId === input.expectedProductId || (expectedProd && order.productId === expectedProd.id));
  items.push({
    criterion: 'Product Identification Match',
    passed: productMatch,
    expected: expectedProd?.name || input.expectedProductId,
    actual: order.productName || order.productId,
    details: productMatch
      ? `Ordered item '${order.productName}' precisely matches recommended candidate`
      : `Product mismatch: expected ${input.expectedProductId} but got ${order.productId}`
  });

  // Check 3: Quantity Match
  const expectedQty = input.requirements.quantity || 1;
  const quantityMatch = order.quantity === expectedQty;
  items.push({
    criterion: 'Purchased Quantity Verification',
    passed: quantityMatch,
    expected: expectedQty,
    actual: order.quantity,
    details: quantityMatch
      ? `Quantity (${order.quantity}) exactly matches requested count`
      : `Quantity mismatch: expected ${expectedQty}, got ${order.quantity}`
  });

  // Check 4: Budget Compliance
  const budgetPass =
    !input.requirements.budgetMax || order.unitPrice <= input.requirements.budgetMax;
  items.push({
    criterion: 'Budget Ceiling Compliance',
    passed: budgetPass,
    expected: input.requirements.budgetMax
      ? `≤ ₹${input.requirements.budgetMax.toLocaleString('en-IN')}`
      : 'Any',
    actual: `₹${order.unitPrice.toLocaleString('en-IN')}`,
    details: budgetPass
      ? `Unit price ₹${order.unitPrice.toLocaleString('en-IN')} is within approved budget`
      : `Price ₹${order.unitPrice.toLocaleString('en-IN')} exceeds approved budget of ₹${input.requirements.budgetMax?.toLocaleString('en-IN')}`
  });

  // Check 5: Payment & Order Status
  const statusPass = order.status === 'CONFIRMED' && order.paymentStatus === 'SUCCESS';
  items.push({
    criterion: 'Order & Payment Status',
    passed: statusPass,
    expected: 'Status: CONFIRMED, Payment: SUCCESS',
    actual: `Status: ${order.status}, Payment: ${order.paymentStatus}`,
    details: statusPass
      ? 'Payment authorized and order confirmed with vendor'
      : 'Order status or payment failed to confirm'
  });

  // Check 6: Specification Compliance
  const product = db.products.getById(order.productId);
  let specsPass = true;
  let specsActual = '';
  let specsExpected = '';

  if (product) {
    if (input.requirements.ramMinGb && product.specifications.ramGb < input.requirements.ramMinGb) {
      specsPass = false;
    }
    if (input.requirements.storageMinGb && product.specifications.storageGb < input.requirements.storageMinGb) {
      specsPass = false;
    }
    specsActual = `${product.specifications.ramGb}GB RAM, ${product.specifications.storageGb}GB SSD`;
    specsExpected = `≥${input.requirements.ramMinGb || 0}GB RAM, ≥${input.requirements.storageMinGb || 0}GB SSD`;
  } else {
    specsPass = false;
    specsActual = 'Product missing';
    specsExpected = 'Valid product specifications';
  }

  items.push({
    criterion: 'Hardware Specification Conformance',
    passed: specsPass,
    expected: specsExpected,
    actual: specsActual,
    details: specsPass
      ? 'Purchased hardware strictly meets buyer technical specifications'
      : 'Hardware failed to satisfy minimum required RAM/Storage constraints'
  });

  // Check 7: Delivery Estimate Valid
  const deliveryPass =
    order.deliveryEstimateDays > 0 &&
    (!input.requirements.maxDeliveryDays ||
      order.deliveryEstimateDays <= input.requirements.maxDeliveryDays);
  items.push({
    criterion: 'Delivery Schedule Confirmation',
    passed: deliveryPass,
    expected: input.requirements.maxDeliveryDays
      ? `≤ ${input.requirements.maxDeliveryDays} days`
      : 'Valid estimated window',
    actual: `${order.deliveryEstimateDays} business days (${order.deliveryStatus})`,
    details: deliveryPass
      ? `Delivery window estimated within SLA to: ${order.deliveryAddress}`
      : 'Delivery timeline exceeds buyer constraint'
  });

  const allPassed = items.every((i) => i.passed);

  const report: ValidationReport = {
    orderId: order.id,
    validatedAt: new Date().toISOString(),
    overallStatus: allPassed ? 'PASSED' : 'FAILED',
    items,
    summary: allPassed
      ? `All ${items.length} post-purchase validation criteria PASSED with 100% compliance.`
      : `Validation FAILED: ${items.filter((i) => !i.passed).length} checks failed.`
  };

  return {
    valid: allPassed,
    report
  };
}
