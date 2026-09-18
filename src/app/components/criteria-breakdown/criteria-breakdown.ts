import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AnalysisCriteria, CriterionResult } from '../../models';

type CriteriaItem = {
  key: keyof AnalysisCriteria;
  label: string;
  result: CriterionResult;
};

@Component({
  imports: [CommonModule],
  selector: 'app-criteria-breakdown',
  standalone: true,
  styleUrl: './criteria-breakdown.css',
  templateUrl: './criteria-breakdown.html',
})
export class CriteriaBreakdownComponent {
  @Input({ required: true }) criteria!: AnalysisCriteria;

  get criteriaItems(): CriteriaItem[] {
    return [
      {
        key: 'reference_eligibility',
        label: 'Reference eligibility',
        result: this.criteria.reference_eligibility,
      },
      {
        key: 'financial_capacity',
        label: 'Financial capacity',
        result: this.criteria.financial_capacity,
      },
      {
        key: 'regulatory_familiarity',
        label: 'Regulatory familiarity',
        result: this.criteria.regulatory_familiarity,
      },
      {
        key: 'competitive_position',
        label: 'Competitive position',
        result: this.criteria.competitive_position,
      },
      {
        key: 'strategic_fit',
        label: 'Strategic fit',
        result: this.criteria.strategic_fit,
      },
    ];
  }

  countStatus(status: CriterionResult['status']): number {
    return this.criteriaItems.filter((item) => item.result.status === status).length;
  }
}
