/**
 * Vita - Appointment Dialog Component
 * Modal para criar/editar consultas.
 */

import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AppointmentService } from '@core/services/appointment.service';
import { PatientService } from '@core/services/patient.service';
import { Appointment, Patient } from '@core/models';

export interface AppointmentDialogData {
  appointment?: Appointment;
  mode: 'create' | 'edit';
  preSelectedPatientId?: number;
}

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="appointment-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <i class="ph-bold" [class.ph-calendar-plus]="data.mode === 'create'" [class.ph-pencil]="data.mode === 'edit'"></i>
          {{ data.mode === 'create' ? 'Nova Consulta' : 'Editar Consulta' }}
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

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Data</mat-label>
            <input matInput type="date" formControlName="date" />
            <i matPrefix class="ph-bold ph-calendar form-icon"></i>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Horário</mat-label>
            <input matInput type="time" formControlName="time" />
            <i matPrefix class="ph-bold ph-clock form-icon"></i>
          </mat-form-field>
        </div>

        <div class="form-row form-row--half">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Tipo de Consulta</mat-label>
            <mat-select formControlName="appointment_type">
              <mat-option value="Consulta">Consulta</mat-option>
              <mat-option value="Retorno">Retorno</mat-option>
              <mat-option value="Exame">Exame</mat-option>
              <mat-option value="Emergência">Emergência</mat-option>
              <mat-option value="Rotina">Rotina</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Duração (minutos)</mat-label>
            <mat-select formControlName="duration_minutes">
              <mat-option [value]="15">15 minutos</mat-option>
              <mat-option [value]="30">30 minutos</mat-option>
              <mat-option [value]="45">45 minutos</mat-option>
              <mat-option [value]="60">1 hora</mat-option>
              <mat-option [value]="90">1h30</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Motivo da Consulta</mat-label>
            <textarea matInput formControlName="reason" rows="2" placeholder="Descreva o motivo da consulta"></textarea>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-checkbox formControlName="is_telemedicine" color="primary">
            <span class="checkbox-label">
              <i class="ph-bold ph-video-camera"></i>
              Consulta por Telemedicina
            </span>
          </mat-checkbox>
        </div>

        @if (form.get('is_telemedicine')?.value) {
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Link da Reunião</mat-label>
              <input matInput formControlName="meeting_url" placeholder="https://meet.google.com/..." />
              <i matPrefix class="ph-bold ph-link form-icon"></i>
            </mat-form-field>
          </div>
        }

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Observações</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="Observações adicionais"></textarea>
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
              Agendando...
            } @else {
              <i class="ph-bold ph-check"></i>
              {{ data.mode === 'create' ? 'Agendar' : 'Salvar' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      width: 550px;
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

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--vita-neutral-700);

      i {
        color: var(--vita-info);
      }
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
export class AppointmentDialogComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly patients = this.patientService.patients;
  form: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData,
    private readonly fb: FormBuilder,
    private readonly appointmentService: AppointmentService,
    private readonly patientService: PatientService,
    private readonly snackBar: MatSnackBar
  ) {
    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const defaultTime = now.toTimeString().slice(0, 5);

    this.form = this.fb.group({
      patient_id: [data.preSelectedPatientId || data.appointment?.patient_id || null, Validators.required],
      date: [data.appointment ? new Date(data.appointment.scheduled_at).toISOString().split('T')[0] : defaultDate, Validators.required],
      time: [data.appointment ? new Date(data.appointment.scheduled_at).toTimeString().slice(0, 5) : defaultTime, Validators.required],
      appointment_type: [data.appointment?.appointment_type || 'Consulta'],
      duration_minutes: [data.appointment?.duration_minutes || 30],
      reason: [data.appointment?.reason || ''],
      is_telemedicine: [data.appointment?.is_telemedicine || false],
      meeting_url: [data.appointment?.meeting_url || ''],
      notes: [data.appointment?.notes || ''],
    });
  }

  ngOnInit(): void {
    // Carrega lista de pacientes
    this.patientService.getPatients({ pageSize: 100 }).subscribe();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.form.value;

    // Combina data e hora
    const scheduledAt = new Date(`${formData.date}T${formData.time}`);

    const appointmentData = {
      patient_id: formData.patient_id,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: formData.duration_minutes,
      appointment_type: formData.appointment_type,
      reason: formData.reason,
      notes: formData.notes,
      is_telemedicine: formData.is_telemedicine,
      meeting_url: formData.is_telemedicine ? formData.meeting_url : null,
    };

    const request$ = this.data.mode === 'create'
      ? this.appointmentService.createAppointment(appointmentData)
      : this.appointmentService.updateAppointment(this.data.appointment!.id, appointmentData);

    request$.subscribe({
      next: (appointment) => {
        this.snackBar.open(
          this.data.mode === 'create' ? 'Consulta agendada com sucesso!' : 'Consulta atualizada!',
          'OK',
          { duration: 3000 }
        );
        this.dialogRef.close(appointment);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Erro ao salvar consulta. Tente novamente.', 'OK', { duration: 5000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
