/**
 * Vita - Guest Guard
 * Guard funcional para páginas de visitantes (login, registro).
 * Redireciona usuários autenticados para o dashboard.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redireciona para dashboard se já autenticado
  router.navigate(['/dashboard']);

  return false;
};
