import { DISTANCES, LOADING_FEE_PER_TRUCK, UNLOADING_FEE_PER_TRUCK, getTruck } from '../data/trip-data';
import { LocationId, Quote, TripInput } from '../models/trip.models';

export function distanceBetween(a: LocationId, b: LocationId): number {
  const key = [a, b].sort().join('-');
  const km = DISTANCES[key];
  if (km === undefined) {
    throw new Error(`No distance known between ${a} and ${b}`);
  }
  return km;
}

/** Sum of every consecutive leg in the order given. No return leg. */
export function routeDistance(route: readonly LocationId[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceBetween(route[i], route[i + 1]);
  }
  return total;
}

export function calculateQuote(trip: TripInput): Quote {
  const truck = getTruck(trip.truckCategory);
  const route = [trip.pickup, ...trip.dropoffs];
  const distanceKm = routeDistance(route);

  const farePerTruck = Math.max(distanceKm * truck.ratePerKm, truck.minimumFare);
  const transportCost = farePerTruck * trip.truckCount;

  const feePerTruck =
    (trip.loadingAssistance ? LOADING_FEE_PER_TRUCK : 0) +
    (trip.unloadingAssistance ? UNLOADING_FEE_PER_TRUCK : 0);
  const serviceCost = feePerTruck * trip.truckCount;

  return {
    route,
    distanceKm,
    farePerTruck,
    transportCost,
    serviceCost,
    totalQuote: transportCost + serviceCost,
    truckCount: trip.truckCount,
    truckCategory: trip.truckCategory,
  };
}
