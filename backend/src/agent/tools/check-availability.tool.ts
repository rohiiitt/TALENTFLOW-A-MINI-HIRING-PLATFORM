import { db } from '../../database/db.js';

export interface CheckAvailabilityInput {
  productId: string;
  quantity?: number;
}

export interface CheckAvailabilityOutput {
  available: boolean;
  productId: string;
  requestedQuantity: number;
  currentStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export async function checkAvailability(input: CheckAvailabilityInput): Promise<CheckAvailabilityOutput> {
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
  const product = db.products.getById(input.productId);

  if (!product) {
    return {
      available: false,
      productId: input.productId,
      requestedQuantity: quantity,
      currentStock: 0,
      status: 'OUT_OF_STOCK'
    };
  }

  const stock = product.stock;
  const available = stock >= quantity;
  let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';

  if (stock === 0) {
    status = 'OUT_OF_STOCK';
  } else if (stock < 5) {
    status = 'LOW_STOCK';
  }

  return {
    available,
    productId: product.id,
    requestedQuantity: quantity,
    currentStock: stock,
    status
  };
}
