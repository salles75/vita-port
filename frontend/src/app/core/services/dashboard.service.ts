/**
 * Vita - Dashboard Service
 * Serviço para estatísticas e dados do dashboard.
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

import { environment } from '@env/environment';
import { DashboardStats } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  // Signals para estado reativo
  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  // Computed signals públicos
  readonly stats = this._stats.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtém estatísticas do dashboard.
   */
  getStats(): Observable<DashboardStats> {
    this._isLoading.set(true);

    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      tap((stats) => this._stats.set(stats)),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Limpa as estatísticas carregadas.
   */
  clearStats(): void {
    this._stats.set(null);
  }
}
