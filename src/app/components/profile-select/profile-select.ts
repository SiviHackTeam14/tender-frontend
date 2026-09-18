import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getTenderDossiersForProfile, mockProfiles } from '../../data/mock-dashboard-data';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-profile-select',
  standalone: true,
  templateUrl: './profile-select.html',
  styleUrl: './profile-select.css',
})
export class ProfileSelect {
  readonly profiles = mockProfiles;

  dossiersForProfile(profileId: string) {
    return getTenderDossiersForProfile(profileId);
  }

  profileSummary(profileId: string): { bid: number; review: number; reject: number; total: number } {
    const dossiers = this.dossiersForProfile(profileId);

    return {
      bid: dossiers.filter((dossier) => dossier.analysis.verdict === 'BID').length,
      reject: dossiers.filter((dossier) => dossier.analysis.verdict === 'REJECT').length,
      review: dossiers.filter((dossier) => dossier.analysis.verdict === 'MAYBE').length,
      total: dossiers.length,
    };
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      currency: 'EUR',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(value);
  }

  formatFocusAreas(focusAreas: string[]): string {
    return focusAreas.map((focusArea) => focusArea.replaceAll('_', ' ')).join(' · ');
  }

  formatRegFamiliarity(value: string): string {
    return value.replaceAll('_', ' ');
  }

  getProfileInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
