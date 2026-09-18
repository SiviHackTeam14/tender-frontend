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

  private readonly _pendingIds = signal<ReadonlySet<string>>(new Set());

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

  // True only while the POST for this profile is in flight -- lets a
  // consumer (TriageBoard) tell "still waiting on the LLM" apart from
  // "resolved, genuinely zero analyses".
  isPending(profileId: string): boolean {
    return this._pendingIds().has(profileId);
  }

  // True once a fetch for this profile has resolved (even to []). Combined
  // with isPending, distinguishes "never requested yet" from "loaded".
  hasResult(profileId: string): boolean {
    return this._analysesByProfile()[profileId] !== undefined;
  }

  // Bypasses the "already resolved" guard so a failed fetch can be retried
  // (re-selecting the same profile object doesn't retrigger the constructor's
  // effect, since the signal value is referentially unchanged).
  retry(profile: CompanyProfile): void {
    this.fetchForProfile(profile, true);
  }

  private fetchForProfile(profile: CompanyProfile, force = false): void {
    const profileId = profile.id;
    if (this._pendingIds().has(profileId)) {
      return;
    }
    if (!force && this._analysesByProfile()[profileId] !== undefined) {
      return;
    }
    this._pendingIds.update((ids) => new Set(ids).add(profileId));
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
        this._pendingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(profileId);
          return next;
        });
        if (analyses !== null) {
          this._analysesByProfile.update((byProfile) => ({ ...byProfile, [profileId]: analyses }));
        }
      });
  }
}
