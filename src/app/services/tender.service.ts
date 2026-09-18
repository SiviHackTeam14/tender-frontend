import { Injectable, signal } from '@angular/core';
import { Tender } from '../models';
import tendersData from '../data/tenders.json';

// Lightweight in-memory stub. No HttpClient and no environment.useMock branch --
// Story 4.4 swaps this for real HTTP calls without touching the components
// that depend on it.
@Injectable({ providedIn: 'root' })
export class TenderService {
  private readonly _tenders = signal<Tender[]>(tendersData as Tender[]);
  readonly tenders = this._tenders.asReadonly();
}
