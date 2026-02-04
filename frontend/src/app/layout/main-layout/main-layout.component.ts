/**
 * Vita - Main Layout Component
 * Layout principal da aplicação com sidebar e header.
 */

import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { NotificationsPanelComponent, Notification } from '@shared/components/notifications-panel/notifications-panel.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationsPanelComponent],
  template: `
    <div class="layout" [class.layout--collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar__header">
          <div class="sidebar__logo">
            <span class="sidebar__logo-icon">🩺</span>
            <span class="sidebar__logo-text" *ngIf="!sidebarCollapsed()">Vita</span>
          </div>
          <button
            class="sidebar__toggle"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarCollapsed() ? 'Expandir menu' : 'Recolher menu'"
          >
            <i class="ph-bold" [class.ph-caret-left]="!sidebarCollapsed()" [class.ph-caret-right]="sidebarCollapsed()"></i>
          </button>
        </div>

        <nav class="sidebar__nav">
          @for (item of navItems; track item.route) {
            <a
              class="sidebar__link"
              [routerLink]="item.route"
              routerLinkActive="sidebar__link--active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            >
              <i class="ph-bold" [class]="item.icon"></i>
              <span class="sidebar__link-text" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar__footer">
          <div class="sidebar__user" *ngIf="!sidebarCollapsed()">
            <div class="sidebar__user-avatar">
              {{ authService.userInitials() }}
            </div>
            <div class="sidebar__user-info">
              <span class="sidebar__user-name">{{ authService.user()?.full_name }}</span>
              <span class="sidebar__user-role">{{ authService.user()?.specialty || 'Médico' }}</span>
            </div>
          </div>
          <button class="sidebar__logout" (click)="logout()" title="Sair">
            <i class="ph-bold ph-sign-out"></i>
            <span *ngIf="!sidebarCollapsed()">Sair</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main">
        <header class="header">
          <div class="header__left">
            <h1 class="header__title">{{ getPageTitle() }}</h1>
          </div>
          <div class="header__right">
            <div class="header__notification-wrapper">
              <button class="header__notification" title="Notificações" (click)="toggleNotifications()">
                <i class="ph-bold ph-bell"></i>
                @if (unreadNotifications() > 0) {
                  <span class="header__notification-badge">{{ unreadNotifications() }}</span>
                }
              </button>
              <app-notifications-panel
                [isOpen]="notificationsPanelOpen()"
                [notifications]="notifications()"
                (close)="closeNotifications()"
                (notificationClick)="onNotificationClick($event)"
                (markAllRead)="markAllNotificationsRead()"
              />
            </div>
            <div class="header__user">
              <div class="header__user-avatar">
                {{ authService.userInitials() }}
              </div>
            </div>
          </div>
        </header>

        <div class="content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--vita-neutral-100);
    }

    // ===== SIDEBAR =====
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, var(--vita-primary-600) 0%, var(--vita-primary-700) 100%);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-base);
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: var(--z-fixed);

      .layout--collapsed & {
        width: 80px;
      }
    }

    .sidebar__header {
      padding: var(--space-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .sidebar__logo-icon {
      font-size: 32px;
      line-height: 1;
    }

    .sidebar__logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 2px;
    }

    .sidebar__toggle {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);
      color: #FFFFFF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .layout--collapsed & {
        display: none;
      }
    }

    .sidebar__nav {
      flex: 1;
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      overflow-y: auto;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-weight: 500;
      transition: all var(--transition-fast);

      i {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
      }

      &--active {
        background: var(--vita-accent-500);
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(255, 122, 92, 0.3);
      }

      .layout--collapsed & {
        justify-content: center;
        padding: var(--space-md);
      }
    }

    .sidebar__link-text {
      white-space: nowrap;
    }

    .sidebar__footer {
      padding: var(--space-md);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar__user {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      margin-bottom: var(--space-md);
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
    }

    .sidebar__user-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--vita-accent-500);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .sidebar__user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar__user-name {
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar__user-role {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
    }

    .sidebar__logout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      width: 100%;
      padding: var(--space-md);
      border: none;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      font-family: var(--font-primary);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #FFFFFF;
      }

      i {
        font-size: 1.25rem;
      }
    }

    // ===== MAIN CONTENT =====
    .main {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
      transition: margin-left var(--transition-base);

      .layout--collapsed & {
        margin-left: 80px;
      }
    }

    .header {
      height: 72px;
      padding: 0 var(--space-xl);
      background: #FFFFFF;
      border-bottom: 1px solid var(--vita-neutral-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    .header__title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--vita-neutral-900);
    }

    .header__right {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .header__notification-wrapper {
      position: relative;
    }

    .header__notification {
      position: relative;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: var(--radius-md);
      background: var(--vita-neutral-100);
      color: var(--vita-neutral-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      i {
        font-size: 1.25rem;
      }

      &:hover {
        background: var(--vita-neutral-200);
        color: var(--vita-neutral-800);
      }
    }

    .header__notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: var(--radius-full);
      background: var(--vita-error);
      color: #FFFFFF;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header__user {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;
    }

    .header__user-avatar {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--vita-primary-500) 0%, var(--vita-primary-600) 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .content {
      flex: 1;
      padding: var(--space-xl);
      animation: fadeIn 0.3s ease;
    }
  `],
})
export class MainLayoutComponent {
  readonly sidebarCollapsed = signal(false);
  readonly notificationsPanelOpen = signal(false);
  
