import { Injectable, signal } from '@angular/core';
import { TenderAnalysis } from '../models';
import analysesData from '../data/analyses.json';

// Mock shape: a dict keyed by profile id ('profile-a' / 'profile-b'), each
// value a TenderAnalysis[] matched to tenders.json by tender_id.
type AnalysesByProfile = Record<string, TenderAnalysis[]>;

// Lightweight in-memory stub. No HttpClient and no environment.useMock branch --
// Story 4.4 swaps this for real HTTP calls without touching the components
// that depend on it.
@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly _analysesByProfile = signal<AnalysesByProfile>(
    analysesData as AnalysesByProfile,
  );

  // Returns [] for a profile id with no precomputed mock analyses (e.g. a
  // custom profile) -- callers decide what "no analyses" means for them.
  analysesForProfile(profileId: string): TenderAnalysis[] {
    return this._analysesByProfile()[profileId] ?? [];
  }
}
