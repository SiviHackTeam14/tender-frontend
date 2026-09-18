import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CriteriaBreakdownComponent } from '../criteria-breakdown/criteria-breakdown';
import { TenderDossier, verdictLabels } from '../../data/mock-dashboard-data';

@Component({
  imports: [CommonModule, CriteriaBreakdownComponent],
  selector: 'app-tender-detail-drawer',
  standalone: true,
  styleUrl: './tender-detail-drawer.css',
  templateUrl: './tender-detail-drawer.html',
})
export class TenderDetailDrawerComponent {
  @Input({ required: true }) dossier: TenderDossier | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly verdictLabels = verdictLabels;

  closeDrawer(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDrawer();
    }
  }

  formatMoney(value: number | null): string {
    if (value === null) {
      return 'Not published';
    }

    return new Intl.NumberFormat('de-DE', {
      currency: 'EUR',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(value);
  }

  formatDistance(value: number): string {
    return `${value.toLocaleString('de-DE')} km`;
  }

  formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoDate));
  }
}
