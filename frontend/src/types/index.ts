export type UserRole = 'ADMIN' | 'BUYER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company: string;
  createdAt: string;
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

export interface AdminMetrics {
  totalSpend: number;
  totalOrders: number;
  productsCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalSessions: number;
  validatedSessions: number;
  totalUsers: number;
  health?: CatalogHealthSummary;
}

export type AgentStatus =
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

export interface ProductSpecifications {
  ram: string;
  ramGb: number;
  ramType?: string;
  storage: string;
  storageGb: number;
  storageType: 'SSD' | 'HDD' | string;
  cpu: string;
  gpu: string;
  display: string;
  batteryHours: number;
  weightKg: number;
  os: string;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  brand: string;
  model?: string;
  category: string;
  subcategory?: string;
  description: string;
  price: number;
  currency?: string;
  priceType?: 'RETAILER_LISTING' | 'MANUFACTURER_MSRP' | 'IMPORTED_ESTIMATE' | 'MOCK';
  priceUpdatedAt?: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  stockUpdatedAt?: string;
  stockType?: 'VERIFIED_LIVE' | 'ESTIMATED_INVENTORY' | 'IMPORTED';
  availabilityStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'PRE_ORDER';
  deliveryDays: number;
  deliveryType?: 'EXPRESS_SLA' | 'STANDARD_LOGISTICS' | 'ESTIMATED';
  warrantyYears: number;
  color?: string;
  imageUrl: string;
  additionalImages?: string[];
  productUrl?: string;
  source?: 'MANUFACTURER' | 'RETAILER_API' | 'IMPORTED_CATALOG' | 'MOCK';
  sourceProductId?: string;
  lastVerifiedAt?: string;
  specifications: ProductSpecifications;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedRequirements {
  category: string;
  budgetMax: number | null;
  budgetMin?: number | null;
  currency: string;
  quantity: number;
  ramMinGb?: number | null;
  storageMinGb?: number | null;
  storageTypePreferred?: 'SSD' | 'HDD' | null;
  useCase?: string | null;
  preferredBrands?: string[];
  maxDeliveryDays?: number | null;
  minRating?: number | null;
  batteryHoursMin?: number | null;
  hardConstraints: string[];
  softPreferences: string[];
  rawText: string;
}

export interface CandidateEvaluation {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  rating: number;
  stock: number;
  deliveryDays: number;
  specsSummary: string;
  hardConstraintsPass: boolean;
  hardConstraintsBreakdown: {
    constraint: string;
    passed: boolean;
    actual: string;
    expected: string;
  }[];
  softScores: {
    priceScore: number;
    specScore: number;
    ratingScore: number;
    deliveryScore: number;
    brandScore: number;
  };
  totalWeightedScore: number;
  eliminationReason?: string;
  tradeOffs: string[];
}

export interface DecisionSummary {
  selectedProductId: string;
  selectedProductName: string;
  totalProductsInvestigated: number;
  productsEliminatedCount: number;
  eliminationReasons: string[];
  keyReasonsForSelection: string[];
  tradeOffAnalysis: string;
  scoringMatrix: CandidateEvaluation[];
  confidenceScore: number;
  recommendationTimestamp: string;
}

export interface ValidationItem {
  criterion: string;
  passed: boolean;
  expected: string | number;
  actual: string | number;
  details: string;
}

export interface ValidationReport {
  orderId: string;
  validatedAt: string;
  overallStatus: 'PASSED' | 'FAILED' | 'WARNING';
  items: ValidationItem[];
  summary: string;
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

export interface AgentActionLog {
  id: string;
  sessionId: string;
  stepNumber: number;
  toolName: string;
  input: any;
  output: any;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  executionTimeMs: number;
  explanation: string;
  timestamp: string;
}

export interface AgentSession {
  id: string;
  userId: string;
  userPrompt: string;
  extractedRequirements: ExtractedRequirements | null;
  status: AgentStatus;
  candidateProductIds: string[];
  selectedProductId: string | null;
  decisionSummary: DecisionSummary | null;
  orderId: string | null;
  validationReport: ValidationReport | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
