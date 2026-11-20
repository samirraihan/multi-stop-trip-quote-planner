import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TripFormValue } from '../models/trip.models';
import { CLOCK } from './clock';
import { QuoteStore } from './quote-store';
import { QUOTE_LATENCY } from './quote.service';
import { snapshotKey } from './trip-validation';

const trip: TripFormValue = {
  pickup: 'A',
  dropoffs: ['B', 'C'],
  truckCategory: 'medium',
  truckCount: 2,
  cargoWeight: 5,
  pickupAt: '2026-11-21T09:00',
  loadingAssistance: true,
  unloadingAssistance: false,
};

describe('QuoteStore', () => {
  let store: QuoteStore;
  let now: Date;
  // The first request is slow (1000 ms), later ones are fast (300 ms).
  let delays: number[];

  beforeEach(() => {
    now = new Date(2026, 10, 20, 12, 0, 0);
    delays = [1000, 300];
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: QUOTE_LATENCY, useValue: () => delays.shift() ?? 300 },
      ],
    });
    store = TestBed.inject(QuoteStore);
  });

  it('goes from pending to success without waiting for real timers', fakeAsync(() => {
    store.request(trip);
    expect(store.state().status).toBe('pending');
    tick(1000);
    const s = store.state();
    expect(s.status).toBe('success');
    if (s.status === 'success') expect(s.quote.totalQuote).toBe(5790);
  }));

  it('lets the newest request win even if an older one would finish later', fakeAsync(() => {
    store.request(trip); // slow, 1000 ms
    store.request({ ...trip, truckCount: 1, cargoWeight: 3 }); // fast, 300 ms
    tick(300);
    let s = store.state();
    expect(s.status).toBe('success');
    if (s.status === 'success') {
      expect(s.quote.truckCount).toBe(1);
      expect(s.snapshotKey).toBe(snapshotKey({ ...trip, truckCount: 1, cargoWeight: 3 }));
    }
    tick(1000); // the old reply must never overwrite the new one
    s = store.state();
    if (s.status === 'success') expect(s.quote.truckCount).toBe(1);
  }));

  it('reports invalid and cancels a running request when the pickup time has passed', fakeAsync(() => {
    store.request(trip);
    now = new Date(2026, 10, 21, 10, 0, 0); // time moved past the pickup
    store.request(trip);
    expect(store.state().status).toBe('invalid');
    tick(1200);
    expect(store.state().status).toBe('invalid'); // the first request did not come back
  }));

  it('reset clears the state and ignores a pending reply', fakeAsync(() => {
    store.request(trip);
    store.reset();
    tick(1200);
    expect(store.state().status).toBe('idle');
  }));
});
