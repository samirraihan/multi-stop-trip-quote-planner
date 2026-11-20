import { Location, LocationId, TruckCategory, TruckCategoryId } from '../models/trip.models';

export const LOCATIONS: readonly Location[] = [
  { id: 'A', name: 'Baily Road' },
  { id: 'B', name: 'Shahbagh' },
  { id: 'C', name: 'Bijoy Sarani' },
  { id: 'D', name: 'Banani' },
  { id: 'E', name: 'Uttara' },
];

export const LOCATION_IDS: readonly LocationId[] = LOCATIONS.map((l) => l.id);

export const TRUCKS: readonly TruckCategory[] = [
  { id: 'mini', label: 'Mini', capacityTonnes: 1.5, ratePerKm: 50, minimumFare: 1200 },
  { id: 'medium', label: 'Medium', capacityTonnes: 3, ratePerKm: 85, minimumFare: 2000 },
  { id: 'large', label: 'Large', capacityTonnes: 7, ratePerKm: 145, minimumFare: 3500 },
];

export const TRUCK_IDS: readonly TruckCategoryId[] = TRUCKS.map((t) => t.id);

export const LOADING_FEE_PER_TRUCK = 600;
export const UNLOADING_FEE_PER_TRUCK = 400;

export const MIN_DROPOFFS = 1;
export const MAX_DROPOFFS = 3;
export const MIN_TRUCKS = 1;
export const MAX_TRUCKS = 5;

/** Symmetric road distances in km. Keys are the two ids in alphabetical order. */
export const DISTANCES: Readonly<Record<string, number>> = {
  'A-B': 12,
  'A-C': 18,
  'A-D': 26,
  'A-E': 30,
  'B-C': 15,
  'B-D': 29,
  'B-E': 24,
  'C-D': 22,
  'C-E': 28,
  'D-E': 17,
};

export function getLocation(id: LocationId): Location {
  return LOCATIONS.find((l) => l.id === id)!;
}

export function getTruck(id: TruckCategoryId): TruckCategory {
  return TRUCKS.find((t) => t.id === id)!;
}

export function isLocationId(value: unknown): value is LocationId {
  return typeof value === 'string' && (LOCATION_IDS as readonly string[]).includes(value);
}

export function isTruckId(value: unknown): value is TruckCategoryId {
  return typeof value === 'string' && (TRUCK_IDS as readonly string[]).includes(value);
}
