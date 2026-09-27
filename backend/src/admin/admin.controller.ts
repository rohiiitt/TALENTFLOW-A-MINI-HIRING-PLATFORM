import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { Product } from '../database/schema.js';
import { CatalogImporter } from '../catalog/importer.js';

export class AdminController {
  // Get high-level procurement KPIs and metrics
  public static getMetrics(req: Request, res: Response): void {
    const stats = db.getAdminStats();
    res.json({
      success: true,
      data: stats
    });
  }

  // Get all registered users
  public static getUsers(req: Request, res: Response): void {
    const users = db.users.getAll();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  }

  // Create new catalog product
  public static createProduct(req: Request, res: Response): void {
    try {
      const validated = CatalogImporter.normalizeAndValidate(req.body, 1);
      const created = db.products.create(validated);

      res.status(201).json({
        success: true,
        message: 'Product added to catalog successfully',
        data: created
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create product'
      });
    }
  }

  // Update existing product
  public static updateProduct(req: Request, res: Response): void {
    const id = req.params.id as string;
    const updates = req.body;

    const updated = db.products.update(id, updates);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  }

  // Delete product
  public static deleteProduct(req: Request, res: Response): void {
    const id = req.params.id as string;
    const deleted = db.products.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product removed from catalog'
    });
  }

  // Update order delivery/fulfillment status
  public static updateOrderStatus(req: Request, res: Response): void {
    const id = req.params.id as string;
    const { status, deliveryStatus, paymentStatus } = req.body;

    const updated = db.orders.update(id, {
      status,
      deliveryStatus,
      paymentStatus
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: `Order with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updated
    });
  }

  // Get all agent purchasing sessions
  public static getSessions(req: Request, res: Response): void {
    const sessions = db.sessions.getAll();
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  }
}
