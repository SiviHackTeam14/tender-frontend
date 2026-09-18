import type { ExtractedRequirements, ExtractionResult } from '../models/extraction';
import type { Tender } from '../models/tender';

/** Map document findings onto a notice without fabricating missing notice metadata.
 * Not-found fields preserve known notice values; conflicts retain extraction nulls.
 * Callers must keep ExtractionResult alongside this view for review and provenance.
 */
export function applyExtractionToTender(notice: Tender, result: ExtractionResult): Tender {
  function value<K extends keyof ExtractedRequirements>(
    field: K,
    fallback: ExtractedRequirements[K],
  ): ExtractedRequirements[K] {
    return result.field_status[field] === 'not_found' ? fallback : result.fields[field];
  }

  return {
    ...notice,
    trade_type: value('trade_type', notice.trade_type),
    role_required: value('role_required', notice.role_required),
    value_eur: value('estimated_value_eur', notice.value_eur),
    construction_window_start: value('construction_window_start', notice.construction_window_start),
    construction_window_end: value('construction_window_end', notice.construction_window_end),
    references_required: value('references_required', notice.references_required),
    eigenleistung_min_pct: value('eigenleistung_min_pct', notice.eigenleistung_min_pct),
    guarantee_required_eur: value('guarantee_required_eur', notice.guarantee_required_eur),
    certifications_required: [...value('certifications_required', notice.certifications_required)],
    complexity_markers: [...value('complexity_markers', notice.complexity_markers)],
    hidden_blockers: [...value('hidden_blockers', notice.hidden_blockers)],
  };
}
