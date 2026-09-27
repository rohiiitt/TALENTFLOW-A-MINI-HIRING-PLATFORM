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
    priceScore: number;       // 0-10 (lower price relative to budget = higher)
    specScore: number;        // 0-10 (ram/storage/cpu capacity)
    ratingScore: number;      // 0-10 (user reviews & rating)
    deliveryScore: number;    // 0-10 (fast delivery = higher)
    brandScore: number;       // 0-10 (preferred brand match)
  };
  totalWeightedScore: number; // 0-100
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
  confidenceScore: number; // 0.0 - 1.0
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
