export type CriterionStatus = 'PASS' | 'WARNING' | 'BLOCK';

// The pass/warn/block verdict and reason for one scoring criterion.
export interface CriterionResult {
  status: CriterionStatus;
  reason: string;
}
