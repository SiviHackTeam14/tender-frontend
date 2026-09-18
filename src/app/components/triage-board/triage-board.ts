import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  TenderDossier,
  getTenderDossiersForProfile,
  mockProfiles,
} from '../../data/mock-dashboard-data';
import { TenderCardComponent } from '../tender-card/tender-card';
import { TenderDetailDrawerComponent } from '../tender-detail-drawer/tender-detail-drawer';

@Component({
  imports: [CommonModule, TenderCardComponent, TenderDetailDrawerComponent],
  selector: 'app-triage-board',
  standalone: true,
  templateUrl: './triage-board.html',
  styleUrl: './triage-board.css',
})
export class TriageBoard {
  readonly activeProfile = mockProfiles[0];
  readonly dossiers = this.activeProfile ? getTenderDossiersForProfile(this.activeProfile.id) : [];
  selectedTenderId: string | null = this.dossiers.find((dossier) => dossier.analysis.verdict === 'BID')?.id ??
    this.dossiers[0]?.id ?? null;
  showSetAside = true;

  get bidDossiers(): TenderDossier[] {
    return this.dossiers.filter((dossier) => dossier.analysis.verdict === 'BID');
  }

  get reviewDossiers(): TenderDossier[] {
    return this.dossiers.filter((dossier) => dossier.analysis.verdict === 'MAYBE');
  }

  get setAsideDossiers(): TenderDossier[] {
    return this.dossiers.filter((dossier) => dossier.analysis.verdict === 'REJECT');
  }

  get selectedTender(): TenderDossier | null {
    if (this.selectedTenderId === null) {
      return null;
    }

    return this.dossiers.find((dossier) => dossier.id === this.selectedTenderId) ?? null;
  }

  get totalPipelineValue(): number {
    return this.dossiers.reduce((total, dossier) => total + (dossier.value_eur ?? 0), 0);
  }

  get blockedTenderCount(): number {
    return this.dossiers.filter((dossier) => dossier.hidden_blockers.length > 0).length;
  }

  get reviewedCount(): number {
    return this.dossiers.length;
  }

  get scannedCount(): number {
    return this.dossiers.length;
  }

  get recommendedCount(): number {
    return this.bidDossiers.length;
  }

  get reviewCount(): number {
    return this.reviewDossiers.length;
  }

  get setAsideCount(): number {
    return this.setAsideDossiers.length;
  }

  get activeProfileSummary(): string {
    return `${this.activeProfile.location} · ${this.activeProfile.focus_areas.join(' · ').replaceAll('_', ' ')}`;
  }

  getProfileInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  selectTender(tenderId: string): void {
    this.selectedTenderId = tenderId;
  }

  closeTender(): void {
    this.selectedTenderId = null;
  }

  toggleSetAside(): void {
    this.showSetAside = !this.showSetAside;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      currency: 'EUR',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(value);
  }
}
