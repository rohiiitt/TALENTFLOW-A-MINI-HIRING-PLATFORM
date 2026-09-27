import { db } from '../../database/db.js';
import { Order } from '../../database/schema.js';

export interface PlaceOrderInput {
  sessionId: string;
  userId: string;
  productId: string;
  quantity?: number;
  expectedPrice?: number; // Snapshot price approved by user/recommendation
  deliveryAddress?: string;
  simulateFailure?: boolean; // For negative resilience testing
}

export interface PlaceOrderOutput {
  success: boolean;
  orderId?: string;
  order?: Order;
  priceChanged?: boolean;
  previousPrice?: number;
  currentPrice?: number;
  error?: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
  const address = input.deliveryAddress || 'Tech Ops Hub, Suite 400, Electronic City, Bengaluru, KA 560100';

  if (input.simulateFailure) {
    return {
      success: false,
      error: 'Payment gateway rejected corporate card authorization (Simulated failure test)'
    };
  }

  const product = db.products.getById(input.productId);
  if (!product) {
    return {
      success: false,
      error: `Product with ID '${input.productId}' was not found in catalog`
    };
  }

  // Pre-purchase Price Change Re-check (Requirement #27)
  if (input.expectedPrice !== undefined && input.expectedPrice !== null) {
    if (product.price !== input.expectedPrice) {
      return {
        success: false,
        priceChanged: true,
        previousPrice: input.expectedPrice,
        currentPrice: product.price,
        error: `Price changed since recommendation. Previous price: ₹${input.expectedPrice.toLocaleString('en-IN')}, Current price: ₹${product.price.toLocaleString('en-IN')}. Buyer re-approval required.`
      };
    }
  }

  // Real-time stock verification (Requirement #26)
  if (product.stock < quantity) {
    return {
      success: false,
      error: `Insufficient stock for '${product.name}'. Requested: ${quantity}, Available: ${product.stock}`
    };
  }

  // Atomically decrement stock
  const stockDecremented = db.products.decrementStock(product.id, quantity);
  if (!stockDecremented) {
    return {
      success: false,
      error: `Failed to acquire stock reservation for '${product.name}'`
    };
  }

  const orderNumber = Math.floor(10000 + Math.random() * 90000);
  const orderId = `ORD-${orderNumber}`;
  const totalPrice = product.price * quantity;

  const newOrder: Order = {
    id: orderId,
    sessionId: input.sessionId,
    userId: input.userId,
    productId: product.id,
    productName: product.name,
    unitPrice: product.price,
    quantity,
    totalPrice,
    status: 'CONFIRMED',
    paymentStatus: 'SUCCESS',
    deliveryStatus: 'SCHEDULED',
    deliveryEstimateDays: product.deliveryDays,
    deliveryAddress: address,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const createdOrder = db.orders.create(newOrder);

  return {
    success: true,
    orderId: createdOrder.id,
    order: createdOrder
  };
}
