import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { exhaustMap, Observable, switchMap, takeWhile, timer } from 'rxjs';
import { environment } from '../environments/environment';
import { ExtractionAccepted, ExtractionJob } from '../models/extraction';

@Injectable({ providedIn: 'root' })
export class ExtractionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/extractions`;

  // Always uses the real backend. No Gemini API key belongs in the browser.
  upload(file: File): Observable<ExtractionAccepted> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ExtractionAccepted>(this.baseUrl, body);
  }

  get(id: string): Observable<ExtractionJob> {
    return this.http.get<ExtractionJob>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  // Resume polling with a previously saved job ID. Emits the terminal state too.
  watch(id: string): Observable<ExtractionJob> {
    return timer(0, 1500).pipe(
      exhaustMap(() => this.get(id)),
      takeWhile((job) => job.status !== 'completed' && job.status !== 'failed', true),
    );
  }

  // Subscribe once per upload. Unsubscribing stops polling, not the backend job.
  extract(file: File): Observable<ExtractionJob> {
    return this.upload(file).pipe(switchMap((accepted) => this.watch(accepted.id)));
  }

  auditUrl(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}/audit`;
  }
}
