# Multi-Stop Trip Quote Planner

Angular 18 + TypeScript + Reactive Forms take-home for the Truck Lagbe Web-App Engineer role.
A customer sets up a trip (one pickup, 1 to 3 drop-offs), picks trucks and cargo weight, asks for a fare estimate
and can save an unfinished draft. Everything runs in the browser. There is no backend and no external API.

## Environment

| Tool | Version used |
| --- | --- |
| Node.js | 22.x (any Node 18.19+ or 20+ works with Angular 18) |
| npm | 10.x |
| Angular / Angular CLI | 18.2 |
| TypeScript | 5.5 |
| Angular CDK | 18 (only for drag and drop) |
| Test runner | Karma + Jasmine, headless Chrome |

## Setup and run

```bash
npm install
npm start            # http://localhost:4200
```

## Tests

```bash
npm test             # watch mode, opens Chrome
npm run test:ci      # single run in headless Chrome (needs Chrome installed, set CHROME_BIN if it is not found)
```

19 tests cover pricing, validation, draft sanitizing, the async quote store and the planner component.

## Project layout

```
src/app
  models/        types shared by everything (TripFormValue, TripInput, Quote, QuoteState)
  data/          locations, distances, truck rates, limits
  core/          pricing, validation, form factory, draft storage, QuoteService, QuoteStore, clock
  components/    trip-planner (the form) and quote-panel (shows the result)
```

## Main technical decisions

1. **Pure functions for business rules.** `pricing.ts` and `trip-validation.ts` have no Angular code in them, so they are easy to test
   and the form and the quote store use the same rules.
2. **Typed Reactive Form.** One `FormGroup` with a `FormArray` for the drop-offs. Group validators cover duplicate locations and cargo capacity.
3. **Latest request wins.** `QuoteStore` uses RxJS `switchMap`, so starting a new request cancels the older one. It also checks a request id before writing
   state as a second safety net.
4. **A quote is tied to the inputs that made it.** Every request stores a snapshot key of its inputs. The panel only shows a quote when that key equals
   the key of the current form value. If the user edits anything, the quote turns into a "changed since last quote" message right away.
5. **Time is injected.** A `CLOCK` token and a `QUOTE_LATENCY` token let tests set "now" and the fake server delay, so `fakeAsync` tests run instantly.
6. **Pickup time is checked again on every request**, not only when the field is edited.
7. **Draft data is never trusted.** `sanitizeDraft` fixes or blanks each bad field instead of crashing. A restored draft starts with no quote.

## Issues met along the way

- A quote that arrived after the user changed the form could look valid. Fixed with the snapshot key comparison.
- A slow first request finishing after a fast second one. Fixed with `switchMap` plus the id check, and covered by a test.
- The pickup time can become invalid just by time passing. Fixed by revalidating when the button is pressed.
- `localStorage` can be blocked or full, so saving returns a success flag and the UI says when it failed.

## How I checked correctness

- The verification example from the brief (A to B to C, 2 Medium trucks, 5 t, loading only) is a unit test: 27 km, 4,590, 1,200, 5,790.
- Tests for minimum fare, order of stops, duplicates, capacity edge (exactly full is allowed), strict future time, malformed drafts,
  out of order replies, cancel on invalid, and stale quote hiding.
- `ng build` passes with strict TypeScript.

## AI tools disclosure

I used an AI assistant (Claude, by Anthropic) to generate the first version of this project.
The assessment allows AI-assisted development, so I am stating it here.

What I reviewed and tested myself:

- **Code review:** I went through every file under `src/app` one by one (`models`, `data`, `core` and `components`) to understand what each
  function does, how the parts connect and why it was designed that way, so I can explain the implementation and adapt it to changed requirements.
- **Automated tests:** I ran the full test suite and checked that all tests pass.
- **Manual testing:** I tested the application by hand in the browser, covering the trip configuration, validation rules, quote generation,
  and draft saving, restoring and clearing.
