/**
 * Vita - Register Component
 * Página de cadastro de novos médicos.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-page__background">
        <div class="auth-page__gradient"></div>
      </div>

      <div class="auth-page__branding">
        <div class="auth-page__branding-content">
          <a routerLink="/auth/login" class="auth-page__back">
            <i class="ph-bold ph-arrow-left"></i>
            Voltar ao login
          </a>
          <div class="auth-page__logo">
            <span class="auth-page__logo-icon">🩺</span>
            <span class="auth-page__logo-text">Vita</span>
          </div>
          <h1 class="auth-page__headline">
            Junte-se a<br />
            <span class="auth-page__headline-accent">nós</span>
          </h1>
          <p class="auth-page__description">
            Cadastre-se e comece a oferecer um atendimento mais conectado
            e eficiente para seus pacientes.
          </p>
        </div>
      </div>

      <div class="auth-page__form-panel">
        <div class="auth-page__form-container">
          <div class="auth-page__form-header">
            <h2 class="auth-page__form-title">Criar conta</h2>
            <p class="auth-page__form-subtitle">
              Preencha os dados abaixo para se cadastrar
            </p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Nome completo</mat-label>
              <input
                matInput
                type="text"
                formControlName="full_name"
                placeholder="Dr. João Silva"
              />
              <i matPrefix class="ph-bold ph-user auth-form__icon"></i>
              @if (registerForm.get('full_name')?.hasError('required') && registerForm.get('full_name')?.touched) {
                <mat-error>Nome é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
              />
              <i matPrefix class="ph-bold ph-envelope auth-form__icon"></i>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email é obrigatório</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>

            <div class="auth-form__row">
              <mat-form-field appearance="outline" class="auth-form__field">
                <mat-label>CRM</mat-label>
                <input
                  matInput
                  type="text"
                  formControlName="crm"
                  placeholder="CRM-SP 123456"
                />
                <i matPrefix class="ph-bold ph-identification-card auth-form__icon"></i>
              </mat-form-field>

              <mat-form-field appearance="outline" class="auth-form__field">
                <mat-label>Especialidade</mat-label>
                <mat-select formControlName="specialty">
                  <mat-option value="Cardiologia">Cardiologia</mat-option>
                  <mat-option value="Clínica Geral">Clínica Geral</mat-option>
                  <mat-option value="Pediatria">Pediatria</mat-option>
                  <mat-option value="Ortopedia">Ortopedia</mat-option>
                  <mat-option value="Neurologia">Neurologia</mat-option>
                  <mat-option value="Dermatologia">Dermatologia</mat-option>
                  <mat-option value="Outra">Outra</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Senha</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Mínimo 6 caracteres"
              />
              <i matPrefix class="ph-bold ph-lock auth-form__icon"></i>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
              >
                <i class="ph-bold" [class.ph-eye]="!showPassword()" [class.ph-eye-slash]="showPassword()"></i>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Senha é obrigatória</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Mínimo 6 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="auth-form__field">
              <mat-label>Confirmar senha</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Repita a senha"
              />
              <i matPrefix class="ph-bold ph-lock-key auth-form__icon"></i>
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Confirmação é obrigatória</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Senhas não coincidem</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="auth-form__submit"
              [disabled]="isLoading() || registerForm.invalid"
            >
              @if (isLoading()) {
                <span class="auth-form__spinner"></span>
                Cadastrando...
              } @else {
                <i class="ph-bold ph-user-plus"></i>
                Criar conta
              }
            </button>
          </form>

          <div class="auth-page__form-footer">
            <span>Já tem uma conta?</span>
            <a routerLink="/auth/login">Faça login</a>
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

    .auth-page__background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .auth-page__gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background: linear-gradient(135deg, var(--vita-primary-600) 0%, var(--vita-primary-700) 50%, var(--vita-primary-800) 100%);
      clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
    }

    .auth-page__branding {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
      position: relative;
      z-index: 1;
    }

    .auth-page__branding-content {
      max-width: 400px;
      animation: slideInLeft 0.6s ease;
    }

    .auth-page__back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      margin-bottom: var(--space-xl);
      transition: color var(--transition-fast);

      &:hover {
        color: #FFFFFF;
      }

      i {
        font-size: 1.25rem;
      }
    }

    .auth-page__logo {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .auth-page__logo-icon {
      font-size: 40px;
    }

    .auth-page__logo-text {
      font-size: 2rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 2px;
    }

    .auth-page__headline {
      font-size: 3rem;
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
    }

    .auth-page__form-panel {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      background: #FFFFFF;
      position: relative;
      z-index: 1;
    }

    .auth-page__form-container {
      width: 100%;
      max-width: 480px;
      animation: slideInRight 0.6s ease;
    }

    .auth-page__form-header {
      text-align: center;
      margin-bottom: var(--space-lg);
    }

    .auth-page__form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
      margin-bottom: var(--space-sm);
    }

    .auth-page__form-subtitle {
      color: var(--vita-neutral-500);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .auth-form__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .auth-form__field {
      width: 100%;

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

    .auth-page__form-footer {
      text-align: center;
      margin-top: var(--space-xl);
      color: var(--vita-neutral-500);

      a {
        color: var(--vita-primary-500);
        font-weight: 600;
        margin-left: var(--space-xs);

        &:hover {
          text-decoration: underline;
        }
      }
    }

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

      .auth-form__row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class RegisterComponent {
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  registerForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group(
      {
        full_name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        crm: [''],
        specialty: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { full_name, email, crm, specialty, password } = this.registerForm.value;

    this.authService
      .register({ full_name, email, crm, specialty, password })
      .subscribe({
        next: () => {
          this.snackBar.open('Conta criada com sucesso!', 'Fechar', {
            duration: 3000,
          });
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open(
            error.userMessage || 'Erro ao criar conta',
            'Fechar',
            { duration: 5000 }
          );
        },
      });
  }
}
