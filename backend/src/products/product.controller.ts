import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { CatalogImporter, parseCSV } from '../catalog/importer.js';

export class ProductController {
  /**
   * GET /api/products
   * Supports pagination, keyword search, and granular filters.
   */
  public static getAll(req: Request, res: Response): void {
    const {
      category,
      brand,
      source,
      maxPrice,
      minPrice,
      minRamGb,
      minStorageGb,
      minRating,
      keyword,
      inStockOnly,
      page,
      limit
    } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : undefined;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;

    if (pageNum || limitNum) {
      const result = db.products.searchPaginated({
        category: category as string,
        brand: brand as string,
        source: source as string,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        minRamGb: minRamGb ? Number(minRamGb) : undefined,
        minStorageGb: minStorageGb ? Number(minStorageGb) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        keyword: keyword as string,
        inStockOnly: inStockOnly === 'true',
        page: pageNum || 1,
        limit: limitNum || 20
      });

      res.json({
        success: true,
        ...result
      });
      return;
    }

    const products = db.products.search({
      category: category as string,
      brand: brand as string,
      source: source as string,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      minRamGb: minRamGb ? Number(minRamGb) : undefined,
      minStorageGb: minStorageGb ? Number(minStorageGb) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      keyword: keyword as string,
      inStockOnly: inStockOnly === 'true'
    });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  }

  /**
   * GET /api/products/search?q=developer+laptop
   */
  public static search(req: Request, res: Response): void {
    const query = (req.query.q as string) || (req.query.query as string) || (req.query.keyword as string) || '';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = db.products.searchPaginated({
      keyword: query,
      category: req.query.category as string,
      brand: req.query.brand as string,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      minRamGb: req.query.minRamGb ? Number(req.query.minRamGb) : undefined,
      page,
      limit
    });

    res.json({
      success: true,
      query,
      ...result
    });
  }

  /**
   * GET /api/products/health
   */
  public static getHealth(req: Request, res: Response): void {
    const health = db.getCatalogHealth();
    res.json({
      success: true,
      health
    });
  }

  /**
   * GET /api/products/:id
   */
  public static getById(req: Request, res: Response): void {
    const id = req.params.id as string;
    const product = db.products.getById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  }

  /**
   * POST /api/products/import
   * Bulk import products via JSON array or CSV text payload.
   */
  public static async importProducts(req: Request, res: Response): Promise<void> {
    try {
      let rawRecords: any[] = [];

      if (Array.isArray(req.body)) {
        rawRecords = req.body;
      } else if (req.body.products && Array.isArray(req.body.products)) {
        rawRecords = req.body.products;
      } else if (req.body.csv && typeof req.body.csv === 'string') {
        rawRecords = parseCSV(req.body.csv);
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid import payload. Expected JSON array of products or { csv: '...' } format."
        });
        return;
      }

      if (rawRecords.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No product records found in import payload.'
        });
        return;
      }

      const report = await CatalogImporter.ingestRecords(rawRecords);

      res.status(report.invalid > 0 && report.created === 0 && report.updated === 0 ? 400 : 200).json({
        success: report.created > 0 || report.updated > 0,
        message: `Import processed ${report.totalRows} records: ${report.created} created, ${report.updated} updated, ${report.duplicates} duplicates, ${report.invalid} invalid.`,
        report
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Catalog import failed'
      });
    }
  }

  /**
   * POST /api/products
   * Create single product with normalization and validation.
   */
  public static create(req: Request, res: Response): void {
    try {
      const validated = CatalogImporter.normalizeAndValidate(req.body, 1);
      const created = db.products.create(validated);
      res.status(201).json({
        success: true,
        data: created
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Product validation failed'
      });
    }
  }

  /**
   * PATCH /api/products/:id or PUT /api/products/:id
   */
  public static update(req: Request, res: Response): void {
    const id = req.params.id as string;
    const existing = db.products.getById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found`
      });
      return;
    }

    const updated = db.products.update(existing.id, req.body);
    res.json({
      success: true,
      data: updated
    });
  }

  /**
   * DELETE /api/products/:id
   */
  public static delete(req: Request, res: Response): void {
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
      message: `Product '${id}' deleted successfully`
    });
  }
}
