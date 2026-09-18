import { Component, Input } from '@angular/core';
import { Tender, TenderAnalysis } from '../../models';
import { TenderCardComponent } from '../tender-card/tender-card';

export interface VerdictRow {
  tender: Tender;
  analysis: TenderAnalysis;
}

export type VerdictColumnVariant = 'bid' | 'maybe';

// Reusable column shell for either the BID or MAYBE canvas -- the container
// picks the title/variant, this component owns the shared header layout and
// renders one app-tender-card per row.
@Component({
  selector: 'app-verdict-column',
  imports: [TenderCardComponent],
  templateUrl: './verdict-column.html',
  styleUrl: './verdict-column.css',
})
export class VerdictColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) variant!: VerdictColumnVariant;
  @Input() rows: VerdictRow[] = [];

  get captionIcon(): string {
    return this.variant === 'bid' ? 'bolt' : 'visibility';
  }

  get captionText(): string {
    return this.variant === 'bid' ? '100% Policy Match' : 'Manual Qualification Required';
  }
}
