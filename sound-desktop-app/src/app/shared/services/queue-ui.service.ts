import { Injectable, signal } from '@angular/core';

export type QueueTab = 'queue' | 'history';

/** Duración de la animación del drawer (debe coincidir con `duration-300` del template). */
const ANIMATION_MS = 300;

@Injectable({ providedIn: 'root' })
export class QueueUiService {
  /** Montado en el DOM (@if del template). */
  readonly drawerOpen = signal(false);
  /** Estado visible de la animación (translate/opacity). */
  readonly drawerVisible = signal(false);
  readonly activeTab = signal<QueueTab>('queue');

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId = 0;

  toggleDrawer(): void {
    if (this.drawerOpen()) this.closeDrawer();
    else this.openDrawer();
  }

  openDrawer(tab: QueueTab = 'queue'): void {
    this.clearTimer();
    this.activeTab.set(tab);
    if (!this.drawerOpen()) this.drawerOpen.set(true);
    // Parte cerrado y en el siguiente frame anima a abierto (transición CSS).
    this.drawerVisible.set(false);
    try {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.drawerVisible.set(true));
    } catch {
      this.drawerVisible.set(true);
    }
  }

  closeDrawer(): void {
    this.clearTimer();
    try {
      cancelAnimationFrame(this.rafId);
    } catch {
      // Sin rAF: se continúa igual
    }
    // Anima a cerrado y desmonta al terminar la transición.
    this.drawerVisible.set(false);
    this.closeTimer = setTimeout(() => this.drawerOpen.set(false), ANIMATION_MS);
  }

  setTab(tab: QueueTab): void {
    this.activeTab.set(tab);
  }

  private clearTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
