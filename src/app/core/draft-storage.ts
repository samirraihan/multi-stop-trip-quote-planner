import { Injectable } from '@angular/core';
import { MAX_DROPOFFS, MAX_TRUCKS, MIN_TRUCKS, isLocationId, isTruckId } from '../data/trip-data';
import { LocationId, TripFormValue } from '../models/trip.models';
import { emptyFormValue } from './trip-form';
import { parsePickupTime } from './trip-validation';

export const DRAFT_KEY = 'truck-quote-planner.draft.v1';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Turns anything read from storage into a safe form value.
 * Returns null when the data is unusable (bad JSON, not an object).
 * Individual bad fields fall back to blank or default values instead of failing the whole draft.
 */
export function sanitizeDraft(raw: string | null): TripFormValue | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;

  const base = emptyFormValue();
  const used = new Set<LocationId>();
  const takeLocation = (v: unknown): LocationId | '' => {
    if (!isLocationId(v) || used.has(v)) return '';
    used.add(v);
    return v;
  };

  const pickup = takeLocation(data['pickup']);
  const rawDrops = Array.isArray(data['dropoffs']) ? data['dropoffs'].slice(0, MAX_DROPOFFS) : [];
  const dropoffs = rawDrops.map(takeLocation);

  const count = data['truckCount'];
  const truckCount =
    typeof count === 'number' && Number.isInteger(count) && count >= MIN_TRUCKS && count <= MAX_TRUCKS
      ? count
      : base.truckCount;

  const weight = data['cargoWeight'];
  const cargoWeight = typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? weight : null;

  const at = data['pickupAt'];
  const pickupAt = typeof at === 'string' && parsePickupTime(at) !== null ? at : '';

  return {
    pickup,
    dropoffs: dropoffs.length > 0 ? dropoffs : [''],
    truckCategory: isTruckId(data['truckCategory']) ? data['truckCategory'] : base.truckCategory,
    truckCount,
    cargoWeight,
    pickupAt,
    loadingAssistance: data['loadingAssistance'] === true,
    unloadingAssistance: data['unloadingAssistance'] === true,
  };
}

@Injectable({ providedIn: 'root' })
export class DraftStorage {
  save(value: TripFormValue): boolean {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
      return true;
    } catch {
      return false; // storage full or blocked
    }
  }

  load(): TripFormValue | null {
    try {
      return sanitizeDraft(localStorage.getItem(DRAFT_KEY));
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to do */
    }
  }
}
