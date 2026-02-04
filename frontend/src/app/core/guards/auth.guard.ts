/**
 * Vita - Auth Guard
 * Guard funcional para proteger rotas que requerem autenticação.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se há usuário autenticado OU token válido no localStorage
  const hasToken = authService.getAccessToken() !== null;
  const isNotExpired = !authService.isTokenExpired();
  
  if (authService.isAuthenticated() || (hasToken && isNotExpired)) {
    return true;
  }

  // Redireciona para login se não autenticado
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: router.url },
  });

  return false;
};
