import { db } from '../../database/db.js';
import { Product } from '../../database/schema.js';

export interface SearchProductsInput {
  keyword?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  minRamGb?: number;
  minStorageGb?: number;
  inStockOnly?: boolean;
}

export interface SearchProductsOutput {
  totalMatches: number;
  products: Product[];
}

export async function searchProducts(input: SearchProductsInput): Promise<SearchProductsOutput> {
  const products = db.products.search(input);
  return {
    totalMatches: products.length,
    products
  };
}
