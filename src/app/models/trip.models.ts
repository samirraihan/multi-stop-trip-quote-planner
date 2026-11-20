export type LocationId = 'A' | 'B' | 'C' | 'D' | 'E';
export type TruckCategoryId = 'mini' | 'medium' | 'large';

export interface Location {
  readonly id: LocationId;
  readonly name: string;
}

export interface TruckCategory {
  readonly id: TruckCategoryId;
  readonly label: string;
  readonly capacityTonnes: number;
  readonly ratePerKm: number;
  readonly minimumFare: number;
}

/** What the form holds. Values can be incomplete while the user is typing. */
export interface TripFormValue {
  pickup: LocationId | '';
  dropoffs: (LocationId | '')[];
  truckCategory: TruckCategoryId;
  truckCount: number | null;
  cargoWeight: number | null;
  pickupAt: string;
  loadingAssistance: boolean;
  unloadingAssistance: boolean;
}

/** A trip that passed validation. Only this shape can be priced. */
export interface TripInput {
  readonly pickup: LocationId;
  readonly dropoffs: readonly LocationId[];
  readonly truckCategory: TruckCategoryId;
  readonly truckCount: number;
  readonly cargoWeight: number;
  readonly pickupAt: string;
  readonly loadingAssistance: boolean;
  readonly unloadingAssistance: boolean;
}

export interface Quote {
  readonly route: readonly LocationId[];
  readonly distanceKm: number;
  readonly farePerTruck: number;
  readonly transportCost: number;
  readonly serviceCost: number;
  readonly totalQuote: number;
  readonly truckCount: number;
  readonly truckCategory: TruckCategoryId;
}

export type TripField =
  | 'pickup'
  | 'dropoffs'
  | 'truckCategory'
  | 'truckCount'
  | 'cargoWeight'
  | 'pickupAt'
  | 'trip';

export interface ValidationIssue {
  readonly field: TripField;
  readonly code: string;
  readonly message: string;
}

export type QuoteState =
  | { status: 'idle' }
  | { status: 'pending'; requestId: number; snapshotKey: string }
  | { status: 'success'; requestId: number; snapshotKey: string; quote: Quote }
  | { status: 'invalid'; issues: readonly ValidationIssue[] };
