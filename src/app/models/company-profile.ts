export type Role = 'main_contractor' | 'subcontractor';
export type RegFamiliarity = 'low' | 'medium' | 'high' | 'very_high';

// A bidder's company profile used to filter and score tenders.
// No cross-field invariants (e.g. min_contract_eur <= max_contract_eur) are
// enforced here, matching the Python side — that logic belongs to Epic 3's
// hard-filter, not the shared model layer.
export interface CompanyProfile {
  id: string;
  name: string;
  location: string;
  nuts_code: string;
  distance_limit_km: number;
  focus_areas: string[];
  min_contract_eur: number;
  max_contract_eur: number;
  max_guarantee_eur: number;
  role: Role;
  available_from: string; // ISO date
  revenue_eur: number;
  reg_familiarity: RegFamiliarity;
  certifications: string[];
  can_show_references: string[];
  cannot_show: string[];
}
