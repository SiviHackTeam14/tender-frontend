import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Tender, TenderAnalysis } from '../../models';
import { TenderDossier } from '../../data/mock-dashboard-data';
import { AnalysisService } from '../../services/analysis.service';
import { ProfileService } from '../../services/profile.service';
import { TenderService } from '../../services/tender.service';
import { CollapsedRejectsComponent } from '../collapsed-rejects/collapsed-rejects';
import { ProfileSummaryBarComponent } from '../profile-summary-bar/profile-summary-bar';
import { TenderDetailDrawerComponent } from '../tender-detail-drawer/tender-detail-drawer';
import { VerdictColumnComponent } from '../verdict-column/verdict-column';

export interface TenderRow {
  tender: Tender;
  analysis: TenderAnalysis;
}

// No mock TenderAnalysis[] exists for a custom profile -- a custom active
// profile is treated the same as "no active profile" (human decision, see
// spec's frozen Boundaries) rather than fabricating analyses for it.
const SUPPORTED_PROFILE_IDS: ReadonlySet<string> = new Set(['profile-a', 'profile-b']);

// Container: injects the profile/tender/analysis services, redirects to '/'
// whenever there's no usable active profile, joins tenders.json + the
// active profile's analyses.json entries by tender_id, groups the result by
// verdict, and owns the set-aside modal's and detail drawer's open state.
@Component({
  selector: 'app-triage-board',
  imports: [
    ProfileSummaryBarComponent,
    VerdictColumnComponent,
    CollapsedRejectsComponent,
    TenderDetailDrawerComponent,
  ],
  templateUrl: './triage-board.html',
  styleUrl: './triage-board.css',
})
export class TriageBoard {
  private readonly profileService = inject(ProfileService);
  private readonly tenderService = inject(TenderService);
  private readonly analysisService = inject(AnalysisService);
  private readonly router = inject(Router);

  readonly activeProfile = this.profileService.activeProfile;
  readonly showSetAside = signal(false);
  readonly selectedTenderId = signal<string | null>(null);

  readonly isUsableProfile = computed(() => {
    const profile = this.activeProfile();
    return !!profile && SUPPORTED_PROFILE_IDS.has(profile.id);
  });

  // True from the moment a supported profile becomes active until its
  // analyses have resolved at least once -- covers both "request in flight"
  // and the brief tick before the fetch-triggering effect has run.
  readonly isLoadingAnalysis = computed(() => {
    const profile = this.activeProfile();
    if (!profile || !SUPPORTED_PROFILE_IDS.has(profile.id)) {
      return false;
    }
    return !this.analysisService.hasResult(profile.id);
  });

  readonly analysisError = this.analysisService.error;

  private readonly rows = computed<TenderRow[]>(() => {
    const profile = this.activeProfile();
    if (!profile || !SUPPORTED_PROFILE_IDS.has(profile.id)) {
      return [];
    }
    const tenderById = new Map(this.tenderService.tenders().map((tender) => [tender.id, tender]));
    return this.analysisService
      .analysesForProfile(profile.id)
      .map((analysis) => {
        const tender = tenderById.get(analysis.tender_id);
        return tender ? { tender, analysis } : null;
      })
      .filter((row): row is TenderRow => row !== null);
  });

  readonly bidRows = computed(() => this.rows().filter((row) => row.analysis.verdict === 'BID'));
  readonly maybeRows = computed(() =>
    this.rows().filter((row) => row.analysis.verdict === 'MAYBE'),
  );
  readonly rejectRows = computed(() =>
    this.rows().filter((row) => row.analysis.verdict === 'REJECT'),
  );

  // Adapts the selected row to the TenderDossier shape TenderDetailDrawerComponent
  // (Story 4.3) expects, without changing this board's own tender/analysis pair
  // convention used by VerdictColumnComponent/CollapsedRejectsComponent.
  readonly selectedDossier = computed<TenderDossier | null>(() => {
    const id = this.selectedTenderId();
    if (!id) {
      return null;
    }
    const row = this.rows().find(({ tender }) => tender.id === id);
    return row ? { ...row.tender, analysis: row.analysis } : null;
  });

  constructor() {
    effect(() => {
      if (!this.isUsableProfile()) {
        this.router.navigateByUrl('/');
      }
    });
  }

  openSetAside(): void {
    this.showSetAside.set(true);
  }

  closeSetAside(): void {
    this.showSetAside.set(false);
  }

  openTender(tenderId: string): void {
    this.selectedTenderId.set(tenderId);
  }

  retryAnalysis(): void {
    const profile = this.activeProfile();
    if (profile) {
      this.analysisService.retry(profile);
    }
  }

  closeTender(): void {
    this.selectedTenderId.set(null);
  }
}
