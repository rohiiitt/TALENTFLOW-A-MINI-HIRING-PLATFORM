import { ExtractedRequirements, DecisionSummary, ValidationReport } from '../agent/agent.types.js';

export type ProductSource = 'MANUFACTURER' | 'RETAILER_API' | 'IMPORTED_CATALOG' | 'MOCK';
export type PriceType = 'RETAILER_LISTING' | 'MANUFACTURER_MSRP' | 'IMPORTED_ESTIMATE' | 'MOCK';
export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'PRE_ORDER';
export type StockType = 'VERIFIED_LIVE' | 'ESTIMATED_INVENTORY' | 'IMPORTED';
export type DeliveryType = 'EXPRESS_SLA' | 'STANDARD_LOGISTICS' | 'ESTIMATED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'BUYER';
  company: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecifications {
  cpu: string;
  cpuBrand?: 'Intel' | 'AMD' | 'Apple' | 'Qualcomm' | string;
  cpuModel?: string;
  cpuGeneration?: string;
  cpuCores?: number;
  cpuThreads?: number;

  ram: string;             // e.g. "16GB DDR5 5200MHz"
  ramGb: number;           // 16
  ramType?: string;        // "DDR5" | "LPDDR5" | "DDR4" | "Unified Memory"

  storage: string;         // e.g. "512GB PCIe 4.0 NVMe SSD"
  storageGb: number;       // 512
  storageType: 'SSD' | 'HDD';

  gpu: string;             // e.g. "NVIDIA GeForce RTX 4060 8GB GDDR6"
  gpuMemoryGb?: number;

  display: string;         // e.g. '14" WUXGA (1920x1200) IPS 300nits Anti-glare'
  displaySize?: number;    // 14.0
  displayResolution?: string;
  displayRefreshRate?: number;
  displayPanel?: 'OLED' | 'IPS' | 'Liquid Retina' | 'Mini-LED' | 'VA' | string;

  batteryWh?: number;
  batteryHours: number;    // e.g. 9.5
  weightKg: number;        // e.g. 1.41
  os: string;              // e.g. "Windows 11 Pro" | "macOS Sonoma"
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  subcategory?: string;
  description: string;

  price: number;           // In INR ₹
  currency: string;        // "INR"
  priceType: PriceType;
  priceUpdatedAt: string;

  availabilityStatus: AvailabilityStatus;
  stock: number;
  stockUpdatedAt: string;
  stockType: StockType;

  rating: number;          // e.g. 4.6
  reviewsCount: number;
  deliveryDays: number;
  deliveryType: DeliveryType;
  warrantyYears: number;

  color?: string;
  imageUrl: string;
  additionalImages?: string[];
  productUrl?: string;

  source: ProductSource;
  sourceProductId: string;
  lastVerifiedAt: string;

  specifications: ProductSpecifications;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  sessionId: string;
  userId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'PROCESSING' | 'CANCELLED' | 'FAILED';
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  deliveryStatus: 'SCHEDULED' | 'SHIPPED' | 'DELIVERED';
  deliveryEstimateDays: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSession {
  id: string;
  userId: string;
  userPrompt: string;
  extractedRequirements: ExtractedRequirements | null;
  status:
    | 'REQUEST_RECEIVED'
    | 'REQUIREMENTS_EXTRACTED'
    | 'RESEARCHING'
    | 'OPTIONS_FOUND'
    | 'OPTIONS_COMPARED'
    | 'DECISION_MADE'
    | 'WAITING_APPROVAL'
    | 'PURCHASE_INITIATED'
    | 'PURCHASE_COMPLETED'
    | 'VALIDATING'
    | 'VALIDATED'
    | 'FAILED';
  candidateProductIds: string[];
  selectedProductId: string | null;
  decisionSummary: DecisionSummary | null;
  orderId: string | null;
  validationReport: ValidationReport | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentActionEntity {
  id: string;
  sessionId: string;
  toolName: string;
  stepNumber: number;
  input: any;
  output: any;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  executionTimeMs: number;
  explanation: string;
  timestamp: string;
}
