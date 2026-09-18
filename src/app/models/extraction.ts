import type { RoleRequired, Tender } from './tender';

// Matches backend app/api/extraction_models.py and its OpenAPI schema.
export interface ExtractedRequirements {
  trade_type: string | null;
  certifications_required: string[];
  role_required: RoleRequired | null;
  construction_window_start: string | null;
  construction_window_end: string | null;
  references_required: string | null;
  eigenleistung_min_pct: number | null;
  guarantee_required_eur: number | null;
  estimated_value_eur: number | null;
  complexity_markers: string[];
  hidden_blockers: string[];
}

export type ExtractionField = keyof ExtractedRequirements;
export type ExtractionStatus = 'queued' | 'selecting' | 'reading' | 'extracting' | 'completed' | 'failed';
export type FieldStatus = 'extracted' | 'not_found' | 'conflict' | 'needs_review';

export interface SourceFinding {
  file: string;
  pages: number[];
  value: string | number | string[];
}

export interface SelectedDocument {
  id: number;
  path: string;
  title: string;
  decision: 'include' | 'exclude';
  relevant_fields: ExtractionField[];
  reason: string;
}

export interface ExtractionResult {
  fields: ExtractedRequirements;
  field_status: Record<ExtractionField, FieldStatus>;
  conflicts: Partial<Record<ExtractionField | 'construction_window', (string | number)[]>>;
  aggregated_fields: Partial<Record<'trade_type' | 'references_required', string[]>>;
  evidence: Record<ExtractionField, SourceFinding[]>;
  documents: SelectedDocument[];
  ignored_non_pdf: string[];
  requires_review: boolean;
  review_reasons: Partial<Record<ExtractionField, string>>;
  skipped_pages: { file: string; page: number; reason: 'confirmed_blank' }[];
  pages_processed: number;
  chunks_processed: number;
  coverage: 'selected_pdfs_only';
}

export interface ExtractionJob {
  id: string;
  filename: string;
  model: string;
  status: ExtractionStatus;
  progress: { completed_chunks: number; total_chunks: number | null };
  result: ExtractionResult | null;
  error: { code: string; message: string } | null;
}

export interface ExtractionAccepted {
  id: string;
  status_url: string;
  audit_url: string;
}

// Includes the original extraction result/audit metadata inherited from ExtractionJob.
export interface TenderExtractionJob extends ExtractionJob {
  tender: Tender | null;
}
