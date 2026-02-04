/**
 * Vita - Patient Dialog Component
 * Modal para criar/editar pacientes.
 */

import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PatientService } from '@core/services/patient.service';
import { Patient } from '@core/models';

export interface PatientDialogData {
  patient?: Patient;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-patient-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="patient-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <i class="ph-bold" [class.ph-user-plus]="data.mode === 'create'" [class.ph-pencil]="data.mode === 'edit'"></i>
          {{ data.mode === 'create' ? 'Novo Paciente' : 'Editar Paciente' }}
        </h2>
        <button class="dialog-close" (click)="onCancel()">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Nome Completo</mat-label>
            <input matInput formControlName="full_name" placeholder="Nome do paciente" />
            <i matPrefix class="ph-bold ph-user form-icon"></i>
            @if (form.get('full_name')?.hasError('required') && form.get('full_name')?.touched) {
              <mat-error>Nome é obrigatório</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>CPF</mat-label>
            <input matInput formControlName="cpf" placeholder="000.000.000-00" />
            <i matPrefix class="ph-bold ph-identification-card form-icon"></i>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Data de Nascimento</mat-label>
            <input matInput type="date" formControlName="birth_date" />
            <i matPrefix class="ph-bold ph-calendar form-icon"></i>
          </mat-form-field>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Gênero</mat-label>
            <mat-select formControlName="gender">
              <mat-option value="M">Masculino</mat-option>
              <mat-option value="F">Feminino</mat-option>
              <mat-option value="O">Outro</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Tipo Sanguíneo</mat-label>
            <mat-select formControlName="blood_type">
              <mat-option value="A+">A+</mat-option>
              <mat-option value="A-">A-</mat-option>
              <mat-option value="B+">B+</mat-option>
              <mat-option value="B-">B-</mat-option>
              <mat-option value="AB+">AB+</mat-option>
              <mat-option value="AB-">AB-</mat-option>
              <mat-option value="O+">O+</mat-option>
              <mat-option value="O-">O-</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="phone" placeholder="(00) 00000-0000" />
            <i matPrefix class="ph-bold ph-phone form-icon"></i>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="email@exemplo.com" />
            <i matPrefix class="ph-bold ph-envelope form-icon"></i>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Endereço</mat-label>
            <input matInput formControlName="address" placeholder="Endereço completo" />
            <i matPrefix class="ph-bold ph-map-pin form-icon"></i>
          </mat-form-field>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contato de Emergência</mat-label>
            <input matInput formControlName="emergency_contact" placeholder="Nome do contato" />
            <i matPrefix class="ph-bold ph-user-circle form-icon"></i>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Telefone Emergência</mat-label>
            <input matInput formControlName="emergency_phone" placeholder="(00) 00000-0000" />
            <i matPrefix class="ph-bold ph-phone form-icon"></i>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Alergias</mat-label>
            <textarea matInput formControlName="allergies" rows="2" placeholder="Liste as alergias conhecidas"></textarea>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Observações Médicas</mat-label>
            <textarea matInput formControlName="medical_notes" rows="3" placeholder="Condições pré-existentes, observações, etc."></textarea>
          </mat-form-field>
        </div>

        <div class="dialog-actions">
          <button type="button" mat-stroked-button (click)="onCancel()">
            Cancelar
          </button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Salvando...
            } @else {
              <i class="ph-bold ph-check"></i>
              {{ data.mode === 'create' ? 'Cadastrar' : 'Salvar' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .patient-dialog {
      width: 600px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-lg);
      border-bottom: 1px solid var(--vita-neutral-200);
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--vita-neutral-900);
      margin: 0;

      i {
        color: var(--vita-primary-500);
        font-size: 1.5rem;
      }
    }

    .dialog-close {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--vita-neutral-500);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-neutral-100);
        color: var(--vita-neutral-800);
      }

      i {
        font-size: 1.25rem;
      }
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-lg);
    }

    .form-row {
      margin-bottom: var(--space-md);

      &--half {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
      }
    }

    .form-field {
      width: 100%;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        margin-top: 2px;
      }

      // Espaçamento do wrapper do campo
      ::ng-deep .mat-mdc-text-field-wrapper {
        padding-left: 12px;
      }

      // Posiciona o ícone prefix corretamente com mais espaço
      ::ng-deep .mat-mdc-form-field-icon-prefix {
        padding: 0 12px 0 0;
      }

      // Move o conteúdo interno (label + input) mais para direita
      ::ng-deep .mat-mdc-form-field-infix {
        padding-left: 12px !important;
      }

      // Garante que a label também tenha o espaçamento maior
      ::ng-deep .mat-mdc-floating-label {
        left: 12px !important;
      }
    }

    .form-icon {
      color: var(--vita-neutral-400);
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .dialog-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-md);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--vita-neutral-100);
      margin-top: var(--space-md);

      button {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        min-width: 120px;
        height: 44px;
      }
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .form-row--half {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class PatientDialogComponent {
  readonly isLoading = signal(false);
  form: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<PatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientDialogData,
    private readonly fb: FormBuilder,
    private readonly patientService: PatientService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      full_name: [data.patient?.full_name || '', Validators.required],
      cpf: [data.patient?.cpf || '', Validators.required],
      birth_date: [data.patient?.birth_date || '', Validators.required],
      gender: [data.patient?.gender || 'M'],
      blood_type: [data.patient?.blood_type || ''],
      phone: [data.patient?.phone || '', Validators.required],
      email: [data.patient?.email || ''],
      address: [data.patient?.address || ''],
      emergency_contact: [data.patient?.emergency_contact || ''],
      emergency_phone: [data.patient?.emergency_phone || ''],
      allergies: [data.patient?.allergies || ''],
      medical_notes: [data.patient?.medical_notes || ''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.form.value;

    const request$ = this.data.mode === 'create'
      ? this.patientService.createPatient(formData)
      : this.patientService.updatePatient(this.data.patient!.id, formData);

    request$.subscribe({
      next: (patient) => {
        this.snackBar.open(
          this.data.mode === 'create' ? 'Paciente cadastrado com sucesso!' : 'Paciente atualizado!',
          'OK',
          { duration: 3000 }
        );
        this.dialogRef.close(patient);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Erro ao salvar paciente. Tente novamente.', 'OK', { duration: 5000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
