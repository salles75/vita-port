/**
 * Vita - Login Component
 * Página de autenticação com design único.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="auth-page">
      <!-- Background Pattern -->
      <div class="auth-page__background">
        <div class="auth-page__pattern"></div>
        <div class="auth-page__gradient"></div>
      </div>

      <!-- Left Panel - Branding -->
      <div class="auth-page__branding">
        <div class="auth-page__branding-content">
          <div class="auth-page__logo">
            <span class="auth-page__logo-icon">🩺</span>
            <span class="auth-page__logo-text">Vita</span>
          </div>
          <h1 class="auth-page__headline">
            Telemedicina<br />
            <span class="auth-page__headline-accent">inteligente</span>
          </h1>
          <p class="auth-page__description">
            Acompanhe seus pacientes em tempo real, monitore sinais vitais
            e gerencie consultas de forma eficiente.
          </p>

          <div class="auth-page__features">
            <div class="auth-page__feature">
              <i class="ph-fill ph-heart"></i>
              <span>Monitoramento de sinais vitais</span>
            </div>
            <div class="auth-page__feature">
              <i class="ph-fill ph-calendar-check"></i>
              <span>Agendamento inteligente</span>
            </div>
            <div class="auth-page__feature">
              <i class="ph-fill ph-chart-line-up"></i>
              <span>Históricos e gráficos</span>
            </div>
          </div>
        </div>

        <!-- Decorative Elements -->
        <div class="auth-page__decoration">
          <div class="auth-page__pulse-ring"></div>
          <div class="auth-page__pulse-ring auth-page__pulse-ring--delayed"></div>
        </div>
      </div>

      <!-- Right Panel - Form -->
      <div class="auth-page__form-panel">
        <div class="auth-page__form-container">
          <div class="auth-page__form-header">
            <h2 class="auth-page__form-title">Bem-vindo de volta</h2>
            <p class="auth-page__form-subtitle">
              Entre com suas credenciais para acessar o portal
            </p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
              />
              <i matPrefix class="ph-bold ph-envelope auth-form__icon"></i>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>Email é obrigatório</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Senha</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
              />
              <i matPrefix class="ph-bold ph-lock auth-form__icon"></i>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
              >
                <i class="ph-bold" [class.ph-eye]="!showPassword()" [class.ph-eye-slash]="showPassword()"></i>
              </button>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Senha é obrigatória</mat-error>
              }
            </mat-form-field>

            <div class="auth-form__options">
              <label class="auth-form__remember">
                <input type="checkbox" formControlName="remember" />
                <span>Lembrar de mim</span>
              </label>
              <a href="#" class="auth-form__forgot">Esqueceu a senha?</a>
            </div>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="auth-form__submit"
              [disabled]="isLoading() || loginForm.invalid"
            >
              @if (isLoading()) {
                <span class="auth-form__spinner"></span>
                Entrando...
              } @else {
                <i class="ph-bold ph-sign-in"></i>
                Entrar
              }
            </button>
          </form>

          <div class="auth-page__form-footer">
            <span>Não tem uma conta?</span>
            <a routerLink="/auth/register">Cadastre-se</a>
          </div>

          <div class="auth-page__demo-hint">
            <i class="ph-bold ph-info"></i>
            <span>Demo: dr.silva&#64;vita.med.br / 123456</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    // ===== BACKGROUND =====
    .auth-page__background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .auth-page__pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(255, 122, 92, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(13, 84, 84, 0.1) 0%, transparent 40%);
    }

    .auth-page__gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 55%;
      height: 100%;
      background: linear-gradient(135deg, var(--vita-primary-600) 0%, var(--vita-primary-700) 50%, var(--vita-primary-800) 100%);
      clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
    }

    // ===== BRANDING PANEL =====
    .auth-page__branding {
      width: 55%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
      position: relative;
      z-index: 1;
    }

    .auth-page__branding-content {
      max-width: 480px;
      animation: slideInLeft 0.6s ease;
    }

    .auth-page__logo {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-bottom: var(--space-2xl);
    }

    .auth-page__logo-icon {
      font-size: 48px;
    }

    .auth-page__logo-text {
      font-size: 2.5rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 3px;
    }

    .auth-page__headline {
      font-size: 3.5rem;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.1;
      margin-bottom: var(--space-lg);
    }

    .auth-page__headline-accent {
      color: var(--vita-accent-400);
    }

    .auth-page__description {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
      margin-bottom: var(--space-2xl);
    }

    .auth-page__features {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .auth-page__feature {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;

      i {
        font-size: 1.25rem;
        color: var(--vita-accent-400);
      }
    }

    .auth-page__decoration {
      position: absolute;
      bottom: 10%;
      left: 10%;
      width: 300px;
      height: 300px;
    }

    .auth-page__pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(255, 122, 92, 0.3);
      border-radius: 50%;
      animation: pulse-ring 3s ease-out infinite;

      &--delayed {
        animation-delay: 1.5s;
      }
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    // ===== FORM PANEL =====
    .auth-page__form-panel {
      width: 45%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2xl);
      background: #FFFFFF;
      position: relative;
      z-index: 1;
    }

    .auth-page__form-container {
      width: 100%;
      max-width: 420px;
      animation: slideInRight 0.6s ease;
    }

    .auth-page__form-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .auth-page__form-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
      margin-bottom: var(--space-sm);
    }

    .auth-page__form-subtitle {
      color: var(--vita-neutral-500);
      font-size: 1rem;
    }

    // ===== FORM =====
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .auth-form__field {
      width: 100%;

      .mat-mdc-form-field-subscript-wrapper {
        margin-top: 4px;
      }

      // Espaçamento do wrapper do campo
      ::ng-deep .mat-mdc-text-field-wrapper {
        padding-left: 12px;
      }

      // Posiciona o ícone prefix corretamente
      ::ng-deep .mat-mdc-form-field-icon-prefix {
        padding: 0 8px 0 0;
      }

      // Move o conteúdo interno (label + input) para direita
      ::ng-deep .mat-mdc-form-field-infix {
        padding-left: 8px !important;
      }

      // Garante que a label também tenha o espaçamento
      ::ng-deep .mat-mdc-floating-label {
        left: 8px !important;
      }
    }

    .auth-form__icon {
      color: var(--vita-neutral-400);
      font-size: 1.125rem;
    }

    .auth-form__options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: var(--space-sm) 0;
    }

    .auth-form__remember {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--vita-neutral-600);

      input {
        width: 18px;
        height: 18px;
        accent-color: var(--vita-primary-500);
      }
    }

    .auth-form__forgot {
      font-size: 0.875rem;
      color: var(--vita-primary-500);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .auth-form__submit {
      height: 52px;
      font-size: 1rem;
      font-weight: 600;
      margin-top: var(--space-md);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);

      i {
        font-size: 1.25rem;
      }
    }

    .auth-form__spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-page__form-footer {
      text-align: center;
      margin-top: var(--space-xl);
      color: var(--vita-neutral-500);
      font-size: 0.9rem;

      a {
        color: var(--vita-primary-500);
        font-weight: 600;
        margin-left: var(--space-xs);

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .auth-page__demo-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      padding: var(--space-md);
      background: var(--vita-neutral-100);
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      color: var(--vita-neutral-600);

      i {
        color: var(--vita-info);
        font-size: 1rem;
      }
    }

    // ===== RESPONSIVE =====
    @media (max-width: 1024px) {
      .auth-page__branding {
        display: none;
      }

      .auth-page__gradient {
        width: 100%;
        clip-path: none;
        opacity: 0.1;
      }

      .auth-page__form-panel {
        width: 100%;
      }
    }
  `],
})
export class LoginComponent {
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  loginForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open(
          error.userMessage || 'Erro ao fazer login',
          'Fechar',
          { duration: 5000 }
        );
      },
    });
  }
}
