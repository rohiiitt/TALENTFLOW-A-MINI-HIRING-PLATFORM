import { db } from '../../database/db.js';
import { Product } from '../../database/schema.js';

export interface GetProductDetailsInput {
  productId: string;
}

export interface GetProductDetailsOutput {
  found: boolean;
  product: Product | null;
  specSummary?: string;
}

export async function getProductDetails(input: GetProductDetailsInput): Promise<GetProductDetailsOutput> {
  const product = db.products.getById(input.productId);
  if (!product) {
    return {
      found: false,
      product: null
    };
  }

  const specSummary = `${product.specifications.cpu} | ${product.specifications.ram} | ${product.specifications.storage} | ${product.specifications.display} | ${product.specifications.batteryHours}h battery | ${product.specifications.os}`;

  return {
    found: true,
    product,
    specSummary
  };
}
