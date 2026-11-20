import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { LOCATIONS, MAX_DROPOFFS, MAX_TRUCKS, MIN_DROPOFFS, MIN_TRUCKS, TRUCKS, getTruck } from '../../data/trip-data';
import { LocationId, TripFormValue } from '../../models/trip.models';
import { CLOCK } from '../../core/clock';
import { DraftStorage } from '../../core/draft-storage';
import { QuoteStore } from '../../core/quote-store';
import { applyValueToForm, buildTripForm, dropoffControl, emptyFormValue } from '../../core/trip-form';
import { snapshotKey } from '../../core/trip-validation';
import { QuotePanelComponent, QuoteView } from '../quote-panel/quote-panel.component';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats a date the way <input type="datetime-local"> expects, in local time. */
function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, CdkDragHandle, QuotePanelComponent],
  templateUrl: './trip-planner.component.html',
  styleUrl: './trip-planner.component.css',
})
export class TripPlannerComponent {
  private readonly clock = inject(CLOCK);
  private readonly drafts = inject(DraftStorage);
  private readonly store = inject(QuoteStore);

  readonly locations = LOCATIONS;
  readonly trucks = TRUCKS;
  readonly maxDropoffs = MAX_DROPOFFS;
  readonly minDropoffs = MIN_DROPOFFS;
  readonly minTrucks = MIN_TRUCKS;
  readonly maxTrucks = MAX_TRUCKS;

  readonly form = buildTripForm(this.clock);
  readonly dropoffs = this.form.controls.dropoffs;

  readonly draftMessage = signal<string>('');
  readonly minPickup = signal(toLocalInputValue(this.clock()));

  /** Live copy of the form value, so computed signals update when the user edits. */
  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(
      map(() => this.form.getRawValue() as TripFormValue),
      startWith(this.form.getRawValue() as TripFormValue),
    ),
    { requireSync: true },
  );

  private readonly formStatus = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)), {
    requireSync: true,
  });

  readonly canRequest = computed(() => this.formStatus() === 'VALID');

  readonly capacityHint = computed(() => {
    const v = this.formValue();
    const truck = getTruck(v.truckCategory);
    const count = v.truckCount ?? 0;
    return `${truck.label} carries ${truck.capacityTonnes} t per truck, so ${count} truck(s) carry up to ${truck.capacityTonnes * count} t.`;
  });

  /** What the quote panel shows. A finished quote is only shown if the form still matches it. */
  readonly view = computed<QuoteView>(() => {
    const state = this.store.state();
    const currentKey = snapshotKey(this.formValue());
    switch (state.status) {
      case 'idle':
        return { kind: 'idle' };
      case 'pending':
        return { kind: 'pending', inputsChanged: state.snapshotKey !== currentKey };
      case 'success':
        return state.snapshotKey === currentKey ? { kind: 'success', quote: state.quote } : { kind: 'stale' };
      case 'invalid':
        return { kind: 'invalid', issues: state.issues };
    }
  });

  constructor() {
    const saved = this.drafts.load();
    if (saved) {
      applyValueToForm(this.form, saved);
      this.form.markAllAsTouched(); // so problems such as a past pickup time are visible
      this.draftMessage.set('Saved draft restored. Press "Get quote" to price it.');
    }
  }

  // ----- drop-off list -----

  addDropoff(): void {
    if (this.dropoffs.length >= MAX_DROPOFFS) return;
    this.dropoffs.push(dropoffControl());
  }

  removeDropoff(index: number): void {
    if (this.dropoffs.length <= MIN_DROPOFFS) return;
    this.dropoffs.removeAt(index);
  }

  moveDropoff(from: number, to: number): void {
    if (to < 0 || to >= this.dropoffs.length || from === to) return;
    const control = this.dropoffs.at(from);
    this.dropoffs.removeAt(from);
    this.dropoffs.insert(to, control);
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    this.moveDropoff(event.previousIndex, event.currentIndex);
  }

  /** True if the location is already used by the pickup or by a different drop-off. */
  isTaken(id: LocationId, dropoffIndex: number | 'pickup'): boolean {
    const v = this.formValue();
    if (dropoffIndex === 'pickup') return v.dropoffs.includes(id);
    return v.pickup === id || v.dropoffs.some((d, i) => d === id && i !== dropoffIndex);
  }

  // ----- messages -----

  showError(name: 'pickup' | 'truckCount' | 'cargoWeight' | 'pickupAt'): string | null {
    const c = this.form.controls[name];
    if (!(c.touched || c.dirty)) return null;
    const e = c.errors;
    if (e) {
      if (e['required']) {
        return {
          pickup: 'Choose a pickup location.',
          truckCount: 'Enter the number of trucks.',
          cargoWeight: 'Enter the cargo weight in tonnes.',
          pickupAt: 'Choose a pickup date and time.',
        }[name];
      }
      if (e['min'] && name === 'cargoWeight') return 'Cargo weight must be greater than 0.';
      if (e['min'] || e['max'] || e['integer']) return `Use a whole number from ${MIN_TRUCKS} to ${MAX_TRUCKS}.`;
      if (e['past']) return 'Pickup time must be later than the current time.';
    }
    if (name === 'cargoWeight' && this.form.errors?.['capacityExceeded']) {
      const info = this.form.errors['capacityExceeded'] as { capacity: number; weight: number };
      return `Cargo (${info.weight} t) is more than the selected trucks can carry (${info.capacity} t).`;
    }
    return null;
  }

  dropoffError(index: number): string | null {
    const c = this.dropoffs.at(index);
    return (c.touched || c.dirty) && c.errors?.['required'] ? 'Choose a drop-off location.' : null;
  }

  readonly duplicateMessage = computed(() => {
    this.formValue();
    const dupes = this.form.errors?.['duplicateLocations'] as { ids: string[] } | undefined;
    return dupes ? 'The same location cannot be used twice in one trip.' : null;
  });

  // ----- actions -----

  requestQuote(): void {
    // Time moves on, so check the pickup time again right now.
    this.minPickup.set(toLocalInputValue(this.clock()));
    this.form.controls.pickupAt.updateValueAndValidity();
    this.form.markAllAsTouched();
    this.store.request(this.form.getRawValue() as TripFormValue);
  }

  saveDraft(): void {
    const ok = this.drafts.save(this.form.getRawValue() as TripFormValue);
    const time = this.clock().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.draftMessage.set(ok ? `Draft saved at ${time}.` : 'Could not save the draft in this browser.');
  }

  clearDraft(): void {
    this.drafts.clear();
    applyValueToForm(this.form, emptyFormValue());
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.store.reset();
    this.draftMessage.set('Draft cleared. You can start again.');
  }
}
