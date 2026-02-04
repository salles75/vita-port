/**
 * Vita - Appointments List Component
 * Gerenciamento de consultas com calendário.
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AppointmentService } from '@core/services/appointment.service';
import { Appointment, AppointmentStatus } from '@core/models';
import { AppointmentDialogComponent, AppointmentDialogData } from '@shared/components/appointment-dialog/appointment-dialog.component';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="appointments-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">Consultas</h1>
          <span class="page-header__count">{{ totalAppointments() }} agendamentos</span>
        </div>
        <button mat-flat-button color="primary" (click)="openNewAppointmentDialog()">
          <i class="ph-bold ph-calendar-plus"></i>
          Nova Consulta
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="date-navigation">
          <button class="nav-btn" (click)="navigateWeek(-1)">
            <i class="ph-bold ph-caret-left"></i>
          </button>
          <span class="date-label">{{ currentWeekLabel }}</span>
          <button class="nav-btn" (click)="navigateWeek(1)">
            <i class="ph-bold ph-caret-right"></i>
          </button>
          <button class="today-btn" (click)="goToToday()">Hoje</button>
        </div>

        <mat-form-field appearance="outline" class="status-filter">
          <mat-label>Status</mat-label>
          <mat-select [(value)]="selectedStatus" (selectionChange)="loadAppointments()">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="scheduled">Agendado</mat-option>
            <mat-option value="confirmed">Confirmado</mat-option>
            <mat-option value="completed">Concluído</mat-option>
            <mat-option value="cancelled">Cancelado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Week Calendar View -->
      <div class="calendar-view">
        <div class="calendar-header">
          @for (day of weekDays; track day.date) {
            <div class="calendar-day-header" [class.calendar-day-header--today]="isToday(day.date)">
              <span class="calendar-day-header__name">{{ day.name }}</span>
              <span class="calendar-day-header__date">{{ day.dayNumber }}</span>
            </div>
          }
        </div>

        <div class="calendar-body">
          @for (day of weekDays; track day.date) {
            <div class="calendar-column" [class.calendar-column--today]="isToday(day.date)">
              @for (appointment of getAppointmentsForDay(day.date); track appointment.id) {
                <div
                  class="appointment-slot"
                  [class]="getAppointmentClass(appointment)"
                  (click)="openAppointmentDetail(appointment)"
                >
                  <span class="appointment-slot__time">
                    {{ formatTime(appointment.scheduled_at) }}
                  </span>
                  <span class="appointment-slot__patient">
                    Paciente #{{ appointment.patient_id }}
                  </span>
                  <span class="appointment-slot__type">
                    @if (appointment.is_telemedicine) {
                      <i class="ph-bold ph-video-camera"></i>
                    } @else {
                      <i class="ph-bold ph-user"></i>
                    }
                    {{ appointment.appointment_type }}
                  </span>
                  <span class="appointment-slot__status">
                    {{ getStatusLabel(appointment.status) }}
                  </span>
                </div>
              } @empty {
                <div class="calendar-empty">
                  <i class="ph-duotone ph-calendar-blank"></i>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Upcoming Appointments List -->
      <div class="upcoming-section">
        <h2 class="upcoming-section__title">
          <i class="ph-bold ph-clock"></i>
          Próximas Consultas
        </h2>

        <div class="upcoming-list">
          @for (appointment of upcomingAppointments(); track appointment.id; let i = $index) {
            <div class="upcoming-card animate-fade-in" [style.animation-delay]="(i * 0.05) + 's'">
              <div class="upcoming-card__datetime">
                <span class="upcoming-card__date">{{ formatDateShort(appointment.scheduled_at) }}</span>
                <span class="upcoming-card__time">{{ formatTime(appointment.scheduled_at) }}</span>
              </div>
              <div class="upcoming-card__content">
                <span class="upcoming-card__patient">{{ appointment.patient.full_name }}</span>
                <span class="upcoming-card__type">
                  @if (appointment.is_telemedicine) {
                    <i class="ph-bold ph-video-camera"></i> Telemedicina
                  } @else {
                    <i class="ph-bold ph-user"></i> Presencial
                  }
                  • {{ appointment.reason || 'Consulta' }}
                </span>
              </div>
              <div class="upcoming-card__actions">
                <span class="vita-badge" [class]="getStatusBadgeClass(appointment.status)">
                  {{ getStatusLabel(appointment.status) }}
                </span>
                <button
                  class="action-btn"
                  title="Ver detalhes"
                  (click)="openAppointmentDetail(appointment)"
                >
                  <i class="ph-bold ph-eye"></i>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="ph-duotone ph-calendar-check"></i>
              <p>Nenhuma consulta agendada</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    // ===== HEADER =====
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-lg);
    }

    .page-header__left {
      display: flex;
      align-items: baseline;
      gap: var(--space-md);
    }

    .page-header__title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
    }

    .page-header__count {
      font-size: 0.875rem;
      color: var(--vita-neutral-500);
    }

    // ===== FILTERS =====
    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .nav-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--vita-neutral-200);
      border-radius: var(--radius-md);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-neutral-100);
        border-color: var(--vita-neutral-300);
      }

      i {
        font-size: 1rem;
        color: var(--vita-neutral-600);
      }
    }

    .date-label {
      font-weight: 600;
      color: var(--vita-neutral-800);
      min-width: 200px;
      text-align: center;
    }

    .today-btn {
      padding: var(--space-sm) var(--space-md);
      border: none;
      border-radius: var(--radius-md);
      background: var(--vita-primary-500);
      color: #FFFFFF;
      font-family: var(--font-primary);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-primary-600);
      }
    }

    .status-filter {
      width: 160px;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }

    // ===== CALENDAR VIEW =====
    .calendar-view {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      margin-bottom: var(--space-xl);
    }

    .calendar-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--vita-neutral-100);
    }

    .calendar-day-header {
      padding: var(--space-md);
      text-align: center;
      border-right: 1px solid var(--vita-neutral-100);

      &:last-child {
        border-right: none;
      }

      &--today {
        background: var(--vita-primary-50);
      }
    }

    .calendar-day-header__name {
      display: block;
      font-size: 0.75rem;
      color: var(--vita-neutral-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-xs);
    }

    .calendar-day-header__date {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--vita-neutral-800);

      .calendar-day-header--today & {
        color: var(--vita-primary-600);
      }
    }

    .calendar-body {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      min-height: 300px;
    }

    .calendar-column {
      padding: var(--space-sm);
      border-right: 1px solid var(--vita-neutral-100);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      &:last-child {
        border-right: none;
      }

      &--today {
        background: var(--vita-primary-50);
      }
    }

    .calendar-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: var(--vita-neutral-200);

      i {
        font-size: 2rem;
      }
    }

    .appointment-slot {
      padding: var(--space-sm);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      gap: 2px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &--scheduled {
        background: var(--vita-info-light);
        border-left: 3px solid var(--vita-info);
      }

      &--confirmed {
        background: var(--vita-success-light);
        border-left: 3px solid var(--vita-success);
      }

      &--completed {
        background: var(--vita-neutral-100);
        border-left: 3px solid var(--vita-neutral-400);
        opacity: 0.7;
      }

      &--cancelled {
        background: var(--vita-error-light);
        border-left: 3px solid var(--vita-error);
        opacity: 0.5;
      }
    }

    .appointment-slot__time {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--vita-neutral-700);
    }

    .appointment-slot__patient {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--vita-neutral-800);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .appointment-slot__type {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.65rem;
      color: var(--vita-neutral-500);

      i {
        font-size: 0.75rem;
      }
    }

    .appointment-slot__status {
      display: none;
    }

    // ===== UPCOMING SECTION =====
    .upcoming-section {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }

    .upcoming-section__title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--vita-neutral-800);
      margin-bottom: var(--space-lg);

      i {
        color: var(--vita-primary-500);
      }
    }

    .upcoming-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .upcoming-card {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      padding: var(--space-md);
      background: var(--vita-neutral-50);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-neutral-100);
      }
    }

    .upcoming-card__datetime {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 70px;
      padding: var(--space-sm);
      background: #FFFFFF;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .upcoming-card__date {
      font-size: 0.7rem;
      color: var(--vita-neutral-500);
      text-transform: uppercase;
    }

    .upcoming-card__time {
      font-size: 1rem;
      font-weight: 700;
      color: var(--vita-primary-600);
    }

    .upcoming-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .upcoming-card__patient {
      font-weight: 600;
      color: var(--vita-neutral-800);
      margin-bottom: var(--space-xs);
    }

    .upcoming-card__type {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: 0.85rem;
      color: var(--vita-neutral-500);

      i {
        color: var(--vita-neutral-400);
      }
    }

    .upcoming-card__actions {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: var(--radius-md);
      background: #FFFFFF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-primary-100);
        color: var(--vita-primary-600);
      }

      i {
        font-size: 1rem;
        color: var(--vita-neutral-600);
      }
    }

    // ===== EMPTY STATE =====
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-2xl);

      i {
        font-size: 3rem;
        color: var(--vita-neutral-300);
        margin-bottom: var(--space-md);
      }

      p {
        color: var(--vita-neutral-500);
      }
    }
  `],
})
export class AppointmentsListComponent implements OnInit {
  readonly appointments = this.appointmentService.appointments;
  readonly upcomingAppointments = this.appointmentService.upcomingAppointments;
  readonly totalAppointments = this.appointmentService.totalAppointments;
  readonly isLoading = this.appointmentService.isLoading;

  readonly currentWeek = signal(new Date());
  selectedStatus: AppointmentStatus | null = null;

  get currentWeekLabel(): string {
    const start = this.getWeekStart(this.currentWeek());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' });
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'short' });

    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${start.getFullYear()}`;
    }

    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${start.getFullYear()}`;
  }

  get weekDays() {
    const start = this.getWeekStart(this.currentWeek());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);

      days.push({
        date,
        name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dayNumber: date.getDate(),
      });
    }

    return days;
  }

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadUpcomingAppointments();
  }

  loadAppointments(): void {
    const start = this.getWeekStart(this.currentWeek());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    this.appointmentService
      .getAppointments({
        dateFrom: start.toISOString().split('T')[0],
        dateTo: end.toISOString().split('T')[0],
        status: this.selectedStatus || undefined,
      })
      .subscribe();
  }

  loadUpcomingAppointments(): void {
    this.appointmentService.getUpcomingAppointments(10).subscribe();
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  navigateWeek(direction: number): void {
    const newDate = new Date(this.currentWeek());
    newDate.setDate(newDate.getDate() + direction * 7);
    this.currentWeek.set(newDate);
    this.loadAppointments();
  }

  goToToday(): void {
    this.currentWeek.set(new Date());
    this.loadAppointments();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  getAppointmentsForDay(date: Date): Appointment[] {
    return this.appointments().filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduled_at);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  }

  getAppointmentClass(appointment: Appointment): string {
    return `appointment-slot appointment-slot--${appointment.status}`;
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu',
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      scheduled: 'vita-badge--info',
      confirmed: 'vita-badge--success',
      in_progress: 'vita-badge--warning',
      completed: 'vita-badge--neutral',
      cancelled: 'vita-badge--error',
      no_show: 'vita-badge--error',
    };
    return classes[status] || 'vita-badge--neutral';
  }

  openNewAppointmentDialog(): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: { mode: 'create' } as AppointmentDialogData,
      panelClass: 'vita-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAppointments();
        this.loadUpcomingAppointments();
      }
    });
  }

  openAppointmentDetail(appointment: any): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: { mode: 'edit', appointment } as AppointmentDialogData,
      panelClass: 'vita-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAppointments();
        this.loadUpcomingAppointments();
      }
    });
  }
}
