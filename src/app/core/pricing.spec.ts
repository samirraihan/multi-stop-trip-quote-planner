import { calculateQuote, routeDistance } from './pricing';
import { TripInput } from '../models/trip.models';

const base: TripInput = {
  pickup: 'A',
  dropoffs: ['B', 'C'],
  truckCategory: 'medium',
  truckCount: 2,
  cargoWeight: 5,
  pickupAt: '2030-01-01T10:00',
  loadingAssistance: true,
  unloadingAssistance: false,
};

describe('pricing', () => {
  it('matches the verification example from the brief', () => {
    const q = calculateQuote(base);
    expect(q.distanceKm).toBe(27);
    expect(q.transportCost).toBe(4590);
    expect(q.serviceCost).toBe(1200);
    expect(q.totalQuote).toBe(5790);
  });

  it('uses the minimum fare when distance times rate is lower', () => {
    const q = calculateQuote({ ...base, dropoffs: ['B'], truckCategory: 'large', truckCount: 1, cargoWeight: 2, loadingAssistance: false });
    // 12 km * 145 = 1740, minimum is 3500
    expect(q.farePerTruck).toBe(3500);
    expect(q.totalQuote).toBe(3500);
  });

  it('sums every leg in the chosen order and has no return leg', () => {
    expect(routeDistance(['A', 'B', 'C'])).toBe(27);
    expect(routeDistance(['A', 'C', 'B'])).toBe(33);
    expect(routeDistance(['A', 'B', 'C', 'D'])).toBe(12 + 15 + 22);
  });

  it('adds both service fees per truck', () => {
    const q = calculateQuote({ ...base, truckCount: 3, loadingAssistance: true, unloadingAssistance: true });
    expect(q.serviceCost).toBe(3000);
  });
});
