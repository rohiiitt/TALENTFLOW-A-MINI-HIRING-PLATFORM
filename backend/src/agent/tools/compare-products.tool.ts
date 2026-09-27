import { db } from '../../database/db.js';
import { DecisionEngine } from '../decision-engine.js';
import { ExtractedRequirements, CandidateEvaluation, DecisionSummary } from '../agent.types.js';

export interface CompareProductsInput {
  productIds: string[];
  requirements: ExtractedRequirements;
}

export interface CompareProductsOutput {
  evaluatedCount: number;
  evaluations: CandidateEvaluation[];
  topRecommendation: CandidateEvaluation | null;
  decisionSummary: DecisionSummary | null;
}

export async function compareProducts(input: CompareProductsInput): Promise<CompareProductsOutput> {
  const products = input.productIds
    .map((id) => db.products.getById(id))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const { evaluations, decisionSummary } = DecisionEngine.evaluateCandidates(products, input.requirements);

  const topRecommendation = evaluations.length > 0 && evaluations[0].hardConstraintsPass ? evaluations[0] : null;

  return {
    evaluatedCount: evaluations.length,
    evaluations,
    topRecommendation,
    decisionSummary
  };
}
