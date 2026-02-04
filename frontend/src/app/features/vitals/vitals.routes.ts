/**
 * Vita - Vitals Routes
 * Rotas do módulo de sinais vitais.
 */

import { Routes } from '@angular/router';

export const VITALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vitals-dashboard/vitals-dashboard.component').then(
        (m) => m.VitalsDashboardComponent
      ),
    title: 'Sinais Vitais | Vita',
  },
];
