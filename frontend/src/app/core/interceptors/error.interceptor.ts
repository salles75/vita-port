/**
 * Vita - Error Interceptor
 * Interceptor funcional para tratamento global de erros HTTP.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado';

      if (error.error instanceof ErrorEvent) {
        // Erro do cliente (rede, etc.)
        errorMessage = `Erro de conexão: ${error.error.message}`;
      } else {
        // Erro do servidor
        switch (error.status) {
          case 0:
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
            break;

          case 400:
            errorMessage = error.error?.detail || 'Requisição inválida';
            break;

          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente.';
            // Não faz logout aqui se for requisição de refresh
            if (!request.url.includes('/auth/refresh')) {
              authService.logout();
            }
            break;

          case 403:
            errorMessage = 'Você não tem permissão para acessar este recurso.';
            break;

          case 404:
            errorMessage = error.error?.detail || 'Recurso não encontrado';
            break;

          case 409:
            errorMessage = error.error?.detail || 'Conflito de dados';
            break;

          case 422:
            errorMessage = error.error?.detail || 'Dados inválidos';
            break;

          case 429:
            errorMessage = 'Muitas requisições. Aguarde um momento.';
            break;

          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;

          case 502:
          case 503:
          case 504:
            errorMessage = 'Servidor temporariamente indisponível. Tente novamente.';
            break;

          default:
            errorMessage = error.error?.detail || `Erro ${error.status}: ${error.statusText}`;
        }
      }

      console.error('[Vita Error]', {
        url: request.url,
        status: error.status,
        message: errorMessage,
      });

      // Retorna o erro com a mensagem formatada
      return throwError(() => ({
        ...error,
        userMessage: errorMessage,
      }));
    })
  );
};
