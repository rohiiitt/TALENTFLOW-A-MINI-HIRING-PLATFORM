import { db } from '../../database/db.js';
import { Order } from '../../database/schema.js';

export interface GetOrderStatusInput {
  orderId: string;
}

export interface GetOrderStatusOutput {
  found: boolean;
  order: Order | null;
}

export async function getOrderStatus(input: GetOrderStatusInput): Promise<GetOrderStatusOutput> {
  const order = db.orders.getById(input.orderId);
  return {
    found: order !== null,
    order
  };
}
