import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import type { Track } from '../../media-player/models/track.model';
import { AudioPlayerService } from '../../media-player/services/audio-player.service';
import { TranslationService } from './translation.service';

export interface TrackMenuTarget {
  track: Track;
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class TrackMenuService implements OnDestroy {
  private readonly player = inject(AudioPlayerService);
  private readonly i18n = inject(TranslationService);

  /** Popover abierto (con posición) o null si está cerrado. */
  readonly menu = signal<TrackMenuTarget | null>(null);
  /** Track seleccionado para el modal (sobrevive al cierre del popover). */
  readonly selectedTrack = signal<Track | null>(null);
  /** Modal "Añadir a playlist" abierto o no. */
  readonly assignOpen = signal(false);
  /** Toast de confirmación (se auto-limpia). */
  readonly toast = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  openMenu(track: Track, event: MouseEvent): void {
    event.stopPropagation();
    const margin = 8;
    const w = 224;
    const h = 190;
    // Flip en bordes: si no cabe abajo/derecha, abre arriba/izquierda del cursor.
    let x = event.clientX;
    let y = event.clientY;
    try {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (x + w > vw - margin) x = Math.max(margin, x - w);
      else x = Math.max(margin, Math.min(x, vw - w - margin));
      if (y + h > vh - margin) y = Math.max(margin, y - h);
      else y = Math.max(margin, Math.min(y, vh - h - margin));
    } catch {
      x = Math.max(margin, x);
      y = Math.max(margin, y);
    }
    this.menu.set({ track, x, y });
  }

  closeMenu(): void {
    this.menu.set(null);
  }

  openAssign(): void {
    this.selectedTrack.set(this.menu()?.track ?? null);
    this.menu.set(null);
    this.assignOpen.set(true);
  }

  closeAssign(): void {
    this.assignOpen.set(false);
    this.selectedTrack.set(null);
  }

  queueTrack(track: Track): void {
    this.player.queueNext(track);
    this.menu.set(null);
    this.showToast(this.i18n.translate('trackMenu.queued', { title: track.title }));
  }

  async shareTrack(track: Track): Promise<void> {
    this.menu.set(null);
    const text = `${track.title} — ${track.artist}`;
    try {
      const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
      if (typeof nav.share === 'function') {
        await nav.share({ title: track.title, text });
        this.showToast(this.i18n.translate('trackMenu.shared'));
        return;
      }
      throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        this.showToast(this.i18n.translate('trackMenu.copied'));
      } catch {
        this.showToast(this.i18n.translate('trackMenu.shareFailed'));
      }
    }
  }

  showToast(message: string, ms = 2500): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), ms);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
