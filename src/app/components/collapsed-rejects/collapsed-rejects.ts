import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Tender, TenderAnalysis } from '../../models';

export interface RejectRow {
  tender: Tender;
  analysis: TenderAnalysis;
}

// In-page set-aside audit modal (Stitch "set_aside_tenders_fatal_flaws_audit"
// screen), opened from ProfileSummaryBarComponent's trigger. The search box
// and "Restore to Review" button are ported as static, non-functional markup
// per spec -- no story defines what "restoring" a verdict means for data
// flow, and this stub never adds client-side reasoning/categorization logic
// over hard_reject_reason.
@Component({
  selector: 'app-collapsed-rejects',
  imports: [],
  templateUrl: './collapsed-rejects.html',
  styleUrl: './collapsed-rejects.css',
})
export class CollapsedRejectsComponent {
  @Input() rows: RejectRow[] = [];
  @Input() open = false;

  @Output() closed = new EventEmitter<void>();

  // The close button's title ("Close (Esc)") promises Escape dismisses the
  // modal -- honor that regardless of which element currently has focus.
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
