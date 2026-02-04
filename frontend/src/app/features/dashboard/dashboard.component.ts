/**
 * Vita - Dashboard Component
 * Dashboard principal com estatísticas, gráficos e visão geral.
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { AppointmentService } from '@core/services/appointment.service';
import { VitalsService } from '@core/services/vitals.service';
import { DashboardStats, AppointmentDetail, VitalSign } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    NgxChartsModule,
  ],
  template: `
    <div class="dashboard">
      <!-- Welcome Section -->
      <section class="dashboard__welcome animate-fade-in">
        <div class="dashboard__welcome-content">
          <h1 class="dashboard__greeting">
            Olá, {{ getFirstName() }}! 👋
          </h1>
          <p class="dashboard__date">{{ currentDate }}</p>
        </div>
        <button mat-flat-button color="accent" routerLink="/appointments" class="dashboard__cta">
          <i class="ph-bold ph-plus"></i>
          Nova Consulta
        </button>
      </section>

      <!-- Stats Grid -->
      <section class="dashboard__stats">
        @for (stat of statsCards(); track stat.label; let i = $index) {
          <div class="stat-card animate-fade-in" [style.animation-delay]="(i * 0.1) + 's'">
            <div class="stat-card__icon" [style.background]="stat.bgColor">
              <i class="ph-bold" [class]="stat.icon" [style.color]="stat.color"></i>
            </div>
            <div class="stat-card__content">
              <span class="stat-card__value">{{ stat.value }}</span>
              <span class="stat-card__label">{{ stat.label }}</span>
            </div>
            @if (stat.badge) {
              <span class="stat-card__badge" [class]="'vita-badge--' + stat.badgeType">
                {{ stat.badge }}
              </span>
            }
          </div>
        }
      </section>

      <!-- Main Content Grid -->
      <div class="dashboard__grid">
        <!-- Today's Appointments -->
        <section class="dashboard__section dashboard__section--appointments animate-fade-in animate-delay-3">
          <div class="section-header">
            <h2 class="section-header__title">
              <i class="ph-bold ph-calendar-check"></i>
              Consultas de Hoje
            </h2>
            <a routerLink="/appointments" class="section-header__link">Ver todas</a>
          </div>

          <div class="appointments-list">
            @if (todayAppointments().length === 0) {
              <div class="empty-state">
                <i class="ph-duotone ph-calendar-blank"></i>
                <p>Nenhuma consulta agendada para hoje</p>
              </div>
            } @else {
              @for (appointment of todayAppointments(); track appointment.id) {
                <div class="appointment-card" [class.appointment-card--completed]="appointment.status === 'completed'">
                  <div class="appointment-card__time">
                    {{ formatTime(appointment.scheduled_at) }}
                  </div>
                  <div class="appointment-card__content">
                    <span class="appointment-card__patient">{{ appointment.patient.full_name }}</span>
                    <span class="appointment-card__type">
                      @if (appointment.is_telemedicine) {
                        <i class="ph-bold ph-video-camera"></i>
                      } @else {
                        <i class="ph-bold ph-user"></i>
                      }
                      {{ appointment.appointment_type }}
                    </span>
                  </div>
                  <div class="appointment-card__status">
                    <span class="vita-badge" [class]="getStatusBadgeClass(appointment.status)">
                      {{ getStatusLabel(appointment.status) }}
                    </span>
                  </div>
                </div>
              }
            }
          </div>
        </section>

        <!-- Critical Alerts -->
        <section class="dashboard__section dashboard__section--alerts animate-fade-in animate-delay-4">
          <div class="section-header">
            <h2 class="section-header__title">
              <i class="ph-bold ph-warning-circle"></i>
              Alertas Críticos
            </h2>
            <span class="section-header__count" *ngIf="criticalVitals().length > 0">
              {{ criticalVitals().length }}
            </span>
          </div>

          <div class="alerts-list">
            @if (criticalVitals().length === 0) {
              <div class="empty-state empty-state--success">
                <i class="ph-duotone ph-check-circle"></i>
                <p>Nenhum alerta crítico nas últimas 24h</p>
              </div>
            } @else {
              @for (vital of criticalVitals().slice(0, 5); track vital.id) {
                <div class="alert-card">
                  <div class="alert-card__icon">
                    <i class="ph-fill ph-heart animate-heartbeat" style="color: var(--vita-heart);"></i>
                  </div>
                  <div class="alert-card__content">
                    <span class="alert-card__patient">Paciente #{{ vital.patient_id }}</span>
                    <span class="alert-card__detail">
                      @if (vital.heart_rate && (vital.heart_rate < 50 || vital.heart_rate > 120)) {
                        FC: {{ vital.heart_rate }} bpm
                      }
                      @if (vital.oxygen_saturation && vital.oxygen_saturation < 90) {
                        SpO2: {{ vital.oxygen_saturation }}%
                      }
                    </span>
                  </div>
                  <span class="alert-card__time">{{ formatRelativeTime(vital.recorded_at) }}</span>
                </div>
              }
            }
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="dashboard__section dashboard__section--actions animate-fade-in animate-delay-5">
          <div class="section-header">
            <h2 class="section-header__title">
              <i class="ph-bold ph-lightning"></i>
              Ações Rápidas
            </h2>
          </div>

          <div class="actions-grid">
            <a routerLink="/patients" [queryParams]="{ action: 'new' }" class="action-button">
              <div class="action-button__icon" style="background: var(--vita-success-light);">
                <i class="ph-bold ph-user-plus" style="color: var(--vita-success);"></i>
              </div>
              <span>Novo Paciente</span>
            </a>
            <a routerLink="/appointments" [queryParams]="{ action: 'new' }" class="action-button">
              <div class="action-button__icon" style="background: var(--vita-info-light);">
                <i class="ph-bold ph-calendar-plus" style="color: var(--vita-info);"></i>
              </div>
              <span>Agendar Consulta</span>
            </a>
            <a routerLink="/vitals" [queryParams]="{ action: 'new' }" class="action-button">
              <div class="action-button__icon" style="background: var(--vita-accent-100);">
                <i class="ph-bold ph-heartbeat" style="color: var(--vita-accent-500);"></i>
              </div>
              <span>Registrar Vitais</span>
            </a>
            <a routerLink="/patients" class="action-button">
              <div class="action-button__icon" style="background: var(--vita-primary-100);">
                <i class="ph-bold ph-magnifying-glass" style="color: var(--vita-primary-500);"></i>
              </div>
              <span>Buscar Paciente</span>
            </a>
          </div>
        </section>

        <!-- Activity Chart -->
        <section class="dashboard__section dashboard__section--chart animate-fade-in animate-delay-6">
          <div class="section-header">
            <h2 class="section-header__title">
              <i class="ph-bold ph-chart-bar"></i>
              Consultas da Semana
            </h2>
          </div>

          <div class="chart-container">
            <ngx-charts-bar-vertical
              [view]="chartView"
              [results]="weeklyChartData"
              [gradient]="true"
              [xAxis]="true"
              [yAxis]="true"
              [showXAxisLabel]="false"
              [showYAxisLabel]="false"
              [animations]="true"
              [barPadding]="16"
              [roundEdges]="true"
              [scheme]="colorScheme"
            >
            </ngx-charts-bar-vertical>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    // ===== WELCOME SECTION =====
    .dashboard__welcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xl);
      background: linear-gradient(135deg, var(--vita-primary-500) 0%, var(--vita-primary-600) 100%);
      border-radius: var(--radius-xl);
      margin-bottom: var(--space-xl);
      color: #FFFFFF;
    }

    .dashboard__greeting {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: var(--space-xs);
    }

    .dashboard__date {
      opacity: 0.8;
      font-size: 0.95rem;
    }

    .dashboard__cta {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-weight: 600;

      i {
        font-size: 1.25rem;
      }
    }

    // ===== STATS GRID =====
    .dashboard__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .stat-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      display: flex;
      align-items: center;
      gap: var(--space-md);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
    }

    .stat-card__icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.5rem;
      }
    }

    .stat-card__content {
      display: flex;
      flex-direction: column;
    }

    .stat-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
      line-height: 1.2;
    }

    .stat-card__label {
      font-size: 0.875rem;
      color: var(--vita-neutral-500);
    }

    .stat-card__badge {
      position: absolute;
      top: var(--space-md);
      right: var(--space-md);
    }

    // ===== MAIN GRID =====
    .dashboard__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto auto;
      gap: var(--space-lg);
    }

    .dashboard__section {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);

      &--appointments {
        grid-column: 1 / 2;
        grid-row: 1 / 3;
      }

      &--alerts {
        grid-column: 2 / 3;
      }

      &--actions {
        grid-column: 3 / 4;
      }

      &--chart {
        grid-column: 2 / 4;
      }
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-lg);
    }

    .section-header__title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--vita-neutral-800);

      i {
        color: var(--vita-primary-500);
      }
    }

    .section-header__link {
      font-size: 0.875rem;
      color: var(--vita-primary-500);
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .section-header__count {
      background: var(--vita-error);
      color: #FFFFFF;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    // ===== APPOINTMENTS LIST =====
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .appointment-card {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--vita-neutral-50);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--vita-primary-500);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-neutral-100);
      }

      &--completed {
        border-left-color: var(--vita-success);
        opacity: 0.7;
      }
    }

    .appointment-card__time {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--vita-primary-600);
      min-width: 50px;
    }

    .appointment-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .appointment-card__patient {
      font-weight: 500;
      color: var(--vita-neutral-800);
      font-size: 0.9rem;
    }

    .appointment-card__type {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: 0.75rem;
      color: var(--vita-neutral-500);
      text-transform: capitalize;

      i {
        font-size: 0.875rem;
      }
    }

    // ===== ALERTS LIST =====
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--vita-error-light);
      border-radius: var(--radius-md);
    }

    .alert-card__icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: rgba(244, 63, 94, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.25rem;
      }
    }

    .alert-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .alert-card__patient {
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--vita-neutral-800);
    }

    .alert-card__detail {
      font-size: 0.75rem;
      color: var(--vita-error);
      font-weight: 600;
    }

    .alert-card__time {
      font-size: 0.7rem;
      color: var(--vita-neutral-500);
    }

    // ===== ACTIONS GRID =====
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-lg);
      background: var(--vita-neutral-50);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-neutral-100);
        transform: translateY(-2px);
      }

      span {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--vita-neutral-700);
        text-align: center;
      }
    }

    .action-button__icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
      }
    }

    // ===== CHART =====
    .chart-container {
      height: 250px;
    }

    // ===== EMPTY STATE =====
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      text-align: center;

      i {
        font-size: 3rem;
        color: var(--vita-neutral-300);
        margin-bottom: var(--space-md);
      }

      p {
        color: var(--vita-neutral-500);
        font-size: 0.9rem;
      }

      &--success {
        i {
          color: var(--vita-success);
        }

        p {
          color: var(--vita-success);
        }
      }
    }

    // ===== RESPONSIVE =====
    @media (max-width: 1200px) {
      .dashboard__stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard__grid {
        grid-template-columns: 1fr;
      }

      .dashboard__section {
        &--appointments,
        &--alerts,
        &--actions,
        &--chart {
          grid-column: 1;
          grid-row: auto;
        }
      }
    }

    @media (max-width: 768px) {
      .dashboard__welcome {
        flex-direction: column;
        text-align: center;
        gap: var(--space-lg);
      }

      .dashboard__stats {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly stats = signal<DashboardStats | null>(null);
  readonly todayAppointments = signal<AppointmentDetail[]>([]);
  readonly criticalVitals = signal<VitalSign[]>([]);

  readonly chartView: [number, number] = [500, 250];

  readonly colorScheme: any = {
    name: 'vita',
    selectable: true,
    group: 'Ordinal',
    domain: ['#0D5454', '#FF7A5C', '#10B981', '#F59E0B', '#8B5CF6'],
  };

  readonly weeklyChartData = [
    { name: 'Seg', value: 8 },
    { name: 'Ter', value: 12 },
    { name: 'Qua', value: 6 },
    { name: 'Qui', value: 15 },
    { name: 'Sex', value: 10 },
    { name: 'Sáb', value: 4 },
  ];

  readonly statsCards = computed(() => {
    const s = this.stats();
    if (!s) {
      return [];
    }

    return [
      {
        label: 'Pacientes',
        value: s.total_patients,
        icon: 'ph-users',
        color: 'var(--vita-primary-500)',
        bgColor: 'var(--vita-primary-100)',
      },
      {
        label: 'Consultas Hoje',
        value: s.appointments_today,
        icon: 'ph-calendar-check',
        color: 'var(--vita-info)',
        bgColor: 'var(--vita-info-light)',
      },
      {
        label: 'Pendentes',
        value: s.pending_appointments,
        icon: 'ph-clock',
        color: 'var(--vita-warning)',
        bgColor: 'var(--vita-warning-light)',
      },
      {
        label: 'Alertas',
        value: s.patients_with_alerts,
        icon: 'ph-warning-circle',
        color: 'var(--vita-error)',
        bgColor: 'var(--vita-error-light)',
        badge: s.patients_with_alerts > 0 ? 'Urgente' : null,
        badgeType: 'error',
      },
    ];
  });

  constructor(
    private readonly authService: AuthService,
    private readonly dashboardService: DashboardService,
    private readonly appointmentService: AppointmentService,
    private readonly vitalsService: VitalsService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });

    this.appointmentService.getTodayAppointments().subscribe({
      next: (appointments) => this.todayAppointments.set(appointments),
    });

    this.vitalsService.getCriticalVitals(24).subscribe({
      next: (vitals) => this.criticalVitals.set(vitals),
    });
  }

  getFirstName(): string {
    const name = this.authService.user()?.full_name || '';
    return name.split(' ')[0];
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins}min atrás`;
    }

    return `${diffHours}h atrás`;
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
}
