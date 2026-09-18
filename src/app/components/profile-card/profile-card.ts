import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CompanyProfile } from '../../models';

// Renders a single CompanyProfile as a selectable card (Stitch "VIEW 2: PROFILE
// SELECTION" card markup). Purely presentational -- the container decides
// which profile is active and what happens after (select) fires.
@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.css',
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: CompanyProfile;
  @Input() isActive = false;

  @Output() select = new EventEmitter<string>();

  get initials(): string {
    const letters = this.profile.name
      .split(/\s+/)
      .filter((word) => /^[A-Za-z]/.test(word))
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase());
    return letters.join('') || '?';
  }

  get focusAreasLabel(): string {
    return this.profile.focus_areas.map((area) => this.formatLabel(area)).join(', ');
  }

  get roleLabel(): string {
    return this.formatLabel(this.profile.role);
  }

  get contractRangeLabel(): string {
    return `${this.formatEur(this.profile.min_contract_eur)} – ${this.formatEur(this.profile.max_contract_eur)}`;
  }

  get revenueLabel(): string {
    return this.formatEur(this.profile.revenue_eur);
  }

  get regFamiliarityLabel(): string {
    return this.formatLabel(this.profile.reg_familiarity);
  }

  onAnalyzeClick(): void {
    this.select.emit(this.profile.id);
  }

  private formatLabel(value: string): string {
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatEur(value: number): string {
    if (value >= 1_000_000) {
      return `€${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `€${Math.round(value / 1000)}k`;
    }
    return `€${value}`;
  }
}
