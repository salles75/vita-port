/**
 * Vita - Patient Service
 * Serviço para gerenciamento de pacientes.
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

import { environment } from '@env/environment';
import {
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientDetail,
  PaginatedResponse,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  // Signals para estado reativo
  private readonly _patients = signal<Patient[]>([]);
  private readonly _selectedPatient = signal<PatientDetail | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalPatients = signal<number>(0);

  // Computed signals públicos
  readonly patients = this._patients.asReadonly();
  readonly selectedPatient = this._selectedPatient.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalPatients = this._totalPatients.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Lista pacientes com paginação e filtros.
   */
  getPatients(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  } = {}): Observable<PaginatedResponse<Patient>> {
    this._isLoading.set(true);

    let params = new HttpParams();

    if (options.page) {
      params = params.set('page', options.page.toString());
    }
    if (options.pageSize) {
      params = params.set('page_size', options.pageSize.toString());
    }
    if (options.search) {
      params = params.set('search', options.search);
    }
    if (options.isActive !== undefined) {
      params = params.set('is_active', options.isActive.toString());
    }

    return this.http.get<PaginatedResponse<Patient>>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._patients.set(response.items);
        this._totalPatients.set(response.total);
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Obtém detalhes de um paciente específico.
   */
  getPatient(id: number): Observable<PatientDetail> {
    this._isLoading.set(true);

    return this.http.get<PatientDetail>(`${this.apiUrl}/${id}`).pipe(
      tap((patient) => this._selectedPatient.set(patient)),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Cria um novo paciente.
   */
  createPatient(data: PatientCreate): Observable<Patient> {
    this._isLoading.set(true);

    return this.http.post<Patient>(this.apiUrl, data).pipe(
      tap((patient) => {
        this._patients.update((patients) => [patient, ...patients]);
        this._totalPatients.update((total) => total + 1);
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Atualiza um paciente existente.
   */
  updatePatient(id: number, data: PatientUpdate): Observable<Patient> {
    this._isLoading.set(true);

    return this.http.put<Patient>(`${this.apiUrl}/${id}`, data).pipe(
      tap((patient) => {
        this._patients.update((patients) =>
          patients.map((p) => (p.id === id ? patient : p))
        );
        if (this._selectedPatient()?.id === id) {
          this._selectedPatient.update((current) =>
            current ? { ...current, ...patient } : null
          );
        }
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Remove (desativa) um paciente.
   */
  deletePatient(id: number): Observable<void> {
    this._isLoading.set(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._patients.update((patients) =>
          patients.filter((p) => p.id !== id)
        );
        this._totalPatients.update((total) => total - 1);
        if (this._selectedPatient()?.id === id) {
          this._selectedPatient.set(null);
        }
      }),
      finalize(() => this._isLoading.set(false)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Limpa o paciente selecionado.
   */
  clearSelectedPatient(): void {
    this._selectedPatient.set(null);
  }
}
