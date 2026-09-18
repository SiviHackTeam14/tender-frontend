import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AnalysisCriteria, CriterionStatus, Tender, TenderAnalysis } from '../../models';
import { ProfileService } from '../../services/profile.service';

interface CriterionRow {
  key: keyof AnalysisCriteria;
  label: string;
  status: CriterionStatus;
}

// Order and short labels for the 5 fixed AnalysisCriteria keys, matching the
// Stitch card's compact criteria mini-matrix.
const CRITERIA_LABELS: { key: keyof AnalysisCriteria; label: string }[] = [
  { key: 'reference_eligibility', label: 'Refs' },
  { key: 'financial_capacity', label: 'Finance' },
  { key: 'regulatory_familiarity', label: 'Regulatory' },
  { key: 'competitive_position', label: 'Competition' },
  { key: 'strategic_fit', label: 'Fit' },
];

const URGENT_DEADLINE_DAYS = 14;

// Maps a criterion's status straight to the shared DESIGN.md status-color
// custom property -- avoids a `.tender-card__dot--pass/warning/block`-style
// CSS rule per status.
const STATUS_COLOR_VAR: Record<CriterionStatus, string> = {
  PASS: 'var(--bid)',
  WARNING: 'var(--maybe)',
  BLOCK: 'var(--reject)',
};

// Renders one Stitch tender-card for a BID/MAYBE row. Purely presentational
// off @Input() tender/@Input() analysis, except for the distance readout,
// which depends on which profile is active (profile-a -> depot in Augsburg,
// profile-b -> depot in Plauen) -- read directly off ProfileService rather
// than adding a third input, since the board only ever renders cards while
// a supported profile is active (see triage-board's redirect guard).
@Component({
  selector: 'app-tender-card',
  imports: [],
  templateUrl: './tender-card.html',
  styleUrl: './tender-card.css',
})
export class TenderCardComponent {
  @Input({ required: true }) tender!: Tender;
  @Input({ required: true }) analysis!: TenderAnalysis;

  // Opens the Tender Detail Drawer (Story 4.3) via the card's "Full
  // breakdown" link -- the exact interaction epic-4-context.md's UX
  // patterns describe ("the drawer is for depth, not for information
  // hidden from the card").
  @Output() cardClick = new EventEmitter<string>();

  private readonly profileService = inject(ProfileService);

  get isBid(): boolean {
    return this.analysis.verdict === 'BID';
  }

  // DESIGN.md/ticket status-label convention: the badge reads "REVIEW" for
  // a MAYBE verdict (matches the Stitch mockup and the Review Pill token)
  // without renaming the underlying Verdict type.
  get verdictLabel(): string {
    return this.analysis.verdict === 'MAYBE' ? 'REVIEW' : this.analysis.verdict;
  }

  get distanceKm(): number {
    const activeProfileId = this.profileService.activeProfile()?.id;
    return activeProfileId === 'profile-b'
      ? this.tender.distance_from_plauen_km
      : this.tender.distance_from_augsburg_km;
  }

  get valueLabel(): string {
    const value = this.tender.value_eur;
    if (value == null) {
      return '—';
    }
    if (value >= 1_000_000) {
      return `€${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `€${Math.round(value / 1000)}k`;
    }
    return `€${value}`;
  }

  get deadlineLabel(): string {
    return new Date(this.tender.deadline).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  get daysRemaining(): number {
    const deadlineMs = new Date(this.tender.deadline).getTime();
    return Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24));
  }

  get isUrgentDeadline(): boolean {
    return this.daysRemaining < URGENT_DEADLINE_DAYS;
  }

  get criteriaRows(): CriterionRow[] {
    return CRITERIA_LABELS.map(({ key, label }) => ({
      key,
      label,
      status: this.analysis.criteria[key].status,
    }));
  }

  // DESIGN.md status-label convention: WARNING displays as "WARN" without
  // renaming the CriterionStatus type.
  statusLabel(status: CriterionStatus): string {
    return status === 'WARNING' ? 'WARN' : status;
  }

  statusColor(status: CriterionStatus): string {
    return STATUS_COLOR_VAR[status];
  }

  openBreakdown(): void {
    this.cardClick.emit(this.tender.id);
  }
}
