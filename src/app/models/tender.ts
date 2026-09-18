export type RoleRequired = 'main_contractor' | 'subcontractor';

// A published tender notice as consumed by the hard filter and LLM reasoning.
// No cross-field invariants (e.g. construction_window_start <=
// construction_window_end) are enforced here, matching the Python side.
export interface Tender {
  id: string;
  title: string;
  location: string;
  nuts_code: string;
  distance_from_augsburg_km: number;
  distance_from_plauen_km: number;
  value_eur: number | null;
  trade_type: string | null;
  role_required: RoleRequired | null;
  deadline: string; // ISO date
  construction_window_start: string | null; // ISO date
  construction_window_end: string | null; // ISO date
  references_required: string | null;
  certifications_required: string[];
  guarantee_required_eur: number | null;
  eigenleistung_min_pct: number | null;
  hidden_blockers: string[];
  complexity_markers: string[];
  source_url: string;
  lv_url: string | null;
}
