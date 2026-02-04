/**
 * Vita - Auth Interceptor
 * Interceptor funcional que adiciona o token JWT em todas as requisições.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, catchError, throwError } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Ignora requisições que não são para a API
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  // Ignora requisições de login/register/refresh
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    request.url.includes(endpoint)
  );

  if (isPublicEndpoint) {
    return next(request);
  }

  const token = authService.getAccessToken();

  if (!token) {
    return next(request);
  }

  // Verifica se o token está expirado
  if (authService.isTokenExpired()) {
    // Tenta renovar o token
    return authService.refreshToken().pipe(
      switchMap(() => {
        const newToken = authService.getAccessToken();
        const clonedRequest = addTokenToRequest(request, newToken!);
        return next(clonedRequest);
      }),
      catchError((error) => {
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  // Adiciona o token à requisição
  const clonedRequest = addTokenToRequest(request, token);
  return next(clonedRequest);
};

/**
 * Adiciona o token de autorização à requisição.
 */
function addTokenToRequest(
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
