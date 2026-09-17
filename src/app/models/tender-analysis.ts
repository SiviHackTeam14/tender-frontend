import { CriterionResult } from './criterion-result';

export type Verdict = 'BID' | 'MAYBE' | 'REJECT';

// Named type (not an indexed/dict type) so the exact five-key set is
// checked at compile time, matching the Python `AnalysisCriteria` model.
export interface AnalysisCriteria {
  reference_eligibility: CriterionResult;
  financial_capacity: CriterionResult;
  regulatory_familiarity: CriterionResult;
  competitive_position: CriterionResult;
  strategic_fit: CriterionResult;
}

// The bid/no-bid verdict and per-criterion breakdown for one tender.
export interface TenderAnalysis {
  tender_id: string;
  verdict: Verdict;
  summary: string;
  hard_reject_reason: string | null;
  criteria: AnalysisCriteria;
}
