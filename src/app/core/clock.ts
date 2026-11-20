import { InjectionToken } from '@angular/core';

/** Returns the current time. Tests replace it so they control "now". */
export type Clock = () => Date;

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
