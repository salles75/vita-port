/**
 * Vita - Notifications Panel Component
 * Painel de notificações dropdown.
 */

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Notification {
  id: number;
  type: 'alert' | 'appointment' | 'info' | 'success';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  link?: string;
}

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notifications-panel" [class.notifications-panel--open]="isOpen">
      <div class="notifications-header">
        <h3 class="notifications-title">
          <i class="ph-bold ph-bell"></i>
          Notificações
        </h3>
        @if (unreadCount() > 0) {
          <button class="mark-all-btn" (click)="markAllAsRead()">
            Marcar todas como lidas
          </button>
        }
      </div>

      <div class="notifications-list">
        @if (notifications.length === 0) {
          <div class="notifications-empty">
            <i class="ph-duotone ph-bell-slash"></i>
            <p>Nenhuma notificação</p>
          </div>
        } @else {
          @for (notification of notifications; track notification.id) {
            <div
              class="notification-item"
              [class.notification-item--unread]="!notification.read"
              [class]="'notification-item--' + notification.type"
              (click)="onNotificationClick(notification)"
            >
              <div class="notification-icon">
                @switch (notification.type) {
                  @case ('alert') {
                    <i class="ph-fill ph-warning-circle"></i>
                  }
                  @case ('appointment') {
                    <i class="ph-fill ph-calendar-check"></i>
                  }
                  @case ('success') {
                    <i class="ph-fill ph-check-circle"></i>
                  }
                  @default {
                    <i class="ph-fill ph-info"></i>
                  }
                }
              </div>
              <div class="notification-content">
                <span class="notification-title">{{ notification.title }}</span>
                <span class="notification-message">{{ notification.message }}</span>
                <span class="notification-time">{{ formatTime(notification.time) }}</span>
              </div>
              @if (!notification.read) {
                <span class="notification-dot"></span>
              }
            </div>
          }
        }
      </div>

      <div class="notifications-footer">
        <a routerLink="/notifications" class="view-all-link" (click)="close.emit()">
          Ver todas as notificações
        </a>
      </div>
    </div>
  `,
  styles: [`
    .notifications-panel {
      position: absolute;
      top: calc(100% + var(--space-sm));
      right: 0;
      width: 380px;
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--vita-neutral-200);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all var(--transition-base);
      z-index: var(--z-dropdown);
      overflow: hidden;

      &--open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }

    .notifications-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--vita-neutral-100);
    }

    .notifications-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--vita-neutral-900);
      margin: 0;

      i {
        color: var(--vita-primary-500);
      }
    }

    .mark-all-btn {
      background: transparent;
      border: none;
      font-family: var(--font-primary);
      font-size: 0.75rem;
      color: var(--vita-primary-500);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notifications-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-2xl);
      color: var(--vita-neutral-400);

      i {
        font-size: 3rem;
        margin-bottom: var(--space-md);
      }

      p {
        font-size: 0.9rem;
      }
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      cursor: pointer;
      transition: background var(--transition-fast);
      position: relative;

      &:hover {
        background: var(--vita-neutral-50);
      }

      &--unread {
        background: var(--vita-primary-50);

        &:hover {
          background: var(--vita-primary-100);
        }
      }
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
      }

      .notification-item--alert & {
        background: var(--vita-error-light);
        i { color: var(--vita-error); }
      }

      .notification-item--appointment & {
        background: var(--vita-info-light);
        i { color: var(--vita-info); }
      }

      .notification-item--success & {
        background: var(--vita-success-light);
        i { color: var(--vita-success); }
      }

      .notification-item--info & {
        background: var(--vita-neutral-100);
        i { color: var(--vita-neutral-500); }
      }
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .notification-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--vita-neutral-900);
      margin-bottom: 2px;
    }

    .notification-message {
      font-size: 0.8rem;
      color: var(--vita-neutral-600);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      font-size: 0.7rem;
      color: var(--vita-neutral-400);
      margin-top: var(--space-xs);
    }

    .notification-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--vita-primary-500);
      flex-shrink: 0;
      margin-top: 4px;
    }

    .notifications-footer {
      padding: var(--space-md);
      border-top: 1px solid var(--vita-neutral-100);
      text-align: center;
    }

    .view-all-link {
      font-size: 0.85rem;
      color: var(--vita-primary-500);
      font-weight: 500;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  `],
})
export class NotificationsPanelComponent {
  @Input() isOpen = false;
  @Input() notifications: Notification[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() markAllRead = new EventEmitter<void>();

  unreadCount = signal(0);

  ngOnChanges(): void {
    this.unreadCount.set(this.notifications.filter(n => !n.read).length);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }

  onNotificationClick(notification: Notification): void {
    this.notificationClick.emit(notification);
  }

  markAllAsRead(): void {
    this.markAllRead.emit();
  }
}
