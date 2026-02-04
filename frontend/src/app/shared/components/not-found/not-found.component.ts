/**
 * Vita - Not Found Component
 * Página 404 estilizada.
 */

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="not-found__content">
        <div class="not-found__icon">🔍</div>
        <h1 class="not-found__code">404</h1>
        <h2 class="not-found__title">Página não encontrada</h2>
        <p class="not-found__message">
          A página que você está procurando não existe ou foi movida.
        </p>
        <a routerLink="/dashboard" class="not-found__button">
          <i class="ph-bold ph-house"></i>
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--vita-primary-600) 0%, var(--vita-primary-700) 100%);
      padding: var(--space-xl);
    }

    .not-found__content {
      text-align: center;
      color: #FFFFFF;
      animation: fadeIn 0.5s ease;
    }

    .not-found__icon {
      font-size: 80px;
      margin-bottom: var(--space-lg);
      animation: bounce 2s ease-in-out infinite;
    }

    .not-found__code {
      font-size: 8rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: var(--space-md);
      background: linear-gradient(135deg, #FFFFFF 0%, var(--vita-accent-400) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .not-found__title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: var(--space-md);
    }

    .not-found__message {
      font-size: 1rem;
      opacity: 0.8;
      margin-bottom: var(--space-xl);
      max-width: 400px;
    }

    .not-found__button {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md) var(--space-xl);
      background: var(--vita-accent-500);
      color: #FFFFFF;
      border-radius: var(--radius-md);
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--vita-accent-600);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 122, 92, 0.3);
      }

      i {
        font-size: 1.25rem;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `],
})
export class NotFoundComponent {}
