/**
 * Vita - Vitals Dashboard Component
 * Dashboard para monitoramento de sinais vitais.
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { VitalsService } from '@core/services/vitals.service';
import { PatientService } from '@core/services/patient.service';
import { VitalSign, Patient } from '@core/models';
import { VitalsDialogComponent, VitalsDialogData } from '@shared/components/vitals-dialog/vitals-dialog.component';

@Component({
  selector: 'app-vitals-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxChartsModule,
  ],
  template: `
    <div class="vitals-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">Sinais Vitais</h1>
          <span class="page-header__subtitle">Monitoramento em tempo real</span>
        </div>
        <button mat-flat-button color="primary" (click)="openNewVitalDialog()">
          <i class="ph-bold ph-plus"></i>
          Registrar Medição
        </button>
      </div>

      <!-- Patient Selector -->
      <div class="patient-selector">
        <mat-form-field appearance="outline">
          <mat-label>Selecione o Paciente</mat-label>
          <mat-select [(value)]="selectedPatientId" (selectionChange)="onPatientChange()">
            @for (patient of patients(); track patient.id) {
              <mat-option [value]="patient.id">{{ patient.full_name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="period-selector">
          <button
            class="period-btn"
            [class.period-btn--active]="selectedPeriod === 7"
            (click)="setPeriod(7)"
          >
            7 dias
          </button>
          <button
            class="period-btn"
            [class.period-btn--active]="selectedPeriod === 30"
            (click)="setPeriod(30)"
          >
            30 dias
          </button>
          <button
            class="period-btn"
            [class.period-btn--active]="selectedPeriod === 90"
            (click)="setPeriod(90)"
          >
            90 dias
          </button>
        </div>
      </div>

      @if (selectedPatientId) {
        <!-- Stats Cards -->
        <div class="vitals-stats">
          @if (stats()) {
            <div class="stat-card stat-card--heart animate-fade-in">
              <div class="stat-card__header">
                <i class="ph-fill ph-heart animate-heartbeat"></i>
                <span class="stat-card__title">Freq. Cardíaca</span>
              </div>
              <div class="stat-card__value">
                {{ stats()!.avg_heart_rate || '--' }}
                <span class="stat-card__unit">bpm</span>
              </div>
              <div class="stat-card__range">
                Min: {{ stats()!.min_heart_rate || '--' }} | Max: {{ stats()!.max_heart_rate || '--' }}
              </div>
            </div>

            <div class="stat-card stat-card--pressure animate-fade-in animate-delay-1">
              <div class="stat-card__header">
                <i class="ph-fill ph-activity"></i>
                <span class="stat-card__title">Pressão Arterial</span>
              </div>
              <div class="stat-card__value">
                {{ stats()!.avg_systolic || '--' }}/{{ stats()!.avg_diastolic || '--' }}
                <span class="stat-card__unit">mmHg</span>
              </div>
              <div class="stat-card__range">Média do período</div>
            </div>

            <div class="stat-card stat-card--temp animate-fade-in animate-delay-2">
              <div class="stat-card__header">
                <i class="ph-fill ph-thermometer"></i>
                <span class="stat-card__title">Temperatura</span>
              </div>
              <div class="stat-card__value">
                {{ stats()!.avg_temperature || '--' }}
                <span class="stat-card__unit">°C</span>
              </div>
              <div class="stat-card__range">Média do período</div>
            </div>

            <div class="stat-card stat-card--oxygen animate-fade-in animate-delay-3">
              <div class="stat-card__header">
                <i class="ph-fill ph-wind"></i>
                <span class="stat-card__title">SpO2</span>
              </div>
              <div class="stat-card__value">
                {{ stats()!.avg_oxygen || '--' }}
                <span class="stat-card__unit">%</span>
              </div>
              <div class="stat-card__range">{{ stats()!.total_records }} registros</div>
            </div>
          }
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <!-- Heart Rate Chart -->
          <div class="chart-card animate-fade-in animate-delay-4">
            <h3 class="chart-card__title">
              <i class="ph-bold ph-heart" style="color: var(--vita-heart);"></i>
              Frequência Cardíaca
            </h3>
            <div class="chart-container">
              @if (heartRateChartData.length > 0) {
                <ngx-charts-line-chart
                  [view]="chartView"
                  [results]="heartRateChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="true"
                  [yAxisLabel]="'bpm'"
                  [animations]="true"
                  [scheme]="heartRateScheme"
                  [autoScale]="true"
                >
                </ngx-charts-line-chart>
              } @else {
                <div class="chart-empty">
                  <i class="ph-duotone ph-chart-line"></i>
                  <p>Sem dados disponíveis</p>
                </div>
              }
            </div>
          </div>

          <!-- Blood Pressure Chart -->
          <div class="chart-card animate-fade-in animate-delay-5">
            <h3 class="chart-card__title">
              <i class="ph-bold ph-activity" style="color: var(--vita-pressure);"></i>
              Pressão Arterial
            </h3>
            <div class="chart-container">
              @if (bloodPressureChartData.length > 0) {
                <ngx-charts-bar-vertical
                  [view]="chartView"
                  [results]="bloodPressureChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="true"
                  [yAxisLabel]="'mmHg'"
                  [animations]="true"
                  [scheme]="pressureScheme"
                  [barPadding]="8"
                  [roundEdges]="true"
                >
                </ngx-charts-bar-vertical>
              } @else {
                <div class="chart-empty">
                  <i class="ph-duotone ph-chart-bar"></i>
                  <p>Sem dados disponíveis</p>
                </div>
              }
            </div>
          </div>

          <!-- Oxygen Chart -->
          <div class="chart-card animate-fade-in animate-delay-6">
            <h3 class="chart-card__title">
              <i class="ph-bold ph-wind" style="color: var(--vita-oxygen);"></i>
              Saturação de Oxigênio
            </h3>
            <div class="chart-container">
              @if (oxygenChartData.length > 0) {
                <ngx-charts-area-chart
                  [view]="chartView"
                  [results]="oxygenChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="true"
                  [yAxisLabel]="'%'"
                  [animations]="true"
                  [scheme]="oxygenScheme"
                  [autoScale]="true"
                >
                </ngx-charts-area-chart>
              } @else {
                <div class="chart-empty">
                  <i class="ph-duotone ph-chart-line-up"></i>
                  <p>Sem dados disponíveis</p>
                </div>
              }
            </div>
          </div>

          <!-- Temperature Chart -->
          <div class="chart-card animate-fade-in animate-delay-7">
            <h3 class="chart-card__title">
              <i class="ph-bold ph-thermometer" style="color: var(--vita-temperature);"></i>
              Temperatura
            </h3>
            <div class="chart-container">
              @if (temperatureChartData.length > 0) {
                <ngx-charts-line-chart
                  [view]="chartView"
                  [results]="temperatureChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="true"
                  [yAxisLabel]="'°C'"
                  [animations]="true"
                  [scheme]="temperatureScheme"
                  [autoScale]="true"
                >
                </ngx-charts-line-chart>
              } @else {
                <div class="chart-empty">
                  <i class="ph-duotone ph-chart-line"></i>
                  <p>Sem dados disponíveis</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Records -->
        <div class="recent-section animate-fade-in animate-delay-8">
          <h3 class="recent-section__title">
            <i class="ph-bold ph-clock-counter-clockwise"></i>
            Registros Recentes
          </h3>

          <div class="records-table">
            <div class="records-table__header">
              <span>Data/Hora</span>
              <span>FC</span>
              <span>PA</span>
              <span>Temp</span>
              <span>SpO2</span>
              <span>Glicose</span>
            </div>

            @for (vital of vitals(); track vital.id) {
              <div class="records-table__row">
                <span class="records-table__date">
                  {{ formatDateTime(vital.recorded_at) }}
                </span>
                <span [class]="getVitalClass('heart_rate', vital.heart_rate)">
                  {{ vital.heart_rate || '--' }}
                </span>
                <span [class]="getVitalClass('systolic_pressure', vital.systolic_pressure)">
                  {{ vital.systolic_pressure || '--' }}/{{ vital.diastolic_pressure || '--' }}
                </span>
                <span [class]="getVitalClass('temperature', vital.temperature)">
                  {{ vital.temperature || '--' }}
                </span>
                <span [class]="getVitalClass('oxygen_saturation', vital.oxygen_saturation)">
                  {{ vital.oxygen_saturation || '--' }}
                </span>
                <span>{{ vital.glucose_level || '--' }}</span>
              </div>
            } @empty {
              <div class="records-table__empty">
                Nenhum registro encontrado
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <i class="ph-duotone ph-heartbeat"></i>
          <h3>Selecione um paciente</h3>
          <p>Escolha um paciente acima para visualizar seus sinais vitais</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .vitals-page {
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

    .page-header__title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
    }

    .page-header__subtitle {
      font-size: 0.9rem;
      color: var(--vita-neutral-500);
    }

    // ===== PATIENT SELECTOR =====
    .patient-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-xl);
      box-shadow: var(--shadow-sm);

      mat-form-field {
        width: 300px;

        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }
      }
    }

    .period-selector {
      display: flex;
      gap: var(--space-xs);
    }

    .period-btn {
      padding: var(--space-sm) var(--space-md);
      border: 1px solid var(--vita-neutral-200);
      border-radius: var(--radius-md);
      background: transparent;
      font-family: var(--font-primary);
      font-size: 0.875rem;
      color: var(--vita-neutral-600);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--vita-primary-300);
        color: var(--vita-primary-500);
      }

      &--active {
        background: var(--vita-primary-500);
        border-color: var(--vita-primary-500);
        color: #FFFFFF;
      }
    }

    // ===== STATS CARDS =====
    .vitals-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .stat-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
      }

      &--heart::before { background: var(--vita-heart); }
      &--pressure::before { background: var(--vita-pressure); }
      &--temp::before { background: var(--vita-temperature); }
      &--oxygen::before { background: var(--vita-oxygen); }
    }

    .stat-card__header {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);

      i {
        font-size: 1.5rem;
      }

      .stat-card--heart & i { color: var(--vita-heart); }
      .stat-card--pressure & i { color: var(--vita-pressure); }
      .stat-card--temp & i { color: var(--vita-temperature); }
      .stat-card--oxygen & i { color: var(--vita-oxygen); }
    }

    .stat-card__title {
      font-size: 0.85rem;
      color: var(--vita-neutral-500);
    }

    .stat-card__value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
      line-height: 1.2;
    }

    .stat-card__unit {
      font-size: 1rem;
      font-weight: 400;
      color: var(--vita-neutral-500);
    }

    .stat-card__range {
      font-size: 0.75rem;
      color: var(--vita-neutral-400);
      margin-top: var(--space-sm);
    }

    // ===== CHARTS GRID =====
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .chart-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }

    .chart-card__title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--vita-neutral-800);
      margin-bottom: var(--space-lg);

      i {
        font-size: 1.25rem;
      }
    }

    .chart-container {
      height: 250px;
    }

    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vita-neutral-400);

      i {
        font-size: 3rem;
        margin-bottom: var(--space-md);
      }

      p {
        font-size: 0.9rem;
      }
    }

    // ===== RECENT SECTION =====
    .recent-section {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }

    .recent-section__title {
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

    .records-table {
      overflow-x: auto;
    }

    .records-table__header,
    .records-table__row {
      display: grid;
      grid-template-columns: 180px repeat(5, 1fr);
      gap: var(--space-md);
      padding: var(--space-md);
    }

    .records-table__header {
      background: var(--vita-neutral-100);
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--vita-neutral-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .records-table__row {
      border-bottom: 1px solid var(--vita-neutral-100);
      font-size: 0.9rem;
      color: var(--vita-neutral-700);

      &:last-child {
        border-bottom: none;
      }
    }

    .records-table__date {
      color: var(--vita-neutral-500);
      font-size: 0.85rem;
    }

    .records-table__empty {
      padding: var(--space-xl);
      text-align: center;
      color: var(--vita-neutral-400);
    }

    .vital-critical {
      color: var(--vita-error);
      font-weight: 600;
    }

    .vital-warning {
      color: var(--vita-warning);
      font-weight: 500;
    }

    // ===== EMPTY STATE =====
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      text-align: center;

      i {
        font-size: 5rem;
        color: var(--vita-neutral-300);
        margin-bottom: var(--space-lg);
      }

      h3 {
        font-size: 1.25rem;
        color: var(--vita-neutral-700);
        margin-bottom: var(--space-sm);
      }

      p {
        color: var(--vita-neutral-500);
      }
    }

    // ===== RESPONSIVE =====
    @media (max-width: 1024px) {
      .vitals-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .vitals-stats {
        grid-template-columns: 1fr;
      }

      .patient-selector {
        flex-direction: column;
        gap: var(--space-md);

        mat-form-field {
          width: 100%;
        }
      }
    }
  `],
})
export class VitalsDashboardComponent implements OnInit {
  readonly patients = this.patientService.patients;
  readonly vitals = this.vitalsService.vitals;
  readonly stats = this.vitalsService.stats;
  readonly chartData = this.vitalsService.chartData;

  selectedPatientId: number | null = null;
  selectedPeriod = 30;
  readonly chartView: [number, number] = [500, 250];

  readonly heartRateScheme: any = {
    name: 'heartRate',
    selectable: true,
    group: 'Ordinal',
    domain: ['#F43F5E'],
  };

  readonly pressureScheme: any = {
    name: 'pressure',
    selectable: true,
    group: 'Ordinal',
    domain: ['#8B5CF6'],
  };

  readonly oxygenScheme: any = {
    name: 'oxygen',
    selectable: true,
    group: 'Ordinal',
    domain: ['#06B6D4'],
  };

  readonly temperatureScheme: any = {
    name: 'temperature',
    selectable: true,
    group: 'Ordinal',
    domain: ['#F97316'],
  };

  get heartRateChartData() {
    const data = this.chartData();
    if (!data || !data.heart_rate?.length) return [];

    return [
      {
        name: 'Frequência Cardíaca',
        series: data.heart_rate.map((d) => ({ name: d.name, value: d.value })),
      },
    ];
  }

  get bloodPressureChartData() {
    const data = this.chartData();
    if (!data || !data.blood_pressure?.length) return [];

    return data.blood_pressure.map((d) => ({ name: d.name, value: d.value }));
  }

  get oxygenChartData() {
    const data = this.chartData();
    if (!data || !data.oxygen_saturation?.length) return [];

    return [
      {
        name: 'SpO2',
        series: data.oxygen_saturation.map((d) => ({ name: d.name, value: d.value })),
      },
    ];
  }

  get temperatureChartData() {
    const data = this.chartData();
    if (!data || !data.temperature?.length) return [];

    return [
      {
        name: 'Temperatura',
        series: data.temperature.map((d) => ({ name: d.name, value: d.value })),
      },
    ];
  }

  constructor(
    private readonly vitalsService: VitalsService,
    private readonly patientService: PatientService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.patientService.getPatients({ pageSize: 100 }).subscribe();
  }

  onPatientChange(): void {
    // Limpa os dados anteriores antes de carregar os novos
    this.vitalsService.clearData();
    
    if (this.selectedPatientId) {
      this.loadVitalsData();
    }
  }

  setPeriod(days: number): void {
    this.selectedPeriod = days;
    if (this.selectedPatientId) {
      this.loadVitalsData();
    }
  }

  loadVitalsData(): void {
    if (!this.selectedPatientId) return;

    this.vitalsService
      .getPatientVitals(this.selectedPatientId, { limit: 50 })
      .subscribe();

    this.vitalsService
      .getPatientVitalStats(this.selectedPatientId, this.selectedPeriod)
      .subscribe();

    this.vitalsService
      .getPatientVitalChartData(this.selectedPatientId, this.selectedPeriod)
      .subscribe();
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getVitalClass(type: string, value: number | undefined): string {
    if (!value) return '';

    const status = this.vitalsService.getVitalStatus(type, value);

    if (status === 'critical') return 'vital-critical';
    if (status === 'warning') return 'vital-warning';

    return '';
  }

  openNewVitalDialog(): void {
    const dialogRef = this.dialog.open(VitalsDialogComponent, {
      data: { preSelectedPatientId: this.selectedPatientId } as VitalsDialogData,
      panelClass: 'vita-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.selectedPatientId) {
        this.loadVitalsData();
      }
    });
  }
}
