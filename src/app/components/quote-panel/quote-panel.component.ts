import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { getLocation, getTruck } from '../../data/trip-data';
import { Quote, ValidationIssue } from '../../models/trip.models';

export type QuoteView =
  | { kind: 'idle' }
  | { kind: 'pending'; inputsChanged: boolean }
  | { kind: 'success'; quote: Quote }
  | { kind: 'stale' }
  | { kind: 'invalid'; issues: readonly ValidationIssue[] };

@Component({
  selector: 'app-quote-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './quote-panel.component.html',
  styleUrl: './quote-panel.component.css',
})
export class QuotePanelComponent {
  readonly view = input.required<QuoteView>();

  readonly quote = computed(() => {
    const v = this.view();
    return v.kind === 'success' ? v.quote : null;
  });

  routeText(quote: Quote): string {
    return quote.route.map((id) => getLocation(id).name).join(' → ');
  }

  truckText(quote: Quote): string {
    return `${quote.truckCount} x ${getTruck(quote.truckCategory).label}`;
  }
}
