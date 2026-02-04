/**
 * Vita - Vitals Service
 * Serviço para gerenciamento de sinais vitais.
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

import { environment } from '@env/environment';
import {
  VitalSign,
  VitalSignCreate,
  VitalStats,
  VitalChartData,
  ListResponse,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class VitalsService {
  private readonly apiUrl = `${environment.apiUrl}/vitals`;

  // Signals para estado reativo
  private readonly _vitals = signal<VitalSign[]>([]);
  private readonly _stats = signal<VitalStats | null>(null);
  private readonly _chartData = signal<VitalChartData | null>(null);
  private readonly _criticalVitals = signal<VitalSign[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  // Computed signals públicos
  readonly vitals = this._vitals.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly chartData = this._chartData.asReadonly();
  readonly criticalVitals = this._criticalVitals.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Lista sinais vitais de um paciente.
   */
  getPatientVitals(
    patientId: number,
    options: {
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    } = {}
  ): Observable<ListResponse<VitalSign>> {
    this._isLoading.set(true);

    let params = new HttpParams();

    if (options.dateFrom) {
      params = params.set('date_from', options.dateFrom);
    }
    if (options.dateTo) {
      params = params.set('date_to', options.dateTo);
    }
    if (options.limit) {
      params = params.set('limit', options.limit.toString());
    }

    return this.http
      .get<ListResponse<VitalSign>>(`${this.apiUrl}/${patientId}`, { params })
      .pipe(
        tap((response) => this._vitals.set(response.items)),
        finalize(() => this._isLoading.set(false)),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Obtém estatísticas de sinais vitais de um paciente.
   */
  getPatientVitalStats(patientId: number, days: number = 30): Observable<VitalStats> {
    const params = new HttpParams().set('days', days.toString());

    return this.http
      .get<VitalStats>(`${this.apiUrl}/${patientId}/stats`, { params })
      .pipe(
        tap((stats) => this._stats.set(stats)),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Obtém dados para gráficos de sinais vitais.
   */
  getPatientVitalChartData(
    patientId: number,
    days: number = 30
  ): Observable<VitalChartData> {
    const params = new HttpParams().set('days', days.toString());

    return this.http
      .get<VitalChartData>(`${this.apiUrl}/${patientId}/chart`, { params })
      .pipe(
        tap((data) => this._chartData.set(data)),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Registra novos sinais vitais.
   */
  createVitalSign(data: VitalSignCreate): Observable<VitalSign> {
    this._isLoading.set(true);

    return this.http.post<VitalSign>(this.apiUrl, data).pipe(
      tap((vital) => {
        this._vitals.update((vitals) => [vital, ...vitals]);
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Obtém sinais vitais críticos (alertas).
   */
  getCriticalVitals(hours: number = 24): Observable<VitalSign[]> {
    const params = new HttpParams().set('hours', hours.toString());

    return this.http
      .get<VitalSign[]>(`${this.apiUrl}/alerts/critical`, { params })
      .pipe(
        tap((vitals) => this._criticalVitals.set(vitals)),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Verifica se um valor vital está em faixa crítica.
   */
  isVitalCritical(type: string, value: number): boolean {
    switch (type) {
      case 'heart_rate':
        return value < 50 || value > 120;
      case 'systolic_pressure':
        return value < 90 || value > 180;
      case 'diastolic_pressure':
        return value < 60 || value > 120;
      case 'temperature':
        return value < 35 || value > 39;
      case 'oxygen_saturation':
        return value < 90;
      case 'glucose_level':
        return value < 70 || value > 250;
      default:
        return false;
    }
  }

  /**
   * Retorna a classificação do valor vital.
   */
  getVitalStatus(type: string, value: number): 'normal' | 'warning' | 'critical' {
    if (this.isVitalCritical(type, value)) {
      return 'critical';
    }

    switch (type) {
      case 'heart_rate':
        return value < 60 || value > 100 ? 'warning' : 'normal';
      case 'systolic_pressure':
        return value < 100 || value > 140 ? 'warning' : 'normal';
      case 'oxygen_saturation':
        return value < 95 ? 'warning' : 'normal';
      case 'temperature':
        return value < 36 || value > 37.5 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  }

  /**
   * Limpa os dados carregados.
   */
  clearData(): void {
    this._vitals.set([]);
    this._stats.set(null);
    this._chartData.set(null);
  }
}
