import { db } from '../../database/db.js';

export interface EstimateDeliveryInput {
  productId: string;
  postalCode?: string;
  priority?: 'STANDARD' | 'EXPRESS';
}

export interface EstimateDeliveryOutput {
  productId: string;
  deliveryDays: number;
  estimatedDeliveryDate: string;
  shippingCarrier: string;
  shippingCost: number;
  isExpeditedAvailable: boolean;
}

export async function estimateDelivery(input: EstimateDeliveryInput): Promise<EstimateDeliveryOutput> {
  const product = db.products.getById(input.productId);
  let baseDays = product ? product.deliveryDays : 3;

  if (input.priority === 'EXPRESS' && baseDays > 1) {
    baseDays = Math.max(1, baseDays - 1);
  }

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + baseDays);

  return {
    productId: input.productId,
    deliveryDays: baseDays,
    estimatedDeliveryDate: estimatedDate.toISOString().split('T')[0],
    shippingCarrier: 'BlueDart Air Express Logistics',
    shippingCost: 0, // Free enterprise delivery
    isExpeditedAvailable: true
  };
}
