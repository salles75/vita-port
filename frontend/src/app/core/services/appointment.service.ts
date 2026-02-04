/**
 * Vita - Appointment Service
 * Serviço para gerenciamento de consultas/agendamentos.
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

import { environment } from '@env/environment';
import {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentDetail,
  AppointmentStatus,
  PaginatedResponse,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  // Signals para estado reativo
  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _todayAppointments = signal<AppointmentDetail[]>([]);
  private readonly _upcomingAppointments = signal<AppointmentDetail[]>([]);
  private readonly _selectedAppointment = signal<AppointmentDetail | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalAppointments = signal<number>(0);

  // Computed signals públicos
  readonly appointments = this._appointments.asReadonly();
  readonly todayAppointments = this._todayAppointments.asReadonly();
  readonly upcomingAppointments = this._upcomingAppointments.asReadonly();
  readonly selectedAppointment = this._selectedAppointment.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalAppointments = this._totalAppointments.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Lista consultas com paginação e filtros.
   */
  getAppointments(options: {
    page?: number;
    pageSize?: number;
    status?: AppointmentStatus;
    dateFrom?: string;
    dateTo?: string;
    patientId?: number;
  } = {}): Observable<PaginatedResponse<Appointment>> {
    this._isLoading.set(true);

    let params = new HttpParams();

    if (options.page) {
      params = params.set('page', options.page.toString());
    }
    if (options.pageSize) {
      params = params.set('page_size', options.pageSize.toString());
    }
    if (options.status) {
      params = params.set('status', options.status);
    }
    if (options.dateFrom) {
      params = params.set('date_from', options.dateFrom);
    }
    if (options.dateTo) {
      params = params.set('date_to', options.dateTo);
    }
    if (options.patientId) {
      params = params.set('patient_id', options.patientId.toString());
    }

    return this.http.get<PaginatedResponse<Appointment>>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._appointments.set(response.items);
        this._totalAppointments.set(response.total);
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Lista consultas do dia.
   */
  getTodayAppointments(): Observable<AppointmentDetail[]> {
    this._isLoading.set(true);

    return this.http.get<AppointmentDetail[]>(`${this.apiUrl}/today`).pipe(
      tap((appointments) => this._todayAppointments.set(appointments)),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Lista próximas consultas.
   */
  getUpcomingAppointments(limit: number = 10): Observable<AppointmentDetail[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<AppointmentDetail[]>(`${this.apiUrl}/upcoming`, { params }).pipe(
      tap((appointments) => this._upcomingAppointments.set(appointments)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Obtém detalhes de uma consulta específica.
   */
  getAppointment(id: number): Observable<AppointmentDetail> {
    this._isLoading.set(true);

    return this.http.get<AppointmentDetail>(`${this.apiUrl}/${id}`).pipe(
      tap((appointment) => this._selectedAppointment.set(appointment)),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Cria uma nova consulta.
   */
  createAppointment(data: AppointmentCreate): Observable<Appointment> {
    this._isLoading.set(true);

    return this.http.post<Appointment>(this.apiUrl, data).pipe(
      tap((appointment) => {
        this._appointments.update((appointments) => [appointment, ...appointments]);
        this._totalAppointments.update((total) => total + 1);
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Atualiza uma consulta existente.
   */
  updateAppointment(id: number, data: AppointmentUpdate): Observable<Appointment> {
    this._isLoading.set(true);

    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, data).pipe(
      tap((appointment) => {
        this._appointments.update((appointments) =>
          appointments.map((a) => (a.id === id ? appointment : a))
        );
        if (this._selectedAppointment()?.id === id) {
          this._selectedAppointment.update((current) =>
            current ? { ...current, ...appointment } : null
          );
        }
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Cancela uma consulta.
   */
  cancelAppointment(id: number): Observable<void> {
    this._isLoading.set(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._appointments.update((appointments) =>
          appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
          )
        );
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Limpa a consulta selecionada.
   */
  clearSelectedAppointment(): void {
    this._selectedAppointment.set(null);
  }
}
