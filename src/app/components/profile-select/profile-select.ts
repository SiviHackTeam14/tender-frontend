import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyProfile } from '../../models';
import { ProfileService } from '../../services/profile.service';
import { CustomProfileFormComponent } from '../custom-profile-form/custom-profile-form';
import { ProfileCardComponent } from '../profile-card/profile-card';

// Container for Story 4.1 -- injects ProfileService + Router, exposes the
// profile list and an in-page toggle between the card grid and the custom
// profile form (no routing involved in that toggle; the URL stays '/').
@Component({
  imports: [CommonModule, ProfileCardComponent, CustomProfileFormComponent],
  selector: 'app-profile-select',
  standalone: true,
  templateUrl: './profile-select.html',
  styleUrl: './profile-select.css',
})
export class ProfileSelect {
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly profiles = this.profileService.profiles;
  readonly activeProfile = this.profileService.activeProfile;
  readonly showCustomForm = signal(false);

  isActive(profile: CompanyProfile): boolean {
    return this.activeProfile()?.id === profile.id;
  }

  openCustomForm(): void {
    this.showCustomForm.set(true);
  }

  closeCustomForm(): void {
    this.showCustomForm.set(false);
  }

  onSelect(id: string): void {
    this.profileService.selectProfile(id);
    this.router.navigateByUrl('/board');
  }

  onCustomSubmit(profile: CompanyProfile): void {
    this.profileService.setCustomProfile(profile);
    this.router.navigateByUrl('/board');
  }
}
