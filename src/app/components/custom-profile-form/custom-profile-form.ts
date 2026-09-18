import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyProfile, RegFamiliarity, Role } from '../../models';

// Reactive form covering every CompanyProfile field. List-type fields are
// entered as comma-separated text and parsed into string[] on submit. No
// cross-field invariants (e.g. min <= max contract) are enforced here --
// that belongs to Epic 3's hard-filter, matching the frozen model layer.
@Component({
  selector: 'app-custom-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './custom-profile-form.html',
  styleUrl: './custom-profile-form.css',
})
export class CustomProfileFormComponent {
  @Output() submitted = new EventEmitter<CompanyProfile>();
  @Output() cancelled = new EventEmitter<void>();

  readonly roleOptions: Role[] = ['main_contractor', 'subcontractor'];
  readonly regFamiliarityOptions: RegFamiliarity[] = ['low', 'medium', 'high', 'very_high'];

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    nuts_code: ['', Validators.required],
    distance_limit_km: [0, [Validators.required, Validators.min(0)]],
    focus_areas: [''],
    min_contract_eur: [0, [Validators.required, Validators.min(0)]],
    max_contract_eur: [0, [Validators.required, Validators.min(0)]],
    max_guarantee_eur: [0, [Validators.required, Validators.min(0)]],
    role: ['' as Role | '', Validators.required],
    available_from: ['', Validators.required],
    revenue_eur: [0, [Validators.required, Validators.min(0)]],
    reg_familiarity: ['' as RegFamiliarity | '', Validators.required],
    certifications: [''],
    can_show_references: [''],
    cannot_show: [''],
  });

  formatLabel(value: string): string {
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  hasError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const profile: CompanyProfile = {
      id: this.buildId(value.name),
      name: value.name,
      location: value.location,
      nuts_code: value.nuts_code,
      distance_limit_km: value.distance_limit_km,
      focus_areas: this.parseList(value.focus_areas),
      min_contract_eur: value.min_contract_eur,
      max_contract_eur: value.max_contract_eur,
      max_guarantee_eur: value.max_guarantee_eur,
      role: value.role as Role,
      available_from: value.available_from,
      revenue_eur: value.revenue_eur,
      reg_familiarity: value.reg_familiarity as RegFamiliarity,
      certifications: this.parseList(value.certifications),
      can_show_references: this.parseList(value.can_show_references),
      cannot_show: this.parseList(value.cannot_show),
    };

    this.submitted.emit(profile);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private parseList(raw: string): string[] {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private buildId(name: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '');
    return `custom-${slug || 'profile'}-${Date.now()}`;
  }
}
