import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { apiPath, environment } from '../environments/environment';
import { CompanyProfile } from '../models';
import profilesData from '../data/profiles.json';

// HttpClient wrapper over GET /api/profiles, with environment.useMock switching
// back to the local fixture -- Story 4.4. `selectProfile`/`setCustomProfile`
// stay pure client-side state either way; no HTTP involved in either.
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiPath('/api/profiles');

  readonly error = signal<string | null>(null);

  private readonly _profiles = signal<CompanyProfile[]>(
    environment.useMock ? (profilesData as CompanyProfile[]) : [],
  );
  readonly profiles = this._profiles.asReadonly();

  private readonly _activeProfile = signal<CompanyProfile | null>(null);
  readonly activeProfile = this._activeProfile.asReadonly();

  constructor() {
    if (!environment.useMock) {
      this.http
        .get<CompanyProfile[]>(this.baseUrl)
        .pipe(
          tap(() => this.error.set(null)),
          catchError((err) => {
            this.error.set('Failed to load profiles.');
            console.error('ProfileService: failed to fetch profiles', err);
            return of<CompanyProfile[]>([]);
          }),
        )
        .subscribe((profiles) => this._profiles.set(profiles));
    }
  }

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
