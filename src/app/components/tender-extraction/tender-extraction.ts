import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ExtractionJob, ExtractionStatus } from '../../models/extraction';
import { ExtractionService } from '../../services/extraction.service';

const STATUS_LABELS: Record<ExtractionStatus, string> = {
  queued: 'Waiting to start',
  selecting: 'Selecting relevant documents',
  reading: 'Reading PDF pages',
  extracting: 'Extracting document fields',
  completed: 'Extraction complete',
  failed: 'Extraction failed',
};

@Component({
  selector: 'app-tender-extraction',
  templateUrl: './tender-extraction.html',
  styleUrl: './tender-extraction.css',
})
export class TenderExtraction {
  readonly extractor = inject(ExtractionService);
  private readonly destroyRef = inject(DestroyRef);
  readonly selectedFile = signal<File | null>(null);
  readonly job = signal<ExtractionJob | null>(null);
  readonly jobId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly canResume = computed(() => !!this.jobId() && !!this.error()
    && this.job()?.status !== 'failed' && this.job()?.status !== 'completed');
  readonly statusLabel = computed(() => {
    const job = this.job();
    return job ? STATUS_LABELS[job.status] : this.busy() ? 'Uploading tender' : '';
  });
  readonly json = computed(() => {
    const fields = this.job()?.result?.fields;
    return fields ? JSON.stringify(fields, null, 2) : '';
  });

  selectFile(event: Event): void {
    if (this.busy() || this.canResume()) return;
    this.selectedFile.set(null);
    this.job.set(null);
    this.jobId.set(null);
    this.error.set(null);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.error.set('Choose a tender ZIP containing PDF documents.');
    } else if (file.size > 50 * 1024 * 1024) {
      this.error.set('The ZIP must be 50 MiB or smaller.');
    } else {
      this.selectedFile.set(file);
    }
  }

  start(): void {
    const file = this.selectedFile();
    if (!file || this.busy() || this.canResume()) return;
    this.busy.set(true);
    this.error.set(null);
    this.job.set(null);
    this.jobId.set(null);
    this.extractor.upload(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: accepted => {
        this.jobId.set(accepted.id);
        this.poll(accepted.id);
      },
      error: (error: HttpErrorResponse) => this.fail(error, 'Upload failed; check the connection and try again.'),
    });
  }

  resume(): void {
    const id = this.jobId();
    if (!id || this.busy() || !this.canResume()) return;
    this.busy.set(true);
    this.error.set(null);
    this.poll(id);
  }

  private poll(id: string): void {
    this.extractor.watch(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: job => {
        this.job.set(job);
        if (job.status === 'completed' || job.status === 'failed') this.busy.set(false);
        if (job.status === 'failed') this.error.set(job.error?.message ?? 'Extraction failed.');
      },
      error: (error: HttpErrorResponse) => {
        // An expired job cannot be resumed; a transient polling failure can.
        if (error.status === 404) this.jobId.set(null);
        this.fail(error, 'Progress could not be loaded; resume to check the same extraction.');
      },
    });
  }

  private fail(error: HttpErrorResponse, fallback: string): void {
    this.busy.set(false);
    const message: unknown = error.error?.detail?.message;
    this.error.set(typeof message === 'string' ? message : fallback);
  }
}
