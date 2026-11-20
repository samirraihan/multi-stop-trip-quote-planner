import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CLOCK } from '../../core/clock';
import { DRAFT_KEY } from '../../core/draft-storage';
import { QUOTE_LATENCY } from '../../core/quote.service';
import { TripPlannerComponent } from './trip-planner.component';

describe('TripPlannerComponent', () => {
  let now: Date;
  const fixedDelays = () => 300;

  function create() {
    const fixture = TestBed.createComponent(TripPlannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.removeItem(DRAFT_KEY);
    now = new Date(2026, 10, 20, 12, 0, 0);
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: QUOTE_LATENCY, useValue: fixedDelays },
      ],
    });
  });

  afterEach(() => localStorage.removeItem(DRAFT_KEY));

  it('never shows an old quote after the trip is edited', fakeAsync(() => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.form.patchValue({ pickup: 'A', cargoWeight: 2, pickupAt: '2026-11-21T09:00', truckCount: 1 });
    c.form.controls.dropoffs.at(0).setValue('B');
    c.requestQuote();
    tick(300);
    expect(c.view().kind).toBe('success');

    c.form.patchValue({ truckCount: 2 });
    expect(c.view().kind).toBe('stale');
  }));

  it('saves an incomplete draft and restores it in a new component', () => {
    const first = create().componentInstance;
    first.form.patchValue({ pickup: 'C', truckCategory: 'large' });
    first.saveDraft();

    const second = create().componentInstance;
    expect(second.form.controls.pickup.value).toBe('C');
    expect(second.form.controls.truckCategory.value).toBe('large');
    expect(second.view().kind).toBe('idle'); // restored draft has no quote yet
  });

  it('reorders drop-offs and respects the 1 to 3 limit', () => {
    const c = create().componentInstance;
    c.addDropoff();
    c.addDropoff();
    c.addDropoff(); // ignored, already 3
    expect(c.dropoffs.length).toBe(3);
    c.dropoffs.at(0).setValue('B');
    c.dropoffs.at(1).setValue('C');
    c.dropoffs.at(2).setValue('D');
    c.onDrop({ previousIndex: 0, currentIndex: 2 } as never);
    expect(c.dropoffs.getRawValue()).toEqual(['C', 'D', 'B']);
  });
});
