import { Component } from '@angular/core';
import { TripPlannerComponent } from './components/trip-planner/trip-planner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TripPlannerComponent],
  template: `
    <header class="top"><h1>Multi-Stop Trip Quote Planner</h1></header>
    <main><app-trip-planner /></main>
  `,
  styles: [
    `.top { background: #12233b; color: #fff; padding: 14px 24px; }
     h1 { margin: 0; font-size: 1.2rem; }
     main { max-width: 1100px; margin: 20px auto; padding: 0 16px; }`,
  ],
})
export class AppComponent {}
