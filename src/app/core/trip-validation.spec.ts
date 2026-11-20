import { TripFormValue } from '../models/trip.models';
import { toTripInput, validateTrip } from './trip-validation';

const now = new Date(2026, 10, 20, 12, 0, 0); // 20 Nov 2026, 12:00 local

const valid: TripFormValue = {
  pickup: 'A',
  dropoffs: ['B', 'C'],
  truckCategory: 'medium',
  truckCount: 2,
  cargoWeight: 5,
  pickupAt: '2026-11-21T09:00',
  loadingAssistance: false,
  unloadingAssistance: false,
};

const codes = (v: TripFormValue, at = now) => validateTrip(v, at).map((i) => i.code);

describe('trip validation', () => {
  it('accepts a valid trip', () => {
    expect(validateTrip(valid, now)).toEqual([]);
    expect(toTripInput(valid, now)).not.toBeNull();
  });

  it('rejects a location used twice, including the pickup', () => {
    expect(codes({ ...valid, dropoffs: ['B', 'B'] })).toContain('duplicate');
    expect(codes({ ...valid, dropoffs: ['A'] })).toContain('duplicate');
  });

  it('rejects cargo above truck capacity times truck count', () => {
    expect(codes({ ...valid, cargoWeight: 6 })).toEqual([]); // 2 x 3 t = 6 t, exactly full
    expect(codes({ ...valid, cargoWeight: 6.1 })).toContain('capacity');
  });

  it('rejects truck counts outside 1 to 5 and non positive weight', () => {
    expect(codes({ ...valid, truckCount: 0 })).toContain('range');
    expect(codes({ ...valid, truckCount: 6 })).toContain('range');
    expect(codes({ ...valid, cargoWeight: 0 })).toContain('positive');
  });

  it('checks the pickup time against the time given at call time', () => {
    expect(codes(valid, now)).toEqual([]);
    const later = new Date(2026, 10, 21, 9, 0, 0); // exactly the pickup time
    expect(codes(valid, later)).toContain('past'); // must be strictly later
  });
});
