import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TenderDossier, verdictLabels } from '../../data/mock-dashboard-data';

@Component({
  imports: [CommonModule],
  selector: 'app-tender-card',
  standalone: true,
  styleUrl: './tender-card.css',
  templateUrl: './tender-card.html',
})
export class TenderCardComponent {
  @Input({ required: true }) dossier!: TenderDossier;
  @Input() active = false;
  @Output() tenderSelected = new EventEmitter<string>();

  readonly verdictLabels = verdictLabels;

  selectTender(): void {
    this.tenderSelected.emit(this.dossier.id);
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
