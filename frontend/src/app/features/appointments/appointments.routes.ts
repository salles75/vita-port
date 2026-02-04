/**
 * Vita - Appointments Routes
 * Rotas do módulo de consultas.
 */

import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointments-list/appointments-list.component').then(
        (m) => m.AppointmentsListComponent
      ),
    title: 'Consultas | Vita',
  },
];
