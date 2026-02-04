/**
 * Vita - Application Routes
 * Configuração de rotas com lazy loading e guards.
 */

import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Dashboard | Vita',
      },
      {
        path: 'patients',
        loadChildren: () =>
          import('@features/patients/patients.routes').then(
            (m) => m.PATIENTS_ROUTES
          ),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('@features/appointments/appointments.routes').then(
            (m) => m.APPOINTMENTS_ROUTES
          ),
      },
      {
        path: 'vitals',
        loadChildren: () =>
          import('@features/vitals/vitals.routes').then(
            (m) => m.VITALS_ROUTES
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
    title: 'Página não encontrada | Vita',
  },
];
