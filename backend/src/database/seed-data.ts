import { Product, User } from './schema.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Pre-hashed default passwords: 'Admin@123' and 'Buyer@123'
const ADMIN_HASH = bcrypt.hashSync('Admin@123', 10);
const BUYER_HASH = bcrypt.hashSync('Buyer@123', 10);

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    email: 'admin@talentflow.ai',
    name: 'Rohit Sharma (Procurement Admin)',
    role: 'ADMIN',
    company: 'TalentFlow Global Ops',
    passwordHash: ADMIN_HASH,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'USR-BUYER-01',
    email: 'dev.buyer@talentflow.ai',
    name: 'Priya Patel (Engineering Lead)',
    role: 'BUYER',
    company: 'NextGen Cloud Engineering',
    passwordHash: BUYER_HASH,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  }
];

function loadCatalogSeed(): Product[] {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const jsonPath = path.resolve(__dirname, '../../data/products.json');
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Warning: could not load products.json seed:', err);
  }
  return [];
}

export const INITIAL_PRODUCTS: Product[] = loadCatalogSeed();
