import { MAX_DROPOFFS, MAX_TRUCKS, MIN_DROPOFFS, MIN_TRUCKS, getTruck, isLocationId } from '../data/trip-data';
import { TripFormValue, TripInput, ValidationIssue } from '../models/trip.models';

export function parsePickupTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFuture(value: string, now: Date): boolean {
  const date = parsePickupTime(value);
  return date !== null && date.getTime() > now.getTime();
}

export function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

export function totalCapacity(value: Pick<TripFormValue, 'truckCategory' | 'truckCount'>): number {
  return getTruck(value.truckCategory).capacityTonnes * (value.truckCount ?? 0);
}

/**
 * Checks the whole trip against every business rule.
 * `now` is passed in so the pickup check always uses the current time
 * at the moment of the call, and so tests can fix the clock.
 */
export function validateTrip(value: TripFormValue, now: Date): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: ValidationIssue['field'], code: string, message: string) =>
    issues.push({ field, code, message });

  if (!isLocationId(value.pickup)) {
    add('pickup', 'required', 'Choose a pickup location.');
  }

  if (value.dropoffs.length < MIN_DROPOFFS) {
    add('dropoffs', 'required', 'Add at least one drop-off.');
  }
  if (value.dropoffs.length > MAX_DROPOFFS) {
    add('dropoffs', 'tooMany', `You can add at most ${MAX_DROPOFFS} drop-offs.`);
  }
  if (value.dropoffs.some((d) => !isLocationId(d))) {
    add('dropoffs', 'incomplete', 'Choose a location for every drop-off.');
  }

  const dupes = findDuplicates([value.pickup, ...value.dropoffs]);
  if (dupes.length > 0) {
    add('trip', 'duplicate', 'A location can only be used once in a trip.');
  }

  const count = value.truckCount;
  if (count === null || !Number.isInteger(count) || count < MIN_TRUCKS || count > MAX_TRUCKS) {
    add('truckCount', 'range', `Truck count must be a whole number from ${MIN_TRUCKS} to ${MAX_TRUCKS}.`);
  }

  const weight = value.cargoWeight;
  if (weight === null || !Number.isFinite(weight) || weight <= 0) {
    add('cargoWeight', 'positive', 'Enter a cargo weight greater than 0 tonnes.');
  } else if (count !== null && Number.isInteger(count) && count >= MIN_TRUCKS && count <= MAX_TRUCKS) {
    const capacity = totalCapacity(value);
    if (weight > capacity) {
      add(
        'cargoWeight',
        'capacity',
        `Cargo is ${weight} t but ${count} ${getTruck(value.truckCategory).label} truck(s) carry at most ${capacity} t.`,
      );
    }
  }

  if (!value.pickupAt || parsePickupTime(value.pickupAt) === null) {
    add('pickupAt', 'required', 'Choose a pickup date and time.');
  } else if (!isFuture(value.pickupAt, now)) {
    add('pickupAt', 'past', 'Pickup time must be later than the current time.');
  }

  return issues;
}

/** Returns a priceable trip, or null if anything is invalid. */
export function toTripInput(value: TripFormValue, now: Date): TripInput | null {
  if (validateTrip(value, now).length > 0) return null;
  return {
    pickup: value.pickup as TripInput['pickup'],
    dropoffs: value.dropoffs as TripInput['dropoffs'],
    truckCategory: value.truckCategory,
    truckCount: value.truckCount as number,
    cargoWeight: value.cargoWeight as number,
    pickupAt: value.pickupAt,
    loadingAssistance: value.loadingAssistance,
    unloadingAssistance: value.unloadingAssistance,
  };
}

/** Stable text version of a trip. Two trips match only if every input matches. */
export function snapshotKey(trip: TripFormValue | TripInput): string {
  return JSON.stringify([
    trip.pickup,
    trip.dropoffs,
    trip.truckCategory,
    trip.truckCount,
    trip.cargoWeight,
    trip.pickupAt,
    trip.loadingAssistance,
    trip.unloadingAssistance,
  ]);
}
