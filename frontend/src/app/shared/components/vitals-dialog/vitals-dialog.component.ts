/**
 * Vita - Vitals Dialog Component
 * Modal para registrar sinais vitais.
 */

import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { VitalsService } from '@core/services/vitals.service';
import { PatientService } from '@core/services/patient.service';
import { Patient } from '@core/models';

export interface VitalsDialogData {
  preSelectedPatientId?: number;
}

@Component({
  selector: 'app-vitals-dialog',
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
    <div class="vitals-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <i class="ph-bold ph-heartbeat"></i>
          Registrar Sinais Vitais
        </h2>
        <button class="dialog-close" (click)="onCancel()">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Paciente</mat-label>
            <mat-select formControlName="patient_id">
              @for (patient of patients(); track patient.id) {
                <mat-option [value]="patient.id">{{ patient.full_name }}</mat-option>
              }
            </mat-select>
            @if (form.get('patient_id')?.hasError('required') && form.get('patient_id')?.touched) {
              <mat-error>Selecione um paciente</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="vitals-grid">
          <div class="vital-card vital-card--heart">
            <div class="vital-card__header">
              <i class="ph-fill ph-heart"></i>
              <span>Freq. Cardíaca</span>
            </div>
            <mat-form-field appearance="outline" class="form-field">
              <input matInput type="number" formControlName="heart_rate" placeholder="--" />
              <span matSuffix class="unit">bpm</span>
            </mat-form-field>
          </div>

          <div class="vital-card vital-card--pressure">
            <div class="vital-card__header">
              <i class="ph-fill ph-activity"></i>
              <span>Pressão Arterial</span>
            </div>
            <div class="pressure-inputs">
              <mat-form-field appearance="outline" class="form-field">
                <input matInput type="number" formControlName="systolic_pressure" placeholder="SIS" />
              </mat-form-field>
              <span class="pressure-divider">/</span>
              <mat-form-field appearance="outline" class="form-field">
                <input matInput type="number" formControlName="diastolic_pressure" placeholder="DIA" />
              </mat-form-field>
              <span class="unit">mmHg</span>
            </div>
          </div>

          <div class="vital-card vital-card--temp">
            <div class="vital-card__header">
              <i class="ph-fill ph-thermometer"></i>
              <span>Temperatura</span>
            </div>
            <mat-form-field appearance="outline" class="form-field">
              <input matInput type="number" step="0.1" formControlName="temperature" placeholder="--" />
              <span matSuffix class="unit">°C</span>
            </mat-form-field>
          </div>

          <div class="vital-card vital-card--oxygen">
            <div class="vital-card__header">
              <i class="ph-fill ph-wind"></i>
              <span>SpO2</span>
            </div>
            <mat-form-field appearance="outline" class="form-field">
              <input matInput type="number" formControlName="oxygen_saturation" placeholder="--" />
              <span matSuffix class="unit">%</span>
            </mat-form-field>
          </div>

          <div class="vital-card vital-card--respiratory">
            <div class="vital-card__header">
              <i class="ph-fill ph-lungs"></i>
              <span>Freq. Respiratória</span>
            </div>
            <mat-form-field appearance="outline" class="form-field">
              <input matInput type="number" formControlName="respiratory_rate" placeholder="--" />
              <span matSuffix class="unit">rpm</span>
            </mat-form-field>
          </div>

          <div class="vital-card vital-card--glucose">
            <div class="vital-card__header">
              <i class="ph-fill ph-drop"></i>
              <span>Glicose</span>
            </div>
            <mat-form-field appearance="outline" class="form-field">
              <input matInput type="number" formControlName="glucose_level" placeholder="--" />
              <span matSuffix class="unit">mg/dL</span>
            </mat-form-field>
          </div>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Peso</mat-label>
            <input matInput type="number" step="0.1" formControlName="weight" placeholder="--" />
            <span matSuffix class="unit">kg</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Altura</mat-label>
            <input matInput type="number" step="0.01" formControlName="height" placeholder="--" />
            <span matSuffix class="unit">m</span>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Observações</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="Anotações sobre a medição"></textarea>
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
              Registrar
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .vitals-dialog {
      width: 650px;
      max-width: 95vw;
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
      background: var(--vita-neutral-50);
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
        color: var(--vita-heart);
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
        background: var(--vita-neutral-200);
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
      margin-bottom: var(--space-lg);

      &--half {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
      }
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .vital-card {
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-md);
      background: var(--vita-neutral-50);
      border-left: 4px solid;

      &--heart {
        border-color: var(--vita-heart);
      }
      &--pressure {
        border-color: var(--vita-pressure);
        grid-column: span 2;
      }
      &--temp {
        border-color: var(--vita-temperature);
      }
      &--oxygen {
        border-color: var(--vita-oxygen);
      }
      &--respiratory {
        border-color: var(--vita-info);
      }
      &--glucose {
        border-color: var(--vita-warning);
      }
    }

    .vital-card__header {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--vita-neutral-700);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      i {
        font-size: 1.125rem;
      }

      .vital-card--heart & i { color: var(--vita-heart); }
      .vital-card--pressure & i { color: var(--vita-pressure); }
      .vital-card--temp & i { color: var(--vita-temperature); }
      .vital-card--oxygen & i { color: var(--vita-oxygen); }
      .vital-card--respiratory & i { color: var(--vita-info); }
      .vital-card--glucose & i { color: var(--vita-warning); }
    }

    .pressure-inputs {
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .form-field {
        flex: 1;
        max-width: 120px;
      }
    }

    .pressure-divider {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--vita-neutral-300);
      margin: 0 var(--space-xs);
    }

    .form-field {
      width: 100%;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      ::ng-deep .mat-mdc-text-field-wrapper {
        background: #FFFFFF;
        padding-right: var(--space-md);
      }

      // Mais espaço para o suffix (unidades de medida)
      ::ng-deep .mat-mdc-form-field-icon-suffix {
        padding: 0 var(--space-sm) 0 var(--space-xs);
      }
    }

    .unit {
      color: var(--vita-neutral-500);
      font-size: 0.8rem;
      font-weight: 600;
      margin-left: var(--space-xs);
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
      .vitals-grid {
        grid-template-columns: 1fr;
      }

      .vital-card--pressure {
        grid-column: span 1;
      }

      .form-row--half {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class VitalsDialogComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly patients = this.patientService.patients;
  form: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<VitalsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VitalsDialogData,
    private readonly fb: FormBuilder,
    private readonly vitalsService: VitalsService,
    private readonly patientService: PatientService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      patient_id: [data.preSelectedPatientId || null, Validators.required],
      heart_rate: [null],
      systolic_pressure: [null],
      diastolic_pressure: [null],
      temperature: [null],
      oxygen_saturation: [null],
      respiratory_rate: [null],
      glucose_level: [null],
      weight: [null],
      height: [null],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.patientService.getPatients({ pageSize: 100 }).subscribe();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Verifica se pelo menos um sinal vital foi preenchido
    const formData = this.form.value;
    const hasVital = formData.heart_rate || formData.systolic_pressure ||
      formData.temperature || formData.oxygen_saturation ||
      formData.respiratory_rate || formData.glucose_level;

    if (!hasVital) {
      this.snackBar.open('Preencha pelo menos um sinal vital', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    const vitalData = {
      patient_id: formData.patient_id,
      heart_rate: formData.heart_rate || undefined,
      systolic_pressure: formData.systolic_pressure || undefined,
      diastolic_pressure: formData.diastolic_pressure || undefined,
      temperature: formData.temperature || undefined,
      oxygen_saturation: formData.oxygen_saturation || undefined,
      respiratory_rate: formData.respiratory_rate || undefined,
      glucose_level: formData.glucose_level || undefined,
      weight: formData.weight || undefined,
      height: formData.height || undefined,
      notes: formData.notes || undefined,
    };

    this.vitalsService.createVitalSign(vitalData).subscribe({
      next: (vital) => {
        this.snackBar.open('Sinais vitais registrados com sucesso!', 'OK', { duration: 3000 });
        this.dialogRef.close(vital);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Erro ao registrar sinais vitais. Tente novamente.', 'OK', { duration: 5000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
