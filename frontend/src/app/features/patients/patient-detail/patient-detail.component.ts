/**
 * Vita - Patient Detail Component
 * Detalhes completos de um paciente com vitais e histórico.
 */

import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { PatientService } from '@core/services/patient.service';
import { VitalsService } from '@core/services/vitals.service';
import { PatientDetail, VitalChartData } from '@core/models';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatTabsModule,
    NgxChartsModule,
  ],
  template: `
    <div class="patient-detail">
      @if (patient()) {
        <!-- Header -->
        <div class="detail-header animate-fade-in">
          <a routerLink="/patients" class="detail-header__back">
            <i class="ph-bold ph-arrow-left"></i>
            Voltar
          </a>

          <div class="detail-header__main">
            <div class="detail-header__avatar" [style.background]="avatarGradient">
              {{ getInitials(patient()!.full_name) }}
            </div>
            <div class="detail-header__info">
              <h1 class="detail-header__name">{{ patient()!.full_name }}</h1>
              <div class="detail-header__meta">
                <span><i class="ph-bold ph-identification-card"></i> {{ patient()!.cpf }}</span>
                <span><i class="ph-bold ph-phone"></i> {{ patient()!.phone }}</span>
                @if (patient()!.email) {
                  <span><i class="ph-bold ph-envelope"></i> {{ patient()!.email }}</span>
                }
              </div>
            </div>
          </div>

          <div class="detail-header__actions">
            <button mat-stroked-button color="primary">
              <i class="ph-bold ph-pencil"></i>
              Editar
            </button>
            <button mat-flat-button color="primary">
              <i class="ph-bold ph-heartbeat"></i>
              Registrar Vitais
            </button>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="detail-grid">
          <!-- Info Card -->
          <div class="detail-card animate-fade-in animate-delay-1">
            <h3 class="detail-card__title">
              <i class="ph-bold ph-user"></i>
              Informações Pessoais
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">Data de Nascimento</span>
                <span class="info-item__value">{{ formatDate(patient()!.birth_date) }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Idade</span>
                <span class="info-item__value">{{ calculateAge(patient()!.birth_date) }} anos</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Gênero</span>
                <span class="info-item__value">{{ patient()!.gender }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Tipo Sanguíneo</span>
                <span class="info-item__value info-item__value--blood">
                  @if (patient()!.blood_type) {
                    <i class="ph-fill ph-drop"></i>
                    {{ patient()!.blood_type }}
                  } @else {
                    Não informado
                  }
                </span>
              </div>
              @if (patient()!.address) {
                <div class="info-item info-item--full">
                  <span class="info-item__label">Endereço</span>
                  <span class="info-item__value">{{ patient()!.address }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="detail-card animate-fade-in animate-delay-2">
            <h3 class="detail-card__title">
              <i class="ph-bold ph-phone-call"></i>
              Contato de Emergência
            </h3>
            @if (patient()!.emergency_contact) {
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">Nome</span>
                  <span class="info-item__value">{{ patient()!.emergency_contact }}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">Telefone</span>
                  <span class="info-item__value">{{ patient()!.emergency_phone }}</span>
                </div>
              </div>
            } @else {
              <p class="detail-card__empty">Nenhum contato cadastrado</p>
            }
          </div>

          <!-- Medical Info -->
          <div class="detail-card animate-fade-in animate-delay-3">
            <h3 class="detail-card__title">
              <i class="ph-bold ph-first-aid-kit"></i>
              Informações Médicas
            </h3>
            <div class="medical-section">
              <h4 class="medical-section__title">Alergias</h4>
              @if (patient()!.allergies) {
                <div class="allergy-tags">
                  @for (allergy of patient()!.allergies?.split(','); track allergy) {
                    <span class="allergy-tag">{{ allergy.trim() }}</span>
                  }
                </div>
              } @else {
                <p class="detail-card__empty">Nenhuma alergia registrada</p>
              }
            </div>
            @if (patient()!.medical_notes) {
              <div class="medical-section">
                <h4 class="medical-section__title">Observações Médicas</h4>
                <p class="medical-notes">{{ patient()!.medical_notes }}</p>
              </div>
            }
          </div>

          <!-- Latest Vitals -->
          <div class="detail-card detail-card--vitals animate-fade-in animate-delay-4">
            <h3 class="detail-card__title">
              <i class="ph-bold ph-heartbeat"></i>
              Últimos Sinais Vitais
            </h3>

            @if (patient()!.latest_vitals) {
              <div class="vitals-grid">
                @if (patient()!.latest_vitals!.heart_rate) {
                  <div class="vital-item vital-item--heart">
                    <i class="ph-fill ph-heart animate-heartbeat"></i>
                    <span class="vital-item__value">{{ patient()!.latest_vitals!.heart_rate }}</span>
                    <span class="vital-item__unit">bpm</span>
                    <span class="vital-item__label">Freq. Cardíaca</span>
                  </div>
                }
                @if (patient()!.latest_vitals!.systolic_pressure) {
                  <div class="vital-item vital-item--pressure">
                    <i class="ph-fill ph-activity"></i>
                    <span class="vital-item__value">
                      {{ patient()!.latest_vitals!.systolic_pressure }}/{{ patient()!.latest_vitals!.diastolic_pressure }}
                    </span>
                    <span class="vital-item__unit">mmHg</span>
                    <span class="vital-item__label">Pressão Arterial</span>
                  </div>
                }
                @if (patient()!.latest_vitals!.temperature) {
                  <div class="vital-item vital-item--temp">
                    <i class="ph-fill ph-thermometer"></i>
                    <span class="vital-item__value">{{ patient()!.latest_vitals!.temperature }}</span>
                    <span class="vital-item__unit">°C</span>
                    <span class="vital-item__label">Temperatura</span>
                  </div>
                }
                @if (patient()!.latest_vitals!.oxygen_saturation) {
                  <div class="vital-item vital-item--oxygen">
                    <i class="ph-fill ph-wind"></i>
                    <span class="vital-item__value">{{ patient()!.latest_vitals!.oxygen_saturation }}</span>
                    <span class="vital-item__unit">%</span>
                    <span class="vital-item__label">SpO2</span>
                  </div>
                }
              </div>
              <p class="vitals-timestamp">
                Registrado em {{ formatDateTime(patient()!.latest_vitals!.recorded_at) }}
              </p>
            } @else {
              <p class="detail-card__empty">Nenhum registro de sinais vitais</p>
            }
          </div>

          <!-- Charts -->
          @if (chartData()) {
            <div class="detail-card detail-card--chart animate-fade-in animate-delay-5">
              <h3 class="detail-card__title">
                <i class="ph-bold ph-chart-line-up"></i>
                Evolução - Frequência Cardíaca
              </h3>
              <div class="chart-container">
                <ngx-charts-line-chart
                  [view]="chartView"
                  [results]="heartRateChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [animations]="true"
                  [scheme]="heartRateScheme"
                  [curve]="curve"
                >
                </ngx-charts-line-chart>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Loading State -->
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Carregando dados do paciente...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .patient-detail {
      max-width: 1200px;
      margin: 0 auto;
    }

    // ===== HEADER =====
    .detail-header {
      background: #FFFFFF;
      border-radius: var(--radius-xl);
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
      box-shadow: var(--shadow-md);
    }

    .detail-header__back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--vita-neutral-500);
      font-size: 0.9rem;
      margin-bottom: var(--space-lg);
      transition: color var(--transition-fast);

      &:hover {
        color: var(--vita-primary-500);
      }
    }

    .detail-header__main {
      display: flex;
      align-items: center;
      gap: var(--space-xl);
      margin-bottom: var(--space-lg);
    }

    .detail-header__avatar {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 700;
      color: #FFFFFF;
      flex-shrink: 0;
    }

    .detail-header__info {
      flex: 1;
    }

    .detail-header__name {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
      margin-bottom: var(--space-sm);
    }

    .detail-header__meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-lg);
      color: var(--vita-neutral-500);
      font-size: 0.9rem;

      span {
        display: flex;
        align-items: center;
        gap: var(--space-xs);

        i {
          color: var(--vita-neutral-400);
        }
      }
    }

    .detail-header__actions {
      display: flex;
      gap: var(--space-md);
    }

    // ===== GRID =====
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-lg);
    }

    .detail-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);

      &--vitals {
        grid-column: 1 / -1;
      }

      &--chart {
        grid-column: 1 / -1;
      }
    }

    .detail-card__title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--vita-neutral-800);
      margin-bottom: var(--space-lg);
      padding-bottom: var(--space-md);
      border-bottom: 1px solid var(--vita-neutral-100);

      i {
        color: var(--vita-primary-500);
        font-size: 1.25rem;
      }
    }

    .detail-card__empty {
      color: var(--vita-neutral-400);
      font-style: italic;
      font-size: 0.9rem;
    }

    // ===== INFO GRID =====
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      &--full {
        grid-column: 1 / -1;
      }
    }

    .info-item__label {
      font-size: 0.75rem;
      color: var(--vita-neutral-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-item__value {
      font-size: 0.95rem;
      color: var(--vita-neutral-800);
      font-weight: 500;

      &--blood {
        display: inline-flex;
        align-items: center;
        gap: var(--space-xs);
        color: var(--vita-heart);

        i {
          font-size: 1rem;
        }
      }
    }

    // ===== MEDICAL SECTION =====
    .medical-section {
      margin-bottom: var(--space-lg);

      &:last-child {
        margin-bottom: 0;
      }
    }

    .medical-section__title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--vita-neutral-700);
      margin-bottom: var(--space-sm);
    }

    .allergy-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }

    .allergy-tag {
      padding: var(--space-xs) var(--space-md);
      background: var(--vita-warning-light);
      color: var(--vita-warning);
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .medical-notes {
      font-size: 0.9rem;
      color: var(--vita-neutral-600);
      line-height: 1.6;
      padding: var(--space-md);
      background: var(--vita-neutral-50);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--vita-primary-400);
    }

    // ===== VITALS =====
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);
    }

    .vital-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-lg);
      background: var(--vita-neutral-50);
      border-radius: var(--radius-lg);
      text-align: center;

      i {
        font-size: 2rem;
        margin-bottom: var(--space-sm);
      }

      &--heart {
        background: rgba(244, 63, 94, 0.1);
        i { color: var(--vita-heart); }
      }

      &--pressure {
        background: rgba(139, 92, 246, 0.1);
        i { color: var(--vita-pressure); }
      }

      &--temp {
        background: rgba(249, 115, 22, 0.1);
        i { color: var(--vita-temperature); }
      }

      &--oxygen {
        background: rgba(6, 182, 212, 0.1);
        i { color: var(--vita-oxygen); }
      }
    }

    .vital-item__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--vita-neutral-900);
    }

    .vital-item__unit {
      font-size: 0.75rem;
      color: var(--vita-neutral-500);
      margin-bottom: var(--space-xs);
    }

    .vital-item__label {
      font-size: 0.75rem;
      color: var(--vita-neutral-500);
    }

    .vitals-timestamp {
      text-align: center;
      font-size: 0.8rem;
      color: var(--vita-neutral-400);
    }

    // ===== CHART =====
    .chart-container {
      height: 200px;
    }

    // ===== LOADING =====
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--vita-neutral-200);
      border-top-color: var(--vita-primary-500);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--space-lg);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    // ===== RESPONSIVE =====
    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .vitals-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-header__main {
        flex-direction: column;
        text-align: center;
      }

      .detail-header__meta {
        justify-content: center;
      }

      .detail-header__actions {
        justify-content: center;
      }
    }
  `],
})
export class PatientDetailComponent implements OnInit {
  readonly id = input.required<string>();

  readonly patient = this.patientService.selectedPatient;
  readonly chartData = this.vitalsService.chartData;
  readonly avatarGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  readonly chartView: [number, number] = [500, 200];

  readonly curve = (x: any) => x; // curveMonotoneX - simplified

  readonly heartRateScheme: any = {
    name: 'heartRate',
    selectable: true,
    group: 'Ordinal',
    domain: ['#F43F5E'],
  };

  get heartRateChartData() {
    const data = this.chartData();
    if (!data) return [];

    return [
      {
        name: 'Frequência Cardíaca',
        series: data.heart_rate.map((d) => ({
          name: d.name,
          value: d.value,
        })),
      },
    ];
  }

  constructor(
    private readonly patientService: PatientService,
    private readonly vitalsService: VitalsService
  ) {}

  ngOnInit(): void {
    const patientId = parseInt(this.id(), 10);

    this.patientService.getPatient(patientId).subscribe();
    this.vitalsService.getPatientVitalChartData(patientId, 30).subscribe();
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('pt-BR');
  }
}
