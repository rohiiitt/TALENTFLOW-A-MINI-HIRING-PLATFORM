import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { validatePurchase } from '../agent/tools/validate-purchase.tool.js';

export class OrderController {
  public static getAll(req: Request, res: Response): void {
    const orders = db.orders.getAll();
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  }

  public static getById(req: Request, res: Response): void {
    const id = req.params.id as string;
    const order = db.orders.getById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: `Order with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  }

  public static async validateOrder(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const order = db.orders.getById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: `Order with ID '${id}' not found`
      });
      return;
    }

    const session = db.sessions.getById(order.sessionId);
    const requirements = session?.extractedRequirements || {
      category: 'Laptops',
      budgetMax: 100000,
      currency: 'INR',
      quantity: order.quantity,
      hardConstraints: [],
      softPreferences: [],
      rawText: 'Direct order validation'
    };

    const result = await validatePurchase({
      orderId: order.id,
      expectedProductId: order.productId,
      requirements
    });

    res.json({
      success: true,
      data: result
    });
  }
}
