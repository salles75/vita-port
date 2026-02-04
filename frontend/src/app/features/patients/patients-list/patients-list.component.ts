/**
 * Vita - Patients List Component
 * Lista de pacientes com busca e paginação.
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PatientService } from '@core/services/patient.service';
import { Patient } from '@core/models';
import { PatientDialogComponent, PatientDialogData } from '@shared/components/patient-dialog/patient-dialog.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="patients-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">Pacientes</h1>
          <span class="page-header__count">{{ totalPatients() }} cadastrados</span>
        </div>
        <button mat-flat-button color="primary" (click)="openNewPatientDialog()">
          <i class="ph-bold ph-user-plus"></i>
          Novo Paciente
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <div class="search-bar__input">
          <i class="ph-bold ph-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        <div class="search-bar__filters">
          <button
            class="filter-btn"
            [class.filter-btn--active]="activeFilter() === 'all'"
            (click)="setFilter('all')"
          >
            Todos
          </button>
          <button
            class="filter-btn"
            [class.filter-btn--active]="activeFilter() === 'active'"
            (click)="setFilter('active')"
          >
            Ativos
          </button>
          <button
            class="filter-btn"
            [class.filter-btn--active]="activeFilter() === 'inactive'"
            (click)="setFilter('inactive')"
          >
            Inativos
          </button>
        </div>
      </div>

      <!-- Patients Grid -->
      <div class="patients-grid">
        @if (isLoading()) {
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="patient-card patient-card--skeleton">
              <div class="skeleton skeleton--avatar"></div>
              <div class="skeleton skeleton--text"></div>
              <div class="skeleton skeleton--text skeleton--short"></div>
            </div>
          }
        } @else if (patients().length === 0) {
          <div class="empty-state">
            <i class="ph-duotone ph-users"></i>
            <h3>Nenhum paciente encontrado</h3>
            <p>Comece cadastrando seu primeiro paciente</p>
            <button mat-flat-button color="primary" (click)="openNewPatientDialog()">
              <i class="ph-bold ph-plus"></i>
              Cadastrar Paciente
            </button>
          </div>
        } @else {
          @for (patient of patients(); track patient.id; let i = $index) {
            <a
              [routerLink]="['/patients', patient.id]"
              class="patient-card animate-fade-in"
              [style.animation-delay]="(i * 0.05) + 's'"
            >
              <div class="patient-card__header">
                <div class="patient-card__avatar" [style.background]="getAvatarColor(patient.id)">
                  {{ getInitials(patient.full_name) }}
                </div>
                <span
                  class="patient-card__status"
                  [class.patient-card__status--active]="patient.is_active"
                >
                  {{ patient.is_active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <div class="patient-card__content">
                <h3 class="patient-card__name">{{ patient.full_name }}</h3>
                <p class="patient-card__info">
                  <i class="ph-bold ph-identification-card"></i>
                  {{ patient.cpf }}
                </p>
                <p class="patient-card__info">
                  <i class="ph-bold ph-phone"></i>
                  {{ patient.phone }}
                </p>
                @if (patient.blood_type) {
                  <p class="patient-card__blood">
                    <i class="ph-fill ph-drop"></i>
                    {{ patient.blood_type }}
                  </p>
                }
              </div>

              <div class="patient-card__footer">
                <span class="patient-card__age">
                  <i class="ph-bold ph-calendar"></i>
                  {{ calculateAge(patient.birth_date) }} anos
                </span>
                <i class="ph-bold ph-caret-right patient-card__arrow"></i>
              </div>
            </a>
          }
        }
      </div>

      <!-- Paginator -->
      @if (!isLoading() && patients().length > 0) {
        <mat-paginator
          [length]="totalPatients()"
          [pageSize]="pageSize"
          [pageIndex]="currentPage() - 1"
          [pageSizeOptions]="[12, 24, 48]"
          (page)="onPageChange($event)"
          aria-label="Selecione a página"
        >
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .patients-page {
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

    // ===== SEARCH BAR =====
    .search-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
      padding: var(--space-md);
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .search-bar__input {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-sm) var(--space-md);
      background: var(--vita-neutral-100);
      border-radius: var(--radius-md);

      i {
        color: var(--vita-neutral-400);
        font-size: 1.25rem;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.95rem;
        font-family: var(--font-primary);
        color: var(--vita-neutral-800);

        &::placeholder {
          color: var(--vita-neutral-400);
        }

        &:focus {
          outline: none;
        }
      }
    }

    .search-bar__filters {
      display: flex;
      gap: var(--space-xs);
    }

    .filter-btn {
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

    // ===== PATIENTS GRID =====
    .patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .patient-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      transition: all var(--transition-base);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);

      &:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);
      }
    }

    .patient-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .patient-card__avatar {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .patient-card__status {
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--vita-neutral-200);
      color: var(--vita-neutral-600);

      &--active {
        background: var(--vita-success-light);
        color: var(--vita-success);
      }
    }

    .patient-card__content {
      flex: 1;
    }

    .patient-card__name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--vita-neutral-900);
      margin-bottom: var(--space-sm);
    }

    .patient-card__info {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 0.85rem;
      color: var(--vita-neutral-500);
      margin-bottom: var(--space-xs);

      i {
        color: var(--vita-neutral-400);
        font-size: 1rem;
      }
    }

    .patient-card__blood {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-sm);
      background: var(--vita-error-light);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--vita-heart);
      margin-top: var(--space-sm);

      i {
        font-size: 0.875rem;
      }
    }

    .patient-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: var(--space-md);
      border-top: 1px solid var(--vita-neutral-100);
    }

    .patient-card__age {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: 0.8rem;
      color: var(--vita-neutral-500);

      i {
        color: var(--vita-neutral-400);
      }
    }

    .patient-card__arrow {
      color: var(--vita-neutral-300);
      transition: all var(--transition-fast);

      .patient-card:hover & {
        color: var(--vita-primary-500);
        transform: translateX(4px);
      }
    }

    // ===== SKELETON =====
    .patient-card--skeleton {
      pointer-events: none;
    }

    .skeleton {
      background: linear-gradient(90deg, var(--vita-neutral-200) 25%, var(--vita-neutral-100) 50%, var(--vita-neutral-200) 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: var(--radius-sm);

      &--avatar {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-lg);
      }

      &--text {
        height: 16px;
        margin-bottom: var(--space-sm);
      }

      &--short {
        width: 60%;
      }
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    // ===== EMPTY STATE =====
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
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
        margin-bottom: var(--space-xl);
      }
    }

    // ===== PAGINATOR =====
    mat-paginator {
      background: transparent;
      font-family: var(--font-primary);
    }
  `],
})
export class PatientsListComponent implements OnInit {
  readonly patients = this.patientService.patients;
  readonly totalPatients = this.patientService.totalPatients;
  readonly isLoading = this.patientService.isLoading;

  readonly currentPage = signal(1);
  readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly pageSize = 12;

  searchQuery = '';
  private searchSubject = new Subject<string>();

  private avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  constructor(
    private readonly patientService: PatientService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {
    this.searchSubject.pipe(debounceTime(400)).subscribe((query) => {
      this.loadPatients();
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    const isActive =
      this.activeFilter() === 'all'
        ? undefined
        : this.activeFilter() === 'active';

    this.patientService
      .getPatients({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchQuery || undefined,
        isActive,
      })
      .subscribe();
  }

  onSearchChange(query: string): void {
    this.currentPage.set(1);
    this.searchSubject.next(query);
  }

  setFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.loadPatients();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.loadPatients();
  }

  openNewPatientDialog(): void {
    const dialogRef = this.dialog.open(PatientDialogComponent, {
      data: { mode: 'create' } as PatientDialogData,
      panelClass: 'vita-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPatients();
      }
    });
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(id: number): string {
    return this.avatarColors[id % this.avatarColors.length];
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
}
