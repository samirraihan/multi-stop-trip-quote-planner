import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';
import { QuoteState, TripFormValue, TripInput } from '../models/trip.models';
import { CLOCK } from './clock';
import { QuoteService } from './quote.service';
import { snapshotKey, toTripInput, validateTrip } from './trip-validation';

interface Request {
  readonly id: number;
  readonly trip: TripInput;
  readonly key: string;
}

/**
 * Holds the state of the quote: idle, pending, success or invalid.
 *
 * Out of order replies are handled in two layers:
 *  1. switchMap drops the older request as soon as a newer one starts.
 *  2. The request id is checked again before writing state.
 * Whether a finished quote is still valid for the form is decided by the
 * component, by comparing snapshotKey with the current form value.
 */
@Injectable({ providedIn: 'root' })
export class QuoteStore {
  private readonly service = inject(QuoteService);
  private readonly clock = inject(CLOCK);
  private readonly requests$ = new Subject<Request | null>();
  private latestId = 0;

  readonly state = signal<QuoteState>({ status: 'idle' });

  constructor() {
    this.requests$
      .pipe(
        switchMap((req) => {
          if (req === null) return EMPTY;
          return this.service.calculate(req.trip).pipe(
            map((quote) => ({ req, quote })),
            catchError(() => {
              if (req.id === this.latestId) {
                this.state.set({
                  status: 'invalid',
                  issues: [{ field: 'trip', code: 'failed', message: 'Could not calculate a quote. Try again.' }],
                });
              }
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(({ req, quote }) => {
        if (req.id !== this.latestId) return;
        this.state.set({ status: 'success', requestId: req.id, snapshotKey: req.key, quote });
      });
  }

  /** Validates with the current time, then starts a new quote request if the trip is valid. */
  request(value: TripFormValue): void {
    const now = this.clock();
    const trip = toTripInput(value, now);
    this.latestId++;
    if (trip === null) {
      this.requests$.next(null); // cancel anything still running
      this.state.set({ status: 'invalid', issues: validateTrip(value, now) });
      return;
    }
    const req: Request = { id: this.latestId, trip, key: snapshotKey(trip) };
    this.state.set({ status: 'pending', requestId: req.id, snapshotKey: req.key });
    this.requests$.next(req);
  }

  /** Forget everything, including a request that is still running. */
  reset(): void {
    this.latestId++;
    this.requests$.next(null);
    this.state.set({ status: 'idle' });
  }
}
