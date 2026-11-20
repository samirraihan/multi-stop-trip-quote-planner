import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAX_TRUCKS, MIN_TRUCKS } from '../data/trip-data';
import { LocationId, TripFormValue, TruckCategoryId } from '../models/trip.models';
import { Clock } from './clock';
import { findDuplicates, isFuture, totalCapacity } from './trip-validation';

export type TripForm = FormGroup<{
  pickup: FormControl<LocationId | ''>;
  dropoffs: FormArray<FormControl<LocationId | ''>>;
  truckCategory: FormControl<TruckCategoryId>;
  truckCount: FormControl<number | null>;
  cargoWeight: FormControl<number | null>;
  pickupAt: FormControl<string>;
  loadingAssistance: FormControl<boolean>;
  unloadingAssistance: FormControl<boolean>;
}>;

export function dropoffControl(value: LocationId | '' = ''): FormControl<LocationId | ''> {
  return new FormControl<LocationId | ''>(value, { nonNullable: true, validators: [Validators.required] });
}

/** Runs every time the control is validated, so it always compares with the current time. */
export function futureDateValidator(clock: Clock): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null; // required handles empty
    return isFuture(value, clock()) ? null : { past: true };
  };
}

/** Group level rule: no location may appear twice, pickup included. */
export const uniqueLocationsValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const v = group.getRawValue() as TripFormValue;
  const dupes = findDuplicates([v.pickup, ...v.dropoffs]);
  return dupes.length ? { duplicateLocations: { ids: dupes } } : null;
};

/** Group level rule: cargo must fit in the chosen trucks. */
export const capacityValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const v = group.getRawValue() as TripFormValue;
  if (v.cargoWeight === null || v.cargoWeight <= 0 || v.truckCount === null) return null;
  const capacity = totalCapacity(v);
  return v.cargoWeight > capacity ? { capacityExceeded: { capacity, weight: v.cargoWeight } } : null;
};

export function buildTripForm(clock: Clock): TripForm {
  return new FormGroup(
    {
      pickup: new FormControl<LocationId | ''>('', { nonNullable: true, validators: [Validators.required] }),
      dropoffs: new FormArray<FormControl<LocationId | ''>>([dropoffControl()], {
        validators: [Validators.minLength(1), Validators.maxLength(3)],
      }),
      truckCategory: new FormControl<TruckCategoryId>('medium', { nonNullable: true }),
      truckCount: new FormControl<number | null>(1, [
        Validators.required,
        Validators.min(MIN_TRUCKS),
        Validators.max(MAX_TRUCKS),
        (c) => (c.value !== null && !Number.isInteger(c.value) ? { integer: true } : null),
      ]),
      cargoWeight: new FormControl<number | null>(null, [Validators.required, Validators.min(0.001)]),
      pickupAt: new FormControl('', { nonNullable: true, validators: [Validators.required, futureDateValidator(clock)] }),
      loadingAssistance: new FormControl(false, { nonNullable: true }),
      unloadingAssistance: new FormControl(false, { nonNullable: true }),
    },
    { validators: [uniqueLocationsValidator, capacityValidator] },
  );
}

/** Replaces the form contents with a (cleaned) value, rebuilding the dropoff list. */
export function applyValueToForm(form: TripForm, value: TripFormValue): void {
  form.controls.dropoffs.clear();
  for (const d of value.dropoffs) form.controls.dropoffs.push(dropoffControl(d));
  form.patchValue({
    pickup: value.pickup,
    truckCategory: value.truckCategory,
    truckCount: value.truckCount,
    cargoWeight: value.cargoWeight,
    pickupAt: value.pickupAt,
    loadingAssistance: value.loadingAssistance,
    unloadingAssistance: value.unloadingAssistance,
  });
}

export function emptyFormValue(): TripFormValue {
  return {
    pickup: '',
    dropoffs: [''],
    truckCategory: 'medium',
    truckCount: 1,
    cargoWeight: null,
    pickupAt: '',
    loadingAssistance: false,
    unloadingAssistance: false,
  };
}
