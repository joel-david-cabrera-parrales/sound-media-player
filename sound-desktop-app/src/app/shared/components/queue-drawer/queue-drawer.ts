import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';
import { LocalMusicService } from '../../../media-player/services/local-music.service';
import { QueueUiService, type QueueTab } from '../../services/queue-ui.service';
import { TrackMenuService } from '../../services/track-menu.service';
import {
  formatTrackDuration,
  type Track,
} from '../../../media-player/models/track.model';
import { trackCoverCached } from '../../utils/cover-cache';

/**
 * Escala z documentada: dock 40 < drawer overlay 65 / panel 70 <
 * modales (playlist-form y add-to-playlist) 75 < context-menu 80 / toast 80-85.
 * Los modales quedan por encima del drawer para no quedar bloqueados.
 */
@Component({
  selector: 'shared-queue-drawer',
  imports: [TranslatePipe],
  templateUrl: './queue-drawer.html',
  styleUrl: './queue-drawer.css',
})
export class QueueDrawer {
  private readonly player = inject(AudioPlayerService);
  private readonly library = inject(LocalMusicService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly menu = inject(TrackMenuService);
  protected readonly ui = inject(QueueUiService);

  protected readonly currentTrack = this.player.currentTrack;
  protected readonly isPlaying = this.player.isPlaying;
  protected readonly contextLabel = this.player.contextLabel;

  /** Cola manual; si está vacía se muestra lo que sigue del contexto de página. */
  protected readonly isManual = computed(() => this.player.upNext().length > 0);

  /** Resuelve una lista contra la librería (filtra eliminados, devuelve frescos). */
  private resolveAgainstLibrary(list: Track[]): Track[] {
    const all = this.library.tracks();
    if (all.length === 0) return [];
    const byId = new Map(all.map((t) => [t.id, t]));
    return list.map((t) => byId.get(t.id)).filter((t): t is Track => !!t);
  }

  protected readonly upcoming = computed<Track[]>(() => {
    const ctx = this.resolveAgainstLibrary(this.player.contextQueue());
    const cur = this.player.currentTrack();
    if (!cur) return ctx;
    const idx = ctx.findIndex((t) => t.id === cur.id);
    return idx < 0 ? ctx : ctx.slice(idx + 1);
  });

  protected readonly queueItems = computed<Track[]>(() => {
    const manual = this.resolveAgainstLibrary(this.player.upNext());
    return manual.length > 0 ? manual : this.upcoming();
  });

  /** Badge (N) coherente con lo mostrado en la pestaña de cola. */
  protected readonly queueCount = computed(() => this.queueItems().length);

  protected readonly historyTracks = computed<Track[]>(() =>
    this.resolveAgainstLibrary(this.player.history()),
  );

  private readonly dragIndex = signal<number | null>(null);
  private lastFocused: Element | null = null;

  @ViewChild('drawerPanel') private drawerPanel?: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;

  constructor() {
    // Foco inicial al abrir y retorno al cerrar (sin trap complejo).
    effect(() => {
      if (this.ui.drawerOpen()) {
        try {
          this.lastFocused = document.activeElement;
        } catch {
          this.lastFocused = null;
        }
        // Espera al montaje del @if antes de enfocar.
        window.setTimeout(() => {
          try {
            (this.closeBtn?.nativeElement ?? this.drawerPanel?.nativeElement)?.focus();
          } catch {
            // foco no disponible: se ignora
          }
        }, 0);
      } else if (this.lastFocused instanceof HTMLElement) {
        try {
          this.lastFocused.focus();
        } catch {
          // foco no disponible: se ignora
        }
        this.lastFocused = null;
      }
    });
  }

  protected close(): void {
    this.ui.closeDrawer();
  }

  protected setTab(tab: QueueTab): void {
    this.ui.setTab(tab);
  }

  protected togglePlay(): void {
    this.player.toggle();
  }

  protected playItem(track: Track, index: number): void {
    if (this.isManual()) this.player.playQueuedAt(index);
    else this.player.play(track);
  }

  protected playHistoryTrack(track: Track): void {
    this.player.play(track);
  }

  protected removeItem(trackId: string, event: Event): void {
    event.stopPropagation();
    this.player.removeFromQueue(trackId);
  }

  protected clearQueue(): void {
    this.player.clearQueue();
  }

  protected clearHistory(): void {
    this.player.clearHistory();
  }

  protected onDragStart(index: number, event: DragEvent): void {
    if (!this.isManual()) {
      event.preventDefault();
      return;
    }
    this.dragIndex.set(index);
    try {
      event.dataTransfer?.setData('text/plain', String(index));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    } catch {
      // DnD no disponible: se ignora
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (this.dragIndex() == null) return;
    event.preventDefault();
  }

  protected onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragIndex();
    this.dragIndex.set(null);
    if (from == null || from === index) return;
    this.player.moveInQueue(from, index);
  }

  protected onDragEnd(): void {
    this.dragIndex.set(null);
  }

  protected isDragging(index: number): boolean {
    return this.dragIndex() === index;
  }

  protected coverFor(track: Track): string | SafeUrl {
    return trackCoverCached(this.sanitizer, track, '/images/track-cover.svg');
  }

  protected onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) img.src = '/images/track-cover.svg';
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    // Guarda: solo si el drawer está abierto y ningún modal está por encima
    // (no robar Escape a add-to-playlist, playlist-form o context-menu).
    if (!this.ui.drawerOpen()) return;
    if (this.menu.menu() || this.menu.assignOpen()) return;
    this.close();
  }
}
