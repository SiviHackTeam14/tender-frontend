import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { apiPath, environment } from '../environments/environment';
import { CompanyProfile, TenderAnalysis } from '../models';
import analysesData from '../data/analyses.json';
import { ProfileService } from './profile.service';

// Mock shape: a dict keyed by profile id ('profile-a' / 'profile-b'), each
// value a TenderAnalysis[] matched to tenders.json by tender_id.
type AnalysesByProfile = Record<string, TenderAnalysis[]>;

// HttpClient wrapper over POST /api/analyze, with environment.useMock
// switching back to the local fixture -- Story 4.4. The real path is
// triggered by an `effect()` on `ProfileService.activeProfile()` (not from
// inside `analysesForProfile`, which stays a pure signal read -- firing HTTP
// requests as a byproduct of reading a value that feeds TriageBoard's
// `computed()` is an anti-pattern), and caches the result by profile id so
// `analysesForProfile` keeps its synchronous, signal-backed contract.
@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);
  private readonly baseUrl = apiPath('/api/analyze');

  readonly error = signal<string | null>(null);

  private readonly _analysesByProfile = signal<AnalysesByProfile>(
    environment.useMock ? (analysesData as AnalysesByProfile) : {},
  );

  private readonly _pending = new Set<string>();

  constructor() {
    if (!environment.useMock) {
      effect(() => {
        const profile = this.profileService.activeProfile();
        if (profile) {
          this.fetchForProfile(profile);
        }
      });
    }
  }

  // Returns [] for a profile id with no (yet) available analyses -- either no
  // mock fixture exists for it, or the real fetch (triggered separately, see
  // constructor) is still in flight or failed.
  analysesForProfile(profileId: string): TenderAnalysis[] {
    return this._analysesByProfile()[profileId] ?? [];
  }

  private fetchForProfile(profile: CompanyProfile): void {
    const profileId = profile.id;
    if (this._pending.has(profileId) || this._analysesByProfile()[profileId] !== undefined) {
      return;
    }
    this._pending.add(profileId);
    this.http
      .post<TenderAnalysis[]>(this.baseUrl, profile)
      .pipe(
        tap(() => this.error.set(null)),
        catchError((err) => {
          this.error.set('Failed to load analysis.');
          console.error(`AnalysisService: failed to fetch analysis for profile "${profileId}"`, err);
          // Resolve with `null` rather than `[]` so failures are never cached
          // as "this profile legitimately has zero analyses" -- a retriggered
          // effect (e.g. re-selecting the profile) gets a fresh attempt.
          return of(null);
        }),
      )
      .subscribe((analyses) => {
        this._pending.delete(profileId);
        if (analyses !== null) {
          this._analysesByProfile.update((byProfile) => ({ ...byProfile, [profileId]: analyses }));
        }
      });
  }
}
