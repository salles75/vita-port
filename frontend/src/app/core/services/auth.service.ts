/**
 * Vita - Authentication Service
 * Serviço responsável por autenticação, tokens e sessão do usuário.
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';

import { environment } from '@env/environment';
import {
  LoginRequest,
  TokenResponse,
  RefreshTokenRequest,
  UserProfile,
} from '@core/models';

const TOKEN_KEY = 'vita_access_token';
const REFRESH_TOKEN_KEY = 'vita_refresh_token';
const USER_KEY = 'vita_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signals para estado reativo
  private readonly _user = signal<UserProfile | null>(this.loadUserFromStorage());
  private readonly _isLoading = signal<boolean>(false);

  // Computed signals públicos
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isLoading = this._isLoading.asReadonly();
  readonly userInitials = computed(() => {
    const user = this._user();
    if (!user) return '';
    const names = user.full_name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Inicializa a autenticação verificando token existente.
   */
  private initializeAuth(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired()) {
      // Carrega o perfil em background, sem limpar sessão em caso de erro temporário
      this.loadUserProfile().subscribe({
        error: (err) => {
          // Só limpa a sessão se o token for realmente inválido (401)
          if (err.status === 401) {
            this.clearSession();
          }
        },
      });
    } else if (token && this.isTokenExpired()) {
      // Tenta usar o refresh token se o access token expirou
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        this.refreshToken().subscribe({
          next: () => this.loadUserProfile().subscribe(),
          error: () => this.clearSession(),
        });
      } else {
        this.clearSession();
      }
    }
  }

  /**
   * Realiza o login do usuário.
   */
  login(credentials: LoginRequest): Observable<UserProfile> {
    this._isLoading.set(true);

    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.saveTokens(response);
      }),
      switchMap(() => this.loadUserProfile()),
      catchError((error) => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registra um novo usuário.
   */
  register(data: {
    email: string;
    password: string;
    full_name: string;
    crm?: string;
    specialty?: string;
  }): Observable<UserProfile> {
    this._isLoading.set(true);

    return this.http.post<UserProfile>(`${this.apiUrl}/register`, data).pipe(
      tap(() => this._isLoading.set(false)),
      catchError((error) => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Carrega o perfil do usuário autenticado.
   */
  loadUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this._user.set(user);
        this.saveUserToStorage(user);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Renova o token de acesso usando refresh token.
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refresh_token: refreshToken };

    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, request).pipe(
      tap((response) => this.saveTokens(response)),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Realiza o logout do usuário.
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtém o token de acesso atual.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtém o refresh token atual.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica se o token está expirado.
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    } catch {
      return true;
    }
  }

  /**
   * Salva os tokens no localStorage.
   */
  private saveTokens(response: TokenResponse): void {
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  }

  /**
   * Salva o usuário no localStorage.
   */
  private saveUserToStorage(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Carrega o usuário do localStorage.
   */
  private loadUserFromStorage(): UserProfile | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Limpa a sessão do usuário.
   */
  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }
}