  readonly notifications = signal<Notification[]>([
    {
      id: 1,
      type: 'alert',
      title: 'Alerta de Sinais Vitais',
      message: 'Paciente Maria Santos apresentou frequência cardíaca elevada (125 bpm)',
      time: new Date(Date.now() - 5 * 60000),
      read: false,
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Consulta em 30 minutos',
      message: 'João Silva - Retorno cardiológico às 14:30',
      time: new Date(Date.now() - 25 * 60000),
      read: false,
    },
    {
      id: 3,
      type: 'success',
      title: 'Consulta Finalizada',
      message: 'A consulta com Ana Paula foi concluída com sucesso',
      time: new Date(Date.now() - 2 * 3600000),
      read: true,
    },
    {
      id: 4,
      type: 'info',
      title: 'Novo paciente cadastrado',
      message: 'Carlos Eduardo foi adicionado à sua lista de pacientes',
      time: new Date(Date.now() - 24 * 3600000),
      read: true,
    },
  ]);

  readonly unreadNotifications = signal(2);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'ph-house' },
    { label: 'Pacientes', route: '/patients', icon: 'ph-users' },
    { label: 'Consultas', route: '/appointments', icon: 'ph-calendar-check' },
    { label: 'Sinais Vitais', route: '/vitals', icon: 'ph-heartbeat' },
  ];

  constructor(public readonly authService: AuthService) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isNotificationArea = target.closest('.header__notification-wrapper');
    if (!isNotificationArea && this.notificationsPanelOpen()) {
      this.closeNotifications();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleNotifications(): void {
    this.notificationsPanelOpen.update((v) => !v);
  }

  closeNotifications(): void {
    this.notificationsPanelOpen.set(false);
  }

  onNotificationClick(notification: Notification): void {
    // Marca como lida
    this.notifications.update((list) =>
      list.map((n) => n.id === notification.id ? { ...n, read: true } : n)
    );
    this.updateUnreadCount();
    this.closeNotifications();
  }

  markAllNotificationsRead(): void {
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, read: true }))
    );
    this.unreadNotifications.set(0);
  }

  private updateUnreadCount(): void {
    const count = this.notifications().filter(n => !n.read).length;
    this.unreadNotifications.set(count);
  }

  logout(): void {
    this.authService.logout();
  }

  getPageTitle(): string {
    const path = window.location.pathname;

    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('patients')) return 'Pacientes';
    if (path.includes('appointments')) return 'Consultas';
    if (path.includes('vitals')) return 'Sinais Vitais';

    return 'Vita';
  }
}
