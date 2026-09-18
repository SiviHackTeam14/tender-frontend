import { Injectable, signal } from '@angular/core';
import { CompanyProfile } from '../models';
import profilesData from '../data/profiles.json';

// Lightweight in-memory stub. No HttpClient and no environment.useMock branch --
// Story 4.4 swaps this for real HTTP calls without touching the components
// that depend on it.
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly _profiles = signal<CompanyProfile[]>(profilesData as CompanyProfile[]);
  readonly profiles = this._profiles.asReadonly();

  private readonly _activeProfile = signal<CompanyProfile | null>(null);
  readonly activeProfile = this._activeProfile.asReadonly();

  selectProfile(id: string): void {
    const profile = this._profiles().find((candidate) => candidate.id === id);
    if (profile) {
      this._activeProfile.set(profile);
    }
  }

  setCustomProfile(profile: CompanyProfile): void {
    const exists = this._profiles().some((candidate) => candidate.id === profile.id);
    if (!exists) {
      this._profiles.update((profiles) => [...profiles, profile]);
    }
    this._activeProfile.set(profile);
  }
}
