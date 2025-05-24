import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/pages/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
];
