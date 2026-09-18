import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { apiPath, environment } from '../environments/environment';
import { Tender } from '../models';
import tendersData from '../data/tenders.json';

// HttpClient wrapper over GET /api/tenders, with environment.useMock switching
// back to the local fixture -- Story 4.4. Consumers keep reading `tenders()`
// as a signal either way; no component changes needed to flip the flag.
@Injectable({ providedIn: 'root' })
export class TenderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiPath('/api/tenders');

  readonly error = signal<string | null>(null);

  readonly tenders = environment.useMock
    ? signal<Tender[]>(tendersData as Tender[]).asReadonly()
    : toSignal(
        this.http.get<Tender[]>(this.baseUrl).pipe(
          tap(() => this.error.set(null)),
          catchError((err) => {
            this.error.set('Failed to load tenders.');
            console.error('TenderService: failed to fetch tenders', err);
            return of<Tender[]>([]);
          }),
        ),
        { initialValue: [] },
      );
}
