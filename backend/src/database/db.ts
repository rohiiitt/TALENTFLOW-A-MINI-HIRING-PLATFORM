import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Order, AgentSession, AgentActionEntity, User, ProductSource } from './schema.js';
import { INITIAL_PRODUCTS, INITIAL_USERS } from './seed-data.js';

interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  sessions: AgentSession[];
  actions: AgentActionEntity[];
}

export interface ProductSearchCriteria {
  keyword?: string;
  category?: string;
  brand?: string;
  source?: ProductSource | string;
  maxPrice?: number;
  minPrice?: number;
  minRamGb?: number;
  minStorageGb?: number;
  minRating?: number;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedProductResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}

export interface CatalogHealthSummary {
  totalProducts: number;
  missingPriceCount: number;
  missingImageCount: number;
  missingSpecsCount: number;
  stalePriceCount: number;
  staleStockCount: number;
  duplicateCandidates: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  sourceBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}

class DatabaseEngine {
  private data: DatabaseSchema;
  private filePath: string;
  private isLoaded: boolean = false;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'db.json');
    this.data = {
      users: [],
      products: [],
      orders: [],
      sessions: [],
      actions: []
    };
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);

        // Ensure users exist
        if (!this.data.users || this.data.users.length === 0) {
          this.data.users = JSON.parse(JSON.stringify(INITIAL_USERS));
          this.save();
        }

        // Ensure products exist
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
          this.save();
        }
      } else {
        this.data = {
          users: JSON.parse(JSON.stringify(INITIAL_USERS)),
          products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
          orders: [],
          sessions: [],
          actions: []
        };
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to load database from disk, using fresh in-memory seed:', err);
      this.data = {
        users: JSON.parse(JSON.stringify(INITIAL_USERS)),
        products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
        orders: [],
        sessions: [],
        actions: []
      };
      this.save();
      this.isLoaded = true;
    }
  }

  public save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  public resetToSeed(): void {
    this.data.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.data.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.data.orders = [];
    this.data.sessions = [];
    this.data.actions = [];
    this.save();
  }

  // Users Repository
  public users = {
    create: (user: User): User => {
      this.data.users.push({ ...user });
      this.save();
      return { ...user };
    },

    findByEmail: (email: string): User | null => {
      const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user } : null;
    },

    findById: (id: string): User | null => {
      const user = this.data.users.find((u) => u.id === id);
      return user ? { ...user } : null;
    },

    getAll: (): Omit<User, 'passwordHash'>[] => {
      return this.data.users.map(({ passwordHash, ...rest }) => rest);
    },

    update: (id: string, updates: Partial<User>): User | null => {
      const idx = this.data.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      this.data.users[idx] = {
        ...this.data.users[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return { ...this.data.users[idx] };
    }
  };

  // Product Repository
  public products = {
    create: (product: Product): Product => {
      this.data.products.unshift({ ...product });
      this.save();
      return { ...product };
    },

    upsert: (product: Product): { product: Product; isNew: boolean } => {
      const idx = this.data.products.findIndex(
        (p) =>
          p.id === product.id ||
          p.sku.toLowerCase() === product.sku.toLowerCase() ||
          (p.source === product.source && p.sourceProductId.toLowerCase() === product.sourceProductId.toLowerCase()) ||
          (p.brand.toLowerCase() === product.brand.toLowerCase() && p.model.toLowerCase() === product.model.toLowerCase())
      );

      if (idx >= 0) {
        this.data.products[idx] = {
          ...this.data.products[idx],
          ...product,
          id: this.data.products[idx].id,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return { product: { ...this.data.products[idx] }, isNew: false };
      } else {
        this.data.products.unshift({ ...product });
        this.save();
        return { product: { ...product }, isNew: true };
      }
    },

    getAll: (): Product[] => {
      return [...this.data.products];
    },

    getById: (id: string): Product | null => {
      const target = id.toLowerCase();
      const found = this.data.products.find(
        (p) =>
          p.id.toLowerCase() === target ||
          p.sku?.toLowerCase() === target ||
          p.id.toLowerCase().startsWith(target) ||
          p.sourceProductId?.toLowerCase() === target
      );
      return found ? { ...found } : null;
    },

    search: (criteria: ProductSearchCriteria): Product[] => {
      return this.data.products.filter((p) => {
        if (criteria.category && p.category.toLowerCase() !== criteria.category.toLowerCase()) {
          return false;
        }
        if (criteria.brand && p.brand.toLowerCase() !== criteria.brand.toLowerCase()) {
          return false;
        }
        if (criteria.source && p.source.toLowerCase() !== criteria.source.toLowerCase()) {
          return false;
        }
        if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) {
          return false;
        }
        if (criteria.minPrice !== undefined && p.price < criteria.minPrice) {
          return false;
        }
        if (criteria.minRating !== undefined && p.rating < criteria.minRating) {
          return false;
        }
        if (criteria.minRamGb !== undefined && p.specifications?.ramGb !== undefined && p.specifications.ramGb < criteria.minRamGb) {
          return false;
        }
        if (criteria.minStorageGb !== undefined && p.specifications?.storageGb !== undefined && p.specifications.storageGb < criteria.minStorageGb) {
          return false;
        }
        if (criteria.inStockOnly && p.stock <= 0) {
          return false;
        }
        if (criteria.keyword) {
          const kw = criteria.keyword.toLowerCase().trim();
          const matchName = p.name?.toLowerCase().includes(kw);
          const matchBrand = p.brand?.toLowerCase().includes(kw);
          const matchModel = p.model?.toLowerCase().includes(kw);
          const matchSku = p.sku?.toLowerCase().includes(kw);
          const matchDesc = p.description?.toLowerCase().includes(kw);
          const matchTag = p.tags?.some((t) => t.toLowerCase().includes(kw));
          const matchCpu = p.specifications?.cpu?.toLowerCase().includes(kw);
          const matchGpu = p.specifications?.gpu?.toLowerCase().includes(kw);
          if (!matchName && !matchBrand && !matchModel && !matchSku && !matchDesc && !matchTag && !matchCpu && !matchGpu) {
            return false;
          }
        }
        return true;
      });
    },

    searchPaginated: (criteria: ProductSearchCriteria): PaginatedProductResult => {
      const allMatches = this.products.search(criteria);
      const page = Math.max(1, criteria.page || 1);
      const limit = Math.max(1, Math.min(100, criteria.limit || 20));
      const total = allMatches.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const products = allMatches.slice(startIndex, startIndex + limit);

      return {
        total,
        page,
        limit,
        totalPages,
        products
      };
    },

    decrementStock: (productId: string, quantity: number): boolean => {
      const product = this.data.products.find((p) => p.id === productId || p.sku === productId);
      if (!product || product.stock < quantity) {
        return false;
      }
      product.stock -= quantity;
      product.updatedAt = new Date().toISOString();
      this.save();
      return true;
    },

    update: (id: string, updates: Partial<Product>): Product | null => {
      const idx = this.data.products.findIndex((p) => p.id === id || p.sku === id);
      if (idx === -1) return null;
      this.data.products[idx] = {
        ...this.data.products[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return { ...this.data.products[idx] };
    },

    delete: (id: string): boolean => {
      const initialLength = this.data.products.length;
      this.data.products = this.data.products.filter((p) => p.id !== id && p.sku !== id);
      if (this.data.products.length !== initialLength) {
        this.save();
        return true;
      }
      return false;
    }
  };

  // Order Repository
  public orders = {
    create: (order: Order): Order => {
      this.data.orders.unshift({ ...order });
      this.save();
      return { ...order };
    },

    getById: (id: string): Order | null => {
      const order = this.data.orders.find((o) => o.id === id);
      return order ? { ...order } : null;
    },

    getBySessionId: (sessionId: string): Order | null => {
      const order = this.data.orders.find((o) => o.sessionId === sessionId);
      return order ? { ...order } : null;
    },

    getAll: (): Order[] => {
      return [...this.data.orders];
    },

    update: (id: string, updates: Partial<Order>): Order | null => {
      const idx = this.data.orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      this.data.orders[idx] = {
        ...this.data.orders[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return { ...this.data.orders[idx] };
    }
  };

  // AgentSession Repository
  public sessions = {
    create: (session: AgentSession): AgentSession => {
      this.data.sessions.unshift({ ...session });
      this.save();
      return { ...session };
    },

    getById: (id: string): AgentSession | null => {
      const session = this.data.sessions.find((s) => s.id === id);
      return session ? { ...session } : null;
    },

    getAll: (): AgentSession[] => {
      return [...this.data.sessions];
    },

    update: (id: string, updates: Partial<AgentSession>): AgentSession | null => {
      const idx = this.data.sessions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      this.data.sessions[idx] = {
        ...this.data.sessions[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return { ...this.data.sessions[idx] };
    }
  };

  // AgentAction Repository
  public actions = {
    create: (action: AgentActionEntity): AgentActionEntity => {
      this.data.actions.push({ ...action });
      this.save();
      return { ...action };
    },

    getBySessionId: (sessionId: string): AgentActionEntity[] => {
      return this.data.actions
        .filter((a) => a.sessionId === sessionId)
        .sort((a, b) => a.stepNumber - b.stepNumber);
    },

    getAll: (): AgentActionEntity[] => {
      return [...this.data.actions];
    }
  };

  // Data Quality & Health Summary
  public getCatalogHealth(): CatalogHealthSummary {
    const totalProducts = this.data.products.length;
    let missingPriceCount = 0;
    let missingImageCount = 0;
    let missingSpecsCount = 0;
    let stalePriceCount = 0;
    let staleStockCount = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    const sourceBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    const modelKeys = new Set<string>();
    let duplicateCandidates = 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (const p of this.data.products) {
      if (p.price === undefined || p.price === null || p.price <= 0) missingPriceCount++;
      if (!p.imageUrl || p.imageUrl.trim() === '') missingImageCount++;
      if (!p.specifications || !p.specifications.cpu || !p.specifications.ramGb) missingSpecsCount++;

      if (p.priceUpdatedAt && new Date(p.priceUpdatedAt).getTime() < thirtyDaysAgo) {
        stalePriceCount++;
      }
      if (p.stockUpdatedAt && new Date(p.stockUpdatedAt).getTime() < thirtyDaysAgo) {
        staleStockCount++;
      }

      if (p.stock <= 0) outOfStockCount++;
      else if (p.stock < 5) lowStockCount++;
      else inStockCount++;

      const src = p.source || 'IMPORTED_CATALOG';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;

      const cat = p.category || 'Uncategorized';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      const key = `${p.brand}:${p.model}`.toLowerCase();
      if (modelKeys.has(key)) {
        duplicateCandidates++;
      } else {
        modelKeys.add(key);
      }
    }

    return {
      totalProducts,
      missingPriceCount,
      missingImageCount,
      missingSpecsCount,
      stalePriceCount,
      staleStockCount,
      duplicateCandidates,
      inStockCount,
      outOfStockCount,
      lowStockCount,
      sourceBreakdown,
      categoryBreakdown
    };
  }

  // Admin Analytics & Metrics
  public getAdminStats() {
    const totalOrders = this.data.orders.length;
    const totalSpend = this.data.orders
      .filter((o) => o.status === 'CONFIRMED')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const productsCount = this.data.products.length;
    const outOfStockCount = this.data.products.filter((p) => p.stock <= 0).length;
    const lowStockCount = this.data.products.filter((p) => p.stock > 0 && p.stock < 5).length;
    const totalInventoryValue = this.data.products.reduce((sum, p) => sum + p.price * p.stock, 0);

    const totalSessions = this.data.sessions.length;
    const validatedSessions = this.data.sessions.filter((s) => s.status === 'VALIDATED').length;

    return {
      totalSpend,
      totalOrders,
      productsCount,
      outOfStockCount,
      lowStockCount,
      totalInventoryValue,
      totalSessions,
      validatedSessions,
      totalUsers: this.data.users.length,
      health: this.getCatalogHealth()
    };
  }
}

export const db = new DatabaseEngine();
