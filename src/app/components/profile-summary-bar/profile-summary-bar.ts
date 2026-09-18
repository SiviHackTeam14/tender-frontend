import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

// Board header: active profile identity + BID/MAYBE/REJECT telemetry counts,
// a "Switch profile" action back to '/', and the set-aside trigger that the
// container (TriageBoard) uses to open CollapsedRejectsComponent.
@Component({
  selector: 'app-profile-summary-bar',
  imports: [],
  templateUrl: './profile-summary-bar.html',
  styleUrl: './profile-summary-bar.css',
})
export class ProfileSummaryBarComponent {
  @Input({ required: true }) profileName!: string;
  @Input({ required: true }) totalCount!: number;
  @Input({ required: true }) bidCount!: number;
  @Input({ required: true }) maybeCount!: number;
  @Input({ required: true }) rejectCount!: number;

  @Output() setAsideClick = new EventEmitter<void>();

  private readonly router = inject(Router);

  get initial(): string {
    return this.profileName.charAt(0).toUpperCase() || '?';
  }

  switchProfile(): void {
    this.router.navigateByUrl('/');
  }
}
