import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { Quote, TripInput } from '../models/trip.models';
import { calculateQuote } from './pricing';

/** How long a fake request takes, in ms. Replaced in tests so no real waiting is needed. */
export type LatencyFn = (trip: TripInput) => number;

export const MIN_LATENCY_MS = 300;
export const MAX_LATENCY_MS = 1200;

export const QUOTE_LATENCY = new InjectionToken<LatencyFn>('QUOTE_LATENCY', {
  providedIn: 'root',
  factory: () => () => MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS),
});

/** Pretends to be a server. Each call takes a different time, so replies can arrive out of order. */
@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly latency = inject(QUOTE_LATENCY);

  calculate(trip: TripInput): Observable<Quote> {
    return timer(this.latency(trip)).pipe(map(() => calculateQuote(trip)));
  }
}
