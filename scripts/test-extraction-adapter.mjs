import assert from 'node:assert/strict';
import test from 'node:test';
import { applyExtractionToTender } from '../src/app/services/tender-extraction.adapter.ts';

const notice = {
  id: 'test-notice', title: 'Notice title', location: 'Augsburg', nuts_code: 'DE27',
  distance_from_augsburg_km: 5, distance_from_plauen_km: 300,
  value_eur: 100000, trade_type: 'Notice trade', role_required: null,
  deadline: '2026-10-01', construction_window_start: null, construction_window_end: null,
  references_required: null, certifications_required: ['Notice certification'],
  guarantee_required_eur: null, eigenleistung_min_pct: null,
  hidden_blockers: [], complexity_markers: [], source_url: 'https://example.com/tender', lv_url: null,
};

function result(fields = {}, statuses = {}) {
  const values = {
    trade_type: null, role_required: null, estimated_value_eur: null,
    construction_window_start: null, construction_window_end: null,
    references_required: null, eigenleistung_min_pct: null, guarantee_required_eur: null,
    certifications_required: [], complexity_markers: [], hidden_blockers: [],
    ...fields,
  };
  return {
    fields: values,
    field_status: { ...Object.fromEntries(Object.keys(values).map(key => [key, 'not_found'])), ...statuses },
    requires_review: true, review_reasons: { trade_type: 'Check combined scope' },
    evidence: {},
  };
}

test('maps extracted requirements and preserves notice metadata', () => {
  const extraction = result({ estimated_value_eur: 250000, construction_window_start: '2026-11-23',
    complexity_markers: ['Occupied building'] }, { estimated_value_eur: 'extracted',
    construction_window_start: 'extracted', complexity_markers: 'extracted' });
  assert.deepEqual(applyExtractionToTender(notice, extraction), {
    ...notice, value_eur: 250000, construction_window_start: '2026-11-23',
    complexity_markers: ['Occupied building'],
  });
});

test('not-found findings preserve known notice values and leave unknowns null', () => {
  assert.deepEqual(applyExtractionToTender(notice, result()), notice);
  assert.equal(applyExtractionToTender({ ...notice, value_eur: null }, result()).value_eur, null);
});

test('conflicts clear previous values; combined text remains available for review', () => {
  const extraction = result({ trade_type: 'Heating; Electrical' }, {
    estimated_value_eur: 'conflict', trade_type: 'needs_review',
  });
  const before = structuredClone(extraction);
  const mapped = applyExtractionToTender(notice, extraction);
  assert.equal(mapped.value_eur, null);
  assert.equal(mapped.trade_type, 'Heating; Electrical');
  assert.deepEqual(extraction, before);
});

test('mapped arrays can be edited without mutating either source', () => {
  const extraction = result({ hidden_blockers: ['Site visit'] }, { hidden_blockers: 'extracted' });
  const mapped = applyExtractionToTender(notice, extraction);
  mapped.hidden_blockers.push('Another blocker');
  mapped.certifications_required.push('Another certification');
  assert.deepEqual(extraction.fields.hidden_blockers, ['Site visit']);
  assert.deepEqual(notice.certifications_required, ['Notice certification']);
});
